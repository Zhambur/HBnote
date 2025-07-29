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
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Grid,
  Switch,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import zhCN from "date-fns/locale/zh-CN";
import SaveIcon from "./mui_local_icons/SaveIcon";
import CancelIcon from "./mui_local_icons/CancelIcon";
import DDLItem from "./DDLItem";
import FolderManager from "./FolderManager";
import FolderSelector from "./FolderSelector";
import FolderView from "./FolderView";
import { v4 as uuidv4 } from "uuid";

function DDL() {
  const [ddls, setDdls] = useState([]);
  const [folders, setFolders] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("default");

  // 日期时间输入替代DateTimePicker
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");

  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(30); // 默认提前30分钟
  const [editingDdlId, setEditingDdlId] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [ddlIdToDeleteInConfirm, setDdlIdToDeleteInConfirm] = useState(null);
  const [isDateErrorDialogOpen, setIsDateErrorDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState(false);
  const [useFolderView, setUseFolderView] = useState(false);
  const titleInputRef = useRef(null);

  // 组件加载时异步获取DDL项目和文件夹
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("[DDL] Loading ddls and folders...");
        setIsLoading(true);

        // 加载DDL项目
        const storedDdls = await window.electronAPI.storeGet("ddls");
        console.log(
          "[DDL] DDLs loading complete:",
          storedDdls ? "Data exists" : "No data"
        );

        // 加载文件夹
        const storedFolders = await window.electronAPI.storeGet("ddlFolders");
        console.log(
          "[DDL] Folders loading complete:",
          storedFolders ? "Data exists" : "No data"
        );

        // 确保数据是数组
        const ddlsData = Array.isArray(storedDdls) ? storedDdls : [];
        const foldersData = Array.isArray(storedFolders) ? storedFolders : [];

        // 如果没有文件夹数据，创建默认文件夹
        if (foldersData.length === 0) {
          const defaultFolders = [
            {
              id: "default",
              name: "默认文件夹",
              color: "#1976d2",
              order: 0,
              type: "ddls",
              createdAt: new Date().toISOString(),
            },
          ];
          setFolders(defaultFolders);
          await window.electronAPI.storeSet("ddlFolders", defaultFolders);
        } else {
          setFolders(foldersData);
        }

        // 为没有文件夹ID的DDL项目设置默认文件夹
        const processedDdls = ddlsData.map((ddl) => ({
          ...ddl,
          folderId: ddl.folderId || "default",
        }));

        setDdls(processedDdls);
      } catch (error) {
        console.error("[DDL] Failed to load data:", error);
        setDdls([]);
        setFolders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // DDL变化时异步保存
  useEffect(() => {
    if (!isLoading) {
      const saveDdls = async () => {
        try {
          console.log("[DDL] Saving ddls...");
          await window.electronAPI.storeSet("ddls", ddls);
          console.log("[DDL] DDLs saved successfully!");
        } catch (error) {
          console.error("[DDL] Failed to save ddls:", error);
        }
      };

      saveDdls();
    }
  }, [ddls, isLoading]);

  // 文件夹变化时异步保存
  useEffect(() => {
    if (!isLoading && folders.length > 0) {
      const saveFolders = async () => {
        try {
          console.log("[DDL] Saving folders...");
          await window.electronAPI.storeSet("ddlFolders", folders);
          console.log("[DDL] Folders saved successfully!");
        } catch (error) {
          console.error("[DDL] Failed to save folders:", error);
        }
      };

      saveFolders();
    }
  }, [folders, isLoading]);

  // 初始化日期时间输入框
  useEffect(() => {
    // 设置默认日期为明天，默认时间为当前时间
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formattedDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
    const hours = String(tomorrow.getHours()).padStart(2, "0");
    const minutes = String(tomorrow.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setDeadlineDate(formattedDate);
    setDeadlineTime(formattedTime);
  }, []);

  // 当编辑现有DDL时，设置日期和时间输入框
  useEffect(() => {
    if (editingDdlId) {
      const ddl = ddls.find((d) => d.id === editingDdlId);
      if (ddl) {
        const deadlineObj = new Date(ddl.deadline);
        const formattedDate = deadlineObj.toISOString().split("T")[0]; // YYYY-MM-DD
        const hours = String(deadlineObj.getHours()).padStart(2, "0");
        const minutes = String(deadlineObj.getMinutes()).padStart(2, "0");
        const formattedTime = `${hours}:${minutes}`;

        setDeadlineDate(formattedDate);
        setDeadlineTime(formattedTime);
      }
    }
  }, [editingDdlId, ddls]);

  // 处理提醒功能
  useEffect(() => {
    // 添加日志显示所有DDL的提醒状态
    console.log(
      "[DDL] 当前DDL列表:",
      ddls.map((d) => ({
        id: d.id.substring(0, 8),
        title: d.title,
        deadline: new Date(d.deadline).toLocaleString(),
        reminder: d.reminder,
        reminderTime: d.reminderTime,
        reminderSent: d.reminderSent,
      }))
    );

    // 检查通知权限
    if ("Notification" in window) {
      console.log("[DDL] 通知权限状态:", Notification.permission);
      if (
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        // 请求权限
        Notification.requestPermission().then((permission) => {
          console.log("[DDL] 通知权限请求结果:", permission);
        });
      }
    } else {
      console.warn("[DDL] 浏览器不支持通知API");
    }

    // 创建一个检查是否需要提醒的函数
    const checkReminders = () => {
      console.log("[DDL] 检查提醒...");
      const now = new Date();

      // 1分钟后的测试通知
      if (!window._testNotificationSent) {
        console.log("[DDL] 计划在10秒后发送测试通知");
        setTimeout(() => {
          console.log("[DDL] 发送测试通知");
          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            new Notification("DDL测试通知", {
              body: "这是一条测试通知，确认提醒功能正常工作",
            });
            window._testNotificationSent = true;
          } else {
            console.warn(
              "[DDL] 无法发送测试通知，权限:",
              Notification.permission
            );
          }
        }, 10000); // 10秒后发送测试通知
        window._testNotificationSent = true;
      }

      ddls.forEach((ddl) => {
        if (ddl.reminder) {
          const deadlineDate = new Date(ddl.deadline);
          const reminderDate = new Date(
            deadlineDate.getTime() - ddl.reminderTime * 60 * 1000
          );

          // 打印日志
          console.log(
            `[DDL] 检查DDL提醒 - ID: ${ddl.id.substring(0, 8)}, ` +
              `当前时间: ${now.toISOString()}, ` +
              `提醒时间: ${reminderDate.toISOString()}, ` +
              `时差(ms): ${Math.abs(now - reminderDate)}, ` +
              `已提醒: ${ddl.reminderSent}`
          );

          // 如果当前时间在提醒时间附近（±30秒内），且没有被标记为已提醒
          if (Math.abs(now - reminderDate) < 30 * 1000 && !ddl.reminderSent) {
            console.log(`[DDL] 触发提醒 - 标题: ${ddl.title}`);

            // 显示通知
            if ("Notification" in window) {
              console.log(
                `[DDL] 尝试发送通知，权限: ${Notification.permission}`
              );

              if (Notification.permission === "granted") {
                try {
                  const notification = new Notification("DDL提醒", {
                    body: `${ddl.title} 将在 ${ddl.reminderTime} 分钟后截止！`,
                    icon: "/favicon.ico",
                  });

                  notification.onclick = () => {
                    console.log("[DDL] 通知被点击");
                    window.focus();
                  };

                  console.log("[DDL] 通知已发送");

                  // 标记这个DDL已经提醒过了
                  setDdls((prevDdls) =>
                    prevDdls.map((item) =>
                      item.id === ddl.id
                        ? { ...item, reminderSent: true }
                        : item
                    )
                  );
                } catch (err) {
                  console.error("[DDL] 发送通知失败:", err);
                }
              } else {
                console.warn(
                  `[DDL] 无法发送通知，权限不足: ${Notification.permission}`
                );
              }
            }
          }
        }
      });
    };

    // 立即检查一次
    checkReminders();

    // 每分钟检查一次是否需要提醒
    const interval = setInterval(checkReminders, 30000); // 改为每30秒检查一次

    // 组件卸载时清除interval
    return () => {
      console.log("[DDL] 清除提醒检查定时器");
      clearInterval(interval);
    };
  }, [ddls]);

  const focusTitleInput = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setSelectedFolderId("default");

    // 重置日期和时间
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const formattedDate = tomorrow.toISOString().split("T")[0]; // YYYY-MM-DD
    const hours = String(tomorrow.getHours()).padStart(2, "0");
    const minutes = String(tomorrow.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setDeadlineDate(formattedDate);
    setDeadlineTime(formattedTime);

    setReminder(false);
    setReminderTime(30);
    setEditingDdlId(null);
    setTimeout(focusTitleInput, 0);
  };

  // 验证截止日期是否在未来
  const isValidDeadline = () => {
    const now = new Date();

    // 解析日期和时间
    const [year, month, day] = deadlineDate.split("-").map(Number);
    const [hours, minutes] = deadlineTime.split(":").map(Number);

    // JavaScript月份从0开始
    const deadlineObj = new Date(year, month - 1, day, hours, minutes);

    return deadlineObj > now;
  };

  // 获取截止日期Date对象
  const getDeadlineDate = () => {
    const [year, month, day] = deadlineDate.split("-").map(Number);
    const [hours, minutes] = deadlineTime.split(":").map(Number);

    // JavaScript月份从0开始
    return new Date(year, month - 1, day, hours, minutes);
  };

  const handleSaveOrUpdate = () => {
    if (title.trim() === "") {
      focusTitleInput();
      return;
    }

    if (!deadlineDate || !deadlineTime) {
      setIsDateErrorDialogOpen(true);
      return;
    }

    if (!isValidDeadline()) {
      setIsDateErrorDialogOpen(true);
      return;
    }

    const deadlineObj = getDeadlineDate();

    if (editingDdlId !== null) {
      setDdls((prevDdls) =>
        prevDdls.map((ddl) =>
          ddl.id === editingDdlId
            ? {
                ...ddl,
                title,
                content,
                folderId: selectedFolderId,
                deadline: deadlineObj.toISOString(),
                reminder,
                reminderTime,
                date: new Date().toISOString(),
                reminderSent: false, // 重置提醒状态
              }
            : ddl
        )
      );
    } else {
      const newDdl = {
        id: uuidv4(),
        title,
        content,
        folderId: selectedFolderId,
        deadline: deadlineObj.toISOString(),
        reminder,
        reminderTime,
        date: new Date().toISOString(),
        reminderSent: false,
      };
      setDdls((prevDdls) => [newDdl, ...prevDdls]);
    }
    resetForm();
  };

  const handleEdit = (ddlToEdit) => {
    setTitle(ddlToEdit.title);
    setContent(ddlToEdit.content);
    setSelectedFolderId(ddlToEdit.folderId || "default");
    setReminder(ddlToEdit.reminder);
    setReminderTime(ddlToEdit.reminderTime);
    setEditingDdlId(ddlToEdit.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(focusTitleInput, 50);
  };

  const handleDeleteInitiate = (ddlIdToDelete) => {
    setDdlIdToDeleteInConfirm(ddlIdToDelete);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (ddlIdToDeleteInConfirm) {
      setDdls((prevDdls) =>
        prevDdls.filter((ddl) => ddl.id !== ddlIdToDeleteInConfirm)
      );

      const wasEditingTheDeletedDdl = editingDdlId === ddlIdToDeleteInConfirm;

      setIsConfirmDialogOpen(false);
      setDdlIdToDeleteInConfirm(null);

      try {
        await window.electronAPI?.focusWindow?.();
      } catch (err) {
        console.error("Error focusing window:", err);
      }

      setTimeout(() => {
        if (wasEditingTheDeletedDdl) {
          resetForm();
        } else if (!editingDdlId) {
          focusTitleInput();
        } else if (editingDdlId && titleInputRef.current) {
          focusTitleInput();
        }
      }, 50);
    }
  };

  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setDdlIdToDeleteInConfirm(null);
  };

  // 将DDL按截止时间排序（最近的在最前面）
  const sortedDdls = [...ddls].sort((a, b) => {
    return new Date(a.deadline) - new Date(b.deadline);
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              {editingDdlId ? "编辑DDL" : "创建新DDL"}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={useFolderView}
                  onChange={(e) => setUseFolderView(e.target.checked)}
                />
              }
              label="文件夹视图"
            />
          </Box>
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
            rows={2}
            label="内容"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          {/* 使用原生日期时间输入 */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="截止日期"
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="截止时间"
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reminder}
                  onChange={(e) => setReminder(e.target.checked)}
                  name="reminder"
                />
              }
              label="开启提醒"
            />
            {reminder && (
              <FormControl sx={{ minWidth: 120, ml: 2 }}>
                <InputLabel id="reminder-time-label">提前</InputLabel>
                <Select
                  labelId="reminder-time-label"
                  value={reminderTime}
                  label="提前"
                  onChange={(e) => setReminderTime(e.target.value)}
                >
                  <MenuItem value={5}>5分钟</MenuItem>
                  <MenuItem value={15}>15分钟</MenuItem>
                  <MenuItem value={30}>30分钟</MenuItem>
                  <MenuItem value={60}>1小时</MenuItem>
                  <MenuItem value={120}>2小时</MenuItem>
                  <MenuItem value={1440}>1天</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
          <FolderSelector
            folders={folders}
            selectedFolderId={selectedFolderId}
            onFolderChange={setSelectedFolderId}
            onManageFolders={() => setIsFolderManagerOpen(true)}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveOrUpdate}
              startIcon={<SaveIcon />}
            >
              {editingDdlId ? "更新DDL" : "保存DDL"}
            </Button>
            {editingDdlId && (
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
        ) : sortedDdls.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            暂无DDL，请尽情享受无DDL的美好时光~
          </Typography>
        ) : useFolderView ? (
          <FolderView
            folders={folders}
            items={sortedDdls}
            renderItem={(ddl, index, folderId) => (
              <DDLItem
                key={ddl.id}
                ddl={ddl}
                onEdit={handleEdit}
                onDelete={handleDeleteInitiate}
              />
            )}
            type="ddls"
          />
        ) : (
          <List sx={{ pt: 0 }}>
            {sortedDdls.map((ddl) => (
              <DDLItem
                key={ddl.id}
                ddl={ddl}
                onEdit={handleEdit}
                onDelete={handleDeleteInitiate}
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
              确定要删除这个DDL吗？此操作无法撤销。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>取消</Button>
            <Button onClick={confirmDelete} color="error" autoFocus>
              删除
            </Button>
          </DialogActions>
        </Dialog>

        {/* 日期错误对话框 */}
        <Dialog
          open={isDateErrorDialogOpen}
          onClose={() => setIsDateErrorDialogOpen(false)}
          aria-labelledby="date-error-dialog-title"
          aria-describedby="date-error-dialog-description"
        >
          <DialogTitle id="date-error-dialog-title">{"日期错误"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="date-error-dialog-description">
              截止日期必须在未来时间！
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsDateErrorDialogOpen(false)}
              color="primary"
              autoFocus
            >
              确定
            </Button>
          </DialogActions>
        </Dialog>

        <FolderManager
          open={isFolderManagerOpen}
          onClose={() => setIsFolderManagerOpen(false)}
          folders={folders}
          onFoldersChange={setFolders}
          type="ddls"
        />
      </Box>
    </LocalizationProvider>
  );
}

export default DDL;
