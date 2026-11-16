import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../',import.meta.url),file=new URL('index.html',root);
let html=readFileSync(file,'utf8');const stack=[],edits=[],catalogue={};let card,titleStart;
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const decode=s=>s.replace(/&amp;/g,'&').replace(/&apos;|&#39;/g,"'").replace(/&quot;/g,'"').replace(/&mdash;/g,'—').replace(/&ndash;/g,'–');
for(const match of html.matchAll(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi)){
 const tag=match[1].toLowerCase(),closing=match[0].startsWith('</');
 if(!closing){
  const attrs=Object.fromEntries(Array.from(match[0].matchAll(/([a-z][a-z0-9-]*)(?:="([^"]*)")?/gi),m=>[m[1],m[2]||'']));
  if((attrs.class||'').split(' ').includes('product-card'))card={audience:attrs['data-audience']||[...stack].reverse().find(a=>a.attrs['data-audience'])?.attrs['data-audience']||'Christmas',cancer:'data-cancer' in attrs,christmas:'data-christmas' in attrs,offset:match.index,tag:match[0]};
  if(tag==='h4'&&card)titleStart=match.index+match[0].length;
  if(!voids.has(tag))stack.push({tag,attrs});
 }else{
  if(tag==='h4'&&card&&titleStart!==undefined){
   card.name=decode(html.slice(titleStart,match.index).replace(/<[^>]*>/g,'').trim());
   const id=(card.audience+' '+card.name).normalize('NFKD').replace(/[^\x00-\x7F]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
   const {name,audience,cancer,christmas}=card;
   catalogue[id]={name,audience,cancer,christmas,colours:cancer?['White','Black']:christmas?['Red','Black','White']:['White','Black']};
   edits.push({...card,replacement:card.tag.replace(/\sdata-product-id="[^"]*"/g,'').slice(0,-1)+' data-product-id="'+id+'">'});card=null;titleStart=undefined;
  }
  const idx=stack.findLastIndex(a=>a.tag===tag);if(idx>=0)stack.splice(idx);
 }
}
for(const edit of edits.reverse())html=html.slice(0,edit.offset)+edit.replacement+html.slice(edit.offset+edit.tag.length);
writeFileSync(file,html);writeFileSync(new URL('catalogue.mjs',import.meta.url),'export const catalogue = '+JSON.stringify(catalogue,null,2)+';\n');
console.log('Prepared '+Object.keys(catalogue).length+' unique products.');
