/**
 * NO-OP Observability Stubs for OpenWork-AI
 * 
 * This file provides stub implementations that replace the previous
 * tracing infrastructure.
 * All functions are NO-OPs and do not send data anywhere.
 */

// Type definitions for backward compatibility
export enum SpanStatusCode {
    UNSET = 0,
    OK = 1,
    ERROR = 2
}

export enum SpanKind {
    INTERNAL = 0,
    SERVER = 1,
    CLIENT = 2,
    PRODUCER = 3,
    CONSUMER = 4
}

export interface Span {
    setAttribute(key: string, value: any): Span;
    setStatus(status: { code: SpanStatusCode; message?: string }): Span;
    end(): void;
    recordException(exception: Error): void;
    spanContext(): { traceId: string; spanId: string; traceFlags: number };
    updateName(name: string): Span;
    setAttributes(attributes: Record<string, any>): Span;
    addEvent(name: string, attributes?: Record<string, any>): Span;
    addLink(link: any): Span;
    addLinks(links: any[]): Span;
    isRecording(): boolean;
}

// NO-OP context
export const context = {
    active: () => ({}),
    with: async <T>(ctx: any, fn: () => Promise<T>): Promise<T> => await fn(),
};

let isInitialized = false;

/**
 * Initialize Observability (NO-OP)
 */
export async function initObservability(): Promise<void> {
    if (isInitialized) return;
    console.log("🔭 Observability: Using NO-OP stubs (Tracing removed)");
    isInitialized = true;
}

/**
 * Get a tracer instance (NO-OP)
 */
export function getTracer(name: string = "openwork-ai") {
    return {
        startActiveSpan: async <T>(
            name: string,
            options: any,
            fn: (span: Span) => Promise<T>
        ): Promise<T> => {
            const span = createNoOpSpan();
            return await fn(span);
        },
    };
}

/**
 * Create a NO-OP span
 */
function createNoOpSpan(): Span {
    return {
        setAttribute: () => createNoOpSpan(),
        setStatus: () => createNoOpSpan(),
        end: () => { },
        recordException: () => { },
        spanContext: () => ({ traceId: 'no-op-trace', spanId: 'no-op-span', traceFlags: 0 }),
        updateName: () => createNoOpSpan(),
        setAttributes: () => createNoOpSpan(),
        addEvent: () => createNoOpSpan(),
        addLink: () => createNoOpSpan(),
        addLinks: () => createNoOpSpan(),
        isRecording: () => false,
    };
}

/**
 * Generate a session ID
 */
export function generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Result type for streaming chat operations
 */
export interface StreamingSpanResult<T> {
    result: T;
    span: Span;
    endSpan: () => void;
    captureOutputAndEnd: (output: string) => void;
}

/**
 * Create a span for chat operations (NO-OP)
 */
export async function withChatSpan<T>(
    userMessage: string,
    mode: string,
    sessionId: string,
    fn: (span: Span, captureOutput: (output: string) => void) => Promise<T>,
    options: { manualLifecycle?: boolean } = {}
): Promise<T | StreamingSpanResult<T>> {
    const span = createNoOpSpan();
    const captureOutput = (output: string) => { }; // NO-OP

    if (options.manualLifecycle) {
        const result = await fn(span, captureOutput);
        return {
            result,
            span,
            endSpan: () => { },
            captureOutputAndEnd: (output: string) => { },
        };
    } else {
        return await fn(span, captureOutput);
    }
}

/**
 * Capture token usage on a span (NO-OP)
 */
export function captureTokenUsage(
    span: Span,
    usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number; input?: number; output?: number; total?: number },
    modelName?: string
) {
    // NO-OP
}

/**
 * Create a span for tool/agent operations (NO-OP)
 */
export async function withToolSpan<T>(
    toolName: string,
    operation: string,
    fn: (span: Span) => Promise<T>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    const span = createNoOpSpan();
    return await fn(span);
}

/**
 * Create a span for LLM operations (NO-OP)
 */
export async function withLLMSpan<T>(
    modelName: string,
    userPrompt: string,
    sessionId: string,
    fn: (span: Span, captureOutput: (output: string) => void) => Promise<T>,
    options: { manualLifecycle?: boolean } = {}
): Promise<T | StreamingSpanResult<T>> {
    const span = createNoOpSpan();
    const captureOutput = (output: string) => { }; // NO-OP

    if (options.manualLifecycle) {
        const result = await fn(span, captureOutput);
        return {
            result,
            span,
            endSpan: () => { },
            captureOutputAndEnd: (output: string) => { },
        };
    } else {
        return await fn(span, captureOutput);
    }
}

/**
 * Record feedback for a trace (NO-OP)
 */
export async function recordFeedback(
    traceId: string,
    spanId: string,
    score: number,
    label: string,
    reason: string
) {
    // NO-OP
}

// --- RAG SPECIFIC HELPERS ---

export interface RetrievedDocument {
    id: string;
    content: string;
    score?: number;
    metadata?: Record<string, any>;
}

/**
 * Create a span for retrieval operations (NO-OP)
 */
export async function withRetrieverSpan<T>(
    stepName: string,
    fn: (span: Span) => Promise<{ result: T; documents: RetrievedDocument[] }>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    const span = createNoOpSpan();
    const { result } = await fn(span);
    return result;
}

/**
 * Create a span for reranking operations (NO-OP)
 */
export async function withRerankerSpan<T>(
    stepName: string,
    inputDocuments: RetrievedDocument[],
    fn: (span: Span) => Promise<{ result: T; rerankedDocuments: RetrievedDocument[] }>,
    attributes?: Record<string, string | number | boolean>
): Promise<T> {
    const span = createNoOpSpan();
    const { result } = await fn(span);
    return result;
}
