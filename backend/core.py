import yt_dlp
import os
import uuid

# Temp download directory
DOWNLOAD_DIR = "downloads"
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

def get_info(url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
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
    # Generate unique filename
    filename = f"{uuid.uuid4()}"
    
    ydl_opts = {
        'format': format_id if format_id != "best" else "bestvideo+bestaudio/best",
        'outtmpl': os.path.join(DOWNLOAD_DIR, f'{filename}.%(ext)s'),
        'quiet': True,
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
