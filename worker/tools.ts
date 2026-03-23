import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult;
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string', description: 'The city or location name' } },
        required: ['location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'mock_zillow_redesign',
      description: 'Extracts photos from a Zillow URL and generates AI interior design makeovers',
      parameters: {
        type: 'object',
        properties: {
          zillow_url: { type: 'string', description: 'The Zillow listing URL' }
        },
        required: ['zillow_url']
      }
    }
  }
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'get_weather':
        return {
          location: args.location as string,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 100)
        };
      case 'mock_zillow_redesign': {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        const rooms = [
          {
            name: "The Sun-Drenched Lounge",
            before: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
            after: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
            description: "We traded the beige carpet for herringbone oak and added floor-to-ceiling linen drapes to capture that golden hour glow."
          },
          {
            name: "Chef's Whimsical Kitchen",
            before: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800",
            after: "https://images.unsplash.com/photo-1556911220-bfc3ad884bd0?auto=format&fit=crop&q=80&w=800",
            description: "Say goodbye to 90s laminate! We've installed emerald green shaker cabinets and a reclaimed wood island for that farmhouse-chic soul."
          },
          {
            name: "The Dreamer's Suite",
            before: "https://images.unsplash.com/photo-1505693357370-58c35b547ee0?auto=format&fit=crop&q=80&w=800",
            after: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
            description: "A sanctuary of soft textures. We added a velvet headboard and built-in reading nooks to turn this bedroom into a cloud."
          }
        ];
        return { content: JSON.stringify({ rooms }) };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}