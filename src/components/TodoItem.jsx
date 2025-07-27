import React from "react";
import {
  ListItem,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Typography,
  IconButton,
  Box,
  Chip,
} from "@mui/material";
// import { Delete as DeleteIcon } from "@mui/icons-material"; // 移除
import DeleteIcon from "./mui_local_icons/DeleteIcon"; // 导入本地图标

function TodoItem({ todo, onToggle, onDelete }) {
  const handleToggle = () => {
    onToggle(todo.id); // 假设 todo 对象有 id
  };

  const handleDelete = () => {
    onDelete(todo.id); // 假设 todo 对象有 id
  };

  // 优先级选项
  const priorityOptions = [
    { value: "high", label: "高", color: "error" },
    { value: "medium", label: "中", color: "warning" },
    { value: "low", label: "低", color: "success" },
  ];

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const option = priorityOptions.find((opt) => opt.value === priority);
    return option ? option.color : "default";
  };

  return (
    <ListItem
      sx={{
        bgcolor: todo.completed
          ? "action.disabledBackground"
          : "background.paper",
        mb: 1,
        borderRadius: 1,
        boxShadow: 1,
        transition: "background-color 0.3s ease",
        flexDirection: "column",
        alignItems: "stretch",
        "&:hover": {
          bgcolor: todo.completed
            ? "action.disabledBackground"
            : "action.hover",
        },
      }}
    >
      {/* 主要内容行 */}
      <Box sx={{ display: "flex", alignItems: "flex-start", width: "100%" }}>
        <ListItemIcon sx={{ minWidth: "auto", mr: 1.5, mt: 0.5 }}>
          <Checkbox
            edge="start"
            checked={!!todo.completed}
            onChange={handleToggle}
            sx={{
              color: todo.completed ? "success.main" : "default",
              "&.Mui-checked": {
                color: "success.main",
              },
              padding: "4px",
            }}
          />
        </ListItemIcon>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            sx={{
              textDecoration: todo.completed ? "line-through" : "none",
              color: todo.completed ? "text.secondary" : "text.primary",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              lineHeight: 1.4,
              mb: 1,
            }}
          >
            {todo.text}
          </Typography>
        </Box>

        {/* 删除按钮 */}
        {onDelete && (
          <IconButton
            aria-label="delete todo"
            onClick={handleDelete}
            size="small"
            sx={{ ml: 1, flexShrink: 0 }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      {/* 底部信息行 */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 6 }}>
        <Chip
          label={
            priorityOptions.find((p) => p.value === (todo.priority || "medium"))
              ?.label
          }
          color={getPriorityColor(todo.priority || "medium")}
          size="small"
        />
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {todo.date ? new Date(todo.date).toLocaleDateString() : ""}
        </Typography>
      </Box>
    </ListItem>
  );
}

export default TodoItem;
