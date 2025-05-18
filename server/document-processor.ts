import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import { ProcessingStatus, type Document, type InsertChunk, type Chunk } from '@shared/schema';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create a temporary directory for extracted text
const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export interface ProcessingResult {
  success: boolean;
  message?: string;
  chunks?: InsertChunk[];
}

export async function processDocument(documentId: number, filePath: string): Promise<ProcessingResult> {
  try {
    // Get document details from storage
    const document = await storage.getDocument(documentId);
    if (!document) {
      return { success: false, message: 'Document not found' };
    }

    // Update document status to extracting
    await storage.updateDocumentStatus(documentId, ProcessingStatus.EXTRACTING, 10);

    // Extract text from document
    const extractedText = await extractText(document, filePath);
    if (!extractedText.success) {
      await storage.updateDocumentStatus(documentId, ProcessingStatus.FAILED, 0);
      return { success: false, message: extractedText.message };
    }

    // Update document status to chunking
    await storage.updateDocumentStatus(documentId, ProcessingStatus.CHUNKING, 30);

    // Split text into chunks
    const chunks = await splitIntoChunks(documentId, extractedText.pages);
    if (!chunks.success) {
      await storage.updateDocumentStatus(documentId, ProcessingStatus.FAILED, 0);
      return { success: false, message: chunks.message };
    }

    // Update document with chunk count
    await storage.updateDocumentChunkCount(documentId, chunks.chunks.length);

    // Update document status to embedding
    await storage.updateDocumentStatus(documentId, ProcessingStatus.EMBEDDING, 50);

    // Generate embeddings for each chunk
    const embeddings = await generateEmbeddings(chunks.chunks);
    if (!embeddings.success) {
      await storage.updateDocumentStatus(documentId, ProcessingStatus.FAILED, 0);
      return { success: false, message: embeddings.message };
    }

    // Update document status to indexing
    await storage.updateDocumentStatus(documentId, ProcessingStatus.INDEXING, 80);

    // Add embeddings to vector store
    const indexed = await addToVectorStore(embeddings.chunks);
    if (!indexed.success) {
      await storage.updateDocumentStatus(documentId, ProcessingStatus.FAILED, 0);
      return { success: false, message: indexed.message };
    }

    // Update document status to completed
    await storage.updateDocumentStatus(documentId, ProcessingStatus.COMPLETED, 100);

    return { success: true, chunks: chunks.chunks };
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await storage.updateDocumentStatus(documentId, ProcessingStatus.FAILED, 0);
    return { success: false, message: `Processing failed: ${error}` };
  }
}

// Mock implementation for text extraction
// In a real-world scenario, this would use PyMuPDF or unstructured
async function extractText(document: Document, filePath: string): Promise<{ success: boolean; message?: string; pages?: Array<{ content: string; page: number }> }> {
  try {
    console.log(`Extracting text from ${document.filename}`);
    
    // Mock implementation with sample extraction
    // Simulate different extraction times based on file size
    const processingTime = Math.min(document.filesize / 1000, 3000);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generate mock pages - in a real implementation this would parse the actual document
    const pageCount = Math.max(1, Math.floor(document.filesize / 10000));
    const pages = Array.from({ length: pageCount }, (_, i) => ({
      content: `Content from page ${i+1} of document ${document.filename}`,
      page: i + 1
    }));
    
    return { success: true, pages };
  } catch (error) {
    console.error('Error extracting text:', error);
    return { success: false, message: `Text extraction failed: ${error}` };
  }
}

// Mock implementation for text chunking
async function splitIntoChunks(documentId: number, pages: Array<{ content: string; page: number }>): Promise<{ success: boolean; message?: string; chunks?: Chunk[] }> {
  try {
    console.log(`Splitting document ${documentId} into chunks`);
    
    const createdChunks: Chunk[] = [];
    
    for (const page of pages) {
      const content = page.content;
      const chunkSize = 500;
      
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunkContent = content.substring(i, i + chunkSize);
        const insertChunk: InsertChunk = {
          documentId,
          content: chunkContent,
          page: page.page
        };
        const createdChunk = await storage.createChunk(insertChunk);
        createdChunks.push(createdChunk);
      }
    }
    
    return { success: true, chunks: createdChunks };
  } catch (error) {
    console.error('Error splitting into chunks:', error);
    return { success: false, message: `Chunking failed: ${error}` };
  }
}

