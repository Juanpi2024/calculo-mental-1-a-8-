const fs = require('fs');
const path = require('path');

function analyzeFile(fileName) {
  const filePath = path.join(__dirname, fileName + '.txt');
  if (!fs.existsSync(filePath)) {
    console.log(`${fileName} text file does not exist.`);
    return;
  }
  const text = fs.readFileSync(filePath, 'utf-8');
  console.log(`=== Analyzing ${fileName} ===`);
  
  // Find lines with "Cálculo Mental" or "Ejercicios de"
  const lines = text.split('\n');
  let testHeaders = [];
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes('cálculo mental') || line.toLowerCase().includes('ejercicios de')) {
      testHeaders.push({ line: line.trim(), index });
    }
  });
  
  console.log('Headers found:', testHeaders.length);
  testHeaders.forEach(h => {
    console.log(`Line ${h.index}: "${h.line}"`);
  });
  
  // Count questions in this file
  const questions = text.match(/\d+\s*[\+\-x\*]\s*\d+\s*=/g) || [];
  console.log('Questions count:', questions.length);
  if (questions.length > 0) {
    console.log('Sample questions:', questions.slice(0, 10));
  }
  console.log('\n');
}

analyzeFile('Ejercicios Cálculo Mental Multiplicación 4º a 8º básico.docx');
analyzeFile('Ejercicios Cálculo Mental Sumas y Restas 2º a 8º básico.docx');
analyzeFile('calculo mental 1 al 4 tablas de multiplicar.docx');
analyzeFile('calculo-mental-5-al-8-tablas-de-multiplicar.docx');
