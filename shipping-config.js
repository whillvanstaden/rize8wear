/* Store delivery fees, in cents. Courier quote requests never imply a verified pickup point or a payable total. */
(function(root){
 'use strict';
 const methods=Object.freeze([
  {id:'collect-alberton',label:'Free Collection: Alberton',kind:'collection',courier:'RIZE8 Wear',feeCents:0,enabled:true,city:'Alberton',description:'Collect in Alberton. Exact collection details will be provided after order confirmation.'},
  {id:'collect-midrand',label:'Free Collection: Midrand',kind:'collection',courier:'RIZE8 Wear',feeCents:0,enabled:true,city:'Midrand',description:'Collect in Midrand. Exact collection details will be provided after order confirmation.'},
  {id:'pudo-locker',label:'The Courier Guy Lockers (PUDO)',kind:'quote',courier:'PUDO',feeCents:null,exampleFeeCents:6900,enabled:true,quoteOnly:true,officialUrl:'https://thecourierguy.co.za/locker-courier-services/',description:'Delivery fee and collection point to be confirmed on WhatsApp before payment.'},
  {id:'paxi',label:'PAXI',kind:'quote',courier:'PAXI',feeCents:null,exampleFeeCents:5995,enabled:true,quoteOnly:true,officialUrl:'https://www.paxi.co.za/',description:'Delivery fee and participating collection point to be confirmed on WhatsApp before payment.'},
  {id:'pargo',label:'Pargo',kind:'quote',courier:'Pargo',feeCents:null,exampleFeeCents:7500,enabled:true,quoteOnly:true,officialUrl:'https://pargo.co.za/',description:'Delivery fee and participating collection point to be confirmed on WhatsApp before payment.'},
  {id:'tcg-door',label:'The Courier Guy: Door-to-Door',kind:'address',courier:'The Courier Guy',feeCents:9900,enabled:true,description:'Our fixed store delivery fee, not a live courier quotation. Delivery address and service availability are confirmed before payment.'}
 ].map(Object.freeze));
 const confirmationText='I confirm that I have selected the correct collection point or entered the correct delivery address. I understand that incorrect details may cause delivery delays or additional courier charges.';
 const quoteConfirmationText='I understand that RIZE8 Wear must confirm the delivery fee, a real participating collection point and the final total on WhatsApp before I pay.';
 const provinces=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
 function getMethod(id){const method=methods.find(method=>method.id===id);if(!method||!method.enabled)throw Error('Choose an available delivery method.');return method;}
 function addressFrom(customer){
  const result={};
  for(const [key,max] of Object.entries({street:200,unit:120,suburb:100,city:100,province:40,postalCode:4})){
   const value=String(customer?.[key]||'').trim();
   if((key!=='unit'&&!value)||value.length>max||/[\u0000-\u001f]/.test(value))throw Error('Enter a complete physical delivery address.');result[key]=value;
  }
  if(!/\d/.test(result.street)||/^\s*(p\.?\s*o\.?\s*box|private\s+bag)\b/i.test(result.street)||!/^\d{4}$/.test(result.postalCode)||!provinces.includes(result.province))throw Error('Check the street number, province and four-digit postal code. A physical address is required.');
  return result;
 }
 function validateDelivery(selection,customer,{requireConfirmation=true,confirmed=false,forPayment=false}={}){
  const method=getMethod(selection?.methodId);
  if(selection?.pointId||selection?.pickupPoint)throw Error('A pickup point must be selected and verified through an enabled official courier integration.');
  if(forPayment&&method.quoteOnly)throw Error('The courier fee and verified collection point must be confirmed before payment.');
  if(requireConfirmation&&confirmed!==true)throw Error('Please review and confirm your full delivery details.');
  const address=method.kind==='address'?addressFrom(customer):null;
  const area=method.quoteOnly?String(selection?.area||'').trim():'';
  if(method.quoteOnly&&(!area||area.length>120||/[\u0000-\u001f]/.test(area)))throw Error('Enter your suburb, city or postal code so we can confirm a suitable collection point.');
  const details=address?[address.street,...(address.unit?[address.unit]:[]),address.suburb,address.city,address.province,address.postalCode,'South Africa']:method.quoteOnly?['Preferred area for quotation: '+area,'Collection point: not yet selected or verified.','RIZE8 Wear must confirm the official point and final delivery price before payment.']:[method.city,'Exact collection details will be provided after order confirmation.'];
  return {methodId:method.id,label:method.label,kind:method.kind,courier:method.courier,feeCents:method.feeCents,quoteOnly:!!method.quoteOnly,details,area,address,addressVerified:false,pickupPoint:null};
 }
 const api={methods,confirmationText,quoteConfirmationText,provinces,getMethod,addressFrom,validateDelivery};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.Rize8Shipping=api;
})(globalThis);
