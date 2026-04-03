import React, { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Circle, Trash2, Edit2, X } from "lucide-react";
import { 
  useUpdateTodo, 
  useDeleteTodo, 
  getGetTodoStatsQueryKey, 
  getListTodosQueryKey, 
  Todo 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TodoItemProps {
  todo: Todo;
}

export function TodoItem({ todo }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
  };

  const handleToggle = () => {
    updateTodo.mutate(
      { id: todo.id, data: { completed: !todo.completed } },
      { onSuccess: invalidateQueries }
    );
  };

  const handleDelete = () => {
    deleteTodo.mutate(
      { id: todo.id },
      { onSuccess: invalidateQueries }
    );
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      setEditTitle(todo.title);
      setIsEditing(false);
      return;
    }
    
    if (editTitle !== todo.title) {
      updateTodo.mutate(
        { id: todo.id, data: { title: editTitle.trim() } },
        { 
          onSuccess: () => {
            setIsEditing(false);
            invalidateQueries();
          } 
        }
      );
    } else {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSaveEdit();
    if (e.key === "Escape") {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  return (
    <div 
      className={cn(
        "group flex items-center justify-between gap-3 p-3 sm:p-4 rounded-md border border-transparent transition-all duration-200",
        "hover:bg-card hover:border-border hover:shadow-sm",
        todo.completed && "opacity-60"
      )}
      data-testid={`todo-item-${todo.id}`}
    >
      <button 
        onClick={handleToggle}
        disabled={updateTodo.isPending}
        className={cn(
          "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          todo.completed 
            ? "bg-primary border-primary text-primary-foreground" 
            : "border-muted-foreground/30 text-transparent hover:border-primary/50",
          updateTodo.isPending && "opacity-50 cursor-not-allowed"
        )}
        data-testid={`button-toggle-${todo.id}`}
      >
        {todo.completed ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <Circle className="w-3.5 h-3.5" />}
      </button>

      <div className="flex-grow min-w-0">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={handleKeyDown}
            className="h-8 py-1 px-2 -ml-2 bg-transparent border-primary/20 focus-visible:ring-1 focus-visible:ring-primary"
            data-testid={`input-edit-${todo.id}`}
          />
        ) : (
          <span 
            className={cn(
              "block truncate text-base transition-colors duration-200",
              todo.completed ? "text-muted-foreground line-through" : "text-foreground"
            )}
            onDoubleClick={() => setIsEditing(true)}
            data-testid={`text-title-${todo.id}`}
          >
            {todo.title}
          </span>
        )}
      </div>

      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {isEditing ? (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(false)}
            data-testid={`button-cancel-edit-${todo.id}`}
          >
            <X className="w-4 h-4" />
          </Button>
        ) : (
          <>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 text-muted-foreground hover:text-primary"
              onClick={() => setIsEditing(true)}
              data-testid={`button-edit-${todo.id}`}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDelete}
              disabled={deleteTodo.isPending}
              data-testid={`button-delete-${todo.id}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
