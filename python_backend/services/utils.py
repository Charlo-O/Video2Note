"""
工具函数模块
"""

import re
from typing import Tuple


def timestamp_to_seconds(timestamp: str) -> float:
    """
    将时间戳字符串转换为秒数
    支持格式: "HH:MM:SS", "MM:SS", "SS"
    
    Args:
        timestamp: 时间戳字符串
        
    Returns:
        秒数 (float)
    """
    parts = timestamp.strip().split(":")
    parts = [float(p) for p in parts]
    
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    elif len(parts) == 2:
        return parts[0] * 60 + parts[1]
    elif len(parts) == 1:
        return parts[0]
    else:
        raise ValueError(f"Invalid timestamp format: {timestamp}")


def seconds_to_timestamp(seconds: float) -> str:
    """
    将秒数转换为时间戳字符串
    
    Args:
        seconds: 秒数
        
    Returns:
        格式化的时间戳 "HH:MM:SS"
    """
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def parse_srt(srt_content: str) -> str:
    """
    解析 SRT 字幕文件，提取纯文本内容
    
    Args:
        srt_content: SRT 文件内容
        
    Returns:
        提取的纯文本字幕
    """
    # 移除序号行和时间戳行，只保留文本
    lines = srt_content.strip().split('\n')
    text_lines = []
    
    for line in lines:
        line = line.strip()
        # 跳过空行
        if not line:
            continue
        # 跳过纯数字行（序号）
        if line.isdigit():
            continue
        # 跳过时间戳行
        if '-->' in line:
            continue
        # 保留文本行
        text_lines.append(line)
    
    return ' '.join(text_lines)


def parse_srt_with_timestamps(srt_content: str) -> list[dict]:
    """
    解析 SRT 字幕文件，保留时间戳信息
    
    Args:
        srt_content: SRT 文件内容
        
    Returns:
        包含时间戳和文本的字典列表
    """
    pattern = r'(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n(.*?)(?=\n\n|\Z)'
    matches = re.findall(pattern, srt_content, re.DOTALL)
    
    subtitles = []
    for match in matches:
        index, start_time, end_time, text = match
        # 转换时间格式 (移除毫秒部分的逗号)
        start_time = start_time.replace(',', '.')
        end_time = end_time.replace(',', '.')
        
        subtitles.append({
            'index': int(index),
            'start': start_time[:8],  # HH:MM:SS
            'end': end_time[:8],
            'start_seconds': timestamp_to_seconds(start_time[:8]),
            'end_seconds': timestamp_to_seconds(end_time[:8]),
            'text': text.strip().replace('\n', ' ')
        })
    
    return subtitles
