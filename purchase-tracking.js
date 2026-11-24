/* Called only with the authenticated payment-status response. No customer or product data is sent. */
(function(root){
 'use strict';
 const sent=new Set();
 function track(order,{fbq=root.fbq,storage=root.localStorage}={}){
  if(order?.status!=='paid'||order.sandbox||!/^R8-PF-[a-f0-9]{32}$/.test(order.orderId||'')||!Number.isSafeInteger(order.totalCents)||order.totalCents<=0||typeof fbq!=='function')return false;
  const key='rize8-purchase-'+order.orderId;
  if(sent.has(key))return false;
  try{if(storage.getItem(key))return false;}catch{}
  fbq('trackSingle','1928208843860853','Purchase',{value:order.totalCents/100,currency:'ZAR'},{eventID:order.orderId});
  sent.add(key);try{storage.setItem(key,'sent');}catch{}
  return true;
 }
 root.Rize8Purchase={track};
 if(typeof module!=='undefined'&&module.exports)module.exports={track};
})(globalThis);
