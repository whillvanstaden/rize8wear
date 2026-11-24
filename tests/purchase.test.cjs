const test=require('node:test'),assert=require('node:assert/strict'),{track}=require('../purchase-tracking.js');
const order={orderId:'R8-PF-'+'a'.repeat(32),status:'paid',sandbox:false,totalCents:500};
test('Purchase requires verified paid status and sends actual ZAR value once without customer or design details',()=>{
 const calls=[],values=new Map(),options={fbq:(...args)=>calls.push(args),storage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}};
 for(const changes of [{status:'awaiting_payment'},{sandbox:true},{totalCents:0},{orderId:'made-up'}])assert.equal(track({...order,...changes},options),false);
 assert.equal(calls.length,0);assert.equal(track({...order,customer:{email:'private@example.com'},design:'private'},options),true);assert.equal(track(order,options),false);
 assert.deepEqual(calls,[['trackSingle','1928208843860853','Purchase',{value:5,currency:'ZAR'},{eventID:order.orderId}]]);
});
test('persisted purchase marker prevents a second event after reload',()=>{
 let called=false;assert.equal(track({...order,orderId:'R8-PF-'+'b'.repeat(32)},{fbq:()=>called=true,storage:{getItem:()=> 'sent'}}),false);assert.equal(called,false);
});
