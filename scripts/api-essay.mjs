import {createServer} from 'node:http';
import {once} from 'node:events';
import {writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const output=await mkdtemp(join(tmpdir(),'hostbrid-api-essay-'));
import assert from 'node:assert/strict';
import {chrome,tab} from './browser.mjs';
const observed=[];
const start=async handler=>{const s=createServer(handler);s.listen(0,'127.0.0.1');await once(s,'listening');return s;};
const stop=s=>new Promise((resolve,reject)=>{s.closeAllConnections();s.close(e=>e?reject(e):resolve());});
const visitor=await start((q,r)=>{observed.push({server:'visitor',method:q.method,path:q.url});r.setHeader('Access-Control-Allow-Origin','*');r.setHeader('Content-Type','application/json');r.end(JSON.stringify({location:'visitor-machine'}));});
const site=await start((q,r)=>{observed.push({server:'site',method:q.method,path:q.url});if(q.url==='/api/contact'){r.setHeader('Content-Type','application/json');r.end(JSON.stringify({location:'intended-backend'}));}else if(q.url==='/missing'){r.statusCode=404;r.end('Missing');}else {r.setHeader('Content-Type','text/html');r.end('<!doctype html><title>Hostbrid local endpoint fixture</title><main data-contact-label>Local endpoint diagnostics</main>');}});
let browser;
try {
 browser=await chrome(output);const page=await tab(browser.port,390);
 try {
  await page.go('http://127.0.0.1:'+site.address().port+'/');
  const cases=await page.evaluate(`(async()=>{const refs=['http://localhost:${visitor.address().port}/api/contact','/missing','/fallback','/api/contact'];const results=[];for(const ref of refs){const response=await fetch(ref);const type=response.headers.get('content-type')||'';const body=await response.text();let location=null;try{location=JSON.parse(body).location||null;}catch{}results.push({status:response.status,json:type.includes('application/json'),location});}return results;})()`);
  assert.deepEqual(cases,[{status:200,json:true,location:'visitor-machine'},{status:404,json:false,location:null},{status:200,json:false,location:null},{status:200,json:true,location:'intended-backend'}]);
  assert.ok(observed.every(x=>x.method==='GET'));
  const result={status:'PASS_ISOLATED_BROWSER_API_DIAGNOSTICS',cases,observed,limits:['All servers owned loopback HTTP','Not native Hostbrid delivery or public HTTPS','No form submission, CORS authentication or inbox proof']};
  await writeFile(join(output,'api-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(result));
  console.log('PASS: wrong loopback service, missing404, HTML200 fallback, intended JSON API. GET only.');
 }finally{await page.close();}
}finally{if(browser)await browser.close();await stop(site);await stop(visitor);await rm(output,{recursive:true,force:true});}
