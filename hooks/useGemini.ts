/**
 * useGemini Hook - Streaming AI Chat Interface
 *
 * Provides a React hook for interacting with the Gemini chat API
 * with streaming responses and file upload support.
 */

import { useState, useCallback, useRef } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  imageUrls?: string[];
  visualFindings?: Array<{
    finding: string;
    severity: 'critical' | 'moderate' | 'mild';
    coordinates: [number, number, number, number];
    label: string;
    fileIndex?: number;
  }>;
  medicalImages?: Array<{
    url: string;
    title: string;
    source: string;
    license: string;
    thumbnail?: string;
    description?: string;
  }>;
}

export interface UseGeminiOptions {
  mode: 'doctor';
  onMessage?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

export interface UseGeminiReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string, files?: File[], history?: ChatMessage[], retryCount?: number, isStudyMode?: boolean) => Promise<any>;
  clearMessages: () => void;
  abortRequest: () => void;
}

export function useGemini(options: UseGeminiOptions): UseGeminiReturn {
  const { mode, onMessage, onError } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, files?: File[], history?: ChatMessage[], retryCount = 0, isStudyMode = false) => {
    if (loading) return null;

    setLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        imageUrls: files ? await Promise.all(files.map(fileToBase64)) : undefined,
      };

      // Use provided history or current messages
      const conversationHistory = history || messages;
      const updatedHistory = [...conversationHistory, userMessage];

      // Only update internal state if no external history is provided
      if (!history) {
        setMessages(updatedHistory);
        onMessage?.(userMessage);
      }

      // Prepare request body
      const requestBody = {
        messages: updatedHistory,
        mode,
        files: files ? await Promise.all(files.map(fileToDataUrl)) : undefined,
        isStudyMode,
      };

      console.log("🔍 DEBUG: useGemini sent request:", {
        url: '/api/chat',
        method: 'POST',
        messagesCount: updatedHistory.length,
        mode,
        hasFiles: !!files?.length,
        hasExternalHistory: !!history
      });

      // Send request to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current?.signal,
      });

      console.log("🔍 DEBUG: useGemini received response:", {
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `HTTP error! status: ${response.status}`;
        let errorType = 'unknown';
        let retryAfter = 0;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          errorType = errorData.type || 'unknown';
          retryAfter = errorData.retryAfter || 0;
        } catch {
          // If we can't parse the error response, use the status
        }

        // Handle 503 Service Unavailable with automatic retry
        if ((response.status === 503 || errorType === 'service_unavailable') && retryCount < 2) {
          console.log(`⏳ Service unavailable, retrying in ${2 + retryCount} seconds... (attempt ${retryCount + 1}/3)`);
          setError(`🔄 Service temporarily busy, retrying in ${2 + retryCount} seconds...`);

          // Wait before retrying (exponential backoff: 2s, 3s, 4s)
          await new Promise(resolve => setTimeout(resolve, (2 + retryCount) * 1000));

          // Clear the retry error message
          setError(null);

          // Retry the request
          return sendMessage(content, files, history, retryCount + 1, isStudyMode);
        }

        // Handle specific error types with better user messages
        if (response.status === 503 || errorType === 'service_unavailable') {
          errorMessage = "🔄 Gemini's API is experiencing high demand. Please try again in a few moments.";
        } else if (response.status === 429) {
          errorMessage = "⏱️ Rate limit reached. Please wait a moment before sending another message.";
        } else if (response.status === 401) {
          errorMessage = "🔑 Authentication error. Please check your Gemini API configuration.";
        }

        throw new Error(errorMessage);
      }

      // Check if response is streaming (text/event-stream) or regular JSON
      // IMPORTANT: Do NOT use transfer-encoding: chunked as an indicator for streaming,
      // as it's often present on regular JSON responses and causes parsing failures.
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');


      if (isStreaming && response.body) {
        // Handle streaming response (Server-Sent Events)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = '';
        let visualFindings: any[] = [];
        let medicalImages: any[] = [];
        let model = 'gemini-3-flash-preview';

        // Only add assistant message to internal state if no external history is provided
        if (!history) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: '',
          };

          setMessages(prev => [...prev, assistantMessage]);
        }

        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                  break;
                }

                try {
                  const parsed = JSON.parse(data);

                  if (parsed.model) {
                    model = parsed.model;
                  }

                  if (parsed.visualFindings) {
                    visualFindings = parsed.visualFindings;
                  }

                  if (parsed.medicalImages) {
                    medicalImages = parsed.medicalImages;
                  }

                  if (parsed.content) {
                    assistantContent += parsed.content;
                  }

                  if (!history) {
                    setMessages(prev => {
                      const newMessages = [...prev];
                      const lastMessage = newMessages[newMessages.length - 1];
                      if (lastMessage.role === 'assistant') {
                        lastMessage.content = assistantContent;
                        if (visualFindings.length > 0) {
                          lastMessage.visualFindings = visualFindings;
                        }
                        if (medicalImages.length > 0) {
                          lastMessage.medicalImages = medicalImages;
                        }
                      }
                      return newMessages;
                    });
                  }
                } catch (parseError) {
                  console.warn('Failed to parse streaming data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Return result in expected format
        return {
          response: assistantContent,
          medicalImages,
          visualFindings,
          model,
        };
      } else {
        // Handle regular JSON response
        console.log("🔍 DEBUG: useGemini parsing JSON response");
        const result = await response.json();

        console.log("🔍 DEBUG: useGemini parsed result:", {
          hasResponse: !!result.response,
          responseLength: result.response?.length || 0,
          responsePreview: result.response?.substring(0, 100) + "...",
          hasExternalHistory: !!history,
          resultKeys: Object.keys(result)
        });

        // Only add assistant message to internal state if no external history is provided
        if (!history) {
          const assistantMessage: ChatMessage = {
            role: 'assistant',
            content: result.response || '',
            visualFindings: result.visualFindings,
            medicalImages: result.medicalImages,
          };

          setMessages(prev => [...prev, assistantMessage]);
          onMessage?.(assistantMessage);

          console.log("🔍 DEBUG: useGemini updated internal messages");
        } else {
          console.log("🔍 DEBUG: useGemini skipping internal state update (external history provided)");
        }

        // Return result in expected format
        const returnValue = {
          response: result.response || '',
          medicalImages: result.medicalImages || [],
          visualFindings: result.visualFindings || [],
          model: result.model || 'gemini-3-flash-preview',
        };

        console.log("🔍 DEBUG: useGemini returning:", {
          hasResponse: !!returnValue.response,
          responseLength: returnValue.response?.length || 0,
          medicalImagesCount: returnValue.medicalImages?.length || 0,
          model: returnValue.model
        });

        return returnValue;
      }

    } catch (err: any) {
      console.error("🔍 DEBUG: useGemini error:", {
        name: err.name,
        message: err.message,
        isAbortError: err.name === 'AbortError'
      });

      if (err.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }

      const errorMessage = err.message || 'An error occurred while sending the message';
      setError(errorMessage);
      onError?.(errorMessage);

      // Only remove assistant message from internal state if no external history is provided
      if (!history) {
        setMessages(prev => prev.filter(msg => !(msg.role === 'assistant' && msg.content === '')));
      }

      return null;
    } finally {
      console.log("🔍 DEBUG: useGemini finally block - setting loading to false");
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, mode, loading, onMessage, onError]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const abortRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    abortRequest,
  };
}

/**
 * Convert File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert File to data URL (includes mime prefix for server-side vision input)
 */
async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
