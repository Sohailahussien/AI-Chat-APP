# Cubi AI - Product Documentation

## 📖 **Table of Contents**

1. [Product Overview](#product-overview)
2. [Core Features](#core-features)
3. [User Interface](#user-interface)
4. [User Workflows](#user-workflows)
5. [Technical Specifications](#technical-specifications)
6. [API Reference](#api-reference)
7. [Configuration Guide](#configuration-guide)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## 🎯 **Product Overview**

### **What is Cubi AI?**

Cubi AI is an intelligent document analysis and chat platform that transforms static documents into interactive, AI-powered conversations. The platform combines advanced natural language processing with document understanding to provide users with instant, contextual answers about their uploaded documents.

### **Key Value Propositions**

1. **Document Intelligence**: Upload documents and ask questions in natural language
2. **Contextual Understanding**: AI understands document content and provides relevant answers
3. **Secure & Private**: User-specific document storage with complete privacy
4. **Modern Interface**: ChatGPT-style familiar interface for seamless user experience
5. **Multi-format Support**: Support for PDF, DOCX, DOC, and TXT files

### **Target Users**

- **Research Analysts**: Analyze reports, extract insights, generate summaries
- **Academic Researchers**: Process research papers, compare studies, extract findings
- **Business Consultants**: Analyze client documents, extract business insights
- **Content Creators**: Research topics, fact-check information, generate content ideas
- **Students**: Study materials, research papers, assignment help
- **Professionals**: Document analysis, contract review, report generation

---

## ✨ **Core Features**

### **1. Document Upload & Processing**

#### **Supported File Types**
- **PDF Documents**: Text extraction from PDF files
- **Microsoft Word**: DOCX and DOC file processing
- **Plain Text**: TXT file support
- **File Size Limit**: Up to 10MB per file

#### **Processing Capabilities**
- **Text Extraction**: Accurate text extraction from various formats
- **Content Cleaning**: Automatic text normalization and cleaning
- **Embedding Generation**: Semantic embeddings for intelligent search
- **Metadata Extraction**: File information and content analysis

#### **Upload Methods**
- **Drag & Drop**: Intuitive file upload interface
- **Browse Files**: Traditional file selection
- **Multiple Files**: Batch upload support
- **Progress Tracking**: Real-time upload progress indicators

### **2. AI-Powered Chat Interface**

#### **Chat Capabilities**
- **Natural Language Queries**: Ask questions in plain English
- **Contextual Responses**: AI understands document content
- **Document-Specific Answers**: Responses based on uploaded documents
- **General Knowledge**: Also handles general questions and conversations

#### **Response Features**
- **Intelligent Summarization**: Automatic document summarization
- **Key Point Extraction**: Identify and extract important information
- **Comparative Analysis**: Compare multiple documents
- **Citation Support**: Reference specific document sections

#### **Chat Management**
- **Conversation History**: Persistent chat sessions
- **Message Threading**: Organized conversation flow
- **Export Capabilities**: Save conversations for later reference
- **Search Functionality**: Search through chat history

### **3. RAG (Retrieval-Augmented Generation)**

#### **How RAG Works**
1. **Document Processing**: Documents are chunked and embedded
2. **Query Processing**: User questions are converted to embeddings
3. **Similarity Search**: Find most relevant document chunks
4. **Context Injection**: Relevant context is added to AI prompt
5. **Response Generation**: AI generates contextual responses

#### **RAG Benefits**
- **Accuracy**: Responses based on actual document content
- **Relevance**: Only relevant information is used
- **Transparency**: Users can see which documents were referenced
- **Consistency**: Responses are consistent with document content

### **4. User Management & Security**

#### **Authentication System**
- **User Registration**: Email-based account creation
- **Secure Login**: JWT-based authentication
- **Password Security**: Encrypted password storage
- **Session Management**: Secure session handling

#### **Privacy & Security**
- **User Isolation**: Documents are private to each user
- **Data Encryption**: Secure data transmission and storage
- **Access Control**: User-specific document access
- **Audit Trail**: Track document access and usage

---

## 🎨 **User Interface**

### **Main Application Layout**

#### **Header Section**
```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Cubi AI                    [Theme] [User Menu]      │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Logo**: Cubi AI branding with toggle functionality
- **Title**: Application name display
- **Theme Toggle**: Switch between light and dark modes
- **User Menu**: Account settings and logout options

#### **Sidebar Navigation**
```
┌─────────┐
│ [Logo]  │
│ [New]   │
│ [Search]│
│ [Hist]  │
│ [Acc]   │
└─────────┘
```

**Features:**
- **Collapsible Design**: Minimize to save screen space
- **Navigation Items**: Quick access to main features
- **Chat History**: Recent conversations list
- **User Profile**: Account management options

#### **Main Chat Area**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [User Message]                                             │
│  [AI Response]                                              │
│  [User Message]                                             │
│  [AI Response]                                              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [📎] [Input Field] [Send]                                  │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Message Display**: User and AI message bubbles
- **File Upload Button**: Document attachment functionality
- **Input Field**: Text input for questions
- **Send Button**: Submit messages to AI

### **Responsive Design**

#### **Mobile Layout (< 768px)**
- **Collapsed Sidebar**: Hidden by default
- **Full-Width Chat**: Maximized chat area
- **Touch-Optimized**: Larger touch targets
- **Simplified Navigation**: Essential features only

#### **Tablet Layout (768px - 1024px)**
- **Partial Sidebar**: Compact navigation
- **Optimized Spacing**: Balanced layout
- **Touch-Friendly**: Improved interaction

#### **Desktop Layout (> 1024px)**
- **Full Sidebar**: Complete navigation visible
- **Multi-Column**: Efficient use of screen space
- **Advanced Features**: All functionality available

---

## 🔄 **User Workflows**

### **1. First-Time User Onboarding**

#### **Step 1: Account Creation**
1. **Visit Application**: Navigate to Cubi AI homepage
2. **Sign Up**: Click "Get Started" or "Create Account"
3. **Enter Details**: Provide email, name, and password
4. **Email Verification**: Verify email address (if required)
5. **Welcome Screen**: Introduction to platform features

#### **Step 2: Initial Setup**
1. **Welcome Tour**: Optional guided tour of features
2. **Upload First Document**: Try document upload functionality
3. **Ask First Question**: Test chat interface
4. **Explore Features**: Discover additional capabilities

### **2. Document Upload Workflow**

#### **Step 1: File Selection**
1. **Click Upload**: Use upload button or drag & drop area
2. **Choose File**: Select document from file system
3. **Validate File**: System checks file type and size
4. **Confirm Upload**: Review file details and confirm

#### **Step 2: Processing**
1. **Upload Progress**: Real-time upload status
2. **Text Extraction**: Document content processing
3. **Embedding Generation**: Semantic analysis
4. **Storage**: Secure document storage
5. **Completion**: Success notification

#### **Step 3: Verification**
1. **Document List**: View uploaded documents
2. **Content Preview**: Verify text extraction
3. **Ready for Questions**: Document available for chat

### **3. Chat Interaction Workflow**

#### **Step 1: Ask Question**
1. **Type Question**: Enter question in chat input
2. **Submit**: Click send or press Enter
3. **Processing**: System processes query
4. **Response**: AI generates and displays answer

#### **Step 2: Follow-up Questions**
1. **Context Awareness**: AI remembers conversation
2. **Document References**: Citations to source documents
3. **Clarification**: Ask for more details if needed
4. **New Topics**: Switch to different subjects

#### **Step 3: Document-Specific Queries**
1. **Reference Documents**: Ask about specific uploaded files
2. **Cross-Document**: Compare multiple documents
3. **Summarization**: Request document summaries
4. **Key Points**: Extract important information

### **4. Document Management Workflow**

#### **Step 1: View Documents**
1. **Document List**: Access uploaded documents
2. **Search Documents**: Find specific files
3. **Filter Options**: Sort by type, date, size
4. **Preview Content**: Quick content review

#### **Step 2: Document Operations**
1. **Rename**: Change document names
2. **Delete**: Remove unwanted documents
3. **Download**: Save documents locally
4. **Share**: Share documents (if enabled)

#### **Step 3: Organization**
1. **Create Folders**: Organize documents
2. **Add Tags**: Categorize documents
3. **Favorites**: Mark important documents
4. **Archive**: Store old documents

---

## 🔧 **Technical Specifications**

### **System Requirements**

#### **Browser Compatibility**
- **Chrome**: Version 90+
- **Firefox**: Version 88+
- **Safari**: Version 14+
- **Edge**: Version 90+

#### **Device Support**
- **Desktop**: Windows, macOS, Linux
- **Tablet**: iPad, Android tablets
- **Mobile**: iPhone, Android phones
- **Minimum Resolution**: 320px width

#### **Network Requirements**
- **Internet Connection**: Required for AI processing
- **Upload Speed**: Minimum 1 Mbps for file uploads
- **Download Speed**: Minimum 2 Mbps for optimal experience
- **Latency**: < 200ms for responsive chat

### **Performance Specifications**

#### **Response Times**
- **Page Load**: < 3 seconds
- **Chat Response**: < 5 seconds
- **File Upload**: < 30 seconds (10MB file)
- **Document Processing**: < 60 seconds

#### **Concurrent Users**
- **Development**: 10 concurrent users
- **Production**: 1000+ concurrent users
- **Scalability**: Horizontal scaling support

#### **Storage Limits**
- **Free Tier**: 5 documents per month
- **Pro Tier**: Unlimited documents
- **File Size**: 10MB per file
- **Total Storage**: 1GB per user

### **Security Specifications**

#### **Data Protection**
- **Encryption**: AES-256 encryption
- **Transmission**: HTTPS/TLS 1.3
- **Storage**: Encrypted at rest
- **Access Control**: Role-based permissions

#### **Authentication**
- **Password Policy**: Minimum 8 characters
- **Session Timeout**: 24 hours
- **Multi-Factor**: Optional 2FA support
- **Account Lockout**: 5 failed attempts

#### **Privacy Compliance**
- **GDPR**: European data protection
- **CCPA**: California privacy rights
- **Data Retention**: User-controlled deletion
- **Audit Logs**: Access tracking

---

## 📡 **API Reference**

### **Authentication Endpoints**

#### **POST /api/auth/register**
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

#### **POST /api/auth/login**
Authenticate existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "jwt_token_here"
  }
}
```

### **Chat Endpoints**

#### **POST /api/chat**
Process a chat message.

**Request Body:**
```json
{
  "message": "What is this document about?",
  "chatId": "chat_123",
  "streaming": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "This document discusses...",
    "responseType": "ai_response",
    "hasLocalContext": true,
    "documents": [
      {
        "id": "doc_123",
        "filename": "document.pdf",
        "relevance": 0.85
      }
    ]
  }
}
```

#### **POST /api/chat/enhanced**
Enhanced chat with RAG capabilities.

**Request Body:**
```json
{
  "message": "Summarize the key points",
  "skipLocalContext": false,
  "useExternalAI": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Key points from your documents:...",
    "responseType": "ai_response",
    "hasLocalContext": true,
    "context": "Relevant document content...",
    "documents": [
      {
        "id": "doc_123",
        "filename": "document.pdf",
        "content": "Extracted content...",
        "similarity": 0.92
      }
    ]
  }
}
```

### **File Upload Endpoints**

#### **POST /api/upload**
Upload a document.

**Request Body:**
```json
{
  "file": "binary_file_data",
  "filename": "document.pdf",
  "fileType": "application/pdf"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": {
      "id": "doc_123",
      "filename": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "status": "processed"
    }
  }
}
```

#### **GET /api/upload/list**
List user documents.

**Response:**
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": "doc_123",
        "filename": "document.pdf",
        "fileType": "application/pdf",
        "fileSize": 1024000,
        "createdAt": "2024-12-01T10:00:00Z",
        "status": "processed"
      }
    ]
  }
}
```

### **User Management Endpoints**

#### **GET /api/users/profile**
Get user profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2024-12-01T10:00:00Z",
      "documentCount": 5,
      "chatCount": 12
    }
  }
}
```

#### **PUT /api/users/profile**
Update user profile.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "john.smith@example.com",
      "name": "John Smith",
      "updatedAt": "2024-12-01T11:00:00Z"
    }
  }
}
```

---

## ⚙️ **Configuration Guide**

### **Environment Variables**

#### **Required Variables**
```bash
# Database Configuration
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# AI Service APIs
OPENAI_API_KEY="sk-your-openai-api-key"
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"
COHERE_API_KEY="your-cohere-api-key"

