import React, { useState, useEffect } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import EditIcon from "./mui_local_icons/EditIcon";
import DeleteIcon from "./mui_local_icons/DeleteIcon";
import AddIcon from "./mui_local_icons/AddIcon";
import { v4 as uuidv4 } from "uuid";

function FolderManager({
  open,
  onClose,
  folders,
  onFoldersChange,
  type = "notes", // "notes", "todos", "ddls"
}) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#1976d2");
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderColor, setEditFolderColor] = useState("#1976d2");

  const colorOptions = [
    { value: "#1976d2", label: "蓝色" },
    { value: "#d32f2f", label: "红色" },
    { value: "#388e3c", label: "绿色" },
    { value: "#f57c00", label: "橙色" },
    { value: "#7b1fa2", label: "紫色" },
    { value: "#c2185b", label: "粉色" },
    { value: "#5d4037", label: "棕色" },
    { value: "#424242", label: "灰色" },
  ];

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      const newFolder = {
        id: uuidv4(),
        name: newFolderName.trim(),
        color: newFolderColor,
        order: folders.length,
        type: type,
        createdAt: new Date().toISOString(),
      };

      const updatedFolders = [...folders, newFolder];
      onFoldersChange(updatedFolders);

      setNewFolderName("");
      setNewFolderColor("#1976d2");
      setIsCreateDialogOpen(false);
    }
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setEditFolderColor(folder.color);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editFolderName.trim() && editingFolder) {
      const updatedFolders = folders.map((folder) =>
        folder.id === editingFolder.id
          ? { ...folder, name: editFolderName.trim(), color: editFolderColor }
          : folder
      );

      onFoldersChange(updatedFolders);
      setIsEditDialogOpen(false);
      setEditingFolder(null);
      setEditFolderName("");
      setEditFolderColor("#1976d2");
    }
  };

  const handleDeleteFolder = (folderId) => {
    // 不允许删除默认文件夹和已完成事项文件夹
    if (folderId === "default" || folderId === "completed") {
      return;
    }

    const updatedFolders = folders.filter((folder) => folder.id !== folderId);
    onFoldersChange(updatedFolders);
  };

  const handleCancelEdit = () => {
    setIsEditDialogOpen(false);
    setEditingFolder(null);
    setEditFolderName("");
    setEditFolderColor("#1976d2");
  };

  const handleCancelCreate = () => {
    setIsCreateDialogOpen(false);
    setNewFolderName("");
    setNewFolderColor("#1976d2");
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          管理文件夹
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsCreateDialogOpen(true)}
            sx={{ float: "right" }}
          >
            新建文件夹
          </Button>
        </DialogTitle>
        <DialogContent>
          <List>
            {folders.map((folder) => (
              <ListItem key={folder.id} divider>
                <Box
                  sx={{ display: "flex", alignItems: "center", width: "100%" }}
                >
                  <Chip
                    label={folder.name}
                    sx={{
                      backgroundColor: folder.color,
                      color: "white",
                      mr: 2,
                    }}
                  />
                  <ListItemText
                    primary={folder.name}
                    secondary={
                      folder.id === "default"
                        ? "默认文件夹"
                        : folder.id === "completed"
                        ? "已完成事项"
                        : `创建于 ${new Date(
                            folder.createdAt
                          ).toLocaleDateString()}`
                    }
                  />
                  {folder.id !== "default" && folder.id !== "completed" && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleEditFolder(folder)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteFolder(folder.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 创建文件夹对话框 */}
      <Dialog open={isCreateDialogOpen} onClose={handleCancelCreate}>
        <DialogTitle>新建文件夹</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件夹名称"
            fullWidth
            variant="outlined"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>文件夹颜色</InputLabel>
            <Select
              value={newFolderColor}
              label="文件夹颜色"
              onChange={(e) => setNewFolderColor(e.target.value)}
            >
              {colorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: option.value,
                        borderRadius: "50%",
                        mr: 1,
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelCreate}>取消</Button>
          <Button onClick={handleCreateFolder} variant="contained">
            创建
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑文件夹对话框 */}
      <Dialog open={isEditDialogOpen} onClose={handleCancelEdit}>
        <DialogTitle>编辑文件夹</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件夹名称"
            fullWidth
            variant="outlined"
            value={editFolderName}
            onChange={(e) => setEditFolderName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth>
            <InputLabel>文件夹颜色</InputLabel>
            <Select
              value={editFolderColor}
              label="文件夹颜色"
              onChange={(e) => setEditFolderColor(e.target.value)}
            >
              {colorOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: option.value,
                        borderRadius: "50%",
                        mr: 1,
                      }}
                    />
                    {option.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEdit}>取消</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default FolderManager;
