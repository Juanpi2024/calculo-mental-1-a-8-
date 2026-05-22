const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const files = [
  'Ejercicios Cálculo Mental Multiplicación 4º a 8º básico.docx',
  'Ejercicios Cálculo Mental Sumas y Restas 2º a 8º básico.docx',
  'calculo mental 1 al 4 tablas de multiplicar.docx',
  'calculo-mental-5-al-8-tablas-de-multiplicar.docx'
];

async function extract(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  console.log(`=== Extracting ${fileName} ===`);
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    console.log('Text length:', text.length);
    console.log('Sample (first 500 chars):');
    console.log(text.substring(0, 500));
    console.log('\n---------------------------------\n');
    fs.writeFileSync(path.join(__dirname, fileName + '.txt'), text);
  } catch (err) {
    console.error('Error reading docx:', err.message);
  }
}

async function run() {
  for (const file of files) {
    await extract(file);
  }
}

run();
