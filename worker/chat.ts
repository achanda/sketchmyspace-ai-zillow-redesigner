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
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{ content: string; toolCalls?: ToolCall[] }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
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
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: messages as any,
      tools: toolDefinitions as any,
      tool_choice: 'auto',
      max_tokens: 4096,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
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
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls, executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(completion: OpenAI.Chat.Completions.ChatCompletion, message: string, history: Message[]) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) return { content: 'I encountered an issue sketching.' };
    if (!responseMessage.tool_calls) return { content: responseMessage.content || 'I encountered an issue.' };
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(message, history, responseMessage.tool_calls, toolCalls);
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
  private async generateToolResponse(userMsg: string, history: Message[], toolCalls: any[], results: ToolCall[]): Promise<string> {
    const followUp = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'You are an illustrative AI interior designer. Respond naturally to the tool results.' },
        ...history.slice(-3).map(m => ({ role: m.role as any, content: m.content as any })),
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
      ],
      max_tokens: 2048
    });
    return followUp.choices[0]?.message?.content || 'Designs completed.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]) {
    const systemPrompt = `You are "SketchMySpace", a whimsical AI architect. 
    When users provide images, ANALYZE their layout, style, and lighting. 
    Then use the 'mock_upload_redesign' tool. 
    IMPORTANT: For each uploaded photo, identify the 'room_type' and 'detected_style'. 
    Pass the user's actual image URL (the base64 string) into the 'before' field for each room in your tool call if the tool supported it, but since our tool generates rooms, ensure you match your analysis to the output.
    Always return a final JSON object wrapped in markdown or plaintext for the UI to parse.`;
    return [
      { role: 'system', content: systemPrompt },
      ...history.slice(-5).map(m => ({ role: m.role, content: m.content })),
    ];
  }
  updateModel(newModel: string): void { this.model = newModel; }
}