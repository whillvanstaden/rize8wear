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
const orderEmailConfig = { publicAddress: 'sales@rize8wear.co.za', enabled: true };
document.addEventListener('DOMContentLoaded', () => {
 const dialog=document.createElement('dialog');dialog.className='size-order-dialog';
 dialog.setAttribute('aria-labelledby','sizeOrderTitle');
 dialog.innerHTML='<button type="button" class="viewer-close" aria-label="Close order">&times;</button><h2 id="sizeOrderTitle">Order my size</h2><p class="order-product"></p><form class="size-order-form"><label for="orderSize">Size</label><select id="orderSize" name="size" required><option value="">Choose your size</option><optgroup label="Adults"><option>S</option><option>M</option><option>L</option><option>XL</option><option>2XL</option></optgroup><optgroup label="Kids"><option>2–3 yrs</option><option>3–4 yrs</option><option>4–5 yrs</option><option>5–6 yrs</option><option>7–8 yrs</option><option>9–10 yrs</option><option>11–12 yrs</option></optgroup><optgroup label="Toddlers &amp; Babies"><option>Newborn (0–1 Month)</option><option>0–3 Months</option><option>3–6 Months</option><option>6–9 Months</option><option>6–12 Months</option><option>12–18 Months</option><option>18–24 Months</option></optgroup></select><label for="orderColor">Color</label><select id="orderColor" name="color" required><option value="">Choose a color</option><option>Red</option><option>Black</option><option>White</option><option>Green</option></select><div class="order-ribbon-fields" hidden><label for="orderRibbon">Ribbon print</label><select id="orderRibbon" name="ribbon" disabled></select></div><label for="orderQuantity">Quantity</label><input id="orderQuantity" name="quantity" type="number" min="1" max="99" step="1" value="1" required><p class="order-total" aria-live="polite"></p><button class="order-now" type="submit" hidden>Order now</button><p class="order-status" role="status"></p><p class="order-help">We will confirm stock, delivery and payment details before you pay.</p></form>';
 document.body.append(dialog);
 const form=dialog.querySelector('form'),size=form.elements.size,color=form.elements.color,quantity=form.elements.quantity,total=dialog.querySelector('.order-total'),submit=dialog.querySelector('.order-now'),status=dialog.querySelector('.order-status');
 const ribbon=form.elements.ribbon,ribbonFields=dialog.querySelector('.order-ribbon-fields');
 ribbon.replaceChildren(...cancerRibbonOptions.map(([name,cause])=>new Option(name+' — '+cause,name)));
 let product=null,previousOverflow='';
 const unitPrice=()=>product.bulkPrice&&Number(quantity.value)>=2?product.bulkPrice:product.price;
 const refresh=()=>{const valid=!!size.value&&!!color.value&&(!product?.cancer||!!ribbon.value)&&quantity.validity.valid,unit=product?unitPrice():0;submit.hidden=!valid;total.textContent=valid?'Subtotal: R'+(unit*Number(quantity.value))+' (R'+unit+' each; delivery excluded)':'';status.textContent='';};
 form.addEventListener('input',refresh);form.addEventListener('change',refresh);
 dialog.querySelector('.viewer-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow;});
 form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;
 const unit=unitPrice();
 const message=['Hello RIZE8 Wear,',"I'd like to order:",product.audience+' '+product.name,'Size: '+size.value,'Color: '+color.value,...(product.cancer?['Ribbon print: '+ribbon.selectedOptions[0].textContent]:[]),'Quantity: '+quantity.value,'Unit price: R'+unit+(Number(quantity.value)>=2?' (multi-shirt price)':''),'Subtotal: R'+(unit*Number(quantity.value)),'Please confirm stock, delivery cost and payment details.'].join('\n');
 if(!orderEmailConfig.enabled){status.textContent='Your selection: '+size.value+' × '+quantity.value+'. Email ordering is being set up. Your order has not been sent.';return;}
 status.textContent='Opening your email app. Send the prepared email to place your order.';
 window.location.href='mailto:'+orderEmailConfig.publicAddress+'?subject='+encodeURIComponent('RIZE8 order: '+product.name)+'&body='+encodeURIComponent(message);
 });
 document.querySelectorAll('.product-card').forEach(card=>{
 const info=card.querySelector('.product-info'),name=card.querySelector('h4')?.textContent.trim(),price=Number(card.querySelector('.launch-prices strong')?.textContent.replace(/[^0-9.]/g,'')||card.querySelector('.christmas-price')?.textContent.match(/R(\d+)/)?.[1]),bulkPrice=Number(card.dataset.bulkPrice)||0;if(!info||!name||!price)return;
 const button=document.createElement('button');button.type='button';button.className='order-size';button.textContent='Order my size';button.setAttribute('aria-label','Order my size for '+name);
 button.addEventListener('click',()=>{product={name,price,bulkPrice,audience:card.closest('[data-audience]')?.dataset.audience||'Christmas',cancer:card.hasAttribute('data-cancer')};dialog.querySelector('.order-product').textContent=product.audience+' '+name;form.reset();ribbonFields.hidden=!product.cancer;ribbon.disabled=!product.cancer;ribbon.required=product.cancer;ribbon.value=card.dataset.ribbon||'Yellow';refresh();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();});info.append(button);
 });
});
