import {md5} from './md5.mjs';
import {catalogue} from './catalogue.mjs';
import '../shipping-config.js';
import '../cart-core.js';

const SHOP='https://rize8wear.co.za';
const ORIGINS=new Set([SHOP,'https://www.rize8wear.co.za','https://rize8wear-preview.grey-haven-7361.chatgpt.site']);
const SIZES=['S','M','L','XL','2XL','2–3 yrs','3–4 yrs','4–5 yrs','5–6 yrs','7–8 yrs','9–10 yrs','11–12 yrs','Newborn (0–1 Month)','0–3 Months','3–6 Months','6–9 Months','6–12 Months','12–18 Months','18–24 Months'];
const RIBBONS=['Yellow','Pink','Gold','White or Pearl','Purple','Teal','Orange','Lime Green','Dark Blue','Light Blue','Gray','Black'];
const PROVINCES=['Eastern Cape','Free State','Gauteng','KwaZulu-Natal','Limpopo','Mpumalanga','North West','Northern Cape','Western Cape'];
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
const money=cents=>(cents/100).toFixed(2);
const encode=value=>encodeURIComponent(String(value)).replace(/[!'()*~]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g,'+');
export const parameterString=(pairs,includeEmpty=false)=>pairs.filter(([k,v])=>k!=='signature'&&(includeEmpty||String(v).trim()!=='')).map(([k,v])=>k+'='+encode(v)).join('&');
export const signature=(pairs,passphrase='',includeEmpty=false)=>md5(parameterString(pairs,includeEmpty)+(passphrase?'&passphrase='+encode(passphrase):''));
const equal=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');

export function validateOrder(input,{requireConfirmation=true,forPayment=true,now=new Date()}={}){
  const selection=input.delivery;
  const method=globalThis.Rize8Shipping.getMethod(selection?.methodId,now);
  const customer={};
  for(const [field,max] of Object.entries({name:120,email:254,phone:25})){
    const value=String(input.customer?.[field]||'').trim();
    if(!value||value.length>max||/[\u0000-\u001f]/.test(value))throw Error('Enter your complete customer contact details.');customer[field]=value;
  }
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)||customer.phone.replace(/\D/g,'').length<7)throw Error('Check your email and contact number.');
  if(method.kind==='address')Object.assign(customer,globalThis.Rize8Shipping.addressFrom(input.customer));
  const delivery=globalThis.Rize8Shipping.validateDelivery(selection,customer,{requireConfirmation,confirmed:input.deliveryConfirmed===true,forPayment,now});
  if(forPayment&&input.shippingTermsAccepted!==true)throw Error('Please read and acknowledge the Shipping & Delivery Policy and Terms & Conditions before payment.');
  const items=Array.isArray(input.items)?input.items:[input];
  if(!items.length||items.length>50)throw Error('Add between one and 50 choices to your cart.');
  const products=new Map(Object.entries(catalogue));
  const lines=items.map((line,index)=>globalThis.Rize8Cart.normaliseLine({...line,id:'line-'+index},products));
  const order=globalThis.Rize8Cart.calculate(lines,products,method.id,now),first=order.lines[0];
  delivery.feeCents=order.deliveryCents;
  const reference=/^R8-[0-9]{6}-[A-F0-9]{16}$/.test(input.reference||'')?input.reference:null;
  return {...order,reference,delivery,customer,shippingTermsAccepted:input.shippingTermsAccepted===true,shippingTermsVersion:input.shippingTermsAccepted===true?'2026-11-23':null,productId:first.productId,name:order.lines.length===1?first.product.name:order.quantity+' T-shirts',audience:first.product.audience,size:first.size,colour:first.colour,ribbon:first.ribbon,unitCents:first.unitCents};
}

async function orderReview(request,env,testOnly=false){
 let input;try{const raw=await request.text();if(raw.length>64000)throw Error();input=JSON.parse(raw);}catch{return json({error:'Invalid order.'},400);}
 if(testOnly&&!await validTestKey(input.testKey,env))return json({error:'This checkout test has expired. Use the current private test link.'},404);
 if(testOnly&&await testAlreadyPaid(env))return json({error:'This R5 checkout test has already been paid. Please do not pay again.'},409);
 try{const order=validateOrder(input,{requireConfirmation:input.requireConfirmation===true,forPayment:testOnly});return json({order:testOnly?globalThis.Rize8Cart.paymentTest(order):order});}catch(error){return json({error:error.message},400);}
}

