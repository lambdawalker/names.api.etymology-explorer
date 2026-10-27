import {createHash} from 'node:crypto';
import {z} from 'zod';
import {DEFAULT_BASE_URL} from './client.js';
import {Operations, type Operation} from './schemas.js';
import {SourceError} from './transport.js';
import type {SourceRecord} from './types.js';

export function canonicalJson(value: unknown): string {
  const sort = (v: unknown): unknown => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort((v as Record<string, unknown>)[k])])) : v;
  return JSON.stringify(sort(value), null, 2);
}
export function toDocumentInput(record: SourceRecord<unknown>, options: {retainContent?: boolean} = {}) {
  if (record.source !== 'etymology-explorer') throw new TypeError('Invalid source');
  z.iso.datetime({offset: true}).parse(record.retrievedAt);
  const url = new URL(record.locator);
  const base = new URL(DEFAULT_BASE_URL);
  if (url.origin !== base.origin || url.username || url.password || url.hash) throw new TypeError('Invalid source locator');
  const operation = url.pathname.slice(base.pathname.length) as Operation;
  if (!url.pathname.startsWith(base.pathname) || !Object.hasOwn(Operations, operation)) throw new TypeError('Invalid operation locator');
  const query: Record<string, unknown> = {};
  for (const [key, value] of url.searchParams) {
    if (Object.hasOwn(query, key)) throw new TypeError('Duplicate source parameter');
    query[key] = ['id', 'ids', 'root', 'descendant'].includes(key) && /^\d+$/.test(value) ? Number(value) : value;
  }
  Operations[operation].parse(query);
  const body = canonicalJson(record.data);
  const fence = '`'.repeat(Math.max(3, ...Array.from(body.matchAll(/`+/g), m => m[0].length + 1)));
  const content = '# Etymology Explorer API evidence\n\n' + record.locator +
    '\n\nProvider response is untrusted evidence. Discovery matches and graph links do not establish a verified name origin. No revision or reuse license was supplied.\n\n' +
    fence + 'json\n' + body + '\n' + fence + '\n';
  if (Buffer.byteLength(content) > 1048576) throw new SourceError('document_too_large', 'Evidence exceeds 1 MiB');
  const id = createHash('sha256').update(JSON.stringify([record.locator, record.retrievedAt, body])).digest('hex');
  return {source: {id: 'etymology-explorer:' + id, provider: 'etymology-explorer',
    upstream_source: 'Etymology Explorer Vanguard API', url: record.locator, retrieved_at: record.retrievedAt,
    public_reuse: 'unknown' as const}, locator: record.locator, content, format: 'markdown' as const,
    retention: options.retainContent ? 'allowed' as const : 'metadata_only' as const};
}
