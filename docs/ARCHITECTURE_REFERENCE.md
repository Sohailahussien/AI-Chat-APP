# Cubi AI - Architecture Reference

## 🏗️ **System Overview**

Cubi AI is a modern web application that combines document processing, AI-powered chat, and intelligent document analysis. The system uses Next.js for both frontend and API routes, with a modular architecture designed for scalability and maintainability.

### **High-Level Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                        Cubi AI System                          │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)  │  API Layer (Next.js)  │  External APIs  │
│  ┌───────────────┐   │  ┌─────────────────┐   │  ┌─────────────┐ │
│  │ React UI      │   │  │ API Routes      │   │  │ OpenAI API  │ │
│  │ Components    │◄──┤  │ Authentication  │   │  │ Anthropic   │ │
│  │ State Mgmt    │   │  │ File Upload     │   │  │ Cohere API  │ │
│  │ Routing       │   │  │ Chat Processing │   │  │             │ │
│  └───────────────┘   │  │ MCP Protocol    │   │  └─────────────┘ │
│                      │  └─────────────────┘   │                 │
│  ┌───────────────┐   │  ┌─────────────────┐   │  ┌─────────────┐ │
│  │ Database      │   │  │ Business Logic  │   │  │ File Storage│ │
│  │ (SQLite)      │◄──┤  │ Document Tools  │   │  │ (Local FS)  │ │
│  │ User Mgmt     │   │  │ RAG System      │   │  │ Uploads/    │ │
│  │ Chat History  │   │  │ Embeddings      │   │  │ Documents/  │ │
│  └───────────────┘   │  └─────────────────┘   │  └─────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Core Architecture Principles**

### **1. Separation of Concerns**
- **Frontend**: UI components, state management, user interactions
- **API Layer**: Business logic, data processing, external integrations
- **Data Layer**: Database operations, file management, persistence

### **2. Modular Design**
- **Component-based UI**: Reusable React components
- **Service-oriented API**: Dedicated API routes for specific functionality
- **Plugin architecture**: Extensible MCP (Model Context Protocol) system

### **3. Scalability & Performance**
- **Server-side rendering**: Next.js SSR for better performance
- **API route optimization**: Efficient data processing and caching
- **Database optimization**: Indexed queries and efficient data structures

### **4. Security & Privacy**
- **User isolation**: Separate document storage per user
- **Authentication**: JWT-based secure authentication
- **Data encryption**: Secure file handling and storage

---

## 🏛️ **Technical Stack**

### **Frontend Technologies**
```typescript
// Core Framework
- Next.js 14.x (App Router)
- React 18.x
- TypeScript 5.x

// Styling & UI
- Tailwind CSS 3.x
- Headless UI (for accessible components)
- Lucide React (for icons)

// State Management
- React Hooks (useState, useEffect, useContext)
- Custom hooks for business logic

// Form Handling
- React Hook Form (for form validation)
- Zod (for schema validation)
```

### **Backend Technologies**
```typescript
// Runtime & API
- Node.js 18.x
- Next.js API Routes
- Express.js patterns

// Database & ORM
- SQLite (development)
- Prisma ORM 5.x
- Database migrations

// File Processing
- Multer (file upload handling)
- Mammoth.js (DOCX processing)
- PDF.js (PDF text extraction)

// AI & ML
- OpenAI API (GPT models)
- Anthropic API (Claude models)
- Cohere API (embeddings)
```

---

## 🗂️ **Project Structure**

```
cubi-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── chat/          # Chat processing endpoints
│   │   │   ├── upload/        # File upload endpoints
│   │   │   └── users/         # User management endpoints
│   │   ├── auth/              # Authentication pages
│   │   ├── chat/              # Chat interface pages
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── chat/             # Chat-specific components
│   │   ├── auth/             # Authentication components
│   │   └── layout/           # Layout components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication utilities
│   │   ├── db.ts             # Database utilities
│   │   ├── utils.ts          # General utilities
│   │   └── validations.ts    # Schema validations
│   ├── mcp/                  # Model Context Protocol
│   │   ├── tools/            # MCP tools implementation
│   │   └── protocol.ts       # MCP protocol definitions
│   ├── hooks/                # Custom React hooks
│   ├── types/                # TypeScript type definitions
│   └── styles/               # Component-specific styles
├── prisma/                   # Database schema and migrations
├── public/                   # Static assets
├── uploads/                  # File upload storage
├── docs/                     # Documentation
├── tests/                    # Test files
├── .env.local               # Environment variables
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project overview
```

