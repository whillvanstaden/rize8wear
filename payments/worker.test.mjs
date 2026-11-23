import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{signature,parameterString,validateOrder} from './worker.mjs';
import {md5} from './md5.mjs';
const origin='https://rize8wear.co.za',base='https://rize8wear-preview.grey-haven-7361.chatgpt.site';
const input=()=>({productId:'christmas-mom-jesus-is-the-reason',size:'M',colour:'Black',quantity:3,delivery:{methodId:'tcg-door'},deliveryConfirmed:true,customer:{name:'Test Customer',email:'test@example.com',phone:'0820000000',street:'123 Example Street',unit:'',suburb:'Test Suburb',city:'Test City',province:'Gauteng',postalCode:'0001'}});
function environment(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('drizzle/0000_orders.sql',import.meta.url),'utf8'));
 return {PAYFAST_MODE:'sandbox',PAYFAST_ENABLED:'true',DB:{prepare(sql){return {bind(...args){const statement=db.prepare(sql);return {async first(){return statement.get(...args);},async run(){return statement.run(...args);}};}}}},_db:db};
}
const checkout=(env,body=input())=>worker.fetch(new Request(base+'/api/checkout',{method:'POST',headers:{Origin:origin,'content-type':'application/json','CF-Connecting-IP':'127.0.0.1'},body:JSON.stringify(body)}),env);
const notify=(env,pairs,ip='197.97.145.144')=>worker.fetch(new Request(base+'/api/payfast/notify',{method:'POST',headers:{'CF-Connecting-IP':ip},body:new URLSearchParams(pairs).toString()}),env);
function notification(id,overrides={}){const pairs=Object.entries({m_payment_id:id,pf_payment_id:'123456',payment_status:'COMPLETE',item_name:'RIZE8 test',amount_gross:'639.00',amount_fee:'-5.00',amount_net:'634.00',merchant_id:'10004002',...overrides});pairs.push(['signature',signature(pairs,'payfast',true)]);return pairs;}
test('MD5 matches Node for padding boundaries and Unicode',()=>{for(const value of ['','abc','a'.repeat(55),'a'.repeat(56),'a'.repeat(64),'a'.repeat(300),'Geseënde Kersfees'])assert.equal(md5(value),createHash('md5').update(value).digest('hex'));});
test('PayFast encoding uses PHP form encoding and documented ordering',()=>{assert.equal(parameterString([['name','Test !~()*'],['empty','']]),'name=Test+%21%7E%28%29%2A');const pairs=[['name','Test User'],['amount','639.00']];assert.equal(signature(pairs,'phrase'),createHash('md5').update('name=Test+User&amount=639.00&passphrase=phrase').digest('hex'));});
test('server prices ignore client amounts and enforce three-shirt deal',()=>{for(const [qty,expected] of [[1,29800],[2,49700],[3,63900]])assert.equal(validateOrder({...input(),quantity:qty,unitCents:1,totalCents:1}).totalCents,expected);assert.throws(()=>validateOrder({...input(),colour:'Green'}));assert.throws(()=>validateOrder({...input(),quantity:-1}));assert.throws(()=>validateOrder({...input(),productId:'fake'}));assert.throws(()=>validateOrder({...input(),deliveryConfirmed:false}));});
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

test('server combines designs, derives shipping from configuration and stores free collection',async()=>{
 const env=environment(),body={...input(),items:[{productId:'men-s-i-hate-cancer-men-s',size:'M',colour:'Black',ribbon:'Yellow',quantity:1},{productId:'women-s-i-hate-cancer-women-s',size:'L',colour:'White',ribbon:'Purple',quantity:1}],delivery:{methodId:'collect-alberton',feeCents:99999},deliveryCents:1,totalCents:1};
 const order=validateOrder(body);assert.equal(order.totalCents,50000);assert.equal(order.deliveryCents,0);assert.equal(order.lines.length,2);assert.equal(order.customer.street,undefined);
 const result=await(await checkout(env,body)).json();assert.equal(result.fields.amount,'500.00');const record=JSON.parse(env._db.prepare('SELECT details_json FROM orders').get().details_json);assert.equal(record.delivery.methodId,'collect-alberton');assert.equal(record.lines.length,2);
});
test('courier quotes are permitted as requests but cannot become payment requests',async()=>{
 const env=environment();
 for(const methodId of ['pudo-locker','paxi','pargo']){
  const body={...input(),delivery:{methodId,area:'Germiston 1410'},requireConfirmation:true};
  const review=await worker.fetch(new Request(base+'/api/order-review',{method:'POST',headers:{Origin:origin,'content-type':'application/json'},body:JSON.stringify(body)}),env);assert.equal(review.status,200);const {order}=await review.json();assert.equal(order.totalCents,null);assert.equal(order.delivery.pickupPoint,null);
  assert.equal((await checkout(env,body)).status,400);
  assert.equal((await worker.fetch(new Request(base+'/api/order-review',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...body,delivery:{...body.delivery,pointId:'made-up'}})}),env)).status,400);
 }
 assert.equal(env._db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,0);
});

