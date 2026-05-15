import { useCallback } from 'react';
import { useUser } from '@clerk/react';
import { useSSEChat, type ConnectionStatus, type RateLimitError } from '@/hooks/use-sse-chat';
import { useAISettings } from '@/contexts/ai-settings';
import { isClerkEnabled } from '@/lib/auth-config';
import { UNAUTHENTICATED_AI_MESSAGE } from '@/lib/ai-auth-messages';

/**
 * Re-export {@link ConnectionStatus} and {@link RateLimitError} qua wrapper
 * để consumer (page `/ai-chat`) chỉ cần import từ một module duy nhất.
 */
export type { ConnectionStatus, RateLimitError };

/**
 * Wrapper quanh {@link useSSEChat} thêm Clerk authentication gate và
 * trả về cùng public shape, mở rộng bằng `connectionStatus` (Requirement
 * 5.6) để consumer (`/ai-chat`) render banner "Mất kết nối — đang thử
 * lại…" khi reconnecting giữa chừng stream.
 */
export function useAISSEChat() {
  const { settings, activeKey, activeModel } = useAISettings();

  // Only call useUser when Clerk provider is present (isClerkEnabled is a
  // compile-time constant so the hook call order never changes between renders)
  const clerkUser = isClerkEnabled ? useUser() : { isSignedIn: undefined, isLoaded: false };
  const { isSignedIn, isLoaded } = clerkUser;

  const {
    messages,
    streamResponse: innerStreamResponse,
    isStreaming,
    setMessages,
    connectionStatus,
    rateLimitError,
    clearRateLimitError,
  } = useSSEChat({
    provider: settings.provider,
    apiKey: activeKey,
    model: activeModel,
  });

  const streamResponse = useCallback(
    async (url: string, body: any, signal?: AbortSignal): Promise<void> => {
      if (isClerkEnabled && isLoaded && isSignedIn === false) {
        setMessages([
          { role: 'user', content: body.context ?? body.content },
          { role: 'assistant', content: UNAUTHENTICATED_AI_MESSAGE },
        ]);
        return;
      }
      return innerStreamResponse(url, body, signal);
    },
    [isLoaded, isSignedIn, innerStreamResponse, setMessages],
  );

  return { messages, streamResponse, isStreaming, setMessages, connectionStatus, rateLimitError, clearRateLimitError };
}
