import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, todosTable } from "@workspace/db";
import {
  CreateTodoBody,
  UpdateTodoBody,
  GetTodoParams,
  UpdateTodoParams,
  DeleteTodoParams,
  ListTodosResponse,
  GetTodoResponse,
  UpdateTodoResponse,
  GetTodoStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/todos/stats", async (req, res): Promise<void> => {
  const rows = await db
    .select({ completed: todosTable.completed, cnt: count() })
    .from(todosTable)
    .groupBy(todosTable.completed);

  let totalCompleted = 0;
  let totalPending = 0;
  for (const row of rows) {
    if (row.completed) {
      totalCompleted = Number(row.cnt);
    } else {
      totalPending = Number(row.cnt);
    }
  }
  const total = totalCompleted + totalPending;

  res.json(GetTodoStatsResponse.parse({ total, completed: totalCompleted, pending: totalPending }));
});

router.get("/todos", async (req, res): Promise<void> => {
  const todos = await db.select().from(todosTable).orderBy(todosTable.createdAt);
  res.json(ListTodosResponse.parse(todos));
});

router.post("/todos", async (req, res): Promise<void> => {
  const parsed = CreateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [todo] = await db.insert(todosTable).values(parsed.data).returning();
  res.status(201).json(GetTodoResponse.parse(todo));
});

router.get("/todos/:id", async (req, res): Promise<void> => {
  const params = GetTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(GetTodoResponse.parse(todo));
});

router.patch("/todos/:id", async (req, res): Promise<void> => {
  const params = UpdateTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [todo] = await db
    .update(todosTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(UpdateTodoResponse.parse(todo));
});

router.delete("/todos/:id", async (req, res): Promise<void> => {
  const params = DeleteTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .delete(todosTable)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
