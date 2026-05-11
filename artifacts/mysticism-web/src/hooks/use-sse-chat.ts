import { useState } from 'react';
import { readSseStream } from '@/lib/sse-stream';

export interface SSEHeaders {
  provider?: string;
  apiKey?: string;
  model?: string;
}

export function useSSEChat(sseHeaders?: SSEHeaders) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const streamResponse = async (url: string, body: any) => {
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content: body.context || body.content }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };

      if (sseHeaders?.provider) {
        headers['x-ai-provider'] = sseHeaders.provider;
      }
      // Không gửi x-ai-key khi dùng server key
      if (sseHeaders?.apiKey && sseHeaders.provider !== 'server') {
        headers['x-ai-key'] = sseHeaders.apiKey;
      }
      if (sseHeaders?.model && sseHeaders.provider !== 'server') {
        headers['x-ai-model'] = sseHeaders.model;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Lỗi kết nối' }));
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}`;
          return copy;
        });
        return;
      }

      if (!response.body) throw new Error('No response body');

      for await (const { data } of readSseStream(response.body)) {
        const content = (data as { content?: unknown })?.content;
        if (typeof content === 'string' && content.length > 0) {
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              lastMessage.content += content;
            }
            return newMessages;
          });
        }
      }
    } catch (err) {
      console.error('SSE Error:', err);
    } finally {
      setIsStreaming(false);
    }
  };

  return { messages, streamResponse, isStreaming, setMessages };
}
