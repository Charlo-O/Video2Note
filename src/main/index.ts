import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import * as fs from 'fs'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, ChildProcess } from 'child_process'
import icon from '../../resources/icon.png?asset'

let pythonProcess: ChildProcess | null = null

/**
 * 启动 Python 后端服务
 */
function startPythonBackend(): void {
  const backendPath = join(app.getAppPath(), 'python_backend')
  const scriptPath = join(backendPath, 'app.py')

  // 开发模式使用虚拟环境，生产模式使用系统 Python
  let pythonPath: string
  if (is.dev) {
    pythonPath =
      process.platform === 'win32'
        ? join(backendPath, 'venv', 'Scripts', 'python.exe')
        : join(backendPath, 'venv', 'bin', 'python')
  } else {
    pythonPath = process.platform === 'win32' ? 'python' : 'python3'
  }

  console.log('Starting Python backend...')
  console.log('Python path:', pythonPath)
  console.log('Script path:', scriptPath)

  pythonProcess = spawn(pythonPath, ['-u', scriptPath], {
    cwd: backendPath,
    stdio: ['pipe', 'pipe', 'pipe']
  })

  pythonProcess.stdout?.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`)
  })

  pythonProcess.stderr?.on('data', (data) => {
    console.error(`[Python Error] ${data.toString().trim()}`)
  })

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`)
    pythonProcess = null
  })

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python process:', err)
  })
}

/**
 * 停止 Python 后端服务
 */
function stopPythonBackend(): void {
  if (pythonProcess) {
    console.log('Stopping Python backend...')
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', pythonProcess.pid!.toString(), '/f', '/t'])
    } else {
      pythonProcess.kill('SIGTERM')
    }
    pythonProcess = null
  }
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.video2note')

  // 启动 Python 后端服务
  startPythonBackend()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // 选择视频文件
  ipcMain.handle('select-video-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Video', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    return result.filePaths[0]
  })

  // 选择字幕文件
  ipcMain.handle('select-subtitle-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Subtitle', extensions: ['srt', 'vtt', 'txt'] }]
    })
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }
    const filePath = result.filePaths[0]
    const content = fs.readFileSync(filePath, 'utf-8')
    return { path: filePath, content }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 应用退出前停止 Python 后端
app.on('before-quit', () => {
  stopPythonBackend()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
