/**
 * Google Cloud Platform Configuration for Open Work
 * Limitless.ai Project - Indian Treatment Guidelines Priority
 */

import { Storage } from '@google-cloud/storage';
import { Firestore } from '@google-cloud/firestore';

// Environment validation
const requiredEnvVars = [
  'GOOGLE_CLOUD_PROJECT_ID',
  'GOOGLE_CLOUD_STORAGE_BUCKET',
  'GEMINI_API_KEY',
  'GEMINI_PRO_MODEL',
  'GEMINI_FLASH_MODEL'
];

// Validate environment variables
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

/**
 * Google Cloud Configuration
 */
export const GCP_CONFIG = {
  // Project Configuration
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID!,
  region: process.env.GOOGLE_CLOUD_REGION || 'us-central1',
  
  // Storage Configuration - Indian Guidelines
  storage: {
    bucketName: process.env.GOOGLE_CLOUD_STORAGE_BUCKET!,
    bucketRegion: process.env.GOOGLE_CLOUD_STORAGE_BUCKET_REGION || 'us-central1',
    guidelinesPath: 'guidelines/', // Path within bucket
  },
  
  // Firestore Configuration - Vector Database
  firestore: {
    databaseId: process.env.FIRESTORE_DATABASE_ID || '(default)',
    collections: {
      guidelines: process.env.FIRESTORE_COLLECTION_GUIDELINES || 'indian_treatment_guidelines',
      chunks: process.env.FIRESTORE_COLLECTION_GUIDELINE_CHUNKS || 'guideline_chunks',
    }
  },
  
  // Authentication
  credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || './gcp-service-account.json',
} as const;

/**
 * Gemini Model Configuration - STRICT 3.0 ONLY
 */
export const GEMINI_CONFIG = {
  // API Configuration
  apiKey: process.env.GEMINI_API_KEY!,
  
  // Model Specifications - ONLY 3.0 Models
  models: {
    flash: process.env.GEMINI_FLASH_MODEL! as 'gemini-3-flash-preview',
    pro: process.env.GEMINI_PRO_MODEL! as 'gemini-3-pro-preview',
    embedding: process.env.GEMINI_EMBEDDING_MODEL! as 'text-embedding-004',
  },
  
  // Agent-Specific Model Assignment
  agentModels: {
    queryIntelligence: process.env.AGENT_1_MODEL! as 'gemini-3-flash-preview',
    evidenceGapAnalyzer: process.env.AGENT_5_MODEL! as 'gemini-3-pro-preview',
    synthesisEngine: process.env.AGENT_6_MODEL! as 'gemini-3-pro-preview', // ALWAYS PRO
    verificationGate: process.env.AGENT_7_MODEL! as 'gemini-3-flash-preview',
  },
  
  // Model Selection Rules
  rules: {
    useProForSynthesis: process.env.USE_PRO_FOR_SYNTHESIS === 'true',
    useProForComplexQueries: process.env.USE_PRO_FOR_COMPLEX_QUERIES === 'true',
    useProForContradictions: process.env.USE_PRO_FOR_CONTRADICTIONS === 'true',
    fallbackModel: process.env.FALLBACK_MODEL! as 'gemini-3-flash-preview',
  },
  
  // Generation Configuration
  generation: {
    temperature: 0.2,
    maxOutputTokens: 1000,
    topP: 0.8,
    topK: 40,
  }
} as const;

/**
 * Data Source Priority Configuration
 */
export const DATA_SOURCE_CONFIG = {
  // Priority Order (1 = highest)
  priority: {
    indianGuidelines: parseInt(process.env.PRIORITY_INDIAN_GUIDELINES || '1'),
    pubmed: parseInt(process.env.PRIORITY_PUBMED || '2'),
    pmcFulltext: parseInt(process.env.PRIORITY_PMC_FULLTEXT || '3'),
    dailymed: parseInt(process.env.PRIORITY_DAILYMED || '4'),
    tavilyWeb: parseInt(process.env.PRIORITY_TAVILY_WEB || '5'),
  },
  
  // Guidelines Search Configuration
  guidelines: {
    minSimilarityScore: parseFloat(process.env.GUIDELINES_MIN_SIMILARITY_SCORE || '0.75'),
    maxResultsPerVariant: parseInt(process.env.GUIDELINES_MAX_RESULTS_PER_VARIANT || '20'),
    vectorSearchEnabled: process.env.GUIDELINES_VECTOR_SEARCH_ENABLED === 'true',
  },
  
  // External API Configuration
  external: {
    ncbi: {
      apiKey: process.env.NCBI_API_KEY!,
      dailymedApiKey: process.env.NCBI_API_KEY_DAILYMED!,
      rateLimitPerSecond: parseInt(process.env.NCBI_RATE_LIMIT_PER_SECOND || '10'),
    },
    tavily: {
      apiKey: process.env.TAVILY_API_KEY!,
      searchDepth: process.env.TAVILY_SEARCH_DEPTH || 'advanced',
      maxResults: parseInt(process.env.TAVILY_MAX_RESULTS || '10'),
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY!,
    }
  }
} as const;

/**
 * BGE Re-ranker Configuration
 */