# Application Settings
NODE_ENV="development"
PORT=3000
ALLOWED_ORIGINS="http://localhost:3000"
```

#### **Optional Variables**
```bash
# File Upload Settings
MAX_FILE_SIZE="10485760"  # 10MB in bytes
UPLOAD_PATH="./uploads"

# Rate Limiting
RATE_LIMIT_WINDOW="900000"  # 15 minutes in milliseconds
RATE_LIMIT_MAX="100"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
```

### **Database Configuration**

#### **SQLite Setup (Development)**
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

#### **PostgreSQL Setup (Production)**
```bash
# Update DATABASE_URL
DATABASE_URL="postgresql://user:password@localhost:5432/cubi_ai"

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### **File Storage Configuration**

#### **Local Storage (Development)**
```bash
# Create upload directory
mkdir -p uploads/documents

# Set permissions
chmod 755 uploads
chmod 755 uploads/documents
```

#### **Cloud Storage (Production)**
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="cubi-ai-documents"

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT="your-project-id"
GOOGLE_CLOUD_BUCKET="cubi-ai-documents"
```

### **AI Service Configuration**

#### **OpenAI Configuration**
```bash
# API Key
OPENAI_API_KEY="sk-your-openai-api-key"

# Model Selection
OPENAI_MODEL="gpt-4"
OPENAI_MAX_TOKENS="2000"
OPENAI_TEMPERATURE="0.7"
```

#### **Anthropic Configuration**
```bash
# API Key
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"

