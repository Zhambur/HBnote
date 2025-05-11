import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import RestoreIcon from "./mui_local_icons/RestoreIcon";

// 使用React.memo优化组件
const FloatWindow = React.memo(({ onRestore }) => {
  const [ddls, setDdls] = useState([]);
  const [loading, setLoading] = useState(true);

  // 使用useCallback优化函数引用
  const loadDdls = useCallback(async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDdls();
    // 每分钟刷新一次数据
    const interval = setInterval(loadDdls, 60000);
    return () => clearInterval(interval);
  }, [loadDdls]);

  // 使用useMemo缓存计算结果
  const nextDdl = useMemo(() => (ddls.length > 0 ? ddls[0] : null), [ddls]);

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

  // 静态样式对象
  const styles = {
    container: {
      height: "100%",
      display: "flex",
      flexDirection: "column",
      backgroundColor: "rgba(18, 18, 18, 0.85)",
      borderRadius: "8px",
      overflow: "hidden",
      padding: "8px",
      color: "white",
      WebkitAppRegion: "drag", // 整个窗口可拖动
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mb: 1,
    },
    headerText: {
      fontWeight: "bold",
    },
    restoreButton: {
      color: "white",
      p: "2px",
      WebkitAppRegion: "no-drag", // 按钮不可拖动
    },
    contentArea: {
      flexGrow: 1,
      overflow: "hidden",
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
  };

  return (
    <Box sx={styles.container}>
      {/* 顶部栏 */}
      <Box sx={styles.header}>
        <Typography variant="subtitle2" sx={styles.headerText}>
          最近DDL
        </Typography>
        <IconButton size="small" onClick={onRestore} sx={styles.restoreButton}>
          <RestoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* 内容区 */}
      <Box sx={styles.contentArea}>
        {loading ? (
          <Typography variant="body2">加载中...</Typography>
        ) : !nextDdl ? (
          <Typography variant="body2">暂无待办事项</Typography>
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
        )}
      </Box>
    </Box>
  );
});

export default FloatWindow;
