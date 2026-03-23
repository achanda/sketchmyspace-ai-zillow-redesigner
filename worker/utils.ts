import type { Message, MessageContentPart } from './types';
export const createMessage = (
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string | MessageContentPart[],
  toolCalls?: any[]
): Message => ({
  id: crypto.randomUUID(),
  role,
  content,
  timestamp: Date.now(),
  ...(toolCalls && { toolCalls })
});
export const createStreamResponse = (readable: ReadableStream) => new Response(readable, {
  headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  },
});
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const createEncoder = () => new TextEncoder();