import React from 'react';

interface Document {
  pageContent: string;
  metadata: {
    filename?: string;
    type?: string;
    size?: number;
    relevance?: number;
    chunk_index?: number;
    total_chunks?: number;
    processing_timestamp?: string;
  };
}

interface DocumentInsightsProps {
  documents: Document[];
  activeDocument?: string | null;
  onDocumentClick?: (documentId: string) => void;
}

export const DocumentInsights: React.FC<DocumentInsightsProps> = ({
  documents,
  activeDocument,
  onDocumentClick,
}) => {
  const getRelevanceColor = (relevance: number = 0) => {
    if (relevance >= 0.8) return 'bg-green-500';
    if (relevance >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-4">Document Insights</h2>
      
      {/* Document Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">{documents.length}</div>
          <div className="text-sm text-gray-600">Total Documents</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">
            {documents.reduce((sum, doc) => sum + (doc.metadata.total_chunks || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total Chunks</div>
        </div>
        <div className="bg-purple-100 p-4 rounded-lg">
          <div className="text-2xl font-bold">
            {new Set(documents.map(doc => doc.metadata.type)).size}
          </div>
          <div className="text-sm text-gray-600">Document Types</div>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {documents.map((doc, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              activeDocument === doc.metadata.filename
                ? 'border-blue-500 bg-blue-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onDocumentClick?.(doc.metadata.filename || '')}
          >
            {/* Document Header */}
            <div className="flex justify-between items-center mb-2">
              <div className="font-semibold truncate">
                {doc.metadata.filename || `Document ${index + 1}`}
              </div>
              <div className="text-sm text-gray-500">
                {new Date(doc.metadata.processing_timestamp || '').toLocaleDateString()}
              </div>
            </div>

            {/* Document Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Type:</span>{' '}
                {doc.metadata.type || 'Unknown'}
              </div>
              <div>
                <span className="text-gray-600">Size:</span>{' '}
                {formatFileSize(doc.metadata.size)}
              </div>
              <div>
                <span className="text-gray-600">Chunks:</span>{' '}
                {doc.metadata.chunk_index !== undefined && doc.metadata.total_chunks
                  ? `${doc.metadata.chunk_index + 1}/${doc.metadata.total_chunks}`
                  : 'N/A'}
              </div>
              <div className="flex items-center">
                <span className="text-gray-600 mr-2">Relevance:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${getRelevanceColor(doc.metadata.relevance)} h-2 rounded-full`}
                    style={{
                      width: `${(doc.metadata.relevance || 0) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-2">
              <div className="text-sm text-gray-600 line-clamp-2">
                {doc.pageContent.substring(0, 150)}...
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 