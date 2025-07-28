const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");

// 配置应用程序以使用GPU加速
try {
  // 有些命令行参数可能不被某些Electron版本支持
  app.commandLine.appendSwitch("enable-transparent-visuals");
  // 以下开关可能会在某些系统上导致问题，使用try-catch包装
  try {
    app.commandLine.appendSwitch("disable-gpu-vsync");
  } catch (e) {
    console.warn(e);
  }
  try {
    app.commandLine.appendSwitch("force-gpu-rasterization");
  } catch (e) {
    console.warn(e);
  }
  try {
    app.commandLine.appendSwitch("enable-zero-copy");
  } catch (e) {
    console.warn(e);
  }
  try {
    app.commandLine.appendSwitch("ignore-gpu-blacklist");
  } catch (e) {
    console.warn(e);
  }
  try {
    app.commandLine.appendSwitch("enable-accelerated-video-decode");
  } catch (e) {
    console.warn(e);
  }
  try {
    app.commandLine.appendSwitch("enable-native-gpu-memory-buffers");
  } catch (e) {
    console.warn(e);
  }
} catch (err) {
  console.error("[Main] Error setting GPU acceleration flags:", err.message);
}

// Use simple file system for data storage
const dataFilePath = path.join(app.getPath("userData"), "hbnote-data.json");

// 用于存储窗口初始大小和最大化状态
let normalWindowBounds = { x: 100, y: 100, width: 470, height: 400 };
let manualMaximizeState = false;
let isFloatMode = false; // 是否处于悬浮窗模式

// Simple data read and write functions
function readDataFile() {
  console.log(`[Main] Trying to read data from ${dataFilePath}`);
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("[Main] Failed to read data file:", error);
  }
  return {};
}

function saveDataFile(data) {
  console.log(`[Main] Trying to save data to ${dataFilePath}`);
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("[Main] Failed to save data file:", error);
    return false;
  }
}

// Read stored data
let storedData = readDataFile();

console.log("[Main] Data file location:", dataFilePath);
console.log(
  "[Main] Data loaded:",
  storedData ? "Success" : "No data or failed"
);

