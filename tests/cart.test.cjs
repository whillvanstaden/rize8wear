const test=require('node:test');
const assert=require('node:assert/strict');
const cart=require('../cart-core.js');
const shipping=require('../shipping-config.js');
const calculate=(lines,products)=>cart.calculate(lines,products,'tcg-door');
const products=new Map([
 ['men-cancer',{id:'men-cancer',name:'I HATE CANCER — MEN’S',audience:"Men's",price:199,colours:['White','Black'],cancer:true}],
 ['women-cancer',{id:'women-cancer',name:'I HATE CANCER — WOMEN’S',audience:"Women's",price:199,colours:['White','Black'],cancer:true}],
 // Old bulk metadata must never change the new fixed unit price.
 ...['christmas-a','christmas-b','christmas-c'].map(id=>[id,{id,name:id,audience:'Christmas',price:185,colours:['Red','White','Black'],bulkPrice:180,bulkMinimum:3,bulkGroup:'christmas',personalised:true}]),
 ['drug',{id:'drug',name:'RECOVERY IS POSSIBLE',audience:'Drug Abuse Awareness',price:199,colours:['White','Black']}]
]);
const item=(id,productId='men-cancer',extra={})=>({id,productId,size:'M',colour:'Black',ribbon:'Yellow',personalisation:'',quantity:1,...extra});
test('men’s and women’s cancer shirts share one order and one delivery charge',()=>{
 const order=calculate([item('a'),item('b','women-cancer',{size:'L',colour:'White',ribbon:'Purple'})],products);
 assert.equal(order.lines.length,2);assert.equal(order.quantity,2);assert.equal(order.subtotalCents,39800);assert.equal(order.deliveryCents,9900);assert.equal(order.totalCents,49700);
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
test('Christmas stays R185 across mixed designs and sizes, with regular shirts R199 and no quantity discount',()=>{
 const order=calculate([item('a','christmas-a',{size:'S'}),item('b','christmas-b',{size:'L'}),item('c','christmas-c',{size:'XL'}),item('d'),item('e','women-cancer',{ribbon:'Purple'})],products);
 assert.deepEqual(order.lines.map(line=>line.unitCents),[18500,18500,18500,19900,19900]);assert(order.lines.every(line=>line.discounted===false));assert.equal(order.deliveryCents,9900);assert.equal(order.totalCents,105200);
 const reduced=calculate(order.lines.filter(line=>line.id!=='c'),products);
 assert.deepEqual(reduced.lines.map(line=>line.unitCents),[18500,18500,19900,19900]);assert.equal(reduced.totalCents,86700);
});
test('quantity changes and removing all items recalculate shipping and totals',()=>{
 assert.equal(calculate([item('a','men-cancer',{quantity:3})],products).totalCents,69600);
 assert.deepEqual(calculate([],products),{lines:[],quantity:0,subtotalCents:0,deliveryCents:0,totalCents:0,deliverySelected:false,paymentReady:false,delivery:null});
});
test('bad quantities and unavailable product options cannot enter checkout',()=>{
 for(const quantity of [0,-1,1.5,100,NaN,Infinity,'abc'])assert.throws(()=>cart.normaliseLine(item('a','men-cancer',{quantity}),products));
 for(const extra of [{size:'made-up'},{colour:'Red'},{ribbon:'made-up'},{productId:'missing'}])assert.throws(()=>cart.normaliseLine({...item('a'),...extra},products));
 assert.throws(()=>cart.upsertLine([item('a','men-cancer',{quantity:99})],item('b'),products));
});
test('saved cart restores valid selections only and expires after seven days',()=>{
 const saved={version:1,savedAt:Date.now(),items:[{...item('a'),price:1,name:'tampered'},item('b','missing'),item('c','women-cancer',{quantity:0})]};
 const restored=cart.restore(saved,products);assert.equal(restored.length,1);assert.equal(restored[0].price,undefined);assert.equal(calculate(restored,products).totalCents,29800);
 assert.deepEqual(cart.restore({...saved,savedAt:Date.now()-8*86400000},products),[]);
});
test('combined WhatsApp order includes every choice, personalisation, one total and one reference',()=>{
 const snapshot=calculate([item('a'),item('b','women-cancer',{ribbon:'Purple',size:'L'}),item('c','christmas-a',{personalisation:'Cele',colour:'Red'})],products);
 snapshot.delivery=shipping.validateDelivery({methodId:'tcg-door'},{street:'1 TEST STREET',unit:'',suburb:'Test',city:'Test',province:'Gauteng',postalCode:'0001'},{confirmed:true});
 const text=cart.orderText(snapshot,{customerName:'TEST CUSTOMER',customerEmail:'test@example.com',customerPhone:'0000000000',deliveryStreet:'1 TEST STREET',deliverySuburb:'Test',deliveryCity:'Test',deliveryProvince:'Gauteng',deliveryPostalCode:'0001'},'R8-TEST');
 assert.match(text,/MEN’S/);assert.match(text,/WOMEN’S/);assert.match(text,/Purple/);assert.match(text,/Surname for printing: Cele/);assert.match(text,/TOTAL: R682/);assert.doesNotMatch(text,/Christmas 3\+ price/);
 assert.equal((text.match(/Order reference:/g)||[]).length,1);assert.equal((text.match(/Delivery fee \(once per order\)/g)||[]).length,1);assert.match(text,/Full name: TEST CUSTOMER/);
 assert.throws(()=>cart.orderText(calculate([],products),{},'R8-TEST'));
});
