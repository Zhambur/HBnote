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
} from "@mui/material";
import AddIcon from "./mui_local_icons/AddIcon";
import TodoItem from "./TodoItem";
import { v4 as uuidv4 } from "uuid";

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [todoToDelete, setTodoToDelete] = useState(null);

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
        completed: false,
        date: new Date().toISOString(),
      };
      setTodos((prevTodos) => [...prevTodos, newTodoItem]);
      setNewTodo("");
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

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            label="NewTodo"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddTodo()}
            variant="outlined"
            size="small"
          />
          <IconButton
            onClick={handleAddTodo}
            color="primary"
            aria-label="add todo"
          >
            <AddIcon />
          </IconButton>
        </Box>
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
          {todos.map((todo) => (
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
