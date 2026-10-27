#!/usr/bin/env node
import {StdioServerTransport} from '@modelcontextprotocol/server/stdio';
import {createEtymologyExplorerMcpServer} from './mcp.js';
try {await createEtymologyExplorerMcpServer().connect(new StdioServerTransport());}
catch {console.error('Etymology Explorer MCP startup failed.');process.exitCode = 1;}
