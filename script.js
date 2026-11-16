// Navigation, search, and collection controls.
document.addEventListener('DOMContentLoaded', () => {
 const nav=document.getElementById('mainNav'), menu=document.getElementById('mobileMenuBtn');
 menu?.setAttribute('aria-expanded','false');
 menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
 nav?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menu?.setAttribute('aria-expanded','false');}));
 const search=document.getElementById('searchPanel');
 document.getElementById('searchBtn')?.addEventListener('click',()=>search.classList.add('active'));
 document.getElementById('closeSearch')?.addEventListener('click',()=>search.classList.remove('active'));
 search?.addEventListener('click',e=>{if(e.target===search)search.classList.remove('active');});
 const year=document.getElementById('currentYear');if(year)year.textContent=new Date().getFullYear();
 const redirects={'christianCatalog':'menCatalog','lifestyleCatalog':'menCatalog','men-christian':'menCatalog','men-lifestyle':'menCatalog','womenChristianCatalog':'womenCatalog','womenLifestyleCatalog':'womenCatalog','women-christian':'womenCatalog','women-lifestyle':'womenCatalog'};
 function syncCollection(){const old=location.hash.slice(1);if(redirects[old]){history.replaceState(null,'','#'+redirects[old]);}document.body.style.overflow=/^#(men|women)Catalog$/.test(location.hash)?'hidden':'';}
 window.addEventListener('hashchange',syncCollection);syncCollection();
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){search?.classList.remove('active');if(!document.querySelector('dialog[open]')&&/^#(men|women)Catalog$/.test(location.hash))location.hash=location.hash==='#menCatalog'?'men-clothing':'women-clothing';}});
});
// Open an uncropped product photo for a closer look at the design.
document.addEventListener('DOMContentLoaded', () => {
  const viewer = document.createElement('dialog');
  viewer.className = 'product-viewer';
  viewer.setAttribute('aria-label', 'Full product image');
  viewer.innerHTML = '<button type="button" class="viewer-close" aria-label="Close image">&times;</button><img alt=""><p></p>';
  document.body.append(viewer);
  const photo = viewer.querySelector('img');
  const caption = viewer.querySelector('p');
  let previousOverflow = '';
  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => { document.body.style.overflow = previousOverflow; });
  document.querySelectorAll('.product-image img').forEach(img => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'product-enlarge';
    trigger.setAttribute('aria-label', 'Enlarge ' + img.alt);
    const hint = document.createElement('span');
    hint.className = 'enlarge-hint';
    hint.textContent = 'View full design';
    img.parentNode.insertBefore(trigger, img);
    trigger.append(img, hint);
    trigger.addEventListener('click', () => {
      photo.src = img.currentSrc || img.src;
      photo.alt = img.alt;
      caption.textContent = img.closest('.product-card')?.querySelector('h4')?.textContent || img.alt;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      viewer.showModal();
    });
  });
});
// Orders use the verified sales forwarding address.
const cancerRibbonOptions = [["Yellow","As shown on the men's T-shirt"],["Pink","Breast cancer"],["Gold","Childhood cancer"],["White or Pearl","Lung cancer"],["Purple","Pancreatic cancer"],["Teal","Ovarian cancer"],["Orange","Leukemia and kidney cancer"],["Lime Green","Non-Hodgkin lymphoma"],["Dark Blue","Colorectal (colon/rectal) cancer"],["Light Blue","Prostate cancer"],["Gray","Brain cancer"],["Black","Skin cancer / Melanoma"]];
const paymentService='https://rize8wear-preview.grey-haven-7361.chatgpt.site';
let payfastReady=false;
fetch(paymentService+'/api/payment-config').then(r=>r.ok?r.json():{}).then(config=>{payfastReady=config.enabled===true;}).catch(()=>{});
const orderEmailConfig = { publicAddress: 'sales@rize8wear.co.za', enabled: true };
document.addEventListener('DOMContentLoaded', () => {
 const dialog=document.createElement('dialog');dialog.className='size-order-dialog';
 dialog.setAttribute('aria-labelledby','sizeOrderTitle');
 dialog.innerHTML='<button type="button" class="viewer-close" aria-label="Close order">&times;</button><h2 id="sizeOrderTitle">Order my size</h2><p class="order-product"></p><form class="size-order-form"><label for="orderSize">Size</label><select id="orderSize" name="size" required><option value="">Choose your size</option><optgroup label="Adults"><option>S</option><option>M</option><option>L</option><option>XL</option><option>2XL</option></optgroup><optgroup label="Kids"><option>2–3 yrs</option><option>3–4 yrs</option><option>4–5 yrs</option><option>5–6 yrs</option><option>7–8 yrs</option><option>9–10 yrs</option><option>11–12 yrs</option></optgroup><optgroup label="Toddlers &amp; Babies"><option>Newborn (0–1 Month)</option><option>0–3 Months</option><option>3–6 Months</option><option>6–9 Months</option><option>6–12 Months</option><option>12–18 Months</option><option>18–24 Months</option></optgroup></select><label for="orderColor">Color</label><select id="orderColor" name="color" required><option value="">Choose a color</option><option>Red</option><option>Black</option><option>White</option></select><div class="order-ribbon-fields" hidden><label for="orderRibbon">Ribbon print</label><select id="orderRibbon" name="ribbon" disabled></select></div><label for="orderQuantity">Quantity</label><input id="orderQuantity" name="quantity" type="number" min="1" max="99" step="1" value="1" required><fieldset class="delivery-details"><legend>Your details &amp; delivery address</legend><p class="order-help">All fields marked * are required. Please enter your complete, correct delivery address. <a href="privacy.html" target="_blank" rel="noopener noreferrer">How we use your details — Privacy Policy</a></p><label for="customerName">Full name *</label><input id="customerName" name="customerName" autocomplete="name" required minlength="2" maxlength="120" pattern=".*\\S.*"><label for="customerEmail">Email address *</label><input id="customerEmail" name="customerEmail" type="email" autocomplete="email" required maxlength="254"><label for="customerPhone">Contact number *</label><input id="customerPhone" name="customerPhone" type="tel" autocomplete="tel" required minlength="7" maxlength="25" title="Enter your contact number, including area or country code."><label for="deliveryStreet">Street address *</label><input id="deliveryStreet" name="deliveryStreet" autocomplete="address-line1" placeholder="House number and street name" required maxlength="200" pattern=".*\\S.*"><label for="deliveryUnit">Apartment, complex or unit (optional)</label><input id="deliveryUnit" name="deliveryUnit" autocomplete="address-line2" maxlength="120"><label for="deliverySuburb">Suburb *</label><input id="deliverySuburb" name="deliverySuburb" autocomplete="address-level3" required maxlength="100" pattern=".*\\S.*"><label for="deliveryCity">Town / city *</label><input id="deliveryCity" name="deliveryCity" autocomplete="address-level2" required maxlength="100" pattern=".*\\S.*"><label for="deliveryProvince">Province *</label><select id="deliveryProvince" name="deliveryProvince" autocomplete="address-level1" required><option value="">Choose your province</option><option>Eastern Cape</option><option>Free State</option><option>Gauteng</option><option>KwaZulu-Natal</option><option>Limpopo</option><option>Mpumalanga</option><option>North West</option><option>Northern Cape</option><option>Western Cape</option></select><label for="deliveryPostalCode">Postal code *</label><input id="deliveryPostalCode" name="deliveryPostalCode" autocomplete="postal-code" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required title="Enter a four-digit South African postal code."><label class="address-confirmation" for="deliveryConfirmed"><input id="deliveryConfirmed" name="deliveryConfirmed" type="checkbox" required> I confirm that my delivery address is complete and correct. *</label></fieldset><p class="order-total" aria-live="polite"></p><button class="order-now" type="submit">PLACE ORDER</button><p class="order-status" role="status"></p><p class="order-help">We will confirm stock, delivery and payment details before you pay.</p></form>';
 dialog.insertAdjacentHTML('beforeend','<section class="order-review" hidden aria-labelledby="orderReviewTitle"><h3 id="orderReviewTitle">Review your order</h3><p class="review-details"></p><p class="review-status order-status" role="status"></p><button type="button" class="order-edit">Back &amp; edit order</button><button type="button" class="order-now order-confirm">PLACE ORDER</button><p class="order-help">Check your size, colour, delivery address and total before continuing. Your email app will open so you can send the order. Payment details will be confirmed by RIZE8 Wear.</p></section>');
 document.body.append(dialog);
 const form=dialog.querySelector('form'),size=form.elements.size,color=form.elements.color,quantity=form.elements.quantity,total=dialog.querySelector('.order-total'),submit=dialog.querySelector('.order-now'),status=dialog.querySelector('.order-status');
 const ribbon=form.elements.ribbon,ribbonFields=dialog.querySelector('.order-ribbon-fields');
 ribbon.replaceChildren(...cancerRibbonOptions.map(([name,cause])=>new Option(name+' — '+cause,name)));
 let product=null,previousOverflow='',reviewing=false;
 const review=dialog.querySelector('.order-review');
 const editOrder=()=>{dialog.querySelector('.review-status').textContent='';dialog.querySelector('.order-confirm').disabled=false;reviewing=false;review.hidden=true;form.hidden=false;dialog.querySelector('#sizeOrderTitle').textContent=product?.cancer?'Choose your cancer T-shirt':'Order my size';};
 dialog.querySelector('.order-edit').addEventListener('click',editOrder);
 dialog.querySelector('.order-confirm').addEventListener('click',()=>form.requestSubmit());
 const unitPrice=()=>product.bulkPrice&&Number(quantity.value)>=(product.bulkMinimum||2)?product.bulkPrice:product.price;
 const refresh=()=>{const valid=!!size.value&&!!color.value&&(!product?.cancer||!!ribbon.value)&&quantity.validity.valid,unit=product?unitPrice():0;submit.hidden=false;total.textContent=valid?'Subtotal: R'+(unit*Number(quantity.value))+' (R'+unit+' each) + R90 delivery. Total: R'+(unit*Number(quantity.value)+90):'';status.textContent='';};
 form.addEventListener('input',refresh);form.addEventListener('change',refresh);
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
 form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;
 const unit=unitPrice();
 const details=Object.fromEntries(new FormData(form));
 if(!reviewing){
 const lines=[product.audience+' '+product.name,'Size: '+size.value,'Colour: '+color.value,...(product.cancer?['Ribbon colour: '+ribbon.selectedOptions[0].textContent]:[]),'Quantity: '+quantity.value,'Price per shirt: R'+unit,'Subtotal: R'+(unit*Number(quantity.value)),'Nationwide delivery: R90','TOTAL: R'+(unit*Number(quantity.value)+90),'','Full name: '+details.customerName.trim(),'Email: '+details.customerEmail.trim(),'Contact number: '+details.customerPhone.trim(),'','Deliver to:',details.deliveryStreet.trim(),...(details.deliveryUnit.trim()?[details.deliveryUnit.trim()]:[]),details.deliverySuburb.trim(),details.deliveryCity.trim(),details.deliveryProvince,details.deliveryPostalCode,'South Africa'];
 dialog.querySelector('.review-details').textContent=lines.join('\n');form.hidden=true;review.hidden=false;reviewing=true;dialog.querySelector('#sizeOrderTitle').textContent='Review your order';dialog.scrollTop=0;dialog.querySelector('.order-edit').focus();return;
 }
 if(payfastReady){
 const confirm=dialog.querySelector('.order-confirm'),notice=dialog.querySelector('.review-status');
 confirm.disabled=true;notice.textContent='Opening secure PayFast payment…';
 const draft={productId:product.id,values:Object.fromEntries(new FormData(form))};
 try{
 sessionStorage.setItem('rize8-payment-draft',JSON.stringify(draft));
 const response=await fetch(paymentService+'/api/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,size:size.value,colour:color.value,ribbon:ribbon.value,quantity:Number(quantity.value),addressConfirmed:form.elements.deliveryConfirmed.checked,customer:{name:details.customerName,email:details.customerEmail,phone:details.customerPhone,street:details.deliveryStreet,unit:details.deliveryUnit,suburb:details.deliverySuburb,city:details.deliveryCity,province:details.deliveryProvince,postalCode:details.deliveryPostalCode}})});
 const payment=await response.json();if(!response.ok)throw Error(payment.error||'Unable to start payment.');
 if(payment.totalCents!==(unit*Number(quantity.value)+90)*100)throw Error('The price has changed. Please go back and review your order.');
 if(!['https://www.payfast.co.za/eng/process','https://sandbox.payfast.co.za/eng/process'].includes(payment.action))throw Error('Invalid payment destination.');
 const paymentForm=document.createElement('form');paymentForm.method='POST';paymentForm.action=payment.action;
 for(const [key,value] of Object.entries(payment.fields)){const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;paymentForm.append(input);}document.body.append(paymentForm);paymentForm.submit();
 }catch(error){notice.textContent=error.message||'Payment could not be opened. Please try again.';confirm.disabled=false;}
 return;
 }
 const message=['Hello RIZE8 Wear,',"I'd like to order:",product.audience+' '+product.name,'Size: '+size.value,'Color: '+color.value,...(product.cancer?['Ribbon print: '+ribbon.selectedOptions[0].textContent]:[]),'Quantity: '+quantity.value,'Unit price: R'+unit+(product.bulkPrice&&Number(quantity.value)>=(product.bulkMinimum||2)?' (multi-shirt price)':''),'Subtotal: R'+(unit*Number(quantity.value)),'Nationwide delivery: R90','Total: R'+(unit*Number(quantity.value)+90),'','Customer details:','Full name: '+details.customerName.trim(),'Email: '+details.customerEmail.trim(),'Contact number: '+details.customerPhone.trim(),'','Delivery address:',details.deliveryStreet.trim(),...(details.deliveryUnit.trim()?[details.deliveryUnit.trim()]:[]),details.deliverySuburb.trim(),details.deliveryCity.trim(),details.deliveryProvince,details.deliveryPostalCode,'South Africa','Customer confirmed the delivery address is correct.','','Please confirm stock and payment details.'].join('\n');
 if(!orderEmailConfig.enabled){status.textContent='Your selection: '+size.value+' × '+quantity.value+'. Email ordering is being set up. Your order has not been sent.';return;}
 status.textContent='Opening your email app. Send the prepared email to place your order.';
 window.location.href='mailto:'+orderEmailConfig.publicAddress+'?subject='+encodeURIComponent('RIZE8 order: '+product.name)+'&body='+encodeURIComponent(message);
 });
 document.querySelectorAll('.product-card').forEach(card=>{
 const info=card.querySelector('.product-info'),name=card.querySelector('h4')?.textContent.trim(),price=Number(card.dataset.price||card.querySelector('.launch-prices strong')?.textContent.replace(/[^0-9.]/g,'')||card.querySelector('.christmas-price')?.textContent.match(/R(\d+)/)?.[1]),bulkPrice=Number(card.dataset.bulkPrice)||0;if(!info||!name||!price)return;
 const button=document.createElement('button');button.type='button';button.className='order-size';button.textContent=card.hasAttribute('data-cancer')?'Choose T-shirt, size & ribbon':'Order my size';button.setAttribute('aria-label',button.textContent+' for '+name);
 button.addEventListener('click',()=>{product={id:card.dataset.productId,name,price,bulkPrice,bulkMinimum:Number(card.dataset.bulkMinimum)||2,audience:card.closest('[data-audience]')?.dataset.audience||'Christmas',cancer:card.hasAttribute('data-cancer')};dialog.querySelector('.order-product').textContent=product.audience+' '+name;form.reset();editOrder();color.replaceChildren(new Option(product.cancer?'Choose white or black':'Choose a color',''),...(product.cancer?['White','Black']:(product.audience==='Christmas'?['Red','Black','White']:['Red','Black','White','Green'])).map(value=>new Option(value,value)));dialog.querySelector('label[for="orderColor"]').textContent=product.cancer?'T-shirt colour':'Color';dialog.querySelector('label[for="orderRibbon"]').textContent='Ribbon colour';dialog.querySelector('#sizeOrderTitle').textContent=product.cancer?'Choose your cancer T-shirt':'Order my size';ribbonFields.hidden=!product.cancer;ribbon.disabled=!product.cancer;ribbon.required=product.cancer;ribbon.value=card.dataset.ribbon||'Yellow';refresh();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.querySelector('.order-review .order-help').textContent=payfastReady?'Check all details before placing your order. You will continue to secure PayFast payment. Your order is confirmed only after payment succeeds.':'Check your size, colour, delivery address and total before continuing. Your email app will open so you can send the order. Payment details will be confirmed by RIZE8 Wear.';dialog.showModal();});info.append(button);
 });
 if(new URLSearchParams(location.search).has('resume_order')){try{const draft=JSON.parse(sessionStorage.getItem('rize8-payment-draft')||'null');const card=Array.from(document.querySelectorAll('[data-product-id]')).find(card=>card.dataset.productId===draft?.productId);if(card){card.querySelector('.order-size')?.click();for(const [name,value] of Object.entries(draft.values)){const field=form.elements.namedItem(name);if(field&&!field.disabled){if(field.type==='checkbox')field.checked=value==='on';else field.value=value;}}refresh();}}catch{}}
});

// Each collection has an independent chart dialog, copied from the original guide.
document.addEventListener('DOMContentLoaded',()=>{
 document.querySelectorAll('.collection-size-chart').forEach(chart=>{
  let previousOverflow='';
  chart.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
  chart.querySelector('.chart-close').addEventListener('click',()=>chart.close());
  chart.addEventListener('click',event=>{if(event.target===chart)chart.close();});
  document.querySelectorAll('[data-size-chart="'+chart.id+'"]').forEach(trigger=>trigger.addEventListener('click',event=>{event.preventDefault();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';chart.showModal();}));
 });
});