export const BGE_CONFIG = {
  modelName: process.env.BGE_MODEL_NAME || 'BAAI/bge-reranker-v2-m3',
  device: process.env.BGE_DEVICE || 'cpu',
  batchSize: {
    cpu: parseInt(process.env.BGE_BATCH_SIZE_CPU || '32'),
    gpu: parseInt(process.env.BGE_BATCH_SIZE_GPU || '128'),
  },
  maxSequenceLength: parseInt(process.env.BGE_MAX_SEQUENCE_LENGTH || '512'),
  
  // Re-ranking Configuration
  reranking: {
    stage1TopDocuments: parseInt(process.env.STAGE1_TOP_DOCUMENTS || '20'),
    stage2TopChunks: parseInt(process.env.STAGE2_TOP_CHUNKS || '10'),
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000'),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200'),
  }
} as const;

/**
 * Initialize Google Cloud clients
 */
export class GCPClientManager {
  private static instance: GCPClientManager;
  private storageClient: Storage | null = null;
  private firestoreClient: Firestore | null = null;

  private constructor() {}

  static getInstance(): GCPClientManager {
    if (!GCPClientManager.instance) {
      GCPClientManager.instance = new GCPClientManager();
    }
    return GCPClientManager.instance;
  }

  /**
   * Get Google Cloud Storage client
   */
  getStorageClient(): Storage {
    if (!this.storageClient) {
      this.storageClient = new Storage({
        projectId: GCP_CONFIG.projectId,
        keyFilename: GCP_CONFIG.credentials,
      });
    }
    return this.storageClient;
  }

  /**
   * Get Firestore client
   */
  getFirestoreClient(): Firestore {
    if (!this.firestoreClient) {
      this.firestoreClient = new Firestore({
        projectId: GCP_CONFIG.projectId,
        keyFilename: GCP_CONFIG.credentials,
        databaseId: GCP_CONFIG.firestore.databaseId,
      });
    }
    return this.firestoreClient;
  }

  /**
   * Get Indian Guidelines bucket
   */
  getGuidelinesBucket() {
    const storage = this.getStorageClient();
    return storage.bucket(GCP_CONFIG.storage.bucketName);
  }

  /**
   * Get Firestore collections
   */
  getFirestoreCollections() {
    const db = this.getFirestoreClient();
    return {
      guidelines: db.collection(GCP_CONFIG.firestore.collections.guidelines),
      chunks: db.collection(GCP_CONFIG.firestore.collections.chunks),
    };
  }
}

/**
 * Model Selection Logic
 */
export class GeminiModelSelector {
  /**
   * Select appropriate model for synthesis based on complexity and contradictions
   */
  static selectSynthesisModel(complexityScore: number, hasContradictions: boolean): string {
    // ALWAYS use Pro for synthesis as per requirements
    if (GEMINI_CONFIG.rules.useProForSynthesis) {
      return GEMINI_CONFIG.models.pro;
    }
    
    // Fallback logic (though Pro is always preferred)
    if (complexityScore > 0.5 && GEMINI_CONFIG.rules.useProForComplexQueries) {
      return GEMINI_CONFIG.models.pro;
    }
    
    if (hasContradictions && GEMINI_CONFIG.rules.useProForContradictions) {
      return GEMINI_CONFIG.models.pro;
    }
    
    return GEMINI_CONFIG.rules.fallbackModel;
  }

  /**
   * Get model for specific agent
   */
  static getAgentModel(agentName: keyof typeof GEMINI_CONFIG.agentModels): string {
    return GEMINI_CONFIG.agentModels[agentName];
  }

  /**
   * Validate model is allowed (only 3.0 models)
   */
  static validateModel(modelName: string): boolean {
    const allowedModels = [
      GEMINI_CONFIG.models.flash,
      GEMINI_CONFIG.models.pro,
      GEMINI_CONFIG.models.embedding,
    ];
    
    return allowedModels.includes(modelName as any);
  }
}

/**
 * Configuration validation
 */
export function validateConfiguration(): void {
  console.log('🔧 Validating Open Work configuration...');
  
  // Validate Gemini models
  const models = Object.values(GEMINI_CONFIG.models);
  models.forEach(model => {
    if (!GeminiModelSelector.validateModel(model)) {
      throw new Error(`Invalid Gemini model: ${model}. Only 3.0 models allowed.`);
    }
  });
  
  // Validate data source priorities
  const priorities = Object.values(DATA_SOURCE_CONFIG.priority);
  const uniquePriorities = new Set(priorities);
  if (uniquePriorities.size !== priorities.length) {
    throw new Error('Data source priorities must be unique');
  }
  
  // Validate Indian Guidelines priority is 1
  if (DATA_SOURCE_CONFIG.priority.indianGuidelines !== 1) {
    throw new Error('Indian Guidelines must have priority 1 (highest)');
  }
  
  console.log('✅ Configuration validation passed');
  console.log(`📊 Project: ${GCP_CONFIG.projectId}`);
  console.log(`🗂️  Guidelines Bucket: ${GCP_CONFIG.storage.bucketName}`);
  console.log(`🤖 Synthesis Model: ${GEMINI_CONFIG.models.pro} (ALWAYS PRO)`);
  console.log(`🔍 Primary Source: Indian Guidelines (Priority ${DATA_SOURCE_CONFIG.priority.indianGuidelines})`);
  console.log(`📚 Secondary Source: PubMed (Priority ${DATA_SOURCE_CONFIG.priority.pubmed})`);
}

// Export singleton instance
export const gcpClient = GCPClientManager.getInstance();

// Validate configuration on import
validateConfiguration();