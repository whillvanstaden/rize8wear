const test=require('node:test');
const assert=require('node:assert/strict');
const cart=require('../cart-core.js');
const products=new Map([
 ['men-cancer',{id:'men-cancer',name:'I HATE CANCER — MEN’S',audience:"Men's",price:250,colours:['White','Black'],cancer:true}],
 ['women-cancer',{id:'women-cancer',name:'I HATE CANCER — WOMEN’S',audience:"Women's",price:250,colours:['White','Black'],cancer:true}],
 ...['christmas-a','christmas-b','christmas-c'].map(id=>[id,{id,name:id,audience:'Christmas',price:199,colours:['Red','White','Black'],bulkPrice:180,bulkMinimum:3,bulkGroup:'christmas',personalised:true}]),
 ['drug',{id:'drug',name:'RECOVERY IS POSSIBLE',audience:'Drug Abuse Awareness',price:250,colours:['White','Black']}]
]);
const item=(id,productId='men-cancer',extra={})=>({id,productId,size:'M',colour:'Black',ribbon:'Yellow',personalisation:'',quantity:1,...extra});
test('men’s and women’s cancer shirts share one order and one delivery charge',()=>{
 const order=cart.calculate([item('a'),item('b','women-cancer',{size:'L',colour:'White',ribbon:'Purple'})],products);
 assert.equal(order.lines.length,2);assert.equal(order.quantity,2);assert.equal(order.subtotalCents,50000);assert.equal(order.deliveryCents,9900);assert.equal(order.totalCents,59900);
 assert.equal(order.lines[1].ribbon,'Purple');assert.equal(order.lines[0].ribbon,'Yellow');
});
test('identical choices merge but sizes, colours and ribbons remain separate',()=>{
 let lines=cart.upsertLine([],item('a'),products);
 lines=cart.upsertLine(lines,item('b','men-cancer',{quantity:2}),products);
 assert.equal(lines.length,1);assert.equal(lines[0].quantity,3);
 lines=cart.upsertLine(lines,item('c','men-cancer',{size:'L'}),products);
 lines=cart.upsertLine(lines,item('d','men-cancer',{ribbon:'Pink'}),products);
 lines=cart.upsertLine(lines,item('e','men-cancer',{colour:'White'}),products);
 assert.equal(lines.length,4);
});
test('editing a design preserves other cart items; editing into an identical variant merges it',()=>{
 const initial=[item('a'),item('b','women-cancer',{size:'L',ribbon:'Purple'})];
 const edited=cart.upsertLine(initial,item('unused','drug',{quantity:2}),products,'a');
 assert.equal(edited.length,2);assert.deepEqual(edited.find(line=>line.id==='b'),initial[1]);assert.equal(edited.find(line=>line.id==='a').productId,'drug');
 const merged=cart.upsertLine(edited,item('unused','women-cancer',{size:'L',ribbon:'Purple'}),products,'a');
 assert.equal(merged.length,1);assert.equal(merged[0].quantity,2);assert.equal(initial[0].productId,'men-cancer');
});
test('Christmas quantity discount combines designs and sizes, without discounting regular shirts',()=>{
 const order=cart.calculate([item('a','christmas-a',{size:'S'}),item('b','christmas-b',{size:'L'}),item('c','christmas-c',{size:'XL'}),item('d'),item('e','women-cancer',{ribbon:'Purple'})],products);
 assert.deepEqual(order.lines.map(line=>line.unitCents),[18000,18000,18000,25000,25000]);assert.equal(order.totalCents,113900);
 const reduced=cart.calculate(order.lines.filter(line=>line.id!=='c'),products);
 assert.deepEqual(reduced.lines.map(line=>line.unitCents),[19900,19900,25000,25000]);assert.equal(reduced.totalCents,99700);
});
test('quantity changes and removing all items recalculate shipping and totals',()=>{
 assert.equal(cart.calculate([item('a','men-cancer',{quantity:3})],products).totalCents,84900);
 assert.deepEqual(cart.calculate([],products),{lines:[],quantity:0,subtotalCents:0,deliveryCents:0,totalCents:0});
});
test('bad quantities and unavailable product options cannot enter checkout',()=>{
 for(const quantity of [0,-1,1.5,100,NaN,Infinity,'abc'])assert.throws(()=>cart.normaliseLine(item('a','men-cancer',{quantity}),products));
 for(const extra of [{size:'made-up'},{colour:'Red'},{ribbon:'made-up'},{productId:'missing'}])assert.throws(()=>cart.normaliseLine({...item('a'),...extra},products));
 assert.throws(()=>cart.upsertLine([item('a','men-cancer',{quantity:99})],item('b'),products));
});
test('saved cart restores valid selections only and expires after seven days',()=>{
 const saved={version:1,savedAt:Date.now(),items:[{...item('a'),price:1,name:'tampered'},item('b','missing'),item('c','women-cancer',{quantity:0})]};
 const restored=cart.restore(saved,products);assert.equal(restored.length,1);assert.equal(restored[0].price,undefined);assert.equal(cart.calculate(restored,products).totalCents,34900);
 assert.deepEqual(cart.restore({...saved,savedAt:Date.now()-8*86400000},products),[]);
});
test('combined WhatsApp order includes every choice, personalisation, one total and one reference',()=>{
 const snapshot=cart.calculate([item('a'),item('b','women-cancer',{ribbon:'Purple',size:'L'}),item('c','christmas-a',{personalisation:'Cele',colour:'Red'})],products);
 const text=cart.orderText(snapshot,{customerName:'TEST CUSTOMER',customerEmail:'test@example.com',customerPhone:'0000000000',deliveryStreet:'1 TEST STREET',deliverySuburb:'Test',deliveryCity:'Test',deliveryProvince:'Gauteng',deliveryPostalCode:'0001'},'R8-TEST');
 assert.match(text,/MEN’S/);assert.match(text,/WOMEN’S/);assert.match(text,/Purple/);assert.match(text,/Surname for printing: Cele/);assert.match(text,/TOTAL: R798/);
 assert.equal((text.match(/Order reference:/g)||[]).length,1);assert.equal((text.match(/Nationwide delivery/g)||[]).length,1);assert.match(text,/Full name: TEST CUSTOMER/);
 assert.throws(()=>cart.orderText(cart.calculate([],products),{},'R8-TEST'));
});
