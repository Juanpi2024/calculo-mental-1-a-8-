const fs = require('fs');
const path = require('path');

const files = {
  'multiplicacion_4_8': {
    name: 'Multiplicación (4º a 8º Básico)',
    file: 'Ejercicios Cálculo Mental Multiplicación 4º a 8º básico.docx.txt',
    type: 'multiplicacion',
    questionsPerTest: 30
  },
  'sumas_restas_2_8': {
    name: 'Sumas y Restas (2º a 8º Básico)',
    file: 'Ejercicios Cálculo Mental Sumas y Restas 2º a 8º básico.docx.txt',
    type: 'sumas_restas',
    questionsPerTest: 30
  },
  'tablas_1_4': {
    name: 'Tablas de Multiplicar (1º a 4º Básico)',
    file: 'calculo mental 1 al 4 tablas de multiplicar.docx.txt',
    type: 'tablas',
    questionsPerTest: 40
  },
  'tablas_5_8': {
    name: 'Tablas de Multiplicar (5º a 8º Básico)',
    file: 'calculo-mental-5-al-8-tablas-de-multiplicar.docx.txt',
    type: 'tablas',
    questionsPerTest: 40
  }
};

function cleanQuestion(q) {
  // Replace various types of dashes with normal hyphen, remove extra spaces
  return q.replace(/[\u2013\u2014]/g, '-')
          .replace(/\s+/g, ' ')
          .trim();
}

function parseFile(info) {
  const filePath = path.join(__dirname, info.file);
  if (!fs.existsSync(filePath)) {
    console.error(`File ${info.file} not found.`);
    return [];
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Split into lines
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const tests = [];
  let currentTestName = '';
  let currentQuestions = [];
  let testIndex = 0;
  
  // Simple state machine or regex search
  // Questions look like: \d+ \s* [+-\*x] \s* \d+ \s* =
  // Or: \d+ \s* [\u2013\u2014] \s* \d+ \s* =
  const questionRegex = /\d+\s*[\+\-x\*\u2013\u2014]\s*\d+\s*=?/i;
  
  lines.forEach(line => {
    const isQuestion = questionRegex.test(line);
    const isTestHeader = line.toLowerCase().includes('cálculo mental') || line.toLowerCase().includes('ejercicios de cálculo mental');
    
    if (isTestHeader) {
      // If we have an ongoing test, save it
      if (currentQuestions.length > 0) {
        testIndex++;
        tests.push({
          id: `${info.type}_test_${testIndex}`,
          title: currentTestName || `Test ${testIndex}`,
          questions: currentQuestions
        });
      }
      
      // Extract test name
      if (line.toLowerCase().includes('cálculo mental')) {
        // e.g. "Cálculo Mental 1"
        const match = line.match(/cálculo mental\s*\d+/i);
        currentTestName = match ? match[0] : line;
      } else {
        testIndex++;
        currentTestName = `Evaluación ${testIndex}`;
      }
      currentQuestions = [];
    } else if (isQuestion) {
      // Format question nicely
      // If it doesn't end with =, append it
      let qText = cleanQuestion(line);
      if (!qText.endsWith('=')) {
        qText += ' =';
      }
      // Ensure spaces around operators
      qText = qText.replace(/\s*([\+\-x\*=])\s*/g, ' $1 ').replace(/\s*=\s*$/, ' =').trim();
      
      currentQuestions.push(qText);
    }
  });
  
  // Push the last test
  if (currentQuestions.length > 0) {
    testIndex++;
    tests.push({
      id: `${info.type}_test_${testIndex}`,
      title: currentTestName || `Test ${testIndex}`,
      questions: currentQuestions
    });
  }
  
  // Post-process to ensure we have exactly questionsPerTest
  // If a test has less, or if we didn't split headers correctly
  console.log(`Parsed ${info.name}: found ${tests.length} tests`);
  tests.forEach((t, i) => {
    console.log(` - ${t.title}: ${t.questions.length} questions`);
    // If questions count is double, we might have merged two tests
    if (t.questions.length > info.questionsPerTest * 1.5) {
      // split it
      const numTests = Math.round(t.questions.length / info.questionsPerTest);
      console.log(`   Warning: Test ${t.title} has too many questions (${t.questions.length}). Splitting into ${numTests} tests.`);
    }
  });
  
  return tests;
}

// Let's parse all of them
const db = {};
for (const key in files) {
  db[key] = {
    name: files[key].name,
    type: files[key].type,
    tests: parseFile(files[key])
  };
}

// Write the parsed JSON
fs.writeFileSync(path.join(__dirname, '..', 'parsed_tests.json'), JSON.stringify(db, null, 2));
console.log('Successfully wrote parsed_tests.json!');
