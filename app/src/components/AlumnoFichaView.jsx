import React from 'react';

export default function AlumnoFichaView({
  selectedStudentId,
  students,
  history,
  currentClass,
  testType,
  setView
}) {
  
  const student = students.find(s => s.id === selectedStudentId);
  if (!student) {
    return (
      <div className="card text-center" style={{ padding: '40px' }}>
        <h3>Estudiante no encontrado</h3>
        <button className="btn btn-primary mt-4" onClick={() => setView('nomina')}>
          Volver a Nómina
        </button>
      </div>
    );
  }

  // Compile history of scores for this specific student
  // Sort evaluations chronologically
  const sortedEvals = Object.values(history)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const studentHistory = sortedEvals.map(evalItem => {
    const record = evalItem.scores[student.id];
    return {
      evalId: evalItem.id,
      title: evalItem.title,
      date: evalItem.date,
      score: record ? record.score : '-',
      rango: record ? record.rango : 'Sin Datos'
    };
  }).filter(h => h.score !== '-');

  // Print single card
  const handlePrint = () => {
    window.print();
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

  // Compile SVG Line Chart parameters
  const chartHeight = 150;
  const chartWidth = 400;
  const padding = 30;
  
  let linePath = '';
  let points = [];
  
  if (studentHistory.length > 1) {
    const stepX = (chartWidth - padding * 2) / (studentHistory.length - 1);
    studentHistory.forEach((h, idx) => {
      const x = padding + idx * stepX;
      // Map score 0-60 to chart y-coordinate (chartHeight - padding down to padding)
      const scoreVal = typeof h.score === 'number' ? h.score : 0;
      const y = chartHeight - padding - (scoreVal / 60) * (chartHeight - padding * 2);
      
      points.push({ x, y, score: h.score, title: h.title });
      if (idx === 0) {
        linePath += `M ${x} ${y}`;
      } else {
        linePath += ` L ${x} ${y}`;
      }
    });
  }

  return (
    <div>
      {/* Top action row */}
      <div className="flex-between mb-4">
        <button className="btn btn-secondary" onClick={() => setView('nomina')}>
          ◀ Volver a la Nómina
        </button>

        <button className="btn btn-primary" onClick={handlePrint}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.615 0-1.114-.507-1.12-1.122L6.1 18m11.56 0L17 12m-11 6L5.4 12m0 0a1.5 1.5 0 011.033-1.75l10.375-3.03a1.5 1.5 0 011.75 1.033L19 12M9 19.5h6" />
          </svg>
          Imprimir Ficha de Seguimiento
        </button>
      </div>

      {/* Screen layout */}
      <div className="grid-cols-3" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Student Info Profile Card */}
        <div className="card text-center" style={{ padding: '32px 24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '40px',
            backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
            fontSize: '32px', fontWeight: '700', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--primary-border)'
          }}>
            {student.nombre[0]}{student.apellido ? student.apellido[0] : ''}
          </div>
          
          <h2 style={{ fontFamily: 'var(--display)', fontSize: '24px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '4px' }}>
            {student.nombre} {student.apellido}
          </h2>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Curso: {currentClass} Básico
          </span>

          <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Evaluaciones:</span>
              <strong style={{ color: 'var(--text-title)' }}>{studentHistory.length} tomadas</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Último Acierto:</span>
              <strong style={{ color: 'var(--text-title)' }}>
                {studentHistory.length > 0 ? studentHistory[studentHistory.length - 1].score : '-'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Rango Actual:</span>
              <span className={`badge ${getBadgeClass(studentHistory.length > 0 ? studentHistory[studentHistory.length - 1].rango : '')}`} style={{ transform: 'scale(0.9)', originX: 'right' }}>
                {studentHistory.length > 0 ? studentHistory[studentHistory.length - 1].rango : 'Sin Datos'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Charts and tables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Progress Chart Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '10px' }}>
              <h3 className="card-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                </svg>
                Gráfico Histórico de Fluidez
              </h3>
            </div>
            
            {studentHistory.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                Se necesitan al menos 2 evaluaciones guardadas en el historial para mostrar el gráfico de tendencia individual.
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', maxHeight: '200px' }}>
                  {/* Grid Lines */}
                  <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="var(--border-color)" strokeDasharray="3,3" />
                  <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="var(--border-color)" strokeDasharray="3,3" />
                  
                  {/* Axis labels */}
                  <text x={padding - 5} y={padding + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">60</text>
                  <text x={padding - 5} y={chartHeight / 2 + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">30</text>
                  <text x={padding - 5} y={chartHeight - padding + 4} fill="var(--text-muted)" fontSize="9" textAnchor="end">0</text>

                  {/* Draw Path */}
                  <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Draw Points & Labels */}
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle cx={p.x} cy={p.y} r="5" fill="var(--secondary)" stroke="var(--primary)" strokeWidth="2" />
                      <text x={p.x} y={p.y - 10} fill="var(--text-title)" fontSize="10" fontWeight="700" textAnchor="middle">{p.score}</text>
                      <text x={p.x} y={chartHeight - padding + 15} fill="var(--text-muted)" fontSize="8" fontWeight="600" textAnchor="middle">
                        {p.title.length > 15 ? p.title.substring(0, 12) + '...' : p.title}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            )}
          </div>

          {/* History Details Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '20px 24px', marginBottom: 0 }}>
              <h3 className="card-title">
                Historial de Rendimiento
              </h3>
            </div>
            
            {studentHistory.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Este estudiante no registra puntajes en ninguna evaluación.
              </div>
            ) : (
              <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Evaluación</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>Fecha</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Aciertos</th>
                      <th style={{ width: '150px', textAlign: 'center' }}>Rango Alcanzado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentHistory.map((h, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{h.title}</td>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{h.date}</td>
                        <td style={{ textAlign: 'center', fontWeight: '700', color: 'var(--primary)' }}>{h.score}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${getBadgeClass(h.rango)}`}>
                            {h.rango}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* --- Printable Progress Tracking Sheet (recreada de la original de Word) --- */}
      <div className="printable-ficha">
        <div style={{ border: '2px solid black', padding: '30px', margin: '0 auto', maxWidth: '800px', position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid black', paddingBottom: '16px', marginBottom: '24px' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>DEPARTAMENTO DE MATEMÁTICA</h4>
              <h4 style={{ margin: '4px 0 0', fontSize: '11px', fontWeight: '600' }}>PRIMER CICLO BÁSICO</h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>SEGUIMIENTO DE CÁLCULO MENTAL</h3>
              <span style={{ fontSize: '10px', color: '#555' }}>Fluidez de Operaciones Matemáticas</span>
            </div>
          </div>

          <h2>FICHA DE SEGUIMIENTO INDIVIDUAL</h2>
          
          <p style={{ fontSize: '12px', lineHeight: '1.4', margin: '16px 0 24px', fontStyle: 'italic', textAlign: 'justify' }}>
            Estimado estudiante: Pega esta hoja en la parte trasera de tu cuaderno y completa la tabla con los resultados de tus cálculos mentales. Observa tus avances en la memorización de operaciones y fluidez matemática durante el año.
          </p>

          <div style={{ display: 'flex', gap: '40px', marginBottom: '30px', border: '1px solid black', padding: '12px 20px', backgroundColor: '#f9f9f9' }}>
            <div>
              <strong>NOMBRE ESTUDIANTE:</strong> <span style={{ textDecoration: 'underline', textTransform: 'uppercase', marginLeft: '6px', fontWeight: '600' }}>{student.nombre} {student.apellido}</span>
            </div>
            <div>
              <strong>CURSO:</strong> <span style={{ textDecoration: 'underline', marginLeft: '6px', fontWeight: '600' }}>{currentClass} Básico</span>
            </div>
            <div>
              <strong>TIPO TEST:</strong> <span style={{ textDecoration: 'underline', textTransform: 'capitalize', marginLeft: '6px', fontWeight: '600' }}>{testType === 'multiplicacion' ? 'Multiplicación' : 'Sumas y Restas'}</span>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '60px' }}>Nº</th>
                <th style={{ border: '1px solid black', padding: '10px' }}>EVALUACIÓN / ENSAYO</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '120px' }}>FECHA</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '100px' }}>ACIERTOS</th>
                <th style={{ border: '1px solid black', padding: '10px', textAlign: 'center', width: '150px' }}>NIVEL ALCANZADO</th>
              </tr>
            </thead>
            <tbody>
              {/* If history is empty, write 10 blank rows for manual entry */}
              {studentHistory.length === 0 ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i} style={{ height: '32px' }}>
                    <td style={{ border: '1px solid black', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid black' }}></td>
                    <td style={{ border: '1px solid black' }}></td>
                    <td style={{ border: '1px solid black' }}></td>
                    <td style={{ border: '1px solid black' }}></td>
                  </tr>
                ))
              ) : (
                /* Write active historical scores and fill empty rows up to 12 */
                <>
                  {studentHistory.map((h, i) => (
                    <tr key={i} style={{ height: '32px' }}>
                      <td style={{ border: '1px solid black', textAlign: 'center', fontWeight: '600' }}>{i + 1}</td>
                      <td style={{ border: '1px solid black', paddingLeft: '10px', fontWeight: '600' }}>{h.title}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center' }}>{h.date}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center', fontWeight: '700' }}>{h.score}</td>
                      <td style={{ border: '1px solid black', textAlign: 'center', fontWeight: '600' }}>{h.rango}</td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(0, 12 - studentHistory.length) }).map((_, i) => {
                    const idx = studentHistory.length + i + 1;
                    return (
                      <tr key={idx} style={{ height: '32px' }}>
                        <td style={{ border: '1px solid black', textAlign: 'center' }}>{idx}</td>
                        <td style={{ border: '1px solid black' }}></td>
                        <td style={{ border: '1px solid black' }}></td>
                        <td style={{ border: '1px solid black' }}></td>
                        <td style={{ border: '1px solid black' }}></td>
                      </tr>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', borderTop: '1px dashed #aaa', paddingTop: '20px' }}>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid black', height: '40px', marginBottom: '8px' }}></div>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>FIRMA DEL PROFESOR(A)</span>
            </div>
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ borderBottom: '1px solid black', height: '40px', marginBottom: '8px' }}></div>
              <span style={{ fontSize: '10px', fontWeight: '600' }}>FIRMA DEL APODERADO</span>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
