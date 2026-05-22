const XLSX = require('xlsx');
const path = require('path');

const file1 = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Multiplicación.xls');
const file2 = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Sumas y Restas.xls');

function inspectFile(filePath) {
  console.log('--- Inspecting File:', path.basename(filePath), '---');
  try {
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);
    
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      console.log(`Sheet "${sheetName}" Range: A1:${XLSX.utils.encode_cell({c: range.e.c, r: range.e.r})}`);
      
      // Get first 15 rows as JSON to see layout
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      console.log('First 15 rows:');
      json.slice(0, 15).forEach((row, idx) => {
        // Log non-empty row or at least a summary
        const rowStr = row.map(v => typeof v === 'string' ? v.trim() : v).join(' | ');
        if (rowStr.replace(/[| ]/g, '').length > 0) {
          console.log(`Row ${idx + 1}: ${rowStr.substring(0, 200)}`);
        }
      });
    });
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
}

inspectFile(file1);
inspectFile(file2);
