import yt_dlp
import os
import uuid

# Temp download directory
DOWNLOAD_DIR = "downloads"
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

import re

def get_info(url: str):
    # Extract URL if text is provided
    url_match = re.search(r'https?://[^\s]+', url)
    if url_match:
        url = url_match.group(0)

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        # Simulate a real browser to avoid "Fresh cookies" errors
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=False)
            return {
                "title": info.get('title'),
                "thumbnail": info.get('thumbnail'),
                "duration": info.get('duration'),
                "formats": _parse_formats(info),
                "webpage_url": info.get('webpage_url'),
                "extractor": info.get('extractor')
            }
        except Exception as e:
            # If that fails, it might truly need cookies, but let's hope headers fix it.
            raise Exception(f"Failed to fetch info: {str(e)}")

def _parse_formats(info):
    formats = []
    # Simplified format parsing
    # We want to offer: Audio Only, Best Video
    
    # Check for direct video formats or merged formats
    # For now, just return a simple list or 'best'
    
    # yt-dlp formats are complex. Let's simplify for the UI.
    # We can filter for unique resolutions.
    
    seen_res = set()
    raw_formats = info.get('formats', [])
    
    # Add 'audio only' option
    formats.append({"format_id": "bestaudio", "label": "Audio Only (MP3/M4A)", "ext": "mp3"})
    
    # Add 'best' option (default)
    formats.append({"format_id": "best", "label": "Best Quality (Auto)", "ext": "mp4"})

    return formats

def download_video(url: str, format_id: str = "best"):
    # Extract URL if text is provided
    url_match = re.search(r'https?://[^\s]+', url)
    if url_match:
        url = url_match.group(0)

    # Generate unique filename
    filename = f"{uuid.uuid4()}"
    
    ydl_opts = {
        'format': format_id if format_id != "best" else "bestvideo+bestaudio/best",
        'outtmpl': os.path.join(DOWNLOAD_DIR, f'{filename}.%(ext)s'),
        'quiet': True,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
    }
    
    if format_id == "bestaudio":
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(url, download=True)
            # Find the downloaded file
            # yt-dlp might change extension
            
            # This is a bit tricky since we don't know the exact extension beforehand easily
            # But we can look for files starting with the uuid in the dir
            
            for file in os.listdir(DOWNLOAD_DIR):
                if file.startswith(filename):
                    return os.path.join(DOWNLOAD_DIR, file)
            
            raise Exception("File not found after download")
            
        except Exception as e:
            raise Exception(f"Download failed: {str(e)}")
