import React, { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline, Tab, Tabs, Button, IconButton } from "@mui/material";
import Notes from "./components/Notes";
import TodoList from "./components/TodoList";

// Import local icons if needed for buttons
import MinimizeIcon from "./components/mui_local_icons/MinimizeIcon"; // Placeholder - needs creation
import MaximizeIcon from "./components/mui_local_icons/MaximizeIcon"; // Placeholder - needs creation
import CloseIcon from "./components/mui_local_icons/CloseIcon"; // Placeholder - needs creation
import RestoreIcon from "./components/mui_local_icons/RestoreIcon"; // Placeholder - needs creation

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
    },
    background: {
      default: "rgba(18, 18, 18, 0.8)",
      paper: "rgba(18, 18, 18, 0.9)",
    },
  },
});

function App() {
  const [tab, setTab] = useState(0);
  const draggableBarHeight = "32px";
  const [isMaximized, setIsMaximized] = useState(false); // State for maximize button icon

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

  useEffect(() => {
    // Get initial maximize state
    updateMaximizeState();

    // Listen for window state changes from main process
    const removeListener = window.electronAPI?.onWindowStateChange?.(
      (isMaximized) => {
        console.log("[App] Window maximize state changed:", isMaximized);
        setIsMaximized(isMaximized);
      }
    );

    // Cleanup listener when component unmounts
    return () => {
      if (typeof removeListener === "function") {
        removeListener();
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
        </Tabs>

        {/* Content Area - Scrollable */}
        <Box
          sx={{
            p: 2,
            flexGrow: 1,
            overflowY: "auto",
          }}
        >
          <Box sx={{ display: tab === 0 ? "block" : "none" }}>
            <Notes />
          </Box>
          <Box sx={{ display: tab === 1 ? "block" : "none" }}>
            <TodoList />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
