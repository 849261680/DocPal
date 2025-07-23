import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Document Processing Status
export enum ProcessingStatus {
  PENDING = "pending",
  EXTRACTING = "extracting",
  CHUNKING = "chunking",
  EMBEDDING = "embedding",
  INDEXING = "indexing",
  COMPLETED = "completed",
  FAILED = "failed",
}

// Document Schema
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  filesize: integer("filesize").notNull(),
  filetype: text("filetype").notNull(),
  status: text("status").notNull().default(ProcessingStatus.PENDING),
  progress: integer("progress").notNull().default(0),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  chunkCount: integer("chunk_count"),
  error: text("error"),
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  filename: true,
  filesize: true,
  filetype: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

// Document Chunks Schema
export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  content: text("content").notNull(),
  page: integer("page"),
  vectorEmbedding: json("vector_embedding"),
});

export const insertChunkSchema = createInsertSchema(chunks).pick({
  documentId: true,
  content: true,
  page: true,
});

export type InsertChunk = z.infer<typeof insertChunkSchema>;
export type Chunk = typeof chunks.$inferSelect;

// Message Schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sources: json("sources"),
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  isUser: true,
  sources: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Source Reference Type
export type SourceReference = {
  text: string;
  documentId: number;
  documentName: string;
  page?: number;
};
