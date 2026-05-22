const XLSX = require('xlsx');
const path = require('path');

const fileSumas = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Sumas y Restas.xls');
const fileMult = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Multiplicación.xls');

function checkFormulas(filePath) {
  console.log('=== Checking Formulas for', path.basename(filePath), '===');
  const workbook = XLSX.readFile(filePath);
  // Let's find first sheet that represents a grade, e.g. "5ºA" or "4ºA"
  const sheetName = workbook.SheetNames.find(n => n !== 'RESUMEN');
  if (!sheetName) return;
  
  const sheet = workbook.Sheets[sheetName];
  console.log('Sheet:', sheetName);
  
  // Let's print rows 8 to 25
  for (let r = 7; r < 25; r++) {
    const numCell = sheet[XLSX.utils.encode_cell({r, c: 0})]; // Col A (Nº)
    const nameCell = sheet[XLSX.utils.encode_cell({r, c: 1})]; // Col B (Nombre)
    const scoreCell = sheet[XLSX.utils.encode_cell({r, c: 3})]; // Col D (Mayo score)
    const rangeCell = sheet[XLSX.utils.encode_cell({r, c: 4})]; // Col E (Mayo rango)
    
    if (nameCell || rangeCell) {
      console.log(`Row ${r+1} | Num: ${numCell ? numCell.v : ''} | Name: ${nameCell ? nameCell.v : ''} | Score: ${scoreCell ? scoreCell.v : ''} | Range: v="${rangeCell ? rangeCell.v : ''}" f="${rangeCell && rangeCell.f ? rangeCell.f : ''}"`);
    }
  }
}

checkFormulas(fileSumas);
checkFormulas(fileMult);
