import React, { useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "./mui_local_icons/EditIcon";

function FolderSelector({
  folders,
  selectedFolderId,
  onFolderChange,
  onManageFolders,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (event) => {
    onFolderChange(event.target.value);
  };

  const getFolderById = (folderId) => {
    return folders.find((folder) => folder.id === folderId);
  };

  const selectedFolder = getFolderById(selectedFolderId);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <FormControl fullWidth size="small" disabled={disabled}>
        <InputLabel>文件夹</InputLabel>
        <Select
          value={selectedFolderId || "default"}
          label="文件夹"
          onChange={handleChange}
          renderValue={(value) => {
            const folder = getFolderById(value);
            return (
              <Chip
                label={folder ? folder.name : "默认文件夹"}
                size="small"
                sx={{
                  backgroundColor: folder ? folder.color : "#1976d2",
                  color: "white",
                }}
              />
            );
          }}
        >
          {folders.map((folder) => (
            <MenuItem key={folder.id} value={folder.id}>
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <Chip
                  label={folder.name}
                  size="small"
                  sx={{
                    backgroundColor: folder.color,
                    color: "white",
                    mr: 1,
                  }}
                />
                {folder.id === "default" && "（默认）"}
                {folder.id === "completed" && "（已完成）"}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Tooltip title="管理文件夹">
        <IconButton onClick={onManageFolders} disabled={disabled} size="small">
          <EditIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default FolderSelector;
