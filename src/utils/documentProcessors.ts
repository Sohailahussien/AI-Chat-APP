// Simple Document interface to replace LangChain import
interface Document {
  pageContent: string;
  metadata: Record<string, any>;
}

export class DocumentProcessor {
  async processText(text: string, metadata: Record<string, any> = {}): Promise<Document[]> {
    // Simple text splitting by paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return paragraphs.map(paragraph => ({
      pageContent: paragraph.trim(),
      metadata: { ...metadata, type: 'paragraph' }
    }));
  }

  async processURL(url: string): Promise<Document[]> {
    try {
      const response = await fetch(url);
      const text = await response.text();
      
      // Simple HTML to text conversion
      const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      return this.processText(cleanText, { source: url, type: 'url' });
    } catch (error) {
      console.error('Error processing URL:', error);
      return [];
    }
  }
} 