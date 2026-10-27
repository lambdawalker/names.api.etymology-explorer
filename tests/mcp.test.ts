import {it,expect} from 'vitest';
import {Client,InMemoryTransport} from '@modelcontextprotocol/client';
import {readFile} from 'node:fs/promises';
import {createEtymologyExplorerMcpServer} from '../src/mcp.js';
import {EtymologyExplorerClient} from '../src/client.js';
async function fixture(name:string){return JSON.parse(await readFile(new URL('./fixtures/'+name+'.json',import.meta.url),'utf8'));}
async function session(data:unknown,now?:()=>number){
 let calls=0;
 const source=new EtymologyExplorerClient({userAgent:'Tests/1',intervalMs:0,retries:0,fetch:async()=>{calls++;return Response.json(data);}});
 const server=createEtymologyExplorerMcpServer({client:source,now});
 const client=new Client({name:'tests',version:'1'});
 const[a,b]=InMemoryTransport.createLinkedPair();await server.connect(a);await client.connect(b);
 return {client,get calls(){return calls;},async close(){await client.close();await server.close();}};
}
function value(r:unknown):any{return JSON.parse((r as {content:{text:string}[]}).content[0]!.text);}
it('discovers nine read tools and reconstructs one stable JSON snapshot',async()=>{const data=await fixture('get_details');const s=await session(data);try{
 const tools=(await s.client.listTools()).tools;expect(tools).toHaveLength(9);expect(tools.every(t=>t.annotations?.readOnlyHint)).toBe(true);
 let offset=0,content='',snapshot:string|undefined,total=0;
 do{const r=await s.client.callTool({name:'get_details',arguments:{ids:195188,offset,limit:100,...(snapshot?{snapshot}:{})}});expect(r.isError).not.toBe(true);const p=value(r);snapshot??=p.snapshot;expect(p.snapshot).toBe(snapshot);expect(p.offset).toBe(offset);content+=p.content;total=p.total_units;if(p.next_offset===null)break;offset=p.next_offset;}while(offset<20000);
 expect(JSON.parse(content)).toEqual(data);expect(content.length).toBe(total);expect(s.calls).toBe(1);
}finally{await s.close();}});
it('rejects stale snapshots and changed selections without refetching',async()=>{let now=0;const s=await session({items:['abc']},()=>now);try{
 const first=value(await s.client.callTool({name:'get_details',arguments:{ids:1,limit:1}}));
 expect((await s.client.callTool({name:'get_details',arguments:{ids:2,offset:1,snapshot:first.snapshot}})).isError).toBe(true);
 now=300001;expect((await s.client.callTool({name:'get_details',arguments:{ids:1,offset:1,snapshot:first.snapshot}})).isError).toBe(true);expect(s.calls).toBe(1);
}finally{await s.close();}});
it('returns supplied autocomplete candidates through the actual MCP boundary',async()=>{const data=await fixture('autocomplete');const s=await session(data);try{const p=value(await s.client.callTool({name:'autocomplete',arguments:{word:'David',limit:8000}}));expect(JSON.parse(p.content).auto_complete_data[0]._id).toBe(195188);expect(p.locator).toContain('/staging/autocomplete?word=David');}finally{await s.close();}});
it('rejects unsupported arguments and unsafe continuation before fetching',async()=>{const s=await session({});try{for(const args of [{ids:1,offset:1},{ids:-1},{ids:1,unexpected:'x'.repeat(1000)}]){const r=await s.client.callTool({name:'get_details',arguments:args});expect(r.isError).toBe(true);expect(JSON.stringify(r).length).toBeLessThan(2000);}expect(s.calls).toBe(0);}finally{await s.close();}});
