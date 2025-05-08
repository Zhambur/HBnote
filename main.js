const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");
const fs = require("fs");

// Use simple file system for data storage
const dataFilePath = path.join(app.getPath("userData"), "hbnote-data.json");

// 用于存储窗口初始大小和最大化状态
let normalWindowBounds = { x: 100, y: 100, width: 400, height: 400 };
let manualMaximizeState = false;

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
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
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
