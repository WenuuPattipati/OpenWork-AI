/**
 * Performance Monitoring for Evidence Retrieval
 * 
 * Tracks timing and performance metrics for:
 * - Evidence gathering operations
 * - Cache operations
 * - Individual source API calls
 * - Phase 1 enhancements (conflict detection, sufficiency scoring)
 */

export interface PerformanceMetrics {
  totalDuration: number; // Total time in milliseconds
  cacheOperations: {
    hits: number;
    misses: number;
    hitRate: number;
    avgReadTime: number;
    avgWriteTime: number;
  };
  sourceTimings: {
    [source: string]: number; // Time in milliseconds per source
  };
  enhancements: {
    conflictDetection: number;
    sufficiencyScoring: number;
  };
  timestamp: string;
}

// In-memory storage for current operation metrics
let currentMetrics: Partial<PerformanceMetrics> = {};
let operationStartTime: number = 0;
let cacheReadTimes: number[] = [];
let cacheWriteTimes: number[] = [];

/**
 * Start tracking a new evidence gathering operation
 */
export function startPerformanceTracking(): void {
  operationStartTime = Date.now();
  currentMetrics = {
    sourceTimings: {},
    enhancements: {
      conflictDetection: 0,
      sufficiencyScoring: 0,
    },
  };
  cacheReadTimes = [];
  cacheWriteTimes = [];
}

/**
 * Track timing for a specific evidence source
 */
export function trackSourceTiming(source: string, duration: number): void {
  if (!currentMetrics.sourceTimings) {
    currentMetrics.sourceTimings = {};
  }
  currentMetrics.sourceTimings[source] = duration;
}

/**
 * Track cache read operation timing
 */
export function trackCacheRead(duration: number): void {
  cacheReadTimes.push(duration);
}

/**
 * Track cache write operation timing
 */
export function trackCacheWrite(duration: number): void {
  cacheWriteTimes.push(duration);
}

/**
 * Track conflict detection timing
 */
export function trackConflictDetection(duration: number): void {
  if (!currentMetrics.enhancements) {
    currentMetrics.enhancements = { conflictDetection: 0, sufficiencyScoring: 0 };
  }
  currentMetrics.enhancements.conflictDetection = duration;
}

/**
 * Track sufficiency scoring timing
 */
export function trackSufficiencyScoring(duration: number): void {
  if (!currentMetrics.enhancements) {
    currentMetrics.enhancements = { conflictDetection: 0, sufficiencyScoring: 0 };
  }
  currentMetrics.enhancements.sufficiencyScoring = duration;
}

/**
 * Complete tracking and return final metrics
 */
export function completePerformanceTracking(
  cacheHits: number,
  cacheMisses: number
): PerformanceMetrics {
  const totalDuration = Date.now() - operationStartTime;
  
  const avgReadTime = cacheReadTimes.length > 0
    ? cacheReadTimes.reduce((a, b) => a + b, 0) / cacheReadTimes.length
    : 0;
  
  const avgWriteTime = cacheWriteTimes.length > 0
    ? cacheWriteTimes.reduce((a, b) => a + b, 0) / cacheWriteTimes.length
    : 0;
  
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 0;
  
  return {
    totalDuration,
    cacheOperations: {
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: Math.round(hitRate * 100) / 100,
      avgReadTime: Math.round(avgReadTime * 100) / 100,
      avgWriteTime: Math.round(avgWriteTime * 100) / 100,
    },
    sourceTimings: currentMetrics.sourceTimings || {},
    enhancements: currentMetrics.enhancements || {
      conflictDetection: 0,
      sufficiencyScoring: 0,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format performance metrics for logging
 */
export function formatPerformanceMetrics(metrics: PerformanceMetrics): string {
  let formatted = '\n📊 PERFORMANCE METRICS\n';
  formatted += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  // Total duration
  formatted += `⏱️  Total Duration: ${metrics.totalDuration}ms (${(metrics.totalDuration / 1000).toFixed(2)}s)\n\n`;
  
  // Cache operations
  formatted += '💾 Cache Operations:\n';
  formatted += `   Hits: ${metrics.cacheOperations.hits}\n`;
  formatted += `   Misses: ${metrics.cacheOperations.misses}\n`;
  formatted += `   Hit Rate: ${metrics.cacheOperations.hitRate}%\n`;
  if (metrics.cacheOperations.avgReadTime > 0) {
    formatted += `   Avg Read Time: ${metrics.cacheOperations.avgReadTime}ms\n`;
  }
  if (metrics.cacheOperations.avgWriteTime > 0) {
    formatted += `   Avg Write Time: ${metrics.cacheOperations.avgWriteTime}ms\n`;
  }
  formatted += '\n';
  
  // Source timings (top 5 slowest)
  const sortedSources = Object.entries(metrics.sourceTimings)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  if (sortedSources.length > 0) {
    formatted += '🔍 Slowest Sources (Top 5):\n';
    sortedSources.forEach(([source, duration]) => {
      formatted += `   ${source}: ${duration}ms\n`;
    });
    formatted += '\n';
  }
  
  // Phase 1 enhancements
  if (metrics.enhancements.conflictDetection > 0 || metrics.enhancements.sufficiencyScoring > 0) {
    formatted += '⚡ Phase 1 Enhancements:\n';
    if (metrics.enhancements.conflictDetection > 0) {
      formatted += `   Conflict Detection: ${metrics.enhancements.conflictDetection}ms\n`;
    }
    if (metrics.enhancements.sufficiencyScoring > 0) {
      formatted += `   Sufficiency Scoring: ${metrics.enhancements.sufficiencyScoring}ms\n`;
    }
    formatted += '\n';
  }
  
  formatted += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  
  return formatted;
}

/**
 * Log performance metrics to console
 */
export function logPerformanceMetrics(metrics: PerformanceMetrics): void {
  console.log(formatPerformanceMetrics(metrics));
}

/**
 * Get performance summary for API response
 */
export function getPerformanceSummary(metrics: PerformanceMetrics): {
  totalDuration: number;
  cacheHitRate: number;
  sourcesQueried: number;
} {
  return {
    totalDuration: metrics.totalDuration,
    cacheHitRate: metrics.cacheOperations.hitRate,
    sourcesQueried: Object.keys(metrics.sourceTimings).length,
  };
}
