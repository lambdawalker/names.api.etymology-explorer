#!/usr/bin/env node
import {EtymologyExplorerClient} from './client.js';
import {Operations, type Operation} from './schemas.js';
const [operation, raw] = process.argv.slice(2);
try {
  if (!operation || !Object.hasOwn(Operations, operation) || !raw || process.argv.length !== 4 || Buffer.byteLength(raw) > 4096) throw Error('input');
  const client = new EtymologyExplorerClient({userAgent: 'NamesResearch/0.1 (https://github.com/lambdawalker/names.api.etymology-explorer)'});
  console.log(JSON.stringify(await client.query(operation as Operation, JSON.parse(raw)), null, 2));
} catch {console.error('Usage: names-etymology-explorer OPERATION JSON_ARGUMENTS; verify input and provider availability.');process.exitCode = 1;}
