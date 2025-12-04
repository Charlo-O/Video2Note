"""
视频服务 - 使用 OpenCV 提取关键帧
"""

import os
import uuid
import tempfile
from pathlib import Path
import cv2
import numpy as np


def is_blurry(image: np.ndarray, threshold: float = 100.0) -> bool:
    """
    检测图片是否模糊（使用拉普拉斯方差）
    
    Args:
        image: OpenCV 图像数组
        threshold: 模糊阈值，低于此值认为模糊
        
    Returns:
        True 表示图片模糊
    """
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    return variance < threshold


def extract_frame(
    video_path: str,
    timestamp_seconds: float,
    output_dir: str,
    max_retries: int = 3,
    retry_offset: float = 0.5,
    blur_threshold: float = 100.0
) -> str:
    """
    从视频中提取指定时间戳的帧
    
    如果帧模糊，会自动向后偏移重试
    
    Args:
        video_path: 视频文件路径
        timestamp_seconds: 时间戳（秒）
        output_dir: 输出目录
        max_retries: 最大重试次数
        retry_offset: 每次重试的时间偏移（秒）
        blur_threshold: 模糊检测阈值
        
    Returns:
        保存的图片路径
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    # 确保时间戳在视频范围内
    current_time = min(timestamp_seconds, duration - 0.1)
    current_time = max(0, current_time)
    
    best_frame = None
    best_variance = 0
    
    for attempt in range(max_retries):
        # 计算帧位置
        frame_pos = int(current_time * fps)
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_pos)
        
        ret, frame = cap.read()
        if not ret:
            current_time += retry_offset
            continue
        
        # 检查模糊度
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        # 保存最清晰的帧
        if variance > best_variance:
            best_variance = variance
            best_frame = frame.copy()
        
        # 如果不模糊，直接使用
        if variance >= blur_threshold:
            break
        
        # 向后偏移重试
        current_time += retry_offset
    
    cap.release()
    
    if best_frame is None:
        raise ValueError(f"无法从视频中提取帧: timestamp={timestamp_seconds}")
    
    # 保存图片
    os.makedirs(output_dir, exist_ok=True)
    filename = f"frame_{uuid.uuid4().hex[:8]}.jpg"
    output_path = os.path.join(output_dir, filename)
    
    # 使用较高质量保存
    cv2.imwrite(output_path, best_frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
    
    return output_path


def extract_frames_batch(
    video_path: str,
    timestamps: list[float],
    output_dir: str = None
) -> list[str]:
    """
    批量提取多个时间戳的帧
    
    Args:
        video_path: 视频文件路径
        timestamps: 时间戳列表（秒）
        output_dir: 输出目录，默认使用临时目录
        
    Returns:
        图片路径列表
    """
    if output_dir is None:
        output_dir = os.path.join(tempfile.gettempdir(), "video2note_frames")
    
    paths = []
    for ts in timestamps:
        try:
            path = extract_frame(video_path, ts, output_dir)
            paths.append(path)
        except Exception as e:
            print(f"Warning: Failed to extract frame at {ts}s: {e}")
            paths.append("")  # 占位，保持索引对应
    
    return paths


def get_video_info(video_path: str) -> dict:
    """
    获取视频基本信息
    
    Args:
        video_path: 视频文件路径
        
    Returns:
        包含视频信息的字典
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"无法打开视频文件: {video_path}")
    
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0
    
    cap.release()
    
    return {
        "fps": fps,
        "width": width,
        "height": height,
        "total_frames": total_frames,
        "duration": duration,
        "duration_formatted": f"{int(duration // 3600):02d}:{int((duration % 3600) // 60):02d}:{int(duration % 60):02d}"
    }