// Mock implementation for embedding generation
async function generateEmbeddings(chunks: Chunk[]): Promise<{ success: boolean; message?: string; chunks?: Chunk[] }> {
  try {
    console.log(`Generating embeddings for ${chunks.length} chunks`);

    const apiKey = process.env.DEEPSEEK_API_KEY;
    const modelName = process.env.DEEPSEEK_EMBEDDING_MODEL || 'deepseek-chat';
    const baseUrl = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not set in environment variables.');
    }
    if (!modelName) {
      throw new Error('DEEPSEEK_EMBEDDING_MODEL is not set in environment variables.');
    }

    console.log(`Using DeepSeek base URL: ${baseUrl} and model: ${modelName} for embeddings.`);

    const updatedChunks: Chunk[] = [];

    for (const chunk of chunks) {
      try {
        console.log(`Requesting embeddings from: ${baseUrl}/v1/embeddings for chunk ID: ${chunk.id}`);
        const response = await fetch(baseUrl + '/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            input: chunk.content,
            model: modelName,
            // encoding_format: "float", // Optional: check DeepSeek API docs
          }),
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `DeepSeek API error: ${response.status} ${response.statusText}`,
            `Response body: ${errorBody}`
          );
          // For now, let's not throw but log and skip, or handle as appropriate
          // throw new Error(`Failed to generate embeddings for chunk ${chunk.id}: ${response.statusText}`);
          // Instead of throwing, we'll add the chunk without embedding or with a dummy embedding
          // Or perhaps, we should collect all errors and report them later.
          // For now, just logging and continuing.
          updatedChunks.push({
            ...chunk,
            embedding: [], // or some error indicator
            error: `API Error: ${response.status} ${response.statusText} - ${errorBody}`
          });
          continue;
        }

        const data = await response.json();
        // console.log("DeepSeek API response data:", JSON.stringify(data, null, 2));

        if (!data.data || !data.data[0] || !data.data[0].embedding) {
          console.error("Unexpected response structure from DeepSeek embeddings API:", data);
          updatedChunks.push({
            ...chunk,
            embedding: [],
            error: "Unexpected API response structure"
          });
          continue;
        }
        
        const embedding = data.data[0].embedding;
        updatedChunks.push({ ...chunk, embedding });
      } catch (error) {
        console.error(`Error generating embedding for chunk ${chunk.id}:`, error);
        // Add chunk with an error or empty embedding
        updatedChunks.push({
          ...chunk,
          embedding: [],
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    console.log('Successfully generated and stored embeddings for all chunks.');
    return { success: true, chunks: updatedChunks };
  } catch (error) {
    console.error('Error in generateEmbeddings function:', error);
    return { success: false, message: `Embedding generation failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

// Mock implementation for adding to vector store
async function addToVectorStore(chunks: InsertChunk[]): Promise<{ success: boolean; message?: string }> {
  try {
    console.log(`Adding ${chunks.length} chunks to vector store`);
    
    // In a real implementation, this would use FAISS or a similar vector store
    // Simulate indexing time
    await new Promise(resolve => setTimeout(resolve, chunks.length * 50));
    
    return { success: true };
  } catch (error) {
    console.error('Error adding to vector store:', error);
    return { success: false, message: `Vector indexing failed: ${error}` };
  }
}

// Mock implementation for RAG-based question answering
export async function answerQuestion(question: string): Promise<{ answer: string; sources?: any[] }> {
  try {
    console.log(`Answering question: ${question}`);
    
    // In a real implementation, this would:
    // 1. Convert the question to an embedding
    // 2. Search the vector store for similar chunks
    // 3. Use LangChain to generate an answer based on the chunks
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get all documents to search from
    const documents = await storage.getDocuments();
    const completedDocs = documents.filter(doc => doc.status === ProcessingStatus.COMPLETED);
    
    if (completedDocs.length === 0) {
      return { 
        answer: "I don't have any documents in my knowledge base yet. Please upload some documents first."
      };
    }
    
    // Mock response based on question content
    let answer = "";
    let sources = [];
    
    // Keywords-based mock responses
    const keywords = {
      "financial": {
        doc: "Q4_Financial_Report.pdf",
        answer: "According to the financial report, the key performance indicators include:\n\n• Revenue growth of 18.5% year-over-year\n• EBITDA margin improved to 24.3% (up from 22.1% in Q3)\n• Customer acquisition cost reduced by 12%\n• Net promoter score (NPS) increased to 62\n\nThese improvements were primarily driven by the launch of the new product line and operational efficiency initiatives.",
        source: "Our Q4 results exceeded expectations with 18.5% YoY revenue growth and EBITDA margin expansion to 24.3%. Key metrics show CAC reduction of 12% and NPS improvement to 62, demonstrating the success of our Q3 initiatives and new product line.",
        page: 8
      },
      "handbook": {
        doc: "Company_Handbook_2023.pdf",
        answer: "According to the company handbook, the work from home policy includes:\n\n• Employees may work remotely up to 3 days per week with manager approval\n• Core hours (10 AM - 3 PM) must be observed regardless of location\n• Remote work equipment can be requested through IT\n• Quarterly in-person team days are mandatory\n• Performance is measured by output rather than hours logged",
        source: "The updated hybrid work model allows employees to work remotely up to 3 days weekly (manager approval required). All employees must be available during core hours (10 AM - 3 PM) and attend quarterly in-person team days. Remote work equipment can be requested through IT.",
        page: 24
      },
      "product": {
        doc: "Product_Specifications.docx",
        answer: "The product specifications document outlines:\n\n• Product dimensions: 12.5\" x 8.3\" x 0.7\"\n• Weight: 2.4 lbs (1.1 kg)\n• Battery life: Up to 12 hours under normal usage\n• Display: 13.3\" 4K OLED (3840 x 2160)\n• Processor: QuadCore 2.8GHz with 16GB RAM",
        source: "Product dimensions are 12.5\" x 8.3\" x 0.7\" with weight of 2.4 lbs (1.1 kg). Features include 13.3\" 4K OLED display (3840 x 2160), QuadCore 2.8GHz processor, 16GB RAM, and up to 12 hours battery life.",
        page: 3
      }
    };
    
    const lowerQuestion = question.toLowerCase();
    let matched = false;
    
    for (const [key, data] of Object.entries(keywords)) {
      if (lowerQuestion.includes(key)) {
        answer = data.answer;
        sources = [{
          text: data.source,
          documentId: completedDocs[0].id,
          documentName: data.doc,
          page: data.page
        }];
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      return { 
        answer: "I couldn't find specific information about that in your documents. Could you try rephrasing your question or uploading more relevant documents?"
      };
    }
    
    return { answer, sources };
  } catch (error) {
    console.error('Error answering question:', error);
    return { answer: "I'm sorry, I encountered an error while trying to answer your question. Please try again." };
  }
}
