<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GesssAI-Pro - Schedina</title>
    <style>
        /* ===== VARIABILI CSS ===== */
        :root {
            --background: #0d1117;
            --surface: #161b22;
            --border: #30363d;
            --text: #c9d1d9;
            --text-muted: #8b949e;
            --accent: #f39c12;
            --accent2: #f1c40f;
            --win: #2ecc71;
            --danger: #e74c3c;
            --card-bg: #1c2333;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: var(--background);
            color: var(--text);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            transition: all 0.3s;
        }

        .card:hover {
            border-color: var(--accent);
        }

        .btn {
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--surface);
            color: var(--text);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
            font-weight: 500;
        }

        .btn:hover {
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
        }

        .btn-secondary {
            background: transparent;
            color: var(--text-muted);
        }

        .btn-secondary:hover {
            background: var(--surface);
            color: var(--text);
        }

        .btn-danger {
            background: var(--danger);
            color: #fff;
            border-color: var(--danger);
        }

        .btn-danger:hover {
            background: #c0392b;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .giocata-pct {
            border-radius: 4px;
            padding: 2px 8px;
            font-weight: bold;
            font-size: 12px;
        }

        .pct-alta { background: rgba(46, 204, 113, 0.3); color: #2ecc71; }
        .pct-media { background: rgba(243, 156, 18, 0.3); color: #f39c12; }
        .pct-bassa { background: rgba(231, 76, 60, 0.3); color: #e74c3c; }

        .empty-state {
            padding: 30px;
            text-align: center;
            color: var(--text-muted);
            font-size: 14px;
        }

        .heatmap-detail-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }

        .heatmap-detail-modal {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            max-width: 800px;
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }

        .close-btn {
            position: absolute;
            top: 12px;
            right: 16px;
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 20px;
            cursor: pointer;
        }

        .close-btn:hover {
            color: var(--text);
        }

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        input[type="number"] {
            -moz-appearance: textfield;
        }

        @media (max-width: 600px) {
            body { padding: 10px; }
            .btn { font-size: 10px; padding: 4px 10px; }
            .card { padding: 12px; }
        }
    </style>
</head>
<body>

    <!-- ===== HEADER ===== -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
        <div>
            <h1 style="color: var(--accent); font-size: 24px;">🎯 GesssAI-Pro</h1>
            <span style="color: var(--text-muted); font-size: 12px;">Statistiche & Trading Scommesse v3.0 - 2026</span>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <span style="color: var(--text-muted); font-size: 13px;">21°C ☀️</span>
        </div>
    </div>

    <!-- ===== MENU ===== -->
    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; padding: 10px 0; border-bottom: 1px solid var(--border);">
        <button class="btn" onclick="alert('🏠 Home')">Home</button>
        <button class="btn" onclick="alert('📋 Palinsesto')">Palinsesto</button>
        <button class="btn" onclick="alert('📊 Statistiche')">Statistiche</button>
        <button class="btn" onclick="alert('📈 Storico')">Storico</button>
        <button class="btn" style="background: var(--accent); color: #000; font-weight: bold;" onclick="alert('🎯 Schedina')">Schedina</button>
        <button class="btn" onclick="alert('⚙️ Impostazioni')">Impostazioni</button>
    </div>

    <!-- ===== CONTAINER SCHEDINA ===== -->
    <div id="schedina-root"></div>

    <!-- ===== DISCLAIMER ===== -->
    <div class="card" style="margin-top: 20px; border-color: var(--danger);">
        <div style="font-size: 12px; color: var(--text-muted);">
            <strong>⚠️ Disclaimer - Utilizzo in Centro Scommesse</strong><br>
            Questa applicazione fornisce analisi statistiche a solo scopo informativo. I dati provengono da file caricati dall'utente (XLSX/CSV). 
            Le percentuali e i pronostici sono elaborazioni matematiche non vincolanti.
            <br><br>
            <strong>Le scommesse comportano rischi finanziari. Gioca responsabilmente.</strong>
            <br>
            I loghi e i nomi delle squadre sono di proprietà dei rispettivi titolari. L'uso commerciale dei dati richiede licenza specifica.
        </div>
    </div>

    <!-- ===== REACT + REACT DOM ===== -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

    <script>
        // ============================================================
        // 1. FUNZIONI DI UTILITY
        // ============================================================

        // Ottieni data odierna in formato YYYY-MM-DD
        function getTodayStr() {
            const now = new Date();
            return now.getFullYear() + '-' + 
                   String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(now.getDate()).padStart(2, '0');
        }

        // Aggiungi giorni a una data
        function addDaysToDateStr(dateStr, days) {
            const d = new Date(dateStr);
            d.setDate(d.getDate() + days);
            return d.getFullYear() + '-' + 
                   String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(d.getDate()).padStart(2, '0');
        }

        // Normalizza data (gestisce formati vari)
        function normalizeDate(dateStr) {
            if (!dateStr) return null;
            // Se è già YYYY-MM-DD
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
            // Se è DD/MM/YYYY
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const d = parts[0].padStart(2, '0');
                const m = parts[1].padStart(2, '0');
                const y = parts[2];
                return `${y}-${m}-${d}`;
            }
            // Se è altro, prova a creare una data
            const d = new Date(dateStr);
            if (!isNaN(d)) {
                return d.getFullYear() + '-' + 
                       String(d.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(d.getDate()).padStart(2, '0');
            }
            return null;
        }

        // Formatta data in formato EU (DD/MM/YYYY)
        function formatDateEU(dateStr) {
            if (!dateStr) return 'N/D';
            const norm = normalizeDate(dateStr);
            if (!norm) return dateStr;
            const parts = norm.split('-');
            return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }

        // Classe percentuale per colori
        function getPercentualeClasse(pct) {
            if (pct >= 70) return 'pct-alta';
            if (pct >= 50) return 'pct-media';
            return 'pct-bassa';
        }

        // Colore campionato (semplificato)
        function getChampColor(name) {
            const colors = {
                'Serie A': '#e74c3c',
                'Serie B': '#e67e22',
                'Premier League': '#3498db',
                'Championship': '#2980b9',
                'La Liga': '#f1c40f',
                'Ligue 1': '#2ecc71',
                'Bundesliga': '#e74c3c',
                'Eredivisie': '#f39c12',
                'Primeira Liga': '#2ecc71',
                'MLS': '#3498db',
                'Liga MX': '#e67e22',
                'Super Lig': '#e74c3c',
                'Jupiler Pro': '#2ecc71',
                'Scottish Prem': '#2980b9',
                'Champions League': '#f1c40f',
                'Europa League': '#f39c12',
                'Conference League': '#2ecc71',
            };
            return colors[name] || '#8b949e';
        }

        // ============================================================
        // 2. FAMIGLIE GIOCATE
        // ============================================================

        const FAMIGLIE_GIOCATE = {
            '1x2': { id: '1x2', label: '1X2', icon: '🎯' },
            'dc': { id: 'dc', label: 'Doppia Chance', icon: '🔄' },
            'over_under': { id: 'over_under', label: 'Over/Under', icon: '📊' },
            'goal_ng': { id: 'goal_ng', label: 'Goal/No Goal', icon: '⚽' },
            'multigol': { id: 'multigol', label: 'Multigol', icon: '🎯' },
            'gg_ng': { id: 'gg_ng', label: 'GG - NG', icon: '⚽' },
            'btts': { id: 'btts', label: 'BTTS', icon: '⚽' },
            'handicap': { id: 'handicap', label: 'Handicap', icon: '🎯' },
        };

        // ============================================================
        // 3. FUNZIONI DI CALCOLO (MOCK)
        // ============================================================

        // Calcola statistiche di una partita (MOCK)
        function computeMatchStats(match, allMatches) {
            if (!match) return { error: true };
            
            // Simula statistiche basate su dati fittizi
            const homeTeam = match.casa || 'Home';
            const awayTeam = match.ospiti || 'Away';
            
            // Genera percentuali casuali per demo
            const homeWin = 30 + Math.random() * 40;
            const draw = 20 + Math.random() * 20;
            const awayWin = 100 - homeWin - draw;
            
            return {
                homeWin: Math.round(homeWin),
                draw: Math.round(draw),
                awayWin: Math.round(awayWin),
                homeMG: {
                    over05: 50 + Math.random() * 40,
                    over15: 30 + Math.random() * 30,
                    over25: 20 + Math.random() * 30,
                    under05: 10 + Math.random() * 30,
                    under15: 20 + Math.random() * 30,
                    under25: 30 + Math.random() * 30,
                },
                awayMG: {
                    over05: 50 + Math.random() * 40,
                    over15: 30 + Math.random() * 30,
                    over25: 20 + Math.random() * 30,
                    under05: 10 + Math.random() * 30,
                    under15: 20 + Math.random() * 30,
                    under25: 30 + Math.random() * 30,
                },
                mgTot: {
                    over05: 60 + Math.random() * 30,
                    over15: 40 + Math.random() * 30,
                    over25: 30 + Math.random() * 30,
                    under05: 10 + Math.random() * 20,
                    under15: 20 + Math.random() * 20,
                    under25: 30 + Math.random() * 20,
                },
                _allMatches: allMatches,
                _homeTeam: homeTeam,
                _awayTeam: awayTeam,
                error: false
            };
        }

        // Calcola Multigol Range
        function getMultigolRange(team, allMatches) {
            return { min: Math.floor(Math.random() * 3), max: Math.floor(Math.random() * 3) + 1 };
        }

        // Calcola la migliore giocata per famiglia
        function getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot) {
            if (!stats) return null;
            
            let label = '';
            let pct = 0;
            let isBomb = false;
            
            switch(familyId) {
                case '1x2':
                    if (stats.homeWin > stats.awayWin && stats.homeWin > stats.draw) {
                        label = '1 (Casa)';
                        pct = Math.round(stats.homeWin);
                    } else if (stats.awayWin > stats.homeWin && stats.awayWin > stats.draw) {
                        label = '2 (Trasferta)';
                        pct = Math.round(stats.awayWin);
                    } else {
                        label = 'X (Pareggio)';
                        pct = Math.round(stats.draw);
                    }
                    break;
                case 'dc':
                    if (stats.homeWin + stats.draw > stats.awayWin + 20) {
                        label = '1X (Casa/Pareggio)';
                        pct = Math.round(stats.homeWin + stats.draw);
                    } else if (stats.awayWin + stats.draw > stats.homeWin + 20) {
                        label = 'X2 (Trasferta/Pareggio)';
                        pct = Math.round(stats.awayWin + stats.draw);
                    } else {
                        label = '12 (Casa/Trasferta)';
                        pct = Math.round(stats.homeWin + stats.awayWin);
                    }
                    break;
                case 'over_under':
                    if (mgTot && mgTot.over25 > 50) {
                        label = 'Over 2.5';
                        pct = Math.round(mgTot.over25);
                    } else {
                        label = 'Under 2.5';
                        pct = 100 - Math.round(mgTot?.over25 || 50);
                    }
                    break;
                case 'goal_ng':
                case 'btts':
                    const probGoal = (homeMG?.over05 || 55) * (awayMG?.over05 || 55) / 100;
                    if (probGoal > 50) {
                        label = 'Goal (BTTS)';
                        pct = Math.round(probGoal);
                    } else {
                        label = 'No Goal';
                        pct = Math.round(100 - probGoal);
                    }
                    break;
                case 'gg_ng':
                    const probGG = ((homeMG?.over05 || 55) / 100) * ((awayMG?.over05 || 55) / 100) * 100;
                    if (probGG > 50) {
                        label = 'Goal-Goal (GG)';
                        pct = Math.round(probGG);
                    } else {
                        label = 'No Goal (NG)';
                        pct = Math.round(100 - probGG);
                    }
                    break;
                default:
                    label = 'Giocata';
                    pct = 50 + Math.random() * 30;
            }
            
            isBomb = pct > 75;
            return { label, pct: Math.min(Math.max(pct, 0), 100), isBomb };
        }

        // ============================================================
        // 4. FUNZIONE GG/NG DEDICATA
        // ============================================================

        function calcolaGG_NG(stats) {
            if (!stats || !stats.homeMG || !stats.awayMG) return null;
            
            const homeOver05 = stats.homeMG.over05 || 55;
            const awayOver05 = stats.awayMG.over05 || 55;
            
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
        }

        // ============================================================
        // 5. DATI DI ESEMPIO
        // ============================================================

        const sampleMatches = [
            { id: 1, casa: 'Inter', ospiti: 'Milan', campionato: 'Serie A', data: getTodayStr(), ora: '20:45', stato: 'Futura' },
            { id: 2, casa: 'Juventus', ospiti: 'Napoli', campionato: 'Serie A', data: getTodayStr(), ora: '18:30', stato: 'Futura' },
            { id: 3, casa: 'Roma', ospiti: 'Lazio', campionato: 'Serie A', data: getTodayStr(), ora: '15:00', stato: 'Futura' },
            { id: 4, casa: 'Arsenal', ospiti: 'Chelsea', campionato: 'Premier League', data: addDaysToDateStr(getTodayStr(), 1), ora: '16:00', stato: 'Futura' },
            { id: 5, casa: 'Liverpool', ospiti: 'Man City', campionato: 'Premier League', data: addDaysToDateStr(getTodayStr(), 1), ora: '18:30', stato: 'Futura' },
            { id: 6, casa: 'Barcellona', ospiti: 'Real Madrid', campionato: 'La Liga', data: addDaysToDateStr(getTodayStr(), 2), ora: '21:00', stato: 'Futura' },
            { id: 7, casa: 'Bayern Monaco', ospiti: 'Borussia Dortmund', campionato: 'Bundesliga', data: addDaysToDateStr(getTodayStr(), 2), ora: '20:30', stato: 'Futura' },
            { id: 8, casa: 'PSG', ospiti: 'Marsiglia', campionato: 'Ligue 1', data: addDaysToDateStr(getTodayStr(), 3), ora: '21:00', stato: 'Futura' },
            { id: 9, casa: 'Benfica', ospiti: 'Porto', campionato: 'Primeira Liga', data: addDaysToDateStr(getTodayStr(), 3), ora: '19:45', stato: 'Futura' },
            { id: 10, casa: 'Ajax', ospiti: 'PSV', campionato: 'Eredivisie', data: addDaysToDateStr(getTodayStr(), 4), ora: '20:00', stato: 'Futura' },
            { id: 11, casa: 'Celtic', ospiti: 'Rangers', campionato: 'Scottish Prem', data: addDaysToDateStr(getTodayStr(), 4), ora: '16:00', stato: 'Futura' },
            { id: 12, casa: 'Milan', ospiti: 'Atalanta', campionato: 'Serie A', data: addDaysToDateStr(getTodayStr(), 5), ora: '20:45', stato: 'Futura' },
            { id: 13, casa: 'Tottenham', ospiti: 'Man Utd', campionato: 'Premier League', data: addDaysToDateStr(getTodayStr(), 5), ora: '18:30', stato: 'Futura' },
            { id: 14, casa: 'Atletico Madrid', ospiti: 'Siviglia', campionato: 'La Liga', data: addDaysToDateStr(getTodayStr(), 6), ora: '21:00', stato: 'Futura' },
        ];

        const sampleChampionships = [
            { name: 'Serie A' },
            { name: 'Premier League' },
            { name: 'La Liga' },
            { name: 'Bundesliga' },
            { name: 'Ligue 1' },
            { name: 'Eredivisie' },
            { name: 'Primeira Liga' },
            { name: 'Scottish Prem' },
        ];

        // ============================================================
        // 6. COMPONENTE SCHEDINA
        // ============================================================

        const { useState, useCallback, useEffect, useRef } = React;

        const SchedinaComponent = ({ matches, championships, selectedFamiglie, showAlert }) => {
            const [campionatiSelezionati, setCampionatiSelezionati] = useState([]);
            const [partiteSelezionate, setPartiteSelezionate] = useState([]);
            const [filtroOrario, setFiltroOrario] = useState('dopo_ora');
            const [giorniRange, setGiorniRange] = useState(3);
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

            // Funzioni di utility locali
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
                    if (dateA && dateB && dateA !== dateB) return dateA.localeCompare(dateB);
                    
                    const oraA = a.ora || '00:00';
                    const oraB = b.ora || '00:00';
                    return oraA.localeCompare(oraB);
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
                        if (!m.ora || m.ora === 'TBD' || m.ora === 'N/D') return true;
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
                
                const homeMG = stats.homeMG || {};
                const awayMG = stats.awayMG || {};
                const mgTot = stats.mgTot || {};
                const homeRange = getMultigolRange(match.casa, matches);
                const awayRange = getMultigolRange(match.ospiti, matches);
                
                let migliorGiocata = null;
                let migliorPct = 0;
                
                const tutteGiocateValide = [];
                
                const giocateDaAnalizzare = giocateSelezionate.includes('tutte') || giocateSelezionate.length === 0
                    ? Object.keys(FAMIGLIE_GIOCATE)
                    : giocateSelezionate;
                
                giocateDaAnalizzare.forEach(familyId => {
                    let best = null;
                    
                    if (familyId === 'gg_ng') {
                        const ggNgResult = calcolaGG_NG(stats);
                        if (ggNgResult) {
                            best = {
                                ...ggNgResult,
                                familyId: 'gg_ng',
                                familyLabel: FAMIGLIE_GIOCATE['gg_ng']?.label || 'GG - NG',
                                familyIcon: FAMIGLIE_GIOCATE['gg_ng']?.icon || '⚽'
                            };
                        }
                    } else {
                        const bestBet = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
                        if (bestBet && bestBet.pct > 0) {
                            best = {
                                ...bestBet,
                                familyId: familyId,
                                familyLabel: FAMIGLIE_GIOCATE[familyId]?.label || familyId,
                                familyIcon: FAMIGLIE_GIOCATE[familyId]?.icon || '🎯'
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
                (selectedFamiglie || ['tutte']).forEach(familyId => {
                    let best = null;
                    if (familyId === 'gg_ng') {
                        const ggNgResult = calcolaGG_NG(stats);
                        if (ggNgResult) best = { ...ggNgResult, pct: ggNgResult.pct };
                    } else {
                        best = getBestBetForFamily(familyId, stats, homeRange, awayRange, homeMG, awayMG, mgTot);
                    }
                    if (best && best.pct > 0) giocatePct.push(best.pct);
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
                
                return partiteConGiocate.sort((a, b) => b.score - a.score);
            }, [getPartiteFutureConFiltro, giocateSelezionate]);

            const partiteDisponibili = getPartiteConGiocate();

            const getNumeroPartiteDaPrendere = (limiteMax = 10) => {
                if (casualitaLevel > 80) {
                    const maxPartite = Math.min(limiteMax, partiteDisponibili.length, 10);
                    if (maxPartite < 2) return maxPartite;
                    const numero = Math.floor(Math.random() * (maxPartite - 1)) + 2;
                    return Math.min(10, Math.max(2, numero));
                } else {
                    return Math.min(numeroPartiteDaSelezionare, limiteMax, partiteDisponibili.length, 10);
                }
            };

            const selezionaNumeroPartite = (n) => {
                if (partiteDisponibili.length === 0) {
                    showAlert('info', 'ℹ️ Nessuna partita disponibile.');
                    return;
                }
                
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
                    if (giocataId === 'tutte') return ['tutte'];
                    
                    const newSelection = prev.includes(giocataId) 
                        ? prev.filter(id => id !== giocataId)
                        : [...prev.filter(id => id !== 'tutte'), giocataId];
                    
                    return newSelection.length === 0 ? ['tutte'] : newSelection;
                });
            };

            const selezionaTutteGiocate = () => setGiocateSelezionate(['tutte']);
            const deselezionaTutteGiocate = () => {
                setGiocateSelezionate([]);
                setTimeout(() => {
                    setGiocateSelezionate(prev => prev.length === 0 ? ['tutte'] : prev);
                }, 0);
            };

            // FORMATTAZIONE CONDIVISIONE
            const formatSchedinaText = (schedina) => {
                if (!schedina || !schedina.partite) return '🎯 Errore nella generazione della schedina';
                
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
                        : schedina.giocateSelezionate.map(id => FAMIGLIE_GIOCATE[id]?.label || id).join(', ');
                    lines.push(`🎯 Giocate: ${giocateDisplay}`);
                }
                
                if (schedina.giocateSelezionate && schedina.giocateSelezionate.includes('gg_ng')) {
                    lines.push(`⚽ GG/NG attivo`);
                }
                
                lines.push('───────────────────');
                lines.push('');
                
                schedina.partite.forEach((m, idx) => {
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

            const copySchedinaToClipboard = () => {
                if (!schedinaCreata) {
                    showAlert('error', '❌ Nessuna schedina da copiare!');
                    return;
                }
                const text = formatSchedinaText(schedinaCreata);
                navigator.clipboard?.writeText?.(text);
                showAlert('success', '📋 Schedina copiata negli appunti!');
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
                if (schedina.campionatiSelezionati) setCampionatiSelezionati(schedina.campionatiSelezionati);
                if (schedina.giocateSelezionate) setGiocateSelezionate(schedina.giocateSelezionate);
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

            function hexToRgb(hex) {
                if (hex.startsWith('#')) {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '243, 156, 18';
                }
                return '243, 156, 18';
            }

            // ============================================================
            // RENDER
            // ============================================================
            return React.createElement('div', { className: 'schedina-container' },
                // Card principale
                React.createElement('div', { className: 'card', style: { marginBottom: '20px' } },
                    // Titolo
                    React.createElement('h3', { style: { color: 'var(--accent)', marginBottom: '16px', fontSize: '20px' } },
                        `🎯 Crea Schedina ${casualitaLevel > 50 ? '🎲' : ''}`
                    ),
                    
                    // ===== SEZIONE CAMPIONATI =====
                    React.createElement('div', { style: { marginBottom: '20px', padding: '12px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' } },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } },
                            React.createElement('span', { style: { fontSize: '14px', fontWeight: 'bold', color: 'var(--text)' } }, '🏆 Campionati'),
                            React.createElement('div', { style: { display: 'flex', gap: '6px' } },
                                React.createElement('button', {
                                    className: 'btn',
                                    onClick: selezionaTuttiCampionati,
                                    style: {
                                        fontSize: '10px',
                                        padding: '2px 12px',
                                        background: campionatiSelezionati.length === championships.length ? 'var(--accent)' : 'var(--surface)',
                                        color: campionatiSelezionati.length === championships.length ? '#000' : 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }
                                }, '✅ Tutti'),
                                React.createElement('button', {
                                    className: 'btn',
                                    onClick: deselezionaTuttiCampionati,
                                    style: {
                                        fontSize: '10px',
                                        padding: '2px 12px',
                                        background: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }
                                }, '❌ Deseleziona'),
                                React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-muted)', padding: '2px 8px' } },
                                    `${campionatiSelezionati.length} / ${championships.length}`
                                )
                            )
                        ),
                        React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
                            championships.map(c => {
                                const isSelected = campionatiSelezionati.includes(c.name);
                                const color = getChampColor(c.name);
                                return React.createElement('button', {
                                    key: c.name,
                                    onClick: () => toggleCampionato(c.name),
                                    style: {
                                        padding: '4px 12px',
                                        borderRadius: '6px',
                                        border: isSelected ? `2px solid ${color}` : '1px solid var(--border)',
                                        background: isSelected ? `rgba(${hexToRgb(color)}, 0.15)` : 'var(--surface)',
                                        color: isSelected ? color : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '11px',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        transition: 'all 0.2s'
                                    }
                                }, isSelected ? '✅' : '⚪', ' ', c.name);
                            })
                        ),
                        React.createElement('div', { style: { fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' } },
                            'Seleziona uno o più campionati da cui prendere le partite'
                        )
                    ),

                    // ===== SEZIONE GIOCATE =====
                    React.createElement('div', { style: { marginBottom: '20px', padding: '12px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' } },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' } },
                            React.createElement('span', { style: { fontSize: '14px', fontWeight: 'bold', color: 'var(--text)' } }, '🎯 Giocate'),
                            React.createElement('div', { style: { display: 'flex', gap: '6px' } },
                                React.createElement('button', {
                                    className: 'btn',
                                    onClick: selezionaTutteGiocate,
                                    style: {
                                        fontSize: '10px',
                                        padding: '2px 12px',
                                        background: giocateSelezionate.includes('tutte') ? 'var(--accent)' : 'var(--surface)',
                                        color: giocateSelezionate.includes('tutte') ? '#000' : 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }
                                }, '⭐ Tutte'),
                                React.createElement('button', {
                                    className: 'btn',
                                    onClick: deselezionaTutteGiocate,
                                    style: {
                                        fontSize: '10px',
                                        padding: '2px 12px',
                                        background: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }
                                }, '❌ Deseleziona'),
                                React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-muted)', padding: '2px 8px' } },
                                    giocateSelezionate.includes('tutte') ? '⭐ Tutte' : `${giocateSelezionate.length} selezionate`
                                )
                            )
                        ),
                        React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
                            famiglieDisponibili.map(f => {
                                const isSelected = giocateSelezionate.includes(f.id);
                                const isTutte = f.id === 'tutte';
                                const isGGNG = f.id === 'gg_ng';
                                return React.createElement('button', {
                                    key: f.id,
                                    onClick: () => toggleGiocata(f.id),
                                    style: {
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        border: isSelected ? (isGGNG ? '2px solid #e74c3c' : '2px solid var(--accent)') : '1px solid var(--border)',
                                        background: isSelected ? (isGGNG ? 'rgba(231, 76, 60, 0.15)' : 'rgba(243, 156, 18, 0.12)') : 'var(--surface)',
                                        color: isSelected ? (isGGNG ? '#e74c3c' : 'var(--accent)') : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        fontWeight: isSelected ? 'bold' : 'normal',
                                        transition: 'all 0.2s',
                                        opacity: isSelected ? 1 : 0.6,
                                        boxShadow: isSelected ? (isGGNG ? '0 0 20px rgba(231, 76, 60, 0.2)' : '0 0 15px rgba(243, 156, 18, 0.15)') : 'none'
                                    }
                                }, isSelected ? '✅' : (isTutte ? '⭐' : f.icon), ' ', f.label, isGGNG ? ' ⚽' : '');
                            })
                        ),
                        React.createElement('div', { style: { fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' } },
                            giocateSelezionate.includes('tutte') 
                                ? '⭐ Analizza TUTTE le famiglie di giocate (incluso GG - NG)'
                                : `📊 Analizza ${giocateSelezionate.length} famiglia/e: ${giocateSelezionate.map(id => FAMIGLIE_GIOCATE[id]?.label || id).join(', ')}`,
                            giocateSelezionate.includes('gg_ng') ? ' ⚽ GG/NG attivo!' : ''
                        )
                    ),

                    // ===== FILTRI =====
                    React.createElement('div', { style: { marginBottom: '20px', padding: '12px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' } },
                        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' } },
                            React.createElement('div', { style: { flex: '1', minWidth: '150px' } },
                                React.createElement('label', { style: { fontSize: '12px', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '4px' } }, '📅 Range Giorni'),
                                React.createElement('select', {
                                    value: giorniRange,
                                    onChange: e => setGiorniRange(parseInt(e.target.value)),
                                    style: {
                                        width: '100%',
                                        padding: '6px 10px',
                                        background: 'var(--surface)',
                                        color: 'var(--text)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '6px',
                                        fontSize: '12px'
                                    }
                                },
                                    React.createElement('option', { value: 0 }, 'Oggi (0)'),
                                    React.createElement('option', { value: 1 }, 'Oggi - Domani (0-1)'),
                                    React.createElement('option', { value: 2 }, 'Oggi - Dopodomani (0-2)'),
                                    React.createElement('option', { value: 3 }, 'Oggi - +3 (0-3)'),
                                    React.createElement('option', { value: 5 }, 'Oggi - +5 (0-5)'),
                                    React.createElement('option', { value: 7 }, 'Oggi - +7 (0-7)')
                                )
                            ),
                            React.createElement('div', { style: { flex: '1', minWidth: '150px' } },
                                React.createElement('label', { style: { fontSize: '12px', fontWeight: 'bold', color: 'var(--text)', display: 'block', marginBottom: '4px' } }, '⏰ Filtro Orario'),
                                React.createElement('div', { style: { display: 'flex', background: 'var(--surface)', borderRadius: '6px', padding: '2px', border: '1px solid var(--border)' } },
                                    React.createElement('button', {
                                        onClick: () => setFiltroOrario('dopo_ora'),
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: filtroOrario === 'dopo_ora' ? 'bold' : 'normal',
                                            background: filtroOrario === 'dopo_ora' ? 'var(--accent)' : 'transparent',
                                            color: filtroOrario === 'dopo_ora' ? '#000' : 'var(--text-muted)',
                                            transition: 'all 0.2s'
                                        }
                                    }, '⏰ Dopo ora'),
                                    React.createElement('button', {
                                        onClick: () => setFiltroOrario('giorno_intero'),
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            fontSize: '11px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: filtroOrario === 'giorno_intero' ? 'bold' : 'normal',
                                            background: filtroOrario === 'giorno_intero' ? 'var(--accent)' : 'transparent',
                                            color: filtroOrario === 'giorno_intero' ? '#000' : 'var(--text-muted)',
                                            transition: 'all 0.2s'
                                        }
                                    }, '📅 Giorno intero')
                                ),
                                React.createElement('div', { style: { fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' } },
                                    filtroOrario === 'dopo_ora' ? 'Solo partite non ancora iniziate' : 'Tutte le partite del giorno'
                                )
                            )
                        )
                    ),

                    // ===== CASUALITÀ =====
                    React.createElement('div', { style: { marginBottom: '20px', padding: '12px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' } },
                        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' } },
                            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                                React.createElement('span', { style: { fontSize: '20px' } }, '🎲'),
                                React.createElement('span', { style: { fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' } }, 'Casualità:')
                            ),
                            React.createElement('div', { style: { flex: '1', minWidth: '120px' } },
                                React.createElement('input', {
                                    type: 'range',
                                    min: 0,
                                    max: 100,
                                    step: 5,
                                    value: casualitaLevel,
                                    onChange: e => setCasualitaLevel(parseInt(e.target.value)),
                                    style: {
                                        width: '100%',
                                        accentColor: '#8e44ad',
                                        height: '6px',
                                        borderRadius: '3px',
                                        background: 'var(--surface)',
                                        cursor: 'pointer'
                                    }
                                })
                            ),
                            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px' } },
                                React.createElement('span', { style: { fontSize: '14px', fontWeight: 'bold', color: '#8e44ad' } }, `${casualitaLevel}%`),
                                React.createElement('span', { style: { fontSize: '18px' } },
                                    casualitaLevel > 80 ? '🎲🎲🎲' : casualitaLevel > 50 ? '🎲🎲' : casualitaLevel > 20 ? '🎲' : '📊'
                                )
                            ),
                            React.createElement('div', { style: { fontSize: '10px', color: 'var(--text-muted)' } },
                                casualitaLevel <= 20 ? '📊 Prevedibile' : 
                                casualitaLevel <= 50 ? '🎲 Un po\' di casualità' : 
                                casualitaLevel <= 80 ? '🎲🎲 Media casualità' : 
                                '🎲🎲🎲 Molto casuale!'
                            )
                        ),
                        casualitaLevel > 80 ? React.createElement('div', { style: { marginTop: '6px', fontSize: '11px', color: '#e74c3c', fontWeight: 'bold', textAlign: 'center' } },
                            '⚠️ CASUALITÀ ESTREMA! Il numero di partite verrà scelto a caso!'
                        ) : null
                    ),

                    // ===== STATISTICHE =====
                    React.createElement('div', { style: { marginBottom: '16px', padding: '10px 14px', background: 'var(--surface)', borderRadius: '6px', border: '1px solid var(--border)' } },
                        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '16px' } },
                            React.createElement('span', null, '📊 ', React.createElement('b', null, partiteDisponibili.length), ' partite disponibili'),
                            React.createElement('span', null, '⭐ Media score: ', React.createElement('b', { style: { color: 'var(--accent)' } },
                                partiteDisponibili.length > 0 ? Math.round(partiteDisponibili.reduce((s, m) => s + m.score, 0) / partiteDisponibili.length) : 0, '%'
                            )),
                            React.createElement('span', null, '🎯 Selezionate: ', React.createElement('b', { style: { color: 'var(--win)' } }, partiteSelezionate.length), ' / ', numeroPartiteDaSelezionare),
                            partiteSelezionate.length > 0 ? React.createElement('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } },
                                '📅 ', formatDateEU(partiteSelezionate[0].data), ' → ', formatDateEU(partiteSelezionate[partiteSelezionate.length-1].data)
                            ) : null,
                            giocateSelezionate.includes('gg_ng') ? React.createElement('span', { style: { color: '#e74c3c', fontWeight: 'bold', fontSize: '11px' } }, '⚽ GG/NG attivo') : null
                        )
                    ),

                    // ===== SELEZIONE NUMERO PARTITE =====
                    React.createElement('div', { style: { marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' } },
                        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--surface)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border)' } },
                            React.createElement('span', { style: { fontSize: '13px', fontWeight: 'bold', color: 'var(--text)' } }, '📊 Numero partite:'),
                            React.createElement('input', {
                                type: 'number',
                                min: 1,
                                max: 10,
                                value: numeroPartiteDaSelezionare,
                                onChange: e => {
                                    const val = parseInt(e.target.value) || 1;
                                    setNumeroPartiteDaSelezionare(Math.min(10, Math.max(1, val)));
                                },
                                style: {
                                    width: '40px',
                                    padding: '4px 6px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    background: 'var(--background)',
                                    color: 'var(--text)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '4px',
                                    outline: 'none'
                                }
                            }),
                            React.createElement('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, '(1-10)'),
                            casualitaLevel > 80 ? React.createElement('span', { style: { fontSize: '10px', color: '#e74c3c', fontWeight: 'bold' } }, '🎲 IGNORATO!') : null
                        ),
                        React.createElement('button', {
                            className: 'btn',
                            onClick: () => selezionaNumeroPartite(numeroPartiteDaSelezionare),
                            style: { background: 'var(--accent2)', color: '#000' }
                        }, '⚡ Seleziona')
                    ),

                    // ===== PULSANTI AZIONE =====
                    React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '12px' } },
                        React.createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
                            React.createElement('button', { className: 'btn', onClick: () => selezionaNumeroPartite(3) }, 'Top 3'),
                            React.createElement('button', { className: 'btn', onClick: () => selezionaNumeroPartite(5) }, 'Top 5'),
                            React.createElement('button', { className: 'btn', onClick: () => selezionaNumeroPartite(10) }, 'Top 10'),
                            React.createElement('button', { className: 'btn', onClick: () => selezionaNumeroPartite(partiteDisponibili.length), style: { fontSize: '11px' } },
                                '📋 Tutte (', partiteDisponibili.length, ')'
                            )
                        ),
                        React.createElement('div', { style: { display: 'flex', gap: '4px', flexWrap: 'wrap' } },
                            React.createElement('button', { className: 'btn', onClick: selezionaCasuale, style: { background: '#8e44ad', color: '#fff' } }, '🎲 Casuale'),
                            React.createElement('button', { className: 'btn', onClick: rigeneraSchedina, style: { background: 'var(--accent2)', color: '#000' } },
                                '🔄 Rigenera', casualitaLevel > 50 ? ' 🎲' : ''
                            ),
                            React.createElement('button', { className: 'btn btn-secondary', onClick: resettaSchedina }, '🗑️ Resetta')
                        ),
                        React.createElement('button', {
                            className: 'btn',
                            onClick: creaSchedina,
                            disabled: partiteSelezionate.length < 2 || loading,
                            style: { marginLeft: 'auto' }
                        }, loading ? '⏳ Creazione...' : `🎯 Crea (${partiteSelezionate.length})`)
                    ),

                    // ===== LEGENDA =====
                    React.createElement('div', { style: { marginTop: '8px', padding: '8px 12px', background: 'var(--surface)', borderRadius: '6px', border: '1px dashed var(--border)', fontSize: '10px', color: 'var(--text-muted)' } },
                        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '12px' } },
                            React.createElement('span', null, '💡 Clicca su una partita per selezionarla/deselezionarla'),
                            React.createElement('span', null, '📅 Ordinate automaticamente per data/ora'),
                            React.createElement('span', null, '🔢 Max 10 partite per schedina'),
                            React.createElement('span', { style: { color: '#e74c3c' } }, '⚽ ', React.createElement('b', null, 'NOVITÀ:'), ' GG - NG (Goal-Goal / No Goal)'),
                            casualitaLevel > 80 ? React.createElement('span', { style: { color: '#e74c3c', fontWeight: 'bold' } }, '🎲🎲🎲 CASUALITÀ ESTREMA ATTIVA!') : null
                        )
                    )
                ),

                // ===== LISTA PARTITE =====
                React.createElement('div', { className: 'card', style: { marginTop: '16px' } },
                    React.createElement('h4', { style: { marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' } },
                        '📋 Partite Disponibili',
                        partiteSelezionate.length > 0 ? React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } },
                            partiteSelezionate.length, ' selezionate ✅ • Ordinate per data/ora'
                        ) : null
                    ),
                    partiteDisponibili.length === 0 ? 
                        React.createElement('div', { className: 'empty-state' },
                            filtroOrario === 'dopo_ora' 
                                ? 'Nessuna partita futura disponibile dopo l\'orario corrente per i campionati selezionati.' 
                                : 'Nessuna partita disponibile per i filtri selezionati.'
                        ) :
                        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                            partiteDisponibili.map(m => {
                                const isSelected = partiteSelezionate.some(p => p.id === m.id);
                                const isGGNG = m.giocata?.familyId === 'gg_ng';
                                
                                return React.createElement('div', {
                                    key: m.id,
                                    onClick: () => togglePartita(m),
                                    style: {
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
                                    }
                                },
                                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '100px' } },
                                        React.createElement('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, formatDateEU(m.data)),
                                        React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-muted)' } }, m.ora && m.ora !== 'TBD' ? m.ora : '')
                                    ),
                                    React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-muted)', minWidth: '80px' } }, m.campionato),
                                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', flex: '1', minWidth: '150px' } },
                                        React.createElement('span', { style: { fontWeight: 'bold', fontSize: '13px', color: 'var(--text)' } },
                                            m.casa, ' vs ', m.ospiti
                                        )
                                    ),
                                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '110px', justifyContent: 'center' } },
                                        m.giocata ? [
                                            React.createElement('span', { key: 'label', style: { fontSize: '11px', color: isGGNG ? '#e74c3c' : 'var(--accent)', fontWeight: 'bold' } },
                                                m.giocata.familyIcon, ' ', m.giocata.label
                                            ),
                                            React.createElement('span', { key: 'pct', className: `giocata-pct ${getPercentualeClasse(m.pct)}`, style: { fontSize: '12px', padding: '2px 8px' } },
                                                m.pct, '%'
                                            ),
                                            m.giocata.isBomb ? React.createElement('span', { key: 'bomb', style: { fontSize: '14px' } }, '💣') : null,
                                            isGGNG ? React.createElement('span', { key: 'ggng', style: { fontSize: '12px', color: '#e74c3c' } }, '⚽') : null
                                        ] : React.createElement('span', { style: { fontSize: '10px', color: 'var(--text-muted)' } }, 'N/D')
                                    ),
                                    React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', minWidth: '50px', justifyContent: 'flex-end' } },
                                        React.createElement('span', { className: `giocata-pct ${getPercentualeClasse(m.score)}`, style: { fontSize: '13px', padding: '2px 10px' } },
                                            m.score, '%'
                                        ),
                                        isSelected ? React.createElement('span', { style: { color: 'var(--win)', fontSize: '14px' } }, '✅') : null
                                    )
                                );
                            })
                        )
                ),

                // ===== SCHEDINE SALVATE =====
                schedineSalvate.length > 0 ? React.createElement('div', { className: 'card', style: { marginTop: '16px', border: '2px solid var(--accent)' } },
                    React.createElement('h4', { style: { color: 'var(--accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' } },
                        '💾 Schedine Salvate (', schedineSalvate.length, ')',
                        React.createElement('button', {
                            className: 'btn btn-secondary',
                            onClick: () => {
                                if (confirm('⚠️ Eliminare TUTTE le schedine salvate?')) {
                                    localStorage.setItem('ft_schedine_salvate', '[]');
                                    setSchedineSalvate([]);
                                    showAlert('success', '🗑️ Tutte le schedine eliminate!');
                                }
                            },
                            style: { fontSize: '10px', padding: '2px 12px', marginLeft: 'auto' }
                        }, '🗑️ Elimina Tutte')
                    ),
                    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                        schedineSalvate.map((s, idx) => React.createElement('div', {
                            key: s.id,
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: 'var(--surface)',
                                gap: '8px',
                                flexWrap: 'wrap'
                            }
                        },
                            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '150px' } },
                                React.createElement('span', { style: { fontWeight: 'bold', color: 'var(--accent)', fontSize: '12px' } }, `#${idx + 1}`),
                                React.createElement('span', { style: { fontSize: '12px', color: 'var(--text)' } }, '📅 ', s.dataFormattata || s.timestamp || 'N/D'),
                                React.createElement('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } },
                                    s.numPartite, ' partite • Media: ', React.createElement('b', { style: { color: 'var(--accent)' } }, s.media, '%')
                                ),
                                s.giocateSelezionate?.includes('gg_ng') ? React.createElement('span', { style: { fontSize: '10px', color: '#e74c3c' } }, '⚽ GG/NG') : null,
                                s.casualitaLevel > 80 ? React.createElement('span', { style: { fontSize: '10px', color: '#8e44ad' } }, '🎲 ESTREMA') : null
                            ),
                            React.createElement('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
                                React.createElement('button', { className: 'btn', onClick: () => caricaSchedinaSalvata(s), style: { fontSize: '10px', padding: '4px 12px' } }, '📂 Carica'),
                                React.createElement('button', {
                                    className: 'btn btn-secondary',
                                    onClick: () => {
                                        const text = formatSchedinaText(s);
                                        navigator.clipboard?.writeText?.(text);
                                        showAlert('success', '📋 Schedina copiata!');
                                    },
                                    style: { fontSize: '10px', padding: '4px 12px' }
                                }, '📋 Copia'),
                                React.createElement('button', { className: 'btn btn-danger', onClick: () => eliminaSchedinaSalvata(s.id), style: { fontSize: '10px', padding: '4px 12px' } }, '🗑️')
                            )
                        ))
                    )
                ) : null,

                // ===== MODAL SCHEDINA =====
                showSchedinaModal && schedinaCreata ? React.createElement('div', {
                    className: 'heatmap-detail-overlay',
                    onClick: () => setShowSchedinaModal(false)
                },
                    React.createElement('div', {
                        className: 'heatmap-detail-modal',
                        onClick: e => e.stopPropagation(),
                        style: { maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }
                    },
                        React.createElement('button', { className: 'close-btn', onClick: () => setShowSchedinaModal(false) }, '✖'),
                        React.createElement('div', { style: { padding: '10px 0' } },
                            React.createElement('h2', { style: { color: 'var(--accent)', textAlign: 'center', marginBottom: '4px' } }, '🎯 SCHEDINA GesssAI-Pro'),
                            React.createElement('p', { style: { textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginBottom: '12px' } },
                                '📅 ', schedinaCreata.dataFormattata || new Date().toLocaleString('it-IT'), ' • ', schedinaCreata.numPartite, ' partite • Media: ',
                                React.createElement('b', { style: { color: 'var(--accent)' } }, schedinaCreata.media, '%'),
                                schedinaCreata.giocateSelezionate?.includes('gg_ng') ? React.createElement('span', { style: { marginLeft: '8px', color: '#e74c3c' } }, '⚽ GG/NG') : null,
                                schedinaCreata.casualitaLevel > 80 ? React.createElement('span', { style: { marginLeft: '8px', color: '#8e44ad' } }, '🎲 ESTREMA') : null
                            ),
                            React.createElement('div', { style: { textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' } },
                                schedinaCreata.dataInizio && schedinaCreata.dataFine ? React.createElement('span', null,
                                    '📆 ', schedinaCreata.dataInizio === schedinaCreata.dataFine 
                                        ? `Partite del ${formatDateEU(schedinaCreata.dataInizio)}` 
                                        : `Dal ${formatDateEU(schedinaCreata.dataInizio)} al ${formatDateEU(schedinaCreata.dataFine)}`
                                ) : null,
                                schedinaCreata.campionatiSelezionati ? React.createElement('span', null,
                                    '🏆 ', schedinaCreata.campionatiSelezionati.length === championships.length ? 'Tutti i campionati' : schedinaCreata.campionatiSelezionati.join(', ')
                                ) : null,
                                schedinaCreata.giocateSelezionate ? React.createElement('span', null,
                                    '🎯 ', schedinaCreata.giocateSelezionate.includes('tutte') ? 'Tutte le giocate' : schedinaCreata.giocateSelezionate.map(id => FAMIGLIE_GIOCATE[id]?.label || id).join(', ')
                                ) : null
                            ),
                            React.createElement('div', { style: { borderTop: '2px solid var(--accent)', paddingTop: '12px' } },
                                schedinaCreata.partite.map((m, idx) => {
                                    const isGGNG = m.giocata?.familyId === 'gg_ng';
                                    return React.createElement('div', {
                                        key: idx,
                                        style: {
                                            padding: '8px 12px',
                                            marginBottom: '6px',
                                            borderRadius: '6px',
                                            border: isGGNG ? '2px solid #e74c3c' : '1px solid var(--border)',
                                            background: isGGNG ? 'rgba(231, 76, 60, 0.05)' : 'var(--surface)'
                                        }
                                    },
                                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' } },
                                            React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } },
                                                `#${idx + 1} 📅 ${formatDateEU(m.data)} - ${m.ora && m.ora !== 'TBD' ? m.ora : '--:--'}`
                                            ),
                                            React.createElement('span', { style: { fontSize: '11px', color: 'var(--text-muted)' } }, '🏆 ', m.campionato)
                                        ),
                                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px' } },
                                            React.createElement('span', { style: { fontSize: '14px', fontWeight: 'bold' } }, '⚽ ', m.casa, ' vs ', m.ospiti)
                                        ),
                                        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px', marginTop: '2px' } },
                                            React.createElement('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
                                                m.giocata ? [
                                                    React.createElement('span', { key: 'label', style: { fontSize: '13px', fontWeight: 'bold', color: isGGNG ? '#e74c3c' : 'var(--accent)' } },
                                                        m.giocata.familyIcon, ' ', m.giocata.label
                                                    ),
                                                    React.createElement('span', { key: 'pct', className: `giocata-pct ${getPercentualeClasse(m.pct)}`, style: { fontSize: '14px', padding: '2px 12px' } },
                                                        m.pct, '%'
                                                    ),
                                                    m.giocata.isBomb ? React.createElement('span', { key: 'bomb', style: { fontSize: '18px' } }, '💣') : null,
                                                    isGGNG ? React.createElement('span', { key: 'ggng', style: { fontSize: '16px', color: '#e74c3c', fontWeight: 'bold' } }, '⚽ GG/NG') : null
                                                ] : React.createElement('span', { style: { fontSize: '12px', color: 'var(--text-muted)' } }, 'Nessuna giocata')
                                            ),
                                            React.createElement('span', { className: `giocata-pct ${getPercentualeClasse(m.score)}`, style: { fontSize: '12px', padding: '2px 8px' } },
                                                'Score: ', m.score, '%'
                                            )
                                        )
                                    );
                                })
                            ),
                            React.createElement('div', { style: { borderTop: '2px solid var(--accent)', marginTop: '12px', paddingTop: '12px', textAlign: 'center' } },
                                React.createElement('div', { style: { fontSize: '16px', fontWeight: 'bold', color: 'var(--accent)' } },
                                    '⭐ Media Score: ', schedinaCreata.media, '%'
                                ),
                                React.createElement('div', { style: { fontSize: '13px', color: 'var(--text)' } },
                                    '📊 ', schedinaCreata.numPartite, ' partite',
                                    schedinaCreata.giocateSelezionate?.includes('gg_ng') ? React.createElement('span', { style: { marginLeft: '8px', color: '#e74c3c' } }, '⚽ GG/NG incluso') : null,
                                    schedinaCreata.casualitaLevel > 80 ? React.createElement('span', { style: { marginLeft: '8px', color: '#8e44ad' } }, '🎲 ESTREMA') : null
                                ),
                                React.createElement('div', { style: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' } },
                                    '💣 GesssAI-Pro v3.0 • ⚠️ Le scommesse comportano rischi finanziari. Gioca responsabilmente.'
                                )
                            )
                        ),
                        React.createElement('div', { style: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', justifyContent: 'center' } },
                            React.createElement('button', { className: 'btn', onClick: copySchedinaToClipboard, style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } }, '📋 Copia'),
                            React.createElement('button', { className: 'btn', onClick: salvaSchedinaLocale, style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' } }, '💾 Salva'),
                            React.createElement('button', {
                                className: 'btn',
                                onClick: shareOnWhatsApp,
                                style: { background: '#25D366', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }
                            },
                                React.createElement('svg', { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'white' },
                                    React.createElement('path', { d: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' })
                                ),
                                'WhatsApp'
                            ),
                            React.createElement('button', {
                                className: 'btn',
                                onClick: shareOnTelegram,
                                style: { background: '#0088cc', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }
                            },
                                React.createElement('svg', { viewBox: '0 0 24 24', width: '18', height: '18', fill: 'white' },
                                    React.createElement('path', { d: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z' })
                                ),
                                'Telegram'
                            ),
                            React.createElement('button', { className: 'btn btn-secondary', onClick: () => setShowSchedinaModal(false) }, '✖ Chiudi')
                        )
                    )
                ) : null
            );
        };

        // ============================================================
        // 7. ALERT
        // ============================================================

        function showAlert(type, message) {
            const colors = {
                success: '#2ecc71',
                error: '#e74c3c',
                info: '#3498db',
                warning: '#f39c12'
            };

            const alertDiv = document.createElement('div');
            alertDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: #fff;
                background: ${colors[type] || '#333'};
                font-size: 14px;
                font-weight: 500;
                z-index: 9999;
                max-width: 400px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.4);
                animation: slideIn 0.3s ease;
                border-left: 4px solid rgba(255,255,255,0.3);
            `;
            alertDiv.textContent = message;
            document.body.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.style.opacity = '0';
                alertDiv.style.transition = 'opacity 0.5s';
                setTimeout(() => alertDiv.remove(), 500);
            }, 4000);
        }

        // ============================================================
        // 8. MONTAGGIO
        // ============================================================

        const rootElement = document.getElementById('schedina-root');
        if (rootElement) {
            ReactDOM.createRoot(rootElement).render(
                React.createElement(SchedinaComponent, {
                    matches: sampleMatches,
                    championships: sampleChampionships,
                    selectedFamiglie: ['tutte'],
                    showAlert: showAlert
                })
            );
            console.log('✅ SchedinaComponent montato correttamente!');
        } else {
            console.error('❌ Elemento #schedina-root non trovato!');
        }

        // ============================================================
        // 9. ANIMAZIONI CSS
        // ============================================================

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styleSheet);

        console.log('🚀 GesssAI-Pro - Schedina Component caricato!');
        console.log('📊 Partite disponibili:', sampleMatches.length);
        console.log('🏆 Campionati:', sampleChampionships.map(c => c.name).join(', '));
        console.log('⚽ GG/NG incluso!');
        console.log('🎲 Casualità estrema (>80%) attiva!');
    </script>
</body>
</html>