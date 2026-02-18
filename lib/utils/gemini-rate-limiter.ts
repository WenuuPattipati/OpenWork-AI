/**
 * Gemini API Rate Limiter with Multi-Key Support
 * Prevents 503 overload errors by queuing requests and rotating API keys
 */

interface ApiKeyStats {
  key: string;
  requestCount: number;
  lastUsed: number;
  failures: number;
}

class GeminiRateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestsPerSecond: number;
  private lastRequestTime = 0;
  private minDelay: number;
  
  // Multi-key support
  private apiKeys: ApiKeyStats[] = [];
  private currentKeyIndex = 0;

  constructor(requestsPerSecond: number = 10, apiKeys?: string[]) {
    // CRITICAL FIX: With 3 API keys, we can handle more requests per second
    // Each key can handle ~5 req/sec, so 3 keys = ~15 req/sec total capacity
    // But we limit to 10 req/sec to be safe and avoid overload
    this.requestsPerSecond = requestsPerSecond;
    this.minDelay = 1000 / requestsPerSecond; // ms between requests
    
    // Initialize API keys
    if (apiKeys && apiKeys.length > 0) {
      this.apiKeys = apiKeys.map(key => ({
        key,
        requestCount: 0,
        lastUsed: 0,
        failures: 0
      }));
      console.log(`🔑 Initialized Gemini rate limiter with ${apiKeys.length} API keys`);
    } else {
      // Single key fallback
      const singleKey = process.env.GEMINI_API_KEY || '';
      this.apiKeys = [{
        key: singleKey,
        requestCount: 0,
        lastUsed: 0,
        failures: 0
      }];
    }
  }

  /**
   * Get next API key using round-robin with health checking
   */
  getNextApiKey(): string {
    if (this.apiKeys.length === 1) {
      return this.apiKeys[0].key;
    }

    // Find healthiest key (least failures, least recently used)
    const sortedKeys = [...this.apiKeys].sort((a, b) => {
      // Prioritize keys with fewer failures
      if (a.failures !== b.failures) {
        return a.failures - b.failures;
      }
      // Then by least recently used
      return a.lastUsed - b.lastUsed;
    });

    const selectedKey = sortedKeys[0];
    const keyIndex = this.apiKeys.indexOf(selectedKey);
    
    // Update stats
    this.apiKeys[keyIndex].requestCount++;
    this.apiKeys[keyIndex].lastUsed = Date.now();
    
    // Log key selection for debugging (only occasionally to avoid spam)
    if (this.apiKeys[keyIndex].requestCount % 10 === 0) {
      console.log(`🔑 Using API Key ${keyIndex + 1}/${this.apiKeys.length} (${selectedKey.key.substring(0, 10)}...) - Request #${this.apiKeys[keyIndex].requestCount}`);
    }
    
    return selectedKey.key;
  }

  /**
   * Mark a key as failed (for health tracking)
   */
  markKeyFailure(apiKey: string) {
    const keyStats = this.apiKeys.find(k => k.key === apiKey);
    if (keyStats) {
      keyStats.failures++;
      console.warn(`⚠️ API key ${apiKey.substring(0, 10)}... marked as failed (${keyStats.failures} failures)`);
    }
  }

  /**
   * Reset failure count for a key (after successful request)
   */
  markKeySuccess(apiKey: string) {
    const keyStats = this.apiKeys.find(k => k.key === apiKey);
    if (keyStats && keyStats.failures > 0) {
      keyStats.failures = Math.max(0, keyStats.failures - 1);
    }
  }

  /**
   * Get stats for all API keys
   */
  getKeyStats(): ApiKeyStats[] {
    return this.apiKeys.map(k => ({
      key: `${k.key.substring(0, 10)}...${k.key.substring(k.key.length - 4)}`,
      requestCount: k.requestCount,
      lastUsed: k.lastUsed,
      failures: k.failures
    }));
  }

  async execute<T>(fn: () => Promise<T>, timeoutMs: number = 30000): Promise<T> {
    const executeStartTime = Date.now();
    console.log(`📥 Rate limiter: Queuing task (timeout: ${timeoutMs}ms, queue size: ${this.queue.length})`);
    
    return new Promise((resolve, reject) => {
      // Add timeout protection
      const timeoutId = setTimeout(() => {
        console.error(`⏱️ Rate limiter: Task timeout after ${timeoutMs}ms (queued for ${Date.now() - executeStartTime}ms)`);
        reject(new Error(`Rate limiter timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      
      this.queue.push(async () => {
        const taskStartTime = Date.now();
        console.log(`▶️ Rate limiter: Starting task execution (waited in queue: ${taskStartTime - executeStartTime}ms)`);
        try {
          const result = await fn();
          const taskElapsed = Date.now() - taskStartTime;
          console.log(`✅ Rate limiter: Task succeeded (execution time: ${taskElapsed}ms, total: ${Date.now() - executeStartTime}ms)`);
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          const taskElapsed = Date.now() - taskStartTime;
          console.error(`❌ Rate limiter: Task failed (execution time: ${taskElapsed}ms, total: ${Date.now() - executeStartTime}ms):`, error);
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    // CRITICAL FIX: Use iterative loop instead of recursion to avoid stack overflow
    while (this.queue.length > 0 || this.processing) {
      if (this.queue.length === 0) {
        this.processing = false;
        break;
      }

      this.processing = true;
      const task = this.queue.shift();
      const queueStartTime = Date.now();

      if (task) {
        try {
          // Ensure minimum delay between requests
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          
          if (timeSinceLastRequest < this.minDelay) {
            const delayNeeded = this.minDelay - timeSinceLastRequest;
            console.log(`⏳ Rate limiter: Waiting ${delayNeeded.toFixed(0)}ms before next request (queue size: ${this.queue.length})`);
            await new Promise(resolve => setTimeout(resolve, delayNeeded));
          }

          this.lastRequestTime = Date.now();
          console.log(`🚀 Rate limiter: Executing task (queue size: ${this.queue.length}, wait time: ${Date.now() - queueStartTime}ms)`);
          await task();
          console.log(`✅ Rate limiter: Task completed (elapsed: ${Date.now() - queueStartTime}ms)`);
        } catch (error) {
          // Log error but continue processing queue
          console.error(`❌ Rate limiter task failed (elapsed: ${Date.now() - queueStartTime}ms):`, error);
        }
      }
    }
    
    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }
}

// Parse API keys from environment
function parseApiKeys(): string[] {
  const keys: string[] = [];
  
  // Primary key
  if (process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY);
  }
  
  // Additional keys (GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.)
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  
  return keys;
}

// Parse API keys and log initialization
const parsedKeys = parseApiKeys();
// CRITICAL FIX: Increase rate limit to 15 req/sec with 3 keys (5 per key)
// This prevents queue backup and timeouts
const rateLimitPerSecond = parseInt(process.env.GEMINI_RATE_LIMIT_PER_SECOND || '15'); // Increased from 10 to 15

// Singleton instance - shared across all agents
export const geminiRateLimiter = new GeminiRateLimiter(
  rateLimitPerSecond,
  parsedKeys
);

// Log initialization on module load
if (parsedKeys.length > 0) {
  console.log(`🔑 Gemini Rate Limiter initialized:`);
  console.log(`   API Keys: ${parsedKeys.length} (${parsedKeys.map(k => k.substring(0, 10) + '...').join(', ')})`);
  console.log(`   Rate Limit: ${rateLimitPerSecond} requests/second`);
  console.log(`   Total Capacity: ~${rateLimitPerSecond * parsedKeys.length} requests/second across all keys`);
} else {
  console.warn('⚠️ No Gemini API keys found - rate limiter will not work');
}

/**
 * Wrapper for Gemini API calls with automatic rate limiting, retry, and key rotation
 */
export async function callGeminiWithRetry<T>(
  fn: (apiKey: string) => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000,
  timeoutMs: number = 30000
): Promise<T> {
  let lastError: Error | null = null;
  const callStartTime = Date.now();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Get next API key
    const apiKey = geminiRateLimiter.getNextApiKey();
    const attemptStartTime = Date.now();
    
    // #region debug log
    fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini-rate-limiter.ts:210',message:'API call attempt starting',data:{attempt,maxRetries,timeoutMs,apiKeyPrefix:apiKey.substring(0,10)+'...',elapsed:attemptStartTime-callStartTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    
    try {
      // Use rate limiter with timeout protection
      // CRITICAL: Double timeout protection - both in execute() and here
      const result = await Promise.race([
        geminiRateLimiter.execute(() => fn(apiKey), timeoutMs),
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`API call timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
      
      // Mark success
      geminiRateLimiter.markKeySuccess(apiKey);
      
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini-rate-limiter.ts:223',message:'API call attempt succeeded',data:{attempt,elapsed:Date.now()-attemptStartTime,totalElapsed:Date.now()-callStartTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      return result;
    } catch (error: any) {
      lastError = error;
      const attemptElapsed = Date.now() - attemptStartTime;

      // Check if it's a timeout, 503 overload, or 429 rate limit error
      const isTimeout = error?.message?.includes('timeout') || error?.message?.includes('Timeout');
      const isOverloaded = error?.status === 503 || 
                          error?.status === 429 ||
                          error?.message?.includes('overloaded') || 
                          error?.message?.includes('UNAVAILABLE') ||
                          error?.message?.includes('RESOURCE_EXHAUSTED');
      
      // #region debug log
      fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini-rate-limiter.ts:234',message:'API call attempt failed',data:{attempt,maxRetries,isTimeout,isOverloaded,error:error instanceof Error?error.message:'Unknown',attemptElapsed,totalElapsed:Date.now()-callStartTime,timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      if (isTimeout || isOverloaded) {
        // Mark this key as having issues
        geminiRateLimiter.markKeyFailure(apiKey);
        
        const errorType = isTimeout ? 'timeout' : 'overloaded';
        console.warn(`⚠️ Gemini ${errorType} (attempt ${attempt}/${maxRetries}), trying different key in ${retryDelay}ms...`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const backoffDelay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          continue;
        }
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  // #region debug log
  fetch('http://127.0.0.1:7243/ingest/7927b0b4-4494-4712-9407-b89fa1704153',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'gemini-rate-limiter.ts:252',message:'API call max retries exceeded',data:{maxRetries,totalElapsed:Date.now()-callStartTime,lastError:lastError instanceof Error?lastError.message:'Unknown',timestamp:Date.now()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  
  throw lastError || new Error('Max retries exceeded');
}

/**
 * Log API key usage statistics
 */
export function logApiKeyStats() {
  const stats = geminiRateLimiter.getKeyStats();
  console.log('\n📊 Gemini API Key Usage:');
  stats.forEach((stat, idx) => {
    console.log(`  Key ${idx + 1} (${stat.key}): ${stat.requestCount} requests, ${stat.failures} failures`);
  });
  console.log('');
}
