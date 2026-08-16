// schedina.js
// Modulo Schedina per GesssAI-Pro v3.0 - CORRETTO (Fix Filtro Orario)
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
    
    const maxPct = Math.max(...giocate.map(g => g.pct));
    const topGiocate = giocate.filter(g => g.pct === maxPct);
    const randomIndex = Math.floor(Math.random() * topGiocate.length);
    
    return topGiocate[randomIndex];
  };

  // ============================================================
  // FUNZIONE CORRETTA PER VERIFICARE SE UNA PARTITA È GIÀ PASSATA
  // ============================================================
  const isMatchPassed = (match) => {
    if (!match || !match.data) {
      console.log('⚠️ Partita senza data, esclusa:', match?.casa, 'vs', match?.ospiti);
      return true; // Escludi se non c'è data
    }

    try {
      // 1. Normalizza la data usando la funzione globale se esiste, altrimenti usa quella grezza
      let dataStr = match.data;
      if (window.normalizeDate) {
        dataStr = window.normalizeDate(match.data);
      }
      
      if (!dataStr) return true;

      // 2. Parsa la data manualmente per evitare errori di formato (DD/MM/YYYY vs YYYY-MM-DD)
      // Supporta: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
      let year, month, day;
      
      if (dataStr.includes('-') && dataStr.indexOf('-') === 4) {
        // Formato YYYY-MM-DD
        [year, month, day] = dataStr.split('-').map(Number);
      } else if (dataStr.includes('/') || dataStr.includes('-')) {
        // Formato DD/MM/YYYY o DD-MM-YYYY
        const parts = dataStr.split(/[/-]/).map(Number);
        if (parts[0] > 31) { 
           // Anno prima (YYYY/DD/MM - raro ma possibile)
           [year, month, day] = parts;
        } else {
           // Giorno prima (DD/MM/YYYY)
           [day, month, year] = parts;
        }
      } else {
        console.warn('Formato data non riconosciuto:', dataStr);
        return true; // Escludi per sicurezza
      }

      // 3. Gestisci l'ora
      let oraMatch = match.ora || '';
      let ore = 0, minuti = 0;

      // Pulisci l'ora: rimuovi tutto ciò che non è numero o :
      // Esempio: "14:30(13:30)" -> "14:30"
      let oraPulita = oraMatch.replace(/[^0-9:]/g, '');

      if (oraPulita && oraPulita.includes(':')) {
        const parts = oraPulita.split(':');
        ore = parseInt(parts[0], 10) || 0;
        minuti = parseInt(parts[1], 10) || 0;
      } else if (oraPulita && oraPulita.length >= 4) {
        // Formato HHMM
        ore = parseInt(oraPulita.substring(0, 2), 10) || 0;
        minuti = parseInt(oraPulita.substring(2, 4), 10) || 0;
      } else {
        // Se non c'è ora valida, assumiamo 00:00? 
        // O meglio, se è "TBD", potremmo volerla tenere? 
        // Per sicurezza nel filtro "passate", se non sappiamo l'ora, 
        // e la data è oggi, potrebbe essere rischioso. 
        // Ma se la data è futura, va bene.
        // Qui impostiamo a 00:00 per il calcolo.
        ore = 0;
        minuti = 0;
      }

      // 4. Crea l'oggetto Date
      // Nota: new Date(year, monthIndex, day, hours, minutes)
      // monthIndex è 0-11, quindi sottraiamo 1 al mese
      const matchDateObj = new Date(year, month - 1, day, ore, minuti, 0);
      const now = new Date();

      // Debug log
      // console.log(`🔍 Check: ${match.casa} vs ${match.ospiti} | Data: ${matchDateObj.toLocaleString()} | Now: ${now.toLocaleString()}`);

      // 5. Confronto
      // Aggiungiamo un piccolo buffer di 1 minuto per evitare problemi di sincronizzazione secondi
      if (matchDateObj.getTime() < now.getTime() - 60000) {
        console.log(`❌ ESCLUSA (Passata): ${match.casa} vs ${match.ospiti} alle ${ore}:${minuti} del ${day}/${month}`);
        return true;
      }

      return false;

    } catch (e) {
      console.error('Errore critico nel parsing data/ora:', e, match);
      return true; // Escludi in caso di errore per sicurezza
    }
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

    console.log(`📅 Range date: ${todayStr} -> ${maxDateStr}`);
    console.log(`🔍 Campionati selezionati:`, campionatiSelezionati);

    // Filtra per data e campionato
    let partiteByDate = matches.filter(m => {
      if (m.stato !== 'Futura') return false;
      if (!campionatiSelezionati.includes(m.campionato)) return false;
      if (!m.data) return false;

      const normalized = window.normalizeDate ? window.normalizeDate(m.data) : m.data;
      if (!normalized) return false;

      // Controllo range date (string comparison works for YYYY-MM-DD)
      // Se normalizeDate restituisce DD/MM/YYYY, questo confronto fallisce.
      // Dobbiamo normalizzare anche qui per il confronto o affidarci a isMatchPassed per il passato.
      // Per il futuro (maxDate), facciamo un controllo approssimativo o convertiamo.
      
      // Semplificazione: filtriamo solo per "non passate" dopo, qui prendiamo un range ampio
      // Ma dobbiamo rispettare giorniRange.
      
      // Convertiamo normalized in Date per confrontare con today/maxDate
      let dParts = normalized.split(/[/-]/);
      let dObj;
      if(dParts[0].length === 4) dObj = new Date(dParts[0], dParts[1]-1, dParts[2]);
      else dObj = new Date(dParts[2], dParts[1]-1, dParts[0]);
      
      dObj.setHours(0,0,0,0);
      
      if (dObj < today || dObj > maxDate) return false;

      return true;
    });

    console.log(`📊 Partite trovate per data: ${partiteByDate.length}`);

    // ============================================================
    // APPLICA IL FILTRO ORARIO - escludi partite già passate
    // ============================================================
    const partiteFiltrate = partiteByDate.filter(m => {
      const passed = isMatchPassed(m);
      return !passed;
    });

    console.log(`⏰ Partite dopo filtro orario: ${partiteFiltrate.length}`);

    if (partiteFiltrate.length === 0) {
      const totaleEscluse = partiteByDate.length;
      let msg = `⚠️ Nessuna partita disponibile.`;
      if (totaleEscluse > 0) {
        msg += ` ${totaleEscluse} partite trovate ma tutte già passate o fuori orario!`;
      }
      showAlert('warning', msg);
      setIsLoading(false);
      setPartiteCalcolate([]);
      return;
    }

    // Ordina le partite per data e ora (crescente)
    partiteFiltrate.sort((a, b) => {
      // Usiamo la logica di parsing data anche per l'ordinamento
      const parseDate = (str) => {
         if(!str) return 0;
         let p = str.split(/[/-]/);
         if(p[0].length === 4) return new Date(p[0], p[1]-1, p[2]).getTime();
         return new Date(p[2], p[1]-1, p[0]).getTime();
      };
      
      const timeA = parseDate(a.data);
      const timeB = parseDate(b.data);
      
      if (timeA !== timeB) return timeA - timeB;
      
      // Se stessa data, ordina per ora
      const getMinutes = (oraStr) => {
        if(!oraStr) return 0;
        let clean = oraStr.replace(/[^0-9:]/g, '');
        if(clean.includes(':')) {
           let p = clean.split(':');
           return (parseInt(p[0])*60) + parseInt(p[1]);
        }
        return 0;
      };
      
      return getMinutes(a.ora) - getMinutes(b.ora);
    });

    // Calcola le giocate per ogni partita
    const partiteConGiocate = partiteFiltrate.map(m => {
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

    // Seleziona le prime N partite
    const numDaPrendere = Math.min(numPartite, partiteValide.length);
    const partiteSelezionate = partiteValide.slice(0, numDaPrendere);

    setPartiteCalcolate(partiteSelezionate);
    setIsLoading(false);

    // Mostra statistiche
    const totaliTrovate = partiteByDate.length;
    const esclusePerOrario = totaliTrovate - partiteFiltrate.length;
    const esclusePerGiocata = partiteFiltrate.length - partiteValide.length;

    let messaggio = `✅ Trovate ${partiteSelezionate.length} partite valide!`;
    if (esclusePerOrario > 0) {
      messaggio += ` (${esclusePerOrario} escluse perché già passate)`;
    }
    if (esclusePerGiocata > 0) {
      messaggio += ` (${esclusePerGiocata} senza giocate valide)`;
    }
    showAlert('success', messaggio);
  };

  // Resetta la schedina
  const resettaSchedina = () => {
    setPartiteCalcolate([]);
    showAlert('info', '🔄 Schedina resettata.');
  };

  // Rigenera la schedina
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

    const senzaGiocata = partiteCalcolate.filter(p => !p.migliorGiocata);
    if (senzaGiocata.length > 0) {
      showAlert('error', `⚠️ ${senzaGiocata.length} partita/e senza giocata selezionata!`);
      return;
    }

    const partitePassate = partiteCalcolate.filter(p => isMatchPassed(p));
    if (partitePassate.length > 0) {
      showAlert('error', `⚠️ ${partitePassate.length} partita/e sono già passate! Rigenera la schedina.`);
      return;
    }

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
      // Prova a parsare con la logica robusta
      let p = dateStr.split(/[/-]/);
      let d;
      if(p[0].length === 4) d = new Date(p[0], p[1]-1, p[2]);
      else d = new Date(p[2], p[1]-1, p[0]);
      
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

  // ============================================================
  // FUNZIONI DI CONDIVISIONE
  // ============================================================
  
  const condividiWhatsApp = (schedina) => {
    if (!schedina) return;
    const testo = generaTestoCondivisione(schedina);
    const testoEncoded = encodeURIComponent(testo);
    
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    let appUrl = '';
    let webUrl = `https://api.whatsapp.com/send?text=${testoEncoded}`;

    if (isIOS) {
      appUrl = `whatsapp://send?text=${testoEncoded}`;
    } else if (isAndroid) {
      appUrl = `intent://send?text=${testoEncoded}#Intent;package=com.whatsapp;scheme=whatsapp;end;`;
    } else {
      appUrl = `whatsapp://send?text=${testoEncoded}`;
    }

    try {
      const win = window.open(appUrl, '_blank');
      if (!win || win.closed) {
        window.open(webUrl, '_blank');
      } else {
        setTimeout(() => {
          try { if (win && !win.closed) win.close(); } catch(e){}
          window.open(webUrl, '_blank');
        }, 2000);
      }
    } catch (e) {
      window.open(webUrl, '_blank');
    }
  };

  const condividiTelegram = (schedina) => {
    if (!schedina) return;
    const testo = generaTestoCondivisione(schedina);
    const testoEncoded = encodeURIComponent(testo);
    
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    let appUrl = '';
    let webUrl = `https://t.me/share/url?url=&text=${testoEncoded}`;

    if (isIOS) {
      appUrl = `tg://msg?text=${testoEncoded}`;
    } else if (isAndroid) {
      appUrl = `intent://share/url?url=&text=${testoEncoded}#Intent;package=org.telegram.messenger;scheme=tg;end;`;
    } else {
      appUrl = `tg://msg?text=${testoEncoded}`;
    }

    try {
      const win = window.open(appUrl, '_blank');
      if (!win || win.closed) {
        window.open(webUrl, '_blank');
      } else {
        setTimeout(() => {
          try { if (win && !win.closed) win.close(); } catch(e){}
          window.open(webUrl, '_blank');
        }, 2000);
      }
    } catch (e) {
      window.open(webUrl, '_blank');
    }
  };

  // Render della modal per visualizzare la schedina
  const renderModal = () => {
    if (!showSchedinaModal || !schedinaDaVisualizzare) return null;

    const s = schedinaDaVisualizzare;
    const scoreMedio = calcolaScoreMedio(s);
    const numBombe = contaBombe(s);

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
            position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none',
            color: 'var(--text)', fontSize: '28px', cursor: 'pointer', zIndex: 10, padding: '4px 12px',
            borderRadius: '6px', transition: 'all 0.2s'
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
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => condividiWhatsApp(s)} style={{
                  background: '#25D366', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                  <span style={{ fontSize: '20px' }}>💬</span> WhatsApp
                </button>
                <button onClick={() => condividiTelegram(s)} style={{
                  background: '#0088cc', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px',
                  fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}>
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
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px',
                  marginBottom: '6px', background: isBomb ? 'rgba(243, 156, 18, 0.12)' : 'var(--surface)',
                  borderRadius: '8px', border: isBomb ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${color}`, gap: '8px', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', minWidth: '35px', textAlign: 'center' }}>#{idx + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>⚽</span>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text)' }}>{p.casa} 🆚 {p.ospiti}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '11px', color: 'var(--text-muted)', gap: '1px' }}>
                      <span>🏆 {p.campionato || 'N/D'}</span>
                      <span>📅 {dataFormattata} {ora}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: isBomb ? 'var(--accent)' : 'var(--card)', color: isBomb ? '#000' : 'var(--text)',
                      padding: '4px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold',
                      border: isBomb ? '1px solid var(--accent)' : 'none'
                    }}>
                      {p.giocata?.familyIcon} {p.giocata?.label || p.giocata?.giocata || 'N/D'}
                    </span>
                    <span style={{
                      fontWeight: 'bold', fontSize: '20px', color: isBomb ? 'var(--accent)' : color,
                      minWidth: '55px', textAlign: 'center'
                    }}>
                      {pct}% {isBomb && '💣'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: '16px', paddingTop: '12px', borderTop: '2px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={() => {
                const partiteCaricate = s.partite.map(p => ({ ...p, giocate: [p.giocata], migliorGiocata: p.giocata }));
                setPartiteCalcolate(partiteCaricate);
                showAlert('success', `📋 Schedina "${s.nome}" caricata!`);
                chiudiModal();
              }} style={{ fontSize: '12px', padding: '6px 14px' }}>
                📂 Carica
              </button>
              <button className="btn btn-danger" onClick={() => {
                if (confirm(`🗑️ Eliminare "${s.nome}"?`)) { eliminaSchedina(s.id); chiudiModal(); }
              }} style={{ fontSize: '12px', padding: '6px 14px' }}>
                🗑️ Elimina
              </button>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {s.partite?.length || 0} partite • {numBombe} 💣 • Score {scoreMedio}%
            </div>
          </div>
          
          <div style={{
            marginTop: '12px', padding: '10px 14px', background: 'var(--surface)', borderRadius: '6px',
            border: '1px solid var(--border)', maxHeight: '100px', overflowY: 'auto', fontSize: '11px',
            color: 'var(--text-muted)', fontFamily: 'monospace', whiteSpace: 'pre-wrap'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>📝 Anteprima condivisione</span>
            </div>
            {generaTestoCondivisione(s).split('\n').slice(0, 6).map((line, i) => (<div key={i}>{line}</div>))}
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
            <button className="btn btn-secondary" onClick={selezionaTuttiCampionati} style={{ fontSize: '11px', padding: '4px 12px' }}>Seleziona Tutti</button>
            <button className="btn btn-secondary" onClick={deselezionaTuttiCampionati} style={{ fontSize: '11px', padding: '4px 12px' }}>Deseleziona Tutti</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {championships.map(c => {
            const isSelected = campionatiSelezionati.includes(c.name);
            return (
              <button key={c.name} onClick={() => toggleCampionato(c.name)} style={{
                padding: '6px 16px', borderRadius: '8px',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: isSelected ? 'var(--accent)' : 'var(--surface)',
                color: isSelected ? '#000' : 'var(--text)',
                cursor: 'pointer', fontWeight: isSelected ? 'bold' : 'normal',
                transition: 'all 0.2s', fontSize: '13px'
              }}>
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
            <select value={giorniRange} onChange={e => setGiorniRange(parseInt(e.target.value))} style={{ padding: '6px 10px' }}>
              {[0, 1, 2, 3, 4, 5, 6, 7].map(n => (
                <option key={n} value={n}>{n === 0 ? 'Solo oggi' : `${n} giorni`}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '120px' }}>
            <label>📊 Numero Partite</label>
            <select value={numPartite} onChange={e => setNumPartite(parseInt(e.target.value))} style={{ padding: '6px 10px' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'flex-end', paddingBottom: '4px' }}>
            <button className="btn" onClick={calcolaSchedina} disabled={isLoading}>
              {isLoading ? '⏳ Calcolo...' : '🔍 Calcola Schedina'}
            </button>
            <button className="btn btn-secondary" onClick={resettaSchedina}>🔄 Resetta</button>
            <button className="btn btn-secondary" onClick={rigeneraSchedina} disabled={partiteCalcolate.length === 0}>🎲 Rigenera Schedina</button>
            <button className="btn" onClick={salvaSchedina} disabled={partiteCalcolate.length === 0}>💾 Salva Schedina</button>
          </div>
        </div>
      </div>

      {/* Risultati calcolati */}
      {partiteCalcolate.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, color: 'var(--accent)' }}>📋 Schedina Calcolata ({partiteCalcolate.length} partite)</h4>
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
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px',
                  background: isBomb ? 'rgba(243, 156, 18, 0.12)' : 'var(--surface)',
                  borderRadius: '6px', border: isBomb ? '2px solid var(--accent)' : '1px solid var(--border)',
                  borderLeft: `4px solid ${color}`, gap: '8px', flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '180px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', minWidth: '30px' }}>#{idx + 1}</span>
                    <span style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--text)' }}>{p.casa} 🆚 {p.ospiti}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.campionato}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>📅 {dataFormattata} {ora}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: isBomb ? 'var(--accent)' : 'var(--card)', color: isBomb ? '#000' : 'var(--text)',
                      padding: '2px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                      border: isBomb ? '1px solid var(--accent)' : 'none'
                    }}>
                      {giocata?.familyIcon} {giocata?.label || giocata?.giocata || 'N/D'}
                    </span>
                    <span style={{
                      fontWeight: 'bold', fontSize: '18px', color: isBomb ? 'var(--accent)' : color,
                      minWidth: '50px', textAlign: 'center'
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
                <div key={s.id} style={{
                  padding: '12px 14px', background: 'var(--surface)', borderRadius: '8px',
                  border: hasBombe ? '2px solid var(--accent)' : '1px solid var(--border)',
                  cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                }} onClick={() => apriSchedina(s)}
                   onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                   onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                  
                  {hasBombe && (
                    <div style={{
                      position: 'absolute', top: '6px', right: '6px', background: 'var(--accent)', color: '#000',
                      padding: '1px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold'
                    }}>💣 {numBombe}</div>
                  )}
                  
                  <div style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '14px', marginBottom: '4px' }}>{s.nome}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>🕒 {formatDateTime(s.dataCreazione)}</span>
                    <span>•</span>
                    <span>📊 {s.partite?.length || 0} partite</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {s.partite?.slice(0, 2).map((p, i) => (
                      <span key={i} style={{ background: 'var(--card)', padding: '1px 6px', borderRadius: '3px', fontSize: '10px', color: 'var(--text)' }}>
                        {p.casa} vs {p.ospiti}
                      </span>
                    ))}
                    {s.partite?.length > 2 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>+{s.partite.length - 2}</span>
                    )}
                  </div>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px',
                    paddingTop: '6px', borderTop: '1px solid var(--border)', fontSize: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', color: isHighScore ? 'var(--win)' : (scoreMedio >= 50 ? 'var(--draw)' : 'var(--lose)') }}>
                      Score: {scoreMedio}%
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>👆 Clicca per visualizzare</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {renderModal()}
    </div>
  );
};

window.SchedinaComponent = SchedinaComponent;
console.log('✅ Modulo Schedina caricato correttamente (Fix Orario v3.1)');