import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import multer from "multer";
import { storage } from "./storage";
import { processDocument, answerQuestion } from "./document-processor";

// Set up multer storage
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF and DOCX files
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.post("/api/documents", upload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create document record
      const document = await storage.createDocument({
        filename: file.originalname,
        filesize: file.size,
        filetype: file.mimetype,
      });

      // Start document processing in the background
      processDocument(document.id, file.path).catch((error) => {
        console.error(`Background processing error for document ${document.id}:`, error);
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.json(document);
    } catch (error) {
      console.error("Error getting document:", error);
      res.status(500).json({ message: "Failed to get document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const success = await storage.deleteDocument(documentId);
      
      if (!success) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  app.post("/api/documents/refresh", async (req, res) => {
    try {
      // This would re-index all documents in a real implementation
      // For now, we just return success
      res.json({ success: true });
    } catch (error) {
      console.error("Error refreshing documents:", error);
      res.status(500).json({ message: "Failed to refresh documents" });
    }
  });

  app.delete("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      
      // Delete all documents
      for (const doc of documents) {
        await storage.deleteDocument(doc.id);
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing knowledge base:", error);
      res.status(500).json({ message: "Failed to clear knowledge base" });
    }
  });

  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error getting messages:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== "string") {
        return res.status(400).json({ message: "Message content is required" });
      }
      
      // Save user message
      const userMessage = await storage.createMessage({
        content,
        isUser: true,
        sources: null,
      });
      
      // Generate assistant response
      const { answer, sources } = await answerQuestion(content);
      
      // Save assistant message
      const assistantMessage = await storage.createMessage({
        content: answer,
        isUser: false,
        sources,
      });
      
      res.status(201).json({
        userMessage,
        assistantMessage,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.delete("/api/messages", async (req, res) => {
    try {
      await storage.clearMessages();
      res.status(204).send();
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
