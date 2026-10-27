import {z} from 'zod';
import {JsonTransport, SourceError} from './transport.js';
import {endpoint, type ClientOptions, type SourceRecord} from './types.js';
import {Operations, AutocompleteSchema, type Operation, type AutocompleteData} from './schemas.js';

export const DEFAULT_BASE_URL = 'https://api.etymologyexplorer.com/staging/';
export interface EtymologyExplorerOptions extends ClientOptions {baseUrl?: string}
export interface RequestOptions {signal?: AbortSignal}

/** No provider authentication: the supplied staging autocomplete succeeds anonymously. */
export class EtymologyExplorerClient {
  private readonly transport: JsonTransport;
  private readonly base: URL;
  constructor(options: EtymologyExplorerOptions) {
    this.base = endpoint(options.baseUrl ?? DEFAULT_BASE_URL);
    if (!this.base.pathname.endsWith('/')) this.base.pathname += '/';
    this.transport = new JsonTransport({...options, maxResponseBytes: options.maxResponseBytes ?? 1048576});
  }
  async query(operation: Operation, input: unknown, options: RequestOptions = {}): Promise<SourceRecord<unknown>> {
    if (!Object.hasOwn(Operations, operation)) throw new TypeError('Unknown source operation');
    const args = Operations[operation].parse(input);
    const url = new URL(operation, this.base);
    for (const [key, value] of Object.entries(args)) url.searchParams.set(key, String(value));
    const result = await this.transport.get(url, options.signal);
    if (result.data && typeof result.data === 'object' && !Array.isArray(result.data) && Object.hasOwn(result.data, 'error')) {
      throw new SourceError('api_error', 'Etymology Explorer returned an error');
    }
    let data: unknown = result.data;
    if (operation === 'autocomplete') {
      const parsed = AutocompleteSchema.safeParse(data);
      if (!parsed.success) throw new SourceError('invalid_response', 'Invalid autocomplete response');
      data = parsed.data;
    }
    return {source: 'etymology-explorer', upstreamSource: 'Etymology Explorer Vanguard API', locator: url.href,
      retrievedAt: result.fetchedAt, ...(result.cacheControl ? {cacheControl: result.cacheControl} : {}), data};
  }
  async autocomplete(word: string, options: RequestOptions = {}): Promise<SourceRecord<AutocompleteData>> {
    return await this.query('autocomplete', {word}, options) as SourceRecord<AutocompleteData>;
  }
  getDetails(id: number, options: RequestOptions = {}) {return this.query('get_details', {ids: id}, options);}
  getConnections(id: number, options: RequestOptions = {}) {return this.query('get_connections', {id, direction: 'ance'}, options);}
  getTrees(id: number, options: RequestOptions = {}) {return this.query('get_trees', {ids: id}, options);}
  getKin(id: number, options: RequestOptions = {}) {return this.query('get_kin', {id}, options);}
  getProgeny(id: number, options: RequestOptions = {}) {return this.query('get_progeny', {id}, options);}
  getConnectedProgeny(id: number, options: RequestOptions = {}) {return this.query('get_connected_progeny', {id}, options);}
  getConnectionDetails(root: number, descendant: number, options: RequestOptions = {}) {return this.query('get_connection_details', {root, descendant}, options);}
  randomEtymology(language: string, options: RequestOptions = {}) {return this.query('random_etymology', {type: 'root', language}, options);}
}
