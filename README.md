# Video2Note

> 🎬 将视频教程自动转换为精美的图文笔记

Video2Note 是一款基于 AI 的桌面应用，能够分析视频字幕内容，智能提取关键时间点，自动截取视频画面，生成结构化的图文教程文档。

![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)

## ✨ 功能特性

- **🤖 AI 智能分析** - 使用 LLM 分析字幕，提取有视觉信息量的关键时刻
- **📸 自动截图** - 基于 OpenCV 在关键时间点自动提取视频帧
- **🔍 模糊检测** - 智能检测并跳过模糊画面，确保截图质量
- **✏️ 可视化编辑** - 双栏编辑器，左侧视频预览，右侧笔记编辑
- **🎯 视频联动** - 点击时间戳跳转到对应视频位置
- **📄 多格式导出** - 支持 Markdown 和 PDF 导出
- **🎨 多种风格** - 专业文档、博客、教程等多种输出风格

## 🖼️ 界面预览

### Setup 页面
- 拖拽或点击上传视频和字幕文件
- 配置 API Key、模型、输出风格

### Editor 页面
- 左侧视频播放器，支持点击时间戳跳转
- 右侧笔记卡片列表，可编辑标题和内容
- 实时高亮当前播放位置对应的笔记

### Export 页面
- Markdown 源码预览
- 渲染效果预览
- 一键复制、下载、打印

## 🛠️ 技术栈

### 前端
- **Electron** - 跨平台桌面应用框架
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **React Router** - 路由管理
- **Lucide React** - 图标库

### 后端
- **Python 3.10+** - 后端语言
- **FastAPI** - Web 框架
- **OpenAI SDK** - LLM 调用（兼容任何 OpenAI 格式 API）
- **OpenCV** - 视频处理和帧提取
- **Uvicorn** - ASGI 服务器

## 📦 安装

### 环境要求

- Node.js 18+
- Python 3.10+
- npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/Charlo-O/Video2Note.git
cd video2note
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 配置 Python 环境

```bash
cd python_backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

## 🚀 运行

### 开发模式

```bash
npm run dev
```

这会同时启动：
- Electron + React 前端 (http://localhost:5173)
- Python FastAPI 后端 (http://127.0.0.1:8000)

### 单独启动后端（调试用）

```bash
cd python_backend
python -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

## 📁 项目结构

```
video2note/
├── src/
│   ├── main/                    # Electron 主进程
│   │   └── index.ts             # 主进程入口，管理 Python 后端生命周期
│   ├── preload/                 # 预加载脚本
│   │   └── index.ts             # IPC 通信桥接
│   └── renderer/                # React 渲染进程
│       └── src/
│           ├── api/             # API 客户端
│           │   └── client.ts    # Axios 封装
│           ├── components/      # 通用组件
│           │   └── SettingsModal.tsx
│           ├── pages/           # 页面组件
│           │   ├── SetupPage.tsx    # 上传配置页
│           │   ├── EditorPage.tsx   # 编辑器页
│           │   └── ExportPage.tsx   # 导出页
│           ├── stores/          # Zustand 状态管理
│           │   ├── useSettingsStore.ts
│           │   └── useProjectStore.ts
│           ├── types/           # TypeScript 类型定义
│           └── App.tsx          # 路由配置
├── python_backend/
│   ├── app.py                   # FastAPI 入口
│   ├── services/
│   │   ├── llm_service.py       # LLM 分析服务
│   │   ├── video_service.py     # 视频处理服务
│   │   └── utils.py             # 工具函数
│   ├── requirements.txt         # Python 依赖
│   └── venv/                    # Python 虚拟环境
├── resources/                   # 应用资源（图标等）
├── package.json
├── electron.vite.config.ts
├── tailwind.config.js
└── tsconfig.*.json
```

## ⚙️ 配置说明

### API 配置

应用支持任何 OpenAI 兼容的 API 服务：

| 服务商 | Base URL | 模型示例 |
|--------|----------|----------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini`, `gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-turbo` |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` | `glm-4` |

### 输出风格

- **专业文档** - 严谨准确的技术文档风格
- **博客风格** - 轻松易读，适合分享
- **教程风格** - 循序渐进，详细解释

## 🔧 构建

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

### Linux

```bash
npm run build:linux
```

构建产物位于 `dist/` 目录。

## 📝 使用流程

1. **上传文件** - 拖拽或点击选择视频文件和字幕文件（.srt/.vtt/.txt）
2. **配置设置** - 点击设置按钮，填入 API Key，选择模型和输出风格
3. **开始生成** - 点击"开始生成笔记"，等待 AI 分析和截图提取
4. **编辑笔记** - 在编辑器中调整标题、内容，点击时间戳预览视频
5. **导出文档** - 导出为 Markdown 或打印为 PDF

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [OpenCV](https://opencv.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
