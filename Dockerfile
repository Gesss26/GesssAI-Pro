# Usa l'immagine ufficiale Python
FROM python:3.11-slim

# Imposta la directory di lavoro
WORKDIR /app

# Aggiorna e installa FFmpeg e altre dipendenze di sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copia il file requirements.txt e installa le dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia tutto il resto del progetto
COPY . .

# Espone la porta su cui girerà l'app
EXPOSE 10000

CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]