import os
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
        
        print(f"\n   ✅ Creato file JSON per l'app: {output_path}")
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
        
        print("\n📤 Caricamento JSON su GitHub...")
        
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
            print(f"\n   ✅ JSON caricato con successo su GitHub!")
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
    # Usa la cartella corrente o quella specificata
    output_folder = os.getcwd()
    
    # Cerca il file Excel nella cartella corrente
    excel_files = [f for f in os.listdir(output_folder) if f.endswith('.xlsx') and 'GesssAI_Input' in f]
    
    if not excel_files:
        print(f"❌ File GesssAI_Input.xlsx non trovato in {output_folder}")
        print(f"   Files trovati: {[f for f in os.listdir(output_folder) if f.endswith('.xlsx')]}")
        return
    
    input_file = os.path.join(output_folder, excel_files[0])
    
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