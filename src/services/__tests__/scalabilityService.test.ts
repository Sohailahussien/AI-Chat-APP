import { ScalabilityService, defaultStorageConfig, StorageConfig, NamespaceConfig } from '../scalabilityService';

// Mock child_process.exec
jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  mkdir: jest.fn(),
}));

describe('Scalability & Storage Service', () => {
  let scalabilityService: ScalabilityService;
  let mockExec: jest.MockedFunction<any>;
  let mockFs: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExec = require('child_process').exec as jest.MockedFunction<any>;
    mockFs = require('fs/promises');
    
    // Create a test configuration
    const testConfig: StorageConfig = {
      persistentPath: './test_chroma_db',
      backupPath: './test_backups',
      maxSizeGB: 5,
      retentionDays: 7,
      pruningThreshold: 70,
    };
    
    scalabilityService = new ScalabilityService(testConfig);
  });

  describe('Persistent Storage Management', () => {
    it('should ensure persistent storage is accessible', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockExec.mockResolvedValue({
        stdout: 'SUCCESS: Persistent storage accessible\n',
        stderr: '',
      });

      const result = await scalabilityService.ensurePersistentStorage();
      
      expect(result).toBe(true);
      expect(mockFs.access).toHaveBeenCalledWith('./test_chroma_db');
      expect(mockFs.mkdir).toHaveBeenCalledWith('./test_backups', { recursive: true });
      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle persistent storage configuration failure', async () => {
      mockFs.access.mockRejectedValue(new Error('Path not found'));
      
      const result = await scalabilityService.ensurePersistentStorage();
      
      expect(result).toBe(false);
    });

    it('should handle ChromaDB access failure', async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Connection failed\n',
        stderr: '',
      });

      const result = await scalabilityService.ensurePersistentStorage();
      
      expect(result).toBe(false);
    });

    it('should create backup successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: '',
        stderr: '',
      });

      const result = await scalabilityService.createBackup();
      
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle backup creation failure', async () => {
      mockExec.mockRejectedValue(new Error('Backup failed'));
      
      const result = await scalabilityService.createBackup();
      
      expect(result).toBe(false);
    });
  });

  describe('Namespace Segregation', () => {
    it('should create namespace successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: 'SUCCESS: Namespace created\n',
        stderr: '',
      });

      const namespaceConfig: NamespaceConfig = {
        name: 'test_namespace',
        description: 'Test namespace for unit tests',
        maxDocuments: 1000,
        retentionPolicy: 'keep_recent',
        relevanceThreshold: 0.6,
      };

      const result = await scalabilityService.createNamespace('test_namespace', namespaceConfig);
      
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle namespace creation failure', async () => {
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Collection already exists\n',
        stderr: '',
      });

      const namespaceConfig: NamespaceConfig = {
        name: 'existing_namespace',
        description: 'Existing namespace',
        maxDocuments: 1000,
        retentionPolicy: 'keep_all',
        relevanceThreshold: 0.5,
      };

      const result = await scalabilityService.createNamespace('existing_namespace', namespaceConfig);
      
      expect(result).toBe(false);
    });

    it('should add document to namespace successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: 'SUCCESS: Document added to namespace\n',
        stderr: '',
      });

      const result = await scalabilityService.addDocumentToNamespace(
        'knowledge_base',
        'doc_123',
        'Test document content',
        { source: 'test', category: 'unit_test' }
      );
      
      expect(result).toBe(true);
      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle document addition failure', async () => {
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Collection not found\n',
        stderr: '',
      });

      const result = await scalabilityService.addDocumentToNamespace(
        'nonexistent_namespace',
        'doc_123',
        'Test content',
        {}
      );
      
      expect(result).toBe(false);
    });

    it('should get document count successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: 'COUNT: 42\n',
        stderr: '',
      });

      const count = await scalabilityService.getDocumentCount('knowledge_base');
      
      expect(count).toBe(42);
      expect(mockExec).toHaveBeenCalled();
    });

    it('should handle document count failure', async () => {
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Collection not found\n',
        stderr: '',
      });

      const count = await scalabilityService.getDocumentCount('nonexistent_namespace');
      
      expect(count).toBe(0);
    });
  });

  describe('Pruning Strategy', () => {
    it('should prune namespace successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: 'PRUNING_RESULT: {"total_documents": 100, "documents_removed": 25, "remaining_documents": 75}\n',
        stderr: '',
      });

      const metrics = await scalabilityService.pruneNamespace('chat_history');
      
      expect(metrics.totalDocuments).toBe(100);
      expect(metrics.documentsRemoved).toBe(25);
      expect(metrics.spaceFreedMB).toBe(2.5); // 25 * 0.1
      expect(metrics.pruningTime).toBeGreaterThan(0);
      expect(metrics.lastPruned).toBeGreaterThan(0);
    });

    it('should handle pruning failure', async () => {
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Pruning failed\n',
        stderr: '',
      });

      await expect(
        scalabilityService.pruneNamespace('nonexistent_namespace')
      ).rejects.toThrow('Namespace \'nonexistent_namespace\' not found');
    });

    it('should auto-prune when namespace is at capacity', async () => {
      // Mock getDocumentCount to return high utilization
      jest.spyOn(scalabilityService, 'getDocumentCount').mockResolvedValue(900);
      jest.spyOn(scalabilityService, 'pruneNamespace').mockResolvedValue({
        totalDocuments: 900,
        documentsRemoved: 100,
        spaceFreedMB: 10,
        pruningTime: 1000,
        lastPruned: Date.now(),
      });

      await scalabilityService.autoPrune();
      
      expect(scalabilityService.getDocumentCount).toHaveBeenCalled();
      expect(scalabilityService.pruneNamespace).toHaveBeenCalled();
    });

    it('should not auto-prune when namespace is under threshold', async () => {
      // Mock getDocumentCount to return low utilization
      jest.spyOn(scalabilityService, 'getDocumentCount').mockResolvedValue(100);
      jest.spyOn(scalabilityService, 'pruneNamespace').mockResolvedValue({
        totalDocuments: 100,
        documentsRemoved: 0,
        spaceFreedMB: 0,
        pruningTime: 0,
        lastPruned: Date.now(),
      });

      await scalabilityService.autoPrune();
      
      expect(scalabilityService.getDocumentCount).toHaveBeenCalled();
      expect(scalabilityService.pruneNamespace).not.toHaveBeenCalled();
    });
  });

  describe('Storage Metrics', () => {
    it('should get storage metrics successfully', async () => {
      mockExec.mockResolvedValue({
        stdout: 'STORAGE_METRICS: {"total_size_mb": 150.5, "collections_count": 4, "documents_count": 1500, "disk_usage_mb": 200.0, "average_document_size_kb": 100.3}\n',
        stderr: '',
      });

      const metrics = await scalabilityService.getStorageMetrics();
      
      expect(metrics.totalSizeMB).toBe(150.5);
      expect(metrics.collectionsCount).toBe(4);
      expect(metrics.documentsCount).toBe(1500);
      expect(metrics.averageDocumentSizeKB).toBe(100.3);
      expect(metrics.storageUtilization).toBeGreaterThan(0);
      expect(metrics.backupSizeMB).toBe(0);
      expect(metrics.lastBackup).toBeGreaterThan(0);
    });

    it('should handle storage metrics failure', async () => {
      mockExec.mockResolvedValue({
        stdout: 'ERROR: Failed to get metrics\n',
        stderr: '',
      });

      const metrics = await scalabilityService.getStorageMetrics();
      
      expect(metrics.totalSizeMB).toBe(0);
      expect(metrics.collectionsCount).toBe(0);
      expect(metrics.documentsCount).toBe(0);
      expect(metrics.averageDocumentSizeKB).toBe(0);
      expect(metrics.storageUtilization).toBe(0);
    });
  });

  describe('Namespace Management', () => {
    it('should return all namespaces', () => {
      const namespaces = scalabilityService.getNamespaces();
      
      expect(namespaces.size).toBeGreaterThan(0);
      expect(namespaces.has('knowledge_base')).toBe(true);
      expect(namespaces.has('chat_history')).toBe(true);
      expect(namespaces.has('user_uploads')).toBe(true);
      expect(namespaces.has('temporary')).toBe(true);
    });

    it('should return namespace configuration', () => {
      const config = scalabilityService.getNamespaceConfig('knowledge_base');
      
      expect(config).toBeDefined();
      expect(config?.name).toBe('knowledge_base');
      expect(config?.maxDocuments).toBe(10000);
      expect(config?.retentionPolicy).toBe('keep_all');
    });

    it('should return undefined for non-existent namespace', () => {
      const config = scalabilityService.getNamespaceConfig('nonexistent');
      
      expect(config).toBeUndefined();
    });

    it('should return pruning metrics', () => {
      const metrics = scalabilityService.getPruningMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics.totalDocuments).toBe(0);
      expect(metrics.documentsRemoved).toBe(0);
      expect(metrics.spaceFreedMB).toBe(0);
      expect(metrics.pruningTime).toBe(0);
      expect(metrics.lastPruned).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxSizeGB: 20,
        retentionDays: 60,
        pruningThreshold: 90,
      };

      scalabilityService.updateConfig(newConfig);
      const updatedConfig = scalabilityService.getConfig();
      
      expect(updatedConfig.maxSizeGB).toBe(20);
      expect(updatedConfig.retentionDays).toBe(60);
      expect(updatedConfig.pruningThreshold).toBe(90);
    });

    it('should return current configuration', () => {
      const config = scalabilityService.getConfig();
      
      expect(config.persistentPath).toBe('./test_chroma_db');
      expect(config.backupPath).toBe('./test_backups');
      expect(config.maxSizeGB).toBe(5);
      expect(config.retentionDays).toBe(7);
      expect(config.pruningThreshold).toBe(70);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full workflow: create namespace, add documents, prune', async () => {
      // Mock successful operations
      mockExec
        .mockResolvedValueOnce({ stdout: 'SUCCESS: Namespace created\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'SUCCESS: Document added to namespace\n', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'COUNT: 1\n', stderr: '' })
        .mockResolvedValueOnce({ 
          stdout: 'PRUNING_RESULT: {"total_documents": 1, "documents_removed": 0, "remaining_documents": 1}\n', 
          stderr: '' 
        });

      // Create namespace
      const namespaceConfig: NamespaceConfig = {
        name: 'test_workflow',
        description: 'Test workflow namespace',
        maxDocuments: 100,
        retentionPolicy: 'keep_recent',
        relevanceThreshold: 0.5,
      };

      const createResult = await scalabilityService.createNamespace('test_workflow', namespaceConfig);
      expect(createResult).toBe(true);

      // Add document
      const addResult = await scalabilityService.addDocumentToNamespace(
        'test_workflow',
        'doc_1',
        'Test content',
        { test: true }
      );
      expect(addResult).toBe(true);

      // Check document count
      const count = await scalabilityService.getDocumentCount('test_workflow');
      expect(count).toBe(1);

      // Prune namespace
      const pruningMetrics = await scalabilityService.pruneNamespace('test_workflow');
      expect(pruningMetrics.totalDocuments).toBe(1);
      expect(pruningMetrics.documentsRemoved).toBe(0);
    });

    it('should handle storage overflow scenario', async () => {
      // Mock high document count
      jest.spyOn(scalabilityService, 'getDocumentCount').mockResolvedValue(950);
      jest.spyOn(scalabilityService, 'pruneNamespace').mockResolvedValue({
        totalDocuments: 950,
        documentsRemoved: 150,
        spaceFreedMB: 15,
        pruningTime: 2000,
        lastPruned: Date.now(),
      });

      // Mock storage metrics showing high utilization
      mockExec.mockResolvedValue({
        stdout: 'STORAGE_METRICS: {"total_size_mb": 800.0, "collections_count": 4, "documents_count": 950, "disk_usage_mb": 900.0, "average_document_size_kb": 800.0}\n',
        stderr: '',
      });

      const metrics = await scalabilityService.getStorageMetrics();
      expect(metrics.storageUtilization).toBeGreaterThan(0);

      await scalabilityService.autoPrune();
      
      const pruningMetrics = scalabilityService.getPruningMetrics();
      expect(pruningMetrics.documentsRemoved).toBe(150);
      expect(pruningMetrics.spaceFreedMB).toBe(15);
    });
  });
}); 