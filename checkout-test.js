// Capture the private test link before analytics loads. The key stays out of
// page URLs, referrers and normal customers' carts.
(()=>{
 const match=location.hash.match(/^#checkout-test=([a-f0-9]{64})$/),storageKey='rize8-checkout-test-access';
 let access=null;
 try{
  if(match){access={key:match[1],savedAt:Date.now()};sessionStorage.setItem(storageKey,JSON.stringify(access));history.replaceState(null,'',location.pathname+'?checkout_test=1#christmas-clothing');}
  else if(new URLSearchParams(location.search).has('checkout_test'))access=JSON.parse(sessionStorage.getItem(storageKey)||'null');
 }catch{if(match)access={key:match[1],savedAt:Date.now()};}
 if(access&&/^[a-f0-9]{64}$/.test(access.key)&&Date.now()-access.savedAt<86400000)window.Rize8CheckoutTest=access;
})();
