import React from "react";
import { ListItem, Paper, Box, Typography, IconButton } from "@mui/material";
import EditIcon from "./mui_local_icons/EditIcon";
import DeleteIcon from "./mui_local_icons/DeleteIcon";

function NoteItem({
  note,
  index,
  isDragOver,
  isDragging,
  isAnimating,
  isDropTarget,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}) {
  // 简单的日期格式化，可以根据需要替换为更完善的库如 date-fns 或 moment.js
  const formatDate = (isoString) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleString();
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  return (
    <ListItem sx={{ p: 0, mb: 1 }}>
      <Paper
        sx={{
          p: 2,
          width: "100%",
          position: "relative",
          cursor: "grab",
          transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          userSelect: "none", // 防止拖拽时选中文本
          transform: isDragOver ? "translateY(15px)" : "translateY(0)",
          marginBottom: isDragOver ? "30px" : "8px",
          opacity: isDragging && isAnimating ? 0.4 : 1,
          "&:active": {
            cursor: "grabbing",
          },
          "&:hover": {
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
        {(onEdit || onDelete) && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              gap: 0.5,
            }}
          >
            {onEdit && (
              <IconButton
                size="small"
                onClick={() => onEdit(note)}
                aria-label="edit note"
              >
                <EditIcon />
              </IconButton>
            )}
            {onDelete && (
              <IconButton
                size="small"
                onClick={() => onDelete(note.id)}
                aria-label="delete note"
              >
                <DeleteIcon />
              </IconButton>
            )}
          </Box>
        )}
        <Box
          sx={{
            mb: 1,
            fontWeight: "bold",
            fontSize: "1.1rem",
            pr:
              onEdit || onDelete
                ? "60px"
                : 0 /* Ensure enough space for buttons */,
          }}
        >
          {note.title || "(无标题)"}
        </Box>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: "pre-wrap",
            color: "text.secondary",
            mb: 1,
            wordBreak: "break-word",
          }}
        >
          {note.content}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.disabled", display: "block" }}
        >
          {formatDate(note.date)}
        </Typography>
      </Paper>
    </ListItem>
  );
}

export default NoteItem;
