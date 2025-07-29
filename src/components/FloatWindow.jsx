import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Typography,
  IconButton,
  Slider,
  Tooltip,
  Chip,
} from "@mui/material";
import RestoreIcon from "./mui_local_icons/RestoreIcon";
import EditIcon from "./mui_local_icons/EditIcon";

// 使用React.memo优化组件
const FloatWindow = React.memo(({ onRestore, mode = "dark" }) => {
  const [ddls, setDdls] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // 悬浮窗设置状态
  const [opacity, setOpacity] = useState(0.9);
  const [showOpacitySlider, setShowOpacitySlider] = useState(false);
  const [viewMode, setViewMode] = useState("ddl"); // "ddl" 或 "schedule"

  // 使用useCallback优化函数引用
  const loadDdls = useCallback(async () => {
    try {
      const storedDdls = await window.electronAPI.storeGet("ddls");
      if (Array.isArray(storedDdls)) {
        // 按截止时间排序
        const sortedDdls = [...storedDdls].sort((a, b) => {
          return new Date(a.deadline) - new Date(b.deadline);
        });
        setDdls(sortedDdls);
      } else {
        setDdls([]);
      }
    } catch (error) {
      console.error("[FloatWindow] Failed to load ddls:", error);
      setDdls([]);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    try {
      const storedSchedules = await window.electronAPI.storeGet("schedules");
      if (Array.isArray(storedSchedules)) {
        // 获取今日的日程安排
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const todaySchedules = storedSchedules
          .filter((schedule) => schedule.date === today)
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime)); // 按开始时间排序
        setSchedules(todaySchedules);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("[FloatWindow] Failed to load schedules:", error);
      setSchedules([]);
    }
  }, []);

  // 加载悬浮窗设置
  useEffect(() => {
    const loadFloatSettings = async () => {
      try {
        const savedOpacity = await window.electronAPI?.storeGet?.(
          "floatOpacity"
        );
        if (savedOpacity !== undefined) setOpacity(savedOpacity);

        const savedViewMode = await window.electronAPI?.storeGet?.(
          "floatViewMode"
        );
        if (savedViewMode) setViewMode(savedViewMode);
      } catch (error) {
        console.error("Failed to load float settings:", error);
      }
    };
    loadFloatSettings();
  }, []);

  // 保存悬浮窗设置
  useEffect(() => {
    const saveFloatSettings = async () => {
      try {
        await window.electronAPI?.storeSet?.("floatOpacity", opacity);
      } catch (error) {
        console.error("Failed to save float settings:", error);
      }
    };
    saveFloatSettings();
  }, [opacity]);

  // 保存视图模式设置
  useEffect(() => {
    const saveViewMode = async () => {
      try {
        await window.electronAPI?.storeSet?.("floatViewMode", viewMode);
      } catch (error) {
        console.error("Failed to save view mode:", error);
      }
    };
    saveViewMode();
  }, [viewMode]);

  // 加载所有数据
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDdls(), loadSchedules()]);
    } finally {
      setLoading(false);
    }
  }, [loadDdls, loadSchedules]);

  useEffect(() => {
    loadAllData();
    // 每分钟刷新一次数据
    const interval = setInterval(loadAllData, 60000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  // 使用useMemo缓存计算结果
  const nextDdl = useMemo(() => (ddls.length > 0 ? ddls[0] : null), [ddls]);
  const todaySchedules = useMemo(() => schedules.slice(0, 3), [schedules]); // 只显示前3个日程

  // 计算今日统计
  const todayStats = useMemo(() => {
    const highPriority = schedules.filter(
      (schedule) => schedule.priority === "high"
    ).length;
    const total = schedules.length;
    return { highPriority, total };
  }, [schedules]);

  // 使用useMemo缓存格式化函数，避免重复创建
  const formatTimeRemaining = useCallback((deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate - now;

    if (diffMs < 0) return "已过期";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
      return `${diffDays}天${diffHours}小时`;
    } else if (diffHours > 0) {
      return `${diffHours}小时${diffMinutes}分钟`;
    } else {
      return `${diffMinutes}分钟`;
    }
  }, []);

  // 使用useMemo缓存格式化的日期
  const formattedDeadline = useMemo(() => {
    if (!nextDdl) return "";
    return new Date(nextDdl.deadline).toLocaleString("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [nextDdl]);

  // 使用useMemo缓存剩余时间显示
  const timeRemaining = useMemo(() => {
    if (!nextDdl) return "";
    return formatTimeRemaining(nextDdl.deadline);
  }, [nextDdl, formatTimeRemaining]);

  // 动态样式对象，根据主题模式和设置调整
  const styles = {
    container: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor:
        mode === "dark"
          ? `rgba(18, 18, 18, ${opacity})`
          : `rgba(255, 255, 255, ${opacity})`,
      borderRadius: "8px",
      overflow: "hidden",
      padding: "8px",
      color: mode === "dark" ? "white" : "black",
      WebkitAppRegion: "no-drag", // 默认不可拖动
      // 移除所有边框和分割线
      border: "none",
      outline: "none",
      // 当透明度很低时，增强文字对比度
      ...(opacity < 0.3 && {
        textShadow:
          mode === "dark"
            ? "0 1px 2px rgba(0, 0, 0, 0.8)"
            : "0 1px 2px rgba(255, 255, 255, 0.8)",
      }),
    },
    modeToggle: {
      display: "flex",
      gap: "4px",
      mb: 1,
      WebkitAppRegion: "no-drag",
    },
    modeChip: {
      cursor: "pointer",
      fontSize: "0.7rem",
      height: "20px",
      "&:hover": {
        opacity: 0.8,
      },
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 1,
      border: "none",
      borderBottom: "none",
      WebkitAppRegion: "drag", // 顶部区域可拖动
      cursor: "move", // 显示移动光标
    },
    headerText: {
      fontWeight: "bold",
    },
    buttonGroup: {
      display: "flex",
      gap: "2px",
    },
    iconButton: {
      color: "white",
      p: "2px",
      WebkitAppRegion: "no-drag", // 按钮不可拖动
      border: "none",
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      },
    },
    opacitySlider: {
      position: "absolute",
      top: "40px",
      right: "20px",
      width: "120px",
      backgroundColor:
        mode === "dark" ? "rgba(0, 0, 0, 0.9)" : "rgba(255, 255, 255, 0.95)",
      borderRadius: "4px",
      padding: "8px",
      zIndex: 1000,
      WebkitAppRegion: "no-drag",
      border:
        mode === "dark"
          ? "1px solid rgba(255, 255, 255, 0.2)"
          : "1px solid rgba(0, 0, 0, 0.1)",
    },
    contentArea: {
      flexGrow: 1,
      overflow: "auto",
      border: "none",
      WebkitAppRegion: "no-drag", // 内容区域不可拖动，允许滚动
      // 自定义滚动条样式
      "&::-webkit-scrollbar": {
        width: "6px",
      },
      "&::-webkit-scrollbar-track": {
        backgroundColor: "transparent",
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor:
          mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
        borderRadius: "3px",
        "&:hover": {
          backgroundColor:
            mode === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
        },
      },
    },
    title: {
      fontWeight: "bold",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    deadline: {
      mt: 0.5,
    },
    timeRemaining: {
      color: "error.main",
      fontWeight: "bold",
    },
    content: {
      mt: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      display: "-webkit-box",
      WebkitLineClamp: 2,
      WebkitBoxOrient: "vertical",
    },
    scheduleItem: {
      display: "flex",
      alignItems: "center",
      gap: "4px",
      mb: 0.5,
      fontSize: "0.8rem",
    },
    priorityChip: {
      fontSize: "0.6rem",
      height: "16px",
      minWidth: "24px",
    },
    scheduleText: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    timeText: {
      fontSize: "0.7rem",
      opacity: 0.8,
      minWidth: "60px",
    },
  };

  return (
    <Box sx={styles.container}>
      {/* 模式切换 */}
      <Box sx={styles.modeToggle}>
        <Chip
          label="DDL"
          size="small"
          variant={viewMode === "ddl" ? "filled" : "outlined"}
          onClick={() => setViewMode("ddl")}
          sx={{
            ...styles.modeChip,
            backgroundColor: viewMode === "ddl" ? "#1976d2" : "transparent",
            color: viewMode === "ddl" ? "white" : "inherit",
          }}
        />
        <Chip
          label="日程"
          size="small"
          variant={viewMode === "schedule" ? "filled" : "outlined"}
          onClick={() => setViewMode("schedule")}
          sx={{
            ...styles.modeChip,
            backgroundColor:
              viewMode === "schedule" ? "#388e3c" : "transparent",
            color: viewMode === "schedule" ? "white" : "inherit",
          }}
        />
      </Box>

      {/* 顶部栏 */}
      <Box sx={styles.header}>
        <Typography variant="subtitle2" sx={styles.headerText}>
          {viewMode === "ddl" ? "最近DDL" : "今日日程"}
        </Typography>
        <Box sx={styles.buttonGroup}>
          {/* 透明度调节按钮 */}
          <Tooltip
            title={`透明度: ${Math.round(opacity * 100)}%`}
            placement="bottom"
          >
            <IconButton
              size="small"
              onClick={() => setShowOpacitySlider(!showOpacitySlider)}
              sx={styles.iconButton}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* 恢复按钮 */}
          <IconButton size="small" onClick={onRestore} sx={styles.iconButton}>
            <RestoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* 透明度滑块 */}
      {showOpacitySlider && (
        <Box sx={styles.opacitySlider}>
          <Typography variant="caption" sx={{ mb: 1, display: "block" }}>
            {Math.round(opacity * 100)}%
          </Typography>
          <Slider
            value={opacity}
            onChange={(event, newValue) => setOpacity(newValue)}
            min={0.05}
            max={1}
            step={0.01}
            size="small"
            sx={{
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
              },
              "& .MuiSlider-track": {
                height: 2,
              },
              "& .MuiSlider-rail": {
                height: 2,
              },
            }}
          />
        </Box>
      )}

      {/* 内容区 */}
      <Box sx={styles.contentArea}>
        {loading ? (
          <Typography variant="body2">加载中...</Typography>
        ) : viewMode === "ddl" ? (
          // DDL模式
          !nextDdl ? (
            <Typography variant="body2">暂无DDL</Typography>
          ) : (
            <Box>
              <Typography variant="body1" sx={styles.title}>
                {nextDdl.title}
              </Typography>

              <Typography variant="body2" sx={styles.deadline}>
                截止: {formattedDeadline}
              </Typography>

              <Typography variant="body2" sx={styles.timeRemaining}>
                剩余: {timeRemaining}
              </Typography>

              {nextDdl.content && (
                <Typography variant="body2" sx={styles.content}>
                  {nextDdl.content}
                </Typography>
              )}
            </Box>
          )
        ) : // 日程模式
        todaySchedules.length === 0 ? (
          <Typography variant="body2">今日无日程安排</Typography>
        ) : (
          <Box>
            {/* 统计信息 */}
            <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
              <Chip
                label={`${todayStats.total}项`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.6rem", height: "16px" }}
              />
              {todayStats.highPriority > 0 && (
                <Chip
                  label={`${todayStats.highPriority}个高优先级`}
                  size="small"
                  sx={{
                    fontSize: "0.6rem",
                    height: "16px",
                    backgroundColor: "#d32f2f",
                    color: "white",
                  }}
                />
              )}
            </Box>

            {/* 日程列表 */}
            {todaySchedules.map((schedule, index) => (
              <Box key={schedule.id} sx={styles.scheduleItem}>
                <Chip
                  label={
                    schedule.priority === "high"
                      ? "高"
                      : schedule.priority === "low"
                      ? "低"
                      : "中"
                  }
                  size="small"
                  sx={{
                    ...styles.priorityChip,
                    backgroundColor:
                      schedule.priority === "high"
                        ? "#d32f2f"
                        : schedule.priority === "low"
                        ? "#388e3c"
                        : "#f57c00",
                    color: "white",
                  }}
                />
                <Typography variant="body2" sx={styles.timeText}>
                  {new Date(schedule.startTime).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Typography>
                <Typography variant="body2" sx={styles.scheduleText}>
                  {schedule.title}
                </Typography>
              </Box>
            ))}
            {schedules.length > 3 && (
              <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                还有 {schedules.length - 3} 个日程...
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
});

export default FloatWindow;
