/* One editable cart across every collection. Payment is confirmed through WhatsApp. */
document.addEventListener('DOMContentLoaded',()=>{
 const core=Rize8Cart,catalogue=new Map(),cards=[];
 document.querySelectorAll('.product-card').forEach(card=>{
  const info=card.querySelector('.product-info'),name=card.querySelector('h4')?.textContent.trim();
  const price=Number(card.dataset.price||card.querySelector('.launch-prices strong')?.textContent.replace(/[^0-9.]/g,'')||card.querySelector('.christmas-price')?.textContent.match(/R(\d+)/)?.[1]);
  if(!info||!name||!price||!card.dataset.productId)return;
  const audience=card.closest('[data-audience]')?.dataset.audience||'Christmas';
  const product={id:card.dataset.productId,name,price,audience,cancer:card.hasAttribute('data-cancer'),ribbon:card.dataset.ribbon||'Yellow',colours:audience==='Christmas'?['Red','Black','White']:['White','Black'],bulkPrice:Number(card.dataset.bulkPrice)||0,bulkMinimum:Number(card.dataset.bulkMinimum)||3,bulkGroup:'christmas',personalised:audience==='Christmas'&&!name.includes('MERRY CHRISTMAS'),image:card.querySelector('img')?.getAttribute('src')||'',modelLabel:card.classList.contains('christmas-girl')?' (Kids example)':card.classList.contains('christmas-mom')?' (Adult example)':''};
  if(!catalogue.has(product.id))catalogue.set(product.id,product);
  cards.push({card,info,product});
 });
 const dialog=document.createElement('dialog');dialog.className='size-order-dialog cart-dialog';dialog.setAttribute('aria-labelledby','cartDialogTitle');
 dialog.innerHTML=`<button type="button" class="viewer-close" aria-label="Close order">&times;</button>
 <h2 id="cartDialogTitle" tabindex="-1">Your cart</h2><p class="cart-feedback" role="status" aria-live="polite"></p>
 <section data-cart-view="item" hidden><form class="size-order-form cart-item-form">
 <label for="orderDesign">Design</label><select id="orderDesign" name="design" required><option value="">Choose a design</option></select>
 <label for="orderSize">Size</label><select id="orderSize" name="size" required><option value="">Choose your size</option></select>
 <label for="orderColor">T-shirt colour</label><select id="orderColor" name="colour" required><option value="">Choose a colour</option></select>
 <div class="order-ribbon-fields" hidden><label for="orderRibbon">Ribbon print</label><select id="orderRibbon" name="ribbon" disabled></select></div>
 <div class="cart-surname-fields" hidden><label for="orderSurname">Surname for printing (if applicable)</label><input id="orderSurname" name="personalisation" maxlength="100" placeholder="Your surname"></div>
 <label for="orderQuantity">Quantity</label><input id="orderQuantity" name="quantity" type="number" min="1" max="99" step="1" value="1" required>
 <p class="item-price order-total" aria-live="polite"></p><p class="order-help">Add this choice to your cart, then keep shopping for other designs or sizes. Delivery is R99 for the whole order. Christmas shirts qualify for R180 each when your cart contains 3 or more Christmas shirts.</p>
 <button class="order-now item-save" type="submit">ADD TO CART</button><button class="order-browse item-back" type="button">Back to cart</button><p class="item-error order-status" role="alert"></p></form></section>
 <section data-cart-view="cart" hidden><div class="cart-items"></div><div class="cart-totals"></div><p class="cart-error order-status" role="alert"></p><button type="button" class="order-now cart-checkout">CHECKOUT</button><button type="button" class="order-browse continue-shopping">Continue shopping</button><p class="order-help">Edit or remove any item before ordering. Payment details will be confirmed on WhatsApp.</p></section>
 <section data-cart-view="delivery" hidden><div class="checkout-summary"></div><button type="button" class="order-browse change-cart">Edit cart / add or remove items</button>
 <form class="size-order-form delivery-form"><fieldset class="delivery-details"><legend>Your details &amp; delivery address</legend><p class="order-help">All fields marked * are required. <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a> · <a href="returns.html" target="_blank" rel="noopener noreferrer">Returns &amp; Refunds</a> · <a href="shipping.html" target="_blank" rel="noopener noreferrer">Shipping &amp; Delivery</a> · <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></p>
 <label for="customerName">Full name *</label><input id="customerName" name="customerName" autocomplete="name" required minlength="2" maxlength="120" pattern=".*\\S.*">
 <label for="customerEmail">Email address *</label><input id="customerEmail" name="customerEmail" type="email" autocomplete="email" required maxlength="254">
 <label for="customerPhone">Contact number *</label><input id="customerPhone" name="customerPhone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" pattern="[+0-9() .-]{7,25}" title="Enter your contact number, including area or country code.">
 <label for="deliveryStreet">Street address *</label><input id="deliveryStreet" name="deliveryStreet" autocomplete="address-line1" placeholder="House number and street name" required maxlength="200" pattern=".*\\S.*">
 <label for="deliveryUnit">Apartment, complex or unit (optional)</label><input id="deliveryUnit" name="deliveryUnit" autocomplete="address-line2" maxlength="120">
 <label for="deliverySuburb">Suburb *</label><input id="deliverySuburb" name="deliverySuburb" autocomplete="address-level3" required maxlength="100" pattern=".*\\S.*">
 <label for="deliveryCity">Town / city *</label><input id="deliveryCity" name="deliveryCity" autocomplete="address-level2" required maxlength="100" pattern=".*\\S.*">
 <label for="deliveryProvince">Province *</label><select id="deliveryProvince" name="deliveryProvince" autocomplete="address-level1" required><option value="">Choose your province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>North West</option><option>Northern Cape</option><option>Western Cape</option></select>
 <label for="deliveryPostalCode">Postal code *</label><input id="deliveryPostalCode" name="deliveryPostalCode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required title="Enter a four-digit South African postal code.">
 <label class="address-confirmation" for="deliveryConfirmed"><input id="deliveryConfirmed" name="deliveryConfirmed" type="checkbox" required> I confirm that my delivery address is complete and correct. *</label></fieldset>
 <button class="order-now" type="submit">REVIEW FULL ORDER</button><button type="button" class="order-browse continue-shopping">Continue shopping</button></form></section>
 <section data-cart-view="review" class="order-review" hidden><p class="review-details"></p><button type="button" class="order-edit change-cart">Edit cart / add or remove items</button><button type="button" class="order-edit edit-delivery">Edit delivery details</button><button type="button" class="order-browse continue-shopping">Continue shopping</button><button type="button" class="order-now order-confirm">ORDER VIA WHATSAPP</button><p class="review-status order-status" role="status"></p><p class="order-help">WhatsApp opens with every item, one total and your order reference. Tap Send to submit your order request. RIZE8 Wear will confirm stock and payment details for the full order. If you need a change after sending, reply in the same WhatsApp chat before paying.</p></section>`;
 document.body.append(dialog);
 const itemForm=dialog.querySelector('.cart-item-form'),deliveryForm=dialog.querySelector('.delivery-form'),design=itemForm.elements.design,size=itemForm.elements.size,colour=itemForm.elements.colour,ribbon=itemForm.elements.ribbon,quantity=itemForm.elements.quantity;
 const groups=new Map();
 for(const product of catalogue.values()){
  if(!groups.has(product.audience)){const group=document.createElement('optgroup');group.label=product.audience;groups.set(product.audience,group);design.append(group);}
  groups.get(product.audience).append(new Option(product.name+product.modelLabel,product.id));
 }
 core.SIZES.forEach(value=>size.append(new Option(value,value)));
 cancerRibbonOptions.forEach(([name,cause])=>ribbon.append(new Option(name+' — '+cause,name)));
 const storageKey='rize8-cart-v1';let cart=[],reference=null,editingId=null,previousOverflow='';
 try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');cart=core.restore(saved,catalogue);if(cart.length&&/^R8-[0-9]{6}-[A-F0-9]{16}$/.test(saved?.reference||''))reference=saved.reference;}catch{}
 const snapshot=()=>core.calculate(cart,catalogue);
 const persist=()=>{try{localStorage.setItem(storageKey,JSON.stringify({version:1,items:cart,reference,savedAt:Date.now()}));}catch{dialog.querySelector('.cart-feedback').textContent='Your cart is available while this page remains open. Your browser could not save it for later.';}};
 const badge=()=>{const count=snapshot().quantity;document.querySelectorAll('.cart-count').forEach(el=>el.textContent=count);document.querySelectorAll('.cart-button').forEach(el=>el.setAttribute('aria-label','Shopping Cart ('+count+' '+(count===1?'item':'items')+')'));};
 const changed=()=>{if(!cart.length)reference=null;persist();badge();};
 const show=(view,title)=>{dialog.querySelector('.cart-feedback').textContent='';dialog.querySelectorAll('[data-cart-view]').forEach(section=>section.hidden=section.dataset.cartView!==view);dialog.querySelector('#cartDialogTitle').textContent=title;if(!dialog.open){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}dialog.scrollTop=0;dialog.querySelector('#cartDialogTitle').focus();};
 function totalsElement(order){
  const box=document.createElement('div');box.className='cart-total-box';
  for(const [label,amount] of [['Subtotal',order.subtotalCents],['Nationwide delivery (once)',order.deliveryCents],['Total',order.totalCents]]){const row=document.createElement('p'),name=document.createElement('span'),price=document.createElement('strong');name.textContent=label;price.textContent=core.money(amount);row.append(name,price);box.append(row);}
  return box;
 }
 function drawSummary(target){const order=snapshot();target.replaceChildren();for(const line of order.lines){const p=document.createElement('p');p.className='checkout-line';p.textContent=line.quantity+' × '+line.product.audience+' '+line.product.name+' · '+line.size+' · '+line.colour+(line.ribbon?' · '+line.ribbon+' ribbon':'')+(line.personalisation?' · '+line.personalisation:'')+' — '+core.money(line.lineCents);target.append(p);}target.append(totalsElement(order));}
 const linePriceText=line=>core.money(line.unitCents)+' each'+(line.discounted?' (Christmas 3+ price)':'')+' · '+core.money(line.lineCents);
 function refreshCartTotals(){const order=snapshot();for(const row of dialog.querySelectorAll('.cart-line')){const line=order.lines.find(line=>line.id===row.dataset.lineId);if(line)row.querySelector('.cart-line-price').textContent=linePriceText(line);}dialog.querySelector('.cart-totals').replaceChildren(totalsElement(order));}
 function renderCart(){
  const order=snapshot(),list=dialog.querySelector('.cart-items');list.replaceChildren();
  if(!order.lines.length){const p=document.createElement('p');p.textContent='Your cart is empty. Choose a design and add your size to get started.';list.append(p);}
  for(const line of order.lines){
   const row=document.createElement('article');row.className='cart-line';row.dataset.lineId=line.id;
   const image=document.createElement('img');image.src=line.product.image;image.alt='';image.loading='lazy';
   const content=document.createElement('div'),heading=document.createElement('h3'),choices=document.createElement('p'),price=document.createElement('p');
   heading.textContent=line.product.audience+' '+line.product.name;
   choices.textContent='Size: '+line.size+' · Colour: '+line.colour+(line.ribbon?' · Ribbon: '+line.ribbon:'')+(line.personalisation?' · Surname: '+line.personalisation:'');
   price.textContent=linePriceText(line);price.className='cart-line-price';
   const label=document.createElement('label');label.className='cart-quantity-label';label.textContent='Quantity';
   const input=document.createElement('input');input.type='number';input.min='1';input.max='99';input.step='1';input.value=line.quantity;input.required=true;input.setAttribute('aria-label','Quantity for '+line.product.audience+' '+line.product.name);label.append(input);
   input.addEventListener('input',()=>{dialog.querySelector('.cart-error').textContent=input.validity.valid?'':'Choose a whole quantity from 1 to 99.';if(input.validity.valid){cart=cart.map(item=>item.id===line.id?{...item,quantity:Number(input.value)}:item);changed();refreshCartTotals();}});
   input.addEventListener('change',()=>{if(!input.reportValidity())return;cart=cart.map(item=>item.id===line.id?{...item,quantity:Number(input.value)}:item);changed();renderCart();});
   const actions=document.createElement('div');actions.className='cart-line-actions';
   for(const [text,action] of [['Edit item',()=>openItem(line.product,line)],['Remove item',()=>{cart=cart.filter(item=>item.id!==line.id);changed();renderCart();dialog.querySelector('.cart-feedback').textContent='Item removed. Your total has been updated.';}]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.setAttribute('aria-label',text+' '+line.product.audience+' '+line.product.name);button.addEventListener('click',action);actions.append(button);}
   content.append(heading,choices,price,label,actions);row.append(image,content);list.append(row);
  }
  dialog.querySelector('.cart-totals').replaceChildren(totalsElement(order));dialog.querySelector('.cart-checkout').disabled=!order.lines.length;dialog.querySelector('.cart-error').textContent='';badge();
 }
 function openCart(){dialog.querySelector('.cart-feedback').textContent='';renderCart();show('cart','Your cart');}
 function updateItemProduct(){
  const product=catalogue.get(design.value);if(!product)return;
  const previous=colour.value;colour.replaceChildren(new Option('Choose a colour',''),...product.colours.map(value=>new Option(value,value)));if(product.colours.includes(previous))colour.value=previous;
  dialog.querySelector('.order-ribbon-fields').hidden=!product.cancer;ribbon.disabled=!product.cancer;ribbon.required=product.cancer;if(product.cancer&&!ribbon.value)ribbon.value=product.ribbon;
  dialog.querySelector('.cart-surname-fields').hidden=!product.personalised;itemForm.elements.personalisation.disabled=!product.personalised;refreshItemPrice();
 }
 function refreshItemPrice(){
  const product=catalogue.get(design.value);if(!product)return;
  const valid=quantity.validity.valid;
  if(!valid){dialog.querySelector('.item-price').textContent='';return;}
  const otherCount=cart.filter(line=>line.id!==editingId&&catalogue.get(line.productId)?.bulkPrice).reduce((sum,line)=>sum+line.quantity,0);
  const discounted=product.bulkPrice&&otherCount+Number(quantity.value)>=product.bulkMinimum;
  const unit=discounted?product.bulkPrice:product.price;
  dialog.querySelector('.item-price').textContent=core.money(unit*100)+' each · This choice: '+core.money(unit*Number(quantity.value)*100)+(discounted?' (Christmas 3+ price)':'');
 }
 function openItem(product,line=null){
  editingId=line?.id||null;itemForm.reset();design.value=product.id;updateItemProduct();
  if(line){size.value=line.size;colour.value=line.colour;ribbon.value=line.ribbon;quantity.value=line.quantity;itemForm.elements.personalisation.value=line.personalisation;}else ribbon.value=product.ribbon;
  dialog.querySelector('.item-save').textContent=line?'SAVE CHANGES':'ADD TO CART';dialog.querySelector('.item-error').textContent='';dialog.querySelector('.cart-feedback').textContent='';refreshItemPrice();show('item',line?'Edit item':'Choose your T-shirt');
 }
 itemForm.addEventListener('input',refreshItemPrice);design.addEventListener('change',updateItemProduct);
 itemForm.addEventListener('submit',event=>{event.preventDefault();if(!itemForm.reportValidity())return;try{
  const values=Object.fromEntries(new FormData(itemForm));cart=core.upsertLine(cart,{id:crypto.randomUUID(),productId:design.value,...values},catalogue,editingId);changed();renderCart();show('cart','Your cart');dialog.querySelector('.cart-feedback').textContent=editingId?'Your changes have been saved.':'Added to your cart. Keep shopping to add another design or size.';editingId=null;
 }catch(error){dialog.querySelector('.item-error').textContent=error.message;}});
 function openDelivery(){if(!cart.length)return openCart();drawSummary(dialog.querySelector('.checkout-summary'));show('delivery','Checkout');}
 dialog.querySelector('.cart-checkout').addEventListener('click',()=>{for(const input of dialog.querySelectorAll('.cart-items input'))if(!input.reportValidity())return;openDelivery();});
 dialog.querySelector('.item-back').addEventListener('click',openCart);
 dialog.querySelectorAll('.change-cart').forEach(button=>button.addEventListener('click',openCart));
 dialog.querySelector('.edit-delivery').addEventListener('click',openDelivery);
 dialog.querySelectorAll('.continue-shopping').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
 deliveryForm.elements.customerPhone.addEventListener('input',()=>{const field=deliveryForm.elements.customerPhone;field.setCustomValidity(field.value.replace(/\D/g,'').length>=7?'':'Enter a valid contact number with at least seven digits.');});
 function reviewOrder(){if(!cart.length)return openCart();if(!deliveryForm.checkValidity()){openDelivery();deliveryForm.reportValidity();return;}reference ||= createOrderReference();persist();const details=Object.fromEntries(new FormData(deliveryForm));dialog.querySelector('.review-details').textContent=core.orderText(snapshot(),details,reference);dialog.querySelector('.review-status').textContent='';show('review','Review your full order');}
 deliveryForm.addEventListener('submit',event=>{event.preventDefault();reviewOrder();});
 dialog.querySelector('.order-confirm').addEventListener('click',()=>{
  if(!cart.length)return openCart();if(!deliveryForm.checkValidity()){openDelivery();deliveryForm.reportValidity();return;}
  const details=Object.fromEntries(new FormData(deliveryForm)),message=core.orderText(snapshot(),details,reference||=createOrderReference());
  persist();dialog.querySelector('.review-status').textContent='Opening WhatsApp with your full order. Tap Send to submit it.';
  window.location.href='https://wa.me/27603709033?text='+encodeURIComponent(message);
 });
 document.querySelectorAll('.cart-button').forEach(button=>{button.type='button';button.addEventListener('click',openCart);});
 for(const {info,product} of cards){const button=document.createElement('button');button.type='button';button.className='order-size';button.textContent=product.cancer?'Choose T-shirt, size & ribbon':'Choose size & add to cart';button.setAttribute('aria-label',button.textContent+' for '+product.name);button.addEventListener('click',()=>openItem(product));info.append(button);}
 badge();
 if(new URLSearchParams(location.search).has('resume_order'))openCart();
});
