import os
import time
import pandas as pd
from bs4 import BeautifulSoup
import glob
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from datetime import datetime
import locale
import json

# ============================================
# CONFIGURAZIONE
# ============================================
print("\n" + "=" * 70)
print("⚽ DOWNLOAD E CONVERSIONE FBref → GESSSAI")
print("=" * 70)

try:
    locale.setlocale(locale.LC_TIME, 'it_IT.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_TIME, 'italian')
    except:
        print("⚠️ Impossibile impostare la localizzazione italiana")

download_folder = r"d:\ai\siti_da_fbref"
output_folder = r"d:\ai\excel"

os.makedirs(download_folder, exist_ok=True)
os.makedirs(output_folder, exist_ok=True)

print(f"\n📂 Cartella DOWNLOAD: {download_folder}")
print(f"📂 Cartella OUTPUT Excel: {output_folder}")

# ============================================
# LISTA DEI 26 SITI (AGGIORNATA)
# ============================================
sites = [
    # Allsvenskan (Svezia)
    {'nome': 'Allsvenskan - Stats', 'url': 'https://fbref.com/en/comps/29/Allsvenskan-Stats'},
    {'nome': 'Allsvenskan - Schedule', 'url': 'https://fbref.com/en/comps/29/schedule/Allsvenskan-Scores-and-Fixtures'},
    
    # Austrian Bundesliga (Austria)
    {'nome': 'Austrian Bundesliga - Stats', 'url': 'https://fbref.com/en/comps/56/Austrian-Bundesliga-Stats'},
    {'nome': 'Austrian Bundesliga - Schedule', 'url': 'https://fbref.com/en/comps/56/schedule/Austrian-Bundesliga-Scores-and-Fixtures'},
    
    # Chinese Super League (Cina)
    {'nome': 'Chinese Super League - Stats', 'url': 'https://fbref.com/en/comps/62/Chinese-Super-League-Stats'},
    {'nome': 'Chinese Super League - Schedule', 'url': 'https://fbref.com/en/comps/62/schedule/Chinese-Super-League-Scores-and-Fixtures'},
    
    # Danish Superliga (Danimarca)
    {'nome': 'Danish Superliga - Stats', 'url': 'https://fbref.com/en/comps/50/Danish-Superliga-Stats'},
    {'nome': 'Danish Superliga - Schedule', 'url': 'https://fbref.com/en/comps/50/schedule/Danish-Superliga-Scores-and-Fixtures'},
    
    # Eliteserien (Norvegia)
    {'nome': 'Eliteserien - Stats', 'url': 'https://fbref.com/en/comps/28/Eliteserien-Stats'},
    {'nome': 'Eliteserien - Schedule', 'url': 'https://fbref.com/en/comps/28/schedule/Eliteserien-Scores-and-Fixtures'},
    
    # Eredivisie (Paesi Bassi) 
    {'nome': 'Eredivisie - Stats', 'url': 'https://fbref.com/en/comps/23/Eredivisie-Stats'},
    {'nome': 'Eredivisie - Schedule', 'url': 'https://fbref.com/en/comps/23/schedule/Eredivisie-Scores-and-Fixtures'},
    
    # La Liga (Spagna) 
    {'nome': 'La Liga - Stats', 'url': 'https://fbref.com/en/comps/12/2026-2027/2026-2027-La-Liga-Stats'},
    {'nome': 'La Liga - Schedule', 'url': 'https://fbref.com/en/comps/12/2026-2027/schedule/2026-2027-La-Liga-Scores-and-Fixtures'},
    
    # League of Ireland Premier Division (Irlanda)
    {'nome': 'Ireland Premier - Stats', 'url': 'https://fbref.com/en/comps/80/League-of-Ireland-Premier-Division-Stats'},
    {'nome': 'Ireland Premier - Schedule', 'url': 'https://fbref.com/en/comps/80/schedule/League-of-Ireland-Premier-Division-Scores-and-Fixtures'},
    
    # J1 League (Giappone)
    {'nome': 'J1 League - Stats', 'url': 'https://fbref.com/en/comps/25/J1-League-Stats'},
    {'nome': 'J1 League - Schedule', 'url': 'https://fbref.com/en/comps/25/schedule/J1-League-Scores-and-Fixtures'},
    
    # K League 1 (Corea del Sud)
    {'nome': 'K League 1 - Stats', 'url': 'https://fbref.com/en/comps/55/K-League-1-Stats'},
    {'nome': 'K League 1 - Schedule', 'url': 'https://fbref.com/en/comps/55/schedule/K-League-1-Scores-and-Fixtures'},
    
    # Russian Premier League (Russia)
    {'nome': 'Russian PL - Stats', 'url': 'https://fbref.com/en/comps/30/Russian-Premier-League-Stats'},
    {'nome': 'Russian PL - Schedule', 'url': 'https://fbref.com/en/comps/30/schedule/Russian-Premier-League-Scores-and-Fixtures'},
    
    # Swiss Super League (Svizzera)
    {'nome': 'Swiss Super League - Stats', 'url': 'https://fbref.com/en/comps/57/Swiss-Super-League-Stats'},
    {'nome': 'Swiss Super League - Schedule', 'url': 'https://fbref.com/en/comps/57/schedule/Swiss-Super-League-Scores-and-Fixtures'},
    
    # Veikkausliiga (Finlandia)
    {'nome': 'Veikkausliiga - Stats', 'url': 'https://fbref.com/en/comps/43/Veikkausliiga-Stats'},
    {'nome': 'Veikkausliiga - Schedule', 'url': 'https://fbref.com/en/comps/43/schedule/Veikkausliiga-Scores-and-Fixtures'}
]

# ============================================
# FUNZIONE PER SCARICARE CON RISULTATI
# ============================================
def scarica_con_risultati(driver, url, timeout=30):
    """
    Scarica la pagina assicurandosi che i risultati siano caricati
    """
    print("   🔄 Caricamento pagina...")
    driver.get(url)
    time.sleep(3)
    
    # Attendi la tabella
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "table"))
        )
        print("   ✅ Tabella trovata")
    except:
        print("   ⚠️ Tabella non trovata, continuo comunque...")
    
    # SCROLLA PER CARICARE I DATI DINAMICI
    print("   🔄 Scrolling per caricare i risultati...")
    
    # Scrolla gradualmente
    for step in range(4):
        scroll_position = (step + 1) * 25  # 25%, 50%, 75%, 100%
        driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight * {scroll_position/100});")
        time.sleep(1.5)
    
    # Torna in cima
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(2)
    
    # Scrolla di nuovo lentamente per caricare tutto
    for step in range(8):
        scroll_position = (step + 1) * 12.5  # 12.5%, 25%, 37.5%, etc.
        driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight * {scroll_position/100});")
        time.sleep(0.8)
    
    # Torna in cima
    driver.execute_script("window.scrollTo(0, 0);")
    time.sleep(2)
    
    # VERIFICA LA PRESENZA DEI RISULTATI
    html = driver.page_source
    
    # Cerca pattern di risultati (es. 2-1, 3-0, etc.)
    results_pattern = r'\d+[-–:\.]\d+'
    results_found = re.findall(results_pattern, html)
    
    if results_found:
        print(f"   ✅ Trovati {len(results_found)} risultati nella pagina")
        # Mostra alcuni esempi
        for r in results_found[:3]:
            print(f"      Esempio: {r}")
    else:
        print("   ⚠️ Nessun risultato trovato, aspetto ulteriormente...")
        time.sleep(5)
        
        # Prova un refresh
        print("   🔄 Refresh della pagina...")
        driver.refresh()
        time.sleep(5)
        
        # Scrolla di nuovo
        for step in range(4):
            scroll_position = (step + 1) * 25
            driver.execute_script(f"window.scrollTo(0, document.body.scrollHeight * {scroll_position/100});")
            time.sleep(1.5)
        
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(2)
        
        html = driver.page_source
        results_found = re.findall(results_pattern, html)
        
        if results_found:
            print(f"   ✅ Trovati {len(results_found)} risultati dopo il refresh")
        else:
            print("   ❌ Ancora nessun risultato trovato!")
    
    return html

