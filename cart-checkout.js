/* One editable cart across every collection. All collections use one editable PayFast checkout. */
document.addEventListener('DOMContentLoaded',()=>{
 const core=Rize8Cart,shipping=Rize8Shipping,catalogue=new Map(),cards=[];
 const testAccess=window.Rize8CheckoutTest||null,cartStore=testAccess?sessionStorage:localStorage;
 if(testAccess){const banner=document.createElement('aside');banner.className='checkout-test-banner';banner.setAttribute('role','status');banner.style.cssText='background:#f6c400;color:#111;padding:14px 20px;font:700 16px/1.5 Arial;text-align:center';banner.append(document.createTextNode('R5 LIVE CHECKOUT TEST — Choose your designs and use the normal checkout. Pay R5 total. No products or delivery will be supplied. '));const exit=document.createElement('a');exit.href=location.pathname;exit.textContent='Exit test';exit.style.color='#111';banner.append(exit);document.body.prepend(banner);}
 const reviewApi=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)?location.origin:paymentService;
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
 <p class="item-price order-total" aria-live="polite"></p><p class="order-help">Add this choice to your cart, then keep shopping for other designs or sizes. Choose free collection or a delivery option at checkout. Christmas shirts qualify for R180 each when your cart contains 3 or more Christmas shirts.</p>
 <button class="order-now item-save" type="submit">ADD TO CART</button><button class="order-browse item-back" type="button">Back to cart</button><p class="item-error order-status" role="alert"></p></form></section>
 <section data-cart-view="cart" hidden><div class="cart-items"></div><div class="cart-totals"></div><p class="cart-error order-status" role="alert"></p><button type="button" class="order-now cart-checkout">CHECKOUT</button><button type="button" class="order-browse continue-shopping">Continue shopping</button><p class="order-help">Edit or remove any item before ordering. Review your complete order, then pay securely with PayFast.</p></section>
 <section data-cart-view="delivery" hidden><div class="checkout-summary"></div><button type="button" class="order-browse change-cart">Edit cart / add or remove items</button>
 <form class="size-order-form delivery-form"><fieldset class="delivery-details"><legend>Your details &amp; delivery address</legend><p class="order-help">All fields marked * are required. <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a> · <a href="returns.html" target="_blank" rel="noopener noreferrer">Returns &amp; Refunds</a> · <a href="shipping.html" target="_blank" rel="noopener noreferrer">Shipping &amp; Delivery</a> · <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></p>
 <label for="customerName">Full name *</label><input id="customerName" name="customerName" autocomplete="name" required minlength="2" maxlength="120" pattern=".*\\S.*">
 <label for="customerEmail">Email address *</label><input id="customerEmail" name="customerEmail" type="email" autocomplete="email" required maxlength="254">
 <label for="customerPhone">Contact number *</label><input id="customerPhone" name="customerPhone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" pattern="[+0-9() .-]{7,25}" title="Enter your contact number, including area or country code.">
 <fieldset class="delivery-methods"><legend>Choose Your Delivery Method</legend><div class="delivery-options"></div></fieldset>
 <section class="checkout-delivery-terms" aria-labelledby="deliveryTermsHeading"><h3 id="deliveryTermsHeading">Before you order: delivery terms</h3>
 <ul><li><strong>FREE door-to-door shipping on product orders over R1,000 after discounts.</strong> Orders of R1,000 or less have a flat R99 delivery fee. Collection at Kritzinger Road or Midrand is free; please check the addresses, hours and Midrand holiday closure above.</li>
 <li>Processing begins within <strong>48 hours of cleared payment</strong>. Proof of payment alone does not confirm payment.</li>
 <li>Once processing begins, allow up to <strong>3 working days for preparation and dispatch</strong>. Working days exclude weekends and South African public holidays.</li>
 <li>Delivery timeframes are estimates confirmed for your selected service. Courier delays, remote locations and peak periods may affect arrival.</li>
 <li>Check your address, contact number and postal code carefully. Incorrect details may delay delivery or cause additional courier charges where legally permitted.</li></ul>
 <p><a href="shipping.html" target="_blank" rel="noopener noreferrer">Read the full Shipping &amp; Delivery Policy</a> · <a href="terms.html" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a></p>
 <label class="shipping-terms-confirmation" for="shippingTermsAccepted"><input id="shippingTermsAccepted" name="shippingTermsAccepted" type="checkbox" required><span>I have read and understand the Shipping &amp; Delivery Policy and Terms &amp; Conditions. *</span></label></section>
 <div class="quote-area-fields" hidden><label for="deliveryArea">Preferred suburb, city or postal code *</label><input id="deliveryArea" name="deliveryArea" maxlength="120" disabled><p class="order-help">This area helps us find a suitable official collection point. It is not a selected or verified pickup point.</p></div>
 <div class="door-address-fields" hidden>
 <label for="deliveryStreet">Street address *</label><input id="deliveryStreet" name="deliveryStreet" autocomplete="address-line1" placeholder="House number and street name" required maxlength="200" pattern=".*\\S.*">
 <label for="deliveryUnit">Apartment, complex or unit (optional)</label><input id="deliveryUnit" name="deliveryUnit" autocomplete="address-line2" maxlength="120">
 <label for="deliverySuburb">Suburb *</label><input id="deliverySuburb" name="deliverySuburb" autocomplete="address-level3" required maxlength="100" pattern=".*\\S.*">
 <label for="deliveryCity">Town / city *</label><input id="deliveryCity" name="deliveryCity" autocomplete="address-level2" required maxlength="100" pattern=".*\\S.*">
 <label for="deliveryProvince">Province *</label><select id="deliveryProvince" name="deliveryProvince" autocomplete="address-level1" required><option value="">Choose your province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>North West</option><option>Northern Cape</option><option>Western Cape</option></select>
 <label for="deliveryPostalCode">Postal code *</label><input id="deliveryPostalCode" name="deliveryPostalCode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required title="Enter a four-digit South African postal code.">
 </div></fieldset>
 <button class="order-now review-submit" type="submit">REVIEW FULL ORDER</button><p class="delivery-status order-status" role="alert"></p><button type="button" class="order-browse continue-shopping">Continue shopping</button></form></section>
 <section data-cart-view="review" class="order-review" hidden><p class="review-details"></p><button type="button" class="order-edit change-cart">Edit cart / add or remove items</button><button type="button" class="order-edit edit-delivery">Edit delivery details</button><button type="button" class="order-browse continue-shopping">Continue shopping</button><div class="review-delivery"></div><label class="address-confirmation final-confirmation" for="deliveryConfirmed"><input id="deliveryConfirmed" type="checkbox" required><span></span></label><button type="button" class="order-now payfast-confirm" hidden>PAY SECURELY WITH PAYFAST</button><p class="payfast-availability order-help" role="status"></p><p class="review-status order-status" role="status"></p><p class="order-help">PayFast securely processes the complete total shown above. You can edit designs, sizes, colours, quantities and delivery details before paying. Your cart stays saved if you cancel payment.</p></section>`;
 document.body.append(dialog);
 const itemForm=dialog.querySelector('.cart-item-form'),deliveryForm=dialog.querySelector('.delivery-form'),design=itemForm.elements.design,size=itemForm.elements.size,colour=itemForm.elements.colour,ribbon=itemForm.elements.ribbon,quantity=itemForm.elements.quantity;
 const groups=new Map();
 for(const product of catalogue.values()){
  if(!groups.has(product.audience)){const group=document.createElement('optgroup');group.label=product.audience;groups.set(product.audience,group);design.append(group);}
  groups.get(product.audience).append(new Option(product.name+product.modelLabel,product.id));
 }
 core.SIZES.forEach(value=>size.append(new Option(value,value)));
 cancerRibbonOptions.forEach(([name,cause])=>ribbon.append(new Option(name+' — '+cause,name)));
 const storageKey=testAccess?'rize8-test-cart-v1':'rize8-cart-v1';let cart=[],reference=null,editingId=null,previousOverflow='',deliveryMethodId=null,reviewedOrder=null,reviewBusy=false,revision=0;
 const finalConfirmation=dialog.querySelector('#deliveryConfirmed'),payfastButton=dialog.querySelector('.payfast-confirm');
 let paymentConfig={enabled:false,sandbox:false},paymentAttempt=null;
 const attemptKey=testAccess?'rize8-test-payfast-attempt-v1':'rize8-payfast-attempt-v1';
 try{paymentAttempt=JSON.parse(sessionStorage.getItem(attemptKey)||'null');if(!paymentAttempt||Date.now()-paymentAttempt.savedAt>86400000)paymentAttempt=null;}catch{}
 const resetPaymentAttempt=()=>{paymentAttempt=null;try{sessionStorage.removeItem(attemptKey);}catch{}};
 function syncPaymentChoice(){const quote=reviewedOrder?.delivery.quoteOnly;payfastButton.hidden=false;payfastButton.disabled=!paymentConfig.enabled||!!quote;payfastButton.textContent=testAccess?'PAY R5.00 WITH PAYFAST':paymentConfig.sandbox?'TEST PAYFAST PAYMENT':'PAY SECURELY WITH PAYFAST';dialog.querySelector('.payfast-availability').textContent=quote?'Arrange a confirmed delivery option before payment.':paymentConfig.enabled?'Secure payment for the full order total shown above.':'PayFast is temporarily unavailable. Your cart is saved. Please try again shortly or contact us for assistance.';}
 fetch(reviewApi+'/api/payment-config',{signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():{}).then(config=>{paymentConfig=config;syncPaymentChoice();}).catch(()=>syncPaymentChoice());
 const checkoutSessionKey=testAccess?'rize8-test-checkout-session-v1':'rize8-checkout-session-v1',sessionFields=['customerName','customerEmail','customerPhone','deliveryArea','deliveryStreet','deliveryUnit','deliverySuburb','deliveryCity','deliveryProvince','deliveryPostalCode'];
 try{const saved=JSON.parse(sessionStorage.getItem(checkoutSessionKey)||'null');if(saved&&Date.now()-saved.savedAt<86400000)for(const name of sessionFields)if(typeof saved.values?.[name]==='string')deliveryForm.elements[name].value=saved.values[name];}catch{}
 const saveCheckoutSession=()=>{try{sessionStorage.setItem(checkoutSessionKey,JSON.stringify({savedAt:Date.now(),values:Object.fromEntries(sessionFields.map(name=>[name,deliveryForm.elements[name].value]))}));}catch{}};
 try{const saved=JSON.parse(cartStore.getItem(storageKey)||'null');cart=core.restore(saved,catalogue);if(cart.length&&/^R8-[0-9]{6}-[A-F0-9]{16}$/.test(saved?.reference||''))reference=saved.reference;if(saved?.deliveryMethodId&&!shipping.getMethod(saved.deliveryMethodId).quoteOnly)deliveryMethodId=shipping.getMethod(saved.deliveryMethodId).id;}catch{}
 const snapshot=()=>{if(deliveryMethodId&&!shipping.availability(deliveryMethodId).available){deliveryMethodId=null;reviewedOrder=null;finalConfirmation.checked=false;syncDeliveryFields();}const order=core.calculate(cart,catalogue,deliveryMethodId);return testAccess?core.paymentTest(order):order;};
 const persist=()=>{try{cartStore.setItem(storageKey,JSON.stringify({version:1,items:cart,reference,deliveryMethodId,savedAt:Date.now()}));}catch{dialog.querySelector('.cart-feedback').textContent='Your cart is available while this page remains open. Your browser could not save it for later.';}};
 const badge=()=>{const count=snapshot().quantity;document.querySelectorAll('.cart-count').forEach(el=>{el.textContent=count;el.hidden=count===0;});document.querySelectorAll('.cart-button').forEach(el=>el.setAttribute('aria-label','Shopping Cart ('+count+' '+(count===1?'item':'items')+')'));};
 const invalidateReview=()=>{revision++;reviewedOrder=null;finalConfirmation.checked=false;resetPaymentAttempt();};
 const changed=()=>{invalidateReview();if(!cart.length)reference=null;persist();badge();};
 const show=(view,title)=>{dialog.querySelector('.cart-feedback').textContent='';dialog.querySelectorAll('[data-cart-view]').forEach(section=>section.hidden=section.dataset.cartView!==view);dialog.querySelector('#cartDialogTitle').textContent=title;if(!dialog.open){previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();}dialog.scrollTop=0;dialog.querySelector('#cartDialogTitle').focus();};
 function totalsElement(order){
  const box=document.createElement('div');box.className='cart-total-box';
  const pending=order.delivery?.quoteOnly;
  const rows=[['Products subtotal',core.money(order.subtotalCents)],['Delivery',!order.deliverySelected?'Choose at checkout':pending?'To be confirmed':order.deliveryCents?core.money(order.deliveryCents):'FREE']];
  if(order.storefrontTest)rows.push(['Private test adjustment','−'+core.money(order.testDiscountCents)]);
  rows.push([order.storefrontTest?'TEST PAYMENT TOTAL':!order.deliverySelected?'Before delivery':pending?'Final total':'Total',pending?'To be confirmed':core.money(order.totalCents)]);
  for(const [label,value] of rows){const row=document.createElement('p'),name=document.createElement('span'),price=document.createElement('strong');name.textContent=label;price.textContent=value;row.append(name,price);box.append(row);}
  if(order.storefrontTest){const note=document.createElement('p');note.textContent='R5 payment test only. No merchandise or delivery will be supplied.';box.append(note);}
  return box;
 }
 function drawSummary(target){const order=snapshot();syncDeliveryFees(order.subtotalCents);target.replaceChildren();for(const line of order.lines){const p=document.createElement('p');p.className='checkout-line';p.textContent=line.quantity+' × '+line.product.audience+' '+line.product.name+' · '+line.size+' · '+line.colour+(line.ribbon?' · '+line.ribbon+' ribbon':'')+(line.personalisation?' · '+line.personalisation:'')+' — '+core.money(line.lineCents);target.append(p);}target.append(totalsElement(order));}
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
 function deliveryFeeText(method,subtotalCents){if(!shipping.availability(method.id).available)return 'TEMPORARILY UNAVAILABLE';if(method.quoteOnly)return 'ARRANGE BEFORE CHECKOUT';const fee=shipping.feeForSubtotal(method,subtotalCents);return fee?core.money(fee):method.kind==='collection'?'FREE COLLECTION':'FREE DELIVERY';}
 function syncDeliveryFees(subtotalCents){for(const card of dialog.querySelectorAll('.delivery-option')){const method=shipping.methods.find(method=>method.id===card.querySelector('input').value);card.querySelector('.delivery-fee').textContent=deliveryFeeText(method,subtotalCents);}}
 function syncDeliveryFields(){
  const method=deliveryMethodId?shipping.getMethod(deliveryMethodId):null,addressFields=dialog.querySelector('.door-address-fields'),areaFields=dialog.querySelector('.quote-area-fields');
  addressFields.hidden=method?.kind!=='address';addressFields.querySelectorAll('input,select').forEach(field=>{field.disabled=addressFields.hidden;field.required=!addressFields.hidden&&field.name!=='deliveryUnit';});
  areaFields.hidden=!method?.quoteOnly;deliveryForm.elements.deliveryArea.disabled=areaFields.hidden;deliveryForm.elements.deliveryArea.required=!areaFields.hidden;
  for(const card of dialog.querySelectorAll('.delivery-option')){const input=card.querySelector('input'),status=shipping.availability(input.value);input.disabled=!status.available||shipping.getMethod(input.value).quoteOnly;input.checked=input.value===deliveryMethodId;card.classList.toggle('selected',input.checked);card.classList.toggle('unavailable',!status.available);}
 }
 for(const method of shipping.methods){
  const card=document.createElement('div');card.className='delivery-option';const label=document.createElement('label'),radio=document.createElement('input'),copy=document.createElement('span'),name=document.createElement('strong'),fee=document.createElement('span'),description=document.createElement('small');
  const methodAvailability=shipping.availability(method.id);
  radio.type='radio';radio.name='shippingMethod';radio.value=method.id;radio.required=true;radio.disabled=!methodAvailability.available||method.quoteOnly;radio.checked=deliveryMethodId===method.id;radio.setAttribute('aria-label',method.label);
  name.textContent=method.label;fee.className='delivery-fee';fee.textContent=deliveryFeeText(method,snapshot().subtotalCents);description.textContent=(method.quoteOnly?'Contact RIZE8 Wear to arrange this courier first. Online checkout requires a confirmed delivery fee and location.':method.description)+(!methodAvailability.available?' '+methodAvailability.reason:'');
  copy.append(name,fee,description);label.append(radio,copy);card.append(label);
  if(method.officialUrl){const link=document.createElement('a');link.href=method.officialUrl;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Visit the official '+method.courier+' website';card.append(link);}
  radio.addEventListener('change',()=>{deliveryMethodId=method.id;deliveryForm.elements.shippingTermsAccepted.checked=false;changed();syncDeliveryFields();drawSummary(dialog.querySelector('.checkout-summary'));});dialog.querySelector('.delivery-options').append(card);
 }
 syncDeliveryFields();deliveryForm.addEventListener('input',()=>{invalidateReview();saveCheckoutSession();});deliveryForm.addEventListener('change',()=>{invalidateReview();saveCheckoutSession();});
 dialog.querySelector('.cart-checkout').addEventListener('click',()=>{for(const input of dialog.querySelectorAll('.cart-items input'))if(!input.reportValidity())return;openDelivery();});
 dialog.querySelector('.item-back').addEventListener('click',openCart);
 dialog.querySelectorAll('.change-cart').forEach(button=>button.addEventListener('click',openCart));
 dialog.querySelector('.edit-delivery').addEventListener('click',openDelivery);
 dialog.querySelectorAll('.continue-shopping').forEach(button=>button.addEventListener('click',()=>dialog.close()));
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
 deliveryForm.elements.customerPhone.addEventListener('input',()=>{const field=deliveryForm.elements.customerPhone;field.setCustomValidity(field.value.replace(/\D/g,'').length>=7?'':'Enter a valid contact number with at least seven digits.');});
 const contactDetails=order=>({customerName:order.customer.name,customerEmail:order.customer.email,customerPhone:order.customer.phone});
 function orderPayload(requireConfirmation=false){
  const fields=Object.fromEntries(new FormData(deliveryForm)),customer={name:fields.customerName,email:fields.customerEmail,phone:fields.customerPhone,street:fields.deliveryStreet,unit:fields.deliveryUnit,suburb:fields.deliverySuburb,city:fields.deliveryCity,province:fields.deliveryProvince,postalCode:fields.deliveryPostalCode};
  return {items:cart,reference,...(testAccess?{testKey:testAccess.key}:{}),delivery:{methodId:deliveryMethodId,area:fields.deliveryArea||''},shippingTermsAccepted:deliveryForm.elements.shippingTermsAccepted.checked,deliveryConfirmed:finalConfirmation.checked,requireConfirmation,customer};
 }
 async function requestReview(requireConfirmation=false){
  const response=await fetch(reviewApi+(testAccess?'/api/test-order-review':'/api/order-review'),{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify(orderPayload(requireConfirmation))});
  const result=await response.json();if(!response.ok||!result.order)throw Error(result.error||'Unable to check this order. Please try again.');return result.order;
 }
 function displayReview(order){
  reviewedOrder=order;syncPaymentChoice();finalConfirmation.checked=false;dialog.querySelector('.review-details').textContent=core.orderText(order,contactDetails(order),reference);
  dialog.querySelector('.review-delivery').textContent=['Delivery / collection details',order.delivery.label,...order.delivery.details,order.delivery.quoteOnly?'Delivery fee and final total: to be confirmed before payment.':'Delivery fee: '+(order.deliveryCents?core.money(order.deliveryCents):'FREE')+' · Total: '+core.money(order.totalCents)].join('\n');
  dialog.querySelector('.final-confirmation span').textContent=order.delivery.quoteOnly?shipping.quoteConfirmationText:shipping.confirmationText;
  dialog.querySelector('.review-status').textContent='';show('review',order.delivery.quoteOnly?'Review your quote request':'Review your full order');
 }
 async function reviewOrder(){
  if(reviewBusy)return;if(!cart.length)return openCart();if(!deliveryForm.checkValidity()){openDelivery();deliveryForm.reportValidity();return;}
  reference ||= createOrderReference();persist();const status=dialog.querySelector('.delivery-status'),button=dialog.querySelector('.review-submit'),requestRevision=revision;reviewBusy=true;button.disabled=true;status.textContent='Checking your order and delivery details…';
  try{const order=await requestReview(false);if(!dialog.open||revision!==requestRevision){status.textContent='Your order changed. Please review it again.';return;}displayReview(order);status.textContent='';}catch(error){status.textContent=error.name==='TimeoutError'?'The order check timed out. Please try again.':error.message||'Unable to check this order. Please try again.';}finally{reviewBusy=false;button.disabled=false;}
 }
 deliveryForm.addEventListener('submit',event=>{event.preventDefault();reviewOrder();});
 async function placeOrder(){
  if(reviewBusy)return;if(!cart.length)return openCart();if(!deliveryForm.checkValidity()){openDelivery();deliveryForm.reportValidity();return;}if(!finalConfirmation.reportValidity())return;
  const notice=dialog.querySelector('.review-status'),button=payfastButton,requestRevision=revision;reviewBusy=true;button.disabled=true;payfastButton.disabled=true;notice.textContent='Checking the final details…';
  try{const order=await requestReview(true);if(!dialog.open||revision!==requestRevision)return;if(!reviewedOrder||JSON.stringify(order)!==JSON.stringify(reviewedOrder)){displayReview(order);notice.textContent='Your order details or prices changed. Please review and confirm them again.';return;}
   {
    if(order.delivery.quoteOnly||!paymentConfig.enabled)throw Error('Choose a confirmed delivery option before payment.');
    const payload=orderPayload(true),fingerprint=JSON.stringify({...payload,requireConfirmation:true});
    if(!paymentAttempt||paymentAttempt.fingerprint!==fingerprint){paymentAttempt={fingerprint,token:Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join(''),savedAt:Date.now()};try{sessionStorage.setItem(attemptKey,JSON.stringify(paymentAttempt));}catch{}}
    notice.textContent='Preparing your secure PayFast payment…';
    const response=await fetch(reviewApi+(testAccess?'/api/test-checkout':'/api/checkout'),{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),body:JSON.stringify({...payload,attemptToken:paymentAttempt.token,expectedTotalCents:order.totalCents})});
    const result=await response.json();if(!response.ok)throw Error(result.error||'PayFast could not start. Your cart is saved; please try again shortly.');
    if(!dialog.open||revision!==requestRevision)return;
    if(!['https://www.payfast.co.za/eng/process','https://sandbox.payfast.co.za/eng/process'].includes(result.action)||result.totalCents!==order.totalCents||result.fields?.amount!==(order.totalCents/100).toFixed(2))throw Error('Payment details changed. Please review your order again.');
    paymentAttempt.statusToken=result.token;sessionStorage.setItem(attemptKey,JSON.stringify(paymentAttempt));
    const form=document.createElement('form');form.method='POST';form.action=result.action;
    for(const [name,value] of Object.entries(result.fields)){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=String(value);form.append(input);}
    document.body.append(form);persist();saveCheckoutSession();notice.textContent='Opening secure PayFast checkout. Your cart is saved if you return.';form.submit();return;
   }

  }catch(error){notice.textContent=error.name==='TimeoutError'?'The order check timed out. Please try again.':error.message||'Unable to check this order. Please try again.';}finally{reviewBusy=false;button.disabled=false;payfastButton.disabled=false;}
 }
 payfastButton.addEventListener('click',()=>placeOrder());
 document.querySelectorAll('.cart-button').forEach(button=>{button.type='button';button.addEventListener('click',openCart);});
 for(const {info,product} of cards){const button=document.createElement('button');button.type='button';button.className='order-size';button.textContent=product.cancer?'Choose T-shirt, size & ribbon':'Choose size & add to cart';button.setAttribute('aria-label',button.textContent+' for '+product.name);button.addEventListener('click',()=>openItem(product));info.append(button);}
 badge();
 const returnParams=new URLSearchParams(location.search);
 if(returnParams.has('resume_order'))openCart();
 if(returnParams.has('payment_return')){
  const orderId=returnParams.get('order'),secret=paymentAttempt?.statusToken||paymentAttempt?.token;
  if(secret)fetch(reviewApi+'/api/order-status?order='+encodeURIComponent(orderId)+'&token='+encodeURIComponent(secret),{signal:AbortSignal.timeout(10000)}).then(r=>r.ok?r.json():null).then(result=>{if(result?.status==='paid'){const expected=JSON.parse(paymentAttempt.fingerprint);if(JSON.stringify(cart)===JSON.stringify(expected.items)&&reference===expected.reference){cart=[];reference=null;}resetPaymentAttempt();persist();badge();dialog.querySelector('.cart-feedback').textContent='Your payment is confirmed. Thank you!';}else openCart();}).catch(()=>openCart());
  history.replaceState(null,'',location.pathname+location.hash);
 }
});
