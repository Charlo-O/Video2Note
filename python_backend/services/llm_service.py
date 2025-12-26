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
    
    return f"""# 角色
你是一位极其注重细节的视频拉片员和技术文档工程师。你的目标是将视频字幕转化为一份**"逐帧级"的图文实录**。

# 核心要求（关键痛点）
用户反馈之前的转换丢失了太多视觉细节。请注意：视频中往往一两句话画面就会变化。你的任务是捕捉每一个视觉变化点，绝对不要将多个不同的画面动作合并成一个长段落。截图占位符的频率要高，宁多勿少。

# 任务
根据提供的字幕文本，生成一篇流式图文教程。

# 处理规则

1. **高频插图策略**：
   - **动作即截图**：只要讲者执行了一个操作（点击、拖拽、连线），必须插入截图
   - **变化即截图**：只要画面发生了改变（参数变化、生成结果对比、局部特写），必须插入截图
   - **一事一图**：如果一句话里包含两个动作（"点击这里，然后选择那个"），请拆分为两行，并分别插入两个截图占位符

2. **微步骤结构**：
   - 不要写大段落，使用短句或微段落（2-3行以内）
   - 每个操作步骤独立成段

3. **内容清洗与修正**：
   - **术语修正**：将字幕中的错别字（如"写村"、"千万edit"）修正为专业术语（如"显存"、"Qwen-Edit"）
   - **去口语**：保留技术细节，去掉"哎呦喂"、"那么"、"那个"等废话
   - 完整保留原始视频中的所有关键信息、技术参数和核心观点

4. **截图时间点格式**：
   - 在正文中使用 `[HH:MM:SS]` 格式插入截图占位符
   - 时间戳必须来自原始字幕，保证顺序正确
   - 频率要高：每1-3句话至少一个截图点

# 输出风格
{style_desc}

# 输出格式
严格按照以下 JSON 格式输出，不要包含任何其他内容：
[
  {{
    "timestamp": "00:01:23",
    "title": "章节标题（简洁有力，5-15字）",
    "content": "章节正文内容（Markdown格式）。正文应为纯粹的技术文章，不要出现'关键帧'、'画面描述'、'截图'等元信息词汇。在需要配图的位置仅插入时间戳标记：[HH:MM:SS]，系统会自动替换为对应的视频截图。"
  }}
]

# 注意事项
- 严禁包含 Markdown 代码块标记（如 ```json），只返回纯 JSON 数组
- 时间戳格式为 HH:MM:SS，必须来自原始字幕
- 章节按时间顺序排列
- 确保 JSON 格式正确，可以被直接解析
- content 字段使用 Markdown 格式，可包含标题、列表、加粗等
- **重要**：最终文章应该是一篇流畅的技术教程，不要出现"截图"、"画面"、"关键帧"等与文章主题无关的描述性词汇，时间戳标记 [HH:MM:SS] 会被系统自动处理为图片"""


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
