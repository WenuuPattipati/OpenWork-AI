/**
 * Configuration Validator for Evidence System
 * 
 * Validates environment configuration on startup and provides
 * helpful warnings for missing or misconfigured settings.
 */

export interface ConfigValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  config: {
    googleGenerativeAiApiKey: boolean;
    ncbiApiKey: boolean;
    tavilyApiKey: boolean;
    dailyMedApiKey: boolean;
    redisUrl: boolean;
    openAlexEmail: boolean;
  };
}

/**
 * Validate evidence system configuration
 * Checks for required and optional environment variables
 */
export function validateEvidenceConfig(): ConfigValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Check required configuration
  const googleGenerativeAiApiKey = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!googleGenerativeAiApiKey) {
    errors.push('GOOGLE_GENERATIVE_AI_API_KEY is required but not set');
  }

  // Check optional but recommended configuration
  const ncbiApiKey = !!process.env.NCBI_API_KEY;
  if (!ncbiApiKey) {
    warnings.push('NCBI_API_KEY not set - PubMed rate limit will be 3 req/sec instead of 10 req/sec');
  }

  const tavilyApiKey = !!process.env.TAVILY_API_KEY;
  if (!tavilyApiKey) {
    warnings.push('TAVILY_API_KEY not set - Real-time medical search fallback disabled');
  }

  const dailyMedApiKey = !!process.env.NCBI_API_KEY_DAILYMED;
  if (!dailyMedApiKey) {
    warnings.push('NCBI_API_KEY_DAILYMED not set - DailyMed FDA drug information may have rate limits');
  }

  const redisUrl = !!process.env.REDIS_URL;
  if (!redisUrl) {
    warnings.push('REDIS_URL not set - Evidence caching disabled (queries will be slower and more expensive)');
  }

  const openAlexEmail = !!process.env.OPENALEX_EMAIL;
  if (!openAlexEmail) {
    warnings.push('OPENALEX_EMAIL not set - OpenAlex polite pool access disabled');
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    warnings,
    errors,
    config: {
      googleGenerativeAiApiKey,
      ncbiApiKey,
      tavilyApiKey,
      dailyMedApiKey,
      redisUrl,
      openAlexEmail,
    },
  };
}

/**
 * Log configuration validation results
 */
export function logConfigValidation(result: ConfigValidationResult): void {
  console.log('\n🔧 EVIDENCE SYSTEM CONFIGURATION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Log configuration status
  console.log('Configuration Status:');
  console.log(`  Google Gemini API Key: ${result.config.googleGenerativeAiApiKey ? '✅' : '❌'}`);
  console.log(`  NCBI API Key: ${result.config.ncbiApiKey ? '✅' : '⚠️  (optional)'}`);
  console.log(`  Tavily API Key: ${result.config.tavilyApiKey ? '✅' : '⚠️  (optional)'}`);
  console.log(`  DailyMed API Key: ${result.config.dailyMedApiKey ? '✅' : '⚠️  (optional)'}`);
  console.log(`  Redis Cache: ${result.config.redisUrl ? '✅' : '⚠️  (optional)'}`);
  console.log(`  OpenAlex Email: ${result.config.openAlexEmail ? '✅' : '⚠️  (optional)'}`);
  console.log('');

  // Log errors
  if (result.errors.length > 0) {
    console.log('❌ ERRORS:');
    result.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    console.log('');
  }

  // Log warnings
  if (result.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    result.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    console.log('');
  }

  // Log overall status
  if (result.isValid) {
    if (result.warnings.length === 0) {
      console.log('✅ Configuration is complete and optimal\n');
    } else {
      console.log('✅ Configuration is valid (with optional features disabled)\n');
    }
  } else {
    console.log('❌ Configuration is invalid - please fix errors above\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Validate configuration and log results on startup
 * Returns true if configuration is valid, false otherwise
 */
export function validateAndLogConfig(): boolean {
  const result = validateEvidenceConfig();
  logConfigValidation(result);
  return result.isValid;
}

/**
 * Get configuration summary for API responses
 */
export function getConfigSummary(): {
  cacheEnabled: boolean;
  tavilyEnabled: boolean;
  dailyMedEnabled: boolean;
  ncbiApiKeyConfigured: boolean;
} {
  return {
    cacheEnabled: !!process.env.REDIS_URL,
    tavilyEnabled: !!process.env.TAVILY_API_KEY,
    dailyMedEnabled: !!process.env.NCBI_API_KEY_DAILYMED,
    ncbiApiKeyConfigured: !!process.env.NCBI_API_KEY,
  };
}
