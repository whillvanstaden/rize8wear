const META_PIXEL_ID='1928208843860853';
const META_GRAPH_VERSION='v27.0';
const sha256=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');

// Only the verified ITN path calls this. Event data always comes from the paid DB record.
// A lost HTTP response may require a retry: the same event_id and event_time are reused.
export async function reportMetaPurchase(orderId,env){
 if(env.META_CAPI_ENABLED!=='true')return true;
 const order=await env.DB.prepare('SELECT id, status, mode, total_cents, paid_at, details_json FROM orders WHERE id = ?').bind(orderId).first();
 if(!order||order.status!=='paid'||!order.paid_at)return true;
 const testMode=env.META_CAPI_MODE==='test';
 if(testMode&&order.mode!=='sandbox'||env.META_CAPI_MODE==='live'&&order.mode!=='live')return true;
 if(!['test','live'].includes(env.META_CAPI_MODE)||!env.META_ACCESS_TOKEN||testMode&&!/^TEST\w{1,100}$/.test(env.META_TEST_EVENT_CODE||'')||!testMode&&env.META_TEST_EVENT_CODE)return false;
 const previous=await env.DB.prepare('SELECT state FROM meta_purchase_events WHERE order_id = ?').bind(order.id).first();
 if(previous?.state==='sent')return true;
 const now=Date.now();
 // Stop ambiguous retries before Meta's 48-hour browser/server deduplication window ends.
 if(now-order.paid_at>47*3600000)return false;
 await env.DB.prepare('INSERT OR IGNORE INTO meta_purchase_events (order_id) VALUES (?)').bind(order.id).run();
 const claimed=await env.DB.prepare("UPDATE meta_purchase_events SET state = 'sending', attempts = attempts + 1, lease_until = ?, last_error = NULL WHERE order_id = ? AND state != 'sent' AND (lease_until IS NULL OR lease_until < ?) RETURNING order_id").bind(now+120000,order.id,now).first();
 if(!claimed){const existing=await env.DB.prepare('SELECT state FROM meta_purchase_events WHERE order_id = ?').bind(order.id).first();return existing?.state==='sent';}
 try{
  const details=JSON.parse(order.details_json);
  const email=String(details.customer?.email||'').trim().toLowerCase();
  const clientUserAgent=details.metaTracking?.clientUserAgent;
  if(!email||!clientUserAgent||!Number.isSafeInteger(order.total_cents)||order.total_cents<=0)throw Error('invalid_order_data');
  const event={event_name:'Purchase',event_time:Math.floor(order.paid_at/1000),event_id:order.id,action_source:'website',event_source_url:'https://rize8wear.co.za/',user_data:{em:[await sha256(email)],client_user_agent:clientUserAgent},custom_data:{value:order.total_cents/100,currency:'ZAR'}};
  const body={data:[event],access_token:env.META_ACCESS_TOKEN,...(testMode?{test_event_code:env.META_TEST_EVENT_CODE}:{})};
  const response=await fetch('https://graph.facebook.com/'+META_GRAPH_VERSION+'/'+META_PIXEL_ID+'/events',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw Error('meta_http_'+response.status);
  const result=await response.json();if(result.events_received!==1)throw Error('meta_not_accepted');
  await env.DB.prepare("UPDATE meta_purchase_events SET state = 'sent', sent_at = ?, lease_until = NULL, last_error = NULL WHERE order_id = ?").bind(Date.now(),order.id).run();
  return true;
 }catch(error){
  // Never persist upstream bodies, access tokens, or customer data in error messages.
  const code=/^(meta_http_\d{3}|meta_not_accepted|invalid_order_data)$/.test(error.message)?error.message:'meta_send_failed';
  await env.DB.prepare("UPDATE meta_purchase_events SET state = 'pending', lease_until = NULL, last_error = ? WHERE order_id = ?").bind(code,order.id).run();
  return false;
 }
}
