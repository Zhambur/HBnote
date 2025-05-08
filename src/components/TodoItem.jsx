import React from "react";
import {
  ListItem,
  ListItemIcon,
  Checkbox,
  ListItemText,
  Typography,
  IconButton,
  Box,
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
        "&:hover": {
          bgcolor: todo.completed
            ? "action.disabledBackground"
            : "action.hover",
        },
      }}
      // secondaryAction 可以用来放创建日期或删除按钮
      secondaryAction={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            {todo.date ? new Date(todo.date).toLocaleDateString() : ""}
          </Typography>
          {onDelete && (
            <IconButton
              edge="end"
              aria-label="delete todo"
              onClick={handleDelete}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
      }
    >
      <ListItemIcon sx={{ minWidth: "auto", mr: 1.5 }}>
        <Checkbox
          edge="start"
          checked={!!todo.completed} // 确保是布尔值
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
      <ListItemText
        primary={todo.text}
        sx={{
          textDecoration: todo.completed ? "line-through" : "none",
          color: todo.completed ? "text.secondary" : "text.primary",
          overflowWrap: "break-word",
          wordBreak: "break-all",
          mr: onDelete ? 0 : 0, // 调整右边距，因为图标大小可能不同
        }}
      />
    </ListItem>
  );
}

export default TodoItem;
