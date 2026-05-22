import React from 'react';

export default function DashboardView({ 
  currentClass, 
  currentYear, 
  students, 
  history, 
  testType,
  setView,
  setSelectedStudentId
}) {
  
  // Calculate general statistics for the class
  const totalStudents = students.length;
  
  // Get active evaluation results (latest taken, or fallback to demo)
  const activeEvalKey = history.septiembre ? 'septiembre' : (history.mayo ? 'mayo' : null);
  const activeEval = activeEvalKey ? history[activeEvalKey] : null;
  const prevEval = activeEvalKey === 'septiembre' ? history.mayo : null;
  
  const getStatsForEval = (evalData) => {
    if (!evalData || !evalData.scores) return { avg: 0, autoPercent: 0, dist: {} };
    let totalScore = 0;
    let autoCount = 0; // Automático + Muy Rápido + Rápido
    const dist = {
      'Automático': 0,
      'Muy Rápido': 0,
      'Rápido': 0,
      'Mediano': 0,
      'Lento': 0,
      'Muy Lento': 0,
      'Fuera de Tabla': 0,
      'Fuera Tabla': 0
    };
    
    let count = 0;
    Object.values(evalData.scores).forEach(item => {
      if (item && typeof item.score === 'number') {
        totalScore += item.score;
        count++;
        const r = item.rango;
        if (dist[r] !== undefined) {
          dist[r]++;
        } else {
          dist[r] = 1;
        }
        if (r === 'Automático' || r === 'Muy Rápido' || r === 'Rápido') {
          autoCount++;
        }
      }
    });
    
    return {
      avg: count > 0 ? Math.round((totalScore / count) * 10) / 10 : 0,
      autoPercent: count > 0 ? Math.round((autoCount / count) * 100) : 0,
      dist,
      totalCount: count
    };
  };
  
  const currentStats = getStatsForEval(activeEval);
  const prevStats = getStatsForEval(prevEval);
  
  // Calculate average improvement
  const avgImprovement = activeEvalKey === 'septiembre' 
    ? Math.round((currentStats.avg - prevStats.avg) * 10) / 10 
    : 0;

  // Compile list of students in Fuera de Tabla or Muy Lento for urgent attention
  const alertStudents = [];
  if (activeEval && activeEval.scores) {
    Object.entries(activeEval.scores).forEach(([id, item]) => {
      if (item.rango === 'Fuera de Tabla' || item.rango === 'Fuera Tabla' || item.rango === 'Muy Lento') {
        const student = students.find(s => s.id === id);
        if (student) {
          alertStudents.push({
            id: student.id,
            fullName: `${student.nombre} ${student.apellido}`,
            rango: item.rango,
            score: item.score
          });
        }
      }
    });
  }

  // Pedagogical suggestion based on test results
  let recommendation = {
    title: "Enfocar en Fluidez Básica",
    desc: "El curso se encuentra en nivel diagnóstico. Se recomienda practicar dictados diarios de 10 ejercicios con cronómetro visual para acostumbrar al curso al ritmo de evaluación de 2 minutos."
  };
  
  if (testType === 'multiplicacion') {
    recommendation = {
      title: "Consolidar las tablas del 7, 8 y 9",
      desc: "Las estadísticas muestran un retroceso en multiplicaciones con factores altos. Utiliza la técnica del 'reloj de multiplicación' (dibujar un círculo con factores del 1 al 12 alrededor y el multiplicando en el centro) durante los primeros 5 minutos de la clase."
    };
  } else if (activeEvalKey === 'septiembre') {
    recommendation = {
      title: "Optimizar el Rango Automático",
      desc: "El 40% del curso ya se encuentra en rango Rápido o Superior. Para el resto del curso, impulsa el juego de cartas de cálculo mental y asigna tutorías entre pares en los momentos de trabajo autónomo."
    };
  }

  // Setup data for SVG Donut
  const donutData = [
    { label: 'Automático', count: (currentStats.dist['Automático'] || 0), color: 'var(--rango-automatico)' },
    { label: 'Muy Rápido', count: (currentStats.dist['Muy Rápido'] || 0), color: 'var(--rango-muy-rapido)' },
    { label: 'Rápido', count: (currentStats.dist['Rápido'] || 0), color: 'var(--rango-rapido)' },
    { label: 'Mediano', count: (currentStats.dist['Mediano'] || 0), color: 'var(--rango-mediano)' },
    { label: 'Lento', count: (currentStats.dist['Lento'] || 0), color: 'var(--rango-lento)' },
    { label: 'Muy Lento', count: (currentStats.dist['Muy Lento'] || 0), color: 'var(--rango-muy-lento)' },
    { label: 'Fuera de Tabla', count: (currentStats.dist['Fuera de Tabla'] || 0) + (currentStats.dist['Fuera Tabla'] || 0), color: 'var(--rango-fuera)' },
  ].filter(d => d.count > 0);

  // Compute SVG slices
  let cumulativePercent = 0;
  const slices = donutData.map(d => {
    const percent = d.count / (currentStats.totalCount || 1);
    const startPercent = cumulativePercent;
    cumulativePercent += percent;
    return {
      ...d,
      startPercent,
      endPercent: cumulativePercent,
      percent: Math.round(percent * 100)
    };
  });

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div>
      {/* KPIs row */}
      <div className="grid-cols-4 mb-4" style={{ gap: '20px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20c-2.202 0-4.275-.626-6.022-1.714m16.033-2.493a9.349 9.349 0 002.244-4.077m-16.033 4.077A9.349 9.349 0 014.077 11.8M15 15.75H1.5m12.428-11.95A4.75 4.75 0 0010 3.25a4.75 4.75 0 00-3.928 2.05m8.356 0A4.748 4.748 0 0115 7.75c0 1.947-1.17 3.62-2.844 4.356m-8.356-4.356A4.748 4.748 0 005 7.75c0 1.947 1.17 3.62 2.844 4.356m4.734 0a4.752 4.752 0 00-6.172 0M10.5 7.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 6a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Alumnos</span>
            <span className="stat-value">{totalStudents}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'hsla(187, 85%, 45%, 0.1)', color: 'var(--secondary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Ensayos Realizados</span>
            <span className="stat-value">{Object.keys(history).length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--rango-automatico-bg)', color: 'var(--rango-automatico)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Logro (Rápido +)</span>
            <span className="stat-value">{currentStats.autoPercent}%</span>
            {prevEval && (
              <span className={`stat-change ${currentStats.autoPercent >= prevStats.autoPercent ? 'up' : 'down'}`}>
                {currentStats.autoPercent >= prevStats.autoPercent ? '▲' : '▼'} {Math.abs(currentStats.autoPercent - prevStats.autoPercent)}% vs Mayo
              </span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--rango-mediano-bg)', color: 'var(--rango-mediano)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-label">Promedio de Aciertos</span>
            <span className="stat-value">{currentStats.avg}</span>
            {prevEval && (
              <span className={`stat-change ${avgImprovement >= 0 ? 'up' : 'down'}`}>
                {avgImprovement >= 0 ? '▲ +' : '▼ -'}{Math.abs(avgImprovement)} aciertos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main dashboard body */}
      <div className="dashboard-overview-grid">
        {/* Left Side: Distribution Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
              </svg>
              Distribución de Niveles de Fluidez
            </h3>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
              Ensayo: {activeEval ? activeEval.title : 'Ninguno'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '40px', padding: '10px 0' }}>
            {/* SVG Donut Chart */}
            <div style={{ width: '200px', height: '200px', position: 'relative' }}>
              <svg viewBox="-1.2 -1.2 2.4 2.4" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                {slices.length === 0 ? (
                  <circle cx="0" cy="0" r="0.8" fill="none" stroke="var(--border-color)" strokeWidth="0.3" />
                ) : (
                  slices.map((slice, i) => {
                    const [startX, startY] = getCoordinatesForPercent(slice.startPercent);
                    const [endX, endY] = getCoordinatesForPercent(slice.endPercent);
                    const largeArcFlag = slice.percent > 50 ? 1 : 0;
                    
                    // Path for thick arc ring
                    const pathData = [
                      `M ${startX * 0.8} ${startY * 0.8}`, // Move to outer ring start
                      `A 0.8 0.8 0 ${largeArcFlag} 1 ${endX * 0.8} ${endY * 0.8}`, // Arc to outer ring end
                      `L ${endX * 0.5} ${endY * 0.5}`, // Line inward
                      `A 0.5 0.5 0 ${largeArcFlag} 0 ${startX * 0.5} ${startY * 0.5}`, // Arc back inner ring
                      'Z' // Close path
                    ].join(' ');

                    return (
                      <path 
                        key={i} 
                        d={pathData} 
                        fill={slice.color} 
                        style={{ cursor: 'pointer', opacity: 0.9 }} 
                        title={`${slice.label}: ${slice.count} alumnos`}
                      />
                    );
                  })
                )}
                {/* Center cutout */}
                <circle cx="0" cy="0" r="0.45" fill="var(--bg-card)" />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <span style={{ fontSize: '26px', fontFamily: 'var(--display)', fontWeight: '800', color: 'var(--text-title)' }}>
                  {totalStudents}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Evaluados
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
              {donutData.map((d, i) => {
                const percent = Math.round(d.count / (currentStats.totalCount || 1) * 100);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', fontSize: '14px', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexGrow: 1 }}>
                      <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', backgroundColor: d.color }}></span>
                      <span style={{ fontWeight: '500', color: 'var(--text-title)' }}>{d.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>
                      <span>{d.count} {d.count === 1 ? 'alud.' : 'aluds.'}</span>
                      <span style={{ color: 'var(--text-title)', width: '40px', textAlign: 'right' }}>{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Alerts & Pedagogical suggestion */}
        <div className="dashboard-side-alerts">
          {/* Urgent attention alerts */}
          <div className="card" style={{ flexGrow: 1, marginBottom: 0 }}>
            <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '10px' }}>
              <h3 className="card-title" style={{ fontSize: '16px', color: 'var(--rango-fuera)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '18px', height: '18px' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                Foco de Apoyo Crítico
              </h3>
              <span className="badge badge-fuera" style={{ fontSize: '10px' }}>
                {alertStudents.length} rezago(s)
              </span>
            </div>

            {alertStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                ¡Excelente! Ningún alumno en rezago crítico en este ensayo.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                {alertStudents.slice(0, 4).map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-title)', fontSize: '13px', display: 'block' }}>{s.fullName}</span>
                      <span className={`badge ${s.rango.includes('Fuera') ? 'badge-fuera' : 'badge-muy-lento'}`} style={{ fontSize: '9px', padding: '2px 6px', marginTop: '2px' }}>
                        {s.rango} ({s.score} aciertos)
                      </span>
                    </div>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                      onClick={() => {
                        setSelectedStudentId(s.id);
                        setView('ficha');
                      }}
                    >
                      Ficha
                    </button>
                  </div>
                ))}
                {alertStudents.length > 4 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', display: 'block', marginTop: '4px' }}>
                    + y {alertStudents.length - 4} alumnos más en rezago.
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Pedagogical suggestion card */}
          <div className="pedagogical-tip">
            <h4>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '16px', height: '16px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.666 8.944A6 6 0 0110 3.75m.333 5.194A6 6 0 0014 3.75m-4.333 5.194A6 6 0 0010 14m.333-5.056A6 6 0 0114 14" />
              </svg>
              {recommendation.title}
            </h4>
            <p>{recommendation.desc}</p>
          </div>
        </div>
      </div>

      {/* Comparisons and historic trend */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: '20px', height: '20px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 18.375v-5.25zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-9.75zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            Avance Comparativo del Curso
          </h3>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)' }}>
            Evolución Promedios Históricos (Aciertos)
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-end', justifyContent: 'center', height: '180px', padding: '10px 0', borderBottom: '1px solid var(--border-color)', position: 'relative' }}>
            {/* Background grid lines */}
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '25%', height: '1px', borderTop: '1px dashed var(--border-color)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '50%', height: '1px', borderTop: '1px dashed var(--border-color)', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: '75%', height: '1px', borderTop: '1px dashed var(--border-color)', zIndex: 0 }}></div>
            
            {/* Diagnostic Bar (Mayo) */}
            {prevEval ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                <span style={{ fontWeight: '700', color: 'var(--text-title)', fontSize: '16px', marginBottom: '8px' }}>
                  {prevStats.avg} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>/ 60</span>
                </span>
                <div style={{
                  width: '60px',
                  height: `${(prevStats.avg / 60) * 120}px`,
                  background: 'linear-gradient(180deg, var(--text-muted) 0%, #94a3b8 100%)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}></div>
                <span style={{ fontWeight: '600', color: 'var(--text-title)', fontSize: '13px', marginTop: '8px' }}>
                  Diagnóstico (Mayo)
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', alignSelf: 'center' }}>
                Registra evaluaciones en Mayo para ver la evolución diagnóstica comparada.
              </div>
            )}
            
            {/* Active Bar */}
            {activeEval ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '16px', marginBottom: '8px' }}>
                  {currentStats.avg} <span style={{ fontSize: '11px', fontWeight: '500', color: 'var(--text-muted)' }}>/ 60</span>
                </span>
                <div style={{
                  width: '60px',
                  height: `${(currentStats.avg / 60) * 120}px`,
                  background: 'linear-gradient(180deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                  boxShadow: '0 4px 12px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.25)'
                }}></div>
                <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '13px', marginTop: '8px' }}>
                  {activeEval.title}
                </span>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', alignSelf: 'center' }}>
                No hay ensayos tomados todavía.
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
            <span>* Los puntajes corresponden a la cantidad de respuestas de cálculo mental completadas correctamente en 2 minutos.</span>
            {prevEval && currentStats.avg > prevStats.avg && (
              <span style={{ color: 'var(--rango-automatico)', fontWeight: '600' }}>
                ▲ Mejora del curso de {Math.round((currentStats.avg - prevStats.avg) / prevStats.avg * 100)}% desde el inicio.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
