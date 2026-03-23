import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult;
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'mock_zillow_redesign',
      description: 'Extracts photos from Zillow and generates makeovers',
      parameters: {
        type: 'object',
        properties: { zillow_url: { type: 'string' } },
        required: ['zillow_url']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'mock_upload_redesign',
      description: 'Generates AI makeovers for uploaded room photos',
      parameters: {
        type: 'object',
        properties: {
          rooms_analysis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                original_image_base64: { type: 'string' },
                room_type: { type: 'string' },
                detected_style: { type: 'string' }
              }
            }
          }
        },
        required: ['rooms_analysis']
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
        return { location: String(args.location), temperature: 22, condition: 'Sunny', humidity: 45 };
      case 'mock_zillow_redesign': {
        await new Promise(r => setTimeout(r, 2000));
        const rooms = [
          {
            name: "The Sun-Drenched Lounge",
            before: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=800",
            after: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
            description: "We traded the beige carpet for herringbone oak and added floor-to-ceiling linen drapes."
          }
        ];
        return { content: JSON.stringify({ rooms }) };
      }
      case 'mock_upload_redesign': {
        await new Promise(r => setTimeout(r, 2500));
        const analysis = (args.rooms_analysis as any[]) || [];
        const presets: Record<string, string> = {
          'Modern': "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
          'Boho': "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800",
          'Industrial': "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=800",
          'Minimalist': "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&q=80&w=800",
        };
        const rooms = analysis.map((item, i) => {
          const style = item.detected_style || 'Modern';
          const type = item.room_type || 'Space';
          return {
            name: `Redesigned ${type} (${style} Vision)`,
            before: item.original_image_base64 || "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800",
            after: presets[style] || presets['Modern'],
            description: `Based on your photo, we've reimagined this ${type} with a ${style} soul, optimizing the layout and emphasizing natural light.`
          };
        });
        return { content: JSON.stringify({ rooms: rooms.length > 0 ? rooms : [] }) };
      }
      default:
        return { content: await mcpManager.executeTool(name, args) };
    }
  } catch (error) {
    return { error: String(error) };
  }
}