const fs = require('fs');
const path = require('path');

const parsedTestsPath = path.join(__dirname, '..', 'parsed_tests.json');
const extractedThresholdsPath = path.join(__dirname, '..', 'extracted_thresholds.json');
const targetDbPath = path.join(__dirname, '..', 'app', 'src', 'data', 'database.js');

if (!fs.existsSync(parsedTestsPath) || !fs.existsSync(extractedThresholdsPath)) {
  console.error('Source JSON files are missing.');
  process.exit(1);
}

const parsedTests = JSON.parse(fs.readFileSync(parsedTestsPath, 'utf-8'));
const extractedThresholds = JSON.parse(fs.readFileSync(extractedThresholdsPath, 'utf-8'));

// Format thresholds to be easily used by a JavaScript function
// Example formula: IF(D10>=56,("Automático"),IF(D10>=46,("Rápido"),...))
// We want to parse this into a sorted array of rules: [{ min: 56, range: "Automático" }, { min: 46, range: "Rápido" }, ...]
function parseFormula(formulaStr) {
  const rules = [];
  if (!formulaStr) return rules;
  
  // Find all matches of D10>=NUMBER and the corresponding Range
  // Standard format: D10>=56,("Automático") or D10<=14,("Fuera Tabla")
  // Let's use a regex to extract conditions
  const regex = /D1[0-9]>=(\d+),\s*\(\"([^\"]+)\"\)/gi;
  let match;
  while ((match = regex.exec(formulaStr)) !== null) {
    rules.push({ min: parseInt(match[1]), range: match[2] });
  }
  
  // Also check for <= match (usually "Fuera de Tabla" or "Fuera Tabla")
  const leRegex = /D1[0-9]<=(\d+),\s*\(\"([^\"]+)\"\)/gi;
  while ((match = leRegex.exec(formulaStr)) !== null) {
    rules.push({ max: parseInt(match[1]), range: match[2] });
  }
  
  // If no >= matched (which shouldn't happen, but just in case)
  // Let's sort rules: >= rules descending by min value
  rules.sort((a, b) => {
    if (a.min !== undefined && b.min !== undefined) return b.min - a.min;
    if (a.min !== undefined) return -1;
    if (b.min !== undefined) return 1;
    return 0;
  });
  
  return rules;
}

const thresholds = {
  sumas_restas: {},
  multiplicacion: {}
};

for (const grade in extractedThresholds.sumas_restas) {
  thresholds.sumas_restas[grade] = parseFormula(extractedThresholds.sumas_restas[grade].formula);
}
for (const grade in extractedThresholds.multiplicacion) {
  thresholds.multiplicacion[grade] = parseFormula(extractedThresholds.multiplicacion[grade].formula);
}

// Ensure default fallback scales for grades that might not be in the files
// Sumas y Restas has 1º to 8º
// Multiplicación has 4º to 8º. Let's make sure 1º to 3º in Multiplicación fall back to 4º or have a basic scale.
// In practice, Multiplicación is only taken from 4º up, but just in case, we will have fallbacks.

const demoStudents = [
  { id: 'est_1', nombre: 'Mateo', apellido: 'González' },
  { id: 'est_2', nombre: 'Sofía', apellido: 'Muñoz' },
  { id: 'est_3', nombre: 'Lucas', apellido: 'Rojas' },
  { id: 'est_4', nombre: 'Valentina', apellido: 'Díaz' },
  { id: 'est_5', nombre: 'Benjamín', apellido: 'Pérez' },
  { id: 'est_6', nombre: 'Florencia', apellido: 'Silva' },
  { id: 'est_7', nombre: 'Martín', apellido: 'Contreras' },
  { id: 'est_8', nombre: 'Isidora', apellido: 'Fuentes' },
  { id: 'est_9', nombre: 'Agustín', apellido: 'Morales' },
  { id: 'est_10', nombre: 'Antonia', apellido: 'Valenzuela' },
  { id: 'est_11', nombre: 'Tomás', apellido: 'Araya' },
  { id: 'est_12', nombre: 'Camila', apellido: 'Sepúlveda' },
  { id: 'est_13', nombre: 'Vicente', apellido: 'Soto' },
  { id: 'est_14', nombre: 'Isabella', apellido: 'Cortéz' },
  { id: 'est_15', nombre: 'Alonso', apellido: 'Reyes' },
  { id: 'est_16', nombre: 'Emilia', apellido: 'Carrasco' },
  { id: 'est_17', nombre: 'Matías', apellido: 'Gómez' },
  { id: 'est_18', nombre: 'Catalina', apellido: 'Herrera' },
  { id: 'est_19', nombre: 'Joaquín', apellido: 'Flores' },
  { id: 'est_20', nombre: 'Amanda', apellido: 'Castro' },
  { id: 'est_21', nombre: 'Maximiliano', apellido: 'Martín' },
  { id: 'est_22', nombre: 'Maite', apellido: 'Muñoz' },
  { id: 'est_23', nombre: 'Cristóbal', apellido: 'Henríquez' },
  { id: 'est_24', nombre: 'Constanza', apellido: 'Vergara' },
  { id: 'est_25', nombre: 'Diego', apellido: 'Gutiérrez' }
];

// Let's generate a history of test results for these students.
// Diagnostic test (Mayo) and first progress test (Septiembre).
// We want to simulate realistic scores where Mateo is "Automático" and maybe Constanza is "Lento", etc.
// Mayo scores should be slightly lower, and Septiembre scores should show nice improvements.
const generateDemoHistory = (gradeKey, testType) => {
  const isMult = testType === 'multiplicacion';
  const scale = thresholds[testType][gradeKey] || thresholds[testType]['4ºA'] || thresholds[testType]['1ºA'];
  
  // Find ranges and correct thresholds
  let maxScore = isMult ? 30 : 30; // 30 is max for diagnostic, or 40 if tablas
  // Wait, the tablas de multiplicar have 40 questions! Let's check max score.
  // The threshold formulas use values up to 58 for automatic.
  // Wait, why do they use 58 if the test has 30 or 40 questions?
  // Ah! "Cálculo Mental correctas/2min" means they do as many as they can in 2 minutes, or maybe the sheet is a general sheet where they can get more?
  // Or maybe there are 60 questions in the real test? Let's check.
  // Oh, wait! The Word files for Multiplicacion and Sumas/Restas have 8 pages, and each page has a list of questions.
  // Let's look at the parser log: "Ejercicios de Cálculo Mental (4º a 8º básico): 30 questions"
  // Yes! The Word files contain 30 questions per test!
  // Wait! If there are 30 questions per test, how can they get a score of 56 or 58?
  // Ah! "correctas/2min" means they do calculations during 2 minutes. Maybe they are given a sheet of 60 questions?
  // Let's look at the Word files again: "Ejercicios Cálculo Mental Multiplicación 4º a 8º básico.docx.txt"
  // Let's see how many pages it had. It had 8 tests, and 30 questions each in the parsed text.
  // If the sheet threshold goes up to 58, maybe the teacher dictates them or they do multiple sheets?
  // Wait, if the max questions in our parsed test is 30 or 40, the score can still go up to 30 or 40.
  // If they get 30, what rango do they get?
  // Let's look at the 4º Básico Multiplicación thresholds:
  // - >=46: Automático
  // - >=41: Muy Rápido
  // - >=36: Rápido
  // - >=31: Mediano
  // - >=26: Lento
  // - >=20: Muy Lento
  // - <=19: Fuera de Tabla
  // If they get 30, it is Lento! So the scale goes up to 60.
  // Our preloaded tests have 30 or 40 questions. We can easily scale their input, or just let them enter scores up to 60 (which represents calculations completed), or let them generate custom tests, or if they take the preloaded test, the score is out of 30 or 40.
  // This is completely fine! We will support any max score (configurable), and the range calculation functions will handle the score directly as entered (correct answers in 2 minutes).
  
  const history = {};
  
  // Mayo scores
  const mayoResults = {};
  // Septiembre scores
  const septResults = {};
  
  demoStudents.forEach((student, index) => {
    // Generate raw score (correct answers in 2 minutes)
    // Mateo is index 0: excellent student, gets 48-58
    // Diego is index 24: average student, gets 25-35
    // Let's give each student a base level from 10 to 58
    let studentBase = 20 + (index % 5) * 8 + Math.floor(Math.random() * 8);
    if (index === 0) studentBase = 55; // Mateo
    if (index === 1) studentBase = 49; // Sofia
    if (index === 4) studentBase = 12; // Benjamin (struggles)
    
    // Mayo is lower
    const mayoScore = Math.max(0, studentBase - 8 - Math.floor(Math.random() * 5));
    // Septiembre is higher (shows progress!)
    const septScore = Math.min(60, studentBase + Math.floor(Math.random() * 6));
    
    mayoResults[student.id] = mayoScore;
    septResults[student.id] = septScore;
  });
  
  history['mayo'] = {
    testId: isMult ? 'multiplicacion_test_1' : 'sumas_restas_test_1',
    date: '2026-05-15',
    scores: mayoResults
  };
  
  history['septiembre'] = {
    testId: isMult ? 'multiplicacion_test_2' : 'sumas_restas_test_2',
    date: '2026-09-18',
    scores: septResults
  };
  
  return history;
};

// Generate full database.js code contents
const code = `// Base de datos de evaluaciones oficiales y umbrales de Cálculo Mental
// Generado automáticamente a partir de los recursos de Word y Excel.

export const parsedTests = ${JSON.stringify(parsedTests, null, 2)};

export const thresholds = ${JSON.stringify(thresholds, null, 2)};

export const demoStudents = ${JSON.stringify(demoStudents, null, 2)};

// Función para calcular el rango oficial a partir del puntaje (correctas/2min), curso y tipo de evaluación
export function getRango(score, grade, type) {
  if (score === '' || score === null || score === undefined) return '';
  const scoreNum = parseInt(score);
  if (isNaN(scoreNum)) return '';

  const gradeKey = grade.trim();
  const testType = type === 'multiplicacion' ? 'multiplicacion' : 'sumas_restas';
  
  // Buscar escala para el grado específico. 
  // Ej: "5ºA" o "5ºB" o "5° BASICO A" -> normalizar a la clave "5ºA" o similar si no existe.
  let gradeScale = thresholds[testType][gradeKey];
  
  // Normalizar grado si es necesario (ej: "5ºB" usa la misma escala que "5ºA" si no existe)
  if (!gradeScale) {
    const baseGrade = gradeKey.substring(0, 2); // ej: "5º"
    const matchKey = Object.keys(thresholds[testType]).find(k => k.startsWith(baseGrade));
    if (matchKey) {
      gradeScale = thresholds[testType][matchKey];
    }
  }
  
  // Fallback si sigue sin existir
  if (!gradeScale) {
    // Si es multiplicación, usar escala 4ºA como base
    // Si es sumas y restas, usar escala 1ºA
    gradeScale = testType === 'multiplicacion' ? thresholds.multiplicacion['4ºA'] : thresholds.sumas_restas['1ºA'];
  }
  
  if (!gradeScale || gradeScale.length === 0) return 'Sin Rango';

  // Recorrer las reglas (que están ordenadas de mayor a menor)
  for (const rule of gradeScale) {
    if (rule.min !== undefined && scoreNum >= rule.min) {
      return rule.range;
    }
    if (rule.max !== undefined && scoreNum <= rule.max) {
      return rule.range;
    }
  }

  // Fallback de rango medio si cae en algún vacío (ej. entre max y min)
  return 'Lento';
}

// Genera un historial de calificaciones de ejemplo realista para demostración inmediata
export function getDemoHistory(gradeKey, testType) {
  const isMult = testType === 'multiplicacion';
  const gradeClean = gradeKey.includes('A') ? gradeKey : gradeKey.replace('B', 'A'); // usar escala A para demo
  const gradeScale = thresholds[testType][gradeClean] || (isMult ? thresholds.multiplicacion['4ºA'] : thresholds.sumas_restas['1ºA']);
  
  const history = {};
  const mayoResults = {};
  const septResults = {};
  
  demoStudents.forEach((student, index) => {
    // Definir puntaje base realista del alumno
    let studentBase = 22 + (index % 5) * 8 + Math.floor(Math.random() * 6);
    if (index === 0) studentBase = 54; // Mateo (excelente)
    if (index === 1) studentBase = 48; // Sofia (excelente)
    if (index === 4) studentBase = 12; // Benjamín (rezagado)
    if (index === 11) studentBase = 20; // Camila (lenta)
    
    const mayoScore = Math.max(0, studentBase - 7 - Math.floor(Math.random() * 4));
    const septScore = Math.min(60, studentBase + 4 + Math.floor(Math.random() * 4));
    
    mayoResults[student.id] = {
      score: mayoScore,
      rango: getRango(mayoScore, gradeKey, testType)
    };
    septResults[student.id] = {
      score: septScore,
      rango: getRango(septScore, gradeKey, testType)
    };
  });
  
  history['mayo'] = {
    id: 'eval_mayo',
    title: 'Evaluación Diagnóstica (Mayo)',
    testId: isMult ? 'multiplicacion_test_1' : 'sumas_restas_test_1',
    date: '2026-05-12',
    scores: mayoResults
  };
  
  history['septiembre'] = {
    id: 'eval_septiembre',
    title: 'Evaluación de Monitoreo (Septiembre)',
    testId: isMult ? 'multiplicacion_test_2' : 'sumas_restas_test_2',
    date: '2026-09-15',
    scores: septResults
  };
  
  return history;
}
`;

fs.mkdirSync(path.dirname(targetDbPath), { recursive: true });
fs.writeFileSync(targetDbPath, code);
console.log('Successfully generated database.js at:', targetDbPath);
