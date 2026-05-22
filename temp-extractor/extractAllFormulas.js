const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const fileSumas = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Sumas y Restas.xls');
const fileMult = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Multiplicación.xls');

function getFormulasForFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const result = {};
  
  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'RESUMEN') return;
    const sheet = workbook.Sheets[sheetName];
    // Find the first cell with a formula in Column E (Mayo Rango)
    // Row 10 is cell E10 (r: 9, c: 4)
    // Let's search rows 10 to 20 for a formula
    let formula = '';
    let valSample = '';
    for (let r = 9; r < 20; r++) {
      const cell = sheet[XLSX.utils.encode_cell({r, c: 4})];
      if (cell && cell.f) {
        formula = cell.f;
        valSample = cell.v;
        break;
      }
    }
    result[sheetName] = { formula, valSample };
  });
  
  return result;
}

const sumasFormulas = getFormulasForFile(fileSumas);
const multFormulas = getFormulasForFile(fileMult);

console.log('=== SUMAS Y RESTAS ===');
console.log(JSON.stringify(sumasFormulas, null, 2));

console.log('\n=== MULTIPLICACION ===');
console.log(JSON.stringify(multFormulas, null, 2));

fs.writeFileSync(
  path.join(__dirname, '..', 'extracted_thresholds.json'),
  JSON.stringify({ sumas_restas: sumasFormulas, multiplicacion: multFormulas }, null, 2)
);
console.log('Successfully wrote extracted_thresholds.json!');
