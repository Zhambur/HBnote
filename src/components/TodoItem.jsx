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
import EditIcon from "./mui_local_icons/EditIcon"; // 导入编辑图标

function TodoItem({
  todo,
  index,
  isDragOver,
  isDragging,
  isAnimating,
  isDropTarget,
  onToggle,
  onDelete,
  onEdit,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}) {
  const handleToggle = () => {
    onToggle(todo.id); // 假设 todo 对象有 id
  };

  const handleDelete = () => {
    onDelete(todo.id); // 假设 todo 对象有 id
  };

  const handleEdit = () => {
    onEdit(todo);
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
        mb: isDragOver ? 2.5 : 1,
        borderRadius: 1,
        boxShadow: 1,
        transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        flexDirection: "column",
        alignItems: "stretch",
        cursor: "grab",
        userSelect: "none", // 防止拖拽时选中文本
        transform: isDragOver ? "translateY(15px)" : "translateY(0)",
        opacity: isDragging && isAnimating ? 0.4 : 1,
        "&:active": {
          cursor: "grabbing",
        },
        "&:hover": {
          bgcolor: todo.completed
            ? "action.disabledBackground"
            : "action.hover",
          boxShadow: 3,
          transform: isDragOver ? "translateY(15px)" : "translateY(-2px)",
        },
        "&.dragging": {
          opacity: 0.8,
          transform: "rotate(2deg) scale(1.05)",
          boxShadow: 8,
          zIndex: 1000,
        },
        "&.drag-over": {
          backgroundColor: "rgba(25, 118, 210, 0.08)",
          border: "2px dashed #1976d2",
          transform: "scale(1.02)",
          boxShadow: 8,
        },

        "&.flying-in": {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: "translateY(0) scale(1.05)",
          boxShadow: 12,
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          border: "2px solid #4CAF50",
          zIndex: 1001,
          animation: "flyIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        },
        "@keyframes flyIn": {
          "0%": {
            transform: "translateY(-50px) scale(0.9)",
            opacity: 0.6,
          },
          "100%": {
            transform: "translateY(0) scale(1.05)",
            opacity: 1,
          },
        },
      }}
      draggable
      onDragStart={(e) => {
        e.currentTarget.classList.add("dragging");
        onDragStart(e);
      }}
      onDrag={(e) => {
        e.preventDefault();
        // 拖拽过程中让元素变得透明
        e.currentTarget.style.opacity = "0.3";
      }}
      onDragEnd={(e) => {
        e.currentTarget.classList.remove("dragging");
        // 清除内联样式
        e.currentTarget.style.transform = "";
        e.currentTarget.style.transition = "";
        e.currentTarget.style.opacity = "";
        onDragEnd();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isDragging) {
          e.currentTarget.classList.add("drag-over");
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        // 确保只有当鼠标真正离开元素时才移除高亮
        if (!e.currentTarget.contains(e.relatedTarget)) {
          e.currentTarget.classList.remove("drag-over");
        }
        onDragLeave(e);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("drag-over");
        if (isDragging) {
          e.currentTarget.classList.add("flying-in");
          setTimeout(() => {
            e.currentTarget.classList.remove("flying-in");
          }, 400);
        }
        onDrop(e);
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

        {/* 操作按钮 */}
        <Box sx={{ display: "flex", gap: 0.5, ml: 1, flexShrink: 0 }}>
          {onEdit && (
            <IconButton
              aria-label="edit todo"
              onClick={handleEdit}
              size="small"
            >
              <EditIcon />
            </IconButton>
          )}
          {onDelete && (
            <IconButton
              aria-label="delete todo"
              onClick={handleDelete}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          )}
        </Box>
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
