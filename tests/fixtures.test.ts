import {it,expect} from 'vitest';
import {readFile} from 'node:fs/promises';
import {EtymologyExplorerClient} from '../src/client.js';
for(const operation of ['get_details','get_connections','get_trees']as const)it('preserves observed '+operation+' payload without dropping provenance fields',async()=>{const raw=JSON.parse(await readFile(new URL('./fixtures/'+operation+'.json',import.meta.url),'utf8'));const c=new EtymologyExplorerClient({userAgent:'Tests/1',intervalMs:0,fetch:async()=>Response.json(raw)});const r=await c.query(operation,operation==='get_connections'?{id:195188,direction:'ance'}:{ids:195188});expect(r.data).toEqual(raw);});
