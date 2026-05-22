const mammoth = require('mammoth');
const path = require('path');
const fs = require('fs');

const docxFiles = [
  'calculo mental 1 al 4 tablas de multiplicar.docx',
  'calculo-mental-5-al-8-tablas-de-multiplicar.docx',
  'SEGUIMIENTO TABLAS DE MULTIPLICAR_ESTUDIANTES.docx'
];

async function extract(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  console.log(`=== Extracting ${fileName} ===`);
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    console.log('Sample of text (first 1000 chars):');
    console.log(text.substring(0, 1000));
    console.log('\n---------------------------------\n');
    // Save to a text file for complete viewing if needed
    fs.writeFileSync(path.join(__dirname, fileName + '.txt'), text);
  } catch (err) {
    console.error('Error reading docx:', err.message);
  }
}

async function run() {
  for (const file of docxFiles) {
    await extract(file);
  }
}

run();