function config(env){
  const sandbox=env.PAYFAST_MODE!=='live';
  return {sandbox,host:sandbox?'sandbox.payfast.co.za':'www.payfast.co.za',merchantId:sandbox?'10004002':env.PAYFAST_MERCHANT_ID,merchantKey:sandbox?'q1cd2rdny4a53':env.PAYFAST_MERCHANT_KEY,passphrase:sandbox?'payfast':env.PAYFAST_PASSPHRASE||''};
}

let payfastIps=null,payfastIpsExpire=0;
export async function resolvePayfastIps(fetcher=fetch){
  // PayFast publishes current callback addresses in these official DNS records.
  // Resolve through HTTPS rather than pinning ranges that can become outdated.
  const hosts=['www.payfast.co.za','ips.payfast.co.za','w1w.payfast.co.za','w2w.payfast.co.za','sandbox.payfast.co.za'];
  const answers=await Promise.allSettled(hosts.map(async host=>{
    const response=await fetcher('https://cloudflare-dns.com/dns-query?name='+host+'&type=A',{headers:{accept:'application/dns-json'},signal:AbortSignal.timeout(5000)});
    if(!response.ok)throw Error('DNS unavailable');const result=await response.json();if(result.Status!==0)throw Error('DNS unavailable');
    return (result.Answer||[]).filter(record=>record.type===1).map(record=>record.data);
  }));
  const ips=new Set(answers.filter(answer=>answer.status==='fulfilled').flatMap(answer=>answer.value));
  if(!ips.size||answers.some(answer=>answer.status==='rejected'))throw Error('PayFast source validation temporarily unavailable.');
  return ips;
}
async function allowedIp(ip){
  const n=ip.split('.').map(Number);if(n.length!==4||n.some(x=>!Number.isInteger(x)||x<0||x>255)||n[0]===127||n[0]===10||n[0]===192&&n[1]===168)return false;
  if(!payfastIps||Date.now()>payfastIpsExpire){payfastIps=await resolvePayfastIps();payfastIpsExpire=Date.now()+300000;}
  return payfastIps.has(ip);
}

async function validTestKey(key,env){
  return /^[a-f0-9]{64}$/.test(key||'')&&!!env.PAYFAST_TEST_TOKEN_HASH&&Date.now()<Date.parse(env.PAYFAST_TEST_EXPIRES||'')&&equal(await hash(key),env.PAYFAST_TEST_TOKEN_HASH);
}
async function testAlreadyPaid(env){return !!(env.DB&&await env.DB.prepare("SELECT id FROM orders WHERE status = 'paid' AND json_extract(details_json, '$.testKeyHash') = ? LIMIT 1").bind(env.PAYFAST_TEST_TOKEN_HASH).first());}

