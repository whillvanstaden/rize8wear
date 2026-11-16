import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// Build a dependency-free Worker; retain the original static assets in source.
const folder=new URL('.',import.meta.url);
const code=['md5.mjs','catalogue.mjs','worker.mjs'].map(file=>readFileSync(new URL(file,folder),'utf8').replace(/^import .*;\r?\n/gm,'').replace(/export (function|const)/g,'$1')).join('\n');
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
writeFileSync('dist/server/index.js',code);
writeFileSync('dist/.openai/hosting.json',readFileSync('.openai/hosting.json','utf8'));
console.log('Built PayFast Worker.');
