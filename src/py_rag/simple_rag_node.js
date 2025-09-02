const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const app = express();
const PORT = 8001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple in-memory storage
let documents = [];
let metadatas = [];

// Simple text similarity function
function simpleSimilarity(query, text) {
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const textWords = new Set(text.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    
    const commonWords = new Set([...queryWords].filter(x => textWords.has(x)));
    return commonWords.size / Math.max(queryWords.size, 1);
}

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        model: 'Simple Node.js RAG',
        documents_count: documents.length,
        service: 'Simple Node.js RAG Service'
    });
});

// Stats endpoint
app.get('/stats', (req, res) => {
    res.json({
        total_documents: documents.length,
        model: 'Simple Node.js RAG',
        index_type: 'In-Memory',
        service: 'Simple Node.js RAG Service'
    });
});

// Clear endpoint
app.post('/clear', (req, res) => {
    documents = [];
    metadatas = [];
    console.log('✅ RAG index cleared');
    res.json({
        status: 'success',
        message: 'All documents cleared from index',
        documents_count: 0
    });
});

// Ingest endpoint
app.post('/ingest', (req, res) => {
    const { file_path, source, user_id } = req.body;
    
    if (!file_path) {
        return res.status(400).json({ error: 'file_path is required' });
    }
    
    console.log(`📄 Ingesting file: ${file_path}`);
    
    try {
        // Read file content
        let content = '';
        const fileExt = path.extname(file_path).toLowerCase();
        
        if (fileExt === '.txt') {
            content = fs.readFileSync(file_path, 'utf8');
        } else if (fileExt === '.docx') {
            // Use mammoth to extract text from DOCX
            try {
                const buffer = fs.readFileSync(file_path);
                const result = mammoth.extractRawText({ buffer });
                content = result.value;
                
                if (!content || content.trim().length === 0) {
                    return res.json({ 
                        count: 0, 
                        ids: [], 
                        error: `No readable text extracted from DOCX file: ${file_path}` 
                    });
                }
                
                console.log(`✅ Successfully extracted ${content.length} characters from DOCX file`);
            } catch (e) {
                console.error('Error extracting text from DOCX:', e);
                return res.json({ 
                    count: 0, 
                    ids: [], 
                    error: `Failed to extract text from DOCX file: ${e.message}` 
                });
            }
        } else if (fileExt === '.pdf') {
            // For PDF, we'll try to read as text first, then fallback
            try {
                content = fs.readFileSync(file_path, 'utf8');
                // If it's mostly binary data, it's not readable as text
                if (content.length < 100 || content.includes('\x00')) {
                    return res.json({ 
                        count: 0, 
                        ids: [], 
                        error: `PDF files need special processing. Please convert to TXT first.` 
                    });
                }
            } catch (e) {
                return res.json({ 
                    count: 0, 
                    ids: [], 
                    error: `Cannot read PDF file as text. Please convert to TXT first.` 
                });
            }
        } else {
            return res.json({ 
                count: 0, 
                ids: [], 
                error: `Unsupported file type: ${fileExt}. Please use TXT or DOCX files.` 
            });
        }
        
        if (!content || content.trim().length === 0) {
            return res.json({ 
                count: 0, 
                ids: [], 
                error: `No readable text in ${file_path}` 
            });
        }
        
        console.log(`✅ Read ${content.length} characters from file`);
        
        // Split text into chunks
        const chunks = [];
        for (let i = 0; i < content.length; i += 1000) {
            chunks.push(content.slice(i, i + 1000));
        }
        
        // Add to documents
        const startIdx = documents.length;
        documents.push(...chunks);
        
        // Add metadata
        const meta = { source: source || file_path, user_id: user_id || 'default' };
        metadatas.push(...chunks.map(() => meta));
        
        console.log(`✅ Added ${chunks.length} chunks to index. Total documents: ${documents.length}`);
        
        res.json({
            count: chunks.length,
            ids: chunks.map((_, i) => `doc_${startIdx + i}`),
            error: null
        });
        
    } catch (error) {
        console.error('Error ingesting file:', error);
        res.json({ 
            count: 0, 
            ids: [], 
            error: `Error reading file: ${error.message}` 
        });
    }
});

// Query endpoint
app.post('/query', (req, res) => {
    const { query, top_k = 5, user_id } = req.body;
    
    if (documents.length === 0) {
        return res.json({
            ids: [],
            distances: [],
            metadatas: [],
            documents: []
        });
    }
    
    console.log(`🔍 Querying: '${query}'`);
    
    // Calculate similarities
    const results = [];
    for (let i = 0; i < documents.length; i++) {
        const score = simpleSimilarity(query, documents[i]);
        if (score > 0) {
            results.push({ score, index: i });
        }
    }
    
    // Sort by score (highest first)
    results.sort((a, b) => b.score - a.score);
    
    // Get top results
    const topResults = results.slice(0, top_k);
    
    const response = {
        ids: topResults.map(r => `doc_${r.index}`),
        distances: topResults.map(r => r.score),
        metadatas: topResults.map(r => metadatas[r.index]),
        documents: topResults.map(r => documents[r.index])
    };
    
    console.log(`✅ Found ${response.documents.length} relevant documents`);
    res.json(response);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple Node.js RAG Service running on http://0.0.0.0:${PORT}`);
    console.log('✅ Service ready!');
});

module.exports = app;
