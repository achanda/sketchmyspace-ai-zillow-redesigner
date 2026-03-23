import OpenAI from 'openai';
import type { Message, ToolCall, MessageContentPart } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  constructor(aiGatewayUrl: string, apiKey: string, model: string) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
  }
  async processMessage(
    userContent: string | MessageContentPart[],
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const messages = this.buildConversationMessages(userContent, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: messages as any,
        tools: toolDefinitions as any,
        tool_choice: 'auto',
        max_completion_tokens: 4096,
        stream: true,
      });
      return this.handleStreamResponse(stream, conversationHistory, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: toolDefinitions as any,
      tool_choice: 'auto',
      max_tokens: 4096,
      stream: false
    });
    return this.handleNonStreamResponse(completion, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }
      if (delta?.tool_calls) {
        for (let i = 0; i < delta.tool_calls.length; i++) {
          const dtc = delta.tool_calls[i];
          if (!accumulatedToolCalls[i]) {
            accumulatedToolCalls[i] = {
              id: dtc.id || `tool_${Date.now()}_${i}`,
              type: 'function',
              function: { name: dtc.function?.name || '', arguments: dtc.function?.arguments || '' }
            };
          } else {
            if (dtc.function?.name) accumulatedToolCalls[i].function.name = dtc.function.name;
            if (dtc.function?.arguments) accumulatedToolCalls[i].function.arguments += dtc.function.arguments;
          }
        }
      }
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(completion: OpenAI.Chat.Completions.ChatCompletion, history: Message[]) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'I encountered an issue sketching.' };
    if (!responseMessage.tool_calls) return { content: responseMessage.content || 'I encountered an issue.' };
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(history, responseMessage.tool_calls as any, toolCalls);
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(openAiToolCalls.map(async (tc) => {
      try {
        const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
        const result = await executeTool(tc.function.name, args);
        return { id: tc.id, name: tc.function.name, arguments: args, result };
      } catch (error) {
        return { id: tc.id, name: tc.function.name, arguments: {}, result: { error: String(error) } };
      }
    }));
  }
  private async generateToolResponse(history: Message[], toolCalls: any[], results: ToolCall[]): Promise<string> {
    const followUp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: `You are SketchMySpace, the whimsical AI designer.
          Respond to the redesign tool results by summarizing the changes in a charming, illustrative style.
          ALWAYS include a final JSON block at the end of your response for the UI to parse.
          The JSON block must follow this exact schema:
          {
            "rooms": [
              {
                "name": "A creative room name",
                "before": "The original image URL provided in tool result",
                "after": "The redesigned image URL provided in tool result",
                "description": "A whimsical description of the changes"
              }
            ]
          }`
        },
        ...history.slice(-3).map(m => ({ role: m.role, content: Array.isArray(m.content) ? '[multimodal content]' : m.content })),
        {
          role: 'assistant',
          content: null,
          tool_calls: toolCalls
        },
        ...results.map((res, i) => ({
          role: 'tool' as const,
          content: JSON.stringify(res.result),
          tool_call_id: toolCalls[i]?.id || res.id
        }))
      ] as any,
      max_tokens: 2048
    });
    return followUp.choices[0]?.message?.content || 'Designs completed.';
  }
  private buildConversationMessages(userContent: string | MessageContentPart[], history: Message[]) {
    const systemPrompt = `You are "SketchMySpace", a whimsical AI architect and interior designer.
    When users provide images, ANALYZE their layout, current style, lighting, and potential for transformation.
    Use the 'mock_upload_redesign' tool for uploaded photos or 'mock_zillow_redesign' for Zillow links.
    CRITICAL: Your final response MUST contain a JSON block representing the redesigned rooms.
    Schema: { "rooms": [{ "name": string, "before": string, "after": string, "description": string }] }
    In the "description", use warm, creative language (e.g., "We replaced the tired carpets with herringbone oak...").
    If the user uploaded photos, describe how you improved their specific space.`;
    return [
      { role: 'system', content: systemPrompt },
      ...history.slice(-5).map(m => ({ 
        role: m.role, 
        content: Array.isArray(m.content) ? '[multimodal content]' : m.content 
      })),
      { role: 'user', content: Array.isArray(userContent) ? userContent : userContent }
    ];
  }
  updateModel(newModel: string): void { this.model = newModel; }
}