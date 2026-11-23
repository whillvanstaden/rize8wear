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
  const items=Array.isArray(input.items)?input.items:[input];
  if(!items.length||items.length>50)throw Error('Add between one and 50 choices to your cart.');
  const products=new Map(Object.entries(catalogue));
  const lines=items.map((line,index)=>globalThis.Rize8Cart.normaliseLine({...line,id:'line-'+index},products));
  const order=globalThis.Rize8Cart.calculate(lines,products,method.id,now),first=order.lines[0];
  return {...order,delivery,customer,productId:first.productId,name:order.lines.length===1?first.product.name:order.quantity+' T-shirts',audience:first.product.audience,size:first.size,colour:first.colour,ribbon:first.ribbon,unitCents:first.unitCents};
}

async function orderReview(request){
 let input;try{const raw=await request.text();if(raw.length>64000)throw Error();input=JSON.parse(raw);}catch{return json({error:'Invalid order.'},400);}
 try{return json({order:validateOrder(input,{requireConfirmation:input.requireConfirmation===true,forPayment:false})});}catch(error){return json({error:error.message},400);}
}

function config(env){
  const sandbox=env.PAYFAST_MODE!=='live';
  return {sandbox,host:sandbox?'sandbox.payfast.co.za':'www.payfast.co.za',merchantId:sandbox?'10000100':env.PAYFAST_MERCHANT_ID,merchantKey:sandbox?'46f0cd694581a':env.PAYFAST_MERCHANT_KEY,passphrase:sandbox?'':env.PAYFAST_PASSPHRASE||''};
}

function allowedIp(ip){
  const n=ip.split('.').map(Number);if(n.length!==4||n.some(x=>!Number.isInteger(x)||x<0||x>255))return false;
  return n[0]===197&&n[1]===97&&n[2]===145&&n[3]>=144&&n[3]<=159||n[0]===41&&n[1]===74&&n[2]===179&&n[3]>=192&&n[3]<=223||n[0]===102&&n[1]===216&&n[2]===36&&(n[3]<=15||n[3]>=128&&n[3]<=143)||ip==='144.126.193.139';
}