async function checkout(request,env,testOnly=false){
  if(env.PAYFAST_ENABLED!=='true')return json({error:'Online payments are not active yet. Please contact RIZE8 Wear.'},503);
  const cfg=config(env);
  if(!env.DB||!cfg.merchantId||!cfg.merchantKey)return json({error:'Payment setup is incomplete.'},503);
  if(Number(request.headers.get('content-length'))>64000)return json({error:'Order too large.'},413);
  let input;try{const raw=await request.text();if(raw.length>64000)throw Error();input=JSON.parse(raw);}catch{return json({error:'Invalid order.'},400);}
  if(testOnly&&!await validTestKey(input.testKey,env))return json({error:'This test link is unavailable or has expired.'},404);
  // A separate, short-lived test link is the only way to create the fixed R5
  // record. The public merchandise endpoint never accepts a price override.
  if(testOnly){
    if(await testAlreadyPaid(env))return json({error:'This R5 checkout test has already been paid. Please do not pay again.'},409);
    if(!/^[a-f0-9]{64}$/.test(input.attemptToken||''))return json({error:'Invalid checkout attempt. Review your order again.'},400);
    input.attemptToken=await hash(input.testKey+':'+input.attemptToken);
  }
  let order;try{order=testOnly?{...globalThis.Rize8Cart.paymentTest(validateOrder(input)),name:'R5 LIVE CHECKOUT TEST',testKeyHash:env.PAYFAST_TEST_TOKEN_HASH}:validateOrder(input);}catch(error){return json({error:error.message},400);}
  if(input.expectedTotalCents!==undefined&&input.expectedTotalCents!==order.totalCents)return json({error:'Prices or delivery changed. Please review your order again before payment.'},409);
  const secret=input.attemptToken===undefined?token():input.attemptToken;
  if(!/^[a-f0-9]{64}$/.test(secret))return json({error:'Invalid payment attempt. Please review your order again.'},400);
  const id='R8-PF-'+(await hash(secret)).slice(0,32),now=Date.now(),base=new URL(request.url).origin;
  const existing=await env.DB.prepare('SELECT status, mode, details_json, created_at FROM orders WHERE id = ?').bind(id).first();
  if(existing&&(existing.status==='paid'||existing.mode!==(cfg.sandbox?'sandbox':'live')||existing.details_json!==JSON.stringify(order)||now-existing.created_at>86400000))return json({error:existing.status==='paid'?'This order has already been paid. Please do not pay again.':'This payment attempt no longer matches your order. Review your cart again.'},409);
  const ipHash=await hash(request.headers.get('CF-Connecting-IP')||'unknown');
  const recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM orders WHERE ip_hash = ? AND created_at > ?').bind(ipHash,Date.now()-3600000).first();
  if(!existing&&recent?.count>=15)return json({error:'Too many payment attempts. Please try again later, or order via WhatsApp.'},429);
  const pairs=[['merchant_id',cfg.merchantId],['merchant_key',cfg.merchantKey],['return_url',base+'/payment/return?order='+id+'&token='+secret],['cancel_url',base+'/payment/cancel?order='+id+'&token='+secret+(testOnly?'&checkout_test=1':'')],['notify_url',base+'/api/payfast/notify'],['name_first',order.customer.name.split(' ')[0]],['name_last',order.customer.name.split(' ').slice(1).join(' ')],['email_address',order.customer.email],['cell_number',order.customer.phone],['m_payment_id',id],['amount',money(order.totalCents)],['item_name',('RIZE8 '+order.name).slice(0,100)],['item_description',(order.quantity+' shirts; '+order.delivery.label+'; delivery '+money(order.deliveryCents)).slice(0,255)],['custom_str1',order.customer.name],['custom_str2',(order.delivery.kind==='collection'?order.delivery.label:[order.customer.street,order.customer.unit].filter(Boolean).join(', ')).slice(0,255)],['custom_str3',(order.delivery.kind==='collection'?'Collection arrangements after confirmation':[order.customer.suburb,order.customer.city,order.customer.province,order.customer.postalCode].filter(Boolean).join(', ')).slice(0,255)],['custom_str4',order.customer.phone],['email_confirmation','1'],['confirmation_address','sales@rize8wear.co.za']];
  // Keep the same customer reference in PayFast and WhatsApp.
  const receiptUrl=base+'/r/'+id+'/'+secret;
  if(!testOnly)pairs.find(([key])=>key==='item_description')[1]=[(order.reference||id),order.quantity+' shirts',order.delivery.courier+' '+money(order.deliveryCents),'Full order: '+receiptUrl].join(' | ');
  if(testOnly)pairs.find(([key])=>key==='item_description')[1]='R5 live integration test only. No T-shirt, shipping or subscription.';
  pairs.find(([key])=>key==='custom_str2')[1]=receiptUrl;
  pairs.splice(pairs.findIndex(([key])=>key==='email_confirmation'),0,['custom_str5',order.reference||id]);
  pairs.push(['signature',signature(pairs,cfg.passphrase)]);
  if(!existing)await env.DB.prepare('INSERT OR IGNORE INTO orders (id, token_hash, status, mode, total_cents, details_json, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id,await hash(secret),'awaiting_payment',cfg.sandbox?'sandbox':'live',order.totalCents,JSON.stringify(order),ipHash,now).run();
  return json({orderId:id,token:secret,action:'https://'+cfg.host+'/eng/process',fields:Object.fromEntries(pairs),totalCents:order.totalCents});
}

async function notify(request,env){
  if(!env.DB)return new Response('Unavailable',{status:503});
  // Trust Cloudflare's connection header, never a caller-supplied Referer.
  if(!await allowedIp(request.headers.get('CF-Connecting-IP')||''))return new Response('Invalid source',{status:403});
  const raw=await request.text();if(raw.length>16000)return new Response('Too large',{status:413});
  const params=new URLSearchParams(raw),pairs=Array.from(params);
  if(new Set(pairs.map(([k])=>k)).size!==pairs.length)return new Response('Duplicate fields',{status:400});
  const cfg=config(env),id=params.get('m_payment_id');
  if(params.get('merchant_id')!==cfg.merchantId||!equal(params.get('signature'),signature(pairs,cfg.passphrase,true)))return new Response('Invalid signature',{status:400});
  const order=await env.DB.prepare('SELECT id, status, mode, total_cents, pf_payment_id FROM orders WHERE id = ?').bind(id).first();
  if(!order||order.mode!==(cfg.sandbox?'sandbox':'live')||!/^\d+\.\d{2}$/.test(params.get('amount_gross')||'')||Math.round(Number(params.get('amount_gross'))*100)!==order.total_cents)return new Response('Order mismatch',{status:400});
  const confirmation=await fetch('https://'+cfg.host+'/eng/query/validate',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:parameterString(pairs,true),signal:AbortSignal.timeout(15000)});
  if(!confirmation.ok||(await confirmation.text()).trim()!=='VALID')return new Response('Payment unconfirmed',{status:400});
  if(params.get('payment_status')!=='COMPLETE')return new Response('OK');
  const paymentId=params.get('pf_payment_id');if(!/^\d+$/.test(paymentId||''))return new Response('Invalid payment',{status:400});
  if(order.status==='paid')return new Response(order.pf_payment_id===paymentId?'OK':'Payment mismatch',{status:order.pf_payment_id===paymentId?200:409});
  await env.DB.prepare("UPDATE orders SET status = 'paid', pf_payment_id = ?, paid_at = ? WHERE id = ? AND status = 'awaiting_payment'").bind(paymentId,Date.now(),id).run();
  return new Response('OK');
}