# Model Selection
ANTHROPIC_MODEL="claude-3-sonnet-20240229"
ANTHROPIC_MAX_TOKENS="2000"
```

#### **Cohere Configuration**
```bash
# API Key
COHERE_API_KEY="your-cohere-api-key"

# Model Selection
COHERE_MODEL="embed-english-light-v3.0"
COHERE_TRUNCATE="END"
```

---

## 🔧 **Troubleshooting**

### **Common Issues**

#### **1. File Upload Failures**

**Problem**: Files fail to upload or process.

**Solutions**:
- Check file size (max 10MB)
- Verify file format (PDF, DOCX, DOC, TXT)
- Ensure stable internet connection
- Clear browser cache and cookies
- Try different browser

**Error Messages**:
```
❌ Upload failed: File too large
❌ Upload failed: Invalid file type
❌ Upload failed: Network error
```

#### **2. Chat Response Issues**

**Problem**: AI doesn't respond or gives generic answers.

**Solutions**:
- Check API key configuration
- Verify internet connection
- Ensure documents are properly uploaded
- Try rephrasing the question
- Check API service status

**Error Messages**:
```
❌ Failed to get response
❌ No relevant documents found
❌ API service unavailable
```

#### **3. Authentication Problems**

**Problem**: Can't log in or access account.

**Solutions**:
- Verify email and password
- Check if account exists
- Reset password if needed
- Clear browser data
- Try incognito mode

**Error Messages**:
```
❌ Invalid credentials
❌ Account not found
❌ Session expired
```

#### **4. Performance Issues**

**Problem**: Slow loading or response times.

**Solutions**:
- Check internet connection
- Clear browser cache
- Close unnecessary tabs
- Try different device
- Contact support if persistent

**Performance Metrics**:
- Page load: < 3 seconds
- Chat response: < 5 seconds
- File upload: < 30 seconds

### **Debug Information**

#### **Browser Console**
```javascript
// Check for JavaScript errors
console.error('Error details');

