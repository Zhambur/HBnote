import React, { useState, useEffect } from "react";
import {
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import DeleteIcon from "./mui_local_icons/DeleteIcon";
import EditIcon from "./mui_local_icons/EditIcon";

function DDLItem({ ddl, onEdit, onDelete }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // 计算剩余时间的函数
    const calculateTimeLeft = () => {
      const now = new Date();
      const deadline = new Date(ddl.deadline);
      const timeDiff = deadline - now;

      console.log(
        `[DDLItem] 计算剩余时间 - ID: ${ddl.id.substring(
          0,
          8
        )}, 当前时间: ${now.toISOString()}, 截止时间: ${deadline.toISOString()}, 时差(ms): ${timeDiff}`
      );

      if (timeDiff <= 0) {
        return "已截止";
      }

      // 计算剩余的天、时、分
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      let timeLeftStr = "";
      if (days > 0) {
        timeLeftStr += `${days}天 `;
      }
      timeLeftStr += `${hours}小时 ${minutes}分钟`;

      return timeLeftStr;
    };

    // 初始计算
    setTimeLeft(calculateTimeLeft());
    console.log(`[DDLItem] 初始剩余时间: ${timeLeft}, 标题: ${ddl.title}`);

    // 每分钟更新一次剩余时间
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      console.log(`[DDLItem] 更新剩余时间: ${newTimeLeft}, 标题: ${ddl.title}`);
      setTimeLeft(newTimeLeft);
    }, 10000); // 改为每10秒更新一次来测试更新是否正常工作

    return () => {
      console.log(`[DDLItem] 清除计时器, 标题: ${ddl.title}`);
      clearInterval(timer);
    };
  }, [ddl.deadline, ddl.id, ddl.title]);

  // 格式化创建日期
  const formattedDate = new Date(ddl.date).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 格式化截止日期
  const formattedDeadline = new Date(ddl.deadline).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 判断是否接近截止时间 (24小时内)
  const isNearDeadline = () => {
    const now = new Date();
    const deadline = new Date(ddl.deadline);
    const timeDiff = deadline - now;
    return timeDiff > 0 && timeDiff < 24 * 60 * 60 * 1000;
  };

  // 判断是否已过截止时间
  const isPastDeadline = () => {
    const now = new Date();
    const deadline = new Date(ddl.deadline);
    return now > deadline;
  };

  // 根据截止状态设置颜色
  const getTimeLeftColor = () => {
    if (isPastDeadline()) {
      return "error.main"; // 红色表示已过期
    } else if (isNearDeadline()) {
      return "warning.main"; // 黄色表示即将截止
    } else {
      return "success.main"; // 绿色表示充足时间
    }
  };

  return (
    <Paper
      sx={{
        mb: 2,
        backgroundColor: "background.paper",
        borderLeft: 3,
        borderColor: getTimeLeftColor(),
      }}
      elevation={1}
    >
      <ListItem
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          py: 1,
          px: 2,
        }}
        disablePadding
      >
        <Box sx={{ width: "100%", display: "flex", mb: 1 }}>
          <ListItemText
            primary={
              <Typography variant="h6" component="div">
                {ddl.title}
              </Typography>
            }
            sx={{ flex: 1 }}
          />
          <Box>
            <IconButton
              edge="end"
              aria-label="edit"
              onClick={() => onEdit(ddl)}
              size="small"
            >
              <EditIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => onDelete(ddl.id)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ width: "100%", mb: 1 }}>
          {ddl.content}
        </Typography>

        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            创建: {formattedDate}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            截止: {formattedDeadline}
          </Typography>
        </Box>

        <Box sx={{ width: "100%", mt: 1.5, mb: 0.5 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "bold",
              color: getTimeLeftColor(),
            }}
          >
            剩余时间: {timeLeft}
          </Typography>

          {ddl.reminder && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: "block" }}
            >
              提醒: 提前{ddl.reminderTime}分钟
            </Typography>
          )}
        </Box>
      </ListItem>
    </Paper>
  );
}

export default DDLItem;
