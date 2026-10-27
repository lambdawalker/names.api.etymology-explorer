#!/usr/bin/env node
import {createEtymologyExplorerMcpServer} from './mcp.js';
import {startConfiguredService} from './local-service.js';
try {await startConfiguredService('etymology-explorer', config => createEtymologyExplorerMcpServer({clientOptions: {userAgent: config.userAgent}}));}
catch {console.error('Service startup failed; check configuration, control credential and port.');process.exitCode = 1;}
