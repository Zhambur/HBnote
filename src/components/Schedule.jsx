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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import zhCN from "date-fns/locale/zh-CN";
import SaveIcon from "./mui_local_icons/SaveIcon";
import CancelIcon from "./mui_local_icons/CancelIcon";
import EditIcon from "./mui_local_icons/EditIcon";
import DeleteIcon from "./mui_local_icons/DeleteIcon";
import { v4 as uuidv4 } from "uuid";

function Schedule() {
  const [schedules, setSchedules] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("work");
  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [scheduleIdToDelete, setScheduleIdToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const titleInputRef = useRef(null);

  // 优先级选项
  const priorityOptions = [
    { value: "high", label: "高", color: "error" },
    { value: "medium", label: "中", color: "warning" },
    { value: "low", label: "低", color: "success" },
  ];

  // 分类选项
  const categoryOptions = [
    { value: "work", label: "工作", color: "primary" },
    { value: "study", label: "学习", color: "secondary" },
    { value: "personal", label: "娱乐", color: "info" },
    { value: "health", label: "健康", color: "success" },
    { value: "entertainment", label: "其他", color: "warning" },
  ];

  // 组件加载时异步获取日程
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        console.log("[Schedule] Loading schedules...");
        setIsLoading(true);
        const storedSchedules = await window.electronAPI.storeGet("schedules");
        console.log(
          "[Schedule] Schedules loading complete:",
          storedSchedules ? "Data exists" : "No data"
        );
        setSchedules(Array.isArray(storedSchedules) ? storedSchedules : []);
      } catch (error) {
        console.error("[Schedule] Failed to load schedules:", error);
        setSchedules([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedules();
  }, []);

  // 日程变化时异步保存
  useEffect(() => {
    if (!isLoading) {
      const saveSchedules = async () => {
        try {
          console.log("[Schedule] Saving schedules...");
          await window.electronAPI.storeSet("schedules", schedules);
          console.log("[Schedule] Schedules saved successfully!");
        } catch (error) {
          console.error("[Schedule] Failed to save schedules:", error);
        }
      };

      saveSchedules();
    }
  }, [schedules, isLoading]);

  // 初始化日期时间输入框
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0]; // YYYY-MM-DD
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setDate(formattedDate);
    setStartTime(formattedTime);
    setEndTime(formattedTime);
  }, []);

  // 当编辑现有日程时，设置表单数据
  useEffect(() => {
    if (editingScheduleId) {
      const schedule = schedules.find((s) => s.id === editingScheduleId);
      if (schedule) {
        const scheduleDate = new Date(schedule.date);
        const formattedDate = scheduleDate.toISOString().split("T")[0];
        const startTimeObj = new Date(schedule.startTime);
        const endTimeObj = new Date(schedule.endTime);

        const startHours = String(startTimeObj.getHours()).padStart(2, "0");
        const startMinutes = String(startTimeObj.getMinutes()).padStart(2, "0");
        const endHours = String(endTimeObj.getHours()).padStart(2, "0");
        const endMinutes = String(endTimeObj.getMinutes()).padStart(2, "0");

        setTitle(schedule.title);
        setDescription(schedule.description);
        setDate(formattedDate);
        setStartTime(`${startHours}:${startMinutes}`);
        setEndTime(`${endHours}:${endMinutes}`);
        setPriority(schedule.priority);
        setCategory(schedule.category);
      }
    }
  }, [editingScheduleId, schedules]);

  const focusTitleInput = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");

    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    const hours = String(today.getHours()).padStart(2, "0");
    const minutes = String(today.getMinutes()).padStart(2, "0");
    const formattedTime = `${hours}:${minutes}`;

    setDate(formattedDate);
    setStartTime(formattedTime);
    setEndTime(formattedTime);
    setPriority("medium");
    setCategory("work");
    setEditingScheduleId(null);
    setTimeout(focusTitleInput, 0);
  };

  // 验证时间是否有效
  const isValidTime = () => {
    if (!date || !startTime || !endTime) {
      return false;
    }

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    return endDateTime > startDateTime;
  };

  // 获取开始和结束时间的Date对象
  const getStartDateTime = () => {
    return new Date(`${date}T${startTime}`);
  };

  const getEndDateTime = () => {
    return new Date(`${date}T${endTime}`);
  };

  const handleSaveOrUpdate = () => {
    if (title.trim() === "") {
      focusTitleInput();
      return;
    }

    if (!isValidTime()) {
      alert("结束时间必须晚于开始时间！");
      return;
    }

    const startDateTime = getStartDateTime();
    const endDateTime = getEndDateTime();

    if (editingScheduleId !== null) {
      setSchedules((prevSchedules) =>
        prevSchedules.map((schedule) =>
          schedule.id === editingScheduleId
            ? {
                ...schedule,
                title,
                description,
                date,
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                priority,
                category,
                updatedAt: new Date().toISOString(),
              }
            : schedule
        )
      );
    } else {
      const newSchedule = {
        id: uuidv4(),
        title,
        description,
        date,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        priority,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSchedules((prevSchedules) => [newSchedule, ...prevSchedules]);
    }
    resetForm();
  };

  const handleEdit = (scheduleToEdit) => {
    setEditingScheduleId(scheduleToEdit.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(focusTitleInput, 50);
  };

  const handleDeleteInitiate = (scheduleIdToDelete) => {
    setScheduleIdToDelete(scheduleIdToDelete);
    setIsConfirmDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (scheduleIdToDelete) {
      setSchedules((prevSchedules) =>
        prevSchedules.filter((schedule) => schedule.id !== scheduleIdToDelete)
      );

      const wasEditingTheDeletedSchedule =
        editingScheduleId === scheduleIdToDelete;

      setIsConfirmDialogOpen(false);
      setScheduleIdToDelete(null);

      try {
        await window.electronAPI?.focusWindow?.();
      } catch (err) {
        console.error("Error focusing window:", err);
      }

      setTimeout(() => {
        if (wasEditingTheDeletedSchedule) {
          resetForm();
        } else if (!editingScheduleId) {
          focusTitleInput();
        } else if (editingScheduleId && titleInputRef.current) {
          focusTitleInput();
        }
      }, 50);
    }
  };

  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setScheduleIdToDelete(null);
  };

  // 将日程按日期和时间排序
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);

    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }

    return new Date(a.startTime) - new Date(b.startTime);
  });

  // 按日期分组日程
  const groupedSchedules = sortedSchedules.reduce((groups, schedule) => {
    const date = schedule.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(schedule);
    return groups;
  }, {});

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "今天";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "明天";
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    }
  };

  // 格式化时间显示
  const formatTime = (timeString) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    const option = priorityOptions.find((opt) => opt.value === priority);
    return option ? option.color : "default";
  };

  // 获取分类颜色
  const getCategoryColor = (category) => {
    const option = categoryOptions.find((opt) => opt.value === category);
    return option ? option.color : "default";
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhCN}>
      <Box>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {editingScheduleId ? "编辑日程" : "创建新日程"}
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
            rows={2}
            label="描述"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="日期"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
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
                label="开始时间"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
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
                label="结束时间"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>优先级</InputLabel>
                <Select
                  value={priority}
                  label="优先级"
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {priorityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>分类</InputLabel>
                <Select
                  value={category}
                  label="分类"
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveOrUpdate}
              startIcon={<SaveIcon />}
            >
              {editingScheduleId ? "更新日程" : "保存日程"}
            </Button>
            {editingScheduleId && (
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
        ) : sortedSchedules.length === 0 ? (
          <Typography variant="body2" color="text.secondary" textAlign="center">
            暂无日程安排，开始规划你的一天吧！
          </Typography>
        ) : (
          <Box>
            {Object.entries(groupedSchedules).map(([date, daySchedules]) => (
              <Paper key={date} sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  {formatDate(date)}
                </Typography>
                <List sx={{ pt: 0 }}>
                  {daySchedules.map((schedule) => (
                    <Paper
                      key={schedule.id}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderLeft: 4,
                        borderColor: `${getPriorityColor(
                          schedule.priority
                        )}.main`,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {schedule.title}
                          </Typography>
                          {schedule.description && (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              {schedule.description}
                            </Typography>
                          )}
                          <Box
                            sx={{
                              display: "flex",
                              gap: 1,
                              mb: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              label={`${formatTime(
                                schedule.startTime
                              )} - ${formatTime(schedule.endTime)}`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={
                                priorityOptions.find(
                                  (p) => p.value === schedule.priority
                                )?.label
                              }
                              color={getPriorityColor(schedule.priority)}
                              size="small"
                            />
                            <Chip
                              label={
                                categoryOptions.find(
                                  (c) => c.value === schedule.category
                                )?.label
                              }
                              color={getCategoryColor(schedule.category)}
                              size="small"
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          <Tooltip title="编辑">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(schedule)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteInitiate(schedule.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </List>
              </Paper>
            ))}
          </Box>
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
              确定要删除这个日程吗？此操作无法撤销。
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
    </LocalizationProvider>
  );
}

export default Schedule;
