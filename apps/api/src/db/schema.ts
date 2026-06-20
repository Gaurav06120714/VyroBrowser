import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  instruction: text('instruction').notNull(),
  status: text('status').notNull().default('pending'),
  
  plan: text('plan'),
  
  result: text('result'),
  errorMessage: text('error_message'),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  
  options: text('options'),
});

export const executionSteps = sqliteTable('execution_steps', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  stepNumber: integer('step_number').notNull(),
  
  action: text('action').notNull(),
  reasoning: text('reasoning').notNull().default(''),
  status: text('status').notNull().default('pending'),
  
  result: text('result'),
  duration: integer('duration'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export const screenshots = sqliteTable('screenshots', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  stepId: text('step_id'),
  url: text('url').notNull(),
  pageUrl: text('page_url').notNull().default(''),
  
  storageKey: text('storage_key'),
  width: integer('width').notNull().default(1440),
  height: integer('height').notNull().default(900),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type ExecutionStep = typeof executionSteps.$inferSelect;
export type NewExecutionStep = typeof executionSteps.$inferInsert;
export type ScreenshotRow = typeof screenshots.$inferSelect;
export type NewScreenshot = typeof screenshots.$inferInsert;
