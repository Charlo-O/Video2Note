"""
Video2Note - FastAPI Backend
提供视频分析、LLM 处理、截图提取等核心功能
"""

import os
import uuid
import tempfile
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

from services.llm_service import analyze_subtitles, timestamp_to_seconds
from services.video_service import extract_frame, get_video_info

app = FastAPI(
    title="Video2Note API",
    description="视频笔记生成后端服务",
    version="1.0.0"
)

# 配置 CORS，允许 Electron 前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ 请求/响应模型 ============

class AnalyzeRequest(BaseModel):
    video_path: str
    subtitle_text: str
    api_key: str
    style: str = "professional"
    base_url: Optional[str] = None
    model: str = "gpt-4o-mini"


class NoteNode(BaseModel):
    id: str
    timestamp: str
    seconds: float
    title: str
    content: str
    imagePath: str
    isEdited: bool = False


class AnalyzeResponse(BaseModel):
    success: bool
    data: list[NoteNode]
    error: Optional[str] = None


# ============ API 接口 ============

@app.get("/health")
async def health_check():
    """健康检查接口"""
    return {
        "status": "ok",
        "message": "Video2Note Python Backend is running",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """根路径"""
    return {"message": "Welcome to Video2Note API"}


@app.post("/analyze_video", response_model=AnalyzeResponse)
async def analyze_video(request: AnalyzeRequest):
    """
    分析视频和字幕，生成结构化笔记
    
    1. 使用 LLM 分析字幕内容，提取章节结构
    2. 使用 OpenCV 提取对应时间戳的关键帧
    3. 返回完整的笔记数据
    """
    try:
        # 验证视频文件存在
        if not os.path.exists(request.video_path):
            raise HTTPException(status_code=400, detail=f"视频文件不存在: {request.video_path}")
        
        # 1. 使用 LLM 分析字幕
        llm_results = analyze_subtitles(
            subtitle_text=request.subtitle_text,
            api_key=request.api_key,
            style=request.style,
            base_url=request.base_url,
            model=request.model
        )
        
        # 2. 创建输出目录
        output_dir = os.path.join(tempfile.gettempdir(), "video2note_frames", uuid.uuid4().hex[:8])
        os.makedirs(output_dir, exist_ok=True)
        
        # 3. 提取关键帧并构建笔记节点
        notes = []
        for item in llm_results:
            timestamp = item.get("timestamp", "00:00:00")
            seconds = timestamp_to_seconds(timestamp)
            
            # 提取帧
            try:
                image_path = extract_frame(
                    video_path=request.video_path,
                    timestamp_seconds=seconds,
                    output_dir=output_dir
                )
            except Exception as e:
                print(f"Warning: Failed to extract frame at {timestamp}: {e}")
                image_path = ""
            
            note = NoteNode(
                id=uuid.uuid4().hex,
                timestamp=timestamp,
                seconds=seconds,
                title=item.get("title", ""),
                content=item.get("content", ""),
                imagePath=image_path,
                isEdited=False
            )
            notes.append(note)
        
        return AnalyzeResponse(success=True, data=notes)
        
    except HTTPException:
        raise
    except Exception as e:
        return AnalyzeResponse(success=False, data=[], error=str(e))


@app.get("/video_info")
async def video_info(path: str):
    """获取视频信息"""
    try:
        if not os.path.exists(path):
            raise HTTPException(status_code=400, detail=f"视频文件不存在: {path}")
        
        info = get_video_info(path)
        return {"success": True, "data": info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