async function checkout(request,env){
  if(env.PAYFAST_ENABLED!=='true')return json({error:'Online payments are not active yet. Please contact RIZE8 Wear.'},503);
  const cfg=config(env);
  if(!env.DB||!cfg.merchantId||!cfg.merchantKey)return json({error:'Payment setup is incomplete.'},503);
  if(Number(request.headers.get('content-length'))>64000)return json({error:'Order too large.'},413);
  let input;try{const raw=await request.text();if(raw.length>64000)throw Error();input=JSON.parse(raw);}catch{return json({error:'Invalid order.'},400);}
  let order;try{order=validateOrder(input);}catch(error){return json({error:error.message},400);}
  const ipHash=await hash(request.headers.get('CF-Connecting-IP')||'unknown');
  const recent=await env.DB.prepare('SELECT COUNT(*) AS count FROM orders WHERE ip_hash = ? AND created_at > ?').bind(ipHash,Date.now()-3600000).first();
  if(recent?.count>=15)return json({error:'Too many payment attempts. Please try again later.'},429);
  const id='R8-'+crypto.randomUUID(),secret=token(),now=Date.now(),base=new URL(request.url).origin;
  const pairs=[['merchant_id',cfg.merchantId],['merchant_key',cfg.merchantKey],['return_url',base+'/payment/return?order='+id+'&token='+secret],['cancel_url',base+'/payment/cancel?order='+id+'&token='+secret],['notify_url',base+'/api/payfast/notify'],['name_first',order.customer.name.split(' ')[0]],['name_last',order.customer.name.split(' ').slice(1).join(' ')],['email_address',order.customer.email],['cell_number',order.customer.phone],['m_payment_id',id],['amount',money(order.totalCents)],['item_name',('RIZE8 '+order.name).slice(0,100)],['item_description',(order.quantity+' shirts; '+order.delivery.label+'; delivery '+money(order.deliveryCents)).slice(0,255)],['custom_str1',order.customer.name],['custom_str2',(order.delivery.kind==='collection'?order.delivery.label:[order.customer.street,order.customer.unit].filter(Boolean).join(', ')).slice(0,255)],['custom_str3',(order.delivery.kind==='collection'?'Collection arrangements after confirmation':[order.customer.suburb,order.customer.city,order.customer.province,order.customer.postalCode].filter(Boolean).join(', ')).slice(0,255)],['custom_str4',order.customer.phone],['email_confirmation','1'],['confirmation_address','sales@rize8wear.co.za']];
  pairs.push(['signature',signature(pairs,cfg.passphrase)]);
  await env.DB.prepare('INSERT INTO orders (id, token_hash, status, mode, total_cents, details_json, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id,await hash(secret),'awaiting_payment',cfg.sandbox?'sandbox':'live',order.totalCents,JSON.stringify(order),ipHash,now).run();
  return json({orderId:id,token:secret,action:'https://'+cfg.host+'/eng/process',fields:Object.fromEntries(pairs),totalCents:order.totalCents});
}

async function notify(request,env){
  if(!env.DB)return new Response('Unavailable',{status:503});
  // Trust Cloudflare's connection header, never a caller-supplied Referer.
  if(!allowedIp(request.headers.get('CF-Connecting-IP')||''))return new Response('Invalid source',{status:403});
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

async function status(request,env){
  const url=new URL(request.url),id=url.searchParams.get('order'),secret=url.searchParams.get('token');
  if(!env.DB||!id||!secret||secret.length!==64)return json({error:'Order not found.'},404);
  const order=await env.DB.prepare('SELECT token_hash, status, total_cents, mode FROM orders WHERE id = ?').bind(id).first();
  if(!order||!equal(order.token_hash,await hash(secret)))return json({error:'Order not found.'},404);
  return json({orderId:id,status:order.status,totalCents:order.total_cents,sandbox:order.mode==='sandbox'});
}

function paymentReturn(request){
  const url=new URL(request.url),id=url.searchParams.get('order')||'',secret=url.searchParams.get('token')||'';
  const cancelled=url.pathname.endsWith('/cancel');
  // This page never marks an order paid. Only the verified ITN handler can do that.
  const page='<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>RIZE8 payment</title><style>body{font:18px/1.6 Arial;max-width:620px;margin:70px auto;padding:24px}a{color:#111}button{padding:12px}</style><h1>'+(cancelled?'Payment cancelled':'Checking your payment')+'</h1><p id="paymentStatus">'+(cancelled?'Your payment was cancelled. Your order has not been marked as paid.':'Please wait while we confirm payment with PayFast.')+'</p><p><a href="'+SHOP+(cancelled?'/?resume_order=1':'/')+'#christmas-clothing">Return to RIZE8 Wear</a></p><script>const order='+JSON.stringify(id).replace(/</g,'\\u003c')+',token='+JSON.stringify(secret).replace(/</g,'\\u003c')+';async function check(){try{const r=await fetch("/api/order-status?order="+encodeURIComponent(order)+"&token="+encodeURIComponent(token));const d=await r.json();document.getElementById("paymentStatus").textContent=d.status==="paid"?(d.sandbox?"TEST PAYMENT confirmed. No real payment was made.":"Payment confirmed. Thank you! Your order reference is "+d.orderId):"Payment confirmation is pending. Please do not pay again. Keep your order reference: "+order;}catch{document.getElementById("paymentStatus").textContent="We could not check payment yet. Please contact sales@rize8wear.co.za with reference "+order;}}'+(!cancelled?'check();setTimeout(check,5000);setTimeout(check,15000);':'')+'</script>';
  return new Response(page,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'}});
}

export default {async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');let response;
  try{
    if(url.pathname.startsWith('/api/')){
      if(origin&&!ORIGINS.has(origin))return json({error:'Origin not allowed.'},403);
      if(request.method==='OPTIONS')response=new Response(null,{status:204});
      else if(url.pathname==='/api/payment-config'&&request.method==='GET')response=json({enabled:env.PAYFAST_ENABLED==='true',sandbox:env.PAYFAST_MODE!=='live'});
      else if(url.pathname==='/api/order-review'&&request.method==='POST')response=await orderReview(request);
      else if(url.pathname==='/api/checkout'&&request.method==='POST')response=await checkout(request,env);
      else if(url.pathname==='/api/payfast/notify'&&request.method==='POST')response=await notify(request,env);
      else if(url.pathname==='/api/order-status'&&request.method==='GET')response=await status(request,env);
      else response=json({error:'Not found.'},404);
      if(origin&&ORIGINS.has(origin)){response=new Response(response.body,response);response.headers.set('access-control-allow-origin',origin);response.headers.set('vary','Origin');response.headers.set('access-control-allow-methods','GET, POST, OPTIONS');response.headers.set('access-control-allow-headers','Content-Type');}
      return response;
    }
    if(url.pathname==='/payment/return'||url.pathname==='/payment/cancel')return paymentReturn(request);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Method not allowed',{status:405});
    // GitHub remains the source and host for all storefront pages and images.
    return fetch(SHOP+url.pathname+url.search,{method:request.method,redirect:'follow'});
  }catch{return json({error:'The payment service is temporarily unavailable. Please try again.'},503);}
}};
