// ============================================================
// COMPONENTE SCHEDINA - CON CASUALITÀ 🎲 + SELEZIONE MULTIPLA CAMPIONATI
// MODIFICHE: MASSIMO 10 PARTITE + BOTTONE RIGENERA + CASUALITÀ + MULTI CAMPIONATI
// + ORDINE CRESCENTE PER DATA/ORA + CONTEGGIO PARTITE + SELEZIONE NUMERICA
// + RIGENERA USA IL NUMERO DI PARTITE SCELTO + AGGIUNTA GG/NG
// + CASUALITÀ > 80% SCEGLIE PARTITE CASUALI MA RISPETTA IL NUMERO SCELTO
// + DATA E ORA SEPARATE DA TRATTINO NELLA CONDIVISIONE
// + SEZIONI DIVISE PER OGNI OPZIONE + GG/NG IN LISTA GIOCATE
// + FILTRO RANGE GIORNI ALLINEATO CON PALINSESTO
// ============================================================

// Assicurati che FAMIGLIE_GIOCATE includa 'gg_ng'
if (typeof window.FAMIGLIE_GIOCATE === 'undefined') {
  window.FAMIGLIE_GIOCATE = {};
}

// Aggiungi la famiglia GG - NG se non esiste già
if (!window.FAMIGLIE_GIOCATE['gg_ng']) {
  window.FAMIGLIE_GIOCATE['gg_ng'] = {
    id: 'gg_ng',
    label: 'GG - NG',
    icon: '⚽',
    color: '#e74c3c',
    description: 'Goal-Goal / No Goal'
  };
}

// Funzione per calcolare la giocata GG - NG
const calcolaGG_NG = (stats) => {
  if (!stats || !stats.homeMG || !stats.awayMG) {
    return null;
  }
  
  const homeStats = stats.homeMG || {};
  const awayStats = stats.awayMG || {};
  
  // Usa le percentuali di Over 0.5 per ogni squadra
  const homeOver05 = homeStats.over05 || 55;
  const awayOver05 = awayStats.over05 || 55;
  
  // Calcola probabilità GG e NG
  const probGG = (homeOver05 / 100) * (awayOver05 / 100) * 100;
  const probNG = 100 - probGG;
  
  // Determina la giocata migliore
  if (probGG > probNG) {
    return {
      label: 'Goal-Goal (GG)',
      pct: Math.round(probGG),
      icon: '⚽',
      type: 'gg',
      isBomb: probGG > 75,
      displayLabel: '⚽ GG'
    };
  } else {
    return {
      label: 'No Goal (NG)',
      pct: Math.round(probNG),
      icon: '⚽',
      type: 'ng',
      isBomb: probNG > 75,
      displayLabel: '⚽ NG'
    };
  }
};

