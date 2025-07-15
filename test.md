# Test Document

## Introduction
This is a test document to verify the functionality of our enhanced RAG system. The system should be able to process this markdown file, chunk it appropriately, and use it for context in conversations.

## Features to Test

### Document Processing
- Markdown parsing
- Chunking strategy
- Metadata extraction
- Content relevance scoring

### Conversation Management
- Message history
- Context enhancement
- Tool integration
- Response generation

### User Interface
- Document insights panel
- Conversation analytics
- Interactive timeline
- Tool usage tracking

## Sample Data

Here's some sample data to test different content types:

### Code Snippet
```python
def calculate_relevance(doc, query):
    # Calculate semantic similarity
    similarity = compute_similarity(doc, query)
    
    # Apply metadata weights
    weighted_score = apply_weights(similarity, doc.metadata)
    
    return weighted_score
```

### Table
| Feature | Status | Priority |
|---------|--------|----------|
| Document Processing | Complete | High |
| Context Enhancement | Complete | High |
| Tool Management | Complete | Medium |
| Analytics | Complete | Medium |

### List
1. Initialize RAG service
2. Upload test documents
3. Process documents
4. Start conversation
5. Monitor analytics
6. Export results

## Testing Instructions

1. Upload this file through the interface
2. Verify document insights panel shows correct metadata
3. Ask questions about the content
4. Check conversation analytics
5. Test tool integration
6. Export conversation history

## Expected Results

The system should:
- Successfully process this markdown file
- Extract and display metadata
- Show document chunks in the insights panel
- Use content for relevant queries
- Track and display analytics
- Support conversation export

## Notes

This test document includes various markdown elements to verify proper processing:
- Headers
- Lists
- Code blocks
- Tables
- Paragraphs

The RAG system should handle all these elements appropriately and maintain proper context during conversations. 