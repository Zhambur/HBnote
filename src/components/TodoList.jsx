import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  List,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import AddIcon from "./mui_local_icons/AddIcon";
import TodoItem from "./TodoItem";
import { v4 as uuidv4 } from "uuid";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState("medium"); // 默认优先级为中
  const [sortBy, setSortBy] = useState("priority"); // 默认按优先级排序
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

  // 优先级选项
  const priorityOptions = [
    { value: "high", label: "高", color: "error" },
    { value: "medium", label: "中", color: "warning" },
    { value: "low", label: "低", color: "success" },
  ];

  useEffect(() => {
    const loadTodos = async () => {
      try {
        console.log("[TodoList] Loading todo items...");
        setIsLoading(true);
        const storedTodos = await window.electronAPI.storeGet("todos");
        console.log(
          "[TodoList] Todo items loading complete:",
          storedTodos ? "Data exists" : "No data"
        );
        setTodos(Array.isArray(storedTodos) ? storedTodos : []);
      } catch (error) {
        console.error("[TodoList] Failed to load todo items:", error);
        setTodos([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodos();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const saveTodos = async () => {
        try {
          console.log("[TodoList] Saving todo items...");
          await window.electronAPI.storeSet("todos", todos);
          console.log("[TodoList] Todo items saved successfully!");
        } catch (error) {
          console.error("[TodoList] Failed to save todo items:", error);
        }
      };

      saveTodos();
    }
  }, [todos, isLoading]);

  const handleAddTodo = () => {
    if (newTodo.trim()) {
      const newTodoItem = {
        id: uuidv4(),
        text: newTodo,
        priority: newTodoPriority,
        completed: false,
        date: new Date().toISOString(),
      };
      setTodos((prevTodos) => [...prevTodos, newTodoItem]);
      setNewTodo("");
      setNewTodoPriority("medium"); // 重置为默认优先级
    }
  };

  const handleToggleTodo = (todoId) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleDeleteTodo = (todoId) => {
    setTodoToDelete(todoId);
    setIsConfirmDialogOpen(true);
  };

  const cancelDelete = () => {
    setIsConfirmDialogOpen(false);
    setTodoToDelete(null);
  };

  const confirmDelete = () => {
    if (todoToDelete) {
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== todoToDelete)
      );
      setIsConfirmDialogOpen(false);
      setTodoToDelete(null);
    }
  };

  // 将待办事项按选择的排序方式排序
  const sortedTodos = [...todos].sort((a, b) => {
    if (sortBy === "priority") {
      // 按优先级排序（高 > 中 > 低）
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[a.priority || "medium"] || 2; // 默认中优先级
      const priorityB = priorityOrder[b.priority || "medium"] || 2;

      if (priorityA !== priorityB) {
        return priorityB - priorityA; // 优先级高的在前
      }

      // 优先级相同时，按创建时间排序（新的在前）
      return new Date(b.date) - new Date(a.date);
    } else {
      // 按创建时间排序（新的在前）
      return new Date(b.date) - new Date(a.date);
    }
  });

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="NewTodo"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
              variant="outlined"
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>优先级</InputLabel>
              <Select
                value={newTodoPriority}
                label="优先级"
                onChange={(e) => setNewTodoPriority(e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>排序方式</InputLabel>
              <Select
                value={sortBy}
                label="排序方式"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="priority">按优先级</MenuItem>
                <MenuItem value="time">按创建时间</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1}>
            <IconButton
              onClick={handleAddTodo}
              color="primary"
              aria-label="add todo"
              sx={{ width: "100%" }}
            >
              <AddIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          loading...
        </Typography>
      ) : todos.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          textAlign="center"
          sx={{ mt: 2 }}
        >
          你很勤快，没有需要做的。
        </Typography>
      ) : (
        <List sx={{ pt: 0 }}>
          {sortedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={handleToggleTodo}
              onDelete={handleDeleteTodo}
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
            确定要删除这个待办事项吗？此操作无法撤销。
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

export default TodoList;
