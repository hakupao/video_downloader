from fastapi import FastAPI, HTTPException, Depends, Header, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import shutil
from typing import Optional
from .core import get_info, download_video

app = FastAPI(title="Video Downloader API")

# Simple Auth Check
AUTH_CODE = os.getenv("AUTH_CODE", "123456")

class VideoInfoRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format_id: str = "best"

def verify_auth(x_access_code: Optional[str] = Header(None)):
    if AUTH_CODE and x_access_code != AUTH_CODE:
        raise HTTPException(status_code=401, detail="Invalid Access Code")
    return True

def cleanup_file(path: str):
    if os.path.exists(path):
        os.remove(path)

@app.get("/")
def read_root():
    return {"message": "Video Downloader API is running"}

@app.post("/api/auth")
def check_auth(request: dict):
    # Just to verify code from frontend
    code = request.get("code")
    if code != AUTH_CODE:
        raise HTTPException(status_code=401, detail="Invalid Access Code")
    return {"status": "ok"}

@app.post("/api/info")
def get_video_info_endpoint(request: VideoInfoRequest, auth: bool = Depends(verify_auth)):
    try:
        data = get_info(request.url)
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/download")
def download_video_endpoint(request: DownloadRequest, background_tasks: BackgroundTasks, auth: bool = Depends(verify_auth)):
    try:
        file_path = download_video(request.url, request.format_id)
        filename = os.path.basename(file_path)
        
        # Schedule cleanup after response is sent
        background_tasks.add_task(cleanup_file, file_path)
        
        return FileResponse(
            path=file_path, 
            filename=filename, 
            media_type='application/octet-stream'
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
