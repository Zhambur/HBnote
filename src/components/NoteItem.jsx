import React from "react";
import { ListItem, Paper, Box, Typography, IconButton } from "@mui/material";
import EditIcon from "./mui_local_icons/EditIcon";
import DeleteIcon from "./mui_local_icons/DeleteIcon";

function NoteItem({ note, onEdit, onDelete }) {
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
      <Paper sx={{ p: 2, width: "100%", position: "relative" }}>
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