// Verify API calls
console.log('API response:', response);

// Check network requests
// Open Developer Tools > Network tab
```

#### **Server Logs**
```bash
# Check application logs
tail -f logs/app.log

# Check error logs
grep "ERROR" logs/app.log

# Monitor API requests
grep "POST /api/chat" logs/app.log
```

#### **Database Issues**
```bash
# Check database connection
npx prisma db pull

# Verify migrations
npx prisma migrate status

# Reset database (development only)
npx prisma migrate reset
```

### **Support Resources**

#### **Documentation**
- **User Guide**: Complete feature documentation
- **API Reference**: Technical API documentation
- **FAQ**: Common questions and answers
- **Tutorials**: Step-by-step guides

#### **Contact Information**
- **Email Support**: support@cubi-ai.com
- **Live Chat**: Available during business hours
- **Community Forum**: User community discussions
- **GitHub Issues**: Technical bug reports

---

## ❓ **FAQ**

### **General Questions**

#### **Q: What is Cubi AI?**
**A**: Cubi AI is an intelligent document analysis platform that allows you to upload documents and ask questions about them using natural language. The AI understands your documents and provides contextual, accurate answers.

#### **Q: What file types are supported?**
**A**: Cubi AI supports PDF, DOCX, DOC, and TXT files up to 10MB each. The platform extracts text content and creates semantic embeddings for intelligent search and analysis.

#### **Q: Is my data secure?**
**A**: Yes, Cubi AI prioritizes security and privacy. All documents are encrypted, stored securely, and isolated per user. We use industry-standard security practices and comply with data protection regulations.

#### **Q: How accurate are the AI responses?**
**A**: The AI responses are based on the actual content of your uploaded documents using RAG (Retrieval-Augmented Generation) technology. This ensures responses are accurate, relevant, and grounded in your document content.

### **Technical Questions**

#### **Q: How does the document processing work?**
**A**: Documents are processed in several steps:
1. Text extraction from the original file
2. Content cleaning and normalization
3. Semantic embedding generation
4. Storage in secure database
5. Indexing for fast retrieval

#### **Q: What AI models are used?**
**A**: Cubi AI uses multiple AI services:
- **OpenAI GPT-4**: For advanced text generation
- **Anthropic Claude**: For detailed analysis
- **Cohere**: For semantic embeddings
- **Custom RAG**: For document retrieval

#### **Q: Can I use Cubi AI offline?**
**A**: No, Cubi AI requires an internet connection to process documents and generate AI responses. However, uploaded documents are stored locally for faster access.

#### **Q: How many documents can I upload?**
**A**: Free tier users can upload 5 documents per month, while Pro users have unlimited document uploads. Each file can be up to 10MB in size.

### **Usage Questions**

#### **Q: How do I get the best results?**
**A**: For optimal results:
- Upload high-quality, text-based documents
- Ask specific, clear questions
- Use multiple documents for comprehensive analysis
- Provide context in your questions

#### **Q: Can I compare multiple documents?**
**A**: Yes, you can upload multiple documents and ask questions that span across all of them. The AI will analyze all relevant documents and provide comprehensive answers.

#### **Q: How do I export my conversations?**
**A**: Chat conversations can be exported as PDF or text files. Look for the export option in the chat interface or user settings.

#### **Q: Can I share documents with others?**
**A**: Currently, documents are private to each user account. We're working on collaboration features for future releases.

### **Account & Billing**

#### **Q: How do I create an account?**
**A**: Visit the Cubi AI website and click "Get Started" or "Sign Up". You'll need to provide an email address, name, and create a password.

#### **Q: Is there a free trial?**
**A**: Yes, Cubi AI offers a free tier with basic features. You can upgrade to Pro for advanced features and unlimited usage.

#### **Q: How do I cancel my subscription?**
**A**: You can cancel your subscription at any time through your account settings. Your data will be retained according to our data retention policy.

#### **Q: What happens to my data if I cancel?**
**A**: Your documents and chat history are retained for 30 days after cancellation. You can download your data before the retention period expires.

### **Troubleshooting**

#### **Q: Why can't I upload my file?**
**A**: Check that your file:
- Is under 10MB in size
- Is in a supported format (PDF, DOCX, DOC, TXT)
- Has readable text content
- Isn't corrupted

#### **Q: Why are the AI responses generic?**
**A**: This usually happens when:
- No relevant documents are uploaded
- The question is too general
- Documents don't contain relevant information
- Try asking more specific questions about your documents

#### **Q: How do I reset my password?**
**A**: Use the "Forgot Password" link on the login page. You'll receive an email with instructions to reset your password.

#### **Q: Why is the app slow?**
**A**: Performance issues can be caused by:
- Slow internet connection
- Large file uploads
- High server load
- Browser cache issues
- Try refreshing the page or clearing browser cache

---

## 📞 **Support & Contact**

### **Getting Help**

#### **Documentation**
- **User Guide**: Complete feature documentation
- **API Reference**: Technical documentation
- **Tutorials**: Step-by-step guides
- **FAQ**: Common questions

#### **Contact Methods**
- **Email**: support@cubi-ai.com
- **Live Chat**: Available 9 AM - 6 PM EST
- **Community**: User forum and discussions
- **GitHub**: Technical issues and feature requests

#### **Response Times**
- **Email**: Within 24 hours
- **Live Chat**: Immediate during business hours
- **Community**: Varies based on community activity
- **Critical Issues**: Within 4 hours

### **Feedback & Suggestions**

#### **Feature Requests**
- **User Forum**: Community feature discussions
- **GitHub Issues**: Technical feature requests
- **Email**: Direct feedback to product team
- **In-App**: Feedback form in settings

#### **Bug Reports**
- **GitHub Issues**: Technical bug reports
- **Email**: Detailed bug descriptions
- **In-App**: Error reporting tool
- **Screenshots**: Include error messages and steps

---

*Document created: December 2024*
*Version: 1.0*
*Last updated: Product documentation phase*
