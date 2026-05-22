const XLSX = require('xlsx');
const path = require('path');

const fileSumas = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Sumas y Restas.xls');
const fileMult = path.join(__dirname, '..', 'Planilla Resultados Cálculo Mental - Multiplicación.xls');

function scanForStudents(filePath) {
  console.log('=== Scanning Students in', path.basename(filePath), '===');
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'RESUMEN') return;
    const sheet = workbook.Sheets[sheetName];
    let count = 0;
    let students = [];
    
    // We expect students in rows 10 to 80 (0-indexed 9 to 79)
    for (let r = 9; r < 80; r++) {
      const nameCell = sheet[XLSX.utils.encode_cell({r, c: 1})];
      const apellidoCell = sheet[XLSX.utils.encode_cell({r, c: 2})];
      
      const name = nameCell ? String(nameCell.v).trim() : '';
      const apellido = apellidoCell ? String(apellidoCell.v).trim() : '';
      
      if (name || apellido) {
        count++;
        if (students.length < 5) {
          students.push(`${name} ${apellido}`);
        }
      }
    }
    
    if (count > 0) {
      console.log(`Sheet "${sheetName}": Found ${count} students. Examples:`, students.join(', '));
    }
  });
}

scanForStudents(fileSumas);
scanForStudents(fileMult);
