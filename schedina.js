// ============================================================
// SCHEDINA.JS - VERSIONE COMPLETA CON SELEZIONE GIOCATE IN ALTO
// ============================================================

function App() {
  const initial = loadState();
  const [tab, setTab] = useState('Home');
  const [settingsTab, setSettingsTab] = useState('Temi');
  const [championships, setChampionships] = useState(initial.championships);
  const [matches, setMatches] = useState(initial.matches);
  const [theme, setTheme] = useState(initial.theme);
  const [customTheme, setCustomTheme] = useState(initial.customTheme || THEMES['Scuro Blu Notte']);
  const [selectedChamp, setSelectedChamp] = useState('Tutti');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [weatherCache, setWeatherCache] = useState({});
  const [heatmapDetailChamp, setHeatmapDetailChamp] = useState(null);
  const [fontSize, setFontSize] = useState(() => { const saved = localStorage.getItem('ft_font_size'); return saved ? parseInt(saved) : 100; });
  const [daysRange, setDaysRange] = useState(1);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [statsSubTab, setStatsSubTab] = useState('Classifica');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('ft_view_mode');
    return saved || 'pc';
  });
  const [selectedFamiglie, setSelectedFamiglie] = useState(initial.selectedFamiglie || ['dc_under','mg_casa_ospite','over']);
  
  // NUOVO STATO PER IL FILTRO ORARIO
  const [filterTime, setFilterTime] = useState('dopo_ora');

  // Effetto per caricare il meteo
  useEffect(() => {
    if (!selectedMatchId) return;
    const match = matches.find(m => m.id === selectedMatchId);
    if (!match) return;
    
    const weatherKey = `${match.campionato}_${match.data}`;
    if (weatherCache[weatherKey]) return;
    
    const loadWeather = async () => {
      try {
        const w = await fetchWeatherForMatch(match);
        if (w) {
          setWeatherCache(prev => ({ ...prev, [weatherKey]: w }));
        } else {
          setWeatherCache(prev => ({ ...prev, [weatherKey]: null }));
        }
      } catch (err) {
        console.warn('Errore meteo:', err);
        setWeatherCache(prev => ({ ...prev, [weatherKey]: null }));
      }
    };
    
    loadWeather();
  }, [selectedMatchId, matches]);

  useEffect(() => { saveState({ championships, matches, theme, customTheme, selectedFamiglie }); }, [championships, matches, theme, customTheme, selectedFamiglie]);

  useEffect(() => {
    const t = theme === 'Custom' ? customTheme : THEMES[theme] || THEMES['Scuro Blu Notte'];
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => { root.style.setProperty(`--${k.replace(/([A-Z])/g, '-$1').toLowerCase()}`, v); });
  }, [theme, customTheme]);

  const showAlert = (type, text) => { setMessage({ type, text }); setTimeout(() => setMessage(null), 5000); };
  const selectMatch = (matchId) => { setSelectedMatchId(matchId); setTab('Statistiche'); };

  const saveLocal = () => {
    const data = { championships, matches, theme, customTheme, selectedFamiglie, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    a.href = url;
    a.download = `GesssAi-${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}.json`;
    a.click();
    showAlert('success', '💾 Backup scaricato!');
  };

  const loadLocal = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.championships) setChampionships(data.championships);
        if (data.matches) setMatches(data.matches);
        if (data.theme) setTheme(data.theme);
        if (data.customTheme) setCustomTheme(data.customTheme);
        if (data.selectedFamiglie) setSelectedFamiglie(data.selectedFamiglie);
        showAlert('success', '📂 Dati caricati!');
      } catch(err) { showAlert('error', 'File non valido'); }
    };
    reader.readAsText(file);
  };

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const clearAllChampionships = () => {
    if (championships.length === 0) { showAlert('info', 'ℹ️ Non ci sono campionati da eliminare.'); return; }
    if (confirm(`⚠️ Sei sicuro di voler eliminare TUTTI i ${championships.length} campionati e tutte le ${matches.length} partite associate?`)) {
      setChampionships([]); setMatches([]);
      showAlert('success', '🗑️ Tutti i campionati e le partite sono stati resettati.');
    }
  };

  // ============================================================
  // RENDER DELL'APP
  // ============================================================

  const renderAppContent = () => {
    return (
      <div>
        <div className="header">
          <div className="header-left"><div style={{fontSize:'28px'}}></div></div>
          <div className="header-center">
            <div className="app-name">
              <span style={{color:'#e74c3c'}}>G</span><span style={{color:'#e67e22'}}>e</span>
              <span style={{color:'#f1c40f'}}>s</span><span style={{color:'#2ecc71'}}>s</span>
              <span style={{color:'#3498db'}}>s</span><span style={{color:'#9b59b6'}}>A</span>
              <span style={{color:'#e74c3c'}}>I</span><span style={{color:'#1abc9c'}}>-</span>
              <span style={{color:'#f39c12'}}>P</span><span style={{color:'#2ecc71'}}>r</span>
              <span style={{color:'#e67e22'}}>o</span>
            </div>
            <div className="subtitle">Statistiche & Trading Scommesse v3.0 - 2026</div>
          </div>
          <Clock />
        </div>

        <div className="tabs-nav">
          {MAIN_TABS.map(t => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'Home' && '🏠 '}{t === 'Palinsesto' && '📅 '}{t === 'Statistiche' && '📊 '}
              {t === 'Storico' && '📜 '}{t === 'Schedina' && '🎯 '}{t === 'Impostazioni' && '⚙️ '}{t}
            </button>
          ))}
        </div>

        <div className="container">
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
          {loading && <div className="alert alert-info">⏳ Elaborazione in corso...</div>}

          {tab === 'Home' && (
            <div>
              <HomeWidget matches={matches} onSelectMatch={selectMatch} setTab={setTab} selectedFamiglie={selectedFamiglie} />
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px'}}>
                <div><h3 style={{marginBottom: '12px'}}>📊 Statistiche Rapide</h3><div className="perf-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                  <div className="perf-card"><div className="perf-value" style={{color: 'var(--accent)'}}>{matches.filter(m => m.stato === 'Futura').length}</div><div className="perf-label">Partite Future</div></div>
                  <div className="perf-card"><div className="perf-value" style={{color: 'var(--win)'}}>{matches.filter(m => m.stato === 'Giocata').length}</div><div className="perf-label">Partite Giocate</div></div>
                  <div className="perf-card"><div className="perf-value">{championships.length}</div><div className="perf-label">Campionati</div></div>
                </div></div>
                <div><h3 style={{marginBottom: '12px'}}>🔥 Campionati Attivi</h3><div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '8px'}}>
                  {championships.map(c => { const totalMatches = matches.filter(m => m.campionato === c.name).length; const futureMatches = matches.filter(m => m.campionato === c.name && m.stato === 'Futura').length; const color = getChampColor(c.name); return <div key={c.name} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: '6px', background: 'var(--surface)', borderLeft: `3px solid ${color}`, fontSize: '13px'}}><span style={{color: color, fontWeight: 'bold', fontSize: '12px'}}>{c.name}</span><span style={{fontSize: '11px', color: 'var(--text-muted)'}}>{futureMatches} future</span></div>; })}
                  {championships.length === 0 && <div style={{textAlign: 'center', color: 'var(--text-muted)', padding: '20px', gridColumn: '1 / -1'}}>Nessun campionato importato. Vai su <b>Impostazioni → Importa Campionato</b></div>}
                </div>{championships.length > 0 && <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', textAlign: 'right'}}>📊 {championships.length} campionati • {matches.filter(m => m.stato === 'Futura').length} partite future</div>}</div>
              </div>
              <HeatmapGiocate matches={matches} championships={championships} onSelectChampionship={(champ) => setHeatmapDetailChamp(champ)} />
              {heatmapDetailChamp && <HeatmapDetailModal championship={heatmapDetailChamp} matches={matches} onClose={() => setHeatmapDetailChamp(null)} />}
              {selectedMatch && (
                <div style={{marginTop: '16px'}}>
                  <h3 style={{marginBottom: '12px', color: 'var(--accent)'}}>📊 Analisi Partita: {selectedMatch.casa} vs {selectedMatch.ospiti}</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch'}}>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}><div style={{flex: 1}}><RisultatiFrequenti teamName={selectedMatch.casa} allMatches={matches} /></div><div style={{flex: 1}}><FrequenzaGol teamName={selectedMatch.casa} allMatches={matches} /></div><div style={{flex: 1}}><IndiceAffidabilita teamName={selectedMatch.casa} allMatches={matches} /></div></div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}><div style={{flex: 1}}><RisultatiFrequenti teamName={selectedMatch.ospiti} allMatches={matches} /></div><div style={{flex: 1}}><FrequenzaGol teamName={selectedMatch.ospiti} allMatches={matches} /></div><div style={{flex: 1}}><IndiceAffidabilita teamName={selectedMatch.ospiti} allMatches={matches} /></div></div>
                  </div>
                  <AnalisiMeteo matches={matches} weatherCache={weatherCache} />
                </div>
              )}
            </div>
          )}

          {tab === 'Palinsesto' && (
            <div>
              <div style={{display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center'}}>
                <div className="form-group" style={{maxWidth: '300px', marginBottom: '0', flex: '1'}}>
                  <label>Filtra per Campionato</label>
                  <select value={selectedChamp} onChange={e => setSelectedChamp(e.target.value)}>
                    <option value="Tutti">Tutti</option>
                    {championships.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{maxWidth: '200px', marginBottom: '0', flex: '1'}}>
                  <label>Range Giorni</label>
                  <select value={daysRange} onChange={e => setDaysRange(parseInt(e.target.value))}>
                    <option value="0">Oggi (0)</option>
                    <option value="1">Oggi - Domani (0-1)</option>
                    <option value="2">Oggi - Dopodomani (0-2)</option>
                    <option value="3">Oggi - +3 giorni (0-3)</option>
                    <option value="4">Oggi - +4 giorni (0-4)</option>
                    <option value="5">Oggi - +5 giorni (0-5)</option>
                    <option value="6">Oggi - +6 giorni (0-6)</option>
                  </select>
                </div>
                
                {/* NUOVO FILTRO ORARIO */}
                <div className="form-group" style={{maxWidth: '220px', marginBottom: '0', flex: '1'}}>
                  <label>Filtro Orario</label>
                  <div style={{display: 'flex', background: 'var(--surface)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)'}}>
                    <button 
                      className={`btn ${filterTime === 'dopo_ora' ? '' : 'btn-secondary'}`}
                      onClick={() => setFilterTime('dopo_ora')}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: filterTime === 'dopo_ora' ? 'bold' : 'normal',
                        background: filterTime === 'dopo_ora' ? 'var(--accent)' : 'transparent',
                        color: filterTime === 'dopo_ora' ? '#000' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      ⏰ Dopo ora
                    </button>
                    <button 
                      className={`btn ${filterTime === 'giorno_intero' ? '' : 'btn-secondary'}`}
                      onClick={() => setFilterTime('giorno_intero')}
                      style={{
                        flex: 1,
                        padding: '4px 8px',
                        fontSize: '11px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: filterTime === 'giorno_intero' ? 'bold' : 'normal',
                        background: filterTime === 'giorno_intero' ? 'var(--accent)' : 'transparent',
                        color: filterTime === 'giorno_intero' ? '#000' : 'var(--text-muted)',
                        transition: 'all 0.2s'
                      }}
                    >
                      📅 Giorno intero
                    </button>
                  </div>
                  <div style={{fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center'}}>
                    {filterTime === 'dopo_ora' ? 'Mostra solo partite non ancora iniziate' : 'Mostra tutte le partite del giorno'}
                  </div>
                </div>
              </div>
              <h2 style={{marginBottom:'14px'}}>📅 Palinsesto - Prossimi {daysRange + 1} Giorni</h2>
              {(() => {
                try {
                  let futureMatches = matches.filter(m => m.stato === 'Futura');
                  if (selectedChamp !== 'Tutti') { 
                    futureMatches = futureMatches.filter(m => m.campionato === selectedChamp);
                  } else {
                    const todayStr = getTodayStr();
                    const maxDateStr = addDaysToDateStr(todayStr, daysRange);
                    futureMatches = futureMatches.filter(m => {
                      if (!m.data) return false;
                      const normalized = normalizeDate(m.data);
                      if (!normalized) return false;
                      return normalized >= todayStr && normalized <= maxDateStr;
                    });
                  }
                  
                  // APPLICA FILTRO ORARIO
                  if (filterTime === 'dopo_ora') {
                    const now = new Date();
                    const currentHour = now.getHours();
                    const currentMinutes = now.getMinutes();
                    const currentTotalMinutes = currentHour * 60 + currentMinutes;
                    
                    futureMatches = futureMatches.filter(m => {
                      if (!m.ora || m.ora === 'TBD' || m.ora === 'N/D') {
                        return true;
                      }
                      const timeParts = m.ora.split(':');
                      if (timeParts.length < 2) return true;
                      const matchHour = parseInt(timeParts[0], 10);
                      const matchMinutes = parseInt(timeParts[1], 10);
                      if (isNaN(matchHour) || isNaN(matchMinutes)) return true;
                      const matchTotalMinutes = matchHour * 60 + matchMinutes;
                      
                      const today = getTodayStr();
                      const matchDate = normalizeDate(m.data);
                      if (matchDate === today) {
                        return matchTotalMinutes > currentTotalMinutes;
                      }
                      return true;
                    });
                  }
                  
                  futureMatches.sort((a, b) => {
                    const dateA = normalizeDate(a.data);
                    const dateB = normalizeDate(b.data);
                    if (!dateA || !dateB) return 0;
                    return dateA.localeCompare(dateB);
                  });
                  
                  if (futureMatches.length === 0) {
                    const message = filterTime === 'dopo_ora' 
                      ? 'Nessuna partita futura disponibile per questo campionato dopo l\'orario corrente.' 
                      : 'Nessuna partita disponibile per questo campionato nella giornata selezionata.';
                    return <div className="empty-state">{message}</div>;
                  }
                  
                  return <div className="matches-grid">{futureMatches.map(m => { 
                    const weatherKey = `${m.campionato}_${m.data}`; 
                    const weather = weatherCache[weatherKey] || null; 
                    return <MatchTab key={m.id} match={m} allMatches={matches} onSelect={selectMatch} selectedFamiglie={selectedFamiglie} weatherData={weather} />; 
                  })}</div>;
                  
                } catch (e) { 
                  console.error('Errore rendering Palinsesto:', e); 
                  return <div className="empty-state">Errore nel caricamento delle partite: {e.message}</div>; 
                }
              })()}
            </div>
          )}

          {tab === 'Statistiche' && (
            <div>
              <div className="sub-tabs">
                <button className={statsSubTab === 'Classifica' ? 'active' : ''} onClick={() => setStatsSubTab('Classifica')}>📊 Classifica</button>
                <button className={statsSubTab === 'Scontri' ? 'active' : ''} onClick={() => setStatsSubTab('Scontri')}>⚔️ Scontri</button>
                <button className={statsSubTab === 'Analisi' ? 'active' : ''} onClick={() => setStatsSubTab('Analisi')}>📈 Analisi Avanzata</button>
              </div>
              {statsSubTab === 'Classifica' && (
                <div className="stats-two-col">
                  <div>{selectedMatch ? <MatchDetail match={selectedMatch} allMatches={matches} /> : <div className="stats-placeholder"><p>👈 Seleziona una partita dal <b>Palinsesto</b> o dallo <b>Storico</b> per vedere le statistiche dettagliate.</p></div>}</div>
                  <div>{selectedMatch ? <><h3 style={{marginBottom:'12px', color: getChampColor(selectedMatch.campionato)}}>Classifica - {selectedMatch.campionato}</h3><Standings matches={matches} filterChampionship={selectedMatch.campionato} highlightTeams={[selectedMatch.casa, selectedMatch.ospiti]} /></> : <div className="stats-placeholder"><p>📊 Seleziona una partita per vedere la classifica.</p></div>}</div>
                </div>
              )}
              {statsSubTab === 'Scontri' && (
                <div>{selectedMatch ? <div className="stats-two-col" style={{ gridTemplateColumns: '1fr 1fr' }}><TeamMatchesHistory teamName={selectedMatch.casa} championship={selectedMatch.campionato} allMatches={matches} /><TeamMatchesHistory teamName={selectedMatch.ospiti} championship={selectedMatch.campionato} allMatches={matches} /></div> : <div className="stats-placeholder"><p>👈 Seleziona una partita per vedere lo storico delle due squadre.</p></div>}</div>
              )}
              {statsSubTab === 'Analisi' && (
                <div>
                  {selectedMatch ? (
                    <div>
                      {(() => {
                        const city = getCityForMatch(selectedMatch.casa, selectedMatch.campionato);
                        const weatherKey = `${selectedMatch.campionato}_${selectedMatch.data}`;
                        const weather = weatherCache[weatherKey] || null;
                        return <WeatherProfessionale weatherData={weather} city={city} matchDate={selectedMatch.data} />;
                      })()}
                      
                      <div className="analisi-compact">
                        <div>
                          <RisultatiFrequenti teamName={selectedMatch.casa} allMatches={matches} />
                          <FrequenzaGol teamName={selectedMatch.casa} allMatches={matches} />
                          <IndiceAffidabilita teamName={selectedMatch.casa} allMatches={matches} />
                        </div>
                        <div>
                          <RisultatiFrequenti teamName={selectedMatch.ospiti} allMatches={matches} />
                          <FrequenzaGol teamName={selectedMatch.ospiti} allMatches={matches} />
                          <IndiceAffidabilita teamName={selectedMatch.ospiti} allMatches={matches} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <AnalisiMeteo matches={matches} weatherCache={weatherCache} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <AIAnalysis 
                            match={selectedMatch} 
                            allMatches={matches} 
                            selectedFamiglie={selectedFamiglie}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="stats-placeholder">
                      <p>👈 Seleziona una partita per vedere l'analisi avanzata.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'Storico' && (
            <div>
              <h2 style={{marginBottom:'14px'}}>📜 Storico Partite Giocate</h2>
              <div className="form-group">
                <label>Filtra per Campionato</label>
                <select value={selectedChamp} onChange={e => setSelectedChamp(e.target.value)}>
                  <option>Tutti</option>
                  {championships.map(c => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
              {(() => {
                let playedMatches = matches.filter(m => {
                  if (m.stato === 'Giocata') return true;
                  if (m.stato === 'Futura' && isDatePassed(m.data)) return true;
                  return false;
                });
                
                if (selectedChamp !== 'Tutti') { 
                  playedMatches = playedMatches.filter(m => m.campionato === selectedChamp); 
                }
                
                playedMatches.sort((a, b) => {
                  const dateA = normalizeDate(a.data);
                  const dateB = normalizeDate(b.data);
                  if (!dateA || !dateB) return 0;
                  return dateB.localeCompare(dateA);
                });
                
                if (playedMatches.length === 0) { 
                  return <div className="empty-state">Nessuna partita giocata o con data passata.</div>; 
                }
                
                const senzaRisultato = playedMatches.filter(m => m.stato === 'Futura' && isDatePassed(m.data));
                
                return (
                  <div>
                    {senzaRisultato.length > 0 && (
                      <div className="alert alert-info" style={{marginBottom:'12px'}}>
                        ⚠️ {senzaRisultato.length} partita/e hanno data passata ma non hanno risultato.
                      </div>
                    )}
                    <div className="matches-grid">
                      {playedMatches.map(m => <MatchTabHistory key={m.id} match={m} onSelect={selectMatch} />)}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {tab === 'Schedina' && (
            <div>
              {window.SchedinaComponent ? (
                <window.SchedinaComponent 
                  matches={matches} 
                  championships={championships}
                  selectedFamiglie={selectedFamiglie}
                  onSelectMatch={selectMatch}
                  showAlert={showAlert}
                />
              ) : (
                <div className="alert alert-info">⏳ Caricamento modulo Schedina... Assicurati che il file <b>schedina.js</b> sia presente nella stessa cartella.</div>
              )}
            </div>
          )}

          {tab === 'Impostazioni' && (
            <div>
              <div className="tabs-sub">
                {SETTINGS_TABS.map(t => <button key={t} className={settingsTab === t ? 'active' : ''} onClick={() => setSettingsTab(t)}>{t === 'Temi' && '🎨 '}{t === 'Dati Locali' && '💾 '}{t === 'Importa Campionato' && '📥 '}{t === 'Giocate' && '🎯 '}{t === 'Grandezza Caratteri' && '📏 '}{t === 'Città Meteo' && '🌍 '}{t === 'Visuale' && '📱 '}{t}</button>)}
              </div>
              {settingsTab === 'Temi' && (
                <div>
                  <h3 style={{marginBottom:'12px'}}>🎨 Scegli un Tema</h3>
                  <div className="theme-grid">
                    {Object.entries(THEMES).map(([name, t]) => <div key={name} className={`theme-card ${theme === name ? 'active' : ''}`} style={{background: t.card, color: t.text, borderColor: theme === name ? t.accent : t.border}} onClick={() => setTheme(name)}><div className="theme-name" style={{color: t.accent}}>{name}</div><div style={{display:'flex', gap:'4px', justifyContent:'center', marginTop:'6px'}}><div style={{width:'20px',height:'20px',background:t.bg,borderRadius:'50%'}}></div><div style={{width:'20px',height:'20px',background:t.accent,borderRadius:'50%'}}></div><div style={{width:'20px',height:'20px',background:t.text,borderRadius:'50%'}}></div></div></div>)}
                    <div className={`theme-card ${theme === 'Custom' ? 'active' : ''}`} style={{background: customTheme.card, color: customTheme.text, borderColor: theme === 'Custom' ? customTheme.accent : customTheme.border}} onClick={() => setTheme('Custom')}><div className="theme-name" style={{color: customTheme.accent}}>🎨 Custom</div></div>
                  </div>
                  {theme === 'Custom' && <div className="card" style={{marginTop:'20px'}}><h3 style={{marginBottom:'12px'}}>Personalizza Colori</h3>{[['Sfondo','bg'],['Superficie','surface'],['Card','card'],['Banner','banner'],['Testo','text'],['Testo Muted','textMuted'],['Accento','accent'],['Accento 2','accent2'],['Bordo','border']].map(([label, key]) => <div key={key} className="color-picker-row"><input type="color" value={customTheme[key]} onChange={e => setCustomTheme({ ...customTheme, [key]: e.target.value })} /><span>{label}</span></div>)}</div>}
                </div>
              )}
              {settingsTab === 'Dati Locali' && (
                <div>
                  <h3 style={{marginBottom:'12px'}}>💾 Salvataggio / Caricamento</h3>
                  <div className="card">
                    <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px'}}>
                      <button className="btn" onClick={saveLocal}>💾 Scarica Backup JSON</button>
                    </div>
                    <p style={{marginBottom:'12px'}}>I dati vengono salvati automaticamente in localStorage.</p>
                    <hr style={{margin:'14px 0', borderColor:'var(--border)'}}/>
                    <label style={{display:'block', marginBottom:'6px'}}>📂 Carica Backup JSON</label>
                    <input type="file" accept=".json" onChange={e => e.target.files[0] && loadLocal(e.target.files[0])} />
                    <hr style={{margin:'14px 0', borderColor:'var(--border)'}}/>
                    <button className="btn btn-danger" onClick={() => { if (confirm('Vuoi davvero resettare TUTTI i dati?')) { localStorage.clear(); setChampionships([]); setMatches([]); showAlert('success', '🗑️ Dati resettati completamente.'); } }}>🗑️ Reset Completo</button>
                  </div>
                </div>
              )}
              {settingsTab === 'Importa Campionato' && (
                <div>
                  <h3 style={{marginBottom:'12px'}}>📥 Importa Campionato</h3>
                  <div className="sub-tabs" style={{marginBottom:'16px'}}>
                    <button className="active" onClick={() => {}}>📁 File</button>
                  </div>
                  <FileImporter 
                    matches={matches} 
                    setMatches={setMatches} 
                    championships={championships} 
                    setChampionships={setChampionships} 
                    loading={loading} 
                    setLoading={setLoading} 
                    showAlert={showAlert} 
                  />
                  <hr style={{borderColor:'var(--border)', margin:'20px 0'}}/>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'20px 0 12px', flexWrap:'wrap', gap:'10px'}}>
                    <h3 style={{margin:0}}>📋 Campionati Importati</h3>
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
                      <button className="btn btn-danger" onClick={clearAllChampionships}>🗑️ Elimina Tutti</button>
                    </div>
                  </div>
                  {championships.length === 0 ? <div className="empty-state">Nessun campionato importato.</div> : (
                    <div className="champ-list">
                      {championships.map(c => {
                        const totalMatches = matches.filter(m => m.campionato === c.name).length;
                        const futureMatches = matches.filter(m => m.campionato === c.name && m.stato === 'Futura').length;
                        const playedMatches = matches.filter(m => m.campionato === c.name && m.stato === 'Giocata').length;
                        return (
                          <div key={c.name} className="champ-item" style={{borderLeft: `4px solid ${getChampColor(c.name)}`, paddingLeft:'12px'}}>
                            <div><b>{c.name}</b><div style={{fontSize:'11px', color:'var(--text-muted)'}}>{totalMatches} partite ({futureMatches} future, {playedMatches} giocate) <span style={{marginLeft:'8px', fontSize:'10px', color:'var(--text-muted)'}}>📅 {new Date(c.importedAt).toLocaleDateString()}</span></div></div>
                            <button className="btn btn-danger" onClick={() => { if (confirm(`Eliminare ${c.name} e tutte le sue partite?`)) { setChampionships(championships.filter(x => x.name !== c.name)); setMatches(matches.filter(m => m.campionato !== c.name)); } }}>🗑️ Elimina</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              {settingsTab === 'Giocate' && (
                <div>
                  <FamiglieSelector selectedFamiglie={selectedFamiglie} setSelectedFamiglie={setSelectedFamiglie} showAlert={showAlert} />
                </div>
              )}
              {settingsTab === 'Grandezza Caratteri' && (
                <div>
                  <div className="card">
                    <h3 style={{marginBottom: '12px'}}>📏 Grandezza Caratteri</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'}}>
                      <button className="btn btn-secondary" onClick={() => setFontSize(prev => Math.max(70, prev - 5))} style={{fontSize: '18px', fontWeight: 'bold', padding: '8px 16px', minWidth: '44px', minHeight: '44px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer'}}>−</button>
                      <div style={{flex: 1, minWidth: '150px'}}>
                        <input type="range" min="70" max="150" step="5" value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} style={{width: '100%', accentColor: 'var(--accent)', height: '6px', borderRadius: '3px', background: 'var(--surface)', cursor: 'pointer'}} />
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px'}}><span>70%</span><span style={{fontWeight: 'bold', color: 'var(--accent)'}}>{fontSize}%</span><span>150%</span></div>
                      </div>
                      <button className="btn btn-secondary" onClick={() => setFontSize(prev => Math.min(150, prev + 5))} style={{fontSize: '18px', fontWeight: 'bold', padding: '8px 16px', minWidth: '44px', minHeight: '44px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer'}}>+</button>
                      <button className="btn btn-secondary" onClick={() => setFontSize(100)} style={{fontSize: '12px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer'}}>🔄 Reset (100%)</button>
                    </div>
                    <div style={{marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px'}}>
                      <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}><span>📱 <b>Consigliato:</b> 100% (PC) / 110-120% (Mobile)</span><span>💡 La modifica si applica immediatamente a tutta l'app</span></div>
                      <div style={{marginTop: '6px', padding: '8px 12px', borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', fontSize: `${fontSize}%`, transition: 'font-size 0.2s'}}><span style={{fontWeight: 'bold'}}>Anteprima:</span> Questo è un testo di esempio alla dimensione <b>{fontSize}%</b></div>
                    </div>
                  </div>
                </div>
              )}
              {settingsTab === 'Città Meteo' && (
                <div>
                  <CittaMeteo matches={matches} />
                </div>
              )}
              {settingsTab === 'Visuale' && (
                <div className="card">
                  <h3 style={{marginBottom: '12px'}}>📱 Cambia Visuale</h3>
                  <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
                    <button 
                      className={`btn ${viewMode === 'pc' ? '' : 'btn-secondary'}`} 
                      onClick={() => {
                        setViewMode('pc');
                        localStorage.setItem('ft_view_mode', 'pc');
                        setTimeout(() => window.scrollTo(0, 0), 100);
                      }} 
                      style={{flex: 1, minWidth: '120px'}}
                    >
                      🖥️ PC
                    </button>
                    <button 
                      className={`btn ${viewMode === 'mobile' ? '' : 'btn-secondary'}`} 
                      onClick={() => {
                        setViewMode('mobile');
                        localStorage.setItem('ft_view_mode', 'mobile');
                        setTimeout(() => window.scrollTo(0, 0), 100);
                      }} 
                      style={{flex: 1, minWidth: '120px'}}
                    >
                      📱 Telefono
                    </button>
                  </div>
                  <div style={{marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)'}}>
                    Modalità attuale: <b>{viewMode === 'pc' ? '🖥️ PC' : '📱 Telefono'}</b>
                  </div>
                  <div style={{marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)'}}>
                    {viewMode === 'mobile' 
                      ? '✅ La visuale è ottimizzata per schermi piccoli. Il contenuto si adatta automaticamente.'
                      : '✅ Visuale ottimizzata per schermi grandi. Massima visibilità dei dati.'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DISCLAIMER COMMERCIALE */}
        <div className="disclaimer-footer">
          <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
            <span style={{fontSize: '24px'}}>⚠️</span>
            <div style={{flex: 1}}>
              <p style={{margin: '0 0 6px 0'}}>
                <strong>⚠️ Disclaimer - Utilizzo in Centro Scommesse</strong>
              </p>
              <p style={{margin: '0 0 4px 0'}}>
                Questa applicazione fornisce analisi statistiche a <strong>solo scopo informativo</strong>. 
                I dati provengono da <strong>file caricati dall'utente</strong> (XLSX/CSV). 
                Le percentuali e i pronostici sono <strong>elaborazioni matematiche non vincolanti</strong>.
              </p>
              <p style={{margin: '0 0 4px 0'}}>
                <span className="highlight">⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.</span>
              </p>
              <p style={{margin: '0', fontSize: '10px', color: 'var(--text-muted)'}}>
                I loghi e i nomi delle squadre sono di proprietà dei rispettivi titolari. 
                L'uso commerciale dei dati richiede licenza specifica.
              </p>
            </div>
          </div>
        </div>

        <button 
          className="home-btn-overlay" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          title="Torna su"
        >
          🏠
        </button>
      </div>
    );
  };

  // Se la modalità è mobile, mostriamo l'app dentro il simulatore
  if (viewMode === 'mobile') {
    return (
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', minHeight: '100vh', background: '#0a0a1a'}}>
        <div className="phone-simulator">
          <div className="phone-notch">
            <div className="notch-speaker"></div>
            <div className="notch-camera"></div>
          </div>
          <div className="phone-screen">
            <div className="phone-scroll" style={{paddingTop: '32px'}}>
              {renderAppContent()}
            </div>
            <div className="phone-home-indicator"></div>
          </div>
        </div>
      </div>
    );
  }

  // Modalità PC - rendering normale
  return renderAppContent();
}

// ============================================================
// COMPONENTE SCHEDINA - CON SELEZIONE GIOCATE IN ALTO
// ============================================================

const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
  const [campionatoSelezionato, setCampionatoSelezionato] = useState('Tutti');
  const [partiteSelezionate, setPartiteSelezionate] = useState([]);
  const [filtroOrario, setFiltroOrario] = useState('dopo_ora');
  const [giorniRange, setGiorniRange] = useState(1);
  const [schedinaCreata, setSchedinaCreata] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // STATO PER LA GIOCATA SELEZIONATA (UNA SOLA)
  const [giocataSelezionata, setGiocataSelezionata] = useState('tutte');

  // Funzione per ottenere le partite "future" con filtro orario
  const getPartiteFutureConFiltro = useCallback(() => {
    const todayStr = getTodayStr();
    const maxDateStr = addDaysToDateStr(todayStr, giorniRange);
    
    let futureMatches = matches.filter(m => m.stato === 'Futura');
    
    if (campionatoSelezionato !== 'Tutti') {
      futureMatches = futureMatches.filter(m => m.campionato === campionatoSelezionato);
    }
    
    futureMatches = futureMatches.filter(m => {
      if (!m.data) return false;
      const normalized = normalizeDate(m.data);
      if (!normalized) return false;
      return normalized >= todayStr && normalized <= maxDateStr;
    });
    
    if (filtroOrario === 'dopo_ora') {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      
      futureMatches = futureMatches.filter(m => {
        if (!m.ora || m.ora === 'TBD' || m.ora === 'N/D') {
          return true;
        }
        const timeParts = m.ora.split(':');
        if (timeParts.length < 2) return true;
        const matchHour = parseInt(timeParts[0], 10);
        const matchMinutes = parseInt(timeParts[1], 10);
        if (isNaN(matchHour) || isNaN(matchMinutes)) return true;
        const matchTotalMinutes = matchHour * 60 + matchMinutes;
        
        const matchDate = normalizeDate(m.data);
        if (matchDate === todayStr) {
          return matchTotalMinutes > currentTotalMinutes;
        }
        return true;
      });
    }
    
    futureMatches.sort((a, b) => {
      const dateA = normalizeDate(a.data);
      const dateB = normalizeDate(b.data);
      if (!dateA || !dateB) return 0;
      return dateA.localeCompare(dateB);
    });
    
    return futureMatches;
  }, [matches, campionatoSelezionato, giorniRange, filtroOrario]);

  // Calcola la giocata per una partita in base al filtro selezionato
  const calcolaGiocataPerPartita = (match) => {
    const stats = computeMatchStats(match, matches);
    if (stats.error) return { giocata: null, pct: 0, score: 0 };
    
    stats._allMatches = matches;
    stats._homeTeam = match.casa;
    stats._awayTeam = match.ospiti;
    
    const homeMG = stats.homeMG || {};
    const awayMG = stats.awayMG || {};
    const mgTot = stats.mgTot || {};
    const homeRange = getMultigolRange(match.casa, matches);
    const awayRange = getMultigolRange(match.ospiti, matches);
    
    let migliorGiocata = null;
    let migliorPct = 0;
    let tutteGiocate = [];
    
    // Se "tutte", prendi la migliore tra TUTTE le famiglie
    if (giocataSelezionata === 'tutte') {
      // Considera TUTTE le famiglie
      Object.keys(FAMIGLIE_GIOCATE).forEach(familyId => {
        const best = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
        if (best && best.pct > migliorPct) {
          migliorPct = best.pct;
          migliorGiocata = {
            ...best,
            familyId: familyId,
            familyLabel: FAMIGLIE_GIOCATE[familyId].label,
            familyIcon: FAMIGLIE_GIOCATE[familyId].icon
          };
        }
      });
    } else {
      // Usa la famiglia specifica selezionata
      const best = getBestBetForFamily(giocataSelezionata, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
      if (best && best.pct > 0) {
        migliorPct = best.pct;
        migliorGiocata = {
          ...best,
          familyId: giocataSelezionata,
          familyLabel: FAMIGLIE_GIOCATE[giocataSelezionata]?.label || giocataSelezionata,
          familyIcon: FAMIGLIE_GIOCATE[giocataSelezionata]?.icon || '🎯'
        };
      }
    }
    
    // Calcola lo score (media di tutte le famiglie selezionate dall'utente)
    let score = 0;
    let giocatePct = [];
    selectedFamiglie.forEach(familyId => {
      const best = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
      if (best && best.pct > 0) {
        giocatePct.push(best.pct);
      }
    });
    if (giocatePct.length > 0) {
      score = Math.round(giocatePct.reduce((s, g) => s + g, 0) / giocatePct.length);
    }
    
    return { 
      giocata: migliorGiocata,
      pct: migliorPct,
      score: score
    };
  };

  // Ottieni le partite con le loro giocate calcolate
  const getPartiteConGiocate = useCallback(() => {
    const partite = getPartiteFutureConFiltro();
    return partite.map(m => {
      const dettagli = calcolaGiocataPerPartita(m);
      return {
        ...m,
        giocata: dettagli.giocata,
        pct: dettagli.pct,
        score: dettagli.score
      };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);
  }, [getPartiteFutureConFiltro, giocataSelezionata]);

  const partiteDisponibili = getPartiteConGiocate();

  // Seleziona automaticamente le migliori N partite
  const selezionaMiglioriPartite = (n) => {
    const migliori = partiteDisponibili.slice(0, n);
    setPartiteSelezionate(migliori);
    showAlert('success', `✅ Selezionate ${migliori.length} migliori partite!`);
  };

  // Aggiungi/Rimuovi una partita dalla selezione
  const togglePartita = (match) => {
    setPartiteSelezionate(prev => {
      const exists = prev.find(m => m.id === match.id);
      if (exists) {
        return prev.filter(m => m.id !== match.id);
      } else {
        if (prev.length >= 6) {
          showAlert('error', '⚠️ Massimo 6 partite per schedina!');
          return prev;
        }
        return [...prev, match];
      }
    });
  };

  // Calcola il totale delle percentuali
  const calcolaTotalePercentuali = () => {
    let total = 0;
    partiteSelezionate.forEach(m => {
      total += m.pct || 0;
    });
    return partiteSelezionate.length > 0 ? Math.round(total / partiteSelezionate.length) : 0;
  };

  // Crea la schedina
  const creaSchedina = () => {
    if (partiteSelezionate.length < 2) {
      showAlert('error', '⚠️ Seleziona almeno 2 partite per creare la schedina!');
      return;
    }
    
    setLoading(true);
    
    const schedina = partiteSelezionate.map(m => {
      // Ricalcola la giocata per essere sicuri
      const dettagli = calcolaGiocataPerPartita(m);
      return {
        ...m,
        giocata: dettagli.giocata,
        pct: dettagli.pct,
        score: dettagli.score
      };
    });
    
    const totaleScore = schedina.reduce((s, m) => s + (m.pct || 0), 0);
    const mediaScore = Math.round(totaleScore / schedina.length);
    
    setSchedinaCreata({
      partite: schedina,
      totale: totaleScore,
      media: mediaScore,
      numPartite: schedina.length,
      data: new Date().toISOString(),
      giocataSelezionata: giocataSelezionata
    });
    
    setLoading(false);
    showAlert('success', `🎯 Schedina creata! Media score: ${mediaScore}%`);
  };

  const resettaSchedina = () => {
    setPartiteSelezionate([]);
    setSchedinaCreata(null);
    showAlert('info', '🔄 Schedina resettata');
  };

  // Lista delle famiglie disponibili per la selezione
  const famiglieDisponibili = [
    { id: 'tutte', label: '⭐ Tutte', icon: '⭐' },
    ...Object.entries(FAMIGLIE_GIOCATE).map(([id, family]) => ({
      id: id,
      label: family.label,
      icon: family.icon
    }))
  ];

  // Render del componente
  return (
    <div className="schedina-container">
      <div className="card" style={{marginBottom: '16px'}}>
        <h3 style={{color: 'var(--accent)', marginBottom: '12px'}}>🎯 Crea Schedina</h3>
        
        {/* FILTRI - IDENTICI AL PALINSESTO */}
        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px'}}>
          <div className="form-group" style={{maxWidth: '250px', marginBottom: '0', flex: '1'}}>
            <label>Campionato</label>
            <select value={campionatoSelezionato} onChange={e => setCampionatoSelezionato(e.target.value)}>
              <option value="Tutti">Tutti</option>
              {championships.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          
          <div className="form-group" style={{maxWidth: '180px', marginBottom: '0', flex: '1'}}>
            <label>Range Giorni</label>
            <select value={giorniRange} onChange={e => setGiorniRange(parseInt(e.target.value))}>
              <option value="0">Oggi (0)</option>
              <option value="1">Oggi - Domani (0-1)</option>
              <option value="2">Oggi - Dopodomani (0-2)</option>
              <option value="3">Oggi - +3 (0-3)</option>
              <option value="5">Oggi - +5 (0-5)</option>
              <option value="7">Oggi - +7 (0-7)</option>
            </select>
          </div>
          
          <div className="form-group" style={{maxWidth: '220px', marginBottom: '0', flex: '1'}}>
            <label>Filtro Orario</label>
            <div style={{display: 'flex', background: 'var(--surface)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border)'}}>
              <button 
                className={`btn ${filtroOrario === 'dopo_ora' ? '' : 'btn-secondary'}`}
                onClick={() => setFiltroOrario('dopo_ora')}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: filtroOrario === 'dopo_ora' ? 'bold' : 'normal',
                  background: filtroOrario === 'dopo_ora' ? 'var(--accent)' : 'transparent',
                  color: filtroOrario === 'dopo_ora' ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                ⏰ Dopo ora
              </button>
              <button 
                className={`btn ${filtroOrario === 'giorno_intero' ? '' : 'btn-secondary'}`}
                onClick={() => setFiltroOrario('giorno_intero')}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: filtroOrario === 'giorno_intero' ? 'bold' : 'normal',
                  background: filtroOrario === 'giorno_intero' ? 'var(--accent)' : 'transparent',
                  color: filtroOrario === 'giorno_intero' ? '#000' : 'var(--text-muted)',
                  transition: 'all 0.2s'
                }}
              >
                📅 Giorno intero
              </button>
            </div>
            <div style={{fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center'}}>
              {filtroOrario === 'dopo_ora' ? 'Solo partite non ancora iniziate' : 'Tutte le partite del giorno'}
            </div>
          </div>
        </div>
        
        {/* SELEZIONE GIOCATE - BOTTONI IN ALTO */}
        <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', padding: '10px 14px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px'}}>
            <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text)'}}>🎯 Giocata:</span>
          </div>
          {famiglieDisponibili.map(f => {
            const isSelected = giocataSelezionata === f.id;
            return (
              <button 
                key={f.id}
                onClick={() => setGiocataSelezionata(f.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--accent)' : 'var(--card)',
                  color: isSelected ? '#000' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 20px rgba(243, 156, 18, 0.3)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                {f.icon} {f.label}
                {isSelected && ' ⭐'}
              </button>
            );
          })}
          <div style={{marginLeft: 'auto', fontSize: '11px', color: 'var(--text-muted)'}}>
            {giocataSelezionata === 'tutte' ? '⭐ Migliore tra tutte le famiglie' : `📊 ${FAMIGLIE_GIOCATE[giocataSelezionata]?.label || ''}`}
          </div>
        </div>
        
        {/* STATISTICHE */}
        <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '6px'}}>
          <span>📊 <b>{partiteDisponibili.length}</b> partite disponibili</span>
          <span>⭐ Media score: <b style={{color: 'var(--accent)'}}>
            {partiteDisponibili.length > 0 ? Math.round(partiteDisponibili.reduce((s, m) => s + m.score, 0) / partiteDisponibili.length) : 0}%
          </b></span>
          <span>🎯 Selezionate: <b style={{color: 'var(--win)'}}>{partiteSelezionate.length}</b></span>
          <span>📊 Giocata: <b style={{color: 'var(--accent)'}}>
            {giocataSelezionata === 'tutte' ? '⭐ Tutte (miglior %)' : FAMIGLIE_GIOCATE[giocataSelezionata]?.label || ''}
          </b></span>
        </div>
        
        {/* PULSANTI */}
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <button className="btn" onClick={() => selezionaMiglioriPartite(3)}>
            ⚡ Seleziona Top 3
          </button>
          <button className="btn" onClick={() => selezionaMiglioriPartite(5)}>
            ⚡ Seleziona Top 5
          </button>
          <button className="btn btn-secondary" onClick={() => selezionaMiglioriPartite(partiteDisponibili.length)}>
            📋 Seleziona Tutte
          </button>
          <button className="btn btn-secondary" onClick={resettaSchedina}>
            🗑️ Resetta
          </button>
          <button className="btn" onClick={creaSchedina} disabled={partiteSelezionate.length < 2 || loading} style={{marginLeft: 'auto'}}>
            {loading ? '⏳ Creazione...' : `🎯 Calcolo Partite (${partiteSelezionate.length})`}
          </button>
        </div>
        
        <div style={{marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)'}}>
          💡 Seleziona una giocata in alto. Clicca su una partita per selezionarla/deselezionarla. Max 6 partite.
        </div>
      </div>
      
      {/* LISTA PARTITE CON UNA SOLA GIOCATA */}
      <div className="card" style={{marginTop: '12px'}}>
        <h4 style={{marginBottom: '8px'}}>📋 Partite Disponibili</h4>
        {partiteDisponibili.length === 0 ? (
          <div className="empty-state">
            {filtroOrario === 'dopo_ora' 
              ? 'Nessuna partita futura disponibile dopo l\'orario corrente.' 
              : 'Nessuna partita disponibile per i filtri selezionati.'}
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {partiteDisponibili.map(m => {
              const isSelected = partiteSelezionate.some(p => p.id === m.id);
              
              return (
                <div 
                  key={m.id}
                  onClick={() => togglePartita(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: isSelected ? 'rgba(243, 156, 18, 0.08)' : 'var(--surface)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}
                >
                  {/* Data e Ora */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px'}}>
                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                      {formatDateEU(m.data)}
                    </span>
                    <span style={{fontSize: '10px', color: 'var(--text-muted)'}}>
                      {m.ora && m.ora !== 'TBD' ? m.ora : ''}
                    </span>
                  </div>
                  
                  {/* Campionato */}
                  <div style={{fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px'}}>
                    {m.campionato}
                  </div>
                  
                  {/* Partita */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '150px'}}>
                    <span style={{fontWeight: 'bold', fontSize: '13px', color: 'var(--text)'}}>
                      {m.casa} vs {m.ospiti}
                    </span>
                  </div>
                  
                  {/* Giocata scelta */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px', justifyContent: 'center'}}>
                    {m.giocata ? (
                      <>
                        <span style={{fontSize: '11px', color: 'var(--accent)', fontWeight: 'bold'}}>
                          {m.giocata.familyIcon} {m.giocata.label}
                        </span>
                        <span className={`giocata-pct ${getPercentualeClasse(m.pct)}`} style={{fontSize: '12px', padding: '2px 8px'}}>
                          {m.pct}%
                        </span>
                        {m.giocata.isBomb && <span style={{fontSize: '14px'}}>💣</span>}
                      </>
                    ) : (
                      <span style={{fontSize: '10px', color: 'var(--text-muted)'}}>N/D</span>
                    )}
                  </div>
                  
                  {/* Score */}
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', minWidth: '50px', justifyContent: 'flex-end'}}>
                    <span className={`giocata-pct ${getPercentualeClasse(m.score)}`} style={{fontSize: '13px', padding: '2px 10px'}}>
                      {m.score}%
                    </span>
                    {isSelected && <span style={{color: 'var(--win)', fontSize: '14px'}}>✅</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* SCHEDINA CREATA */}
      {schedinaCreata && (
        <div className="card" style={{border: '2px solid var(--accent)', marginTop: '16px'}}>
          <h3 style={{color: 'var(--accent)'}}>🎯 Schedina Generata</h3>
          <p style={{fontSize: '13px', color: 'var(--text-muted)'}}>
            {schedinaCreata.numPartite} partite • Media score: <b style={{color: 'var(--accent)'}}>{schedinaCreata.media}%</b>
            {schedinaCreata.giocataSelezionata && (
              <span style={{marginLeft: '12px'}}>
                Giocata: <b>{schedinaCreata.giocataSelezionata === 'tutte' ? '⭐ Tutte (miglior %)' : FAMIGLIE_GIOCATE[schedinaCreata.giocataSelezionata]?.label || ''}</b>
              </span>
            )}
          </p>
          
          {schedinaCreata.partite.map((m, idx) => (
            <div key={idx} style={{
              padding: '8px 12px',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--surface)'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px'}}>
                <span style={{fontSize: '13px'}}>
                  <b>#{idx + 1}</b> {m.casa} vs {m.ospiti}
                  <span style={{fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px'}}>
                    {formatDateEU(m.data)} {m.ora}
                  </span>
                </span>
                <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                  {m.campionato}
                </span>
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '4px'}}>
                <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                  {m.giocata ? (
                    <>
                      <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--accent)'}}>
                        {m.giocata.familyIcon} {m.giocata.label}
                      </span>
                      <span className={`giocata-pct ${getPercentualeClasse(m.pct)}`} style={{fontSize: '12px', padding: '2px 10px'}}>
                        {m.pct}%
                      </span>
                      {m.giocata.isBomb && <span style={{fontSize: '16px'}}>💣</span>}
                    </>
                  ) : (
                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>Nessuna giocata</span>
                  )}
                </div>
                <span className={`giocata-pct ${getPercentualeClasse(m.score)}`} style={{fontSize: '13px', padding: '2px 10px'}}>
                  Score: {m.score}%
                </span>
              </div>
            </div>
          ))}
          
          <div style={{marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            <button className="btn" onClick={() => {
              const text = schedinaCreata.partite.map((m, idx) => 
                `#${idx + 1} ${m.casa} vs ${m.ospiti} - ${m.giocata?.label || 'N/A'} ${m.pct || 0}%`
              ).join('\n');
              navigator.clipboard?.writeText?.(`🎯 SCHEDINA GesssAI-Pro\n\n${text}\n\nMedia Score: ${schedinaCreata.media}% - ${schedinaCreata.numPartite} partite`);
              showAlert('success', '📋 Copiato!');
            }}>
              📋 Copia
            </button>
            <button className="btn btn-secondary" onClick={resettaSchedina}>
              🗑️ Resetta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ESPORTA GLOBALMENTE IL COMPONENTE SCHEDINA
window.SchedinaComponent = SchedinaComponent;
console.log('✅ SchedinaComponent caricato correttamente!');