# ============================================
# FUNZIONI DI UTILITÀ
# ============================================
def converti_date_europee(df):
    """Converte le date in formato europeo (gg/mm/aaaa)"""
    if df is None or df.empty:
        return df
    
    date_keywords = ['date', 'data', 'giorno', 'match_date', 'game_date', 'scheduled', 'day']
    
    for col in df.columns:
        col_lower = col.lower().strip()
        if any(keyword in col_lower for keyword in date_keywords):
            try:
                df[col] = df[col].astype(str)
                
                def convert_date_value(val):
                    if pd.isna(val) or val == '' or val == 'nan' or val == 'None':
                        return val
                    val_str = str(val).strip()
                    
                    if re.match(r'^\d{1,2}/\d{1,2}/\d{4}$', val_str):
                        return val_str
                    
                    date_formats = [
                        (r'^(\d{4})-(\d{1,2})-(\d{1,2})$', '%Y-%m-%d'),
                        (r'^(\d{1,2})-(\d{1,2})-(\d{4})$', '%d-%m-%Y'),
                        (r'^(\d{4})/(\d{1,2})/(\d{1,2})$', '%Y/%m/%d'),
                        (r'^(\d{1,2})\.(\d{1,2})\.(\d{4})$', '%d.%m.%Y'),
                    ]
                    
                    for pattern, fmt in date_formats:
                        if re.match(pattern, val_str):
                            try:
                                date_obj = datetime.strptime(val_str, fmt)
                                return date_obj.strftime('%d/%m/%Y')
                            except:
                                continue
                    
                    try:
                        from dateutil import parser
                        date_obj = parser.parse(val_str, fuzzy=True)
                        return date_obj.strftime('%d/%m/%Y')
                    except:
                        pass
                    
                    return val_str
                
                df[col] = df[col].apply(convert_date_value)
            except:
                pass
    
    return df

