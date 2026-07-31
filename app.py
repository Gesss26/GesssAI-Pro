from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configurazione
UPLOAD_FOLDER = 'downloads'
PLAYLIST_FILE = 'playlist.json'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============ GESTIONE PLAYLIST ============
def load_playlists():
    """Carica le playlist dal file JSON"""
    if os.path.exists(PLAYLIST_FILE):
        with open(PLAYLIST_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_playlists(playlists):
    """Salva le playlist nel file JSON"""
    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(playlists, f, ensure_ascii=False, indent=2)

# ============ ROTTE PRINCIPALI ============
@app.route('/')
def index():
    """Pagina principale"""
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    """Cerca su YouTube"""
    data = request.get_json()
    query = data.get('query', '')
    
    if not query:
        return jsonify({'error': 'Inserisci una parola chiave'}), 400
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'force_generic_extractor': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch10:{query}", download=False)
            results = []
            for entry in info.get('entries', []):
                results.append({
                    'id': entry.get('id'),
                    'title': entry.get('title', 'Senza titolo'),
                    'channel': entry.get('uploader', 'Sconosciuto'),
                    'duration': entry.get('duration', 0),
                    'thumbnail': entry.get('thumbnail', ''),
                    'url': f"https://www.youtube.com/watch?v={entry.get('id')}"
                })
            return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['POST'])
def download():
    """Scarica l'audio da YouTube"""
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL non valido'}), 400
    
 ydl_opts = {
    'format': 'bestaudio/best',
    'postprocessors': [{
        'key': 'FFmpegExtractAudio',
        'preferredcodec': 'mp3',
        'preferredquality': '192',
    }],
    'outtmpl': '/tmp/%(title)s.%(ext)s',  # SALVA IN /tmp/ su Render
    'quiet': True,
    'no_warnings': True,
    # NON USARE 'ffmpeg_location' su Render - non serve
}

@app.route('/downloads/<filename>')
def serve_download(filename):
    """Serve i file MP3 scaricati su Render"""
    return send_from_directory('/tmp', filename)
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = f"{info.get('title', 'audio')}.mp3"
            # Pulisce il nome file da caratteri non validi
            filename = "".join(c for c in filename if c.isalnum() or c in " ._-()[]")
            # Rinominare il file scaricato
            old_path = os.path.join(UPLOAD_FOLDER, f"{info.get('title', 'audio')}.mp3")
            new_path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(old_path) and old_path != new_path:
                os.rename(old_path, new_path)
            
            return jsonify({
                'success': True,
                'filename': filename,
                'title': info.get('title', 'Senza titolo')
            })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/library')
def get_library():
    """Restituisce la lista dei file MP3 scaricati"""
    try:
        files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.mp3')]
        # Ordina per data di modifica (più recenti prima)
        files.sort(key=lambda x: os.path.getmtime(os.path.join(UPLOAD_FOLDER, x)), reverse=True)
        return jsonify(files)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def serve_audio(filename):
    """Serve il file audio per la riproduzione"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/playlists', methods=['GET', 'POST', 'DELETE'])
def manage_playlists():
    """Gestisce le playlist"""
    if request.method == 'GET':
        return jsonify(load_playlists())
    
    elif request.method == 'POST':
        data = request.get_json()
        action = data.get('action')
        playlist_name = data.get('playlist_name')
        song = data.get('song')
        
        playlists = load_playlists()
        
        if action == 'create':
            if playlist_name and playlist_name not in playlists:
                playlists[playlist_name] = []
                save_playlists(playlists)
                return jsonify({'success': True, 'message': f'Playlist "{playlist_name}" creata'})
            return jsonify({'error': 'Nome playlist non valido o già esistente'}), 400
            
        elif action == 'add':
            if playlist_name in playlists and song:
                if song not in playlists[playlist_name]:
                    playlists[playlist_name].append(song)
                    save_playlists(playlists)
                    return jsonify({'success': True, 'message': f'Aggiunto a "{playlist_name}"'})
            return jsonify({'error': 'Impossibile aggiungere'}), 400
            
        elif action == 'remove':
            if playlist_name in playlists and song and song in playlists[playlist_name]:
                playlists[playlist_name].remove(song)
                save_playlists(playlists)
                return jsonify({'success': True, 'message': f'Rimosso da "{playlist_name}"'})
            return jsonify({'error': 'Impossibile rimuovere'}), 400
            
        elif action == 'delete':
            if playlist_name in playlists:
                del playlists[playlist_name]
                save_playlists(playlists)
                return jsonify({'success': True, 'message': f'Playlist "{playlist_name}" eliminata'})
            return jsonify({'error': 'Playlist non trovata'}), 400
    
    elif request.method == 'DELETE':
        playlists = {}
        save_playlists(playlists)
        return jsonify({'success': True, 'message': 'Tutte le playlist cancellate'})

@app.route('/delete_song', methods=['POST'])
def delete_song():
    """Elimina un file MP3 dalla libreria"""
    data = request.get_json()
    filename = data.get('filename')
    
    if not filename:
        return jsonify({'error': 'Nome file non valido'}), 400
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'success': True, 'message': f'"{filename}" eliminato'})
    return jsonify({'error': 'File non trovato'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)