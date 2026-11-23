/* Store delivery fees, in cents. Courier quote requests never imply a verified pickup point or a payable total. */
(function(root){
 'use strict';
 const methods=Object.freeze([
  {id:'collect-alberton',label:'Free Collection: Kritzinger Road, Verwoerdpark, Alberton',kind:'collection',courier:'RIZE8 Wear',feeCents:0,enabled:true,city:'Alberton',description:'Engen garage, 99 Kritzinger Road, Verwoerdpark, Alberton, 1449. Collection hours: 08:00–19:00.',collectionDetails:['Engen garage','99 Kritzinger Road','Verwoerdpark, Alberton, 1449','Collection hours: 08:00–19:00']},
  {id:'collect-midrand',label:'Free Collection: Midrand',kind:'collection',courier:'RIZE8 Wear',feeCents:0,enabled:true,city:'Midrand',description:'Hertford Office Park, Building F, 90 Bekker Street, Midrand. Monday to Friday, 08:00–15:00. Closed from 12:00 (noon) on 15 December 2026 through 6 January 2027; reopens 7 January 2027.',collectionDetails:['Hertford Office Park, Building F','90 Bekker Street, Midrand','Collection hours: Monday to Friday, 08:00–15:00','Unavailable from 12:00 (noon) on 15 December 2026 through 6 January 2027 inclusive. Reopens 7 January 2027.'],closures:[{from:'2026-12-15',through:'2027-01-06',startsAt:'2026-12-15T12:00:00+02:00',reason:'Midrand collection is unavailable from 12:00 (noon) on 15 December 2026 through 6 January 2027. Collection reopens on 7 January 2027. Please choose another delivery method.'}]},
  {id:'tcg-door',label:'The Courier Guy: Door-to-Door',kind:'address',courier:'The Courier Guy',feeCents:9900,enabled:true,description:'Flat delivery fee: R99 per order.'}
 ].map(Object.freeze));
 const confirmationText='I confirm that I have selected the correct collection point or entered the correct delivery address. I understand that incorrect details may cause delivery delays or additional courier charges.';
 const quoteConfirmationText='I understand that RIZE8 Wear must confirm the delivery fee, a real participating collection point and the final total on WhatsApp before I pay.';
 const provinces=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
 function availability(id,now=new Date()){
  const method=methods.find(method=>method.id===id);
  if(!method||!method.enabled)return {available:false,reason:'Choose an available delivery method.'};
  const parts=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(now));
  const today=['year','month','day'].map(type=>parts.find(part=>part.type===type).value).join('-');
  const closure=method.closures?.find(period=>today>=period.from&&today<=period.through&&(!period.startsAt||new Date(now).getTime()>=Date.parse(period.startsAt)));
  return {available:!closure,reason:closure?.reason||''};
 }
 function getMethod(id,now=new Date()){const status=availability(id,now);if(!status.available)throw Error(status.reason);return methods.find(method=>method.id===id);}
 function addressFrom(customer){
  const result={};
  for(const [key,max] of Object.entries({street:200,unit:120,suburb:100,city:100,province:40,postalCode:4})){
   const value=String(customer?.[key]||'').trim();
   if((key!=='unit'&&!value)||value.length>max||/[\u0000-\u001f]/.test(value))throw Error('Enter a complete physical delivery address.');result[key]=value;
  }
  if(!/\d/.test(result.street)||/^\s*(p\.?\s*o\.?\s*box|private\s+bag)\b/i.test(result.street)||!/^\d{4}$/.test(result.postalCode)||!provinces.includes(result.province))throw Error('Check the street number, province and four-digit postal code. A physical address is required.');
  return result;
 }
 function validateDelivery(selection,customer,{requireConfirmation=true,confirmed=false,forPayment=false,now=new Date()}={}){
  const method=getMethod(selection?.methodId,now);
  if(selection?.pointId||selection?.pickupPoint)throw Error('A pickup point must be selected and verified through an enabled official courier integration.');
  if(forPayment&&method.quoteOnly)throw Error('The courier fee and verified collection point must be confirmed before payment.');
  if(requireConfirmation&&confirmed!==true)throw Error('Please review and confirm your full delivery details.');
  const address=method.kind==='address'?addressFrom(customer):null;
  const area=method.quoteOnly?String(selection?.area||'').trim():'';
  if(method.quoteOnly&&(!area||area.length>120||/[\u0000-\u001f]/.test(area)))throw Error('Enter your suburb, city or postal code so we can confirm a suitable collection point.');
  const details=address?[address.street,...(address.unit?[address.unit]:[]),address.suburb,address.city,address.province,address.postalCode,'South Africa']:method.quoteOnly?['Preferred area for quotation: '+area,'Collection point: not yet selected or verified.','RIZE8 Wear must confirm the official point and final delivery price before payment.']:[...method.collectionDetails];
  return {methodId:method.id,label:method.label,kind:method.kind,courier:method.courier,feeCents:method.feeCents,quoteOnly:!!method.quoteOnly,details,area,address,addressVerified:false,pickupPoint:null};
 }
 const api={methods,confirmationText,quoteConfirmationText,provinces,availability,getMethod,addressFrom,validateDelivery};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.Rize8Shipping=api;
})(globalThis);
