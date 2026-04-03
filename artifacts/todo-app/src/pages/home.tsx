import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { 
  useListTodos, 
  useGetTodoStats,
  useCreateTodo,
  getListTodosQueryKey,
  getGetTodoStatsQueryKey
} from "@workspace/api-client-react";

import { TodoItem } from "@/components/todo-item";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [newTitle, setNewTitle] = useState("");
  const queryClient = useQueryClient();
  const { theme, toggle } = useTheme();
  
  const { data: todos, isLoading: isTodosLoading, isError: isTodosError } = useListTodos();
  const { data: stats, isLoading: isStatsLoading } = useGetTodoStats();
  
  const createTodo = useCreateTodo();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    createTodo.mutate(
      { data: { title: newTitle.trim() } },
      {
        onSuccess: () => {
          setNewTitle("");
          queryClient.invalidateQueries({ queryKey: getListTodosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTodoStatsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background flex flex-col items-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-serif text-foreground font-medium tracking-tight">
              Focus
            </h1>
            <button
              onClick={toggle}
              aria-label="Toggle dark mode"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            {isStatsLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : stats ? (
              <div className="flex gap-4">
                <span data-testid="text-stats-pending">
                  <strong className="text-foreground font-medium">{stats.pending}</strong> pending
                </span>
                <span data-testid="text-stats-completed">
                  <strong className="text-foreground font-medium">{stats.completed}</strong> completed
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Create Form */}
        <form onSubmit={handleCreate} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
            <Plus className="h-5 w-5" />
          </div>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Write a new task..."
            className="pl-10 h-12 sm:h-14 text-base sm:text-lg bg-card border-muted-foreground/20 hover:border-border focus-visible:ring-primary focus-visible:border-primary shadow-sm transition-all"
            disabled={createTodo.isPending}
            data-testid="input-new-todo"
          />
          <Button 
            type="submit" 
            className="sr-only"
            disabled={!newTitle.trim() || createTodo.isPending}
            data-testid="button-submit-todo"
          >
            Add Task
          </Button>
        </form>

        {/* Todo List */}
        <div className="flex flex-col gap-1">
          {isTodosLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
              <Skeleton className="h-14 w-full rounded-md" />
            </div>
          ) : isTodosError ? (
            <div className="p-6 text-center text-destructive bg-destructive/5 rounded-md border border-destructive/20">
              Failed to load tasks. Please try again.
            </div>
          ) : !todos || todos.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center gap-3 text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                <Check className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-lg">Your list is clear.</p>
              <p className="text-sm">Add a task above to begin.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {todos.map((todo) => (
                <div key={todo.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both" style={{ animationDelay: `${Math.min(todo.id * 50, 500)}ms` }}>
                  <TodoItem todo={todo} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
