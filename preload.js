const { contextBridge, ipcRenderer } = require("electron");

// Log preload script startup
console.log("[Preload] Preload script starting");

// Expose safe API to renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  // Use IPC to communicate with main process for data storage
  storeGet: async (key) => {
    console.log(`[Preload] Getting "${key}" via IPC...`);
    try {
      const result = await ipcRenderer.invoke("store-get", key);
      console.log(
        `[Preload] Get "${key}" result:`,
        result ? "Data exists" : "No data"
      );
      return result;
    } catch (error) {
      console.error(`[Preload] Error getting "${key}":`, error);
      return null;
    }
  },

  storeSet: async (key, value) => {
    console.log(`[Preload] Setting "${key}" via IPC...`);
    try {
      const success = await ipcRenderer.invoke("store-set", key, value);
      console.log(
        `[Preload] Set "${key}" ${success ? "successful" : "failed"}`
      );
      return success;
    } catch (error) {
      console.error(`[Preload] Error setting "${key}":`, error);
      return false;
    }
  },

  // Window control functions
  minimizeWindow: () => ipcRenderer.send("minimize-window"),
  maximizeRestoreWindow: () => {
    console.log("[Preload] Maximize/restore-request sent");
    ipcRenderer.send("maximize-restore-window");
  },
  closeWindow: () => ipcRenderer.send("close-window"),
  getMaximizeState: async () => {
    console.log("[Preload] Get maximize state");
    const state = await ipcRenderer.invoke("get-maximize-state");
    console.log("[Preload] Maximize state:", state);
    return state;
  },
  focusWindow: () => ipcRenderer.invoke("focus-window"),

  // 悬浮窗控制函数
  enterFloatMode: () => {
    console.log("[Preload] Enter float mode request sent");
    return ipcRenderer.invoke("enter-float-mode");
  },

  exitFloatMode: () => {
    console.log("[Preload] Exit float mode request sent");
    return ipcRenderer.invoke("exit-float-mode");
  },

  // Listen for window state changes
  onWindowStateChange: (callback) => {
    console.log("[Preload] Set window state change listener");
    const listener = (_, isMaximized) => {
      console.log(
        "[Preload] window state change:",
        isMaximized ? "maximized" : "normal"
      );
      callback(isMaximized);
    };
    ipcRenderer.on("window-state-change", listener);
    return () => {
      ipcRenderer.removeListener("window-state-change", listener);
    };
  },

  // 监听悬浮窗模式切换
  onFloatModeChange: (callback) => {
    console.log("[Preload] Set float mode change listener");
    const listener = (_, isFloatMode) => {
      console.log(
        "[Preload] float mode change:",
        isFloatMode ? "float" : "normal"
      );
      callback(isFloatMode);
    };
    ipcRenderer.on("float-mode-change", listener);
    return () => {
      ipcRenderer.removeListener("float-mode-change", listener);
    };
  },
});

console.log("[Preload] Preload script completed, API exposed");
