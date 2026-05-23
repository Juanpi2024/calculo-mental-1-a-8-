import React, { useState, useEffect, useRef } from 'react';
import { parsedTests, getRango } from '../data/database';

export default function EvaluacionView({
  students,
  currentClass,
  testType,
  history,
  setHistory
}) {
  const [selectedTestId, setSelectedTestId] = useState('');
  const [evalMode, setEvalMode] = useState('planilla'); // 'planilla' | 'presentador' | 'practica'
  
  // Quick spreadsheet mode state
  const [scoresInput, setScoresInput] = useState({}); // { studentId: score }
  const [evalTitle, setEvalTitle] = useState('');
  const [evalDate, setEvalDate] = useState(new Date().toISOString().substring(0, 10));
  const [planillaType, setPlanillaType] = useState('tabla'); // 'tabla' | 'clic-rapido'
  const [activeStudentIdx, setActiveStudentIdx] = useState(0);

  // Presenter mode state
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [presenterRunning, setPresenterRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(120); // 2 minutes global timer
  const [timerType, setTimerType] = useState('global'); // 'global' | 'pregunta'
  const [secPerQuestion, setSecPerQuestion] = useState(5); // 5s per question
  
  // Practice mode state
  const [practiceActive, setPracticeActive] = useState(false);
  const [practiceQuestionIdx, setPracticeQuestionIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState({}); // { index: value }
  const [practiceInputVal, setPracticeInputVal] = useState('');
  const [practiceFinished, setPracticeFinished] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);

  const timerRef = useRef(null);

  // Load the test categories depending on testType and currentClass
  const getTestCategoryKey = () => {
    const gradeNum = parseInt(currentClass);
    
    if (testType === 'sumas_restas') {
      return 'sumas_restas_2_8';
    }
    
    if (testType === 'tablas') {
      if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 4) {
        return 'tablas_1_4';
      }
      return 'tablas_5_8';
    }
    
    // testType === 'multiplicacion'
    if (!isNaN(gradeNum) && gradeNum >= 1 && gradeNum <= 4) {
      // lower grades do not have separate assays, they automatically use the tables!
      return 'tablas_1_4';
    }
    return 'multiplicacion_4_8';
  };

  const activeCategoryKey = getTestCategoryKey();
  const availableTests = parsedTests[activeCategoryKey]?.tests || [];

  // Set default selected test when list changes
  useEffect(() => {
    if (availableTests.length > 0) {
      setSelectedTestId(availableTests[0].id);
      setEvalTitle(`Evaluación ${availableTests[0].title}`);
    } else {
      setSelectedTestId('');
    }
  }, [testType, currentClass]);

  const activeTest = availableTests.find(t => t.id === selectedTestId);

  // Initialize scores input when test or student roster changes
  useEffect(() => {
    const initialScores = {};
    students.forEach(s => {
      initialScores[s.id] = '';
    });
    setScoresInput(initialScores);
    setActiveStudentIdx(0);
  }, [selectedTestId, students]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // --- Sound Effects using standard HTML5 Audio Synthesis (No static files needed!) ---
  const playTone = (freq, duration, type = 'sine') => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = type;
      oscillator.frequency.value = freq;
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('AudioContext not supported or blocked by browser policies.');
    }
  };

  const playTick = () => playTone(800, 0.1);
  const playAlarm = () => {
    playTone(400, 0.3, 'sawtooth');
    setTimeout(() => playTone(300, 0.4, 'sawtooth'), 300);
  };
  const playSuccess = () => {
    playTone(523.25, 0.15); // C5
    setTimeout(() => playTone(659.25, 0.15), 120); // E5
    setTimeout(() => playTone(783.99, 0.15), 240); // G5
    setTimeout(() => playTone(1046.50, 0.4), 360); // C6
  };

  // --- Planilla Rápida Actions ---
  const handleScoreChange = (studentId, val) => {
    if (val === '') {
      setScoresInput({ ...scoresInput, [studentId]: '' });
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      setScoresInput({ ...scoresInput, [studentId]: num });
    }
  };

  const handleSaveEvaluation = (e) => {
    e.preventDefault();
    if (!activeTest) return;
    if (students.length === 0) {
      alert('Debe tener alumnos en la nómina para guardar un ensayo.');
      return;
    }
    
    // Check if at least one score is entered
    const hasScores = Object.values(scoresInput).some(s => s !== '');
    if (!hasScores) {
      alert('Ingrese los puntajes de al menos un estudiante.');
      return;
    }
    
    const newEvalId = 'eval_' + Date.now();
    const scores = {};
    
    students.forEach(s => {
      const scoreVal = scoresInput[s.id];
      scores[s.id] = {
        score: scoreVal !== '' ? parseInt(scoreVal) : '-',
        rango: scoreVal !== '' ? getRango(scoreVal, currentClass, testType) : 'Sin Datos'
      };
    });
    
    const newEvaluation = {
      id: newEvalId,
      title: evalTitle || `Ensayo ${activeTest.title}`,
      testId: selectedTestId,
      date: evalDate,
      scores
    };
    
    const updatedHistory = { ...history };
    // If it's diagnostic (Mayo) or monitoring (Septiembre) or others, save accordingly
    const isMayo = evalTitle.toLowerCase().includes('diagnóstic') || evalTitle.toLowerCase().includes('mayo');
    const isSept = evalTitle.toLowerCase().includes('monitoreo') || evalTitle.toLowerCase().includes('septiembre');
    
    if (isMayo) {
      updatedHistory['mayo'] = newEvaluation;
    } else if (isSept) {
      updatedHistory['septiembre'] = newEvaluation;
    } else {
      updatedHistory[newEvalId] = newEvaluation;
    }
    
    setHistory(updatedHistory);
    alert('¡Evaluación guardada con éxito! Ya puedes revisar el Dashboard.');
    
    // Reset form inputs
    const initialScores = {};
    students.forEach(s => {
      initialScores[s.id] = '';
    });
    setScoresInput(initialScores);
  };

  // --- Presenter Dictation Actions ---
  const startPresenter = () => {
    if (!activeTest) return;
    setPresenterRunning(true);
    playTick();
    
    if (timerType === 'global') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setPresenterRunning(false);
            playAlarm();
            return 0;
          }
          if (prev <= 6) playTick(); // beep on last 5 seconds
          return prev - 1;
        });
      }, 1000);
    } else {
      // Per question timer
      setTimeRemaining(secPerQuestion);
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Next question!
            setActiveQuestionIdx(currIdx => {
              if (currIdx + 1 >= activeTest.questions.length) {
                // Done!
                clearInterval(timerRef.current);
                setPresenterRunning(false);
                playSuccess();
                return currIdx;
              } else {
                playTick();
                setTimeRemaining(secPerQuestion);
                return currIdx + 1;
              }
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const pausePresenter = () => {
    setPresenterRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetPresenter = () => {
    pausePresenter();
    setActiveQuestionIdx(0);
    setTimeRemaining(timerType === 'global' ? 120 : secPerQuestion);
  };

  // Switch timer type
  const handleTimerTypeChange = (type) => {
    pausePresenter();
    setTimerType(type);
    setTimeRemaining(type === 'global' ? 120 : secPerQuestion);
  };

  // --- Practice Mode Actions ---
  const startPractice = () => {
    setPracticeActive(true);
    setPracticeQuestionIdx(0);
    setPracticeAnswers({});
    setPracticeInputVal('');
    setPracticeFinished(false);
    setPracticeScore(0);
    playTick();
  };

  const submitPracticeAnswer = (e) => {
    if (e) e.preventDefault();
    if (!activeTest) return;
    
    const qText = activeTest.questions[practiceQuestionIdx];
    // Formula looks like "5 x 3 ="
    // We want to calculate the correct answer
    const parts = qText.replace('=', '').trim().split(/\s+/);
    let rightAnswer = 0;
    
    if (parts.length === 3) {
      const num1 = parseInt(parts[0]);
      const op = parts[1].toLowerCase();
      const num2 = parseInt(parts[2]);
      
      if (op === 'x' || op === '*') rightAnswer = num1 * num2;
      else if (op === '+') rightAnswer = num1 + num2;
      else if (op === '-') rightAnswer = num1 - num2;
    }
    
    const studentAnswer = parseInt(practiceInputVal.trim());
    const isCorrect = studentAnswer === rightAnswer;
    
    if (isCorrect) {
      setPracticeScore(prev => prev + 1);
      playTone(600, 0.15);
    } else {
      playTone(150, 0.25, 'sawtooth');
    }
    
    setPracticeAnswers({
      ...practiceAnswers,
      [practiceQuestionIdx]: {
        question: qText,
        answer: practiceInputVal,
        correct: isCorrect,
        rightAnswer
      }
    });

    setPracticeInputVal('');
    
    if (practiceQuestionIdx + 1 >= activeTest.questions.length) {
      setPracticeFinished(true);
      playSuccess();
    } else {
      setPracticeQuestionIdx(prev => prev + 1);
    }
  };

  return (
    <div>
      {/* Test Selector and Tab Controls */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Test Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="test-select" style={{ fontWeight: '600', color: 'var(--text-title)' }}>Seleccionar Prueba:</label>
            {availableTests.length === 0 ? (
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>No hay pruebas cargadas para este nivel.</span>
            ) : (
              <select
                id="test-select"
                value={selectedTestId}
                onChange={(e) => {
                  setSelectedTestId(e.target.value);
                  const selected = availableTests.find(t => t.id === e.target.value);
                  if (selected) {
                    setEvalTitle(`Evaluación ${selected.title}`);
                  }
                }}
              >
                {availableTests.map(t => (
                  <option key={t.id} value={t.id}>{t.title} ({t.questions.length} preguntas)</option>
                ))}
              </select>
            )}
          </div>

          {/* Mode Toggles */}
          <div className="mode-toggle">
            <button
              className={`mode-toggle-btn ${evalMode === 'planilla' ? 'active' : ''}`}
              onClick={() => { setEvalMode('planilla'); resetPresenter(); setPracticeActive(false); }}
            >
              Planilla de Calificación
            </button>
            <button
              className={`mode-toggle-btn ${evalMode === 'presentador' ? 'active' : ''}`}
              onClick={() => { setEvalMode('presentador'); resetPresenter(); setPracticeActive(false); }}
            >
              Proyector / Dictador
            </button>
            <button
              className={`mode-toggle-btn ${evalMode === 'practica' ? 'active' : ''}`}
              onClick={() => { setEvalMode('practica'); resetPresenter(); setPracticeActive(false); }}
            >
              Modo Práctica Alumno
            </button>
          </div>

        </div>
      </div>

      {/* --- 1. Planilla Rápida View --- */}
      {evalMode === 'planilla' && activeTest && (
        <form onSubmit={handleSaveEvaluation}>
          {/* Selector de Teclado Táctil vs Tabla Tradicional */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: 'var(--bg-app)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', width: 'fit-content' }}>
            <button
              type="button"
              className={`mode-toggle-btn ${planillaType === 'tabla' ? 'active' : ''}`}
              onClick={() => setPlanillaType('tabla')}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}
            >
              📊 Planilla Tradicional
            </button>
            <button
              type="button"
              className={`mode-toggle-btn ${planillaType === 'clic-rapido' ? 'active' : ''}`}
              onClick={() => setPlanillaType('clic-rapido')}
              style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '4px' }}
            >
              🖱️ Teclado de Clic Rápido (Táctil)
            </button>
          </div>

          <div className="grid-cols-2" style={{ gap: '24px', alignItems: 'start', gridTemplateColumns: '2fr 1fr', display: 'grid' }}>
            
            {planillaType === 'clic-rapido' ? (
              /* Teclado Táctil Clic Rápido */
              <div className="card" style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', minHeight: '450px' }}>
                
                {/* Left Side: Student List */}
                <div style={{ borderRight: '1px solid var(--border-color)', paddingRight: '20px', maxHeight: '480px', overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: 'var(--text-title)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Lista de Alumnos</span>
                    <span className="badge badge-mediano" style={{ fontSize: '10px' }}>{students.length}</span>
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {students.map((s, idx) => {
                      const isActive = idx === activeStudentIdx;
                      const scoreVal = scoresInput[s.id] !== undefined ? scoresInput[s.id] : '';
                      const rgo = getRango(scoreVal, currentClass, testType);

                      const getBadgeClassSimple = (rg) => {
                        if (!rg) return 'badge-sin-datos';
                        const r = rg.toLowerCase();
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
                        <div
                          key={s.id}
                          type="button"
                          onClick={() => setActiveStudentIdx(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            backgroundColor: isActive ? 'var(--primary-light)' : 'var(--bg-card)',
                            border: isActive ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '16px' }}>{idx + 1}</span>
                            <span style={{ fontWeight: '600', fontSize: '13px', color: isActive ? 'var(--primary)' : 'var(--text-title)' }}>
                              {s.nombre} {s.apellido}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: 'var(--primary)' }}>
                              {scoreVal !== '' ? scoreVal : '-'}
                            </span>
                            {scoreVal !== '' && (
                              <span className={`badge ${getBadgeClassSimple(rgo)}`} style={{ fontSize: '9px', padding: '1px 4px', transform: 'scale(0.85)', originX: 'right' }}>
                                {rgo.substring(0, 4)}..
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Interactive Score Keyboard Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {students.length === 0 ? (
                    <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      Añada alumnos antes de calificar.
                    </div>
                  ) : (
                    <>
                      {/* Active Student Header */}
                      <div style={{ backgroundColor: 'var(--bg-app)', padding: '16px 20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Evaluando estudiante {activeStudentIdx + 1} de {students.length}
                        </span>
                        <h3 style={{ margin: '4px 0 10px', fontSize: '20px', fontWeight: '800', color: 'var(--text-title)' }}>
                          {students[activeStudentIdx]?.nombre} {students[activeStudentIdx]?.apellido}
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Aciertos:</span>
                            <strong style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>
                              {scoresInput[students[activeStudentIdx]?.id] !== '' && scoresInput[students[activeStudentIdx]?.id] !== undefined ? scoresInput[students[activeStudentIdx]?.id] : '-'}
                            </strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Rango Estimado:</span>
                            <span className={`badge ${
                              (() => {
                                const sc = scoresInput[students[activeStudentIdx]?.id];
                                const rg = getRango(sc, currentClass, testType);
                                if (!rg) return 'badge-sin-datos';
                                const r = rg.toLowerCase();
                                if (r.includes('auto')) return 'badge-automatico';
                                if (r.includes('muy rapido') || r.includes('muy rápido')) return 'badge-muy-rapido';
                                if (r.includes('rapido') || r.includes('rápido')) return 'badge-rapido';
                                if (r.includes('median')) return 'badge-mediano';
                                if (r.includes('muy lento')) return 'badge-muy-lento';
                                if (r.includes('lento')) return 'badge-lento';
                                if (r.includes('fuera')) return 'badge-fuera';
                                return 'badge-sin-datos';
                              })()
                            }`} style={{ padding: '4px 10px', fontSize: '12px', marginTop: '2px', display: 'inline-block' }}>
                              {getRango(scoresInput[students[activeStudentIdx]?.id], currentClass, testType) || 'Sin Datos'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Number Pad Grid */}
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                          Haz clic sobre la cantidad de respuestas correctas:
                        </span>
                        
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                          gap: '6px',
                          marginBottom: '20px'
                        }}>
                          {Array.from({ length: (activeTest.questions?.length || 30) + 1 }).map((_, num) => {
                            const studentId = students[activeStudentIdx]?.id;
                            const isSelected = scoresInput[studentId] === num;
                            
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  handleScoreChange(studentId, num);
                                  playTone(400 + num * 10, 0.1, 'sine');
                                  
                                  // Auto-advance to next student
                                  setTimeout(() => {
                                    setActiveStudentIdx(prev => {
                                      if (prev + 1 < students.length) {
                                        return prev + 1;
                                      }
                                      return prev;
                                    });
                                  }, 150);
                                }}
                                style={{
                                  padding: '10px 0',
                                  fontSize: '15px',
                                  fontWeight: '700',
                                  borderRadius: 'var(--radius-sm)',
                                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                                  color: isSelected ? 'white' : 'var(--text-title)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Manual Navigation Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setActiveStudentIdx(prev => Math.max(0, prev - 1))}
                          disabled={activeStudentIdx === 0}
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          ◀ Anterior
                        </button>
                        
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            const studentId = students[activeStudentIdx]?.id;
                            handleScoreChange(studentId, '');
                          }}
                          style={{ padding: '8px 16px', fontSize: '13px', backgroundColor: 'var(--rango-lento-bg)', color: 'var(--rango-lento)', border: 'none' }}
                        >
                          Limpiar
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setActiveStudentIdx(prev => Math.min(students.length - 1, prev + 1))}
                          disabled={activeStudentIdx + 1 >= students.length}
                          style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                          Siguiente ▶
                        </button>
                      </div>
                    </>
                  )}
                </div>

              </div>
            ) : (
              /* Table roster grade entry (Traditional Spreadsheet) */
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '20px 24px', marginBottom: 0 }}>
                  <h3 className="card-title">
                    Ingreso de Aciertos
                  </h3>
                  <span className="badge badge-mediano">
                    {students.length} alumnos
                  </span>
                </div>
                
                {students.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Añada alumnos en la pestaña <strong>Nómina de Alumnos</strong> antes de calificar.
                  </div>
                ) : (
                  <div className="table-wrapper" style={{ border: 'none', boxShadow: 'none' }}>
                  <table className="quick-edit-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Nº</th>
                        <th>Estudiante</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Aciertos</th>
                        <th style={{ width: '200px', textAlign: 'center' }}>Rango Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => {
                        const val = scoresInput[s.id] !== undefined ? scoresInput[s.id] : '';
                        const rango = getRango(val, currentClass, testType);
                        
                        const getBadgeClass = (rg) => {
                          if (!rg) return 'badge-sin-datos';
                          const r = rg.toLowerCase();
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
                          <tr key={s.id}>
                            <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-muted)' }}>{idx + 1}</td>
                            <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{s.nombre} {s.apellido}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="-"
                                value={val}
                                onChange={(e) => handleScoreChange(s.id, e.target.value)}
                              />
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`badge ${getBadgeClass(rango)}`}>
                                {rango || 'Sin Datos'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>)}

            {/* Config & Save Card */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '16px', paddingBottom: '8px' }}>
                <h3 className="card-title" style={{ fontSize: '16px' }}>
                  Guardar Evaluación
                </h3>
              </div>
              
              <div className="form-group">
                <label htmlFor="eval-title-input">Nombre de la Evaluación:</label>
                <input
                  id="eval-title-input"
                  type="text"
                  className="input-text"
                  placeholder="Ej: Ensayo Mayo 2026"
                  value={evalTitle}
                  onChange={(e) => setEvalTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="eval-date-input">Fecha:</label>
                <input
                  id="eval-date-input"
                  type="date"
                  className="input-text"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginTop: '24px', padding: '12px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-main)', marginBottom: '20px' }}>
                <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Regla de Rangos de Excel:</strong>
                Para este curso (<strong>{currentClass}</strong>), los rangos se calculan en base a la cantidad de respuestas de Cálculo Mental correctas completadas en 2 minutos.
              </div>

              <button type="submit" className="btn btn-primary w-full">
                Guardar Ensayo en Historial
              </button>
            </div>

          </div>
        </form>
      )}

      {/* --- 2. Proyector / Dictador Mode View --- */}
      {evalMode === 'presentador' && activeTest && (
        <div>
          {/* Controls toolbar */}
          <div className="card" style={{ padding: '16px 24px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Timer Config */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--border-color)', padding: '2px', borderRadius: 'var(--radius-sm)' }}>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${timerType === 'global' ? 'active' : ''}`}
                    onClick={() => handleTimerTypeChange('global')}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    2 min. Global
                  </button>
                  <button
                    type="button"
                    className={`mode-toggle-btn ${timerType === 'pregunta' ? 'active' : ''}`}
                    onClick={() => handleTimerTypeChange('pregunta')}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Por Pregunta
                  </button>
                </div>
                
                {timerType === 'pregunta' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    <label htmlFor="sec-question-input">Segundos:</label>
                    <input
                      id="sec-question-input"
                      type="number"
                      min="2"
                      max="30"
                      className="input-text"
                      value={secPerQuestion}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) {
                          setSecPerQuestion(val);
                          setTimeRemaining(val);
                        }
                      }}
                      style={{ width: '60px', padding: '4px 8px', textAlign: 'center' }}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {!presenterRunning ? (
                  <button className="btn btn-primary" onClick={startPresenter}>
                    Iniciar Dictado
                  </button>
                ) : (
                  <button className="btn btn-secondary" onClick={pausePresenter} style={{ backgroundColor: 'var(--rango-lento-bg)', color: 'var(--rango-lento)' }}>
                    Pausar
                  </button>
                )}
                
                <button className="btn btn-secondary" onClick={resetPresenter}>
                  Reiniciar
                </button>
              </div>

            </div>
          </div>

          {/* Main Presenter Screen */}
          <div className="presenter-container">
            <div className="presenter-timer ${timeRemaining <= 5 && timerType === 'pregunta' ? 'warning' : ''}">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timerType === 'global' ? (
                <span>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              ) : (
                <span>{timeRemaining} s</span>
              )}
            </div>

            <div className="presenter-question">
              {activeTest.questions[activeQuestionIdx]}
            </div>

            <div className="presenter-progress">
              <div 
                className="presenter-progress-bar"
                style={{ width: `${((activeQuestionIdx + 1) / activeTest.questions.length) * 100}%` }}
              ></div>
            </div>

            <div style={{ display: 'flex', gap: '30px', alignItems: 'center', justifyContent: 'center' }}>
              <button 
                className="btn btn-secondary btn-icon-only" 
                onClick={() => {
                  setActiveQuestionIdx(prev => Math.max(0, prev - 1));
                  if (timerType === 'pregunta') setTimeRemaining(secPerQuestion);
                }}
                disabled={activeQuestionIdx === 0}
              >
                ◀ Anterior
              </button>
              
              <span style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Pregunta {activeQuestionIdx + 1} de {activeTest.questions.length}
              </span>

              <button 
                className="btn btn-secondary btn-icon-only" 
                onClick={() => {
                  setActiveQuestionIdx(prev => Math.min(activeTest.questions.length - 1, prev + 1));
                  if (timerType === 'pregunta') setTimeRemaining(secPerQuestion);
                }}
                disabled={activeQuestionIdx + 1 >= activeTest.questions.length}
              >
                Siguiente ▶
              </button>
            </div>

            <div className="presenter-phrase">
              “Practicando llegarás a ser mejor cada día”
            </div>
          </div>
        </div>
      )}

      {/* --- 3. Modo Práctica Alumno View --- */}
      {evalMode === 'practica' && activeTest && (
        <div className="card">
          {!practiceActive ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: '28px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '12px' }}>
                Modo de Práctica Interactiva
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                Resuelve las preguntas en pantalla. Al final obtendrás tu puntaje total y la estimación del nivel alcanzado de acuerdo a los aciertos obtenidos.
              </p>
              <button className="btn btn-primary" onClick={startPractice}>
                Comenzar Práctica
              </button>
            </div>
          ) : practiceFinished ? (
            <div style={{ textAlign: 'center', padding: '40px', position: 'relative' }}>
              <div className="flex-center" style={{ flexDirection: 'column' }}>
                <div className="practice-result-circle success">
                  {practiceScore}
                </div>
                <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-title)', marginBottom: '8px' }}>
                  ¡Práctica Completada!
                </h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Has obtenido <strong>{practiceScore} aciertos</strong> de un total de {activeTest.questions.length} preguntas.
                </p>
                <span className="badge badge-automatico" style={{ padding: '8px 16px', fontSize: '14px', marginBottom: '24px' }}>
                  Rango Estimado: {getRango(practiceScore, currentClass, testType)}
                </span>
                
                <button className="btn btn-primary" onClick={startPractice}>
                  Volver a Practicar
                </button>
              </div>
            </div>
          ) : (
            <div className="practice-container">
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '12px' }}>
                <span>Pregunta {practiceQuestionIdx + 1} de {activeTest.questions.length}</span>
                <span>Aciertos: {practiceScore}</span>
              </div>
              
              <div className="practice-question-box">
                <div className="practice-equation">
                  {activeTest.questions[practiceQuestionIdx]}
                </div>
                
                <form onSubmit={submitPracticeAnswer}>
                  <input
                    type="number"
                    className="practice-input"
                    value={practiceInputVal}
                    onChange={(e) => setPracticeInputVal(e.target.value)}
                    placeholder="?"
                    autoFocus
                    required
                  />
                  <button type="submit" style={{ display: 'none' }}></button>
                </form>
              </div>

              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(practiceQuestionIdx / activeTest.questions.length) * 100}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.2s ease' }}></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