test('server rejects missing method or confirmation and recalculates door delivery without trusting client fees',()=>{
 assert.throws(()=>validateOrder({...input(),delivery:null}));assert.throws(()=>validateOrder({...input(),deliveryConfirmed:false}));
 assert.equal(validateOrder({...input(),delivery:{methodId:'tcg-door',feeCents:0},deliveryCents:0}).deliveryCents,9900);
});

test('server rejects Midrand collection during its holiday closure',()=>{
 const body={...input(),delivery:{methodId:'collect-midrand'}};
 assert.equal(validateOrder(body,{now:new Date('2026-12-15T09:59:59Z')}).deliveryCents,0);
 for(const instant of ['2026-12-15T10:00:00Z','2027-01-06T21:59:59Z'])assert.throws(()=>validateOrder(body,{now:new Date(instant)}),/reopens on 7 January/);
 const order=validateOrder(body,{now:new Date('2027-01-06T22:00:00Z')});assert.equal(order.deliveryCents,0);assert.match(order.delivery.details.join(' '),/90 Bekker Street/);
});

test('payment retries reuse one pending record and reject changed or paid orders',async()=>{
 const env=environment(),body={...input(),reference:'R8-261123-0123456789ABCDEF',attemptToken:'ab'.repeat(32),expectedTotalCents:63900};
 const first=await(await checkout(env,body)).json(),again=await(await checkout(env,body)).json();
 assert.equal(first.orderId,again.orderId);assert.equal(first.token,again.token);assert.equal(env._db.prepare('SELECT COUNT(*) AS n FROM orders').get().n,1);
 assert.equal(first.fields.custom_str5,body.reference);assert.match(first.fields.custom_str2,/\/payment\/return\?order=/);
 assert.equal((await checkout(env,{...body,quantity:2})).status,409);
 assert.equal((await checkout(env,{...body,attemptToken:'not-a-token'})).status,400);
 env._db.prepare("UPDATE orders SET status='paid'").run();assert.equal((await checkout(env,body)).status,409);
});

test('receipt protects full order details with an unguessable token',async()=>{
 const env=environment(),body={...input(),reference:'R8-261123-0123456789ABCDEF'},result=await(await checkout(env,body)).json();
 assert.equal((await worker.fetch(new Request(base+'/api/order-receipt?order='+result.orderId+'&token='+'0'.repeat(64)),env)).status,404);
 const receipt=await(await worker.fetch(new Request(base+'/api/order-receipt?order='+result.orderId+'&token='+result.token),env)).json();
 assert.equal(receipt.reference,body.reference);assert.match(receipt.orderText,/test@example.com/);assert.match(receipt.orderText,/Size: M/);assert.match(receipt.orderText,/TOTAL: R639/);
 const page=await(await worker.fetch(new Request(base+'/payment/cancel?order='+result.orderId+'&token='+result.token),env)).text();assert.match(page,/wa.me\/27603709033/);assert.match(page,/resume_order=1/);assert.match(page,/api\/order-receipt/);
});

test('live checkout signs the configured merchant credentials and fails closed if missing',async()=>{
 const env=environment();env.PAYFAST_MODE='live';
 assert.equal((await checkout(env)).status,503);
 env.PAYFAST_MERCHANT_ID='12345678';env.PAYFAST_MERCHANT_KEY='test-live-key';env.PAYFAST_PASSPHRASE='TestSecret';
 const result=await(await checkout(env)).json();assert.equal(result.action,'https://www.payfast.co.za/eng/process');assert.equal(result.fields.merchant_id,'12345678');assert.equal(result.fields.signature,signature(Object.entries(result.fields),'TestSecret'));
 const publicConfig=await(await worker.fetch(new Request(base+'/api/payment-config'),env)).json();assert.deepEqual(publicConfig,{enabled:true,sandbox:false});assert(!JSON.stringify(publicConfig).includes('test-live-key'));
});

