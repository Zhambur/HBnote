import React, { useState, useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  Box,
  CssBaseline,
  Tab,
  Tabs,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
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
import BackgroundIcon from "./components/mui_local_icons/BackgroundIcon";

function App() {
  const [tab, setTab] = useState(0);
  const draggableBarHeight = "32px";
  const [isMaximized, setIsMaximized] = useState(false); // State for maximize button icon
  const [isFloatMode, setIsFloatMode] = useState(false); // 悬浮窗模式状态
  const [mode, setMode] = useState("dark"); // 主题模式状态

  // 背景设置状态
  const [backgroundImage, setBackgroundImage] = useState("");
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.3);
  const [backgroundPosition, setBackgroundPosition] = useState("center");
  const [backgroundSize, setBackgroundSize] = useState("cover");
  const [isBackgroundDialogOpen, setIsBackgroundDialogOpen] = useState(false);

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

  // 加载背景设置
  useEffect(() => {
    const loadBackgroundSettings = async () => {
      try {
        const savedImage = await window.electronAPI?.storeGet?.(
          "backgroundImage"
        );
        const savedOpacity = await window.electronAPI?.storeGet?.(
          "backgroundOpacity"
        );
        const savedPosition = await window.electronAPI?.storeGet?.(
          "backgroundPosition"
        );
        const savedSize = await window.electronAPI?.storeGet?.(
          "backgroundSize"
        );

        if (savedImage) setBackgroundImage(savedImage);
        if (savedOpacity !== undefined) setBackgroundOpacity(savedOpacity);
        if (savedPosition) setBackgroundPosition(savedPosition);
        if (savedSize) setBackgroundSize(savedSize);
      } catch (error) {
        console.error("Failed to load background settings:", error);
      }
    };
    loadBackgroundSettings();
  }, []);

  // 保存背景设置
  useEffect(() => {
    const saveBackgroundSettings = async () => {
      try {
        await window.electronAPI?.storeSet?.(
          "backgroundImage",
          backgroundImage
        );
        await window.electronAPI?.storeSet?.(
          "backgroundOpacity",
          backgroundOpacity
        );
        await window.electronAPI?.storeSet?.(
          "backgroundPosition",
          backgroundPosition
        );
        await window.electronAPI?.storeSet?.("backgroundSize", backgroundSize);
      } catch (error) {
        console.error("Failed to save background settings:", error);
      }
    };
    saveBackgroundSettings();
  }, [backgroundImage, backgroundOpacity, backgroundPosition, backgroundSize]);

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
    const removeFloatModeListener = window.electronAPI?.onFloatModeChange?.(
      (isFloat) => {
        console.log("[App] Float mode changed:", isFloat);
        setIsFloatMode(isFloat);
      }
    );

    return () => {
      if (removeMaximizeListener) removeMaximizeListener();
      if (removeFloatModeListener) removeFloatModeListener();
    };
  }, []);

  const handleMaximizeRestore = () => {
    window.electronAPI?.maximizeRestoreWindow?.();
  };

  const handleEnterFloatMode = async () => {
    try {
      await window.electronAPI?.enterFloatMode?.();
    } catch (error) {
      console.error("Failed to enter float mode:", error);
    }
  };

  const handleExitFloatMode = async () => {
    try {
      await window.electronAPI?.exitFloatMode?.();
    } catch (error) {
      console.error("Failed to exit float mode:", error);
    }
  };

  // 切换主题模式
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
  };

  // 处理背景图片选择
  const handleBackgroundImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setBackgroundImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除背景图片
  const handleClearBackground = () => {
    setBackgroundImage("");
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
          position: "relative",
          ...(backgroundImage && {
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${backgroundImage})`,
              backgroundPosition: backgroundPosition,
              backgroundSize: backgroundSize,
              backgroundRepeat: "no-repeat",
              opacity: backgroundOpacity,
              zIndex: -1,
            },
          }),
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

            {/* 背景设置按钮 */}
            <IconButton
              size="small"
              onClick={() => setIsBackgroundDialogOpen(true)}
              sx={{ color: "inherit", p: "4px" }}
              aria-label="background settings"
              title="背景设置"
            >
              <BackgroundIcon fontSize="inherit" />
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

        {/* 背景设置对话框 */}
        <Dialog
          open={isBackgroundDialogOpen}
          onClose={() => setIsBackgroundDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>背景设置</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>选择背景图片</Typography>
              <input
                accept="image/*"
                style={{ display: "none" }}
                id="background-image-input"
                type="file"
                onChange={handleBackgroundImageSelect}
              />
              <label htmlFor="background-image-input">
                <Button variant="outlined" component="span">
                  选择图片
                </Button>
              </label>
              {backgroundImage && (
                <Button
                  variant="outlined"
                  onClick={handleClearBackground}
                  sx={{ ml: 1 }}
                >
                  清除背景
                </Button>
              )}
            </Box>

            {backgroundImage && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography gutterBottom>
                    透明度: {Math.round(backgroundOpacity * 100)}%
                  </Typography>
                  <Slider
                    value={backgroundOpacity}
                    onChange={(event, newValue) =>
                      setBackgroundOpacity(newValue)
                    }
                    min={0}
                    max={1}
                    step={0.01}
                    marks={[
                      { value: 0, label: "0%" },
                      { value: 0.5, label: "50%" },
                      { value: 1, label: "100%" },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>背景位置</InputLabel>
                    <Select
                      value={backgroundPosition}
                      onChange={(e) => setBackgroundPosition(e.target.value)}
                      label="背景位置"
                    >
                      <MenuItem value="center">居中</MenuItem>
                      <MenuItem value="top">顶部</MenuItem>
                      <MenuItem value="bottom">底部</MenuItem>
                      <MenuItem value="left">左侧</MenuItem>
                      <MenuItem value="right">右侧</MenuItem>
                      <MenuItem value="top left">左上</MenuItem>
                      <MenuItem value="top right">右上</MenuItem>
                      <MenuItem value="bottom left">左下</MenuItem>
                      <MenuItem value="bottom right">右下</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>背景尺寸</InputLabel>
                    <Select
                      value={backgroundSize}
                      onChange={(e) => setBackgroundSize(e.target.value)}
                      label="背景尺寸"
                    >
                      <MenuItem value="cover">覆盖</MenuItem>
                      <MenuItem value="contain">包含</MenuItem>
                      <MenuItem value="auto">自动</MenuItem>
                      <MenuItem value="100% 100%">拉伸</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsBackgroundDialogOpen(false)}>
              关闭
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App;
