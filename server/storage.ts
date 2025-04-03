import { InsertPinterestMedia, PinterestMedia, PinterestUrlInput, User, InsertUser } from "@shared/schema";

// Modify the interface with CRUD methods needed
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pinterest media methods
  getMediaHistory(limit?: number): Promise<PinterestMedia[]>;
  getMediaById(id: number): Promise<PinterestMedia | undefined>;
  createMedia(media: InsertPinterestMedia): Promise<PinterestMedia>;
  clearMediaHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private media: Map<number, PinterestMedia>;
  private userCurrentId: number;
  private mediaCurrentId: number;

  constructor() {
    this.users = new Map();
    this.media = new Map();
    this.userCurrentId = 1;
    this.mediaCurrentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Pinterest media methods
  async getMediaHistory(limit: number = 10): Promise<PinterestMedia[]> {
    return Array.from(this.media.values())
      .sort((a, b) => {
        // @ts-ignore - We know downloadedAt exists as per schema
        return new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime();
      })
      .slice(0, limit);
  }

  async getMediaById(id: number): Promise<PinterestMedia | undefined> {
    return this.media.get(id);
  }

  async createMedia(insertMedia: InsertPinterestMedia): Promise<PinterestMedia> {
    const id = this.mediaCurrentId++;
    const downloadedAt = new Date();
    const media: PinterestMedia = { ...insertMedia, id, downloadedAt };
    this.media.set(id, media);
    return media;
  }

  async clearMediaHistory(): Promise<void> {
    this.media.clear();
  }
}

export const storage = new MemStorage();
