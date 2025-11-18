#!/usr/bin/env node
/**
 * MEMPRO V4 MCP Client
 * ====================
 *
 * Verbindet Claude Desktop mit dem zentralen MEMPRO Backend auf Hetzner.
 *
 * Installation:
 *   npx -y mempro-client
 *
 * Claude Config (~/.claude.json):
 * {
 *   "mcpServers": {
 *     "mempro": {
 *       "command": "npx",
 *       "args": ["-y", "mempro-client"],
 *       "env": {
 *         "MEMPRO_URL": "http://135.181.128.98:8821"
 *       }
 *     }
 *   }
 * }
 *
 * Tools:
 * - mempro_health()
 * - mempro_add(text, user_id)
 * - mempro_query(query, user_id)
 * - mempro_search(query, user_id, top_k)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Configuration
const MEMPRO_URL = process.env.MEMPRO_URL || 'http://135.181.128.98:8821';
const DEFAULT_USER = 'thorsten-secstack-prod';

// HTTP Helper
async function httpRequest(method, path, body = null) {
  const url = `${MEMPRO_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

// Create MCP Server
const server = new Server(
  {
    name: 'mempro-client',
    version: '4.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'mempro_health',
        description: 'Check MEMPRO backend health status (OpenMemory, Zep, LightRAG)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'mempro_add',
        description: 'Add memory to MEMPRO (writes to OpenMemory + Zep Cloud in parallel)',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to store in memory',
            },
            user_id: {
              type: 'string',
              description: 'User ID (default: thorsten-secstack-prod)',
              default: DEFAULT_USER,
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'mempro_query',
        description: 'Query MEMPRO memory (searches OpenMemory + Zep, returns combined results)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language search query',
            },
            user_id: {
              type: 'string',
              description: 'User ID',
              default: DEFAULT_USER,
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'mempro_search',
        description: 'Vector search across MEMPRO backends (multi-backend top-k search)',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
            user_id: {
              type: 'string',
              description: 'User ID',
              default: DEFAULT_USER,
            },
            top_k: {
              type: 'number',
              description: 'Maximum number of results (default: 5)',
              default: 5,
            },
          },
          required: ['query'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'mempro_health': {
        const result = await httpRequest('GET', '/healthz');
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mempro_add': {
        const { text, user_id = DEFAULT_USER } = args;
        const result = await httpRequest('POST', '/memory/add', {
          text,
          user_id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mempro_query': {
        const { query, user_id = DEFAULT_USER } = args;
        const result = await httpRequest('POST', '/memory/query', {
          query,
          user_id,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mempro_search': {
        const { query, user_id = DEFAULT_USER, top_k = 5 } = args;
        const result = await httpRequest('POST', '/vector/search', {
          query,
          user_id,
          top_k,
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MEMPRO V4 MCP Client running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
