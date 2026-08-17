// ============================================================
// SCHEDINA.JS - VERSIONE COMPLETA CON SCHEDINE SALVATE + CASUALITÀ
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
  const [filterTime, setFilterTime] = useState('dopo_ora');

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
                  
                  if (filterTime === 'dopo_ora') {
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

  return renderAppContent();
}

// ============================================================
// COMPONENTE SCHEDINA - CON CASUALITÀ 🎲
// MODIFICHE: MASSIMO 10 PARTITE + BOTTONE RIGENERA + CASUALITÀ
// ============================================================

const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
  const [campionatoSelezionato, setCampionatoSelezionato] = useState('Tutti');
  const [partiteSelezionate, setPartiteSelezionate] = useState([]);
  const [filtroOrario, setFiltroOrario] = useState('dopo_ora');
  const [giorniRange, setGiorniRange] = useState(1);
  const [schedinaCreata, setSchedinaCreata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [giocataSelezionata, setGiocataSelezionata] = useState('tutte');
  const [showSchedinaModal, setShowSchedinaModal] = useState(false);
  const [casualitaLevel, setCasualitaLevel] = useState(30); // 0-100
  const [schedineSalvate, setSchedineSalvate] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ft_schedine_salvate') || '[]');
    } catch { return []; }
  });

  // Funzione per mescolare un array (Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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

  // Calcola la giocata per una partita
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
    
    // Raccogli TUTTE le giocate valide per questa partita
    const tutteGiocateValide = [];
    
    if (giocataSelezionata === 'tutte') {
      Object.keys(FAMIGLIE_GIOCATE).forEach(familyId => {
        const best = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
        if (best && best.pct > 0) {
          tutteGiocateValide.push({
            ...best,
            familyId: familyId,
            familyLabel: FAMIGLIE_GIOCATE[familyId].label,
            familyIcon: FAMIGLIE_GIOCATE[familyId].icon
          });
        }
      });
    } else {
      const best = getBestBetForFamily(giocataSelezionata, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
      if (best && best.pct > 0) {
        tutteGiocateValide.push({
          ...best,
          familyId: giocataSelezionata,
          familyLabel: FAMIGLIE_GIOCATE[giocataSelezionata]?.label || giocataSelezionata,
          familyIcon: FAMIGLIE_GIOCATE[giocataSelezionata]?.icon || '🎯'
        });
      }
    }
    
    // Seleziona la migliore tra tutte
    if (tutteGiocateValide.length > 0) {
      // Ordina per percentuale decrescente
      tutteGiocateValide.sort((a, b) => b.pct - a.pct);
      migliorGiocata = tutteGiocateValide[0];
      migliorPct = migliorGiocata.pct;
      
      // Aggiungi tutte le giocate valide alla partita per il confronto
      match._tutteGiocateValide = tutteGiocateValide;
    }
    
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
      score: score,
      tutteGiocate: tutteGiocateValide
    };
  };

  const getPartiteConGiocate = useCallback(() => {
    const partite = getPartiteFutureConFiltro();
    return partite.map(m => {
      const dettagli = calcolaGiocataPerPartita(m);
      return {
        ...m,
        giocata: dettagli.giocata,
        pct: dettagli.pct,
        score: dettagli.score,
        tutteGiocate: dettagli.tutteGiocate || []
      };
    }).filter(m => m.score > 0).sort((a, b) => b.score - a.score);
  }, [getPartiteFutureConFiltro, giocataSelezionata]);

  const partiteDisponibili = getPartiteConGiocate();

  // ============================================================
  // FUNZIONE RIGENERA CON CASUALITÀ 🎲
  // ============================================================
  const rigeneraSchedina = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile per rigenerare la schedina.');
      return;
    }

    // Raggruppa le partite per punteggio
    const partitePerScore = {};
    partiteDisponibili.forEach(m => {
      const score = m.score;
      if (!partitePerScore[score]) partitePerScore[score] = [];
      partitePerScore[score].push(m);
    });

    const scores = Object.keys(partitePerScore).map(Number).sort((a, b) => b - a);
    let selezionate = [];
    
    // Determina quante partite prendere in base al livello di casualità
    const sogliaCasualita = casualitaLevel / 100; // 0-1
    
    for (const score of scores) {
      if (selezionate.length >= 10) break;
      
      let partiteGruppo = partitePerScore[score];
      if (partiteGruppo.length === 0) continue;
      
      const postiDisponibili = 10 - selezionate.length;
      
      // 🎲 Applica casualità: mescola il gruppo
      let shuffled = shuffleArray(partiteGruppo);
      
      // Decidi quante partite prendere da questo gruppo in base alla casualità
      let daPrendereCount;
      if (casualitaLevel > 80) {
        // Molto casuale: prendi un numero casuale di partite da questo gruppo (almeno 1)
        const maxDaPrendere = Math.min(partiteGruppo.length, postiDisponibili);
        daPrendereCount = Math.floor(Math.random() * maxDaPrendere) + 1;
      } else if (casualitaLevel > 50) {
        // Casualità media: prendi la maggior parte delle partite
        const percentuale = 0.5 + (casualitaLevel - 50) / 100; // 0.5-0.8
        daPrendereCount = Math.min(
          Math.ceil(partiteGruppo.length * percentuale),
          postiDisponibili
        );
        // Assicurati di prendere almeno 1
        daPrendereCount = Math.max(1, daPrendereCount);
      } else {
        // Poca casualità: prendi tutte le partite se possibile
        daPrendereCount = Math.min(partiteGruppo.length, postiDisponibili);
      }
      
      // Prendi le partite mescolate
      const daPrendere = shuffled.slice(0, daPrendereCount);
      selezionate = [...selezionate, ...daPrendere];
    }
    
    // Se non siamo arrivati a 10, prendi altre partite mescolate
    if (selezionate.length < 10) {
      const idsSelezionati = new Set(selezionate.map(m => m.id));
      let rimanenti = partiteDisponibili.filter(m => !idsSelezionati.has(m.id));
      
      // Mescola i rimanenti
      rimanenti = shuffleArray(rimanenti);
      
      const postiDisponibili = 10 - selezionate.length;
      const daPrendere = rimanenti.slice(0, postiDisponibili);
      selezionate = [...selezionate, ...daPrendere];
    }
    
    if (selezionate.length < 2) {
      showAlert('info', 'ℹ️ Non ci sono abbastanza partite di qualità per creare una schedina (minimo 2).');
      return;
    }
    
    setPartiteSelezionate(selezionate);
    
    // Emoji in base al livello di casualità
    let emojiCasualita = '🎲';
    if (casualitaLevel > 80) emojiCasualita = '🎲🎲🎲';
    else if (casualitaLevel > 50) emojiCasualita = '🎲🎲';
    
    showAlert('success', `🔄 Schedina rigenerata! ${selezionate.length} partite selezionate. ${emojiCasualita} Livello casualità: ${casualitaLevel}%`);
  };

  // ============================================================
  // FUNZIONE SELEZIONE CASUALE COMPLETA 🎲
  // ============================================================
  const selezionaCasuale = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile.');
      return;
    }
    
    // Mescola tutte le partite disponibili
    const shuffled = shuffleArray(partiteDisponibili);
    
    // Prendi fino a 10 partite
    const maxPartite = Math.min(10, shuffled.length);
    const selezionate = shuffled.slice(0, maxPartite);
    
    setPartiteSelezionate(selezionate);
    showAlert('success', `🎲 ${selezionate.length} partite selezionate casualmente!`);
  };

  const selezionaMiglioriPartite = (n) => {
    const massimo = Math.min(n, 10);
    const migliori = partiteDisponibili.slice(0, massimo);
    setPartiteSelezionate(migliori);
    showAlert('success', `✅ Selezionate ${migliori.length} migliori partite!`);
  };

  const togglePartita = (match) => {
    setPartiteSelezionate(prev => {
      const exists = prev.find(m => m.id === match.id);
      if (exists) {
        return prev.filter(m => m.id !== match.id);
      } else {
        if (prev.length >= 10) {
          showAlert('error', '⚠️ Massimo 10 partite per schedina!');
          return prev;
        }
        return [...prev, match];
      }
    });
  };

  const creaSchedina = () => {
    if (partiteSelezionate.length < 2) {
      showAlert('error', '⚠️ Seleziona almeno 2 partite per creare la schedina!');
      return;
    }
    
    setLoading(true);
    
    const schedina = partiteSelezionate.map(m => {
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
    
    const nuovaSchedina = {
      id: Date.now().toString(36),
      partite: schedina,
      totale: totaleScore,
      media: mediaScore,
      numPartite: schedina.length,
      data: new Date().toISOString(),
      dataFormattata: new Date().toLocaleString('it-IT'),
      giocataSelezionata: giocataSelezionata,
      timestamp: new Date().toLocaleString('it-IT')
    };
    
    setSchedinaCreata(nuovaSchedina);
    
    // Salva in locale
    const salvate = [...schedineSalvate];
    salvate.push(nuovaSchedina);
    localStorage.setItem('ft_schedine_salvate', JSON.stringify(salvate));
    setSchedineSalvate(salvate);
    
    setLoading(false);
    showAlert('success', `🎯 Schedina creata! Media score: ${mediaScore}%`);
    
    // Apri il modal
    setShowSchedinaModal(true);
  };

  const resettaSchedina = () => {
    setPartiteSelezionate([]);
    setSchedinaCreata(null);
    showAlert('info', '🔄 Schedina resettata');
  };

  // Formatta la schedina per la condivisione
  const formatSchedinaText = (schedina) => {
    const lines = [];
    lines.push('🎯 *SCHEDINA GesssAI-Pro*');
    lines.push(`📅 ${schedina.dataFormattata || new Date().toLocaleString('it-IT')}`);
    lines.push(`📊 ${schedina.numPartite} partite • Media: ${schedina.media}%`);
    if (schedina.giocataSelezionata) {
      const giocataLabel = schedina.giocataSelezionata === 'tutte' ? '⭐ Tutte (miglior %)' : (FAMIGLIE_GIOCATE[schedina.giocataSelezionata]?.label || schedina.giocataSelezionata);
      lines.push(`🎯 Giocata: ${giocataLabel}`);
    }
    lines.push('───────────────────');
    lines.push('');
    
    schedina.partite.forEach((m, idx) => {
      const dataOra = `${formatDateEU(m.data)} ${m.ora && m.ora !== 'TBD' ? m.ora : ''}`;
      lines.push(`📅 ${dataOra}`);
      lines.push(`🏆 ${m.campionato}`);
      lines.push(`⚽ ${m.casa} vs ${m.ospiti}`);
      const giocataLabel = m.giocata ? `${m.giocata.familyIcon} ${m.giocata.label}` : 'N/A';
      const pctDisplay = m.pct || 0;
      const bombEmoji = m.giocata?.isBomb ? ' 💣' : '';
      lines.push(`🎯 ${giocataLabel} → ${pctDisplay}%${bombEmoji}`);
      if (idx < schedina.partite.length - 1) lines.push('');
    });
    
    lines.push('');
    lines.push('───────────────────');
    lines.push(`⭐ Media Score: ${schedina.media}%`);
    lines.push('💣 GesssAI-Pro v3.0');
    lines.push('⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.');
    
    return lines.join('\n');
  };

  // Funzioni per la condivisione
  const shareOnWhatsApp = () => {
    if (!schedinaCreata) return;
    const text = formatSchedinaText(schedinaCreata);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    if (!schedinaCreata) return;
    const text = formatSchedinaText(schedinaCreata);
    const url = `https://t.me/share/url?url=${encodeURIComponent('🎯 Schedina GesssAI-Pro')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copySchedinaToClipboard = () => {
    if (!schedinaCreata) return;
    const text = formatSchedinaText(schedinaCreata);
    navigator.clipboard?.writeText?.(text);
    showAlert('success', '📋 Schedina copiata negli appunti!');
  };

  const salvaSchedinaLocale = () => {
    if (!schedinaCreata) return;
    const now = new Date();
    const nomeFile = `Schedina_GesssAI_${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    
    const blob = new Blob([formatSchedinaText(schedinaCreata)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeFile}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showAlert('success', `💾 Schedina salvata come ${nomeFile}.txt`);
  };

  // Elimina una schedina salvata
  const eliminaSchedinaSalvata = (id) => {
    if (!confirm('⚠️ Sei sicuro di voler eliminare questa schedina salvata?')) return;
    const nuoveSalvate = schedineSalvate.filter(s => s.id !== id);
    localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuoveSalvate));
    setSchedineSalvate(nuoveSalvate);
    showAlert('success', '🗑️ Schedina eliminata!');
  };

  // Carica una schedina salvata
  const caricaSchedinaSalvata = (schedina) => {
    setSchedinaCreata(schedina);
    setPartiteSelezionate(schedina.partite);
    setShowSchedinaModal(true);
    showAlert('success', `📂 Schedina caricata! ${schedina.numPartite} partite, media ${schedina.media}%`);
  };

  const famiglieDisponibili = [
    { id: 'tutte', label: '⭐ Tutte', icon: '⭐' },
    ...Object.entries(FAMIGLIE_GIOCATE).map(([id, family]) => ({
      id: id,
      label: family.label,
      icon: family.icon
    }))
  ];

  return (
    <div className="schedina-container">
      <div className="card" style={{marginBottom: '16px'}}>
        <h3 style={{color: 'var(--accent)', marginBottom: '12px'}}>🎯 Crea Schedina {casualitaLevel > 50 ? '🎲' : ''}</h3>
        
        {/* FILTRI */}
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

        {/* 🎲 SLIDER CASUALITÀ */}
        <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <span style={{fontSize: '18px'}}>🎲</span>
            <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text)'}}>Casualità:</span>
          </div>
          <div style={{flex: 1, minWidth: '150px'}}>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5" 
              value={casualitaLevel} 
              onChange={e => setCasualitaLevel(parseInt(e.target.value))}
              style={{
                width: '100%',
                accentColor: '#8e44ad',
                height: '6px',
                borderRadius: '3px',
                background: 'var(--surface)',
                cursor: 'pointer'
              }}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px'}}>
            <span style={{fontSize: '13px', fontWeight: 'bold', color: '#8e44ad'}}>{casualitaLevel}%</span>
            <span style={{fontSize: '16px'}}>
              {casualitaLevel > 80 ? '🎲🎲🎲' : casualitaLevel > 50 ? '🎲🎲' : casualitaLevel > 20 ? '🎲' : '📊'}
            </span>
          </div>
          <div style={{fontSize: '9px', color: 'var(--text-muted)'}}>
            {casualitaLevel <= 20 ? '📊 Prevedibile' : 
             casualitaLevel <= 50 ? '🎲 Un po\' di casualità' : 
             casualitaLevel <= 80 ? '🎲🎲 Media casualità' : 
             '🎲🎲🎲 Molto casuale!'}
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
          <span>🎯 Selezionate: <b style={{color: 'var(--win)'}}>{partiteSelezionate.length}</b> / 10</span>
        </div>
        
        {/* PULSANTI */}
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <button className="btn" onClick={() => selezionaMiglioriPartite(3)}>
            ⚡ Top 3
          </button>
          <button className="btn" onClick={() => selezionaMiglioriPartite(5)}>
            ⚡ Top 5
          </button>
          <button className="btn" onClick={() => selezionaMiglioriPartite(10)}>
            ⚡ Top 10
          </button>
          <button className="btn" onClick={() => selezionaMiglioriPartite(partiteDisponibili.length)}>
            📋 Tutte
          </button>
          
          {/* 🎲 PULSANTE CASUALE */}
          <button className="btn" onClick={selezionaCasuale} style={{background: '#8e44ad', color: '#fff'}}>
            🎲 Casuale
          </button>
          
          <button className="btn" onClick={rigeneraSchedina} style={{background: 'var(--accent2)', color: '#000'}}>
            🔄 Rigenera {casualitaLevel > 50 ? '🎲' : ''}
          </button>
          
          <button className="btn btn-secondary" onClick={resettaSchedina}>
            🗑️ Resetta
          </button>
          <button className="btn" onClick={creaSchedina} disabled={partiteSelezionate.length < 2 || loading} style={{marginLeft: 'auto'}}>
            {loading ? '⏳ Creazione...' : `🎯 Crea Schedina (${partiteSelezionate.length})`}
          </button>
        </div>
        
        <div style={{marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)'}}>
          💡 Seleziona una giocata in alto. Clicca su una partita per selezionarla/deselezionarla. Max 10 partite.
          {casualitaLevel > 0 && ` 🎲 Livello casualità: ${casualitaLevel}%`}
        </div>
      </div>
      
      {/* LISTA PARTITE */}
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
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px'}}>
                    <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                      {formatDateEU(m.data)}
                    </span>
                    <span style={{fontSize: '10px', color: 'var(--text-muted)'}}>
                      {m.ora && m.ora !== 'TBD' ? m.ora : ''}
                    </span>
                  </div>
                  
                  <div style={{fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px'}}>
                    {m.campionato}
                  </div>
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '150px'}}>
                    <span style={{fontWeight: 'bold', fontSize: '13px', color: 'var(--text)'}}>
                      {m.casa} vs {m.ospiti}
                    </span>
                  </div>
                  
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

      {/* SCHEDINE SALVATE */}
      {schedineSalvate.length > 0 && (
        <div className="card" style={{marginTop: '16px', border: '2px solid var(--accent)'}}>
          <h4 style={{color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'}}>
            💾 Schedine Salvate ({schedineSalvate.length})
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (confirm('⚠️ Eliminare TUTTE le schedine salvate?')) {
                  localStorage.setItem('ft_schedine_salvate', '[]');
                  setSchedineSalvate([]);
                  showAlert('success', '🗑️ Tutte le schedine eliminate!');
                }
              }}
              style={{fontSize: '10px', padding: '2px 10px', marginLeft: 'auto'}}
            >
              🗑️ Elimina Tutte
            </button>
          </h4>
          
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {schedineSalvate.map((s, idx) => (
              <div 
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '150px'}}>
                  <span style={{fontWeight: 'bold', color: 'var(--accent)', fontSize: '12px'}}>#{idx + 1}</span>
                  <span style={{fontSize: '12px', color: 'var(--text)'}}>
                    📅 {s.dataFormattata || s.timestamp || 'N/D'}
                  </span>
                  <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                    {s.numPartite} partite • Media: <b style={{color: 'var(--accent)'}}>{s.media}%</b>
                  </span>
                </div>
                
                <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
                  <button 
                    className="btn" 
                    onClick={() => caricaSchedinaSalvata(s)}
                    style={{fontSize: '10px', padding: '4px 12px'}}
                  >
                    📂 Carica
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      const text = formatSchedinaText(s);
                      navigator.clipboard?.writeText?.(text);
                      showAlert('success', '📋 Schedina copiata!');
                    }}
                    style={{fontSize: '10px', padding: '4px 12px'}}
                  >
                    📋 Copia
                  </button>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => eliminaSchedinaSalvata(s.id)}
                    style={{fontSize: '10px', padding: '4px 12px'}}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL SCHEDINA */}
      {showSchedinaModal && schedinaCreata && (
        <div className="heatmap-detail-overlay" onClick={() => setShowSchedinaModal(false)}>
          <div className="heatmap-detail-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <button className="close-btn" onClick={() => setShowSchedinaModal(false)}>✖</button>
            
            <div id="schedina-da-condividere" style={{padding: '10px 0'}}>
              <h2 style={{color: 'var(--accent)', textAlign: 'center', marginBottom: '4px'}}>🎯 SCHEDINA GesssAI-Pro</h2>
              <p style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px'}}>
                📅 {schedinaCreata.dataFormattata || new Date().toLocaleString('it-IT')} • {schedinaCreata.numPartite} partite • Media: <b style={{color: 'var(--accent)'}}>{schedinaCreata.media}%</b>
                {schedinaCreata.giocataSelezionata && (
                  <span style={{marginLeft: '12px'}}>
                    Giocata: <b>{schedinaCreata.giocataSelezionata === 'tutte' ? '⭐ Tutte (miglior %)' : FAMIGLIE_GIOCATE[schedinaCreata.giocataSelezionata]?.label || ''}</b>
                  </span>
                )}
              </p>
              
              <div style={{borderTop: '2px solid var(--accent)', paddingTop: '12px'}}>
                {schedinaCreata.partite.map((m, idx) => (
                  <div key={idx} style={{
                    padding: '8px 12px',
                    marginBottom: '6px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--surface)'
                  }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px'}}>
                      <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                        📅 {formatDateEU(m.data)} {m.ora && m.ora !== 'TBD' ? m.ora : ''}
                      </span>
                      <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                        🏆 {m.campionato}
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px'}}>
                      <span style={{fontSize: '14px', fontWeight: 'bold'}}>
                        #{idx + 1} {m.casa} vs {m.ospiti}
                      </span>
                    </div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px'}}>
                      <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        {m.giocata ? (
                          <>
                            <span style={{fontSize: '13px', fontWeight: 'bold', color: 'var(--accent)'}}>
                              {m.giocata.familyIcon} {m.giocata.label}
                            </span>
                            <span className={`giocata-pct ${getPercentualeClasse(m.pct)}`} style={{fontSize: '14px', padding: '2px 12px'}}>
                              {m.pct}%
                            </span>
                            {m.giocata.isBomb && <span style={{fontSize: '18px'}}>💣</span>}
                          </>
                        ) : (
                          <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Nessuna giocata</span>
                        )}
                      </div>
                      <span className={`giocata-pct ${getPercentualeClasse(m.score)}`} style={{fontSize: '12px', padding: '2px 8px'}}>
                        Score: {m.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{borderTop: '2px solid var(--accent)', marginTop: '12px', paddingTop: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)'}}>
                  ⭐ Media Score: {schedinaCreata.media}%
                </div>
                <div style={{fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px'}}>
                  💣 GesssAI-Pro v3.0 • ⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.
                </div>
              </div>
            </div>
            
            {/* BOTTONI AZIONE MODAL */}
            <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', justifyContent: 'center'}}>
              <button className="btn" onClick={copySchedinaToClipboard} style={{background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)'}}>
                📋 Copia
              </button>
              
              <button className="btn" onClick={salvaSchedinaLocale} style={{background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)'}}>
                💾 Salva
              </button>
              
              <button 
                className="btn" 
                onClick={shareOnWhatsApp}
                style={{
                  background: '#25D366',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
              
              <button 
                className="btn" 
                onClick={shareOnTelegram}
                style={{
                  background: '#0088cc',
                  color: '#fff',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </button>
              
              <button className="btn btn-secondary" onClick={() => setShowSchedinaModal(false)}>
                ✖ Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ESPORTA GLOBALMENTE IL COMPONENTE SCHEDINA
window.SchedinaComponent = SchedinaComponent;
console.log('✅ SchedinaComponent caricato correttamente!');