const SchedinaComponent = ({ matches, championships, selectedFamiglie, onSelectMatch, showAlert }) => {
  // Stato per i campionati selezionati (array di nomi)
  const [campionatiSelezionati, setCampionatiSelezionati] = useState([]);
  const [partiteSelezionate, setPartiteSelezionate] = useState([]);
  const [filtroOrario, setFiltroOrario] = useState('dopo_ora');
  const [giorniRange, setGiorniRange] = useState(1);
  const [schedinaCreata, setSchedinaCreata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [giocateSelezionate, setGiocateSelezionate] = useState(['tutte']);
  const [showSchedinaModal, setShowSchedinaModal] = useState(false);
  const [casualitaLevel, setCasualitaLevel] = useState(30);
  const [schedineSalvate, setSchedineSalvate] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ft_schedine_salvate') || '[]');
    } catch { return []; }
  });
  const [numeroPartiteDaSelezionare, setNumeroPartiteDaSelezionare] = useState(5);

  // All'avvio: seleziona tutti i campionati di default
  useEffect(() => {
    if (campionatiSelezionati.length === 0 && championships.length > 0) {
      setCampionatiSelezionati(championships.map(c => c.name));
    }
  }, [championships]);

  // Funzione per mescolare un array
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Funzione per ordinare le partite per data e ora crescente
  const ordinaPartitePerDataOra = (partite) => {
    return [...partite].sort((a, b) => {
      const dateA = normalizeDate(a.data);
      const dateB = normalizeDate(b.data);
      
      if (dateA && dateB && dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      
      const oraA = a.ora || '00:00';
      const oraB = b.ora || '00:00';
      
      const parseOra = (ora) => {
        if (ora === 'TBD' || ora === 'N/D' || !ora) return { h: 99, m: 99 };
        const parts = ora.split(':');
        if (parts.length < 2) return { h: 99, m: 99 };
        return { 
          h: parseInt(parts[0], 10) || 99, 
          m: parseInt(parts[1], 10) || 99 
        };
      };
      
      const oraAParsed = parseOra(oraA);
      const oraBParsed = parseOra(oraB);
      
      if (oraAParsed.h !== oraBParsed.h) {
        return oraAParsed.h - oraBParsed.h;
      }
      return oraAParsed.m - oraBParsed.m;
    });
  };

  // Funzione per ottenere le partite "future" con filtro orario e campionati selezionati
  // ALLINEATA CON IL PALINSESTO DI INDEX.HTML
  const getPartiteFutureConFiltro = useCallback(() => {
    const todayStr = getTodayStr();
    const maxDateStr = addDaysToDateStr(todayStr, giorniRange);
    
    let futureMatches = matches.filter(m => m.stato === 'Futura');
    
    if (campionatiSelezionati.length > 0) {
      futureMatches = futureMatches.filter(m => campionatiSelezionati.includes(m.campionato));
    }
    
    // FILTRO PER DATA: includi solo partite da oggi a oggi+giorniRange
    futureMatches = futureMatches.filter(m => {
      if (!m.data) return false;
      const normalized = normalizeDate(m.data);
      if (!normalized) return false;
      return normalized >= todayStr && normalized <= maxDateStr;
    });
    
    // FILTRO ORARIO: se "dopo ora", escludi partite già iniziate oggi
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
    
    // Ordina per data
    futureMatches.sort((a, b) => {
      const dateA = normalizeDate(a.data);
      const dateB = normalizeDate(b.data);
      if (!dateA || !dateB) return 0;
      return dateA.localeCompare(dateB);
    });
    
    return futureMatches;
  }, [matches, campionatiSelezionati, giorniRange, filtroOrario]);

  // Calcola la giocata per una partita (con GG/NG)
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
    
    const tutteGiocateValide = [];
    
    const giocateDaAnalizzare = giocateSelezionate.includes('tutte') || giocateSelezionate.length === 0
      ? Object.keys(window.FAMIGLIE_GIOCATE || {})
      : giocateSelezionate;
    
    giocateDaAnalizzare.forEach(familyId => {
      let best = null;
      
      if (familyId === 'gg_ng') {
        const ggNgResult = calcolaGG_NG(stats);
        if (ggNgResult) {
          best = {
            ...ggNgResult,
            familyId: 'gg_ng',
            familyLabel: window.FAMIGLIE_GIOCATE['gg_ng']?.label || 'GG - NG',
            familyIcon: window.FAMIGLIE_GIOCATE['gg_ng']?.icon || '⚽'
          };
        }
      } else {
        const bestBet = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
        if (bestBet && bestBet.pct > 0) {
          best = {
            ...bestBet,
            familyId: familyId,
            familyLabel: window.FAMIGLIE_GIOCATE[familyId]?.label || familyId,
            familyIcon: window.FAMIGLIE_GIOCATE[familyId]?.icon || '🎯'
          };
        }
      }
      
      if (best && best.pct > 0) {
        tutteGiocateValide.push(best);
      }
    });
    
    if (tutteGiocateValide.length > 0) {
      tutteGiocateValide.sort((a, b) => b.pct - a.pct);
      migliorGiocata = tutteGiocateValide[0];
      migliorPct = migliorGiocata.pct;
      match._tutteGiocateValide = tutteGiocateValide;
    }
    
    let score = 0;
    let giocatePct = [];
    selectedFamiglie.forEach(familyId => {
      let best = null;
      if (familyId === 'gg_ng') {
        const ggNgResult = calcolaGG_NG(stats);
        if (ggNgResult) {
          best = { ...ggNgResult, pct: ggNgResult.pct };
        }
      } else {
        best = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
      }
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
    const partiteConGiocate = partite.map(m => {
      const dettagli = calcolaGiocataPerPartita(m);
      return {
        ...m,
        giocata: dettagli.giocata,
        pct: dettagli.pct,
        score: dettagli.score,
        tutteGiocate: dettagli.tutteGiocate || []
      };
    }).filter(m => m.score > 0);
    
    const partiteOrdinate = partiteConGiocate.sort((a, b) => b.score - a.score);
    return partiteOrdinate;
  }, [getPartiteFutureConFiltro, giocateSelezionate]);

  const partiteDisponibili = getPartiteConGiocate();

  // Funzione per determinare il numero di partite da prendere (con casualità estrema)
  const getNumeroPartiteDaPrendere = (limiteMax = 10) => {
    // Se la casualità è > 80%, usa il numero scelto dall'utente ma scegli partite CASUALI
    if (casualitaLevel > 80) {
      // RISPETTA il numero scelto dall'utente
      return Math.min(numeroPartiteDaSelezionare, limiteMax, partiteDisponibili.length, 10);
    } else {
      // Usa il numero scelto dall'utente
      return Math.min(numeroPartiteDaSelezionare, limiteMax, partiteDisponibili.length, 10);
    }
  };

  // Seleziona un numero personalizzato di partite
  const selezionaNumeroPartite = (n) => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile.');
      return;
    }
    
    // Determina quante partite prendere (rispetta n anche se casualità > 80%)
    const numeroDaPrendere = Math.min(n, partiteDisponibili.length, 10);
    let messaggioExtra = '';
    
    // Se la casualità è > 80%, scegli partite CASUALI dalla lista
    let migliori;
    if (casualitaLevel > 80) {
      const shuffled = shuffleArray(partiteDisponibili);
      migliori = shuffled.slice(0, numeroDaPrendere);
      messaggioExtra = ` 🎲🎲🎲 (scelte casualmente!)`;
    } else {
      migliori = partiteDisponibili.slice(0, numeroDaPrendere);
    }
    
    const miglioriOrdinate = ordinaPartitePerDataOra(migliori);
    setPartiteSelezionate(miglioriOrdinate);
    showAlert('success', `✅ Selezionate ${miglioriOrdinate.length} partite!${messaggioExtra}`);
  };

  // RIGENERA - rispetta i filtri e il numero di partite scelto
  const rigeneraSchedina = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile per rigenerare la schedina.');
      return;
    }

    // RISPETTA il numero di partite scelto dall'utente
    const numeroPartiteDesiderato = Math.min(numeroPartiteDaSelezionare, partiteDisponibili.length, 10);
    
    // Se casualità > 80%, scegli partite CASUALI
    if (casualitaLevel > 80) {
      const shuffled = shuffleArray(partiteDisponibili);
      const selezionate = shuffled.slice(0, numeroPartiteDesiderato);
      const selezionateOrdinate = ordinaPartitePerDataOra(selezionate);
      setPartiteSelezionate(selezionateOrdinate);
      showAlert('success', `🎲🎲🎲 CASUALITÀ ESTREMA! ${selezionateOrdinate.length} partite selezionate a caso! (rispettato il numero scelto: ${numeroPartiteDesiderato})`);
      return;
    }

    // Altrimenti usa il metodo standard con i punteggi
    const partitePerScore = {};
    partiteDisponibili.forEach(m => {
      const score = m.score;
      if (!partitePerScore[score]) partitePerScore[score] = [];
      partitePerScore[score].push(m);
    });

    const scores = Object.keys(partitePerScore).map(Number).sort((a, b) => b - a);
    let selezionate = [];
    
    for (const score of scores) {
      if (selezionate.length >= numeroPartiteDesiderato) break;
      
      let partiteGruppo = partitePerScore[score];
      if (partiteGruppo.length === 0) continue;
      
      const postiDisponibili = numeroPartiteDesiderato - selezionate.length;
      let shuffled = shuffleArray(partiteGruppo);
      
      let daPrendereCount;
      if (casualitaLevel > 50) {
        const percentuale = 0.5 + (casualitaLevel - 50) / 100;
        daPrendereCount = Math.min(
          Math.ceil(partiteGruppo.length * percentuale),
          postiDisponibili
        );
        daPrendereCount = Math.max(1, daPrendereCount);
      } else {
        daPrendereCount = Math.min(partiteGruppo.length, postiDisponibili);
      }
      
      const daPrendere = shuffled.slice(0, daPrendereCount);
      selezionate = [...selezionate, ...daPrendere];
    }
    
    if (selezionate.length < numeroPartiteDesiderato) {
      const idsSelezionati = new Set(selezionate.map(m => m.id));
      let rimanenti = partiteDisponibili.filter(m => !idsSelezionati.has(m.id));
      rimanenti = shuffleArray(rimanenti);
      const postiDisponibili = numeroPartiteDesiderato - selezionate.length;
      const daPrendere = rimanenti.slice(0, postiDisponibili);
      selezionate = [...selezionate, ...daPrendere];
    }
    
    if (selezionate.length < 2) {
      const shuffledAll = shuffleArray(partiteDisponibili);
      const daPrendereCount = Math.min(numeroPartiteDesiderato, partiteDisponibili.length);
      selezionate = shuffledAll.slice(0, daPrendereCount);
    }
    
    const selezionateOrdinate = ordinaPartitePerDataOra(selezionate);
    setPartiteSelezionate(selezionateOrdinate);
    
    let emojiCasualita = '🎲';
    let messaggioCasualita = '';
    if (casualitaLevel > 80) {
      emojiCasualita = '🎲🎲🎲';
      messaggioCasualita = `🎲🎲🎲 CASUALITÀ ESTREMA! ${selezionateOrdinate.length} partite selezionate a caso!`;
    } else if (casualitaLevel > 50) {
      emojiCasualita = '🎲🎲';
      messaggioCasualita = `${selezionateOrdinate.length} partite selezionate con mix casuale`;
    } else {
      messaggioCasualita = `${selezionateOrdinate.length} partite selezionate (poche variazioni)`;
    }
    
    showAlert('success', `🔄 Schedina rigenerata! ${messaggioCasualita} ${emojiCasualita} Livello: ${casualitaLevel}%`);
  };

  // SELEZIONE CASUALE - con casualità estrema
  const selezionaCasuale = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile.');
      return;
    }
    
    const numeroPartiteDesiderato = Math.min(numeroPartiteDaSelezionare, partiteDisponibili.length, 10);
    const shuffled = shuffleArray(partiteDisponibili);
    const selezionate = shuffled.slice(0, numeroPartiteDesiderato);
    const selezionateOrdinate = ordinaPartitePerDataOra(selezionate);
    setPartiteSelezionate(selezionateOrdinate);
    
    let messaggio = `🎲 ${selezionateOrdinate.length} partite selezionate casualmente!`;
    if (casualitaLevel > 80) {
      messaggio = `🎲🎲🎲 CASUALITÀ ESTREMA! ${selezionateOrdinate.length} partite selezionate a caso!`;
    }
    showAlert('success', messaggio);
  };

  const togglePartita = (match) => {
    setPartiteSelezionate(prev => {
      const exists = prev.find(m => m.id === match.id);
      let nuovePartite;
      if (exists) {
        nuovePartite = prev.filter(m => m.id !== match.id);
      } else {
        if (prev.length >= 10) {
          showAlert('error', '⚠️ Massimo 10 partite per schedina!');
          return prev;
        }
        nuovePartite = [...prev, match];
      }
      return ordinaPartitePerDataOra(nuovePartite);
    });
  };

  // CREA SCHEDINA
  const creaSchedina = () => {
    if (partiteSelezionate.length < 2) {
      showAlert('error', '⚠️ Seleziona almeno 2 partite per creare la schedina!');
      return;
    }
    
    setLoading(true);
    const partiteOrdinate = ordinaPartitePerDataOra(partiteSelezionate);
    
    const schedina = partiteOrdinate.map(m => {
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
    
    const datePartite = schedina.map(m => normalizeDate(m.data)).filter(d => d);
    const dataInizio = datePartite.length > 0 ? datePartite[0] : 'N/D';
    const dataFine = datePartite.length > 0 ? datePartite[datePartite.length - 1] : 'N/D';
    
    const nuovaSchedina = {
      id: Date.now().toString(36),
      partite: schedina,
      totale: totaleScore,
      media: mediaScore,
      numPartite: schedina.length,
      data: new Date().toISOString(),
      dataFormattata: new Date().toLocaleString('it-IT'),
      giocateSelezionate: [...giocateSelezionate],
      campionatiSelezionati: [...campionatiSelezionati],
      timestamp: new Date().toLocaleString('it-IT'),
      dataInizio: dataInizio,
      dataFine: dataFine,
      rangeGiorni: giorniRange,
      filtroOrario: filtroOrario,
      casualitaLevel: casualitaLevel
    };
    
    setSchedinaCreata(nuovaSchedina);
    
    const salvate = [...schedineSalvate];
    salvate.push(nuovaSchedina);
    localStorage.setItem('ft_schedine_salvate', JSON.stringify(salvate));
    setSchedineSalvate(salvate);
    
    setLoading(false);
    showAlert('success', `🎯 Schedina creata! ${schedina.length} partite dal ${formatDateEU(dataInizio)} al ${formatDateEU(dataFine)} - Media score: ${mediaScore}%`);
    setShowSchedinaModal(true);
  };

  const resettaSchedina = () => {
    setPartiteSelezionate([]);
    setSchedinaCreata(null);
    showAlert('info', '🔄 Schedina resettata');
  };

  const toggleCampionato = (nomeCampionato) => {
    setCampionatiSelezionati(prev => {
      if (prev.includes(nomeCampionato)) {
        return prev.filter(c => c !== nomeCampionato);
      } else {
        return [...prev, nomeCampionato];
      }
    });
  };

  const selezionaTuttiCampionati = () => {
    setCampionatiSelezionati(championships.map(c => c.name));
  };

  const deselezionaTuttiCampionati = () => {
    setCampionatiSelezionati([]);
  };

  const toggleGiocata = (giocataId) => {
    setGiocateSelezionate(prev => {
      if (giocataId === 'tutte') {
        return ['tutte'];
      }
      
      const newSelection = prev.includes(giocataId) 
        ? prev.filter(id => id !== giocataId)
        : [...prev.filter(id => id !== 'tutte'), giocataId];
      
      if (newSelection.length === 0) {
        return ['tutte'];
      }
      
      return newSelection;
    });
  };

  const selezionaTutteGiocate = () => {
    setGiocateSelezionate(['tutte']);
  };

  const deselezionaTutteGiocate = () => {
    setGiocateSelezionate([]);
    setTimeout(() => {
      setGiocateSelezionate(prev => prev.length === 0 ? ['tutte'] : prev);
    }, 0);
  };

  // ============================================================
  // FORMATTAZIONE SCHEDINA PER CONDIVISIONE - CON TRATTINO
  // ============================================================
  const formatSchedinaText = (schedina) => {
    if (!schedina || !schedina.partite) {
      console.error('❌ Schedina non valida per la formattazione');
      return '🎯 Errore nella generazione della schedina';
    }
    
    const lines = [];
    lines.push('🎯 *SCHEDINA GesssAI-Pro*');
    lines.push(`📅 ${schedina.dataFormattata || new Date().toLocaleString('it-IT')}`);
    lines.push(`📊 ${schedina.numPartite} partite • Media: ${schedina.media}%`);
    
    if (schedina.casualitaLevel > 80) {
      lines.push(`🎲🎲🎲 CASUALITÀ ESTREMA: ${schedina.casualitaLevel}%`);
    } else if (schedina.casualitaLevel > 50) {
      lines.push(`🎲🎲 Casualità media: ${schedina.casualitaLevel}%`);
    }
    
    if (schedina.dataInizio && schedina.dataFine) {
      const inizio = formatDateEU(schedina.dataInizio);
      const fine = formatDateEU(schedina.dataFine);
      if (inizio === fine) {
        lines.push(`📆 Data: ${inizio}`);
      } else {
        lines.push(`📆 Dal ${inizio} al ${fine}`);
      }
    }
    
    if (schedina.campionatiSelezionati && schedina.campionatiSelezionati.length > 0) {
      const champsDisplay = schedina.campionatiSelezionati.length === championships.length 
        ? 'Tutti' 
        : schedina.campionatiSelezionati.join(', ');
      lines.push(`🏆 Campionati: ${champsDisplay}`);
    }
    
    if (schedina.giocateSelezionate && schedina.giocateSelezionate.length > 0) {
      const giocateDisplay = schedina.giocateSelezionate.includes('tutte')
        ? '⭐ Tutte'
        : schedina.giocateSelezionate.map(id => window.FAMIGLIE_GIOCATE[id]?.label || id).join(', ');
      lines.push(`🎯 Giocate: ${giocateDisplay}`);
    }
    
    if (schedina.giocateSelezionate && schedina.giocateSelezionate.includes('gg_ng')) {
      lines.push(`⚽ GG/NG attivo`);
    }
    
    lines.push('───────────────────');
    lines.push('');
    
    // Itera sulle partite - DATA e ORA separate da trattino
    schedina.partite.forEach((m, idx) => {
      // FORMATTAZIONE CON TRATTINO: "DD/MM/YYYY - HH:MM"
      const dataFormattata = formatDateEU(m.data);
      const oraFormattata = m.ora && m.ora !== 'TBD' ? m.ora : '--:--';
      lines.push(`📅 ${dataFormattata} - ${oraFormattata}`);
      lines.push(`🏆 ${m.campionato}`);
      lines.push(`⚽ ${m.casa} vs ${m.ospiti}`);
      
      const giocataLabel = m.giocata ? `${m.giocata.familyIcon} ${m.giocata.label}` : 'N/A';
      const pctDisplay = m.pct || 0;
      const bombEmoji = m.giocata?.isBomb ? ' 💣' : '';
      const ggngTag = m.giocata?.familyId === 'gg_ng' ? ' ⚽GG/NG' : '';
      lines.push(`🎯 ${giocataLabel} → ${pctDisplay}%${bombEmoji}${ggngTag}`);
      
      if (idx < schedina.partite.length - 1) lines.push('');
    });
    
    lines.push('');
    lines.push('───────────────────');
    lines.push(`⭐ Media Score: ${schedina.media}%`);
    lines.push(`📊 Numero partite: ${schedina.numPartite}`);
    lines.push('💣 GesssAI-Pro v3.0');
    lines.push('⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.');
    
    return lines.join('\n');
  };

  // ============================================================
  // FUNZIONI DI CONDIVISIONE
  // ============================================================
  
  const copySchedinaToClipboard = () => {
    if (!schedinaCreata) {
      showAlert('error', '❌ Nessuna schedina da copiare!');
      return;
    }
    const text = formatSchedinaText(schedinaCreata);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showAlert('success', '📋 Schedina copiata negli appunti!'))
        .catch(() => showAlert('error', '❌ Errore nella copia'));
    } else {
      // Fallback per browser vecchi
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showAlert('success', '📋 Schedina copiata negli appunti!');
      } catch (e) {
        showAlert('error', '❌ Errore nella copia');
      }
      document.body.removeChild(textarea);
    }
  };

  const shareOnWhatsApp = () => {
    if (!schedinaCreata) {
      showAlert('error', '❌ Nessuna schedina da condividere!');
      return;
    }
    const text = formatSchedinaText(schedinaCreata);
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareOnTelegram = () => {
    if (!schedinaCreata) {
      showAlert('error', '❌ Nessuna schedina da condividere!');
      return;
    }
    const text = formatSchedinaText(schedinaCreata);
    const url = `https://t.me/share/url?url=${encodeURIComponent('🎯 Schedina GesssAI-Pro')}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const salvaSchedinaLocale = () => {
    if (!schedinaCreata) {
      showAlert('error', '❌ Nessuna schedina da salvare!');
      return;
    }
    const now = new Date();
    const nomeFile = `Schedina_GesssAI_${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
    
    const text = formatSchedinaText(schedinaCreata);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nomeFile}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('success', `💾 Schedina salvata come ${nomeFile}.txt`);
  };

  const eliminaSchedinaSalvata = (id) => {
    if (!confirm('⚠️ Sei sicuro di voler eliminare questa schedina salvata?')) return;
    const nuoveSalvate = schedineSalvate.filter(s => s.id !== id);
    localStorage.setItem('ft_schedine_salvate', JSON.stringify(nuoveSalvate));
    setSchedineSalvate(nuoveSalvate);
    showAlert('success', '🗑️ Schedina eliminata!');
  };

  const caricaSchedinaSalvata = (schedina) => {
    setSchedinaCreata(schedina);
    const partiteOrdinate = ordinaPartitePerDataOra(schedina.partite);
    setPartiteSelezionate(partiteOrdinate);
    if (schedina.campionatiSelezionati) {
      setCampionatiSelezionati(schedina.campionatiSelezionati);
    }
    if (schedina.giocateSelezionate) {
      setGiocateSelezionate(schedina.giocateSelezionate);
    }
    setShowSchedinaModal(true);
    showAlert('success', `📂 Schedina caricata! ${schedina.numPartite} partite, media ${schedina.media}%`);
  };

  // COSTRUISCI LA LISTA DELLE FAMIGLIE DISPONIBILI IN MODO STATICO
  // per essere SICURO che GG/NG sia sempre presente
  const famiglieDisponibili = [
    { id: 'tutte', label: '⭐ Tutte', icon: '⭐' },
    { id: 'gg_ng', label: 'GG - NG', icon: '⚽' },
    ...Object.entries(window.FAMIGLIE_GIOCATE || {})
      .filter(([id]) => id !== 'gg_ng') // Evita duplicati
      .map(([id, family]) => ({
        id: id,
        label: family.label,
        icon: family.icon
      }))
  ];

  function hexToRgb(hex) {
    if (hex.startsWith('#')) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '243, 156, 18';
    }
    return '243, 156, 18';
  }

  return (
    <div className="schedina-container">
      <div className="card" style={{marginBottom: '20px'}}>
        <h3 style={{color: 'var(--accent)', marginBottom: '16px', fontSize: '20px'}}>
          🎯 Crea Schedina {casualitaLevel > 50 ? '🎲' : ''}
        </h3>
        
        {/* ============================================================ */}
        {/* SEZIONE 1: CAMPIONATI */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '20px', 
          padding: '14px 16px', 
          background: 'var(--background)', 
          borderRadius: '10px', 
          border: '2px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px'
          }}>
            <span style={{fontSize: '15px', fontWeight: 'bold', color: 'var(--text)'}}>
              🏆 Seleziona Campionati
            </span>
            <div style={{display: 'flex', gap: '6px'}}>
              <button 
                className="btn" 
                onClick={selezionaTuttiCampionati}
                style={{
                  fontSize: '10px',
                  padding: '3px 14px',
                  background: campionatiSelezionati.length === championships.length ? 'var(--accent)' : 'var(--surface)',
                  color: campionatiSelezionati.length === championships.length ? '#000' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ✅ Tutti
              </button>
              <button 
                className="btn" 
                onClick={deselezionaTuttiCampionati}
                style={{
                  fontSize: '10px',
                  padding: '3px 14px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Deseleziona
              </button>
              <span style={{fontSize: '11px', color: 'var(--text-muted)', padding: '3px 10px', background: 'var(--surface)', borderRadius: '4px'}}>
                {campionatiSelezionati.length} / {championships.length}
              </span>
            </div>
          </div>
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            {championships.map(c => {
              const isSelected = campionatiSelezionati.includes(c.name);
              const color = getChampColor(c.name);
              return (
                <button 
                  key={c.name}
                  onClick={() => toggleCampionato(c.name)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '8px',
                    border: isSelected ? `2px solid ${color}` : '1px solid var(--border)',
                    background: isSelected ? `rgba(${hexToRgb(color)}, 0.12)` : 'var(--surface)',
                    color: isSelected ? color : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 12px rgba(${hexToRgb(color)}, 0.15)` : 'none'
                  }}
                >
                  {isSelected ? '✅' : '⚪'} {c.name}
                </button>
              );
            })}
          </div>
          <div style={{fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic'}}>
            Seleziona uno o più campionati da cui prendere le partite
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 2: GIOCATE (con GG/NG in lista) */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '20px', 
          padding: '14px 16px', 
          background: 'var(--background)', 
          borderRadius: '10px', 
          border: '2px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px'
          }}>
            <span style={{fontSize: '15px', fontWeight: 'bold', color: 'var(--text)'}}>
              🎯 Seleziona Giocate
            </span>
            <div style={{display: 'flex', gap: '6px'}}>
              <button 
                className="btn" 
                onClick={selezionaTutteGiocate}
                style={{
                  fontSize: '10px',
                  padding: '3px 14px',
                  background: giocateSelezionate.includes('tutte') ? 'var(--accent)' : 'var(--surface)',
                  color: giocateSelezionate.includes('tutte') ? '#000' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⭐ Tutte
              </button>
              <button 
                className="btn" 
                onClick={deselezionaTutteGiocate}
                style={{
                  fontSize: '10px',
                  padding: '3px 14px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ❌ Deseleziona
              </button>
              <span style={{fontSize: '11px', color: 'var(--text-muted)', padding: '3px 10px', background: 'var(--surface)', borderRadius: '4px'}}>
                {giocateSelezionate.includes('tutte') ? '⭐ Tutte' : `${giocateSelezionate.length} selezionate`}
              </span>
            </div>
          </div>
          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
            {famiglieDisponibili.map(f => {
              const isSelected = giocateSelezionate.includes(f.id);
              const isTutte = f.id === 'tutte';
              const isGGNG = f.id === 'gg_ng';
              return (
                <button 
                  key={f.id}
                  onClick={() => toggleGiocata(f.id)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    border: isSelected 
                      ? (isGGNG ? '2px solid #e74c3c' : '2px solid var(--accent)') 
                      : '1px solid var(--border)',
                    background: isSelected 
                      ? (isGGNG ? 'rgba(231, 76, 60, 0.12)' : 'rgba(243, 156, 18, 0.10)') 
                      : 'var(--surface)',
                    color: isSelected 
                      ? (isGGNG ? '#e74c3c' : 'var(--accent)') 
                      : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: isSelected ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    opacity: isSelected ? 1 : 0.6,
                    boxShadow: isSelected 
                      ? (isGGNG ? '0 0 20px rgba(231, 76, 60, 0.2)' : '0 0 15px rgba(243, 156, 18, 0.15)') 
                      : 'none'
                  }}
                >
                  {isSelected ? '✅' : (isTutte ? '⭐' : f.icon)} {f.label}
                  {isGGNG && <span style={{fontSize: '11px', marginLeft: '4px', color: '#e74c3c'}}>⚽</span>}
                </button>
              );
            })}
          </div>
          <div style={{fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px', fontStyle: 'italic'}}>
            {giocateSelezionate.includes('tutte') 
              ? '⭐ Analizza TUTTE le famiglie di giocate (incluso GG - NG)'
              : `📊 Analizza ${giocateSelezionate.length} famiglia/e: ${giocateSelezionate.map(id => window.FAMIGLIE_GIOCATE[id]?.label || id).join(', ')}`}
            {giocateSelezionate.includes('gg_ng') && <span style={{marginLeft: '6px', color: '#e74c3c', fontWeight: 'bold'}}>⚽ GG/NG attivo!</span>}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 3: FILTRI DATA/ORA (ALLINEATO CON PALINSESTO) */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '20px', 
          padding: '14px 16px', 
          background: 'var(--background)', 
          borderRadius: '10px', 
          border: '2px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            <span style={{fontSize: '15px', fontWeight: 'bold', color: 'var(--text)'}}>
              📅 Filtri Data e Orario
            </span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center'}}>
            <div style={{flex: '1', minWidth: '160px'}}>
              <label style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '4px'}}>
                📆 Range Giorni
              </label>
              <select 
                value={giorniRange} 
                onChange={e => setGiorniRange(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                <option value="0">Oggi (0)</option>
                <option value="1">Oggi - Domani (0-1)</option>
                <option value="2">Oggi - Dopodomani (0-2)</option>
                <option value="3">Oggi - +3 (0-3)</option>
                <option value="4">Oggi - +4 (0-4)</option>
                <option value="5">Oggi - +5 (0-5)</option>
                <option value="6">Oggi - +6 (0-6)</option>
                <option value="7">Oggi - +7 (0-7)</option>
              </select>
            </div>
            
            <div style={{flex: '1', minWidth: '160px'}}>
              <label style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '4px'}}>
                ⏰ Filtro Orario
              </label>
              <div style={{display: 'flex', background: 'var(--surface)', borderRadius: '6px', padding: '3px', border: '1px solid var(--border)'}}>
                <button 
                  onClick={() => setFiltroOrario('dopo_ora')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '4px',
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
                  onClick={() => setFiltroOrario('giorno_intero')}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '11px',
                    borderRadius: '4px',
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
              <div style={{fontSize: '9px', color: 'var(--text-muted)', marginTop: '3px', textAlign: 'center'}}>
                {filtroOrario === 'dopo_ora' ? 'Solo partite non ancora iniziate' : 'Tutte le partite del giorno'}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 4: CASUALITÀ */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '20px', 
          padding: '14px 16px', 
          background: 'var(--background)', 
          borderRadius: '10px', 
          border: '2px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            <span style={{fontSize: '15px', fontWeight: 'bold', color: 'var(--text)'}}>
              🎲 Livello di Casualità
            </span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <span style={{fontSize: '22px'}}>🎲</span>
            </div>
            <div style={{flex: '1', minWidth: '140px'}}>
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
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', minWidth: '90px'}}>
              <span style={{fontSize: '16px', fontWeight: 'bold', color: '#8e44ad'}}>{casualitaLevel}%</span>
              <span style={{fontSize: '22px'}}>
                {casualitaLevel > 80 ? '🎲🎲🎲' : casualitaLevel > 50 ? '🎲🎲' : casualitaLevel > 20 ? '🎲' : '📊'}
              </span>
            </div>
            <div style={{fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic'}}>
              {casualitaLevel <= 20 ? '📊 Prevedibile' : 
               casualitaLevel <= 50 ? '🎲 Un po\' di casualità' : 
               casualitaLevel <= 80 ? '🎲🎲 Media casualità' : 
               '🎲🎲🎲 MOLTO CASUALE!'}
            </div>
          </div>
          {casualitaLevel > 80 && (
            <div style={{
              marginTop: '8px', 
              fontSize: '12px', 
              color: '#e74c3c', 
              fontWeight: 'bold', 
              textAlign: 'center',
              background: 'rgba(231, 76, 60, 0.08)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid rgba(231, 76, 60, 0.2)'
            }}>
              ⚠️ CASUALITÀ ESTREMA! Le partite vengono scelte CASUALMENTE (ma viene rispettato il numero scelto)
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 5: STATISTICHE */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '16px', 
          padding: '10px 16px', 
          background: 'var(--surface)', 
          borderRadius: '8px', 
          border: '1px solid var(--border)'
        }}>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '13px'}}>
            <span>📊 <b>{partiteDisponibili.length}</b> partite disponibili</span>
            <span>⭐ Media score: <b style={{color: 'var(--accent)'}}>
              {partiteDisponibili.length > 0 ? Math.round(partiteDisponibili.reduce((s, m) => s + m.score, 0) / partiteDisponibili.length) : 0}%
            </b></span>
            <span>🎯 Selezionate: <b style={{color: 'var(--win)'}}>{partiteSelezionate.length}</b> / {numeroPartiteDaSelezionare}</span>
            {partiteSelezionate.length > 0 && (
              <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                📅 {formatDateEU(partiteSelezionate[0].data)} → {formatDateEU(partiteSelezionate[partiteSelezionate.length-1].data)}
              </span>
            )}
            {giocateSelezionate.includes('gg_ng') && (
              <span style={{color: '#e74c3c', fontWeight: 'bold', fontSize: '11px'}}>⚽ GG/NG attivo</span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 6: SELEZIONE NUMERO PARTITE */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '16px', 
          padding: '14px 16px', 
          background: 'var(--background)', 
          borderRadius: '10px', 
          border: '2px solid var(--border)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div style={{
            borderBottom: '1px solid var(--border)',
            paddingBottom: '8px',
            marginBottom: '10px'
          }}>
            <span style={{fontSize: '15px', fontWeight: 'bold', color: 'var(--text)'}}>
              📊 Numero di Partite
            </span>
          </div>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '5px 14px', borderRadius: '8px', border: '1px solid var(--border)'}}>
              <span style={{fontSize: '13px', fontWeight: 'bold', color: 'var(--text)'}}>📊 Numero partite:</span>
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={numeroPartiteDaSelezionare} 
                onChange={e => {
                  const val = parseInt(e.target.value) || 1;
                  setNumeroPartiteDaSelezionare(Math.min(10, Math.max(1, val)));
                }}
                style={{
                  width: '44px',
                  padding: '4px 6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  textAlign: 'center',
                  background: 'var(--background)',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  outline: 'none'
                }}
              />
              <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>(1-10)</span>
              {casualitaLevel > 80 && (
                <span style={{fontSize: '10px', color: '#e74c3c', fontWeight: 'bold', background: 'rgba(231,76,60,0.1)', padding: '2px 10px', borderRadius: '4px'}}>
                  🎲 RISPETTATO!
                </span>
              )}
            </div>
            
            <button 
              className="btn" 
              onClick={() => selezionaNumeroPartite(numeroPartiteDaSelezionare)} 
              style={{
                background: 'var(--accent2)', 
                color: '#000',
                padding: '6px 16px',
                fontWeight: 'bold'
              }}
            >
              ⚡ Seleziona
            </button>
            
            <div style={{display: 'flex', gap: '4px', flexWrap: 'wrap', marginLeft: 'auto'}}>
              <button className="btn" onClick={() => selezionaNumeroPartite(3)} style={{fontSize: '12px', padding: '5px 12px'}}>Top 3</button>
              <button className="btn" onClick={() => selezionaNumeroPartite(5)} style={{fontSize: '12px', padding: '5px 12px'}}>Top 5</button>
              <button className="btn" onClick={() => selezionaNumeroPartite(10)} style={{fontSize: '12px', padding: '5px 12px'}}>Top 10</button>
              <button 
                className="btn" 
                onClick={() => selezionaNumeroPartite(partiteDisponibili.length)} 
                style={{fontSize: '11px', padding: '5px 12px'}}
              >
                📋 Tutte ({partiteDisponibili.length})
              </button>
            </div>
          </div>
          {casualitaLevel > 80 && (
            <div style={{
              marginTop: '6px',
              fontSize: '10px',
              color: '#8e44ad',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              🎲 Con casualità estrema, le partite vengono scelte CASUALMENTE dalla lista, ma il numero scelto viene rispettato
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SEZIONE 7: PULSANTI AZIONE */}
        {/* ============================================================ */}
        <div style={{
          marginBottom: '12px',
          padding: '12px 16px',
          background: 'var(--surface)',
          borderRadius: '10px',
          border: '2px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', gap: '6px', flexWrap: 'wrap'}}>
            <button className="btn" onClick={selezionaCasuale} style={{background: '#8e44ad', color: '#fff', fontWeight: 'bold'}}>
              🎲 Casuale
            </button>
            <button className="btn" onClick={rigeneraSchedina} style={{background: 'var(--accent2)', color: '#000', fontWeight: 'bold'}}>
              🔄 Rigenera {casualitaLevel > 50 ? '🎲' : ''}
            </button>
            <button className="btn btn-secondary" onClick={resettaSchedina}>
              🗑️ Resetta
            </button>
          </div>
          
          <button 
            className="btn" 
            onClick={creaSchedina} 
            disabled={partiteSelezionate.length < 2 || loading} 
            style={{
              marginLeft: 'auto',
              background: partiteSelezionate.length >= 2 ? 'var(--accent)' : 'var(--surface)',
              color: partiteSelezionate.length >= 2 ? '#000' : 'var(--text-muted)',
              fontWeight: 'bold',
              padding: '8px 20px',
              fontSize: '14px'
            }}
          >
            {loading ? '⏳ Creazione...' : `🎯 Crea Schedina (${partiteSelezionate.length})`}
          </button>
        </div>
        
        {/* ===== LEGENDA ===== */}
        <div style={{
          marginTop: '8px', 
          padding: '10px 14px', 
          background: 'var(--surface)', 
          borderRadius: '8px', 
          border: '1px dashed var(--border)', 
          fontSize: '10px', 
          color: 'var(--text-muted)'
        }}>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '14px'}}>
            <span>💡 Clicca su una partita per selezionarla/deselezionarla</span>
            <span>📅 Ordinate automaticamente per data/ora</span>
            <span>🔢 Max 10 partite per schedina</span>
            <span style={{color: '#e74c3c'}}>⚽ <b>NOVITÀ:</b> GG - NG (Goal-Goal / No Goal)</span>
            {casualitaLevel > 80 && <span style={{color: '#8e44ad', fontWeight: 'bold'}}>🎲🎲🎲 CASUALITÀ ESTREMA: scelta casuale delle partite!</span>}
          </div>
        </div>
      </div>
      
      {/* ===== LISTA PARTITE ===== */}
      <div className="card" style={{marginTop: '16px'}}>
        <h4 style={{marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap'}}>
          <span>📋 Partite Disponibili</span>
          {partiteSelezionate.length > 0 && (
            <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>
              {partiteSelezionate.length} selezionate ✅ • Ordinate per data/ora
            </span>
          )}
        </h4>
        {partiteDisponibili.length === 0 ? (
          <div className="empty-state" style={{padding: '30px', textAlign: 'center', color: 'var(--text-muted)'}}>
            {filtroOrario === 'dopo_ora' 
              ? 'Nessuna partita futura disponibile dopo l\'orario corrente per i campionati selezionati.' 
              : 'Nessuna partita disponibile per i filtri selezionati.'}
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            {partiteDisponibili.map(m => {
              const isSelected = partiteSelezionate.some(p => p.id === m.id);
              const isGGNG = m.giocata?.familyId === 'gg_ng';
              
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
                    border: isSelected ? (isGGNG ? '2px solid #e74c3c' : '2px solid var(--accent)') : '1px solid var(--border)',
                    background: isSelected ? (isGGNG ? 'rgba(231, 76, 60, 0.08)' : 'rgba(243, 156, 18, 0.08)') : 'var(--surface)',
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
                  
                  <div style={{display: 'flex', alignItems: 'center', gap: '6px', minWidth: '110px', justifyContent: 'center'}}>
                    {m.giocata ? (
                      <>
                        <span style={{fontSize: '11px', color: isGGNG ? '#e74c3c' : 'var(--accent)', fontWeight: 'bold'}}>
                          {m.giocata.familyIcon} {m.giocata.label}
                        </span>
                        <span className={`giocata-pct ${getPercentualeClasse(m.pct)}`} style={{fontSize: '12px', padding: '2px 8px'}}>
                          {m.pct}%
                        </span>
                        {m.giocata.isBomb && <span style={{fontSize: '14px'}}>💣</span>}
                        {isGGNG && <span style={{fontSize: '12px', color: '#e74c3c'}}>⚽</span>}
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

      {/* ===== SCHEDINE SALVATE ===== */}
      {schedineSalvate.length > 0 && (
        <div className="card" style={{marginTop: '16px', border: '2px solid var(--accent)'}}>
          <h4 style={{color: 'var(--accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}>
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
              style={{fontSize: '10px', padding: '2px 12px', marginLeft: 'auto'}}
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
                  {s.giocateSelezionate?.includes('gg_ng') && (
                    <span style={{fontSize: '10px', color: '#e74c3c'}}>⚽ GG/NG</span>
                  )}
                  {s.casualitaLevel > 80 && (
                    <span style={{fontSize: '10px', color: '#8e44ad'}}>🎲 ESTREMA</span>
                  )}
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

      {/* ===== MODAL SCHEDINA ===== */}
      {showSchedinaModal && schedinaCreata && (
        <div className="heatmap-detail-overlay" onClick={() => setShowSchedinaModal(false)}>
          <div className="heatmap-detail-modal" onClick={e => e.stopPropagation()} style={{maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}}>
            <button className="close-btn" onClick={() => setShowSchedinaModal(false)}>✖</button>
            
            <div id="schedina-da-condividere" style={{padding: '10px 0'}}>
              <h2 style={{color: 'var(--accent)', textAlign: 'center', marginBottom: '4px'}}>🎯 SCHEDINA GesssAI-Pro</h2>
              <p style={{textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px'}}>
                📅 {schedinaCreata.dataFormattata || new Date().toLocaleString('it-IT')} • {schedinaCreata.numPartite} partite • Media: <b style={{color: 'var(--accent)'}}>{schedinaCreata.media}%</b>
                {schedinaCreata.giocateSelezionate?.includes('gg_ng') && <span style={{marginLeft: '8px', color: '#e74c3c'}}>⚽ GG/NG</span>}
                {schedinaCreata.casualitaLevel > 80 && <span style={{marginLeft: '8px', color: '#8e44ad'}}>🎲 ESTREMA</span>}
              </p>
              
              <div style={{textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'}}>
                {schedinaCreata.dataInizio && schedinaCreata.dataFine && (
                  <span>
                    📆 {schedinaCreata.dataInizio === schedinaCreata.dataFine 
                      ? `Partite del ${formatDateEU(schedinaCreata.dataInizio)}` 
                      : `Dal ${formatDateEU(schedinaCreata.dataInizio)} al ${formatDateEU(schedinaCreata.dataFine)}`
                    }
                  </span>
                )}
                {schedinaCreata.campionatiSelezionati && (
                  <span>
                    🏆 {schedinaCreata.campionatiSelezionati.length === championships.length ? 'Tutti i campionati' : schedinaCreata.campionatiSelezionati.join(', ')}
                  </span>
                )}
                {schedinaCreata.giocateSelezionate && (
                  <span>
                    🎯 {schedinaCreata.giocateSelezionate.includes('tutte') ? 'Tutte le giocate' : schedinaCreata.giocateSelezionate.map(id => window.FAMIGLIE_GIOCATE[id]?.label || id).join(', ')}
                  </span>
                )}
              </div>
              
              <div style={{borderTop: '2px solid var(--accent)', paddingTop: '12px'}}>
                {schedinaCreata.partite.map((m, idx) => {
                  const isGGNG = m.giocata?.familyId === 'gg_ng';
                  return (
                    <div key={idx} style={{
                      padding: '8px 12px',
                      marginBottom: '6px',
                      borderRadius: '6px',
                      border: isGGNG ? '2px solid #e74c3c' : '1px solid var(--border)',
                      background: isGGNG ? 'rgba(231, 76, 60, 0.05)' : 'var(--surface)'
                    }}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px'}}>
                        <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>
                          #{idx + 1} 📅 {formatDateEU(m.data)} - {m.ora && m.ora !== 'TBD' ? m.ora : '--:--'}
                        </span>
                        <span style={{fontSize: '11px', color: 'var(--text-muted)'}}>
                          🏆 {m.campionato}
                        </span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px'}}>
                        <span style={{fontSize: '14px', fontWeight: 'bold'}}>
                          ⚽ {m.casa} vs {m.ospiti}
                        </span>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px'}}>
                        <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                          {m.giocata ? (
                            <>
                              <span style={{fontSize: '13px', fontWeight: 'bold', color: isGGNG ? '#e74c3c' : 'var(--accent)'}}>
                                {m.giocata.familyIcon} {m.giocata.label}
                              </span>
                              <span className={`giocata-pct ${getPercentualeClasse(m.pct)}`} style={{fontSize: '14px', padding: '2px 12px'}}>
                                {m.pct}%
                              </span>
                              {m.giocata.isBomb && <span style={{fontSize: '18px'}}>💣</span>}
                              {isGGNG && <span style={{fontSize: '16px', color: '#e74c3c', fontWeight: 'bold'}}>⚽ GG/NG</span>}
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
                  );
                })}
              </div>
              
              <div style={{borderTop: '2px solid var(--accent)', marginTop: '12px', paddingTop: '12px', textAlign: 'center'}}>
                <div style={{fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)'}}>
                  ⭐ Media Score: {schedinaCreata.media}%
                </div>
                <div style={{fontSize: '13px', color: 'var(--text)'}}>
                  📊 {schedinaCreata.numPartite} partite
                  {schedinaCreata.giocateSelezionate?.includes('gg_ng') && (
                    <span style={{marginLeft: '8px', color: '#e74c3c'}}>⚽ GG/NG incluso</span>
                  )}
                  {schedinaCreata.casualitaLevel > 80 && (
                    <span style={{marginLeft: '8px', color: '#8e44ad'}}>🎲 ESTREMA</span>
                  )}
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

// ESPORTA GLOBALMENTE IL COMPONENTE
window.SchedinaComponent = SchedinaComponent;
console.log('✅ SchedinaComponent caricato con TUTTE le funzionalità:');
console.log('   - Selezione multipla campionati');
console.log('   - Selezione multipla giocate (incluso GG/NG)');
console.log('   - Casuale e Rigenera con livello di casualità');
console.log('   - Casualità >80% sceglie partite CASUALI ma rispetta il numero scelto');
console.log('   - Data e ora separate da trattino nelle condivisioni');
console.log('   - Max 10 partite con ordinamento data/ora');
console.log('   - Sezioni divise per ogni opzione');
console.log('   - GG/NG in lista giocate (assicurato staticamente)');
console.log('   - Rigenera rispetta i filtri impostati');
console.log('   - Range giorni allineato con Palinsesto (0-7 giorni)');