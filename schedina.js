// ============================================================
// SCHEDINA.JS - Modulo Schedina per GesssAI-Pro
// VERSIONE AGGIORNATA con colori e filtri data corretti
// ============================================================

(function() {
  'use strict';

  const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
    const { useState, useEffect, useCallback, useRef } = React;

    // Stati
    const [filtri, setFiltri] = useState({
      campionato: 'Tutti',
      data: 'oggi',
      giocata: 'Tutti',
      numeroPartite: 10
    });

    const [partiteDisponibili, setPartiteDisponibili] = useState([]);
    const [partiteSelezionate, setPartiteSelezionate] = useState([]);
    const [schedineSalvate, setSchedineSalvate] = useState(() => {
      const saved = localStorage.getItem('ft_schedine_salvate');
      return saved ? JSON.parse(saved) : [];
    });
    const [schedinaCorrente, setSchedinaCorrente] = useState({
      nome: '',
      stake: 10,
      dataCreazione: new Date().toISOString()
    });
    const [quotePersonalizzate, setQuotePersonalizzate] = useState(() => {
      const saved = localStorage.getItem('ft_quote_personalizzate');
      return saved ? JSON.parse(saved) : {};
    });

    const fileInputRef = useRef(null);

    // Funzione per ottenere il colore in base alla percentuale
    const getColorePercentuale = (pct) => {
      if (pct >= 90) return { classe: 'flag-bomb', colore: '#f39c12', label: '💣 Oro' };
      if (pct >= 66.67) return { classe: 'flag-green', colore: '#6fcf97', label: '🟢 Verde' };
      if (pct >= 33.34) return { classe: 'flag-white', colore: '#8b949e', label: '⚪ Bianco' };
      return { classe: 'flag-red', colore: '#eb5757', label: '🔴 Rosso' };
    };

    // Funzioni di utilità
    const getDataRange = useCallback(() => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      
      const ranges = {
        'oggi': { 
          start: oggi, 
          end: new Date(oggi),
          label: 'Oggi (1 giorno)'
        },
        'oggi_domani': { 
          start: oggi, 
          end: new Date(new Date(oggi).setDate(oggi.getDate() + 1)),
          label: 'Oggi+Domani (1-2 giorni)'
        },
        'oggi_3': { 
          start: oggi, 
          end: new Date(new Date(oggi).setDate(oggi.getDate() + 3)),
          label: 'Oggi +3 giorni'
        },
        'tutte': null
      };
      
      return ranges[filtri.data] || ranges['oggi'];
    }, [filtri.data]);

    // Calcolo partite disponibili
    const calcolaPartite = useCallback(() => {
      if (!matches || matches.length === 0) {
        setPartiteDisponibili([]);
        setPartiteSelezionate([]);
        return;
      }

      let disponibili = matches.filter(m => m.stato === 'Futura');

      if (filtri.campionato !== 'Tutti') {
        disponibili = disponibili.filter(m => m.campionato === filtri.campionato);
      }

      const range = getDataRange();
      if (range) {
        disponibili = disponibili.filter(m => {
          if (!m.data) return false;
          const dataMatch = new Date(window.normalizeDate(m.data));
          dataMatch.setHours(0, 0, 0, 0);
          return dataMatch >= range.start && dataMatch <= range.end;
        });
      }

      disponibili.sort((a, b) => {
        const da = window.normalizeDate(a.data);
        const db = window.normalizeDate(b.data);
        if (!da || !db) return 0;
        return da.localeCompare(db);
      });

      const conGiocata = disponibili.map(m => {
        const stats = window.computeMatchStats(m, matches);
        if (stats.error) return { ...m, giocata: null, pct: 0, quote: 0 };

        stats._allMatches = matches;
        stats._homeTeam = m.casa;
        stats._awayTeam = m.ospiti;

        const homeMG = stats.homeMG || {};
        const awayMG = stats.awayMG || {};
        const mgTot = stats.mgTot || {};
        const homeRange = window.getMultigolRange(m.casa, matches);
        const awayRange = window.getMultigolRange(m.ospiti, matches);

        let migliorGiocata = null;
        let migliorPct = 0;

        if (filtri.giocata !== 'Tutti') {
          const pct = window.getGiocataPct(filtri.giocata, stats, homeMG, awayMG, mgTot);
          if (pct > 0) {
            migliorGiocata = filtri.giocata;
            migliorPct = pct;
          }
        } else {
          const famiglieDaCercare = selectedFamiglie.length > 0 ? selectedFamiglie : Object.keys(window.FAMIGLIE_GIOCATE);
          
          famiglieDaCercare.forEach(familyId => {
            const best = window.getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
            if (best && best.pct > migliorPct) {
              migliorGiocata = best.giocata;
              migliorPct = best.pct;
            }
          });
        }

        let quote = 0;
        if (migliorPct > 0) {
          const key = `${m.campionato}_${migliorGiocata}`;
          if (quotePersonalizzate[key]) {
            quote = quotePersonalizzate[key];
          } else {
            quote = (100 / migliorPct) * 0.85;
            quote = Math.round(quote * 100) / 100;
          }
        }

        return {
          ...m,
          giocata: migliorGiocata,
          pct: migliorPct,
          quote: quote,
          isBomb: migliorPct >= 90,
          colore: getColorePercentuale(migliorPct)
        };
      });

      const valide = conGiocata.filter(m => m.giocata && m.pct > 0);
      
      // Limita al numero di partite selezionato
      const limitate = valide.slice(0, filtri.numeroPartite);
      setPartiteDisponibili(limitate);
      
      // Seleziona automaticamente le prime partite disponibili (max 10)
      const maxSelezionabili = Math.min(10, limitate.length);
      const daSelezionare = limitate.slice(0, maxSelezionabili);
      setPartiteSelezionate(daSelezionare);
      
    }, [matches, filtri, selectedFamiglie, quotePersonalizzate, getDataRange]);

    const toggleSelezionePartita = (match) => {
      if (!match.giocata) return;

      setPartiteSelezionate(prev => {
        const exists = prev.find(m => m.id === match.id);
        if (exists) {
          return prev.filter(m => m.id !== match.id);
        } else {
          if (prev.length >= 10) {
            if (showAlert) showAlert('error', '⚠️ Massimo 10 partite selezionabili!');
            return prev;
          }
          return [...prev, match];
        }
      });
    };

    const isPartitaSelezionata = (matchId) => {
      return partiteSelezionate.some(m => m.id === matchId);
    };

    const calcolaTotaleQuote = useCallback(() => {
      if (partiteSelezionate.length === 0) return 0;
      return partiteSelezionate.reduce((acc, m) => acc * m.quote, 1);
    }, [partiteSelezionate]);

    const calcolaMediaPercentuali = useCallback(() => {
      if (partiteSelezionate.length === 0) return 0;
      const somma = partiteSelezionate.reduce((acc, m) => acc + m.pct, 0);
      return Math.round(somma / partiteSelezionate.length);
    }, [partiteSelezionate]);

    const calcolaVincitaPotenziale = useCallback(() => {
      const totale = calcolaTotaleQuote();
      const stake = parseFloat(schedinaCorrente.stake) || 10;
      return stake * totale;
    }, [calcolaTotaleQuote, schedinaCorrente.stake]);

    const calcolaPercentualeVincita = useCallback(() => {
      const totale = calcolaTotaleQuote();
      return (totale * 100) - 100;
    }, [calcolaTotaleQuote]);

    const salvaSchedina = () => {
      if (partiteSelezionate.length < 2) {
        if (showAlert) showAlert('error', '⚠️ Seleziona almeno 2 partite!');
        return;
      }

      const now = new Date();
      const nomeDefault = `Schedina ${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const nuovaSchedina = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        nome: schedinaCorrente.nome || nomeDefault,
        dataCreazione: new Date().toISOString(),
        partite: partiteSelezionate.map(m => ({
          id: m.id,
          casa: m.casa,
          ospiti: m.ospiti,
          campionato: m.campionato,
          data: m.data,
          giocata: m.giocata,
          pct: m.pct,
          quote: m.quote,
          isBomb: m.isBomb,
          colore: m.colore
        })),
        totaleQuote: calcolaTotaleQuote(),
        mediaPercentuali: calcolaMediaPercentuali(),
        stake: parseFloat(schedinaCorrente.stake) || 10,
        vincitaPotenziale: calcolaVincitaPotenziale(),
        percentualeVincita: calcolaPercentualeVincita()
      };

      const nuoveSchedine = [nuovaSchedina, ...schedineSalvate];
      setSchedineSalvate(nuoveSchedine);
      localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuoveSchedine));

      setPartiteSelezionate([]);
      setSchedinaCorrente({
        nome: '',
        stake: 10,
        dataCreazione: new Date().toISOString()
      });

      if (showAlert) showAlert('success', `✅ Schedina "${nuovaSchedina.nome}" salvata!`);
    };

    const eliminaSchedina = (id) => {
      if (!confirm('🗑️ Eliminare questa schedina?')) return;
      const nuove = schedineSalvate.filter(s => s.id !== id);
      setSchedineSalvate(nuove);
      localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuove));
      if (showAlert) showAlert('info', '🗑️ Schedina eliminata');
    };

    const caricaSchedina = (schedina) => {
      const partiteDaCaricare = schedina.partite.map(p => {
        const matchOriginale = matches.find(m => m.id === p.id);
        if (matchOriginale) {
          return {
            ...matchOriginale,
            giocata: p.giocata,
            pct: p.pct,
            quote: p.quote,
            isBomb: p.isBomb,
            colore: p.colore || getColorePercentuale(p.pct)
          };
        }
        return null;
      }).filter(p => p !== null);

      if (partiteDaCaricare.length > 0) {
        setPartiteSelezionate(partiteDaCaricare);
        setSchedinaCorrente({
          nome: schedina.nome,
          stake: schedina.stake,
          dataCreazione: schedina.dataCreazione
        });
        if (showAlert) showAlert('success', `📂 Schedina "${schedina.nome}" caricata!`);
      } else {
        if (showAlert) showAlert('error', '⚠️ Alcune partite non sono più disponibili');
      }
    };

    const condividiWhatsApp = () => {
      if (partiteSelezionate.length === 0) {
        if (showAlert) showAlert('error', '⚠️ Nessuna partita selezionata');
        return;
      }

      let testo = `🎯 *SCHEDINA GesssAI-Pro*\n`;
      testo += `📅 ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      partiteSelezionate.forEach((m, i) => {
        const emoji = m.isBomb ? '💣 ' : '';
        const colore = m.colore || getColorePercentuale(m.pct);
        testo += `${i+1}. ${m.casa} vs ${m.ospiti}\n`;
        testo += `   🎯 ${emoji}${m.giocata} → ${m.pct}% (${m.quote.toFixed(2)}) ${colore.label}\n\n`;
      });

      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `📊 Totale Quote: ${calcolaTotaleQuote().toFixed(2)}\n`;
      testo += `📈 Media %: ${calcolaMediaPercentuali()}%\n`;
      testo += `💰 Posta: €${parseFloat(schedinaCorrente.stake || 10).toFixed(2)}\n`;
      testo += `🏆 Vincita: €${calcolaVincitaPotenziale().toFixed(2)}\n`;
      testo += `📈 Rendimento: +${calcolaPercentualeVincita().toFixed(0)}%\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `🔗 GesssAI-Pro v3.0`;

      const url = `https://wa.me/?text=${encodeURIComponent(testo)}`;
      window.open(url, '_blank');
    };

    const condividiTelegram = () => {
      if (partiteSelezionate.length === 0) {
        if (showAlert) showAlert('error', '⚠️ Nessuna partita selezionata');
        return;
      }

      let testo = `🎯 *SCHEDINA GesssAI-Pro*\n`;
      testo += `📅 ${new Date().toLocaleDateString('it-IT')} ${new Date().toLocaleTimeString('it-IT')}\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      partiteSelezionate.forEach((m, i) => {
        const emoji = m.isBomb ? '💣 ' : '';
        const colore = m.colore || getColorePercentuale(m.pct);
        testo += `${i+1}. ${m.casa} vs ${m.ospiti}\n`;
        testo += `   🎯 ${emoji}${m.giocata} → ${m.pct}% (${m.quote.toFixed(2)}) ${colore.label}\n\n`;
      });

      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `📊 Totale Quote: ${calcolaTotaleQuote().toFixed(2)}\n`;
      testo += `📈 Media %: ${calcolaMediaPercentuali()}%\n`;
      testo += `💰 Posta: €${parseFloat(schedinaCorrente.stake || 10).toFixed(2)}\n`;
      testo += `🏆 Vincita: €${calcolaVincitaPotenziale().toFixed(2)}\n`;
      testo += `📈 Rendimento: +${calcolaPercentualeVincita().toFixed(0)}%\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `🔗 GesssAI-Pro v3.0`;

      const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(testo)}`;
      window.open(url, '_blank');
    };

    const importaQuoteExcel = (file) => {
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          if (jsonData.length === 0) {
            if (showAlert) showAlert('error', '❌ Il file è vuoto');
            return;
          }

          const nuoveQuote = {};
          jsonData.forEach(row => {
            const campionato = row['Campionato'] || row['campionato'] || row['League'] || '';
            const giocata = row['Giocata'] || row['giocata'] || row['Bet'] || '';
            const quota = parseFloat(row['Quota'] || row['quota'] || row['Odds'] || 0);
            
            if (campionato && giocata && quota > 0) {
              const key = `${campionato.trim()}_${giocata.trim()}`;
              nuoveQuote[key] = quota;
            }
          });

          if (Object.keys(nuoveQuote).length === 0) {
            if (showAlert) showAlert('error', '❌ Nessuna quota valida trovata');
            return;
          }

          const updated = { ...quotePersonalizzate, ...nuoveQuote };
          setQuotePersonalizzate(updated);
          localStorage.setItem('ft_quote_personalizzate', JSON.stringify(updated));
          
          if (showAlert) showAlert('success', `✅ Importate ${Object.keys(nuoveQuote).length} quote personalizzate!`);
        } catch (err) {
          if (showAlert) showAlert('error', '❌ Errore: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    };

    // Effetti
    useEffect(() => {
      calcolaPartite();
    }, [calcolaPartite]);

    // Render
    return (
      <div className="schedina-container" style={{ display: 'grid', gap: '16px' }}>

        {/* FILTRI */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            
            {/* Campionato */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>🏆 Campionato</label>
              <select 
                value={filtri.campionato} 
                onChange={e => setFiltri(prev => ({ ...prev, campionato: e.target.value }))}
                style={{ padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="Tutti">📊 Tutti</option>
                {championships && championships.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Data - AGGIORNATO */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>📅 Data</label>
              <select 
                value={filtri.data} 
                onChange={e => setFiltri(prev => ({ ...prev, data: e.target.value }))}
                style={{ padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="oggi">📅 Oggi (1 giorno)</option>
                <option value="oggi_domani">📅 Oggi+Domani (1-2 giorni)</option>
                <option value="oggi_3">📅 Oggi +3 giorni</option>
                <option value="tutte">📅 Tutte (+6)</option>
              </select>
            </div>

            {/* Giocata */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>🎯 Giocata</label>
              <select 
                value={filtri.giocata} 
                onChange={e => setFiltri(prev => ({ ...prev, giocata: e.target.value }))}
                style={{ padding: '5px 8px', fontSize: '12px' }}
              >
                <option value="Tutti">🎯 Migliore</option>
                {Object.values(window.FAMIGLIE_GIOCATE || {}).flatMap(f => f.options || []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Numero Partite */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>📊 Partite</label>
              <select 
                value={filtri.numeroPartite} 
                onChange={e => setFiltri(prev => ({ ...prev, numeroPartite: parseInt(e.target.value) }))}
                style={{ padding: '5px 8px', fontSize: '12px' }}
              >
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                  <option key={n} value={n}>{n} partite</option>
                ))}
              </select>
            </div>

            {/* Contatore selezioni */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Selezionate:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)' }}>{partiteSelezionate.length}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>/ 10</span>
            </div>
          </div>
        </div>

        {/* LISTA PARTITE */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>📋 Partite ({partiteDisponibili.length})</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => setPartiteSelezionate([])} style={{ fontSize: '10px', padding: '3px 10px' }}>🗑️ Deseleziona</button>
            </div>
          </div>

          {partiteDisponibili.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '28px' }}>📭</span>
              <p style={{ fontSize: '13px' }}>Nessuna partita disponibile</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '3px', maxHeight: '400px', overflowY: 'auto' }}>
              {partiteDisponibili.map(m => {
                const selezionata = isPartitaSelezionata(m.id);
                const color = window.getChampColor(m.campionato);
                const colorePct = m.colore || getColorePercentuale(m.pct);
                return (
                  <div 
                    key={m.id}
                    onClick={() => toggleSelezionePartita(m)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto auto',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      background: selezionata ? 'rgba(243, 156, 18, 0.12)' : 'var(--surface)',
                      borderRadius: '4px',
                      border: selezionata ? '1px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    <span>{selezionata ? '☑️' : '⬜'}</span>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{m.casa}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 3px' }}>vs</span>
                      <span style={{ fontWeight: 'bold' }}>{m.ospiti}</span>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.campionato}</div>
                    </div>
                    <div style={{ 
                      background: color, 
                      padding: '1px 6px', 
                      borderRadius: '3px', 
                      fontSize: '10px', 
                      fontWeight: 'bold', 
                      color: '#000' 
                    }}>
                      {m.giocata || 'N/D'}
                    </div>
                    <div style={{ fontWeight: 'bold', color: m.isBomb ? 'var(--accent)' : 'var(--text)' }}>
                      {m.pct}%{m.isBomb && '💣'}
                    </div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: 'var(--accent)',
                      background: colorePct.colore,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: '#000',
                      fontSize: '11px'
                    }}>
                      {m.quote.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SCHEDINA CORRENTE */}
        <div className="card" style={{ padding: '14px 16px', border: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>🎯 Schedina</h4>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={condividiWhatsApp} style={{ fontSize: '10px', padding: '3px 8px' }}>💬 WhatsApp</button>
              <button className="btn btn-secondary" onClick={condividiTelegram} style={{ fontSize: '10px', padding: '3px 8px' }}>📨 Telegram</button>
              <button className="btn" onClick={salvaSchedina} style={{ fontSize: '10px', padding: '3px 10px' }}>💾 Salva</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '10px' }}>📝 Nome</label>
              <input type="text" value={schedinaCorrente.nome} onChange={e => setSchedinaCorrente(prev => ({ ...prev, nome: e.target.value }))} placeholder="Nome..." style={{ padding: '4px 8px', fontSize: '12px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '10px' }}>💰 Posta (€)</label>
              <input type="number" value={schedinaCorrente.stake} onChange={e => setSchedinaCorrente(prev => ({ ...prev, stake: parseFloat(e.target.value) || 0 }))} min="0" step="0.50" style={{ padding: '4px 8px', fontSize: '12px' }} />
            </div>
          </div>

          {partiteSelezionate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>Nessuna partita selezionata</div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '3px', marginBottom: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {partiteSelezionate.map((m, i) => {
                  const colorePct = m.colore || getColorePercentuale(m.pct);
                  return (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: '4px', padding: '3px 6px', background: 'var(--surface)', borderRadius: '3px', border: '1px solid var(--border)', fontSize: '11px' }}>
                      <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>#{i+1}</span>
                      <div><span style={{ fontWeight: 'bold' }}>{m.casa}</span> vs <span style={{ fontWeight: 'bold' }}>{m.ospiti}</span></div>
                      <div style={{ 
                        background: window.getChampColor(m.campionato), 
                        padding: '0 4px', 
                        borderRadius: '2px', 
                        fontSize: '9px', 
                        fontWeight: 'bold', 
                        color: '#000' 
                      }}>
                        {m.giocata}
                      </div>
                      <div style={{ 
                        fontWeight: 'bold', 
                        color: '#000',
                        background: colorePct.colore,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10px'
                      }}>
                        {m.quote.toFixed(2)} | {m.pct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Riepilogo con MEDIA PERCENTUALI */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '4px', padding: '6px 10px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Partite</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{partiteSelezionate.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Quote Totali</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent)' }}>{calcolaTotaleQuote().toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Media %</div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: calcolaMediaPercentuali() >= 90 ? '#f39c12' : 
                           calcolaMediaPercentuali() >= 66.67 ? '#6fcf97' : 
                           calcolaMediaPercentuali() >= 33.34 ? '#8b949e' : '#eb5757'
                  }}>
                    {calcolaMediaPercentuali()}%
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Vincita</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--win)' }}>€{calcolaVincitaPotenziale().toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>Rendimento</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: calcolaPercentualeVincita() > 0 ? 'var(--win)' : 'var(--lose)' }}>+{calcolaPercentualeVincita().toFixed(0)}%</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* SCHEDINE SALVATE */}
        <div className="card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <h4 style={{ margin: 0, fontSize: '14px' }}>📂 Salvate ({schedineSalvate.length})</h4>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files[0]) importaQuoteExcel(e.target.files[0]); e.target.value = ''; }} style={{ display: 'none' }} />
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} style={{ fontSize: '10px', padding: '3px 8px' }}>📊 Importa Quote</button>
              <button className="btn btn-secondary" onClick={() => { if (confirm('🗑️ Eliminare tutte?')) { setSchedineSalvate([]); localStorage.setItem('ft_schedine_salvate', JSON.stringify([])); if (showAlert) showAlert('info', '🗑️ Tutte eliminate'); } }} style={{ fontSize: '10px', padding: '3px 8px' }}>🗑️ Tutte</button>
            </div>
          </div>

          {schedineSalvate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>Nessuna schedina salvata</div>
          ) : (
            <div style={{ display: 'grid', gap: '4px', maxHeight: '300px', overflowY: 'auto' }}>
              {schedineSalvate.map(s => (
                <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto auto', alignItems: 'center', gap: '4px', padding: '6px 10px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>{s.nome}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{new Date(s.dataCreazione).toLocaleDateString()} {s.partite.length} partite{s.partite.some(p => p.isBomb) && ' 💣'}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Quote</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{s.totaleQuote.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Media %</div>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: (s.mediaPercentuali || 0) >= 90 ? '#f39c12' : 
                             (s.mediaPercentuali || 0) >= 66.67 ? '#6fcf97' : 
                             (s.mediaPercentuali || 0) >= 33.34 ? '#8b949e' : '#eb5757'
                    }}>
                      {(s.mediaPercentuali || 0)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>Vincita</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--win)' }}>€{s.vincitaPotenziale.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button className="btn btn-secondary" onClick={() => caricaSchedina(s)} style={{ fontSize: '9px', padding: '2px 6px' }}>📂</button>
                    <button className="btn btn-danger" onClick={() => eliminaSchedina(s.id)} style={{ fontSize: '9px', padding: '2px 6px', background: 'var(--lose)' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LEGENDA */}
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '4px 12px', background: 'var(--surface)', borderRadius: '4px', border: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ color: '#f39c12' }}>💣 Oro (≥90%)</span>
          <span style={{ color: '#6fcf97' }}>🟢 Verde (66,67-89,99%)</span>
          <span style={{ color: '#8b949e' }}>⚪ Bianco (33,34-66,66%)</span>
          <span style={{ color: '#eb5757' }}>🔴 Rosso (0-33,33%)</span>
          <span>📊 Media %: media aritmetica delle percentuali selezionate</span>
          <span>💡 Clicca su una partita per selezionarla/deselezionarla</span>
        </div>
      </div>
    );
  };

  // Registra il componente globalmente
  window.SchedinaComponent = SchedinaComponent;
  console.log('✅ Modulo Schedina caricato!');

})();