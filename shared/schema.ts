import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
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

// Pinterest media schema
export const pinterestMedia = pgTable("pinterest_media", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  mediaType: text("media_type").notNull(), // 'video', 'image'
  quality: text("quality").notNull(), // 'hd', 'standard'
  thumbnailUrl: text("thumbnail_url"),
  mediaUrl: text("media_url"),
  metadata: json("metadata").$type<{
    width?: number;
    height?: number;
    duration?: number;
    size?: number;
    title?: string;
  }>(),
  downloadedAt: timestamp("downloaded_at").notNull().defaultNow(),
});

export const insertPinterestMediaSchema = createInsertSchema(pinterestMedia).omit({
  id: true,
  downloadedAt: true,
});

export type InsertPinterestMedia = z.infer<typeof insertPinterestMediaSchema>;
export type PinterestMedia = typeof pinterestMedia.$inferSelect;

// Validation schema for Pinterest URL
export const pinterestUrlSchema = z.object({
  url: z.string().url().refine(
    (url) => url.includes('pinterest.com') || url.includes('pin.it'),
    { message: "URL must be from Pinterest (pinterest.com or pin.it)" }
  ),
  type: z.enum(['hd_video', 'hd_image', 'standard_image']),
});

export type PinterestUrlInput = z.infer<typeof pinterestUrlSchema>;
