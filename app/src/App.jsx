import React, { useState, useEffect } from 'react';
import DashboardView from './components/DashboardView';
import NominaView from './components/NominaView';
import EvaluacionView from './components/EvaluacionView';
import AlumnoFichaView from './components/AlumnoFichaView';
import { demoStudents, getDemoHistory } from './data/database';

function App() {
  // Navigation & theme states
  const [view, setView] = useState(() => localStorage.getItem('activeView') || 'dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  
  // Grade and evaluation type states
  const [currentGrade, setCurrentGrade] = useState(() => localStorage.getItem('currentGrade') || '5º');
  const [currentSection, setCurrentSection] = useState(() => localStorage.getItem('currentSection') || 'A');
  const [currentClass, setCurrentClass] = useState(() => localStorage.getItem('currentClass') || '5ºA');
  const [testType, setTestType] = useState(() => localStorage.getItem('testType') || 'multiplicacion');
  
  // Selected student state for ficha view
  const [selectedStudentId, setSelectedStudentId] = useState(() => localStorage.getItem('selectedStudentId') || null);

  // Roster and history states
  const [students, setStudents] = useState(() => {
    const savedClass = localStorage.getItem('currentClass') || '5ºA';
    const saved = localStorage.getItem(`students_${savedClass}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState(() => {
    const savedClass = localStorage.getItem('currentClass') || '5ºA';
    const savedType = localStorage.getItem('testType') || 'multiplicacion';
    const saved = localStorage.getItem(`history_${savedClass}_${savedType}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Keep theme class updated on body element
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Keep selected view and student persistent in localStorage
  useEffect(() => {
    localStorage.setItem('activeView', view);
  }, [view]);

  useEffect(() => {
    if (selectedStudentId) {
      localStorage.setItem('selectedStudentId', selectedStudentId);
    } else {
      localStorage.removeItem('selectedStudentId');
    }
  }, [selectedStudentId]);

  // Helper setters that also handle instant local storage updates to prevent race conditions
  const updateStudents = (newStudents) => {
    const value = typeof newStudents === 'function' ? newStudents(students) : newStudents;
    setStudents(value);
    localStorage.setItem(`students_${currentClass}`, JSON.stringify(value));
  };

  const updateHistory = (newHistory) => {
    const value = typeof newHistory === 'function' ? newHistory(history) : newHistory;
    setHistory(value);
    localStorage.setItem(`history_${currentClass}_${testType}`, JSON.stringify(value));
  };

  // Class selection change handler
  const handleClassChange = (newGrade, newSection) => {
    const newClass = `${newGrade}${newSection}`;
    
    // Save current states first to local storage
    localStorage.setItem(`students_${currentClass}`, JSON.stringify(students));
    localStorage.setItem(`history_${currentClass}_${testType}`, JSON.stringify(history));

    setCurrentGrade(newGrade);
    setCurrentSection(newSection);
    setCurrentClass(newClass);
    localStorage.setItem('currentGrade', newGrade);
    localStorage.setItem('currentSection', newSection);
    localStorage.setItem('currentClass', newClass);

    // Load new rosters
    const loadedStudents = localStorage.getItem(`students_${newClass}`);
    const nextStudents = loadedStudents ? JSON.parse(loadedStudents) : [];
    setStudents(nextStudents);

    // Load new histories
    const loadedHistory = localStorage.getItem(`history_${newClass}_${testType}`);
    const nextHistory = loadedHistory ? JSON.parse(loadedHistory) : {};
    setHistory(nextHistory);
    
    // Reset selected student since class changed
    setSelectedStudentId(null);
  };

  // Test Type change handler
  const handleTestTypeChange = (newType) => {
    // Save current states first
    localStorage.setItem(`students_${currentClass}`, JSON.stringify(students));
    localStorage.setItem(`history_${currentClass}_${testType}`, JSON.stringify(history));

    setTestType(newType);
    localStorage.setItem('testType', newType);

    // Load new histories
    const loadedHistory = localStorage.getItem(`history_${currentClass}_${newType}`);
    const nextHistory = loadedHistory ? JSON.parse(loadedHistory) : {};
    setHistory(nextHistory);
  };

  // Load demo data helper
  const handleLoadDemo = () => {
    updateStudents(demoStudents);
    const demoHist = getDemoHistory(currentClass, testType);
    updateHistory(demoHist);
  };

  // Page titles and subtitles mapped for consistency
  const viewTitles = {
    dashboard: 'Panel de Control',
    nomina: 'Nómina de Alumnos',
    evaluacion: 'Toma de Pruebas',
    ficha: 'Ficha del Alumno'
  };

  const viewSubtitles = {
    dashboard: `Métricas generales de desempeño y avance para el curso ${currentClass} Básico`,
    nomina: `Administración de nómina oficial de alumnos para el curso ${currentClass} Básico`,
    evaluacion: `Ingreso de puntajes oficiales, proyector de cálculo y simulaciones interactivas`,
    ficha: `Seguimiento de fluidez y ficha imprimible del estudiante`
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '28px', height: '28px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18a2.25 2.25 0 01-2.25 2.25h-6A2.25 2.25 0 015.25 18v-6a2.25 2.25 0 012.25-2.25h1.5m3 0h3a2.25 2.25 0 012.25 2.25v3.75M9 15h.008v.008H9V15zm0-2.25h.008v.008H9v-.008zM9.75 5.25h-.008V5.25h.008v.008zM12 9h.008v.008H12V9zm0-2.25h.008v.008H12v-.008zM12 4.5h.008v.008H12V4.5zm2.25 4.5h.008v.008h-.008V9zm0-2.25h.008v.008h-.008v-.008zM14.25 4.5h.008v.008h-.008V4.5zM16.5 12h.008v.008h-.008V12zm0-2.25h.008v.008h-.008V9z" />
          </svg>
          <h1>Cálculo Mental</h1>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
            </svg>
            Panel de Control
          </button>
          
          <button 
            className={`nav-item ${view === 'nomina' ? 'active' : ''}`}
            onClick={() => setView('nomina')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20c-2.202 0-4.275-.626-6.022-1.714m16.033-2.493a9.349 9.349 0 002.244-4.077m-16.033 4.077A9.349 9.349 0 014.077 11.8M15 15.75H1.5m12.428-11.95A4.75 4.75 0 0010 3.25a4.75 4.75 0 00-3.928 2.05m8.356 0A4.748 4.748 0 0115 7.75c0 1.947-1.17 3.62-2.844 4.356m-8.356-4.356A4.748 4.748 0 005 7.75c0 1.947 1.17 3.62 2.844 4.356m4.734 0a4.752 4.752 0 00-6.172 0M10.5 7.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 6a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            Nómina de Alumnos
          </button>
          
          <button 
            className={`nav-item ${view === 'evaluacion' ? 'active' : ''}`}
            onClick={() => setView('evaluacion')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-.621-.504-1.125-1.125-1.125H9.75M8.25 21h8.25c.621 0 1.125-.504 1.125-1.125V4.125c0-.621-.504-1.125-1.125-1.125H8.25c-.621 0-1.125.504-1.125 1.125v15.75c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            Toma de Pruebas
          </button>
          
          {selectedStudentId && (
            <button 
              className={`nav-item ${view === 'ficha' ? 'active' : ''}`}
              onClick={() => setView('ficha')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ficha del Alumno
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item" 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
                <span>Modo Oscuro</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21m9-9h-2.25M5.25 12H3m16.5 6.364l-1.591-1.591M6.364 6.364l-1.591-1.591m12.728 0l-1.591 1.591M6.364 18.364l-1.591 1.591M12 7.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
                </svg>
                <span>Modo Claro</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main panel content */}
      <main className="content-panel">
        <div className="header-row">
          <div className="title-group">
            <h2>{viewTitles[view]}</h2>
            <p>{viewSubtitles[view]}</p>
          </div>
          
          <div className="header-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Curso:</span>
              <select 
                value={currentGrade} 
                onChange={(e) => handleClassChange(e.target.value, currentSection)}
              >
                {["1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º"].map(g => (
                  <option key={g} value={g}>{g} Básico</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Sección:</span>
              <select 
                value={currentSection} 
                onChange={(e) => handleClassChange(currentGrade, e.target.value)}
              >
                {["A", "B"].map(s => (
                  <option key={s} value={s}>Sección {s}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Evaluación:</span>
              <select 
                value={testType} 
                onChange={(e) => handleTestTypeChange(e.target.value)}
              >
                <option value="multiplicacion">Multiplicación (Ensayos)</option>
                <option value="tablas">Tablas de Multiplicar</option>
                <option value="sumas_restas">Sumas y Restas</option>
              </select>
            </div>
          </div>
        </div>
 
        {/* View Router */}
        {view === 'dashboard' && (
          <DashboardView
            currentClass={currentClass}
            currentYear="2026"
            students={students}
            history={history}
            testType={testType}
            setView={setView}
            setSelectedStudentId={setSelectedStudentId}
          />
        )}
 
        {view === 'nomina' && (
          <NominaView
            students={students}
            setStudents={updateStudents}
            history={history}
            onLoadDemo={handleLoadDemo}
            setView={setView}
            setSelectedStudentId={setSelectedStudentId}
            currentGrade={currentGrade}
            currentSection={currentSection}
          />
        )}

        {view === 'evaluacion' && (
          <EvaluacionView
            students={students}
            currentClass={currentClass}
            testType={testType}
            history={history}
            setHistory={updateHistory}
          />
        )}

        {view === 'ficha' && (
          <AlumnoFichaView
            selectedStudentId={selectedStudentId}
            students={students}
            history={history}
            currentClass={currentClass}
            testType={testType}
            setView={setView}
          />
        )}
      </main>
    </div>
  );
}

export default App;
