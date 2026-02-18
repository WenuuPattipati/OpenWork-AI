/**
 * Biomedical Embedding Generator
 * 
 * Generates semantic embeddings for medical literature using sentence transformers.
 * Currently uses all-MiniLM-L6-v2 which is optimized for semantic similarity tasks.
 * 
 * Note: While PubMedBERT would be ideal for biomedical text, we use all-MiniLM-L6-v2
 * because it's readily available in ONNX format via @xenova/transformers. This model
 * still provides good semantic understanding for medical queries and can be upgraded
 * to a biomedical-specific model when available in ONNX format.
 * 
 * Implements caching and normalization for efficient similarity search.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FeatureExtractionPipeline = any;

// Dynamic import to make @xenova/transformers optional
let pipelineModule: typeof import('@xenova/transformers') | null = null;

async function getPipeline() {
  if (!pipelineModule) {
    try {
      pipelineModule = await import('@xenova/transformers');
    } catch (error) {
      console.warn('[EmbeddingGenerator] @xenova/transformers not available:', error);
      throw new Error('Embedding generation not available in this environment');
    }
  }
  return pipelineModule.pipeline;
}

export interface EmbeddingGenerator {
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  getDimension(): number;
  isReady(): boolean;
}

export class BioBERTEmbeddingGenerator implements EmbeddingGenerator {
  private model: FeatureExtractionPipeline | null = null;
  private readonly modelName = 'Xenova/all-MiniLM-L6-v2'; // Using a general model that works with @xenova/transformers
  private readonly dimension = 384; // MiniLM has 384 dimensions
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Load the embedding model into memory
   */
  private async loadModel(): Promise<void> {
    if (this.model) return;
    
    if (this.isLoading && this.loadPromise) {
      await this.loadPromise;
      return;
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        console.log(`[EmbeddingGenerator] Loading model: ${this.modelName}`);
        const startTime = Date.now();
        
        const pipeline = await getPipeline();
        this.model = await pipeline('feature-extraction', this.modelName);
        
        const loadTime = Date.now() - startTime;
        console.log(`[EmbeddingGenerator] Model loaded in ${loadTime}ms`);
      } catch (error) {
        console.error('[EmbeddingGenerator] Failed to load model:', error);
        throw new Error(`Failed to load embedding model: ${error}`);
      } finally {
        this.isLoading = false;
      }
    })();

    await this.loadPromise;
  }

  /**
   * Normalize a vector for cosine similarity
   */
  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }

  /**
   * Truncate text to model's maximum token length (512 tokens)
   */
  private truncateText(text: string): string {
    // Rough approximation: 1 token ≈ 4 characters
    const maxChars = 512 * 4;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars);
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    await this.loadModel();
    
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      const truncatedText = this.truncateText(text);
      
      // Generate embedding
      const output = await this.model(truncatedText, {
        pooling: 'mean',
        normalize: false, // We'll normalize manually
      });

      // Extract the embedding array
      let embedding: number[];
      if (Array.isArray(output)) {
        embedding = output;
      } else if (output.data) {
        embedding = Array.from(output.data);
      } else {
        throw new Error('Unexpected output format from model');
      }

      // Normalize for cosine similarity
      return this.normalize(embedding);
    } catch (error) {
      console.error('[EmbeddingGenerator] Failed to generate embedding:', error);
      throw new Error(`Failed to generate embedding: ${error}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batched)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    await this.loadModel();
    
    if (!this.model) {
      throw new Error('Model not loaded');
    }

    try {
      const embeddings: number[][] = [];
      
      // Process in batches to avoid memory issues
      const batchSize = 8;
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchEmbeddings = await Promise.all(
          batch.map(text => this.generateEmbedding(text))
        );
        embeddings.push(...batchEmbeddings);
      }
      
      return embeddings;
    } catch (error) {
      console.error('[EmbeddingGenerator] Failed to generate batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error}`);
    }
  }

  /**
   * Get embedding dimension
   */
  getDimension(): number {
    return this.dimension;
  }
  
  /**
   * Get model name
   */
  getModelName(): string {
    return this.modelName;
  }

  /**
   * Check if model is loaded and ready
   */
  isReady(): boolean {
    return this.model !== null && !this.isLoading;
  }
}

// Singleton instance for reuse across requests
let embeddingGeneratorInstance: BioBERTEmbeddingGenerator | null = null;

/**
 * Get the singleton embedding generator instance
 */
export function getEmbeddingGenerator(): BioBERTEmbeddingGenerator {
  if (!embeddingGeneratorInstance) {
    embeddingGeneratorInstance = new BioBERTEmbeddingGenerator();
  }
  return embeddingGeneratorInstance;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension');
  }
  
  // Since embeddings are normalized, dot product = cosine similarity
  return a.reduce((sum, val, i) => sum + val * b[i], 0);
}