def estrai_tabella(soup, html_content):
    """Estrae la tabella principale dalla pagina FBref"""
    tables = soup.find_all('table')
    if not tables:
        return None
    
    # Cerca tabelle specifiche
    for table in tables:
        table_id = table.get('id', '')
        if 'stats_standard' in table_id or 'results' in table_id or 'schedule' in table_id:
            return table
    
    # Se non trova tabelle specifiche, prendi la più grande
    return max(tables, key=lambda t: len(t.find_all('tr')))

def table_to_dataframe(table_element):
    """Converte un elemento table BeautifulSoup in DataFrame"""
    try:
        rows = table_element.find_all('tr')
        headers = []
        for row in rows:
            ths = row.find_all('th')
            if ths:
                headers = [th.get_text(strip=True) for th in ths]
                tds = row.find_all('td')
                if tds:
                    headers.extend([td.get_text(strip=True) for td in tds])
                break
        
        if not headers:
            first_row = rows[0] if rows else None
            if first_row:
                headers = [col.get_text(strip=True) for col in first_row.find_all(['td', 'th'])]
                rows = rows[1:]
        
        data = []
        for row in rows:
            if row.get('class') and 'spacer' in ' '.join(row.get('class', [])):
                continue
            cols = row.find_all(['td', 'th'])
            if not cols:
                continue
            row_data = []
            for col in cols:
                text = col.get_text(strip=True)
                if col.find('a'):
                    text = ' '.join([a.get_text(strip=True) for a in col.find_all('a')]) or text
                row_data.append(text)
            if any(row_data) and not all(c == '' for c in row_data):
                data.append(row_data)
        
        if data:
            max_cols = max(len(row) for row in data)
            for row in data:
                while len(row) < max_cols:
                    row.append('')
            while len(headers) < max_cols:
                headers.append(f'Colonna_{len(headers)+1}')
            headers = headers[:max_cols]
            
            if data and data[0]:
                first_row_lower = [str(cell).lower() for cell in data[0]]
                if any(keyword in ' '.join(first_row_lower) for keyword in ['rk', 'rank', 'squad', 'team', 'mp', 'w', 'd', 'l', 'pts']):
                    headers = data[0]
                    data = data[1:]
            
            df = pd.DataFrame(data, columns=headers)
            df = df.replace('', pd.NA)
            df = df.dropna(how='all')
            df = converti_date_europee(df)
            return df
        return None
    except Exception as e:
        print(f"   Errore nel parsing della tabella: {str(e)}")
        return None

