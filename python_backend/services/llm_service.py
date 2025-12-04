"""
LLM 服务 - 使用 OpenAI API 分析字幕内容
"""

import json
import re
from openai import OpenAI
from typing import Optional


def get_system_prompt(style: str = "professional") -> str:
    """获取 LLM System Prompt"""
    style_descriptions = {
        "professional": "专业严谨的技术文档风格，语言精炼准确",
        "blog": "轻松易读的博客风格，适当使用比喻和例子",
        "tutorial": "循序渐进的教程风格，详细解释每个概念"
    }
    
    style_desc = style_descriptions.get(style, style_descriptions["professional"])
    
    return f"""# Role
你是一位专业的视频内容编辑和技术文档撰写专家。你的任务是分析提供的视频字幕内容，提取出关键的时间点，以便根据这些时间点在视频中截取图片，用于制作图文教程。

# Goal
找出视频中具有**视觉信息量**的关键时刻（例如：展示具体操作步骤、菜单选项、代码变更、最终效果展示、关键PPT页面）。

# Constraints & Rules
1. **忽略废话**：跳过开场白、自我介绍、过度的口语停顿或没有实质性画面变化的片段。
2. **动作导向**：重点关注包含"点击"、"选择"、"输入"、"打开"、"看到"等动作动词的时间点。
3. **视觉描述**：为提取的时间点提供简短的画面描述，说明此时屏幕上应该显示什么（而不是讲师在说什么）。
4. **间隔控制**：如果两个关键点间隔小于 5 秒，仅保留更有代表性的那一个，避免截图过于密集。

# Output Style
{style_desc}

# Output Format
严格按照以下 JSON 格式输出，不要包含任何其他内容：
[
  {{
    "timestamp": "00:01:23",
    "title": "章节标题（简洁有力，5-15字）",
    "content": "详细笔记内容（100-300字的 Markdown 格式，描述此时画面应该展示的内容和操作步骤）"
  }}
]

# Notes
- 严禁包含 Markdown 代码块标记（如 ```json），只返回纯 JSON 数组
- 时间戳必须是字幕中实际存在的时间点，格式为 HH:MM:SS
- 章节按时间顺序排列
- 确保 JSON 格式正确，可以被直接解析
- 重点关注有视觉变化的时刻，让截图更精准"""


def analyze_subtitles(
    subtitle_text: str,
    api_key: str,
    style: str = "professional",
    base_url: Optional[str] = None,
    model: str = "gpt-4o-mini"
) -> list[dict]:
    """
    使用 LLM 分析字幕内容，提取结构化笔记
    
    Args:
        subtitle_text: 字幕文本内容
        api_key: OpenAI API Key
        style: 输出风格
        base_url: 自定义 API 地址（可选）
        model: 模型名称
        
    Returns:
        结构化的笔记列表
    """
    # 初始化 OpenAI 客户端
    client_kwargs = {
        "api_key": api_key,
        "timeout": 180.0  # 3分钟超时
    }
    if base_url:
        client_kwargs["base_url"] = base_url
    
    client = OpenAI(**client_kwargs)
    
    # 调用 LLM
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": get_system_prompt(style)},
            {"role": "user", "content": f"请分析以下视频字幕内容：\n\n{subtitle_text}"}
        ],
        temperature=0.3,  # 较低温度保证输出稳定
        max_tokens=8000  # 增加输出 token 限制
    )
    
    # 解析响应
    content = response.choices[0].message.content.strip()
    
    # 尝试清理可能的 Markdown 代码块标记
    content = re.sub(r'^```json\s*', '', content)
    content = re.sub(r'^```\s*', '', content)
    content = re.sub(r'\s*```$', '', content)
    
    try:
        notes = json.loads(content)
        return notes
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM 返回的内容无法解析为 JSON: {e}\n原始内容: {content}")


def timestamp_to_seconds(timestamp: str) -> float:
    """将时间戳转换为秒数"""
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
