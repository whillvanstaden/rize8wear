import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{signature,parameterString,validateOrder} from './worker.mjs';
import {md5} from './md5.mjs';
const origin='https://rize8wear.co.za',base='https://rize8wear-preview.grey-haven-7361.chatgpt.site';
const input=()=>({productId:'christmas-mom-jesus-is-the-reason',size:'M',colour:'Black',quantity:3,addressConfirmed:true,customer:{name:'Test Customer',email:'test@example.com',phone:'0820000000',street:'123 Example Street',unit:'',suburb:'Test Suburb',city:'Test City',province:'Gauteng',postalCode:'0001'}});
function environment(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('drizzle/0000_orders.sql',import.meta.url),'utf8'));
 return {PAYFAST_MODE:'sandbox',PAYFAST_ENABLED:'true',DB:{prepare(sql){return {bind(...args){const statement=db.prepare(sql);return {async first(){return statement.get(...args);},async run(){return statement.run(...args);}};}}}},_db:db};
}
const checkout=(env,body=input())=>worker.fetch(new Request(base+'/api/checkout',{method:'POST',headers:{Origin:origin,'content-type':'application/json','CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify(body)}),env);
const notify=(env,pairs,ip='197.97.145.144')=>worker.fetch(new Request(base+'/api/payfast/notify',{method:'POST',headers:{'CF-Connecting-IP':ip},body:new URLSearchParams(pairs).toString()}),env);
function notification(id,overrides={}){const pairs=Object.entries({m_payment_id:id,pf_payment_id:'123456',payment_status:'COMPLETE',item_name:'RIZE8 test',amount_gross:'639.00',amount_fee:'-5.00',amount_net:'634.00',merchant_id:'10000100',...overrides});pairs.push(['signature',signature(pairs,'',true)]);return pairs;}
test('MD5 matches Node for padding boundaries and Unicode',()=>{for(const value of ['','abc','a'.repeat(55),'a'.repeat(56),'a'.repeat(64),'a'.repeat(300),'Geseënde Kersfees'])assert.equal(md5(value),createHash('md5').update(value).digest('hex'));});
test('PayFast encoding uses PHP form encoding and documented ordering',()=>{assert.equal(parameterString([['name','Test !~()*'],['empty','']]),'name=Test+%21%7E%28%29%2A');const pairs=[['name','Test User'],['amount','639.00']];assert.equal(signature(pairs,'phrase'),createHash('md5').update('name=Test+User&amount=639.00&passphrase=phrase').digest('hex'));});
test('server prices ignore client amounts and enforce three-shirt deal',()=>{for(const [qty,expected] of [[1,29800],[2,49700],[3,63900]])assert.equal(validateOrder({...input(),quantity:qty,unitCents:1,totalCents:1}).totalCents,expected);assert.throws(()=>validateOrder({...input(),colour:'Green'}));assert.throws(()=>validateOrder({...input(),quantity:-1}));assert.throws(()=>validateOrder({...input(),productId:'fake'}));assert.throws(()=>validateOrder({...input(),addressConfirmed:false}));});
test('disabled checkout cannot collect an order',async()=>{const env=environment();env.PAYFAST_ENABLED='false';assert.equal((await checkout(env)).status,503);assert.equal(env._db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,0);});
test('men, women and cancer orders use R250 each without a bulk discount',()=>{
 for(const productId of ['men-s-outshine-the-darkness','women-s-christian-chick','men-s-i-hate-cancer-men-s']){
  for(const [quantity,total] of [[1,34900],[2,59900],[3,84900]]){
   const order=validateOrder({...input(),productId,quantity,ribbon:'Yellow',totalCents:1});
   assert.equal(order.totalCents,total);assert.equal(order.deliveryCents,9900);
  }
 }
});
test('regular shirts accept white or black; Christmas retains red',()=>{
 for(const colour of ['Red','Green'])assert.throws(()=>validateOrder({...input(),productId:'men-s-outshine-the-darkness',colour}));
 assert.equal(validateOrder({...input(),productId:'women-s-christian-chick',colour:'White'}).colour,'White');
 assert.equal(validateOrder({...input(),colour:'Red'}).colour,'Red');
});
test('checkout records pending payment and protects customer data',async()=>{const env=environment(),result=await(await checkout(env)).json();assert.equal(result.fields.amount,'639.00');assert.equal(result.action,'https://sandbox.payfast.co.za/eng/process');assert.equal(env._db.prepare('SELECT status FROM orders').get().status,'awaiting_payment');let r=await worker.fetch(new Request(base+'/api/order-status?order='+result.orderId+'&token='+'a'.repeat(64)),env);assert.equal(r.status,404);r=await worker.fetch(new Request(base+'/api/order-status?order='+result.orderId+'&token='+result.token),env);const state=await r.json();assert.equal(state.status,'awaiting_payment');assert(!JSON.stringify(state).includes('test@example.com'));});
test('ITN rejects bad sources, signatures, wrong amounts and server rejection',async()=>{const env=environment(),order=await(await checkout(env)).json();assert.equal((await notify(env,notification(order.orderId),'127.0.0.1')).status,403);const tampered=notification(order.orderId);tampered[tampered.length-1][1]='0'.repeat(32);assert.equal((await notify(env,tampered)).status,400);assert.equal((await notify(env,notification(order.orderId,{amount_gross:'1.00'}))).status,400);const original=globalThis.fetch;try{globalThis.fetch=async()=>new Response('INVALID');assert.equal((await notify(env,notification(order.orderId))).status,400);}finally{globalThis.fetch=original;}assert.equal(env._db.prepare('SELECT status FROM orders').get().status,'awaiting_payment');});
test('only confirmed COMPLETE ITN marks paid; duplicate notifications are safe',async()=>{const env=environment(),order=await(await checkout(env)).json(),original=globalThis.fetch;try{globalThis.fetch=async()=>new Response('VALID');assert.equal((await notify(env,notification(order.orderId,{payment_status:'CANCELLED'}))).status,200);assert.equal(env._db.prepare('SELECT status FROM orders').get().status,'awaiting_payment');assert.equal((await notify(env,notification(order.orderId))).status,200);assert.equal(env._db.prepare('SELECT status FROM orders').get().status,'paid');assert.equal((await notify(env,notification(order.orderId))).status,200);}finally{globalThis.fetch=original;}});
test('browser return URL cannot mark a pending order paid',async()=>{const env=environment(),order=await(await checkout(env)).json();assert.equal((await worker.fetch(new Request(base+'/payment/return?order='+order.orderId+'&token='+order.token),env)).status,200);assert.equal(env._db.prepare('SELECT status FROM orders').get().status,'awaiting_payment');});
