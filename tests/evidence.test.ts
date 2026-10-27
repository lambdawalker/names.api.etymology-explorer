import {it,expect} from 'vitest';
import {EtymologyExplorerClient} from '../src/client.js';
import {toDocumentInput} from '../src/evidence.js';
it('defaults storage to metadata-only with unknown reuse and no invented revision',async()=>{
 const client=new EtymologyExplorerClient({userAgent:'Tests/1',intervalMs:0,fetch:async()=>Response.json({etymology:'text with ``` fence'})});
 const r=await client.getDetails(195188);const doc=toDocumentInput(r);expect(doc.retention).toBe('metadata_only');expect(doc.source.public_reuse).toBe('unknown');expect(doc.source).not.toHaveProperty('revision');expect(doc.content).toContain('````json');expect(toDocumentInput(r,{retainContent:true}).retention).toBe('allowed');
 expect(()=>toDocumentInput({...r,locator:'https://evil.test/staging/get_details?ids=1'})).toThrow();
 expect(()=>toDocumentInput({...r,locator:'https://api.etymologyexplorer.com/staging/get_details?ids=1&token=secret'})).toThrow();
 expect(()=>toDocumentInput({...r,locator:'https://api.etymologyexplorer.com/staging/get_details?ids=1&ids=2'})).toThrow();
});
