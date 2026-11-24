import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,join} from 'node:path';
// Build a dependency-free Worker; retain the original static assets in source.
const folder=new URL('.',import.meta.url);
const projectRoot=resolve(fileURLToPath(new URL('../',folder))),output=resolve(projectRoot,'dist');
const manifest=readFileSync(join(projectRoot,'.openai/hosting.json'),'utf8');
if(!JSON.parse(manifest).project_id||JSON.parse(manifest).static||dirname(output)!==projectRoot)throw Error('Expected a Worker project and its own dist output directory.');
const code=['../shipping-config.js','../cart-core.js','md5.mjs','catalogue.mjs','meta-purchase.mjs','worker.mjs'].map(file=>readFileSync(new URL(file,folder),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export (function|const)/g,'$1')).join('\n');
// The verified target is this project's generated output, never the source images.
rmSync(output,{recursive:true,force:true});
mkdirSync(join(output,'server'),{recursive:true});mkdirSync(join(output,'.openai'),{recursive:true});
writeFileSync(join(output,'server/index.js'),code);
writeFileSync(join(output,'.openai/hosting.json'),manifest);
console.log('Built PayFast Worker.');
