// Bounded diagnostic only. Provider uptime does not gate deterministic client CI.
const base='https://api.etymologyexplorer.com/staging/';
for(const path of ['autocomplete?word=David','get_details?ids=195188','get_connections?id=195188&direction=ance','get_trees?ids=195188']){
 try {const r=await fetch(base+path,{signal:AbortSignal.timeout(15000),redirect:'error'});const reader=r.body.getReader();let size=0;const parts=[];while(true){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();throw Error('too large');}parts.push(value);}const text=Buffer.concat(parts).toString('utf8');console.log(JSON.stringify({path,status:r.status,bytes:size,preview:text.slice(0,12000)}));}catch{console.log(JSON.stringify({path,error:'provider unavailable from runner'}));}
}