function createWindow() {
  const win = new BrowserWindow({
    width: normalWindowBounds.width,
    height: normalWindowBounds.height,
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    titleBarOverlay: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    // 使用透明背景，让CSS控制透明度
    backgroundColor: "#00000000", // 完全透明
  });

  console.log("[Main] Creating window...");

  // 在窗口创建后存储初始尺寸
  normalWindowBounds = win.getBounds();
  console.log("[Main] Initial window bounds:", normalWindowBounds);

  // Add window state change event listeners
  win.on("maximize", () => {
    console.log("[Main] Window maximized - sending state change event (true)");
    manualMaximizeState = true;
    win.webContents.send("window-state-change", true);
  });

  win.on("unmaximize", () => {
    console.log(
      "[Main] Window unmaximized - sending state change event (false)"
    );
    manualMaximizeState = false;
    win.webContents.send("window-state-change", false);
  });

  if (process.env.NODE_ENV === "development") {
    win.loadURL("http://localhost:5173");
    console.log("[Main] Loading URL: http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    const filePath = path.join(__dirname, "dist/index.html");
    console.log(`[Main] Loading file: ${filePath}`);
    win.loadFile(filePath);
  }
}

app.whenReady().then(() => {
  console.log("[Main] App ready. Setting up IPC handlers...");

  // Add IPC handlers for data operations
  ipcMain.handle("store-get", (event, key) => {
    console.log(`[Main] IPC: store-get "${key}"`);
    try {
      const value = storedData[key];
      console.log(
        `[Main] IPC: store-get "${key}" result:`,
        value ? "Data exists" : "No data"
      );
      return value;
    } catch (error) {
      console.error(`[Main] IPC: store-get "${key}" error:`, error.message);
      return null;
    }
  });

  ipcMain.handle("store-set", (event, key, value) => {
    console.log(`[Main] IPC: store-set "${key}"`);
    try {
      storedData[key] = value;
      saveDataFile(storedData);
      console.log(`[Main] IPC: store-set "${key}" success`);
      return true;
    } catch (error) {
      console.error(`[Main] IPC: store-set "${key}" error:`, error.message);
      return false;
    }
  });

  // Test data storage
  const testKey = "__main_test_key__";
  const testValue = { test: true, time: new Date().toISOString() };
  console.log(`[Main] Testing data storage: Writing "${testKey}"...`);
  storedData[testKey] = testValue;
  saveDataFile(storedData);
  const newData = readDataFile();
  const success =
    newData &&
    newData[testKey] &&
    JSON.stringify(newData[testKey]) === JSON.stringify(testValue);
  console.log(`[Main] Data storage test ${success ? "successful" : "failed"}!`);

  // 悬浮窗模式切换处理
  ipcMain.handle("enter-float-mode", async (event) => {
    console.log("[Main] Received enter-float-mode invoke");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      console.log("[Main][float] Window not found");
      return false;
    }

    // 保存当前正常模式窗口尺寸和位置（如未最大化）
    if (!manualMaximizeState) {
      normalWindowBounds = win.getBounds();
      console.log(
        "[Main][float] Saved normal window bounds:",
        normalWindowBounds
      );
    }

    // 如果当前窗口已最大化，先还原
    if (manualMaximizeState) {
      manualMaximizeState = false;
      win.unmaximize();
      win.webContents.send("window-state-change", false);
    }

    // 定义悬浮窗尺寸
    const floatWidth = 250;
    const floatHeight = 120;

    // 获取主屏幕尺寸
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // 计算悬浮窗位置 (放在右下角)
    const targetX = width - floatWidth - 20;
    const targetY = height - floatHeight - 20;

    // 获取当前窗口位置和大小
    const [currentX, currentY] = win.getPosition();
    const [currentWidth, currentHeight] = win.getSize();

    // 动画: 分20帧缩小窗口
    console.log(
      "[Main][float] Starting animation from",
      win.getBounds(),
      "to",
      {
        x: targetX,
        y: targetY,
        width: floatWidth,
        height: floatHeight,
      }
    );

    try {
      // 先将窗口透明度降低（淡出效果）- 仅在支持透明度的情况下
      if (
        typeof win.getOpacity === "function" &&
        typeof win.setOpacity === "function"
      ) {
        const currentOpacity = win.getOpacity();
        for (let i = 0; i < 5; i++) {
          win.setOpacity(Math.max(0.5, currentOpacity - i * 0.1));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (err) {
      console.warn(
        "[Main][float] Opacity animation not supported:",
        err.message
      );
    }

    // 如果正常窗口太大，先将尺寸减小到合理范围再开始动画
    // 这样动画会更流畅
    if (currentWidth > 800 || currentHeight > 800) {
      win.setSize(Math.min(currentWidth, 800), Math.min(currentHeight, 800));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    // 使用缓动函数来让动画更自然
    const easeOutQuad = (t) => t * (2 - t);
    const totalFrames = 20;
    const frameDelay = 12; // 每帧延迟时间（毫秒）

    try {
      // 先设置窗口为总在最前，可以减少动画中的闪烁
      win.setAlwaysOnTop(true, "floating");
    } catch (err) {
      // 某些旧版Electron不支持"floating"参数
      try {
        win.setAlwaysOnTop(true);
      } catch (e) {
        console.warn("[Main][float] Failed to set always on top:", e.message);
      }
    }

    // 开始动画
    for (let i = 0; i < totalFrames; i++) {
      try {
        // 使用缓动计算当前进度
        const progress = easeOutQuad((i + 1) / totalFrames);

        // 计算当前帧的尺寸和位置
        const frameWidth =
          currentWidth - (currentWidth - floatWidth) * progress;
        const frameHeight =
          currentHeight - (currentHeight - floatHeight) * progress;
        const frameX = currentX + (targetX - currentX) * progress;
        const frameY = currentY + (targetY - currentY) * progress;

        // 设置窗口尺寸和位置
        win.setBounds({
          x: Math.round(frameX),
          y: Math.round(frameY),
          width: Math.round(frameWidth),
          height: Math.round(frameHeight),
        });

        // 每帧等待时间更短，模拟requestAnimationFrame效果
        await new Promise((resolve) => setTimeout(resolve, frameDelay));
      } catch (err) {
        console.error("[Main][float] Animation frame error:", err.message);
        break; // 出错就中断动画
      }
    }

    // 确保最终尺寸精确
    try {
      win.setBounds({
        x: targetX,
        y: targetY,
        width: floatWidth,
        height: floatHeight,
      });
    } catch (err) {
      console.error("[Main][float] Failed to set final bounds:", err.message);
    }

    // 设置悬浮窗属性
    try {
      win.setResizable(false);
    } catch (err) {
      console.warn("[Main][float] Failed to set resizable:", err.message);
    }

    try {
      // 将窗口淡入显示
      if (
        typeof win.getOpacity === "function" &&
        typeof win.setOpacity === "function"
      ) {
        const currentOpacity = win.getOpacity();
        for (let i = 0; i <= 5; i++) {
          win.setOpacity(Math.min(1.0, currentOpacity + i * 0.1));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (err) {
      console.warn(
        "[Main][float] Opacity animation not supported:",
        err.message
      );
    }

    // 更新悬浮窗状态并通知渲染进程
    isFloatMode = true;
    win.webContents.send("float-mode-change", true);
    console.log("[Main][float] Entered float mode");

    return true;
  });

  ipcMain.handle("exit-float-mode", async (event) => {
    console.log("[Main] Received exit-float-mode invoke");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      console.log("[Main][float] Window not found");
      return false;
    }

    // 如果不是悬浮窗模式，不执行任何操作
    if (!isFloatMode) {
      console.log("[Main][float] Not in float mode, ignoring");
      return false;
    }

    // 获取当前悬浮窗位置和大小
    const [currentX, currentY] = win.getPosition();
    const [currentWidth, currentHeight] = win.getSize();

    // 恢复窗口属性
    try {
      win.setResizable(true);
    } catch (err) {
      console.warn("[Main][float] Failed to set resizable:", err.message);
    }

    try {
      // 先将窗口透明度降低（淡出效果）
      if (
        typeof win.getOpacity === "function" &&
        typeof win.setOpacity === "function"
      ) {
        const currentOpacity = win.getOpacity();
        for (let i = 0; i < 5; i++) {
          win.setOpacity(Math.max(0.5, currentOpacity - i * 0.1));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (err) {
      console.warn(
        "[Main][float] Opacity animation not supported:",
        err.message
      );
    }

    // 动画: 分20帧恢复窗口大小
    console.log(
      "[Main][float] Starting restore animation to",
      normalWindowBounds
    );

    // 使用缓动函数来让动画更自然
    const easeOutQuad = (t) => t * (2 - t);
    const totalFrames = 20;
    const frameDelay = 12; // 每帧延迟时间（毫秒）

    for (let i = 0; i < totalFrames; i++) {
      try {
        // 使用缓动计算当前进度
        const progress = easeOutQuad((i + 1) / totalFrames);

        // 计算当前帧的尺寸和位置
        const frameWidth =
          currentWidth + (normalWindowBounds.width - currentWidth) * progress;
        const frameHeight =
          currentHeight +
          (normalWindowBounds.height - currentHeight) * progress;
        const frameX = currentX + (normalWindowBounds.x - currentX) * progress;
        const frameY = currentY + (normalWindowBounds.y - currentY) * progress;

        // 设置窗口尺寸和位置
        win.setBounds({
          x: Math.round(frameX),
          y: Math.round(frameY),
          width: Math.round(frameWidth),
          height: Math.round(frameHeight),
        });

        // 每帧等待时间更短，模拟requestAnimationFrame效果
        await new Promise((resolve) => setTimeout(resolve, frameDelay));
      } catch (err) {
        console.error("[Main][float] Animation frame error:", err.message);
        break; // 出错就中断动画
      }
    }

    // 确保最终尺寸精确
    try {
      win.setBounds(normalWindowBounds);
    } catch (err) {
      console.error("[Main][float] Failed to set final bounds:", err.message);
    }

    try {
      // 移除置顶
      win.setAlwaysOnTop(false);
    } catch (err) {
      console.warn("[Main][float] Failed to unset always on top:", err.message);
    }

    try {
      // 将窗口淡入显示
      if (
        typeof win.getOpacity === "function" &&
        typeof win.setOpacity === "function"
      ) {
        const currentOpacity = win.getOpacity();
        for (let i = 0; i <= 5; i++) {
          win.setOpacity(Math.min(1.0, currentOpacity + i * 0.1));
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    } catch (err) {
      console.warn(
        "[Main][float] Opacity animation not supported:",
        err.message
      );
    }

    // 更新悬浮窗状态并通知渲染进程
    isFloatMode = false;
    win.webContents.send("float-mode-change", false);
    console.log("[Main][float] Exited float mode");

    // 聚焦窗口
    try {
      win.focus();
    } catch (err) {
      console.warn("[Main][float] Failed to focus window:", err.message);
    }

    return true;
  });

  // Original IPC handlers
  ipcMain.handle("focus-window", async (event) => {
    console.log("[Main] Received focus-window invoke");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (win.isMinimized()) {
        console.log("[Main][focus] Restoring minimized window");
        win.restore();
      }
      if (!win.isVisible()) {
        console.log("[Main][focus] Showing hidden window");
        win.show();
      }
      if (!win.isFocused()) {
        console.log("[Main][focus] Focusing window");
        win.focus();
      }
      return true;
    }
    console.log("[Main][focus] Window not found");
    return false;
  });

  ipcMain.on("minimize-window", (event) => {
    console.log("[Main] Received minimize-window event");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      console.log("[Main] Minimizing window...");
      win.minimize();
    } else {
      console.log("[Main][minimize] Window not found");
    }
  });

  ipcMain.on("maximize-restore-window", (event) => {
    console.log("[Main] Received maximize-restore-window event");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      if (manualMaximizeState) {
        console.log("[Main] Restore window to:", normalWindowBounds);

        // 先更改状态
        manualMaximizeState = false;
        win.webContents.send("window-state-change", false);

        // 先取消最大化
        win.unmaximize();

        // 强制设置回原始大小和位置
        setTimeout(() => {
          try {
            win.setBounds(normalWindowBounds);
            console.log("[Main] Window restored to original size");
          } catch (err) {
            console.error("[Main] Restore window size failed:", err);
          }
        }, 100);
      } else {
        // 保存当前尺寸用于恢复
        normalWindowBounds = win.getBounds();
        console.log(
          "[Main] Save current size for restore:",
          normalWindowBounds
        );

        // 先更改状态
        manualMaximizeState = true;
        win.webContents.send("window-state-change", true);

        // 最大化窗口
        win.maximize();
      }
    } else {
      console.log("[Main][maximize/restore] Window not found");
    }
  });

  ipcMain.on("close-window", (event) => {
    console.log("[Main] Received close-window event");
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      console.log("[Main] Closing window...");
      win.close();
    } else {
      console.log("[Main][close] Window not found");
    }
  });

  ipcMain.handle("get-maximize-state", (event) => {
    console.log("[Main] Received get-maximize-state invoke");
    const win = BrowserWindow.fromWebContents(event.sender);

    if (win) {
      console.log(`[Main] Current window size:`, win.getBounds());
      console.log(`[Main] isMaximized() method returns:`, win.isMaximized());
      console.log(`[Main] Manual maximize state:`, manualMaximizeState);

      // 始终使用我们手动跟踪的状态
      return manualMaximizeState;
    }

    console.log("[Main] Window not found for get-maximize-state");
    return false;
  });

  console.log("[Main] IPC handlers set up. Creating window...");
  createWindow();
});

app.on("window-all-closed", () => {
  console.log("[Main] All windows closed.");
  // Save data before quitting
  saveDataFile(storedData);
  if (process.platform !== "darwin") {
    console.log("[Main] Quitting app (not macOS).");
    app.quit();
  }
});

app.on("activate", () => {
  console.log("[Main] Activate event received.");
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log("[Main] No windows open, creating one.");
    createWindow();
  }
});
