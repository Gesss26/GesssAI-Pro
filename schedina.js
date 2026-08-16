// schedina.js
// Modulo Schedina per GesssAI-Pro v3.0

const { useState, useEffect, useMemo, useCallback } = React;

// Componente principale Schedina
const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
  const [schedine, setSchedine] = useState(() => {
    try {
      const saved = localStorage.getItem('ft_schedine');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [schedinaCorrente, setSchedinaCorrente] = useState({
    nome: '',
    campionato: 'Tutti',
    dataInizio: '',
    dataFine: '',
    partite: [],
    note: ''
  });
  
  const [partiteDisponibili, setPartiteDisponibili] = useState([]);
  const [partiteSelezionate, setPartiteSelezionate] = useState([]);
  const [filtroCampionato, setFiltroCampionato] = useState('Tutti');
  const [viewMode, setViewMode] = useState('lista'); // 'lista' | 'crea' | 'dettaglio'
  const [schedinaDettaglio, setSchedinaDettaglio] = useState(null);
  const [showSchedinaModal, setShowSchedinaModal] = useState(false);
  
  // Carica le partite disponibili
  useEffect(() => {
    let disponibili = matches.filter(m => m.stato === 'Futura');
    if (filtroCampionato !== 'Tutti') {
      disponibili = disponibili.filter(m => m.campionato === filtroCampionato);
    }
    setPartiteDisponibili(disponibili);
  }, [matches, filtroCampionato]);
  
  // Salva schedine in localStorage
  useEffect(() => {
    localStorage.setItem('ft_schedine', JSON.stringify(schedine));
  }, [schedine]);
  
  // Aggiungi una partita alla schedina corrente
  const aggiungiPartita = (match) => {
    if (partiteSelezionate.some(p => p.id === match.id)) {
      showAlert('warning', `⚠️ "${match.casa} vs ${match.ospiti}" già aggiunta!`);
      return;
    }
    setPartiteSelezionate([...partiteSelezionate, { ...match, giocataSelezionata: null }]);
  };
  
  // Rimuovi una partita dalla schedina corrente
  const rimuoviPartita = (matchId) => {
    setPartiteSelezionate(partiteSelezionate.filter(p => p.id !== matchId));
  };
  
  // Seleziona una giocata per una partita
  const selezionaGiocata = (matchId, giocata) => {
    setPartiteSelezionate(prev => 
      prev.map(p => p.id === matchId ? { ...p, giocataSelezionata: giocata } : p)
    );
  };
  
  // Calcola le giocate disponibili per una partita
  const getGiocateForMatch = (match) => {
    const stats = window.computeMatchStats(match, matches);
    if (stats.error) return [];
    
    stats._allMatches = matches;
    stats._homeTeam = match.casa;
    stats._awayTeam = match.ospiti;
    
    const homeMG = stats.homeMG || {};
    const awayMG = stats.awayMG || {};
    const mgTot = stats.mgTot || {};
    const homeRange = window.getMultigolRange(match.casa, matches);
    const awayRange = window.getMultigolRange(match.ospiti, matches);
    
    const giocate = [];
    
    selectedFamiglie.forEach(familyId => {
      const family = window.FAMIGLIE_GIOCATE[familyId];
      if (!family) return;
      
      const best = window.getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
      if (best && best.pct > 0) {
        giocate.push({
          familyId,
          familyLabel: family.label,
          familyIcon: family.icon,
          label: best.label,
          pct: best.pct,
          isBomb: best.pct >= 90,
          giocata: best.giocata
        });
      }
    });
    
    return giocate.sort((a, b) => b.pct - a.pct);
  };
  
  // Salva la schedina
  const salvaSchedina = () => {
    if (!schedinaCorrente.nome.trim()) {
      showAlert('error', '⚠️ Inserisci un nome per la schedina!');
      return;
    }
    
    if (partiteSelezionate.length === 0) {
      showAlert('error', '⚠️ Aggiungi almeno una partita!');
      return;
    }
    
    // Verifica che tutte le partite abbiano una giocata selezionata
    const senzaGiocata = partiteSelezionate.filter(p => !p.giocataSelezionata);
    if (senzaGiocata.length > 0) {
      showAlert('error', `⚠️ ${senzaGiocata.length} partita/e senza giocata selezionata!`);
      return;
    }
    
    const nuovaSchedina = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nome: schedinaCorrente.nome,
      campionato: schedinaCorrente.campionato || 'Tutti',
      dataInizio: schedinaCorrente.dataInizio || new Date().toISOString().slice(0, 10),
      dataFine: schedinaCorrente.dataFine || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      note: schedinaCorrente.note || '',
      partite: partiteSelezionate.map(p => ({
        id: p.id,
        casa: p.casa,
        ospiti: p.ospiti,
        campionato: p.campionato,
        data: p.data,
        ora: p.ora,
        giocata: p.giocataSelezionata
      })),
      dataCreazione: new Date().toISOString(),
      stato: 'attiva'
    };
    
    setSchedine([...schedine, nuovaSchedina]);
    setSchedinaCorrente({ nome: '', campionato: 'Tutti', dataInizio: '', dataFine: '', partite: [], note: '' });
    setPartiteSelezionate([]);
    setViewMode('lista');
    showAlert('success', `✅ Schedina "${nuovaSchedina.nome}" salvata! (${nuovaSchedina.partite.length} partite)`);
  };
  
  // Elimina una schedina
  const eliminaSchedina = (id) => {
    if (confirm('🗑️ Eliminare questa schedina?')) {
      setSchedine(schedine.filter(s => s.id !== id));
      showAlert('success', '🗑️ Schedina eliminata.');
    }
  };
  
  // Apri la schedina in modal
  const apriSchedina = (schedina) => {
    setSchedinaDettaglio(schedina);
    setShowSchedinaModal(true);
  };
  
  // Chiudi la modal
  const chiudiModal = () => {
    setShowSchedinaModal(false);
    setSchedinaDettaglio(null);
  };
  
  // Calcola il punteggio medio di una schedina
  const calcolaScoreMedio = (schedina) => {
    if (!schedina.partite || schedina.partite.length === 0) return 0;
    const total = schedina.partite.reduce((sum, p) => sum + (p.giocata?.pct || 0), 0);
    return Math.round(total / schedina.partite.length);
  };
  
  // Conta le bombe in una schedina
  const contaBombe = (schedina) => {
    if (!schedina.partite) return 0;
    return schedina.partite.filter(p => p.giocata?.isBomb).length;
  };
  
  // Formatta data
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/D';
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch { return dateStr; }
  };
  
  // Render del modal
  const renderModal = () => {
    if (!showSchedinaModal || !schedinaDettaglio) return null;
    
    const s = schedinaDettaglio;
    const scoreMedio = calcolaScoreMedio(s);
    const numBombe = contaBombe(s);
    
    return (
      <div className="heatmap-detail-overlay" onClick={chiudiModal}>
        <div className="heatmap-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
          <button className="close-btn" onClick={chiudiModal} style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text)',
            fontSize: '28px',
            cursor: 'pointer',
            zIndex: 10,
            padding: '4px 12px',
            borderRadius: '6px',
            transition: 'all 0.2s'
          }}>✖</button>
          
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ color: 'var(--accent)', margin: '0 0 4px 0' }}>📋 {s.nome}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <span>🏆 {s.campionato || 'Tutti'}</span>
              <span>📅 {formatDate(s.dataInizio)} → {formatDate(s.dataFine)}</span>
              <span>📊 {s.partite.length} partite</span>
              <span>⭐ Score medio: <b style={{ color: scoreMedio >= 70 ? 'var(--win)' : 'var(--draw)' }}>{scoreMedio}%</b></span>
              {numBombe > 0 && <span>💣 {numBombe} bombe</span>}
              <span style={{ fontSize: '11px' }}>🕒 {new Date(s.dataCreazione).toLocaleDateString()}</span>
            </div>
            {s.note && <div style={{ marginTop: '8px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text)' }}>📝 {s.note}</div>}
          </div>
          
          <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
            {s.partite.map((p, idx) => {
              const pct = p.giocata?.pct || 0;
              const isBomb = pct >= 90;
              const color = isBomb ? 'var(--accent)' : (pct >= 66.67 ? 'var(--win)' : (pct >= 33.34 ? 'var(--draw)' : 'var(--lose)'));
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  marginBottom: '4px',
                  background: isBomb ? 'rgba(243, 156, 18, 0.15)' : 'var(--surface)',
                  borderRadius: '6px',
                  border: isBomb ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${color}`,
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '150px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '30px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>
                      {p.casa} vs {p.ospiti}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.campionato}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: isBomb ? 'var(--accent)' : 'var(--card)',
                      color: isBomb ? '#000' : 'var(--text)',
                      padding: '2px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      border: isBomb ? '1px solid var(--accent)' : 'none'
                    }}>
                      {p.giocata?.familyIcon} {p.giocata?.label || p.giocata?.giocata || 'N/D'}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '18px',
                      color: isBomb ? 'var(--accent)' : color,
                      minWidth: '50px',
                      textAlign: 'center'
                    }}>
                      {pct}% {isBomb && '💣'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '2px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  // Copia la schedina per modifica
                  const copia = {
                    ...s,
                    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                    nome: `${s.nome} (copia)`,
                    dataCreazione: new Date().toISOString()
                  };
                  setSchedine([...schedine, copia]);
                  showAlert('success', `📋 Schedina "${s.nome}" duplicata!`);
                  chiudiModal();
                }}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                📋 Duplica
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => {
                  if (confirm(`🗑️ Eliminare "${s.nome}"?`)) {
                    eliminaSchedina(s.id);
                    chiudiModal();
                  }
                }}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                🗑️ Elimina
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {s.partite.length} partite • {numBombe} 💣 • Score {scoreMedio}%
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render della lista delle schedine
  const renderLista = () => {
    if (schedine.length === 0) {
      return (
        <div className="empty-state" style={{ padding: '40px' }}>
          <span style={{ fontSize: '48px' }}>📋</span>
          <p style={{ marginTop: '12px', fontSize: '16px' }}>Nessuna schedina salvata</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Clicca su <b>"Nuova Schedina"</b> per crearne una</p>
        </div>
      );
    }
    
    // Ordina per data creazione (più recenti prima)
    const sorted = [...schedine].sort((a, b) => new Date(b.dataCreazione) - new Date(a.dataCreazione));
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {sorted.map((s, idx) => {
          const scoreMedio = calcolaScoreMedio(s);
          const numBombe = contaBombe(s);
          const isHighScore = scoreMedio >= 70;
          const hasBombe = numBombe > 0;
          
          return (
            <div 
              key={s.id} 
              className="card" 
              style={{ 
                cursor: 'pointer',
                border: hasBombe ? '2px solid var(--accent)' : '1px solid var(--border)',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => apriSchedina(s)}
            >
              {hasBombe && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'var(--accent)',
                  color: '#000',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  animation: 'bomb-glow 1s infinite alternate'
                }}>
                  💣 {numBombe} bombe
                </div>
              )}
              
              <h4 style={{ margin: '0 0 4px 0', color: 'var(--accent)', fontSize: '16px' }}>
                {s.nome}
              </h4>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>🏆 {s.campionato || 'Tutti'}</span>
                <span>📅 {formatDate(s.dataInizio)} → {formatDate(s.dataFine)}</span>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                {s.partite.slice(0, 3).map((p, i) => (
                  <span key={i} style={{
                    background: 'var(--surface)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: 'var(--text)',
                    border: '1px solid var(--border)'
                  }}>
                    {p.casa} vs {p.ospiti}
                  </span>
                ))}
                {s.partite.length > 3 && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>+{s.partite.length - 3}</span>
                )}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '8px',
                borderTop: '1px solid var(--border)',
                fontSize: '13px'
              }}>
                <span>📊 {s.partite.length} partite</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: isHighScore ? 'var(--win)' : (scoreMedio >= 50 ? 'var(--draw)' : 'var(--lose)')
                }}>
                  Score: {scoreMedio}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {new Date(s.dataCreazione).toLocaleDateString()}
                </span>
              </div>
              
              <div style={{ 
                marginTop: '6px',
                fontSize: '11px', 
                color: 'var(--text-muted)',
                textAlign: 'center',
                opacity: 0.7
              }}>
                👆 Clicca per visualizzare
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Render della creazione schedina
  const renderCrea = () => {
    const campionatiDisponibili = ['Tutti', ...new Set(matches.filter(m => m.stato === 'Futura').map(m => m.campionato))];
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <button className="btn btn-secondary" onClick={() => { setViewMode('lista'); setPartiteSelezionate([]); }}>
            ← Torna alla lista
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {partiteSelezionate.length} partite selezionate
          </span>
        </div>
        
        <div className="card">
          <h4 style={{ marginBottom: '12px' }}>📝 Dettagli Schedina</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Nome Schedina *</label>
              <input 
                type="text" 
                value={schedinaCorrente.nome} 
                onChange={e => setSchedinaCorrente({ ...schedinaCorrente, nome: e.target.value })}
                placeholder="es. Bombe Weekend"
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Campionato</label>
              <select 
                value={schedinaCorrente.campionato} 
                onChange={e => setSchedinaCorrente({ ...schedinaCorrente, campionato: e.target.value })}
              >
                {campionatiDisponibili.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Inizio</label>
              <input 
                type="date" 
                value={schedinaCorrente.dataInizio} 
                onChange={e => setSchedinaCorrente({ ...schedinaCorrente, dataInizio: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Data Fine</label>
              <input 
                type="date" 
                value={schedinaCorrente.dataFine} 
                onChange={e => setSchedinaCorrente({ ...schedinaCorrente, dataFine: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '8px', marginBottom: 0 }}>
            <label>Note</label>
            <input 
              type="text" 
              value={schedinaCorrente.note} 
              onChange={e => setSchedinaCorrente({ ...schedinaCorrente, note: e.target.value })}
              placeholder="Note aggiuntive sulla schedina..."
            />
          </div>
        </div>
        
        <div className="card">
          <h4 style={{ marginBottom: '8px' }}>⚽ Partite Disponibili</h4>
          <div style={{ marginBottom: '12px' }}>
            <select 
              value={filtroCampionato} 
              onChange={e => setFiltroCampionato(e.target.value)}
              style={{ maxWidth: '300px' }}
            >
              {campionatiDisponibili.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          {partiteDisponibili.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              Nessuna partita disponibile per questo campionato.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
              {partiteDisponibili.map(m => {
                const isSelected = partiteSelezionate.some(p => p.id === m.id);
                const giocate = getGiocateForMatch(m);
                const bestGiocata = giocate.length > 0 ? giocate[0] : null;
                
                return (
                  <div 
                    key={m.id}
                    style={{
                      padding: '10px 14px',
                      background: isSelected ? 'rgba(243, 156, 18, 0.15)' : 'var(--surface)',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onClick={() => isSelected ? rimuoviPartita(m.id) : aggiungiPartita(m)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>
                          {m.casa} vs {m.ospiti}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {m.campionato} • {formatDate(m.data)} • {m.ora || 'TBD'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {bestGiocata && (
                          <span style={{
                            background: bestGiocata.isBomb ? 'var(--accent)' : 'var(--card)',
                            color: bestGiocata.isBomb ? '#000' : 'var(--text)',
                            padding: '2px 10px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {bestGiocata.label} {bestGiocata.pct}% {bestGiocata.isBomb && '💣'}
                          </span>
                        )}
                        <span style={{ fontSize: '20px' }}>{isSelected ? '✅' : '➕'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {partiteSelezionate.length > 0 && (
          <div className="card" style={{ borderColor: 'var(--accent)' }}>
            <h4 style={{ marginBottom: '8px' }}>📋 Partite Selezionate ({partiteSelezionate.length})</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '300px', overflowY: 'auto' }}>
              {partiteSelezionate.map((p, idx) => {
                const giocate = getGiocateForMatch(p);
                const selectedGiocata = p.giocataSelezionata;
                return (
                  <div key={p.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: 'var(--surface)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '120px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{idx + 1}</span>
                      <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{p.casa} vs {p.ospiti}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <select 
                        value={selectedGiocata?.giocata || ''} 
                        onChange={e => {
                          const g = giocate.find(g => g.giocata === e.target.value);
                          if (g) selezionaGiocata(p.id, g);
                        }}
                        style={{ padding: '4px 8px', fontSize: '12px', maxWidth: '140px' }}
                      >
                        <option value="">Scegli giocata</option>
                        {giocate.map((g, i) => (
                          <option key={i} value={g.giocata}>
                            {g.label} {g.pct}% {g.isBomb ? '💣' : ''}
                          </option>
                        ))}
                      </select>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => rimuoviPartita(p.id)}
                        style={{ fontSize: '11px', padding: '2px 10px', minWidth: '30px' }}
                      >
                        ✖
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Totale: {partiteSelezionate.filter(p => p.giocataSelezionata).length}/{partiteSelezionate.length} con giocata
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary" onClick={() => setPartiteSelezionate([])}>
                  🗑️ Svuota
                </button>
                <button className="btn" onClick={salvaSchedina}>
                  💾 Salva Schedina
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="schedina-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        <h2 style={{ margin: 0, color: 'var(--accent)' }}>🎯 Schedina</h2>
        {viewMode === 'lista' && (
          <button className="btn" onClick={() => { setViewMode('crea'); setPartiteSelezionate([]); }}>
            ➕ Nuova Schedina
          </button>
        )}
      </div>
      
      {viewMode === 'lista' && renderLista()}
      {viewMode === 'crea' && renderCrea()}
      
      {/* Modal per visualizzare la schedina */}
      {renderModal()}
    </div>
  );
};

// Esegue il rendering del componente Schedina
// Il componente viene esposto globalmente per essere utilizzato dall'app principale
window.SchedinaComponent = SchedinaComponent;

console.log('✅ Modulo Schedina caricato correttamente');