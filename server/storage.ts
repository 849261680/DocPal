import { 
  users, type User, type InsertUser,
  documents, type Document, type InsertDocument, 
  chunks, type Chunk, type InsertChunk,
  messages, type Message, type InsertMessage,
  ProcessingStatus
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Document methods
  getDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocumentStatus(id: number, status: ProcessingStatus, progress?: number): Promise<Document | undefined>;
  updateDocumentChunkCount(id: number, chunkCount: number): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Chunk methods
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  getChunksByDocumentId(documentId: number): Promise<Chunk[]>;
  getChunkById(id: number): Promise<Chunk | undefined>;
  updateChunkEmbedding(id: number, embedding: number[]): Promise<Chunk | undefined>;
  
  // Message methods
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private documents: Map<number, Document>;
  private chunks: Map<number, Chunk>;
  private messages: Map<number, Message>;
  private userId: number;
  private documentId: number;
  private chunkId: number;
  private messageId: number;

  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.chunks = new Map();
    this.messages = new Map();
    this.userId = 1;
    this.documentId = 1;
    this.chunkId = 1;
    this.messageId = 1;
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
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Document methods
  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.documentId++;
    const document: Document = { 
      ...insertDocument, 
      id, 
      status: ProcessingStatus.PENDING, 
      progress: 0, 
      uploadedAt: new Date(), 
      chunkCount: null, 
      error: null 
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocumentStatus(id: number, status: ProcessingStatus, progress: number = 0): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { 
      ...document, 
      status, 
      progress: Math.max(document.progress, progress) 
    };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async updateDocumentChunkCount(id: number, chunkCount: number): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, chunkCount };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) {
      // Also delete all chunks associated with this document
      Array.from(this.chunks.entries())
        .filter(([_, chunk]) => chunk.documentId === id)
        .forEach(([chunkId, _]) => this.chunks.delete(chunkId));
    }
    return deleted;
  }

  // Chunk methods
  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const id = this.chunkId++;
    const chunk: Chunk = { ...insertChunk, id, vectorEmbedding: null };
    this.chunks.set(id, chunk);
    return chunk;
  }

  async getChunksByDocumentId(documentId: number): Promise<Chunk[]> {
    return Array.from(this.chunks.values())
      .filter(chunk => chunk.documentId === documentId);
  }

  async getChunkById(id: number): Promise<Chunk | undefined> {
    return this.chunks.get(id);
  }

  async updateChunkEmbedding(id: number, embedding: number[]): Promise<Chunk | undefined> {
    const chunk = this.chunks.get(id);
    if (!chunk) return undefined;
    
    const updatedChunk = { ...chunk, vectorEmbedding: embedding };
    this.chunks.set(id, updatedChunk);
    return updatedChunk;
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    const message: Message = { ...insertMessage, id, timestamp: new Date() };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(): Promise<void> {
    this.messages.clear();
  }
}

export const storage = new MemStorage();
