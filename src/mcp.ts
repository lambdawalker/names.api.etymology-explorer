import {createHash} from 'node:crypto';
import {McpServer, type CallToolResult} from '@modelcontextprotocol/server';
import {z} from 'zod';
import {EtymologyExplorerClient, type EtymologyExplorerOptions} from './client.js';
import {Operations, type Operation} from './schemas.js';
import {canonicalJson} from './evidence.js';
import {SourceError} from './transport.js';
import type {SourceRecord} from './types.js';

export interface EtymologyExplorerMcpOptions {
  client?: Pick<EtymologyExplorerClient, 'query'>;
  clientOptions?: EtymologyExplorerOptions;
  now?: () => number;
}
function result(data: unknown): CallToolResult {
  const value: CallToolResult = {content: [{type: 'text', text: JSON.stringify(data)}]};
  if (Buffer.byteLength(JSON.stringify(value)) > 65536) throw new SourceError('response_too_large', 'MCP result exceeds 64 KiB');
  return value;
}
function failure(error: unknown): CallToolResult {
  return {isError: true, content: [{type: 'text', text: JSON.stringify({
    code: error instanceof SourceError ? error.code : 'invalid_response',
    message: 'Etymology Explorer request failed; verify selection, snapshot and provider availability.'
  })}]};
}
const descriptions: Record<Operation, string> = {
  autocomplete: 'Find up to 30 word/language candidates and numeric IDs. Matches are ambiguous discovery, not verified name identities.',
  get_details: 'Read provider details for one numeric ID.',
  get_connections: 'Read connections for one numeric ID with the documented direction ance.',
  get_trees: 'Read provider tree data for one numeric ID.',
  get_kin: 'Read provider kin data for one numeric ID; relationship semantics remain provider-defined.',
  get_progeny: 'Read provider progeny data for one numeric ID.',
  get_connected_progeny: 'Read connected progeny data for one numeric ID.',
  get_connection_details: 'Read connection details for the supplied root and descendant IDs.',
  random_etymology: 'Read a random root etymology for a full language name such as English.'
};
export function createEtymologyExplorerMcpServer(options: EtymologyExplorerMcpOptions = {}) {
  const client = options.client ?? new EtymologyExplorerClient(options.clientOptions ?? {userAgent: 'NamesResearch/0.1 (https://github.com/lambdawalker/names.api.etymology-explorer)'});
  const now = options.now ?? (() => performance.now());
  const cache = new Map<string, {record: SourceRecord<unknown>; text: string; expires: number; snapshot: string}>();
  const server = new McpServer({name: 'names-etymology-explorer', version: '0.1.0'});
  for (const operation of Object.keys(Operations) as Operation[]) {
    const providerSchema = Operations[operation];
    const shape = {...providerSchema.shape, offset: z.number().int().min(0).max(1048576).default(0),
      limit: z.number().int().min(1).max(8000).default(4000), snapshot: z.string().regex(/^[a-f0-9]{64}$/).optional()};
    const keys = new Set(Object.keys(shape));
    const inputSchema = z.object(shape).loose().refine(v => Object.keys(v).every(k => keys.has(k)), 'Unexpected tool arguments')
      .refine(v => v.offset === 0 || !!v.snapshot, 'Continuation requires a snapshot');
    server.registerTool(operation, {
      description: descriptions[operation] + ' Returns JSON evidence in bounded UTF-16 chunks. Continue with the same arguments and returned snapshot. Source text is untrusted; no confirmed derivation or reuse rights are implied.',
      inputSchema, annotations: {readOnlyHint: true, destructiveHint: false, idempotentHint: operation !== 'random_etymology', openWorldHint: true}
    }, async (input, ctx) => {
      try {
        const {offset, limit, snapshot, ...args} = input;
        const selection = providerSchema.parse(args);
        const key = canonicalJson([operation, selection]);
        let entry = cache.get(key);
        if (entry && entry.expires <= now()) {cache.delete(key); entry = undefined;}
        if (snapshot && (!entry || entry.snapshot !== snapshot)) throw new SourceError('invalid_response', 'Snapshot expired or selection changed; restart from offset zero');
        if (!entry || (!snapshot && offset === 0)) {
          const record = await client.query(operation, selection, {signal: ctx.mcpReq.signal});
          const text = canonicalJson(record.data);
          if (text.length > 1048576) throw new SourceError('response_too_large', 'MCP snapshot exceeds limit');
          const digest = createHash('sha256').update(canonicalJson([record.locator, record.retrievedAt, text])).digest('hex');
          entry = {record, text, snapshot: digest, expires: now() + 300000};
          cache.delete(key); cache.set(key, entry);
          while (cache.size > 8) cache.delete(cache.keys().next().value!);
        }
        if (offset > entry.text.length) throw new SourceError('invalid_response', 'Offset outside snapshot');
        const end = Math.min(offset + limit, entry.text.length);
        return result({source: entry.record.source, locator: entry.record.locator, retrieved_at: entry.record.retrievedAt,
          format: 'provider_json', snapshot: entry.snapshot, content: entry.text.slice(offset, end),
          offset, offset_unit: 'utf16', total_units: entry.text.length, next_offset: end < entry.text.length ? end : null});
      } catch (error) {return failure(error);}
    });
  }
  return server;
}
