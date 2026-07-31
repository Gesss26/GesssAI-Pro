from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import yt_dlp
import os
import json
import re

app = Flask(__name__)
CORS(app)

# ============ CONFIGURAZIONE PER AMBIENTE ============
# Su Render: salva in /tmp
# In locale: salva in downloads
IS_RENDER = os.environ.get('RENDER', False)
UPLOAD_FOLDER = '/tmp' if IS_RENDER else 'downloads'
PLAYLIST_FILE = 'playlist.json' if not IS_RENDER else '/tmp/playlist.json'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ============ GESTIONE PLAYLIST ============
def load_playlists():
    if os.path.exists(PLAYLIST_FILE):
        with open(PLAYLIST_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

def save_playlists(playlists):
    with open(PLAYLIST_FILE, 'w', encoding='utf-8') as f:
        json.dump(playlists, f, ensure_ascii=False, indent=2)

def sanitize_filename(filename):
    """Rimuove caratteri non validi per i nomi dei file"""
    return re.sub(r'[<>:"/\\|?*]', '', filename).strip()

# ============ ROTTE PRINCIPALI ============
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search():
    data = request.get_json()
    query = data.get('query', '')
    
    if not query:
        return jsonify({'error': 'Inserisci una parola chiave'}), 400
    
    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
        'no_warnings': True,
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
    
    # Opzioni per yt-dlp
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': os.path.join(UPLOAD_FOLDER, '%(title)s.%(ext)s'),
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
    }
    
    # Su Render, aggiungi il cookie se presente
    if IS_RENDER and os.path.exists('/etc/secrets/youtube_cookies.txt'):
        ydl_opts['cookiefile'] = '/etc/secrets/youtube_cookies.txt'
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            # Genera il nome del file
            raw_title = info.get('title', 'audio')
            clean_title = sanitize_filename(raw_title)
            filename = f"{clean_title}.mp3"
            
            # Verifica che il file esista
            expected_path = os.path.join(UPLOAD_FOLDER, filename)
            if not os.path.exists(expected_path):
                # Cerca un file che corrisponda
                for f in os.listdir(UPLOAD_FOLDER):
                    if f.endswith('.mp3') and clean_title in f:
                        filename = f
                        break
            
            return jsonify({
                'success': True,
                'filename': filename,
                'title': raw_title
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/library')
def get_library():
    try:
        files = [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith('.mp3')]
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
        save_playlists({})
        return jsonify({'success': True, 'message': 'Tutte le playlist cancellate'})

@app.route('/delete_song', methods=['POST'])
def delete_song():
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
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)