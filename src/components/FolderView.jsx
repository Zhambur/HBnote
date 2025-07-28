import React, { useState } from "react";
import {
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Chip,
  IconButton,
  Collapse,
  List,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

function FolderView({
  folders,
  items,
  renderItem,
  onItemMove,
  showCompleted = true, // 仅用于TodoList
  type = "notes", // "notes", "todos", "ddls"
}) {
  const [expandedFolders, setExpandedFolders] = useState(new Set(["default"]));

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getItemsInFolder = (folderId) => {
    const folderItems = items.filter((item) => item.folderId === folderId);

    // 如果是TodoList，对已完成文件夹中的项目按完成时间排序
    if (type === "todos" && folderId === "completed") {
      return folderItems.sort((a, b) => {
        const aCompletedTime = a.completedAt || a.date;
        const bCompletedTime = b.completedAt || b.date;
        return new Date(bCompletedTime) - new Date(aCompletedTime);
      });
    }

    // 对于其他文件夹，按创建时间排序（新的在前）
    return folderItems.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getFolderById = (folderId) => {
    return folders.find((folder) => folder.id === folderId);
  };

  // 过滤要显示的文件夹
  const visibleFolders = folders.filter((folder) => {
    if (type === "todos" && folder.id === "completed") {
      return showCompleted;
    }
    return true;
  });

  // 按文件夹顺序排序
  const sortedFolders = [...visibleFolders].sort((a, b) => {
    // 默认文件夹始终在最前面
    if (a.id === "default") return -1;
    if (b.id === "default") return 1;

    // 已完成文件夹在最后（仅TodoList）
    if (type === "todos") {
      if (a.id === "completed") return 1;
      if (b.id === "completed") return -1;
    }

    // 其他按order排序
    return (a.order || 0) - (b.order || 0);
  });

  return (
    <Box>
      {sortedFolders.map((folder) => {
        const folderItems = getItemsInFolder(folder.id);
        const isExpanded = expandedFolders.has(folder.id);

        return (
          <Accordion
            key={folder.id}
            expanded={isExpanded}
            onChange={() => toggleFolder(folder.id)}
            sx={{
              mb: 1,
              "&:before": {
                display: "none",
              },
            }}
          >
            <AccordionSummary
              expandIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{
                backgroundColor: folder.color + "10",
                borderLeft: `4px solid ${folder.color}`,
                "&:hover": {
                  backgroundColor: folder.color + "20",
                },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <Chip
                  label={folder.name}
                  size="small"
                  sx={{
                    backgroundColor: folder.color,
                    color: "white",
                    mr: 2,
                  }}
                />
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  {folder.name}
                  {folder.id === "default" && "（默认）"}
                  {folder.id === "completed" && "（已完成）"}
                </Typography>
                <Chip
                  label={folderItems.length}
                  size="small"
                  variant="outlined"
                  sx={{ ml: "auto" }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Collapse in={isExpanded}>
                <List sx={{ pt: 0 }}>
                  {folderItems.map((item, index) =>
                    renderItem(item, index, folder.id)
                  )}
                </List>
              </Collapse>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
}

export default FolderView;
