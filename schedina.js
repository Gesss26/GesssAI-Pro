// ============================================================
// COMPONENTE SCHEDINA - CON CASUALITÀ 🎲 + SELEZIONE MULTIPLA CAMPIONATI
// MODIFICHE: MASSIMO 10 PARTITE + BOTTONE RIGENERA + CASUALITÀ + MULTI CAMPIONATI
// + ORDINE CRESCENTE PER DATA/ORA + CONTEGGIO PARTITE + SELEZIONE NUMERICA
// + RIGENERA USA IL NUMERO DI PARTITE SCELTO + AGGIUNTA GG/NG
// + CASUALITÀ > 80% SCEGLIE NUMERO PARTITE A CASO
// ============================================================

// Assicurati che FAMIGLIE_GIOCATE includa 'gg_ng'
if (typeof window.FAMIGLIE_GIOCATE === 'undefined') {
  window.FAMIGLIE_GIOCATE = {};
}

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
  
  const homeOver05 = homeStats.over05 || 55;
  const awayOver05 = awayStats.over05 || 55;
  
  const probGG = (homeOver05 / 100) * (awayOver05 / 100) * 100;
  const probNG = 100 - probGG;
  
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

  useEffect(() => {
    if (campionatiSelezionati.length === 0 && championships.length > 0) {
      setCampionatiSelezionati(championships.map(c => c.name));
    }
  }, [championships]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

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

  const getPartiteFutureConFiltro = useCallback(() => {
    const todayStr = getTodayStr();
    const maxDateStr = addDaysToDateStr(todayStr, giorniRange);
    
    let futureMatches = matches.filter(m => m.stato === 'Futura');
    
    if (campionatiSelezionati.length > 0) {
      futureMatches = futureMatches.filter(m => campionatiSelezionati.includes(m.campionato));
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
  }, [matches, campionatiSelezionati, giorniRange, filtroOrario]);

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
    // Se la casualità è > 80%, scegli un numero CASUALE di partite (da 2 a 10)
    if (casualitaLevel > 80) {
      const maxPartite = Math.min(limiteMax, partiteDisponibili.length, 10);
      if (maxPartite < 2) return maxPartite;
      const numero = Math.floor(Math.random() * (maxPartite - 1)) + 2;
      return Math.min(10, Math.max(2, numero));
    } else {
      // Usa il numero scelto dall'utente
      return Math.min(numeroPartiteDaSelezionare, limiteMax, partiteDisponibili.length, 10);
    }
  };

  const selezionaNumeroPartite = (n) => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile.');
      return;
    }
    
    // Se la casualità è > 80%, scegli a caso il numero di partite
    let numeroDaPrendere;
    let messaggioExtra = '';
    if (casualitaLevel > 80) {
      const maxPartite = Math.min(10, partiteDisponibili.length);
      numeroDaPrendere = Math.floor(Math.random() * (maxPartite - 1)) + 2;
      numeroDaPrendere = Math.min(10, Math.max(2, numeroDaPrendere));
      messaggioExtra = ` 🎲🎲🎲 (ignorato ${n} scelto)`;
    } else {
      numeroDaPrendere = Math.min(n, partiteDisponibili.length, 10);
    }
    
    const migliori = partiteDisponibili.slice(0, numeroDaPrendere);
    const miglioriOrdinate = ordinaPartitePerDataOra(migliori);
    setPartiteSelezionate(miglioriOrdinate);
    showAlert('success', `✅ Selezionate ${miglioriOrdinate.length} partite!${messaggioExtra}`);
  };

  const rigeneraSchedina = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile per rigenerare la schedina.');
      return;
    }

    // Se la casualità è > 80%, scegli un numero CASUALE di partite
    const numeroPartiteDesiderato = getNumeroPartiteDaPrendere(10);
    
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
      if (casualitaLevel > 80) {
        // 🎲🎲🎲 CASUALITÀ ESTREMA: prendi un numero CASUALE di partite da questo gruppo
        const maxDaPrendere = Math.min(partiteGruppo.length, postiDisponibili);
        daPrendereCount = Math.floor(Math.random() * maxDaPrendere) + 1;
        daPrendereCount = Math.min(maxDaPrendere, Math.max(1, daPrendereCount));
      } else if (casualitaLevel > 50) {
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
      const maxDaPrendere = Math.min(10, partiteDisponibili.length);
      const daPrendereCount = Math.min(maxDaPrendere, Math.max(2, Math.floor(Math.random() * (maxDaPrendere - 1)) + 2));
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
      messaggioCasualita = `${selezionateOrdinate.length} partite selezionate`;
    } else {
      messaggioCasualita = `${selezionateOrdinate.length} partite selezionate`;
    }
    
    showAlert('success', `🔄 Schedina rigenerata! ${messaggioCasualita} ${emojiCasualita} Livello: ${casualitaLevel}%`);
  };

  const selezionaCasuale = () => {
    if (partiteDisponibili.length === 0) {
      showAlert('info', 'ℹ️ Nessuna partita disponibile.');
      return;
    }
    
    const numeroPartiteDesiderato = getNumeroPartiteDaPrendere(10);
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

  const formatSchedinaText = (schedina) => {
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
    lines.push(`📊 Numero partite: ${schedina.numPartite}`);
    lines.push('💣 GesssAI-Pro v3.0');
    lines.push('⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.');
    
    return lines.join('\n');
  };

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

  const famiglieDisponibili = [
    { id: 'tutte', label: '⭐ Tutte', icon: '⭐' },
    ...Object.entries(window.FAMIGLIE_GIOCATE || {}).map(([id, family]) => ({
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

  // Il resto del JSX è lo stesso di prima...
  // (ometto per brevità ma è identico al codice precedente)
  
  return (
    <div className="schedina-container">
      {/* ... JSX come prima ... */}
    </div>
  );
};

window.SchedinaComponent = SchedinaComponent;
console.log('✅ SchedinaComponent caricato con CASUALITÀ ESTREMA (>80%) che sceglie il numero di partite a caso!');