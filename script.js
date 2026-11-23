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
// Each new order gets an independent reference; no customer details are encoded.
function createOrderReference(){
 const dateParts=new Intl.DateTimeFormat('en-ZA',{timeZone:'Africa/Johannesburg',year:'2-digit',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
 const day=['year','month','day'].map(type=>dateParts.find(part=>part.type===type).value).join('');
 const bytes=crypto.getRandomValues(new Uint8Array(8));
 const suffix=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('').toUpperCase();
 return 'R8-'+day+'-'+suffix;
}
const orderChannel='whatsapp'; // PayFast integration retained for later activation.
let payfastReady=false;
(orderChannel==='payfast'?fetch(paymentService+'/api/payment-config'):Promise.resolve({ok:false})).then(r=>r.ok?r.json():{}).then(config=>{payfastReady=config.enabled===true;}).catch(()=>{});
const orderEmailConfig = { publicAddress: 'sales@rize8wear.co.za', enabled: true };
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
