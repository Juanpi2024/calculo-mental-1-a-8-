import React, { useState } from 'react';

export default function NominaView({
  students,
  setStudents,
  history,
  onLoadDemo,
  setView,
  setSelectedStudentId
}) {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calculate average scores and latest ranks for all students
  const getStudentStats = (studentId) => {
    let totalScore = 0;
    let testCount = 0;
    let latestScore = '-';
    let latestRango = 'Sin Datos';
    
    // Sort history by date to find latest
    const sortedEvals = Object.values(history).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedEvals.forEach(evalItem => {
      const studentResult = evalItem.scores[studentId];
      if (studentResult && typeof studentResult.score === 'number') {
        totalScore += studentResult.score;
        testCount++;
        latestScore = studentResult.score;
        latestRango = studentResult.rango;
      }
    });
    
    return {
      avg: testCount > 0 ? Math.round((totalScore / testCount) * 10) / 10 : '-',
      latestScore,
      latestRango
    };
  };

  const handleAddSingle = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    
    const newStudent = {
      id: 'est_' + (Date.now() + Math.floor(Math.random() * 1000)),
      nombre: nombre.trim(),
      apellido: apellido.trim()
    };
    
    setStudents([...students, newStudent]);
    setNombre('');
    setApellido('');
  };

  const handleAddBulk = (e) => {
    e.preventDefault();
    if (!bulkText.trim()) return;
    
    const lines = bulkText.split('\n');
    const newStudents = [];
    
    lines.forEach((line, idx) => {
      const cleanLine = line.trim();
      if (!cleanLine) return;
      
      // Separate first name and last name
      // If there are multiple words, take the first as name and the rest as surname
      const parts = cleanLine.split(/\s+/);
      if (parts.length > 0) {
        const estId = 'est_' + (Date.now() + idx + Math.floor(Math.random() * 100));
        const estNombre = parts[0];
        const estApellido = parts.slice(1).join(' ');
        newStudents.push({
          id: estId,
          nombre: estNombre,
          apellido: estApellido || ''
        });
      }
    });
    
    if (newStudents.length > 0) {
      setStudents([...students, ...newStudents]);
      setBulkText('');
      setShowBulkAdd(false);
    }
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('¿Está seguro de eliminar a este estudiante? Se borrarán también sus puntajes históricos.')) {
      setStudents(students.filter(s => s.id !== studentId));
      // Scores in history are kept or ignored automatically since student won't be in the list
    }
  };

  const handleClearAll = () => {
    if (window.confirm('¡PRECAUCIÓN! Esta acción borrará a todos los alumnos y sus registros de ensayos. ¿Desea continuar?')) {
      setStudents([]);
    }
  };

  // Filter students by search term
  const filteredStudents = students.filter(s => {
    const full = `${s.nombre} ${s.apellido}`.toLowerCase();
    return full.includes(searchTerm.toLowerCase());
  });

  const exportCSVTemplate = () => {
    // Generate empty template CSV for import
    const headers = 'Nº,NOMBRE,APELLIDO\n';
    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'nomina_plantilla.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      const importedStudents = [];
      
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Parse CSV fields (Nº, NOMBRE, APELLIDO)
        const columns = line.split(',');
        if (columns.length >= 2) {
          const estId = 'est_' + (Date.now() + i + Math.floor(Math.random() * 100));
          // If columns[0] is a number, columns[1] is name, columns[2] is surname
          const isNum = !isNaN(parseInt(columns[0]));
          const nameIdx = isNum ? 1 : 0;
          const apIdx = isNum ? 2 : 1;
          
          const estNombre = (columns[nameIdx] || '').trim();
          const estApellido = (columns[apIdx] || '').trim();
          
          if (estNombre) {
            importedStudents.push({
              id: estId,
              nombre: estNombre,
              apellido: estApellido
            });
          }
        }
      }
      
      if (importedStudents.length > 0) {
        setStudents([...students, ...importedStudents]);
        alert(`Se han importado ${importedStudents.length} alumnos correctamente.`);
      } else {
        alert('No se encontraron datos válidos. Recuerde que el archivo debe tener el formato: NOMBRE,APELLIDO');
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const getBadgeClass = (rango) => {
    if (!rango) return 'badge-sin-datos';
    const r = rango.toLowerCase();
    if (r.includes('auto')) return 'badge-automatico';
    if (r.includes('muy rapido') || r.includes('muy rápido')) return 'badge-muy-rapido';
    if (r.includes('rapido') || r.includes('rápido')) return 'badge-rapido';
    if (r.includes('median')) return 'badge-mediano';
    if (r.includes('muy lento')) return 'badge-muy-lento';
    if (r.includes('lento')) return 'badge-lento';
    if (r.includes('fuera')) return 'badge-fuera';
    return 'badge-sin-datos';
  };

  return (
    <div>
      {/* Top action row */}
      <div className="flex-between mb-4">
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="input-text w-full"
            placeholder="Buscar por nombre o apellido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 16px' }}
          />
        </div>

        {/* Buttons */}
        <div className="flex-between gap-2">
          {students.length === 0 ? (
            <button className="btn btn-primary" onClick={onLoadDemo}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              Cargar Alumnos de Ejemplo
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleClearAll}>
              Borrar Todo
            </button>
          )}

          <button className="btn btn-secondary" onClick={() => setShowBulkAdd(!showBulkAdd)}>
            {showBulkAdd ? 'Ocultar Carga Masiva' : 'Carga Masiva (Copiar/Pegar)'}
          </button>
          
          <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Subir CSV
            <input type="file" accept=".csv, .txt" onChange={handleCSVImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Bulk Add Form */}
      {showBulkAdd && (
        <div className="card card-glass" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '10px' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-title)' }}>
              Carga Masiva de Estudiantes
            </h4>
          </div>
          <form onSubmit={handleAddBulk}>
            <div className="form-group">
              <label>Pega la lista de alumnos (un nombre completo por línea):</label>
              <textarea
                className="input-text"
                rows="6"
                placeholder="Ejemplo:&#10;Juan Pérez&#10;María Ignacia Gómez&#10;Pedro Contreras"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                style={{ fontFamily: 'var(--sans)', resize: 'vertical', width: '100%' }}
              ></textarea>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowBulkAdd(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Importar Lista
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Form and Table */}
      <div className="grid-cols-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Single Add Form */}
        <div className="card" style={{ position: 'sticky', top: '100px' }}>
          <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '8px' }}>
            <h3 className="card-title" style={{ fontSize: '16px' }}>
              Nuevo Alumno
            </h3>
          </div>
          <form onSubmit={handleAddSingle}>
            <div className="form-group">
              <label htmlFor="student-name">Nombre:</label>
              <input
                id="student-name"
                type="text"
                className="input-text"
                placeholder="Ej: Mateo"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="student-lastname">Apellido:</label>
              <input
                id="student-lastname"
                type="text"
                className="input-text"
                placeholder="Ej: González"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary w-full mt-4">
              Agregar a la Nómina
            </button>
          </form>
          
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
            <h5 style={{ fontWeight: '600', color: 'var(--text-title)', marginBottom: '8px' }}>Consejo de Importación</h5>
            <p style={{ marginBottom: '12px' }}>¿Tienes tu nómina en Excel? Puedes descargar nuestra plantilla vacía o subir un archivo CSV directo.</p>
            <button className="btn btn-secondary w-full" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={exportCSVTemplate}>
              Descargar Plantilla CSV
            </button>
          </div>
        </div>

        {/* Right Side: Roster Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredStudents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No hay alumnos registrados</h3>
              <p style={{ marginTop: '8px' }}>Agrega alumnos usando el formulario lateral o haz clic en "Cargar Alumnos de Ejemplo" para explorar la aplicación de inmediato.</p>
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
              <table style={{ minWidth: '500px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>Nº</th>
                    <th>Estudiante</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Promedio</th>
                    <th style={{ width: '100px', textAlign: 'center' }}>Último Test</th>
                    <th style={{ width: '150px', textAlign: 'center' }}>Rango</th>
                    <th style={{ width: '120px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => {
                    const stats = getStudentStats(s.id);
                    return (
                      <tr key={s.id}>
                        <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>
                          {s.nombre} {s.apellido}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--primary)' }}>
                          {stats.avg}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>
                          {stats.latestScore}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${getBadgeClass(stats.latestRango)}`}>
                            {stats.latestRango}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-icon-only"
                              title="Ver ficha de progreso"
                              onClick={() => {
                                setSelectedStudentId(s.id);
                                setView('ficha');
                              }}
                              style={{ padding: '6px' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            <button
                              className="btn btn-danger btn-icon-only"
                              title="Eliminar estudiante"
                              onClick={() => handleDeleteStudent(s.id)}
                              style={{ padding: '6px', backgroundColor: 'var(--rango-fuera-bg)', border: 'none' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px', color: 'var(--rango-fuera)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
