/**
 * Scalability & Storage Service
 * Handles persistent storage, namespace segregation, and pruning strategies
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface StorageConfig {
  persistentPath: string;
  backupPath: string;
  maxSizeGB: number;
  retentionDays: number;
  pruningThreshold: number;
}

export interface NamespaceConfig {
  name: string;
  description: string;
  maxDocuments: number;
  retentionPolicy: 'keep_all' | 'keep_recent' | 'keep_relevant';
  relevanceThreshold: number;
}

export interface PruningMetrics {
  totalDocuments: number;
  documentsRemoved: number;
  spaceFreedMB: number;
  pruningTime: number;
  lastPruned: number;
}

export interface StorageMetrics {
  totalSizeMB: number;
  collectionsCount: number;
  documentsCount: number;
  averageDocumentSizeKB: number;
  storageUtilization: number;
  backupSizeMB: number;
  lastBackup: number;
}

export class ScalabilityService {
  private config: StorageConfig;
  private namespaces: Map<string, NamespaceConfig> = new Map();
  private pruningMetrics: PruningMetrics = {
    totalDocuments: 0,
    documentsRemoved: 0,
    spaceFreedMB: 0,
    pruningTime: 0,
    lastPruned: 0,
  };

  constructor(config: StorageConfig) {
    this.config = config;
    this.initializeNamespaces();
  }

  private initializeNamespaces() {
    // Define different namespaces for different content types
    const namespaceConfigs: NamespaceConfig[] = [
      {
        name: 'knowledge_base',
        description: 'Core knowledge base documents',
        maxDocuments: 10000,
        retentionPolicy: 'keep_all',
        relevanceThreshold: 0.7,
      },
      {
        name: 'chat_history',
        description: 'User chat history and conversations',
        maxDocuments: 5000,
        retentionPolicy: 'keep_recent',
        relevanceThreshold: 0.5,
      },
      {
        name: 'user_uploads',
        description: 'User uploaded documents',
        maxDocuments: 2000,
        retentionPolicy: 'keep_relevant',
        relevanceThreshold: 0.6,
      },
      {
        name: 'temporary',
        description: 'Temporary processing documents',
        maxDocuments: 1000,
        retentionPolicy: 'keep_recent',
        relevanceThreshold: 0.3,
      },
    ];

    namespaceConfigs.forEach(ns => {
      this.namespaces.set(ns.name, ns);
    });
  }

  // Persistent Storage Management
  async ensurePersistentStorage(): Promise<boolean> {
    try {
      console.log('🔧 Ensuring persistent storage configuration...');

      // Check if persistent path exists and is writable
      await fs.access(this.config.persistentPath);
      
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.config.backupPath, { recursive: true });

      // Verify ChromaDB can access the persistent storage
      const testScript = `
import chromadb
from chromadb.config import Settings

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(
            anonymized_telemetry=False,
            allow_reset=True
        )
    )
    print("SUCCESS: Persistent storage accessible")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${testScript}"`);
      
      if (result.stdout.includes('SUCCESS')) {
        console.log('✅ Persistent storage configured successfully');
        return true;
      } else {
        console.error('❌ Persistent storage configuration failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Error configuring persistent storage:', error);
      return false;
    }
  }

  async createBackup(): Promise<boolean> {
    try {
      console.log('💾 Creating backup...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.config.backupPath, `backup-${timestamp}`);
      
      // Create backup using rsync or similar
      const backupCommand = process.platform === 'win32' 
        ? `xcopy "${this.config.persistentPath}" "${backupPath}" /E /I /H /Y`
        : `rsync -av "${this.config.persistentPath}/" "${backupPath}/"`;

      await execAsync(backupCommand);
      
      console.log(`✅ Backup created: ${backupPath}`);
      return true;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      return false;
    }
  }

  // Namespace Segregation
  async createNamespace(namespaceName: string, config: NamespaceConfig): Promise<boolean> {
    try {
      console.log(`📁 Creating namespace: ${namespaceName}`);
      
      const script = `
import chromadb
from chromadb.config import Settings
import os

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(anonymized_telemetry=False)
    )
    
    # Create collection with namespace-specific settings
    collection = client.get_or_create_collection(
        name="${namespaceName}",
        metadata={
            "description": "${config.description}",
            "max_documents": ${config.maxDocuments},
            "retention_policy": "${config.retentionPolicy}",
            "relevance_threshold": ${config.relevanceThreshold},
            "created_at": "${new Date().toISOString()}"
        }
    )
    
    print("SUCCESS: Namespace created")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${script}"`);
      
      if (result.stdout.includes('SUCCESS')) {
        this.namespaces.set(namespaceName, config);
        console.log(`✅ Namespace '${namespaceName}' created successfully`);
        return true;
      } else {
        console.error(`❌ Failed to create namespace '${namespaceName}'`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error creating namespace '${namespaceName}':`, error);
      return false;
    }
  }

  async addDocumentToNamespace(
    namespaceName: string, 
    documentId: string, 
    content: string, 
    metadata: any
  ): Promise<boolean> {
    try {
      const namespace = this.namespaces.get(namespaceName);
      if (!namespace) {
        throw new Error(`Namespace '${namespaceName}' not found`);
      }

      // Check if namespace is at capacity
      const currentCount = await this.getDocumentCount(namespaceName);
      if (currentCount >= namespace.maxDocuments) {
        console.log(`⚠️ Namespace '${namespaceName}' at capacity, pruning old documents...`);
        await this.pruneNamespace(namespaceName);
      }

      const script = `
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import hashlib

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(anonymized_telemetry=False)
    )
    
    collection = client.get_collection("${namespaceName}")
    
    # Generate embedding
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embedding = model.encode("${content.replace(/"/g, '\\"')}").tolist()
    
    # Add document with namespace-specific metadata
    collection.add(
        documents=["${content.replace(/"/g, '\\"')}"],
        metadatas=[{
            "document_id": "${documentId}",
            "namespace": "${namespaceName}",
            "content_hash": hashlib.md5("${content}".encode()).hexdigest(),
            "timestamp": "${new Date().toISOString()}",
            **${JSON.stringify(metadata)}
        }],
        ids=["${documentId}"]
    )
    
    print("SUCCESS: Document added to namespace")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${script}"`);
      
      if (result.stdout.includes('SUCCESS')) {
        console.log(`✅ Document added to namespace '${namespaceName}'`);
        return true;
      } else {
        console.error(`❌ Failed to add document to namespace '${namespaceName}'`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error adding document to namespace '${namespaceName}':`, error);
      return false;
    }
  }

  async getDocumentCount(namespaceName: string): Promise<number> {
    try {
      const script = `
import chromadb
from chromadb.config import Settings

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(anonymized_telemetry=False)
    )
    
    collection = client.get_collection("${namespaceName}")
    count = collection.count()
    print(f"COUNT: {count}")
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${script}"`);
      
      if (result.stdout.includes('COUNT:')) {
        const count = parseInt(result.stdout.split('COUNT:')[1].trim());
        return count;
      } else {
        return 0;
      }
    } catch (error) {
      console.error(`❌ Error getting document count for '${namespaceName}':`, error);
      return 0;
    }
  }

  // Pruning Strategy
  async pruneNamespace(namespaceName: string): Promise<PruningMetrics> {
    const startTime = Date.now();
    const namespace = this.namespaces.get(namespaceName);
    
    if (!namespace) {
      throw new Error(`Namespace '${namespaceName}' not found`);
    }

    try {
      console.log(`🧹 Pruning namespace: ${namespaceName}`);
      
      const script = `
import chromadb
from chromadb.config import Settings
from datetime import datetime, timedelta
import json

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(anonymized_telemetry=False)
    )
    
    collection = client.get_collection("${namespaceName}")
    
    # Get all documents
    results = collection.get()
    total_docs = len(results['ids'])
    
    # Apply retention policy
    documents_to_remove = []
    cutoff_date = datetime.now() - timedelta(days=${this.config.retentionDays})
    
    for i, metadata in enumerate(results['metadatas']):
        if metadata and 'timestamp' in metadata:
            doc_date = datetime.fromisoformat(metadata['timestamp'].replace('Z', '+00:00'))
            
            if "${namespace.retentionPolicy}" == "keep_recent":
                if doc_date < cutoff_date:
                    documents_to_remove.append(results['ids'][i])
            elif "${namespace.retentionPolicy}" == "keep_relevant":
                # Remove documents below relevance threshold
                if metadata.get('relevance_score', 0) < ${namespace.relevanceThreshold}:
                    documents_to_remove.append(results['ids'][i])
    
    # Remove documents
    if documents_to_remove:
        collection.delete(ids=documents_to_remove)
    
    remaining_docs = collection.count()
    removed_docs = len(documents_to_remove)
    
    print(f"PRUNING_RESULT: {json.dumps({
        'total_documents': total_docs,
        'documents_removed': removed_docs,
        'remaining_documents': remaining_docs
    })}")
    
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${script}"`);
      
      if (result.stdout.includes('PRUNING_RESULT:')) {
        const pruningData = JSON.parse(
          result.stdout.split('PRUNING_RESULT:')[1].trim()
        );
        
        this.pruningMetrics = {
          totalDocuments: pruningData.total_documents,
          documentsRemoved: pruningData.documents_removed,
          spaceFreedMB: (pruningData.documents_removed * 0.1), // Estimate
          pruningTime: Date.now() - startTime,
          lastPruned: Date.now(),
        };
        
        console.log(`✅ Pruned ${pruningData.documents_removed} documents from '${namespaceName}'`);
        return this.pruningMetrics;
      } else {
        throw new Error('Pruning failed');
      }
    } catch (error) {
      console.error(`❌ Error pruning namespace '${namespaceName}':`, error);
      throw error;
    }
  }

  async autoPrune(): Promise<void> {
    console.log('🤖 Starting automatic pruning...');
    
    for (const [namespaceName, config] of this.namespaces) {
      try {
        const documentCount = await this.getDocumentCount(namespaceName);
        const utilization = (documentCount / config.maxDocuments) * 100;
        
        if (utilization > this.config.pruningThreshold) {
          console.log(`⚠️ Namespace '${namespaceName}' at ${utilization.toFixed(1)}% capacity, pruning...`);
          await this.pruneNamespace(namespaceName);
        }
      } catch (error) {
        console.error(`❌ Error auto-pruning namespace '${namespaceName}':`, error);
      }
    }
  }

  // Storage Metrics
  async getStorageMetrics(): Promise<StorageMetrics> {
    try {
      const script = `
import chromadb
from chromadb.config import Settings
import os
import json

try:
    client = chromadb.PersistentClient(
        path="${this.config.persistentPath}",
        settings=Settings(anonymized_telemetry=False)
    )
    
    # Get collection info
    collections = client.list_collections()
    total_docs = 0
    total_size = 0
    
    for collection in collections:
        count = collection.count()
        total_docs += count
        # Estimate size (rough calculation)
        total_size += count * 0.1  # MB per document estimate
    
    # Get disk usage
    disk_usage = os.path.getsize("${this.config.persistentPath}") / (1024 * 1024)  # MB
    
    print(f"STORAGE_METRICS: {json.dumps({
        'total_size_mb': total_size,
        'collections_count': len(collections),
        'documents_count': total_docs,
        'disk_usage_mb': disk_usage,
        'average_document_size_kb': (total_size * 1024 / max(total_docs, 1))
    })}")
    
except Exception as e:
    print(f"ERROR: {str(e)}")
`;

      const result = await execAsync(`python -c "${script}"`);
      
      if (result.stdout.includes('STORAGE_METRICS:')) {
        const metrics = JSON.parse(
          result.stdout.split('STORAGE_METRICS:')[1].trim()
        );
        
        return {
          totalSizeMB: metrics.total_size_mb,
          collectionsCount: metrics.collections_count,
          documentsCount: metrics.documents_count,
          averageDocumentSizeKB: metrics.average_document_size_kb,
          storageUtilization: (metrics.disk_usage_mb / this.config.maxSizeGB / 1024) * 100,
          backupSizeMB: 0, // Would need to calculate from backup directory
          lastBackup: Date.now(), // Would need to track from backup creation
        };
      } else {
        throw new Error('Failed to get storage metrics');
      }
    } catch (error) {
      console.error('❌ Error getting storage metrics:', error);
      return {
        totalSizeMB: 0,
        collectionsCount: 0,
        documentsCount: 0,
        averageDocumentSizeKB: 0,
        storageUtilization: 0,
        backupSizeMB: 0,
        lastBackup: 0,
      };
    }
  }

  // Namespace Management
  getNamespaces(): Map<string, NamespaceConfig> {
    return new Map(this.namespaces);
  }

  getNamespaceConfig(namespaceName: string): NamespaceConfig | undefined {
    return this.namespaces.get(namespaceName);
  }

  getPruningMetrics(): PruningMetrics {
    return { ...this.pruningMetrics };
  }

  // Configuration Management
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }
}

// Default configuration
export const defaultStorageConfig: StorageConfig = {
  persistentPath: './chroma_db',
  backupPath: './backups',
  maxSizeGB: 10,
  retentionDays: 30,
  pruningThreshold: 80, // Prune when 80% full
};

// Global scalability service instance
export const scalabilityService = new ScalabilityService(defaultStorageConfig); 