async function status(request,env,receipt=false){
  const url=new URL(request.url),id=url.searchParams.get('order'),secret=url.searchParams.get('token');
  if(!env.DB||!id||!secret||secret.length!==64)return json({error:'Order not found.'},404);
  const order=await env.DB.prepare('SELECT token_hash, status, total_cents, mode, details_json FROM orders WHERE id = ?').bind(id).first();
  if(!order||!equal(order.token_hash,await hash(secret)))return json({error:'Order not found.'},404);
  const details=JSON.parse(order.details_json),reference=details.reference||id;
  const result={orderId:id,reference,status:order.status,totalCents:order.total_cents,sandbox:order.mode==='sandbox',...(details.testPayment?{testPayment:true}:{}) ,...(details.storefrontTest?{storefrontTest:true}:{})};
  if(receipt)result.orderText=details.testPayment&&!details.storefrontTest?['R5 LIVE PAYMENT TEST','Reference: '+reference,'Amount: R5.00','Status: '+(order.status==='paid'?'Payment confirmed':'Payment not yet confirmed'),'No T-shirt or delivery included.','Name: '+details.customer.name,'Email: '+details.customer.email].join('\n'):globalThis.Rize8Cart.orderText(details,{customerName:details.customer.name,customerEmail:details.customer.email,customerPhone:details.customer.phone},reference).replace("I'd like to place this combined order:",order.status==='paid'?'PayFast payment confirmed for this combined order:':'Order awaiting payment:').replace('Please confirm stock and payment details for the full order.',order.status==='paid'?'Payment recorded through PayFast.':'Payment has not been confirmed.');
  return json(result);
}


async function paymentTestPage(request,env){
 const key=new URL(request.url).searchParams.get('key');
 if(!await validTestKey(key,env))return new Response('This test link is unavailable or has expired.',{status:404,headers:{'cache-control':'no-store'}});
 return new Response(null,{status:303,headers:{location:SHOP+'/#checkout-test='+key,'cache-control':'no-store','referrer-policy':'no-referrer','x-robots-tag':'noindex, nofollow'}});
}