---

## 🔧 **Core Components Architecture**

### **1. Frontend Architecture**

#### **Component Hierarchy**
```
App Layout
├── Header
│   ├── Logo
│   ├── Navigation
│   └── User Menu
├── Sidebar
│   ├── Navigation Items
│   ├── Chat History
│   └── User Profile
└── Main Content
    ├── Chat Interface
    │   ├── Message List
    │   ├── Input Area
    │   └── File Upload
    └── Document Viewer
```

#### **State Management Pattern**
```typescript
// Global State (Context API)
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  currentChat: Chat | null;
}

// Local State (useState)
interface ChatState {
  messages: Message[];
  isLoading: boolean;
  input: string;
  uploadedFiles: File[];
}

// Custom Hooks
const useAuth = () => { /* Authentication logic */ };
const useChat = () => { /* Chat management logic */ };
const useDocuments = () => { /* Document handling logic */ };
```

### **2. API Architecture**

#### **Route Structure**
```typescript
// Authentication Routes
POST /api/auth/register    // User registration
POST /api/auth/login       // User login
POST /api/auth/logout      // User logout
GET  /api/auth/me          // Get current user

// Chat Routes
POST /api/chat             // Process chat message
POST /api/chat/enhanced    // Enhanced chat with RAG
GET  /api/chat/history     // Get chat history

// File Upload Routes
POST /api/upload           // Upload document
GET  /api/upload/list      // List user documents
DELETE /api/upload/:id     // Delete document

// User Routes
GET  /api/users/profile    // Get user profile
PUT  /api/users/profile    // Update user profile
```

#### **API Response Patterns**
```typescript
// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Error Response
interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Chat Response
interface ChatResponse {
  response: string;
  responseType: 'ai_response' | 'error';
  hasLocalContext: boolean;
  documents?: Document[];
}
```

### **3. Database Architecture**

#### **Schema Design**
```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  content TEXT,
  embeddings TEXT, -- JSON array of embeddings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Chats table
CREATE TABLE chats (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id)
);
```

#### **Database Relationships**
```
Users (1) ──── (N) Documents
Users (1) ──── (N) Chats
Chats (1) ──── (N) Messages
```

### **4. MCP (Model Context Protocol) Architecture**

#### **Protocol Implementation**
```typescript
// MCP Tool Interface
interface MCPTool {
  name: string;
  description: string;
  parameters: Parameter[];
  execute: (params: any) => Promise<any>;
}

// Document Tools
class EnhancedDocumentTools implements MCPTool {
  name = 'enhanced_document_tools';
  
  async processDocument(file: File, userId: string): Promise<Document> {
    // Document processing logic
  }
  
  async queryDocuments(query: string, userId: string): Promise<Document[]> {
    // Document retrieval logic
  }
}
```

#### **Tool Categories**
```typescript
// Core Tools
- processDocument: Upload and process documents
- queryDocuments: Search and retrieve documents
- getDocumentInfo: Get document metadata

// Analysis Tools
- summarizeDocument: Generate document summaries
- extractKeyPoints: Extract key information
- compareDocuments: Compare multiple documents

// Utility Tools
- validateFile: Validate file format and size
- cleanText: Clean and normalize text content
- chunkText: Split text into manageable chunks
```

---

## 🔄 **Data Flow Architecture**

### **1. User Authentication Flow**
```
1. User submits login form
2. Frontend validates input
3. API route processes authentication
4. JWT token generated and stored
5. User redirected to chat interface
6. Token used for subsequent requests
```

### **2. Document Upload Flow**
```
1. User selects file
2. Frontend validates file type/size
3. File uploaded to server
4. Document processed (text extraction)
5. Embeddings generated
6. Document stored in database
7. Success response sent to user
```

### **3. Chat Processing Flow**
```
1. User sends message
2. Frontend displays user message
3. API route receives request
4. MCP tools query relevant documents
5. Context injected into AI prompt
6. AI generates response
7. Response sent back to frontend
8. Message displayed in chat
```

