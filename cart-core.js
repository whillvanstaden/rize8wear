/* Cart calculations shared by the storefront and its checkout checks. */
(function(root){
 'use strict';
 const SIZES=['S','M','L','XL','2XL','2–3 yrs','3–4 yrs','4–5 yrs','5–6 yrs','7–8 yrs','9–10 yrs','11–12 yrs','Newborn (0–1 Month)','0–3 Months','3–6 Months','6–9 Months','6–12 Months','12–18 Months','18–24 Months'];
 const RIBBONS=['Yellow','Pink','Gold','White or Pearl','Purple','Teal','Orange','Lime Green','Dark Blue','Light Blue','Gray','Black'];
 const money=cents=>'R'+(cents/100).toLocaleString('en-ZA',{maximumFractionDigits:2});
 function normaliseLine(raw,catalogue){
  const product=catalogue.get(raw.productId);
  if(!product)throw Error('Please choose an available T-shirt.');
  const quantity=Number(raw.quantity);
  if(!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error('Choose a whole quantity from 1 to 99 for each item.');
  if(!SIZES.includes(raw.size)||!product.colours.includes(raw.colour))throw Error('Choose a valid size and T-shirt colour.');
  if(product.cancer&&!RIBBONS.includes(raw.ribbon))throw Error('Choose a ribbon colour for this T-shirt.');
  const personalisation=String(raw.personalisation||'').trim();
  if(personalisation.length>100||/[\u0000-\u001f]/.test(personalisation))throw Error('Enter a surname of up to 100 characters.');
  return {id:String(raw.id||''),productId:product.id,size:raw.size,colour:raw.colour,ribbon:product.cancer?raw.ribbon:'',personalisation:product.personalised?personalisation:'',quantity};
 }
 const key=line=>JSON.stringify([line.productId,line.size,line.colour,line.ribbon,line.personalisation]);
 function upsertLine(cart,raw,catalogue,editingId=null){
  const incoming=normaliseLine(raw,catalogue);
  const next=cart.filter(line=>line.id!==editingId).map(line=>normaliseLine(line,catalogue));
  const identical=next.find(line=>key(line)===key(incoming));
  if(identical){
   if(identical.quantity+incoming.quantity>99)throw Error('The quantity for this combination cannot exceed 99.');
   identical.quantity+=incoming.quantity;
  }else{
   if(next.length>=50)throw Error('Your cart can hold up to 50 different choices. Please contact us for a larger order.');
   next.push({...incoming,id:editingId||incoming.id});
  }
  return next;
 }
 function calculate(cart,catalogue){
  const groups=new Map();
  const valid=cart.map(line=>normaliseLine(line,catalogue));
  for(const line of valid){const p=catalogue.get(line.productId);if(p.bulkPrice)groups.set(p.bulkGroup,(groups.get(p.bulkGroup)||0)+line.quantity);}
  const lines=valid.map(line=>{
   const product=catalogue.get(line.productId);
   const discounted=!!product.bulkPrice&&(groups.get(product.bulkGroup)||0)>=product.bulkMinimum;
   const unitCents=Math.round((discounted?product.bulkPrice:product.price)*100);
   return {...line,product,discounted,unitCents,lineCents:unitCents*line.quantity};
  });
  const subtotalCents=lines.reduce((sum,line)=>sum+line.lineCents,0),deliveryCents=lines.length?9900:0;
  return {lines,quantity:lines.reduce((sum,line)=>sum+line.quantity,0),subtotalCents,deliveryCents,totalCents:subtotalCents+deliveryCents};
 }
 function restore(saved,catalogue){
  if(!saved||saved.version!==1||!Array.isArray(saved.items)||saved.items.length>50||!Number.isFinite(saved.savedAt)||Date.now()-saved.savedAt>7*86400000)return [];
  const lines=[];
  for(const raw of saved.items){try{const line=normaliseLine(raw,catalogue);if(line.id&&!lines.some(existing=>existing.id===line.id))lines.push(line);}catch{}}
  return lines;
 }
 function itemText(line,index){
  return [(index+1)+'. '+line.product.audience+' '+line.product.name,'Size: '+line.size+' | Colour: '+line.colour,...(line.ribbon?['Ribbon print: '+line.ribbon]:[]),...(line.personalisation?['Surname for printing: '+line.personalisation]:[]),'Quantity: '+line.quantity+' | Unit price: '+money(line.unitCents)+(line.discounted?' (Christmas 3+ price)':''),'Item total: '+money(line.lineCents)].join('\n');
 }
 function orderText(snapshot,details,reference){
  if(!snapshot.lines.length)throw Error('Add a T-shirt to your cart first.');
  const clean=key=>String(details[key]||'').trim();
  return ['Order reference: '+reference,'','Hello RIZE8 Wear,',"I'd like to place this combined order:",'',snapshot.lines.map(itemText).join('\n\n'),'','Items: '+snapshot.quantity,'Subtotal: '+money(snapshot.subtotalCents),'Nationwide delivery (once per order): '+money(snapshot.deliveryCents),'TOTAL: '+money(snapshot.totalCents),'','Customer details:','Full name: '+clean('customerName'),'Email: '+clean('customerEmail'),'Contact number: '+clean('customerPhone'),'','Delivery address:',clean('deliveryStreet'),...(clean('deliveryUnit')?[clean('deliveryUnit')]:[]),clean('deliverySuburb'),clean('deliveryCity'),clean('deliveryProvince'),clean('deliveryPostalCode'),'South Africa','Customer confirmed the delivery address is correct.','','Please confirm stock and payment details for the full order.'].join('\n');
 }
 const api={SIZES,RIBBONS,money,normaliseLine,upsertLine,calculate,restore,itemText,orderText};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.Rize8Cart=api;
})(globalThis);
