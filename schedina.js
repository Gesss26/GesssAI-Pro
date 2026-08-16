// schedina.js
// Modulo Schedina per GesssAI-Pro v3.0

const { useState, useEffect, useMemo, useCallback } = React;

const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
  // Stato principale
  const [schedineSalvate, setSchedineSalvate] = useState(() => {
    try {
      const saved = localStorage.getItem('ft_schedine');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [campionatiSelezionati, setCampionatiSelezionati] = useState(() => {
    try {
      const saved = localStorage.getItem('ft_campionati_selezionati');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  
  const [giorniRange, setGiorniRange] = useState(1);
  const [numPartite, setNumPartite] = useState(5);
  const [partiteCalcolate, setPartiteCalcolate] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [schedinaDaVisualizzare, setSchedinaDaVisualizzare] = useState(null);
  const [showSchedinaModal, setShowSchedinaModal] = useState(false);
  
  // Salva le schedine in localStorage
  useEffect(() => {
    localStorage.setItem('ft_schedine', JSON.stringify(schedineSalvate));
  }, [schedineSalvate]);
  
  // Salva i campionati selezionati
  useEffect(() => {
    localStorage.setItem('ft_campionati_selezionati', JSON.stringify(campionatiSelezionati));
  }, [campionatiSelezionati]);
  
  // Toggle selezione campionato
  const toggleCampionato = (nomeCampionato) => {
    setCampionatiSelezionati(prev => {
      if (prev.includes(nomeCampionato)) {
        return prev.filter(c => c !== nomeCampionato);
      } else {
        return [...prev, nomeCampionato];
      }
    });
  };
  
  // Seleziona/deseleziona tutti i campionati
  const selezionaTuttiCampionati = () => {
    const tutti = championships.map(c => c.name);
    setCampionatiSelezionati(tutti);
  };
  
  const deselezionaTuttiCampionati = () => {
    setCampionatiSelezionati([]);
  };
  
  // Ottiene la data di oggi e la data massima in base al range
  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + giorniRange);
    return { today, maxDate };
  };
  
  // Calcola le migliori giocate per una partita
  const getBestGiocateForMatch = (match) => {
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
  
  // Seleziona una giocata tra quelle con la percentuale più alta (con random in caso di parità)
  const selectBestGiocata = (giocate) => {
    if (!giocate || giocate.length === 0) return null;
    
    // Trova la percentuale massima
    const maxPct = Math.max(...giocate.map(g => g.pct));
    
    // Filtra le giocate con la percentuale massima
    const topGiocate = giocate.filter(g => g.pct === maxPct);
    
    // Scegli a caso tra quelle con la stessa percentuale
    const randomIndex = Math.floor(Math.random() * topGiocate.length);
    return topGiocate[randomIndex];
  };
  
  // Calcola la schedina
  const calcolaSchedina = () => {
    if (campionatiSelezionati.length === 0) {
      showAlert('error', '⚠️ Seleziona almeno un campionato!');
      return;
    }
    
    setIsLoading(true);
    
    // Ottieni le partite future nei campionati selezionati
    const { today, maxDate } = getDateRange();
    const todayStr = today.toISOString().slice(0, 10);
    const maxDateStr = maxDate.toISOString().slice(0, 10);
    
    let partiteDisponibili = matches.filter(m => {
      if (m.stato !== 'Futura') return false;
      if (!campionatiSelezionati.includes(m.campionato)) return false;
      if (!m.data) return false;
      
      const normalized = window.normalizeDate(m.data);
      if (!normalized) return false;
      
      return normalized >= todayStr && normalized <= maxDateStr;
    });
    
    if (partiteDisponibili.length === 0) {
      showAlert('warning', '⚠️ Nessuna partita disponibile nei campionati selezionati per il range di date scelto.');
      setIsLoading(false);
      setPartiteCalcolate([]);
      return;
    }
    
    // Ordina le partite per data e ora (crescente)
    partiteDisponibili.sort((a, b) => {
      const dateA = window.normalizeDate(a.data);
      const dateB = window.normalizeDate(b.data);
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      // Se stessa data, ordina per ora
      const oraA = a.ora || '00:00';
      const oraB = b.ora || '00:00';
      return oraA.localeCompare(oraB);
    });
    
    // Calcola le giocate per ogni partita
    const partiteConGiocate = partiteDisponibili.map(m => {
      const giocate = getBestGiocateForMatch(m);
      const migliorGiocata = selectBestGiocata(giocate);
      return {
        ...m,
        giocate,
        migliorGiocata
      };
    });
    
    // Filtra le partite che hanno almeno una giocata
    const partiteValide = partiteConGiocate.filter(p => p.migliorGiocata !== null);
    
    if (partiteValide.length === 0) {
      showAlert('warning', '⚠️ Nessuna partita ha giocate valide.');
      setIsLoading(false);
      setPartiteCalcolate([]);
      return;
    }
    
    // Seleziona le prime N partite (o tutte se meno di N)
    const numDaPrendere = Math.min(numPartite, partiteValide.length);
    const partiteSelezionate = partiteValide.slice(0, numDaPrendere);
    
    setPartiteCalcolate(partiteSelezionate);
    setIsLoading(false);
    
    showAlert('success', `✅ Trovate ${partiteSelezionate.length} partite valide!`);
  };
  
  // Resetta la schedina
  const resettaSchedina = () => {
    setPartiteCalcolate([]);
    showAlert('info', '🔄 Schedina resettata.');
  };
  
  // Rigenera la schedina (ricalcola con le stesse partite ma con nuovo random)
  const rigeneraSchedina = () => {
    if (partiteCalcolate.length === 0) {
      showAlert('warning', '⚠️ Prima calcola una schedina!');
      return;
    }
    
    // Rigenera le giocate per le partite attuali con nuovo random
    const partiteRigenerate = partiteCalcolate.map(p => {
      const giocate = getBestGiocateForMatch(p);
      const migliorGiocata = selectBestGiocata(giocate);
      return {
        ...p,
        giocate,
        migliorGiocata
      };
    });
    
    // Filtra le partite che hanno almeno una giocata
    const partiteValide = partiteRigenerate.filter(p => p.migliorGiocata !== null);
    
    if (partiteValide.length === 0) {
      showAlert('warning', '⚠️ Nessuna partita ha giocate valide dopo la rigenerazione.');
      setPartiteCalcolate([]);
      return;
    }
    
    setPartiteCalcolate(partiteValide);
    showAlert('success', `🔄 Schedina rigenerata con ${partiteValide.length} partite!`);
  };
  
  // Salva la schedina corrente
  const salvaSchedina = () => {
    if (partiteCalcolate.length === 0) {
      showAlert('error', '⚠️ Non ci sono partite da salvare!');
      return;
    }
    
    // Verifica che tutte le partite abbiano una giocata
    const senzaGiocata = partiteCalcolate.filter(p => !p.migliorGiocata);
    if (senzaGiocata.length > 0) {
      showAlert('error', `⚠️ ${senzaGiocata.length} partita/e senza giocata selezionata!`);
      return;
    }
    
    // Crea il nome con data e ora
    const now = new Date();
    const nome = `Schedina_${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const nuovaSchedina = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nome: nome,
      dataCreazione: now.toISOString(),
      campionati: [...campionatiSelezionati],
      giorniRange: giorniRange,
      partite: partiteCalcolate.map(p => ({
        id: p.id,
        casa: p.casa,
        ospiti: p.ospiti,
        campionato: p.campionato,
        data: p.data,
        ora: p.ora || 'TBD',
        giocata: p.migliorGiocata
      })),
      numPartite: partiteCalcolate.length
    };
    
    setSchedineSalvate([...schedineSalvate, nuovaSchedina]);
    showAlert('success', `✅ Schedina "${nome}" salvata! (${partiteCalcolate.length} partite)`);
  };
  
  // Apri una schedina salvata per visualizzarla
  const apriSchedina = (schedina) => {
    setSchedinaDaVisualizzare(schedina);
    setShowSchedinaModal(true);
  };
  
  // Chiudi la modal
  const chiudiModal = () => {
    setShowSchedinaModal(false);
    setSchedinaDaVisualizzare(null);
  };
  
  // Elimina una schedina salvata
  const eliminaSchedina = (id) => {
    if (confirm('🗑️ Eliminare questa schedina?')) {
      setSchedineSalvate(schedineSalvate.filter(s => s.id !== id));
      showAlert('success', '🗑️ Schedina eliminata.');
    }
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
  
  // Formatta data per visualizzazione
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/D';
    try {
      const d = new Date(dateStr);
      return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    } catch { return dateStr; }
  };
  
  // Genera il testo per la condivisione
  const generaTestoCondivisione = (schedina) => {
    if (!schedina || !schedina.partite || schedina.partite.length === 0) return '';
    
    const lines = [];
    const now = new Date();
    const dataOra = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    lines.push(`📋 *SCHEDINA GESSsAI-PRO*`);
    lines.push(`📅 Generata il: ${dataOra}`);
    lines.push(`🏆 Campionati: ${schedina.campionati?.join(', ') || 'Tutti'}`);
    lines.push(`📊 ${schedina.partite.length} partite selezionate`);
    lines.push(``);
    
    const bombe = contaBombe(schedina);
    if (bombe > 0) {
      lines.push(`💣 BOMBE: ${bombe}`);
      lines.push(``);
    }
    
    const scoreMedio = calcolaScoreMedio(schedina);
    lines.push(`⭐ Score medio: ${scoreMedio}%`);
    lines.push(``);
    lines.push(`--- PARTITE ---`);
    lines.push(``);
    
    // Ordina le partite per data e ora crescente
    const partiteOrdinate = [...schedina.partite].sort((a, b) => {
      const dateA = a.data || '9999-99-99';
      const dateB = b.data || '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const oraA = a.ora || '00:00';
      const oraB = b.ora || '00:00';
      return oraA.localeCompare(oraB);
    });
    
    partiteOrdinate.forEach((p, idx) => {
      const dataFormattata = formatDate(p.data);
      const ora = p.ora || 'TBD';
      const giocata = p.giocata;
      const pct = giocata?.pct || 0;
      const isBomb = pct >= 90;
      const emojiBomba = isBomb ? ' 💣' : '';
      
      lines.push(`${idx + 1}. ${p.casa} 🆚 ${p.ospiti}`);
      lines.push(`   🏆 ${p.campionato || 'N/D'} | 📅 ${dataFormattata} ${ora}`);
      lines.push(`   🎯 ${giocata?.familyIcon || '🎯'} ${giocata?.label || giocata?.giocata || 'N/D'} - ${pct}%${emojiBomba}`);
      lines.push(``);
    });
    
    lines.push(`---`);
    lines.push(`📊 *GesssAI-Pro v3.0*`);
    lines.push(`🔗 Generato da GesssAI-Pro Football Trader`);
    
    return lines.join('\n');
  };
  
  // Condividi su WhatsApp
  const condividiWhatsApp = (schedina) => {
    if (!schedina) return;
    const testo = generaTestoCondivisione(schedina);
    const testoEncoded = encodeURIComponent(testo);
    const url = `https://wa.me/?text=${testoEncoded}`;
    window.open(url, '_blank');
  };
  
  // Condividi su Telegram
  const condividiTelegram = (schedina) => {
    if (!schedina) return;
    const testo = generaTestoCondivisione(schedina);
    const testoEncoded = encodeURIComponent(testo);
    const url = `https://t.me/share/url?url=&text=${testoEncoded}`;
    window.open(url, '_blank');
  };
  
  // Render della modal per visualizzare la schedina
  const renderModal = () => {
    if (!showSchedinaModal || !schedinaDaVisualizzare) return null;
    
    const s = schedinaDaVisualizzare;
    const scoreMedio = calcolaScoreMedio(s);
    const numBombe = contaBombe(s);
    
    // Ordina le partite per data e ora crescente
    const partiteOrdinate = [...s.partite].sort((a, b) => {
      const dateA = a.data || '9999-99-99';
      const dateB = b.data || '9999-99-99';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const oraA = a.ora || '00:00';
      const oraB = b.ora || '00:00';
      return oraA.localeCompare(oraB);
    });
    
    return (
      <div className="heatmap-detail-overlay" onClick={chiudiModal}>
        <div className="heatmap-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h2 style={{ color: 'var(--accent)', margin: '0 0 4px 0' }}>📋 {s.nome}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  <span>🕒 {formatDateTime(s.dataCreazione)}</span>
                  <span>🏆 {s.campionati?.join(', ') || 'Tutti'}</span>
                  <span>📅 Range: {s.giorniRange || 1} giorni</span>
                  <span>📊 {s.partite?.length || 0} partite</span>
                  <span>⭐ Score medio: <b style={{ color: scoreMedio >= 70 ? 'var(--win)' : (scoreMedio >= 50 ? 'var(--draw)' : 'var(--lose)') }}>{scoreMedio}%</b></span>
                  {numBombe > 0 && <span>💣 {numBombe} bombe</span>}
                </div>
              </div>
              
              {/* Pulsanti di condivisione */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => condividiWhatsApp(s)}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '20px' }}>💬</span> WhatsApp
                </button>
                <button 
                  onClick={() => condividiTelegram(s)}
                  style={{
                    background: '#0088cc',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <span style={{ fontSize: '20px' }}>✈️</span> Telegram
                </button>
              </div>
            </div>
          </div>
          
          <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
            {partiteOrdinate.map((p, idx) => {
              const pct = p.giocata?.pct || 0;
              const isBomb = pct >= 90;
              const color = isBomb ? 'var(--accent)' : (pct >= 66.67 ? 'var(--win)' : (pct >= 33.34 ? 'var(--draw)' : 'var(--lose)'));
              const dataFormattata = formatDate(p.data);
              const ora = p.ora || 'TBD';
              
              return (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  marginBottom: '6px',
                  background: isBomb ? 'rgba(243, 156, 18, 0.12)' : 'var(--surface)',
                  borderRadius: '8px',
                  border: isBomb ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${color}`,
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                    <span style={{ 
                      fontSize: '12px', 
                      fontWeight: 'bold', 
                      color: 'var(--text-muted)',
                      minWidth: '35px',
                      textAlign: 'center'
                    }}>
                      #{idx + 1}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>⚽</span>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text)' }}>
                        {p.casa} 🆚 {p.ospiti}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: 'var(--text-muted)', gap: '1px' }}>
                      <span>🏆 {p.campionato || 'N/D'}</span>
                      <span>📅 {dataFormattata} {ora}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: isBomb ? 'var(--accent)' : 'var(--card)',
                      color: isBomb ? '#000' : 'var(--text)',
                      padding: '4px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      border: isBomb ? '1px solid var(--accent)' : 'none'
                    }}>
                      {p.giocata?.familyIcon} {p.giocata?.label || p.giocata?.giocata || 'N/D'}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '20px',
                      color: isBomb ? 'var(--accent)' : color,
                      minWidth: '55px',
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
                  // Carica questa schedina come schedina corrente
                  const partiteCaricate = s.partite.map(p => ({
                    ...p,
                    giocate: [p.giocata],
                    migliorGiocata: p.giocata
                  }));
                  setPartiteCalcolate(partiteCaricate);
                  showAlert('success', `📋 Schedina "${s.nome}" caricata!`);
                  chiudiModal();
                }}
                style={{ fontSize: '12px', padding: '6px 14px' }}
              >
                📂 Carica
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
              {s.partite?.length || 0} partite • {numBombe} 💣 • Score {scoreMedio}%
            </div>
          </div>
          
          {/* Anteprima testo condivisione */}
          <div style={{
            marginTop: '12px',
            padding: '10px 14px',
            background: 'var(--surface)',
            borderRadius: '6px',
            border: '1px solid var(--border)',
            maxHeight: '100px',
            overflowY: 'auto',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>📝 Anteprima condivisione</span>
            </div>
            {generaTestoCondivisione(s).split('\n').slice(0, 6).map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            {generaTestoCondivisione(s).split('\n').length > 6 && (
              <div style={{ color: 'var(--text-muted)' }}>... e altre {generaTestoCondivisione(s).split('\n').length - 6} righe</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="schedina-container">
      {/* Sezione selezione campionati */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          <h4 style={{ margin: 0 }}>🏆 Seleziona Campionati</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={selezionaTuttiCampionati} style={{ fontSize: '11px', padding: '4px 12px' }}>
              Seleziona Tutti
            </button>
            <button className="btn btn-secondary" onClick={deselezionaTuttiCampionati} style={{ fontSize: '11px', padding: '4px 12px' }}>
              Deseleziona Tutti
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {championships.map(c => {
            const isSelected = campionatiSelezionati.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => toggleCampionato(c.name)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: isSelected ? 'var(--accent)' : 'var(--surface)',
                  color: isSelected ? '#000' : 'var(--text)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                  fontSize: '13px'
                }}
              >
                {c.name} {isSelected && '✅'}
              </button>
            );
          })}
          {championships.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 0' }}>
              Nessun campionato importato. Vai su Impostazioni → Importa Campionato
            </div>
          )}
        </div>
        
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
          {campionatiSelezionati.length} campionati selezionati
        </div>
      </div>
      
      {/* Sezione controlli */}
      <div className="card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '150px' }}>
            <label>📅 Giorni Range</label>
            <select 
              value={giorniRange} 
              onChange={e => setGiorniRange(parseInt(e.target.value))}
              style={{ padding: '6px 10px' }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                <option key={n} value={n}>{n === 0 ? 'Solo oggi' : `${n} giorni`}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '120px' }}>
            <label>📊 Numero Partite</label>
            <select 
              value={numPartite} 
              onChange={e => setNumPartite(parseInt(e.target.value))}
              style={{ padding: '6px 10px' }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '4px' }}>
            <button className="btn" onClick={calcolaSchedina} disabled={isLoading}>
              {isLoading ? '⏳ Calcolo...' : '🔍 Calcola Schedina'}
            </button>
            <button className="btn btn-secondary" onClick={resettaSchedina}>
              🔄 Resetta
            </button>
            <button className="btn btn-secondary" onClick={rigeneraSchedina} disabled={partiteCalcolate.length === 0}>
              🎲 Rigenera Schedina
            </button>
            <button className="btn" onClick={salvaSchedina} disabled={partiteCalcolate.length === 0}>
              💾 Salva Schedina
            </button>
          </div>
        </div>
      </div>
      
      {/* Risultati calcolati */}
      {partiteCalcolate.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: 'var(--accent)' }}>
              📋 Schedina Calcolata ({partiteCalcolate.length} partite)
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {partiteCalcolate.filter(p => p.migliorGiocata?.isBomb).length} 💣 bombe
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
            {partiteCalcolate.map((p, idx) => {
              const giocata = p.migliorGiocata;
              const pct = giocata?.pct || 0;
              const isBomb = pct >= 90;
              const color = isBomb ? 'var(--accent)' : (pct >= 66.67 ? 'var(--win)' : (pct >= 33.34 ? 'var(--draw)' : 'var(--lose)'));
              const dataFormattata = formatDate(p.data);
              const ora = p.ora || 'TBD';
              
              return (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: isBomb ? 'rgba(243, 156, 18, 0.12)' : 'var(--surface)',
                  borderRadius: '6px',
                  border: isBomb ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${color}`,
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '180px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '30px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>
                      {p.casa} 🆚 {p.ospiti}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.campionato}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📅 {dataFormattata} {ora}</span>
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
                      {giocata?.familyIcon} {giocata?.label || giocata?.giocata || 'N/D'}
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
        </div>
      )}
      
      {/* Lista schedine salvate */}
      <div className="card">
        <h4 style={{ marginBottom: '12px' }}>💾 Schedine Salvate ({schedineSalvate.length})</h4>
        
        {schedineSalvate.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Nessuna schedina salvata. Calcola e salva una schedina per iniziare.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {schedineSalvate.slice().reverse().map((s, idx) => {
              const scoreMedio = calcolaScoreMedio(s);
              const numBombe = contaBombe(s);
              const isHighScore = scoreMedio >= 70;
              const hasBombe = numBombe > 0;
              
              return (
                <div 
                  key={s.id} 
                  style={{
                    padding: '12px 14px',
                    background: 'var(--surface)',
                    borderRadius: '8px',
                    border: hasBombe ? '2px solid var(--accent)' : '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => apriSchedina(s)}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {hasBombe && (
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'var(--accent)',
                      color: '#000',
                      padding: '1px 8px',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      💣 {numBombe}
                    </div>
                  )}
                  
                  <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px', marginBottom: '4px' }}>
                    {s.nome}
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>🕒 {formatDateTime(s.dataCreazione)}</span>
                    <span>•</span>
                    <span>📊 {s.partite?.length || 0} partite</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {s.partite?.slice(0, 2).map((p, i) => (
                      <span key={i} style={{
                        background: 'var(--card)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontSize: '10px',
                        color: 'var(--text)'
                      }}>
                        {p.casa} vs {p.ospiti}
                      </span>
                    ))}
                    {s.partite?.length > 2 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        +{s.partite.length - 2}
                      </span>
                    )}
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border)',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: isHighScore ? 'var(--win)' : (scoreMedio >= 50 ? 'var(--draw)' : 'var(--lose)') }}>
                      Score: {scoreMedio}%
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      👆 Clicca per visualizzare
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal per visualizzare la schedina */}
      {renderModal()}
    </div>
  );
};

// Espone il componente globalmente
window.SchedinaComponent = SchedinaComponent;

console.log('✅ Modulo Schedina caricato correttamente');