### **4. RAG (Retrieval-Augmented Generation) Flow**
```
1. User asks document-specific question
2. Query processed for embeddings
3. Similar documents retrieved
4. Relevant context extracted
5. Context injected into AI prompt
6. AI generates contextual response
7. Response includes document references
```

---

## 🔒 **Security Architecture**

### **1. Authentication & Authorization**
```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration
}

// Authentication Middleware
const authenticateUser = async (req: NextRequest) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  
  const decoded = jwt.verify(token, process.env.JWT_SECRET!);
  return decoded as JWTPayload;
};
```

### **2. Data Protection**
```typescript
// User Isolation
const getUserDocuments = async (userId: string) => {
  return await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

// Input Validation
const validateFileUpload = (file: File) => {
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
};
```

### **3. API Security**
```typescript
// Rate Limiting
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
};

// CORS Configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## 📊 **Performance Architecture**

### **1. Caching Strategy**
```typescript
// Document Embeddings Cache
const embeddingsCache = new Map<string, number[]>();

// Chat Response Cache
const responseCache = new Map<string, string>();

// User Session Cache
const sessionCache = new Map<string, User>();
```

### **2. Database Optimization**
```sql
-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_chats_user_id ON chats(user_id);

-- Query optimization
SELECT d.* FROM documents d 
WHERE d.user_id = ? 
ORDER BY d.created_at DESC 
LIMIT 20;
```

### **3. API Performance**
```typescript
// Pagination
interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// Streaming responses
const streamResponse = async (response: string) => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const chunks = response.split(' ');
      chunks.forEach((chunk, index) => {
        setTimeout(() => {
          controller.enqueue(encoder.encode(chunk + ' '));
          if (index === chunks.length - 1) {
            controller.close();
          }
        }, index * 100);
      });
    }
  });
  return stream;
};
```

---

## 🚀 **Deployment Architecture**

### **1. Environment Configuration**
```typescript
// Environment Variables
interface Environment {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // AI Services
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  COHERE_API_KEY: string;
  
  // Application
  NODE_ENV: 'development' | 'production';
  PORT: number;
  ALLOWED_ORIGINS: string;
}
```

### **2. Build & Deployment**
```yaml
# Vercel Configuration
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret",
    "OPENAI_API_KEY": "@openai-api-key"
  }
}
```

### **3. Monitoring & Logging**
```typescript
// Application Logging
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  }
};

// Performance Monitoring
const performanceMonitor = {
  trackApiCall: (endpoint: string, duration: number) => {
    // Track API performance metrics
  },
  trackUserAction: (action: string, data?: any) => {
    // Track user interactions
  }
};
```

---

## 🔧 **Development Architecture**

### **1. Development Workflow**
```bash
# Development Commands
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
npm run test         # Run tests
npm run test:e2e     # Run E2E tests
```

### **2. Code Quality**
```typescript
// ESLint Configuration
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}

// Prettier Configuration
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### **3. Testing Strategy**
```typescript
// Unit Tests
describe('Document Processing', () => {
  it('should extract text from PDF', async () => {
    // Test implementation
  });
  
  it('should generate embeddings', async () => {
    // Test implementation
  });
});

// Integration Tests
describe('Chat API', () => {
  it('should process chat message', async () => {
    // Test implementation
  });
});

// E2E Tests
describe('User Journey', () => {
  it('should complete document upload and chat', async () => {
    // Test implementation
  });
});
```

---

## 📈 **Scalability Considerations**

### **1. Horizontal Scaling**
- **Stateless API**: API routes are stateless for easy scaling
- **Database scaling**: SQLite → PostgreSQL for production
- **File storage**: Local → Cloud storage (AWS S3, Google Cloud Storage)
- **CDN**: Static assets served via CDN

### **2. Performance Optimization**
- **Database indexing**: Optimized queries with proper indexes
- **Caching layers**: Redis for session and data caching
- **CDN**: Global content delivery for static assets
- **Load balancing**: Multiple server instances

### **3. Monitoring & Observability**
- **Application monitoring**: Error tracking and performance metrics
- **Database monitoring**: Query performance and connection pooling
- **User analytics**: Usage patterns and feature adoption
- **Health checks**: System health and uptime monitoring

---

*Document created: December 2024*
*Version: 1.0*
*Last updated: Architecture documentation phase*