function paymentReturn(request){
  const url=new URL(request.url),id=url.searchParams.get('order')||'',secret=url.searchParams.get('token')||'';
  const cancelled=url.pathname.endsWith('/cancel');
  // This page never marks an order paid. Only the verified ITN handler can do that.
  const page=`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>RIZE8 payment</title>
<style>body{font:18px/1.6 Arial;background:#111;color:#fff;max-width:740px;margin:40px auto;padding:24px}a{display:inline-block;color:#fff;padding:12px 18px;border:1px solid #aaa;margin:8px 8px 8px 0}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere;border-top:1px solid #555;padding-top:20px}#whatsapp{background:#126c3d}p{overflow-wrap:anywhere}</style>
<h1>${cancelled?'Payment cancelled':'Checking your payment'}</h1><p id="paymentStatus">${cancelled?'Checking whether payment was received. Your cart has been saved.':'Please wait while we confirm payment with PayFast.'}</p><p id="reference"></p>
<a id="return" href="${SHOP}/?resume_order=1${url.searchParams.get('checkout_test')==='1'?'&checkout_test=1':''}#christmas-clothing">Return to your saved cart</a><a id="whatsapp" hidden>Contact RIZE8 Wear on WhatsApp</a><pre id="receipt"></pre>
<script>const order=${JSON.stringify(id).replace(/</g,'\\u003c')},token=${JSON.stringify(secret).replace(/</g,'\\u003c')},cancelled=${cancelled};let confirmed=false;async function check(){try{const r=await fetch('/api/order-receipt?order='+encodeURIComponent(order)+'&token='+encodeURIComponent(token));const d=await r.json();if(!r.ok)throw Error();confirmed=d.status==='paid';document.querySelector('h1').textContent=confirmed?'Payment confirmed':cancelled?'Payment cancelled':'Payment confirmation pending';document.getElementById('paymentStatus').textContent=confirmed?(d.sandbox?'TEST PAYMENT confirmed. No real payment was made.':d.testPayment?'Your R5 live test payment is confirmed. No T-shirt or delivery is included.':'Thank you! PayFast confirmed your payment. Your order has been recorded.'):(cancelled?'Payment has not been confirmed. You can edit your saved cart, try PayFast again or contact us for assistance. If money left your account, contact us before paying again.':'We are waiting for PayFast confirmation. Please do not pay again. Contact us if you need help.');document.getElementById('reference').textContent='Order reference: '+d.reference;document.getElementById('receipt').textContent=d.orderText;const link=document.getElementById('whatsapp');link.hidden=false;link.href='https://wa.me/27603709033?text='+encodeURIComponent('Please help with PayFast order reference '+d.reference);if(confirmed){document.getElementById('return').textContent='Continue shopping';document.getElementById('return').href=d.testPayment&&!d.storefrontTest?${JSON.stringify(SHOP)}:${JSON.stringify(SHOP)}+'/?payment_return=1'+(d.storefrontTest?'&checkout_test=1':'')+'&order='+encodeURIComponent(order)+'#christmas-clothing';}}catch{document.getElementById('paymentStatus').textContent='We could not check payment yet. Please do not pay again if money left your account. Contact sales@rize8wear.co.za with reference '+order;const link=document.getElementById('whatsapp');link.hidden=false;link.href='https://wa.me/27603709033?text='+encodeURIComponent('Please help check PayFast payment reference '+order);}}check();setTimeout(()=>{if(!confirmed)check()},5000);setTimeout(()=>{if(!confirmed)check()},15000);</script></html>`;
  return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'}});
}

export default {async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');let response;
  try{
    if(url.pathname.startsWith('/api/')){
      if(origin&&!ORIGINS.has(origin))return json({error:'Origin not allowed.'},403);
      if(request.method==='OPTIONS')response=new Response(null,{status:204});
      else if(url.pathname==='/api/payment-config'&&request.method==='GET')response=json({enabled:env.PAYFAST_ENABLED==='true'&&!!env.DB&&!!config(env).merchantId&&!!config(env).merchantKey,sandbox:env.PAYFAST_MODE!=='live'});
      else if(url.pathname==='/api/order-review'&&request.method==='POST')response=await orderReview(request,env);
      else if(url.pathname==='/api/test-order-review'&&request.method==='POST')response=await orderReview(request,env,true);
      else if(url.pathname==='/api/checkout'&&request.method==='POST')response=await checkout(request,env);
      else if(url.pathname==='/api/test-checkout'&&request.method==='POST')response=await checkout(request,env,true);
      else if(url.pathname==='/api/payfast/notify'&&request.method==='POST')response=await notify(request,env);
      else if(url.pathname==='/api/order-status'&&request.method==='GET')response=await status(request,env);
      else if(url.pathname==='/api/order-receipt'&&request.method==='GET')response=await status(request,env,true);
      else response=json({error:'Not found.'},404);
      if(origin&&ORIGINS.has(origin)){response=new Response(response.body,response);response.headers.set('access-control-allow-origin',origin);response.headers.set('vary','Origin');response.headers.set('access-control-allow-methods','GET, POST, OPTIONS');response.headers.set('access-control-allow-headers','Content-Type');}
      return response;
    }
    if(url.pathname==='/payment/return'||url.pathname==='/payment/cancel')return paymentReturn(request);
    const receiptPath=url.pathname.match(/^\/r\/(R8-PF-[a-f0-9]{32})\/([a-f0-9]{64})$/);
    if(receiptPath&&request.method==='GET'){const target=new URL('/payment/return',url);target.searchParams.set('order',receiptPath[1]);target.searchParams.set('token',receiptPath[2]);return paymentReturn(new Request(target));}
    if(url.pathname==='/payment/test'&&request.method==='GET')return paymentTestPage(request,env);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    // GitHub remains the source and host for all storefront pages and images.
    return fetch(SHOP+url.pathname+url.search,{method:request.method,redirect:'follow'});
  }catch{return json({error:'The payment service is temporarily unavailable. Please try again.'},503);}
}};
