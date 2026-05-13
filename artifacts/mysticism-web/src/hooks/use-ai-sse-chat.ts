import { useCallback } from 'react';
import { useUser } from '@clerk/react';
import { useSSEChat } from '@/hooks/use-sse-chat';
import { useAISettings } from '@/contexts/ai-settings';
import { isClerkEnabled } from '@/lib/auth-config';
import { UNAUTHENTICATED_AI_MESSAGE } from '@/lib/ai-auth-messages';

export function useAISSEChat() {
  const { settings, activeKey, activeModel } = useAISettings();

  // Only call useUser when Clerk provider is present (isClerkEnabled is a
  // compile-time constant so the hook call order never changes between renders)
  const clerkUser = isClerkEnabled ? useUser() : { isSignedIn: undefined, isLoaded: false };
  const { isSignedIn, isLoaded } = clerkUser;

  const { messages, streamResponse: innerStreamResponse, isStreaming, setMessages } = useSSEChat({
    provider: settings.provider,
    apiKey: activeKey,
    model: activeModel,
  });

  const streamResponse = useCallback(
    async (url: string, body: any): Promise<void> => {
      if (isClerkEnabled && isLoaded && isSignedIn === false) {
        setMessages([
          { role: 'user', content: body.context ?? body.content },
          { role: 'assistant', content: UNAUTHENTICATED_AI_MESSAGE },
        ]);
        return;
      }
      return innerStreamResponse(url, body);
    },
    [isLoaded, isSignedIn, innerStreamResponse, setMessages],
  );

  return { messages, streamResponse, isStreaming, setMessages };
}
