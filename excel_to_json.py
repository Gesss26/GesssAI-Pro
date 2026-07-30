def converti_per_gesssai(file_schedule, file_stats, output_file):
    """
    Converte i file Schedule nel formato per l'app GesssAI
    REGOLA SEMPLICE: Se Risultato ha un valore → Giocata, altrimenti → Futura
    Se Risultato è vuoto, Gol Casa e Gol Ospite sono vuoti ("")
    """
    try:
        print("\n📱 Conversione per l'app GesssAI...")
        
        df_schedule = pd.read_excel(file_schedule)
        print(f"   📅 Schedule: {len(df_schedule)} righe")
        print(f"   📋 Colonne: {list(df_schedule.columns)}")
        
        # Trova le colonne
        col_data = None
        col_home = None
        col_away = None
        col_campionato = None
        col_giornata = None
        col_ora = None
        col_risultato = None
        
        for col in df_schedule.columns:
            col_lower = col.lower().strip()
            if 'date' in col_lower or 'data' in col_lower:
                col_data = col
            elif 'home' in col_lower or 'casa' in col_lower:
                col_home = col
            elif 'away' in col_lower or 'ospite' in col_lower:
                col_away = col
            elif 'risultato' in col_lower or 'score' in col_lower:
                col_risultato = col
            elif 'wk' in col_lower or 'giornata' in col_lower:
                col_giornata = col
            elif 'time' in col_lower or 'ora' in col_lower:
                col_ora = col
        
        # Se non trova la colonna risultati, cerca per contenuto
        if not col_risultato:
            for col in df_schedule.columns:
                sample = df_schedule[col].astype(str).head(30)
                if sample.str.contains(r'\d+[-–]\d+').sum() > 0:
                    col_risultato = col
                    break
        
        if not col_campionato:
            col_campionato = 'Campionato'
            if col_campionato not in df_schedule.columns:
                nome_campionato = os.path.basename(file_schedule).replace('_Schedule.xlsx', '').replace('Tutti_', '')
                df_schedule.insert(0, 'Campionato', nome_campionato)
        
        print(f"\n   🔍 Colonne trovate:")
        print(f"      Campionato: {col_campionato}")
        print(f"      Data: {col_data}")
        print(f"      Casa: {col_home}")
        print(f"      Ospite: {col_away}")
        print(f"      Risultato: {col_risultato}")
        
        if not col_risultato:
            print("   ❌ ERRORE: Colonna Risultato non trovata!")
            return None
        
        # ============================================================
        # CONVERSIONE - REGOLA SEMPLICE
        # ============================================================
        risultati = []
        conteggio_giocate = 0
        conteggio_future = 0
        
        for _, row in df_schedule.iterrows():
            try:
                campionato = str(row[col_campionato]) if col_campionato and col_campionato in row else 'Sconosciuto'
                campionato = campionato.replace(' - Schedule', '').replace('.xlsx', '').strip()
                
                data = str(row[col_data]) if col_data and col_data in row else ''
                ora = str(row[col_ora]) if col_ora and col_ora in row else ''
                casa = str(row[col_home]) if col_home and col_home in row else ''
                ospite = str(row[col_away]) if col_away and col_away in row else ''
                giornata = str(row[col_giornata]) if col_giornata and col_giornata in row else ''
                score = str(row[col_risultato]) if col_risultato and col_risultato in row else ''
                
                # Pulisci
                if data == 'nan': data = ''
                if ora == 'nan': ora = ''
                if casa == 'nan': casa = ''
                if ospite == 'nan': ospite = ''
                if giornata == 'nan': giornata = ''
                if score == 'nan': score = ''
                
                # ============================================================
                # REGOLA: Se Risultato ha un valore → Giocata
                # Se Risultato è vuoto → Futura (Gol Casa e Gol Ospite rimangono vuoti)
                # ============================================================
                gol_casa = ''
                gol_ospite = ''
                risultato = ''
                stato = 'Futura'
                
                if score and score != '':
                    # Estrai i gol
                    match = re.search(r'(\d+)\s*[-–:\.]\s*(\d+)', score)
                    if match:
                        gol_casa = int(match.group(1))
                        gol_ospite = int(match.group(2))
                        risultato = f"{gol_casa}-{gol_ospite}"
                        stato = 'Giocata'
                        conteggio_giocate += 1
                    else:
                        # Se c'è un risultato ma non si riesce a parsare
                        gol_casa = ''
                        gol_ospite = ''
                        risultato = ''
                        stato = 'Futura'
                        conteggio_future += 1
                else:
                    # Risultato vuoto → FUTURA, celle gol vuote
                    gol_casa = ''
                    gol_ospite = ''
                    risultato = ''
                    stato = 'Futura'
                    conteggio_future += 1
                
                # Aggiungi partita solo se ha squadre valide
                if casa and casa != '' and ospite and ospite != '':
                    # Per le partite FUTURE, lascia vuoti i campi Gol
                    if stato == 'Futura':
                        gol_casa_val = ''
                        gol_ospite_val = ''
                        risultato_val = ''
                    else:
                        gol_casa_val = gol_casa
                        gol_ospite_val = gol_ospite
                        risultato_val = risultato
                    
                    risultati.append({
                        'Campionato': campionato,
                        'Numero Giornata (Wk)': giornata,
                        'Data': data,
                        'Ora': ora,
                        'Squadra Casa': casa,
                        'Squadra Ospite': ospite,
                        'Risultato': risultato_val,
                        'Gol Casa': gol_casa_val,
                        'Gol Ospite': gol_ospite_val,
                        'Stato': stato
                    })
                    
            except Exception as e:
                continue
        
        # Crea DataFrame finale
        df_finale = pd.DataFrame(risultati)
        
        # Rimuovi duplicati
        df_finale = df_finale.drop_duplicates(subset=['Campionato', 'Data', 'Squadra Casa', 'Squadra Ospite'])
        
        # Ordina
        df_finale = df_finale.sort_values(['Campionato', 'Data'])
        
        # Salva
        df_finale.to_excel(output_file, index=False)
        
        print(f"\n   ✅ Creato file per GesssAI: {output_file}")
        print(f"      📊 {len(df_finale)} partite totali")
        print(f"      🟢 Giocate con risultato: {conteggio_giocate}")
        print(f"      🔵 Future (senza risultato): {conteggio_future}")
        print(f"      🏆 Campionati: {df_finale['Campionato'].nunique()}")
        
        # Mostra anteprima
        print("\n   📋 Anteprima prime 3 partite:")
        print(df_finale.head(3).to_string())
        
        return df_finale
        
    except Exception as e:
        print(f"   ❌ Errore: {e}")
        import traceback
        traceback.print_exc()
        return None