def converti_html_in_excel(html_file_path, output_folder):
    """Converte un file HTML in Excel"""
    try:
        nome_file = os.path.basename(html_file_path)
        with open(html_file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        try:
            soup = BeautifulSoup(html_content, 'lxml')
        except:
            soup = BeautifulSoup(html_content, 'html.parser')
        
        table = estrai_tabella(soup, html_content)
        if not table:
            return None, "Nessuna tabella trovata"
        
        df = table_to_dataframe(table)
        if df is None or df.empty:
            return None, "Tabella vuota o non parseable"
        
        df.columns = [col.replace('\n', ' ').strip() for col in df.columns]
        
        nome_excel = os.path.splitext(nome_file)[0] + ".xlsx"
        excel_path = os.path.join(output_folder, nome_excel)
        
        with pd.ExcelWriter(excel_path, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Dati', index=False)
            worksheet = writer.sheets['Dati']
            for idx, col in enumerate(df.columns):
                try:
                    max_length = max(df[col].astype(str).map(len).max() if len(df) > 0 else 0, len(str(col))) + 2
                    max_length = min(max_length, 50)
                    col_letter = chr(65 + idx) if idx < 26 else chr(65 + (idx // 26) - 1) + chr(65 + (idx % 26))
                    worksheet.column_dimensions[col_letter].width = max_length
                except:
                    pass
        
        return df, f"OK ({len(df)} righe, {len(df.columns)} colonne)"
    except Exception as e:
        return None, str(e)

def unisci_file_excel(output_folder, pattern, nome_output):
    """Unisce tutti i file Excel che corrispondono a un pattern"""
    
    excel_files = glob.glob(os.path.join(output_folder, f"*{pattern}*.xlsx"))
    if not excel_files:
        print(f"   ⚠️ Nessun file {pattern} trovato")
        return None
    
    print(f"\n   📁 Trovati {len(excel_files)} file {pattern}:")
    df_combined = pd.DataFrame()
    
    for file in excel_files:
        try:
            nome_campionato = os.path.basename(file)
            nome_campionato = os.path.splitext(nome_campionato)[0]
            nome_campionato = nome_campionato.replace(" - Schedule", "").replace(" - Stats", "")
            nome_campionato = nome_campionato.replace("_", " ").strip()
            
            print(f"      - {os.path.basename(file)} → {nome_campionato}")
            
            df_temp = pd.read_excel(file)
            df_temp.insert(0, 'Campionato', nome_campionato)
            df_temp = converti_date_europee(df_temp)
            df_combined = pd.concat([df_combined, df_temp], ignore_index=True)
            
        except Exception as e:
            print(f"      ❌ Errore nella lettura di {os.path.basename(file)}: {str(e)}")
    
    if df_combined.empty:
        print(f"   ⚠️ Nessun dato valido per {pattern}")
        return None
    
    output_path = os.path.join(output_folder, nome_output)
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        df_combined.to_excel(writer, sheet_name=f'Tutti {pattern}', index=False)
        worksheet = writer.sheets[f'Tutti {pattern}']
        for idx, col in enumerate(df_combined.columns):
            try:
                max_length = max(df_combined[col].astype(str).map(len).max() if len(df_combined) > 0 else 0, len(str(col))) + 2
                max_length = min(max_length, 50)
                col_letter = chr(65 + idx) if idx < 26 else chr(65 + (idx // 26) - 1) + chr(65 + (idx % 26))
                worksheet.column_dimensions[col_letter].width = max_length
            except:
                pass
    
    print(f"\n   ✅ Creato file unificato: {nome_output}")
    print(f"      Totale righe: {len(df_combined)}")
    print(f"      Campionati inclusi: {df_combined['Campionato'].nunique()}")
    return output_path

# ============================================
# FUNZIONE PER TROVARE LA COLONNA DEI RISULTATI
# ============================================
def trova_colonna_risultato(df):
    """Trova la colonna che contiene i risultati delle partite (es. 2-1)"""
    for col in df.columns:
        col_lower = col.lower().strip()
        if any(keyword in col_lower for keyword in ['score', 'risultato', 'gol', 'result', 'ris']):
            sample = df[col].astype(str).head(30)
            if sample.str.contains(r'\d+[-–]\d+').sum() > 0:
                return col
    for col in df.columns:
        sample = df[col].astype(str).head(30)
        if sample.str.contains(r'\d+[-–]\d+').sum() > 3:
            return col
    return None

# ============================================
# FUNZIONE PER PULIRE I NOMI DEI CAMPIONATI
# ============================================
def pulisci_campionato(nome):
    if not nome:
        return 'Sconosciuto'
    nome = str(nome)
    nome = nome.replace('.xlsx', '')
    nome = nome.replace(' - Schedule', '')
    nome = nome.replace(' - Stats', '')
    nome = nome.replace('_', ' ')
    return nome.strip()

# ============================================
# FUNZIONE PER PULIRE IL RISULTATO
# ============================================
def estrai_risultato(score_str):
    """Estrae gol casa e gol ospite da una stringa risultato"""
    if not score_str or score_str == 'nan' or pd.isna(score_str):
        return None, None
    
    score_str = str(score_str).strip()
    
    patterns = [
        r'(\d+)\s*[-–:\.]\s*(\d+)',
        r'(\d+)\s+(\d+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, score_str)
        if match:
            try:
                return int(match.group(1)), int(match.group(2))
            except:
                pass
    
    return None, None

# ============================================
# FUNZIONE PER CONVERTIRE IN FORMATO GESSSAI
# ============================================
def converti_per_gesssai(file_schedule, file_stats, output_file):
    """
    Converte i file Schedule nel formato per l'app GesssAI
    REGOLA: Se Risultato ha un valore → Giocata, altrimenti → Futura
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
        # CONVERSIONE
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
                
                # REGOLA: Se Risultato ha un valore → Giocata
                gol_casa = 0
                gol_ospite = 0
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
                    conteggio_future += 1
                
                # Aggiungi partita solo se ha squadre valide
                if casa and casa != '' and ospite and ospite != '':
                    risultati.append({
                        'Campionato': campionato,
                        'Numero Giornata (Wk)': giornata,
                        'Data': data,
                        'Ora': ora,
                        'Squadra Casa': casa,
                        'Squadra Ospite': ospite,
                        'Risultato': risultato,
                        'Gol Casa': gol_casa,
                        'Gol Ospite': gol_ospite,
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

# ============================================
# FUNZIONE PER GENERARE IL JSON
# ============================================
def genera_json_per_app(df_schedule, output_folder):
    """Genera un file JSON compatibile con l'app GesssAI-Pro v3.0"""
    try:
        print("\n📱 Generazione JSON per l'app...")
        
        if df_schedule is None or df_schedule.empty:
            print("   ❌ Nessun dato disponibile per il JSON")
            return None
        
        matches_data = []
        campionati_set = set()
        
        for _, row in df_schedule.iterrows():
            campionato = str(row.get('Campionato', 'Sconosciuto')).strip()
            if campionato == 'nan' or campionato == 'None':
                campionato = 'Sconosciuto'
            
            campionati_set.add(campionato)
            
            data_europea = str(row.get('Data', '')).strip()
            if data_europea == 'nan' or data_europea == 'None':
                data_europea = ''
            
            gol_casa = row.get('Gol Casa', 0)
            gol_ospite = row.get('Gol Ospite', 0)
            
            stato = row.get('Stato', 'Futura')
            if stato == 'nan' or stato == 'None':
                stato = 'Futura'
            
            risultato = row.get('Risultato', '')
            if risultato and risultato != '' and risultato != 'nan':
                stato = 'Giocata'
            
            id_parts = [
                campionato,
                data_europea.replace('/', '_'),
                str(row.get('Squadra Casa', '')).replace(' ', '_'),
                str(row.get('Squadra Ospite', '')).replace(' ', '_')
            ]
            match_id = "_".join(id_parts)
            
            match_data = {
                "id": match_id,
                "campionato": campionato,
                "round": str(row.get('Numero Giornata (Wk)', 'N/A')),
                "data": data_europea,
                "ora": str(row.get('Ora', 'TBD')),
                "casa": str(row.get('Squadra Casa', '')),
                "ospiti": str(row.get('Squadra Ospite', '')),
                "stato": stato,
                "golCasa": int(gol_casa) if gol_casa != 'nan' and gol_casa != '' else 0,
                "golOspite": int(gol_ospite) if gol_ospite != 'nan' and gol_ospite != '' else 0,
                "citta": "N/D"
            }
            matches_data.append(match_data)
        
        data = {
            "championships": [{"name": c, "importedAt": datetime.now().isoformat()} for c in sorted(campionati_set)],
            "matches": matches_data,
            "apiKeys": {},
            "theme": "Scuro Blu Notte",
            "customTheme": None,
            "schedineHistory": [],
            "selectedFamiglie": ["dc_under", "mg_casa_ospite", "over"],
            "exportedAt": datetime.now().isoformat()
        }
        
        output_path = os.path.join(output_folder, "GesssAI_Input.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\n   ✅ Creato file JSON per l'app: {output_path}")
        print(f"      📊 {len(matches_data)} partite")
        print(f"      🏆 {len(campionati_set)} campionati")
        
        return output_path
        
    except Exception as e:
        print(f"   ❌ Errore nella generazione JSON: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================
# CREA IL FILE excel_to_json.py PER GITHUB ACTIONS
# ============================================
def crea_file_excel_to_json():
    """Crea il file excel_to_json.py per GitHub Actions"""
    
    print("\n" + "=" * 70)
    print("📝 CREAZIONE FILE excel_to_json.py")
    print("=" * 70)
    
    script_content = '''import os
import pandas as pd
import json
import re
from datetime import datetime

# ============================================
# FUNZIONI NECESSARIE
# ============================================

def genera_json_per_app(df_schedule, output_folder):
    """Genera il JSON per l'app"""
    try:
        print("📱 Generazione JSON per l'app...")
        
        if df_schedule is None or df_schedule.empty:
            print("   ❌ Nessun dato disponibile per il JSON")
            return None
        
        matches_data = []
        campionati_set = set()
        
        for _, row in df_schedule.iterrows():
            campionato = str(row.get('Campionato', 'Sconosciuto')).strip()
            if campionato == 'nan' or campionato == 'None':
                campionato = 'Sconosciuto'
            
            campionati_set.add(campionato)
            
            data_europea = str(row.get('Data', '')).strip()
            if data_europea == 'nan' or data_europea == 'None':
                data_europea = ''
            
            gol_casa = row.get('Gol Casa', 0)
            gol_ospite = row.get('Gol Ospite', 0)
            
            stato = row.get('Stato', 'Futura')
            if stato == 'nan' or stato == 'None':
                stato = 'Futura'
            
            risultato = row.get('Risultato', '')
            if risultato and risultato != '' and risultato != 'nan':
                stato = 'Giocata'
            
            id_parts = [
                campionato,
                data_europea.replace('/', '_'),
                str(row.get('Squadra Casa', '')).replace(' ', '_'),
                str(row.get('Squadra Ospite', '')).replace(' ', '_')
            ]
            match_id = "_".join(id_parts)
            
            match_data = {
                "id": match_id,
                "campionato": campionato,
                "round": str(row.get('Numero Giornata (Wk)', 'N/A')),
                "data": data_europea,
                "ora": str(row.get('Ora', 'TBD')),
                "casa": str(row.get('Squadra Casa', '')),
                "ospiti": str(row.get('Squadra Ospite', '')),
                "stato": stato,
                "golCasa": int(gol_casa) if gol_casa != 'nan' and gol_casa != '' else 0,
                "golOspite": int(gol_ospite) if gol_ospite != 'nan' and gol_ospite != '' else 0,
                "citta": "N/D"
            }
            matches_data.append(match_data)
        
        data = {
            "championships": [{"name": c, "importedAt": datetime.now().isoformat()} for c in sorted(campionati_set)],
            "matches": matches_data,
            "apiKeys": {},
            "theme": "Scuro Blu Notte",
            "customTheme": None,
            "schedineHistory": [],
            "selectedFamiglie": ["dc_under", "mg_casa_ospite", "over"],
            "exportedAt": datetime.now().isoformat()
        }
        
        output_path = os.path.join(output_folder, "GesssAI_Input.json")
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"\\n   ✅ Creato file JSON per l'app: {output_path}")
        print(f"      📊 {len(matches_data)} partite")
        print(f"      🏆 {len(campionati_set)} campionati")
        
        return output_path
        
    except Exception as e:
        print(f"   ❌ Errore nella generazione JSON: {e}")
        import traceback
        traceback.print_exc()
        return None

def carica_json_su_github(file_path):
    """Carica il JSON su GitHub"""
    try:
        import requests
        import base64
        
        token = os.environ.get('GITHUB_TOKEN', '')
        repo = os.environ.get('GITHUB_REPO', 'Gesss26/GesssAI-Pro')
        
        if not token:
            print("   ⚠️ GITHUB_TOKEN non configurato.")
            return False
        
        print("\\n📤 Caricamento JSON su GitHub...")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        encoded = base64.b64encode(content.encode()).decode()
        
        url = f"https://api.github.com/repos/{repo}/contents/GesssAI_Input.json"
        
        data = {
            "message": f"Aggiornamento automatico dati - {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            "content": encoded,
            "branch": "main"
        }
        
        headers = {
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        response = requests.put(url, json=data, headers=headers)
        
        if response.status_code in [200, 201]:
            print(f"\\n   ✅ JSON caricato con successo su GitHub!")
            return True
        else:
            print(f"   ❌ Errore nel caricamento: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Errore durante il caricamento: {e}")
        return False

def is_github_actions():
    return os.environ.get('GITHUB_ACTIONS') == 'true'

# ============================================
# MAIN
# ============================================
def main():
    # Usa la stessa cartella del file originale
    output_folder = r"d:\\\\ai\\\\excel"
    
    input_file = os.path.join(output_folder, "GesssAI_Input.xlsx")
    
    if not os.path.exists(input_file):
        print(f"❌ File non trovato: {input_file}")
        return
    
    print(f"📖 Leggo {input_file}...")
    df = pd.read_excel(input_file)
    print(f"   ✅ Lette {len(df)} righe")
    
    print("🔄 Generazione JSON...")
    json_path = genera_json_per_app(df, output_folder)
    
    if json_path:
        print(f"✅ JSON creato: {json_path}")
        
        if is_github_actions():
            print("📤 Caricamento su GitHub...")
            carica_json_su_github(json_path)
        else:
            print("📁 JSON pronto per upload manuale")

if __name__ == "__main__":
    main()
'''
    
    # Salva il file nella cartella di output
    script_path = os.path.join(output_folder, "excel_to_json.py")
    
    with open(script_path, 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"\n✅ File excel_to_json.py creato: {script_path}")
    print(f"   📊 Dimensioni: {len(script_content)} caratteri")
    
    return script_path

# ============================================
# FASE 1: DOWNLOAD
# ============================================
print("\n" + "=" * 70)
print("📥 FASE 1: DOWNLOAD DA FBref")
print("=" * 70)

print("\n🚀 Avvio Selenium WebDriver...")

chrome_options = Options()
chrome_options.add_argument("--disable-blink-features=AutomationControlled")
chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
chrome_options.add_experimental_option('useAutomationExtension', False)

# User-Agent realistico
chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

# Disabilita cache per ottenere dati freschi
chrome_options.add_argument("--disable-cache")
chrome_options.add_argument("--disable-application-cache")
chrome_options.add_argument("--disk-cache-size=0")

# Per vedere il browser, commenta la riga seguente
# chrome_options.add_argument("--headless")

try:
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    print("✅ Browser avviato correttamente!")
except Exception as e:
    print(f"❌ Errore nell'avvio del browser: {e}")
    input("\nPremi INVIO per uscire...")
    exit()

print(f"\n📥 Download di {len(sites)} siti...")
print("-" * 60)

download_success = 0
download_errors = 0
html_files_created = []

for i, site in enumerate(sites, 1):
    print(f"\n[{i}/{len(sites)}] {site['nome']}")
    print(f"   URL: {site['url']}")
    
    try:
        # Usa la nuova funzione per scaricare con i risultati
        html = scarica_con_risultati(driver, site['url'])
        
        # Verifica la presenza di risultati nell'HTML finale
        results_pattern = r'\d+[-–:\.]\d+'
        results_found = re.findall(results_pattern, html)
        
        if results_found:
            print(f"   ✅ Pagina scaricata con {len(results_found)} risultati")
        else:
            print(f"   ⚠️ Pagina scaricata ma senza risultati visibili")
        
        # Salva l'HTML
        html_filename = f"{site['nome'].replace(' ', '_').replace('/', '_')}.html"
        html_path = os.path.join(download_folder, html_filename)
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"   ✅ HTML salvato: {html_filename}")
        html_files_created.append(html_path)
        download_success += 1
        
        if i < len(sites):
            print(f"   ⏳ Attendo 5 secondi...")
            time.sleep(5)
            
    except Exception as e:
        print(f"   ❌ ERRORE: {str(e)}")
        download_errors += 1
        continue

driver.quit()

print("\n" + "-" * 60)
print(f"📊 Download completato:")
print(f"   ✅ Successi: {download_success}")
print(f"   ❌ Errori: {download_errors}")

# ============================================
# FASE 2: CONVERSIONE
# ============================================
print("\n" + "=" * 70)
print("🔄 FASE 2: CONVERSIONE IN EXCEL")
print("=" * 70)

if not html_files_created:
    print("\n⚠️ Nessun nuovo file scaricato. Cerco file HTML esistenti...")
    html_files_created = glob.glob(os.path.join(download_folder, "*.html"))

if not html_files_created:
    print("\n❌ Nessun file HTML trovato!")
    input("\nPremi INVIO per uscire...")
    exit()

print(f"\n📄 Trovati {len(html_files_created)} file HTML da convertire")
print("-" * 60)

converted = 0
errors = 0

for i, html_file in enumerate(html_files_created, 1):
    nome_file = os.path.basename(html_file)
    print(f"\n[{i}/{len(html_files_created)}] {nome_file}")
    
    df, result = converti_html_in_excel(html_file, output_folder)
    
    if df is not None:
        print(f"   ✅ Excel salvato: {os.path.splitext(nome_file)[0]}.xlsx ({result})")
        converted += 1
    else:
        print(f"   ❌ Errore: {result}")
        errors += 1

# ============================================
# FASE 3: UNISCI
# ============================================
print("\n" + "=" * 70)
print("📊 FASE 3: UNISCI FILE EXCEL")
print("=" * 70)

print("\n📅 Unione file Schedule...")
unisci_file_excel(output_folder, "Schedule", "Tutti_Schedule.xlsx")

print("\n📊 Unione file Stats...")
unisci_file_excel(output_folder, "Stats", "Tutti_Stats.xlsx")

# ============================================
# FASE 4: CONVERSIONE PER APP
# ============================================
print("\n" + "=" * 70)
print("📱 FASE 4: CONVERSIONE PER APP GESSSAI")
print("=" * 70)

file_schedule = os.path.join(output_folder, "Tutti_Schedule.xlsx")
file_stats = os.path.join(output_folder, "Tutti_Stats.xlsx")
output_file = os.path.join(output_folder, "GesssAI_Input.xlsx")

df_finale = None
if os.path.exists(file_schedule):
    df_finale = converti_per_gesssai(file_schedule, file_stats, output_file)
    
    # Genera il JSON
    if df_finale is not None and not df_finale.empty:
        print("\n📱 Generazione JSON...")
        genera_json_per_app(df_finale, output_folder)
else:
    print("\n⚠️ File Tutti_Schedule.xlsx non trovato.")

# ============================================
# FASE 5: CREA excel_to_json.py
# ============================================
if not os.environ.get('GITHUB_ACTIONS'):
    print("\n" + "=" * 70)
    print("📝 FASE 5: CREAZIONE FILE PER GITHUB ACTIONS")
    print("=" * 70)
    
    crea_file_excel_to_json()
    
    print("\n" + "=" * 70)
    print("📋 ISTRUZIONI PER GITHUB ACTIONS")
    print("=" * 70)
    print("\n1️⃣ Carica su GitHub il file:")
    print(f"   📁 {os.path.join(output_folder, 'GesssAI_Input.xlsx')}")
    print("\n2️⃣ Carica anche il file excel_to_json.py nella repository")
    print("\n3️⃣ Crea un workflow .github/workflows/update_json.yml")
    print("\n4️⃣ Il JSON verrà generato automaticamente su GitHub Actions!")

# ============================================
# RIEPILOGO FINALE
# ============================================
print("\n" + "=" * 70)
print("🏁 PROCESSO COMPLETATO!")
print("=" * 70)

print(f"\n📊 Riepilogo generale:")
print(f"   📥 Download: {download_success} successi, {download_errors} errori")
print(f"   🔄 Conversione: {converted} successi, {errors} errori")
print(f"\n📂 File Excel salvati in: {output_folder}")

excel_files = glob.glob(os.path.join(output_folder, "*.xlsx"))
if excel_files:
    print(f"\n📁 File creati ({len(excel_files)}):")
    for file in sorted(excel_files):
        dimensione = os.path.getsize(file) / 1024
        nome = os.path.basename(file)
        if nome.startswith("Tutti_"):
            print(f"   ⭐ {nome} ({dimensione:.1f} KB) - UNIFICATO")
        elif nome.startswith("GesssAI"):
            print(f"   🚀 {nome} ({dimensione:.1f} KB) - PRONTO PER APP")
        else:
            print(f"   - {nome} ({dimensione:.1f} KB)")

# Controlla se il JSON è stato creato
json_file = os.path.join(output_folder, "GesssAI_Input.json")
if os.path.exists(json_file):
    dimensione = os.path.getsize(json_file) / 1024
    print(f"   📱 GesssAI_Input.json ({dimensione:.1f} KB) - PRONTO PER IMPORT")

# Verifica la presenza di risultati nei file Excel
print("\n🔍 Verifica presenza risultati nei file Excel...")
schedule_file = os.path.join(output_folder, "Tutti_Schedule.xlsx")
if os.path.exists(schedule_file):
    try:
        df_check = pd.read_excel(schedule_file)
        results_found = 0
        for col in df_check.columns:
            col_str = df_check[col].astype(str)
            if col_str.str.contains(r'\d+[-–:\.]\d+').sum() > 0:
                results_found += col_str.str.contains(r'\d+[-–:\.]\d+').sum()
        print(f"   📊 Trovati {results_found} risultati nel file Schedule")
        if results_found == 0:
            print("   ⚠️ ATTENZIONE: Nessun risultato trovato! I dati potrebbero non essere stati caricati correttamente.")
    except:
        pass

print("\n" + "=" * 70)
print("🔴 Premere un tasto per uscire...")
input()
print("\n👋 Arrivederci!")