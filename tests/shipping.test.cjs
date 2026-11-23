const test=require('node:test'),assert=require('node:assert/strict');
const shipping=require('../shipping-config.js'),cart=require('../cart-core.js');
const products=new Map([['shirt',{id:'shirt',name:'Test shirt',audience:"Men's",price:250,colours:['Black','White']}]]);
const items=quantity=>[{id:'a',productId:'shirt',size:'M',colour:'Black',quantity}];
const contact={name:'TEST CUSTOMER',email:'test@example.com',phone:'0000000000'};
const address={street:'1 TEST STREET',unit:'',suburb:'Test',city:'Test',province:'Gauteng',postalCode:'0001'};
const openCollectionDate=new Date('2026-11-23T12:00:00Z');
test('no delivery method means no automatic R99 charge',()=>{const order=cart.calculate(items(1),products);assert.equal(order.subtotalCents,25000);assert.equal(order.deliveryCents,0);assert.equal(order.deliverySelected,false);assert.equal(order.paymentReady,false);});
test('Alberton and Midrand collection are free and do not require or leak an address',()=>{
 for(const [methodId,quantity] of [['collect-alberton',1],['collect-midrand',3]]){
  const order=cart.calculate(items(quantity),products,methodId,openCollectionDate),delivery=shipping.validateDelivery({methodId},{...contact,...address},{confirmed:true,now:openCollectionDate});
  assert.equal(order.deliveryCents,0);assert.equal(order.totalCents,quantity*25000);assert.equal(delivery.address,null);assert(!delivery.details.join(' ').includes(address.street));assert.equal(delivery.kind,'collection');
 }
});
test('checkout offers only the two free collections and R99 door delivery; retired couriers are rejected',()=>{
 assert.deepEqual(shipping.methods.map(method=>method.id),['collect-alberton','collect-midrand','tcg-door']);
 for(const methodId of ['pudo-locker','paxi','pargo']){
  assert.equal(shipping.availability(methodId).available,false);
  assert.throws(()=>cart.calculate(items(1),products,methodId),/available delivery method/);
  assert.throws(()=>shipping.validateDelivery({methodId,area:'Germiston 1410'},contact,{confirmed:true,forPayment:true}),/available delivery method/);
 }
});
test('multiple shirts incur one fixed door delivery fee and switching to free removes it',()=>{
 const door=cart.calculate(items(2),products,'tcg-door'),free=cart.calculate(items(2),products,'collect-midrand',openCollectionDate);assert.equal(door.totalCents,59900);assert.equal(door.deliveryCents,9900);assert.equal(free.totalCents,50000);
});
test('missing, incomplete and postal-box addresses are rejected; no courier verification is claimed',()=>{
 for(const changes of [{street:''},{street:'PO Box 123'},{city:''},{province:'Invalid'},{postalCode:'123'}])assert.throws(()=>shipping.validateDelivery({methodId:'tcg-door'},{...address,...changes},{confirmed:true}));
 assert.equal(shipping.validateDelivery({methodId:'tcg-door'},address,{confirmed:true}).addressVerified,false);
});
test('confirmation and real method selection are required and invented points are rejected',()=>{
 assert.throws(()=>shipping.validateDelivery({methodId:'collect-alberton'},contact));assert.throws(()=>shipping.validateDelivery({methodId:'fake'},contact,{confirmed:true}));
 for(const methodId of ['paxi','pargo','pudo-locker'])assert.throws(()=>shipping.validateDelivery({methodId,area:'Test',pointId:'invented-store'},contact,{confirmed:true}));
 assert.throws(()=>shipping.validateDelivery({methodId:'paxi',area:''},contact,{confirmed:true}));
});

test('collection records contain the exact business locations and hours',()=>{
 const alberton=shipping.validateDelivery({methodId:'collect-alberton'},contact,{confirmed:true});
 assert.deepEqual(alberton.details,['Engen garage','99 Kritzinger Road','Verwoerdpark, Alberton, 1449','Collection hours: 08:00–19:00']);
 const midrand=shipping.validateDelivery({methodId:'collect-midrand'},contact,{confirmed:true,now:new Date('2026-11-23T12:00:00Z')});
 assert.match(midrand.details.join('\n'),/Hertford Office Park, Building F/);assert.match(midrand.details.join('\n'),/90 Bekker Street, Midrand/);assert.match(midrand.details.join('\n'),/Monday to Friday, 08:00–15:00/);
});
test('Midrand closure starts at noon South African time on 15 December and includes 6 January',()=>{
 for(const [instant,available] of [['2026-12-14T21:59:59Z',true],['2026-12-14T22:00:00Z',true],['2026-12-15T09:59:59Z',true],['2026-12-15T10:00:00Z',false],['2027-01-06T21:59:59Z',false],['2027-01-06T22:00:00Z',true]]){
  const now=new Date(instant);assert.equal(shipping.availability('collect-midrand',now).available,available);
  if(available)assert.equal(shipping.getMethod('collect-midrand',now).id,'collect-midrand');else assert.throws(()=>shipping.validateDelivery({methodId:'collect-midrand'},contact,{confirmed:true,now}),/reopens on 7 January/);
  assert.equal(shipping.availability('collect-alberton',now).available,true);
 }
});
