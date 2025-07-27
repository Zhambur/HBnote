import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  List,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import SaveIcon from "./mui_local_icons/SaveIcon";
import CancelIcon from "./mui_local_icons/CancelIcon";
import NoteItem from "./NoteItem";
import { v4 as uuidv4 } from "uuid";

function Notes() {
  // 改为 useState 初始为空数组，然后在 useEffect 中异步加载数据
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const titleInputRef = useRef(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [noteIdToDeleteInConfirm, setNoteIdToDeleteInConfirm] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // 添加加载状态
  const [dragOverNoteId, setDragOverNoteId] = useState(null); // 跟踪拖拽悬停的笔记ID
  const [draggedNoteId, setDraggedNoteId] = useState(null); // 跟踪正在拖拽的笔记ID
  const [isAnimating, setIsAnimating] = useState(false); // 跟踪是否正在播放放置动画
  const [dropTargetId, setDropTargetId] = useState(null); // 跟踪放置目标ID
  const [dragStartPosition, setDragStartPosition] = useState(null); // 记录拖拽开始位置

  // 组件加载时异步获取笔记
  useEffect(() => {
    const loadNotes = async () => {
      try {
        console.log("[Notes] Loading notes...");
        setIsLoading(true);
        const storedNotes = await window.electronAPI.storeGet("notes");
        console.log(
          "[Notes] Notes loading complete:",
          storedNotes ? "Data exists" : "No data"
        );
        // 确保 storedNotes 是数组
        setNotes(Array.isArray(storedNotes) ? storedNotes : []);
      } catch (error) {
        console.error("[Notes] Failed to load notes:", error);
        setNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, []);

  // 笔记变化时异步保存
  useEffect(() => {
    // 只有当组件已完成初始加载后才保存数据
    if (!isLoading) {
      const saveNotes = async () => {
        try {
          console.log("[Notes] Saving notes...");
          await window.electronAPI.storeSet("notes", notes);
          console.log("[Notes] Notes saved successfully!");
        } catch (error) {
          console.error("[Notes] Failed to save notes:", error);
        }
      };

      saveNotes();
    }
  }, [notes, isLoading]);

  const focusTitleInput = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingNoteId(null);
    setTimeout(focusTitleInput, 0);
  };

  const handleSaveOrUpdate = () => {
    if (title.trim() === "" && content.trim() === "") {
      focusTitleInput();
      return;
    }
    if (editingNoteId !== null) {
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === editingNoteId
            ? { ...note, title, content, date: new Date().toISOString() }
            : note
        )
      );
    } else {
      const newNote = {
        id: uuidv4(),
        title,
        content,
        date: new Date().toISOString(),
      };
      setNotes((prevNotes) => [newNote, ...prevNotes]);
    }
    resetForm();
  };

  const handleEdit = (noteToEdit) => {
    setTitle(noteToEdit.title);
    setContent(noteToEdit.content);
    setEditingNoteId(noteToEdit.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(focusTitleInput, 50);
  };

  const handleDeleteInitiate = (noteIdToDelete) => {
    setNoteIdToDeleteInConfirm(noteIdToDelete);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (noteIdToDeleteInConfirm) {
      setNotes((prevNotes) =>
        prevNotes.filter((note) => note.id !== noteIdToDeleteInConfirm)
      );

      const wasEditingTheDeletedNote =
        editingNoteId === noteIdToDeleteInConfirm;

      setIsConfirmDialogOpen(false);
      setNoteIdToDeleteInConfirm(null);

      try {
        await window.electronAPI?.focusWindow?.();
      } catch (err) {
        console.error("Error focusing window:", err);
      }

      setTimeout(() => {
        if (wasEditingTheDeletedNote) {
          resetForm();
        } else if (!editingNoteId) {
          focusTitleInput();
        } else if (editingNoteId && titleInputRef.current) {
          focusTitleInput();
        }
      }, 50);
    }
  };

  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setNoteIdToDeleteInConfirm(null);
  };

  // 拖拽功能
  const handleDragStart = (e, noteId) => {
    // 记录拖拽开始位置
    const rect = e.target.getBoundingClientRect();
    setDragStartPosition({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });

    // 使用更结构化的数据传递
    const dragData = {
      type: "note",
      id: noteId,
      index: notes.findIndex((note) => note.id === noteId),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";

    // 设置拖拽时的视觉反馈
    if (e.dataTransfer.setDragImage) {
      const dragImage = e.target.cloneNode(true);
      dragImage.style.opacity = "0.8";
      dragImage.style.transform = "rotate(2deg) scale(0.95)";
      dragImage.style.position = "absolute";
      dragImage.style.top = "-1000px";
      dragImage.style.left = "-1000px";
      document.body.appendChild(dragImage);

      // 计算鼠标在元素内的相对位置
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;

      e.dataTransfer.setDragImage(dragImage, offsetX, offsetY);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }

    setDraggedNoteId(noteId);
  };

  const handleDragOver = (e, noteId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedNoteId && draggedNoteId !== noteId) {
      setDragOverNoteId(noteId);
    }
  };

  const handleDrop = (e, targetNoteId) => {
    e.preventDefault();
    setDragOverNoteId(null); // 清除拖拽悬停状态
    setDropTargetId(targetNoteId); // 设置放置目标

    let draggedNoteId;
    try {
      const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
      draggedNoteId = dragData.id;
    } catch (error) {
      // 兼容旧的数据格式
      draggedNoteId = e.dataTransfer.getData("text/plain");
    }

    if (draggedNoteId === targetNoteId) {
      setDraggedNoteId(null);
      setDropTargetId(null);
      return;
    }

    const draggedIndex = notes.findIndex((note) => note.id === draggedNoteId);
    const targetIndex = notes.findIndex((note) => note.id === targetNoteId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedNoteId(null);
      setDropTargetId(null);
      return;
    }

    // 开始放置动画
    setIsAnimating(true);

    // 延迟更新数据，让动画先播放
    setTimeout(() => {
      const newNotes = [...notes];
      const [draggedNote] = newNotes.splice(draggedIndex, 1);
      newNotes.splice(targetIndex, 0, draggedNote);

      setNotes(newNotes);
      setDraggedNoteId(null);
      setDropTargetId(null);
      setDragStartPosition(null);
      setIsAnimating(false);
    }, 400); // 与飞入动画时长匹配
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {editingNoteId ? "编辑笔记" : "创建新笔记"}
        </Typography>
        <TextField
          inputRef={titleInputRef}
          fullWidth
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          multiline
          rows={4}
          label="内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveOrUpdate}
            startIcon={<SaveIcon />}
          >
            {editingNoteId ? "更新笔记" : "保存笔记"}
          </Button>
          {editingNoteId && (
            <Button
              variant="outlined"
              onClick={resetForm}
              startIcon={<CancelIcon />}
            >
              取消
            </Button>
          )}
        </Box>
      </Paper>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          loading...
        </Typography>
      ) : notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          暂无笔记，快来占坑！
        </Typography>
      ) : (
        <List
          sx={{ pt: 0 }}
          onDragOver={(e) => {
            e.preventDefault(); // 阻止默认行为，避免拖拽重影
          }}
        >
          {notes.map((note, index) => (
            <NoteItem
              key={note.id}
              note={note}
              index={index}
              isDragOver={dragOverNoteId === note.id}
              isDragging={draggedNoteId === note.id}
              isAnimating={isAnimating}
              isDropTarget={dropTargetId === note.id}
              onEdit={handleEdit}
              onDelete={handleDeleteInitiate}
              onDragStart={(e) => handleDragStart(e, note.id)}
              onDragOver={(e) => handleDragOver(e, note.id)}
              onDragLeave={() => setDragOverNoteId(null)}
              onDragEnd={() => {
                setDragOverNoteId(null);
                setDraggedNoteId(null);
              }}
              onDrop={(e) => handleDrop(e, note.id)}
            />
          ))}
        </List>
      )}

      <Dialog
        open={isConfirmDialogOpen}
        onClose={cancelDelete}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"确认删除"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            确定要删除这条笔记吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDelete}>取消</Button>
          <Button onClick={confirmDelete} color="error" autoFocus>
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Notes;
