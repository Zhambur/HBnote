import React, { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline, Tab, Tabs, Button, IconButton } from "@mui/material";
import Notes from "./components/Notes";
import TodoList from "./components/TodoList";
import DDL from "./components/DDL";
import Schedule from "./components/Schedule";
import FloatWindow from "./components/FloatWindow";

// Import local icons if needed for buttons
import MinimizeIcon from "./components/mui_local_icons/MinimizeIcon";
import MaximizeIcon from "./components/mui_local_icons/MaximizeIcon";
import CloseIcon from "./components/mui_local_icons/CloseIcon";
import RestoreIcon from "./components/mui_local_icons/RestoreIcon";
import FloatIcon from "./components/mui_local_icons/FloatIcon";
import DarkModeIcon from "./components/mui_local_icons/DarkModeIcon";
import LightModeIcon from "./components/mui_local_icons/LightModeIcon";

function App() {
  const [tab, setTab] = useState(0);
  const draggableBarHeight = "32px";
  const [isMaximized, setIsMaximized] = useState(false); // State for maximize button icon
  const [isFloatMode, setIsFloatMode] = useState(false); // 悬浮窗模式状态
  const [mode, setMode] = useState("dark"); // 主题模式状态

  // 创建主题
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === "dark" ? "#90caf9" : "#1976d2",
          },
          background: {
            default:
              mode === "dark"
                ? "rgba(18, 18, 18, 0.8)"
                : "rgba(248, 248, 248, 0.8)",
            paper:
              mode === "dark"
                ? "rgba(18, 18, 18, 0.9)"
                : "rgba(255, 255, 255, 0.9)",
          },
        },
      }),
    [mode]
  );

  // Function to update maximize state (optional)
  const updateMaximizeState = async () => {
    try {
      const maximized = await window.electronAPI?.getMaximizeState?.();
      console.log("[App] Initial maximize state:", maximized);
      setIsMaximized(maximized);
    } catch (err) {
      console.error("Failed to get maximize state:", err);
    }
  };

  // 加载主题设置
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedMode = await window.electronAPI?.storeGet?.("themeMode");
        if (savedMode && (savedMode === "light" || savedMode === "dark")) {
          setMode(savedMode);
        }
      } catch (error) {
        console.error("Failed to load theme mode:", error);
      }
    };
    loadTheme();
  }, []);

  // 保存主题设置
  useEffect(() => {
    const saveTheme = async () => {
      try {
        await window.electronAPI?.storeSet?.("themeMode", mode);
      } catch (error) {
        console.error("Failed to save theme mode:", error);
      }
    };
    saveTheme();
  }, [mode]);

  useEffect(() => {
    // Get initial maximize state
    updateMaximizeState();

    // Listen for window state changes from main process
    const removeMaximizeListener = window.electronAPI?.onWindowStateChange?.(
      (isMaximized) => {
        console.log("[App] Window maximize state changed:", isMaximized);
        setIsMaximized(isMaximized);
      }
    );

    // 监听悬浮窗模式变化
    const removeFloatListener = window.electronAPI?.onFloatModeChange?.(
      (isFloatMode) => {
        console.log("[App] Float mode changed:", isFloatMode);
        setIsFloatMode(isFloatMode);
      }
    );

    // Cleanup listener when component unmounts
    return () => {
      if (typeof removeMaximizeListener === "function") {
        removeMaximizeListener();
      }
      if (typeof removeFloatListener === "function") {
        removeFloatListener();
      }
    };
  }, []);

  const handleMaximizeRestore = () => {
    console.log(
      "[App] windows button clicked, state now:",
      isMaximized ? "maximized" : "normal"
    );
    window.electronAPI?.maximizeRestoreWindow?.();
    // State will be updated via the window-state-change event listener
  };

  // 切换到悬浮窗模式
  const handleEnterFloatMode = async () => {
    console.log("[App] Float button clicked, entering float mode");
    await window.electronAPI?.enterFloatMode?.();
  };

  // 退出悬浮窗模式
  const handleExitFloatMode = async () => {
    console.log("[App] Restore button clicked, exiting float mode");
    await window.electronAPI?.exitFloatMode?.();
  };

  // 切换主题模式
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // 根据模式渲染不同的UI
  if (isFloatMode) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FloatWindow onRestore={handleExitFloatMode} mode={mode} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          bgcolor: "background.default",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Draggable Top Bar with Window Controls */}
        <Box
          sx={{
            height: draggableBarHeight,
            minHeight: draggableBarHeight,
            width: "100%",
            backgroundColor: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.6)",
            fontSize: "0.8rem",
            WebkitAppRegion: "drag",
            cursor: "grab",
            userSelect: "none",
            boxSizing: "border-box",
            flexShrink: 0,
            padding: "0 8px",
          }}
        >
          {/* Left side (can be empty or have title) */}
          <Box sx={{ WebkitAppRegion: "no-drag" }}>{/* Optional Title */}</Box>

          {/* Right side - Window Controls */}
          <Box sx={{ display: "flex", WebkitAppRegion: "no-drag" }}>
            {/* 主题切换按钮 */}
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{ color: "inherit", p: "4px" }}
              aria-label="toggle theme"
              title={mode === "dark" ? "切换到亮色模式" : "切换到暗色模式"}
            >
              {mode === "dark" ? (
                <LightModeIcon fontSize="inherit" />
              ) : (
                <DarkModeIcon fontSize="inherit" />
              )}
            </IconButton>

            {/* 悬浮窗按钮 */}
            <IconButton
              size="small"
              onClick={handleEnterFloatMode}
              sx={{ color: "inherit", p: "4px" }}
              aria-label="float mode"
              title="悬浮窗模式"
            >
              <FloatIcon fontSize="inherit" />
            </IconButton>

            {/* Minimize Button */}
            <IconButton
              size="small"
              onClick={() => window.electronAPI?.minimizeWindow?.()}
              sx={{ color: "inherit", p: "4px" }}
              aria-label="minimize"
            >
              <MinimizeIcon fontSize="inherit" />
            </IconButton>

            {/* Maximize/Restore Button */}
            <IconButton
              size="small"
              onClick={handleMaximizeRestore}
              sx={{ color: "inherit", p: "4px" }}
              aria-label={isMaximized ? "restore" : "maximize"}
            >
              {isMaximized ? (
                <RestoreIcon fontSize="inherit" />
              ) : (
                <MaximizeIcon fontSize="inherit" />
              )}
            </IconButton>

            {/* Close Button */}
            <IconButton
              size="small"
              onClick={() => window.electronAPI?.closeWindow?.()}
              sx={{
                color: "inherit",
                p: "4px",
                "&:hover": { bgcolor: "rgba(255,0,0,0.5)" },
              }}
              aria-label="close"
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        </Box>

        {/* Tabs - Fixed below draggable bar */}
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: "divider",
            WebkitAppRegion: "no-drag",
            flexShrink: 0,
          }}
        >
          <Tab label="Note" sx={{ WebkitAppRegion: "no-drag" }} />
          <Tab label="todoList" sx={{ WebkitAppRegion: "no-drag" }} />
          <Tab label="DDL" sx={{ WebkitAppRegion: "no-drag" }} />
          <Tab label="Schedule" sx={{ WebkitAppRegion: "no-drag" }} />
        </Tabs>

        {/* Content Area - Scrollable */}
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            overflowY: "auto",
            position: "relative",
            "& .MuiDialog-root": {
              position: "fixed",
              zIndex: 1300,
            },
          }}
        >
          <Box sx={{ display: tab === 0 ? "block" : "none" }}>
            <Notes />
          </Box>
          <Box sx={{ display: tab === 1 ? "block" : "none" }}>
            <TodoList />
          </Box>
          <Box sx={{ display: tab === 2 ? "block" : "none" }}>
            <DDL />
          </Box>
          <Box sx={{ display: tab === 3 ? "block" : "none" }}>
            <Schedule />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
