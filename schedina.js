// ============================================================
// SCHEDINA.JS - Modulo Schedina per GesssAI-Pro
// ============================================================

(function() {
  'use strict';

  // ============================================================
  // COMPONENTE SCHEDINA
  // ============================================================

  const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
    const { useState, useEffect, useCallback, useMemo, useRef } = React;

    // ============================================================
    // STATI
    // ============================================================

    const [filtri, setFiltri] = useState({
      campionato: 'Tutti',
      data: 'oggi', // 'oggi', 'domani', '3gg', '6gg', 'tutte'
      giocata: 'Tutti'
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
    const [mostraSchedineSalvate, setMostraSchedineSalvate] = useState(true);
    const [quotePersonalizzate, setQuotePersonalizzate] = useState({});
    const [importandoQuote, setImportandoQuote] = useState(false);
    const [messaggio, setMessaggio] = useState(null);

    const fileInputRef = useRef(null);

    // ============================================================
    // FUNZIONI DI UTILITÀ
    // ============================================================

    const getDataRange = useCallback(() => {
      const oggi = new Date();
      oggi.setHours(0, 0, 0, 0);
      
      const ranges = {
        'oggi': { start: oggi, end: new Date(oggi) },
        'domani': { start: new Date(oggi.setDate(oggi.getDate() + 1)), end: new Date(oggi) },
        '3gg': { start: new Date(oggi), end: new Date(oggi.setDate(oggi.getDate() + 3)) },
        '6gg': { start: new Date(oggi), end: new Date(oggi.setDate(oggi.getDate() + 6)) },
        'tutte': null
      };
      
      return ranges[filtri.data] || ranges['oggi'];
    }, [filtri.data]);

    // ============================================================
    // CALCOLO PARTITE DISPONIBILI
    // ============================================================

    const calcolaPartite = useCallback(() => {
      if (!matches || matches.length === 0) {
        setPartiteDisponibili([]);
        return;
      }

      let disponibili = matches.filter(m => m.stato === 'Futura');

      // Filtro per campionato
      if (filtri.campionato !== 'Tutti') {
        disponibili = disponibili.filter(m => m.campionato === filtri.campionato);
      }

      // Filtro per data
      const range = getDataRange();
      if (range) {
        disponibili = disponibili.filter(m => {
          if (!m.data) return false;
          const dataMatch = new Date(normalizeDate(m.data));
          dataMatch.setHours(0, 0, 0, 0);
          return dataMatch >= range.start && dataMatch <= range.end;
        });
      }

      // Ordina per data
      disponibili.sort((a, b) => {
        const da = normalizeDate(a.data);
        const db = normalizeDate(b.data);
        if (!da || !db) return 0;
        return da.localeCompare(db);
      });

      // Calcola la giocata migliore per ogni partita
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

        // Se è selezionata una giocata specifica
        if (filtri.giocata !== 'Tutti') {
          const pct = window.getGiocataPct(filtri.giocata, stats, homeMG, awayMG, mgTot);
          if (pct > 0) {
            migliorGiocata = filtri.giocata;
            migliorPct = pct;
          }
        } else {
          // Cerca la migliore tra tutte le famiglie
          const famiglieDaCercare = selectedFamiglie.length > 0 ? selectedFamiglie : Object.keys(window.FAMIGLIE_GIOCATE);
          
          famiglieDaCercare.forEach(familyId => {
            const family = window.FAMIGLIE_GIOCATE[familyId];
            if (!family) return;
            
            const best = window.getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
            if (best && best.pct > migliorPct) {
              migliorGiocata = best.giocata;
              migliorPct = best.pct;
            }
          });
        }

        // Calcola la quota (se abbiamo una percentuale)
        let quote = 0;
        if (migliorPct > 0) {
          // Se c'è una quota personalizzata per questa giocata
          const key = `${m.campionato}_${migliorGiocata}`;
          if (quotePersonalizzate[key]) {
            quote = quotePersonalizzate[key];
          } else {
            // Quota base calcolata dalla percentuale
            quote = (100 / migliorPct) * 0.85; // Margine del 15%
            quote = Math.round(quote * 100) / 100;
          }
        }

        return {
          ...m,
          giocata: migliorGiocata,
          pct: migliorPct,
          quote: quote,
          isBomb: migliorPct >= 90
        };
      });

      // Filtra solo quelle con una giocata valida
      const valide = conGiocata.filter(m => m.giocata && m.pct > 0);
      setPartiteDisponibili(valide);

    }, [matches, filtri, selectedFamiglie, quotePersonalizzate, getDataRange]);

    // ============================================================
    // GESTIONE SELEZIONE PARTITE
    // ============================================================

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

    // ============================================================
    // CALCOLO SCHEDINA
    // ============================================================

    const calcolaTotaleQuote = useCallback(() => {
      if (partiteSelezionate.length === 0) return 0;
      return partiteSelezionate.reduce((acc, m) => acc * m.quote, 1);
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

    // ============================================================
    // SALVATAGGIO SCHEDINA
    // ============================================================

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
          isBomb: m.isBomb
        })),
        totaleQuote: calcolaTotaleQuote(),
        stake: parseFloat(schedinaCorrente.stake) || 10,
        vincitaPotenziale: calcolaVincitaPotenziale(),
        percentualeVincita: calcolaPercentualeVincita()
      };

      const nuoveSchedine = [nuovaSchedina, ...schedineSalvate];
      setSchedineSalvate(nuoveSchedine);
      localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuoveSchedine));

      // Reset selezione
      setPartiteSelezionate([]);
      setSchedinaCorrente({
        nome: '',
        stake: 10,
        dataCreazione: new Date().toISOString()
      });

      if (showAlert) showAlert('success', `✅ Schedina "${nuovaSchedina.nome}" salvata!`);
    };

    // ============================================================
    // ELIMINA SCHEDINA
    // ============================================================

    const eliminaSchedina = (id) => {
      if (!confirm('🗑️ Eliminare questa schedina?')) return;
      const nuove = schedineSalvate.filter(s => s.id !== id);
      setSchedineSalvate(nuove);
      localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuove));
      if (showAlert) showAlert('info', '🗑️ Schedina eliminata');
    };

    // ============================================================
    // CARICA SCHEDINA
    // ============================================================

    const caricaSchedina = (schedina) => {
      // Carica le partite della schedina come selezione corrente
      const partiteDaCaricare = schedina.partite.map(p => {
        // Trova la partita originale nei matches
        const matchOriginale = matches.find(m => m.id === p.id);
        if (matchOriginale) {
          return {
            ...matchOriginale,
            giocata: p.giocata,
            pct: p.pct,
            quote: p.quote,
            isBomb: p.isBomb
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

    // ============================================================
    // CONDIVISIONE
    // ============================================================

    const condividiWhatsApp = () => {
      if (partiteSelezionate.length === 0) {
        if (showAlert) showAlert('error', '⚠️ Nessuna partita selezionata');
        return;
      }

      const testo = generaTestoCondivisione();
      const url = `https://wa.me/?text=${encodeURIComponent(testo)}`;
      window.open(url, '_blank');
    };

    const condividiTelegram = () => {
      if (partiteSelezionate.length === 0) {
        if (showAlert) showAlert('error', '⚠️ Nessuna partita selezionata');
        return;
      }

      const testo = generaTestoCondivisione();
      const url = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(testo)}`;
      window.open(url, '_blank');
    };

    const generaTestoCondivisione = () => {
      const now = new Date();
      let testo = `🎯 *SCHEDINA GesssAI-Pro*\n`;
      testo += `📅 ${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT')}\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

      partiteSelezionate.forEach((m, i) => {
        const flag = window.getCountryFlagHtml(m.campionato);
        const emoji = m.isBomb ? '💣 ' : '';
        testo += `${i+1}. ${m.casa} vs ${m.ospiti}\n`;
        testo += `   ${flag} ${m.campionato}\n`;
        testo += `   🎯 ${emoji}${m.giocata} → ${m.pct}% (${m.quote.toFixed(2)})\n\n`;
      });

      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `📊 Totale Quote: ${calcolaTotaleQuote().toFixed(2)}\n`;
      testo += `💰 Posta: €${parseFloat(schedinaCorrente.stake || 10).toFixed(2)}\n`;
      testo += `🏆 Vincita Potenziale: €${calcolaVincitaPotenziale().toFixed(2)}\n`;
      testo += `📈 Rendimento: +${calcolaPercentualeVincita().toFixed(0)}%\n`;
      testo += `━━━━━━━━━━━━━━━━━━━━━\n`;
      testo += `🔗 GesssAI-Pro v3.0`;

      return testo;
    };

    // ============================================================
    // IMPORT QUOTE DA EXCEL
    // ============================================================

    const importaQuoteExcel = (file) => {
      if (!file) return;
      
      setImportandoQuote(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          if (jsonData.length === 0) {
            if (showAlert) showAlert('error', '❌ Il file è vuoto');
            setImportandoQuote(false);
            return;
          }

          const nuoveQuote = {};
          jsonData.forEach(row => {
            // Cerca le colonne: Campionato, Giocata, Quota
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
            setImportandoQuote(false);
            return;
          }

          setQuotePersonalizzate(prev => ({ ...prev, ...nuoveQuote }));
          localStorage.setItem('ft_quote_personalizzate', JSON.stringify({ ...quotePersonalizzate, ...nuoveQuote }));
          
          if (showAlert) showAlert('success', `✅ Importate ${Object.keys(nuoveQuote).length} quote personalizzate!`);
          
        } catch (err) {
          if (showAlert) showAlert('error', '❌ Errore nell\'importazione: ' + err.message);
        }
        setImportandoQuote(false);
      };
      
      reader.readAsArrayBuffer(file);
    };

    // ============================================================
    // EFFETTI
    // ============================================================

    useEffect(() => {
      // Carica quote personalizzate salvate
      const savedQuotes = localStorage.getItem('ft_quote_personalizzate');
      if (savedQuotes) {
        try {
          setQuotePersonalizzate(JSON.parse(savedQuotes));
        } catch (e) {}
      }
    }, []);

    useEffect(() => {
      calcolaPartite();
    }, [calcolaPartite]);

    // ============================================================
    // RENDER
    // ============================================================

    return (
      <div className="schedina-container" style={{ display: 'grid', gap: '20px' }}>

        {/* ======== FILTRI ======== */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            
            {/* Campionato */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px' }}>🏆 Campionato</label>
              <select 
                value={filtri.campionato} 
                onChange={e => setFiltri(prev => ({ ...prev, campionato: e.target.value }))}
                style={{ padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="Tutti">📊 Tutti</option>
                {championships && championships.map(c => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px' }}>📅 Data</label>
              <select 
                value={filtri.data} 
                onChange={e => setFiltri(prev => ({ ...prev, data: e.target.value }))}
                style={{ padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="oggi">📅 Oggi</option>
                <option value="domani">📅 Domani</option>
                <option value="3gg">📅 +3 giorni</option>
                <option value="6gg">📅 +6 giorni</option>
                <option value="tutte">📅 Tutte</option>
              </select>
            </div>

            {/* Giocata */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '12px' }}>🎯 Giocata</label>
              <select 
                value={filtri.giocata} 
                onChange={e => setFiltri(prev => ({ ...prev, giocata: e.target.value }))}
                style={{ padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="Tutti">🎯 Migliore</option>
                {Object.values(window.FAMIGLIE_GIOCATE).flatMap(f => f.options).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Contatore selezioni */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 12px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)', justifyContent: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Selezionate:</span>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>{partiteSelezionate.length}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 10</span>
            </div>
          </div>
        </div>

        {/* ======== LISTA PARTITE ======== */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>📋 Partite Disponibili ({partiteDisponibili.length})</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setPartiteSelezionate([])}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                🗑️ Deseleziona tutto
              </button>
              <button 
                className="btn" 
                onClick={() => {
                  // Seleziona automaticamente le migliori (max 10)
                  const migliori = [...partiteDisponibili]
                    .sort((a, b) => b.pct - a.pct)
                    .slice(0, 10);
                  setPartiteSelezionate(migliori);
                  if (showAlert) showAlert('info', `✅ Selezionate ${migliori.length} migliori partite`);
                }}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                ⭐ Auto-seleziona
              </button>
            </div>
          </div>

          {partiteDisponibili.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              <span style={{ fontSize: '32px' }}>📭</span>
              <p>Nessuna partita disponibile con i filtri selezionati</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '4px', maxHeight: '500px', overflowY: 'auto' }}>
              {partiteDisponibili.map(m => {
                const selezionata = isPartitaSelezionata(m.id);
                const flag = window.getCountryFlagHtml(m.campionato);
                const color = window.getChampColor(m.campionato);
                
                return (
                  <div 
                    key={m.id}
                    onClick={() => toggleSelezionePartita(m)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'auto 1fr auto auto auto auto',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: selezionata ? 'rgba(243, 156, 18, 0.15)' : 'var(--surface)',
                      borderRadius: '6px',
                      border: selezionata ? '2px solid var(--accent)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <span style={{ fontSize: '16px' }}>{selezionata ? '☑️' : '⬜'}</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{m.casa} vs {m.ospiti}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        <span dangerouslySetInnerHTML={{ __html: flag }} />
                        {m.campionato} • {formatDateEU(m.data)}
                      </div>
                    </div>
                    <div style={{ 
                      background: color, 
                      padding: '2px 10px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      {m.giocata || 'N/D'}
                    </div>
                    <div style={{ 
                      fontWeight: 'bold',
                      color: m.isBomb ? 'var(--accent)' : 'var(--text)'
                    }}>
                      {m.pct}%
                      {m.isBomb && <span style={{ marginLeft: '4px' }}>💣</span>}
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                      {m.quote.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      #{partiteDisponibili.indexOf(m) + 1}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======== SCHEDINA CORRENTE ======== */}
        <div className="card" style={{ padding: '16px', border: '2px solid var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>🎯 Schedina Corrente</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={condividiWhatsApp} style={{ fontSize: '11px', padding: '4px 12px' }}>
                💬 WhatsApp
              </button>
              <button className="btn btn-secondary" onClick={condividiTelegram} style={{ fontSize: '11px', padding: '4px 12px' }}>
                📨 Telegram
              </button>
              <button className="btn" onClick={salvaSchedina} style={{ fontSize: '11px', padding: '4px 12px' }}>
                💾 Salva
              </button>
            </div>
          </div>

          {/* Nome e Stake */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>📝 Nome Schedina</label>
              <input 
                type="text" 
                value={schedinaCorrente.nome} 
                onChange={e => setSchedinaCorrente(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Nome schedina..."
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ fontSize: '11px' }}>💰 Posta (€)</label>
              <input 
                type="number" 
                value={schedinaCorrente.stake} 
                onChange={e => setSchedinaCorrente(prev => ({ ...prev, stake: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="0.50"
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Lista partite selezionate */}
          {partiteSelezionate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Nessuna partita selezionata. Scegli le partite dalla lista sopra.
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gap: '4px', marginBottom: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                {partiteSelezionate.map((m, i) => (
                  <div key={m.id} style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto auto auto',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 10px',
                    background: 'var(--surface)',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>#{i+1}</span>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>{m.casa}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>vs</span>
                      <span style={{ fontWeight: 'bold' }}>{m.ospiti}</span>
                    </div>
                    <div style={{ 
                      background: window.getChampColor(m.campionato),
                      padding: '1px 8px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      {m.giocata}
                    </div>
                    <div style={{ fontWeight: 'bold', color: m.isBomb ? 'var(--accent)' : 'var(--text)' }}>
                      {m.pct}% {m.isBomb && '💣'}
                    </div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                      {m.quote.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Riepilogo */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                padding: '12px',
                background: 'var(--surface)',
                borderRadius: '6px',
                border: '1px solid var(--border)'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Partite</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{partiteSelezionate.length}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Totale Quote</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent)' }}>
                    {calcolaTotaleQuote().toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Posta</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>€{parseFloat(schedinaCorrente.stake || 10).toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vincita Potenziale</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--win)' }}>
                    €{calcolaVincitaPotenziale().toFixed(2)}
                  </div>
                  <div style={{ fontSize: '11px', color: calcolaPercentualeVincita() > 0 ? 'var(--win)' : 'var(--lose)' }}>
                    +{calcolaPercentualeVincita().toFixed(0)}%
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ======== SCHEDINE SALVATE ======== */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>📂 Schedine Salvate ({schedineSalvate.length})</h4>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  if (confirm('🗑️ Eliminare TUTTE le schedine salvate?')) {
                    setSchedineSalvate([]);
                    localStorage.setItem('ft_schedine_salvate', JSON.stringify([]));
                    if (showAlert) showAlert('info', '🗑️ Tutte le schedine eliminate');
                  }
                }}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                🗑️ Elimina tutte
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  // Importa quote Excel
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                📊 Importa Quote
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={(e) => {
                  if (e.target.files[0]) importaQuoteExcel(e.target.files[0]);
                  e.target.value = '';
                }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {schedineSalvate.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Nessuna schedina salvata. Crea la tua prima schedina!
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {schedineSalvate.map((s, idx) => (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  background: 'var(--surface)',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{s.nome}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(s.dataCreazione).toLocaleDateString('it-IT')} {new Date(s.dataCreazione).toLocaleTimeString('it-IT')}
                      {' • '}{s.partite.length} partite
                      {s.partite.some(p => p.isBomb) && <span style={{ marginLeft: '6px' }}>💣</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Quote</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{s.totaleQuote.toFixed(2)}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Vincita</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--win)' }}>€{s.vincitaPotenziale.toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => caricaSchedina(s)}
                      style={{ fontSize: '11px', padding: '3px 10px' }}
                    >
                      📂
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => eliminaSchedina(s.id)}
                      style={{ fontSize: '11px', padding: '3px 10px', background: 'var(--lose)' }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======== LEGENDA ======== */}
        <div style={{ 
          fontSize: '11px', 
          color: 'var(--text-muted)', 
          padding: '8px 16px',
          background: 'var(--surface)',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <span>💣 Bomba (≥90%)</span>
          <span>🟢 Alta (≥66%)</span>
          <span>⚪ Media (≥33%)</span>
          <span>🔴 Bassa (&lt;33%)</span>
          <span>📊 Massimo 10 partite</span>
          <span>💡 Clicca su una partita per selezionarla/deselezionarla</span>
        </div>
      </div>
    );
  };

  // ============================================================
  // REGISTRAZIONE DEL COMPONENTE
  // ============================================================

  // Esponi il componente globalmente
  window.SchedinaComponent = SchedinaComponent;

  console.log('✅ Modulo Schedina caricato!');

})();