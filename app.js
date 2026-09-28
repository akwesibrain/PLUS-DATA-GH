// Light/dark theme toggle
  const SUN_PATH = '<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
  const MOON_PATH = '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';

  const heroVideo = document.querySelector('.hero-video video');
  if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    heroVideo.pause();
    heroVideo.removeAttribute('autoplay');
  }

  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');

  function applyTheme(theme){
    if (theme === 'light'){
      document.documentElement.setAttribute('data-theme', 'light');
      themeIcon.innerHTML = MOON_PATH;
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeIcon.innerHTML = SUN_PATH;
    }
  }
  const savedTheme = localStorage.getItem('pd-theme') || 'dark';
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('pd-theme', next);
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.querySelector('nav.primary');
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.style.display === 'flex';
    nav.style.display = isOpen ? 'none' : 'flex';
    nav.style.cssText += 'flex-direction:column; position:absolute; top:100%; left:0; right:0; background:var(--paper-raised); padding:20px 24px; border-bottom:1px solid var(--line); gap:16px;';
  });

  const netColors = { mtn:'var(--mtn)', telecel:'var(--telecel)', at:'var(--at)' };

  // Ticker — random Ghana deliveries
  const GH_NETS = [
    { key:'mtn', name:'MTN', prefixes:['024','054','055','059'] },
    { key:'telecel', name:'Telecel', prefixes:['020','050'] },
    { key:'at', name:'AirtelTigo', prefixes:['027','057','026','056'] },
  ];
  const GH_SIZES = [1,2,3,4,5,6,8,10,12,15,20,25,30];
  function randInt(min, max){ return min + Math.floor(Math.random() * (max - min + 1)); }
  function maskedMomo(prefixes){
    const pre = prefixes[randInt(0, prefixes.length - 1)];
    return pre + '****' + String(randInt(100, 999));
  }
  function minsLabel(n){ return n === 1 ? '1 min' : n + ' mins'; }
  const tickerItems = Array.from({length: 14}, () => {
    const net = GH_NETS[randInt(0, GH_NETS.length - 1)];
    const size = GH_SIZES[randInt(0, GH_SIZES.length - 1)];
    return {
      net: net.key,
      text: size + 'GB ' + net.name + ' sent to ' + maskedMomo(net.prefixes) + ' ' + minsLabel(randInt(1, 18)),
    };
  });
  const track = document.getElementById('tickerTrack');
  if (track){
    const itemsHTML = tickerItems.map(t =>
      '<div class="ticker-item"><span class="net-dot" style="background:' + netColors[t.net] + '"></span>' + t.text + '</div>'
    ).join('');
    track.innerHTML = itemsHTML + itemsHTML;
  }

  // Buy Data modal — pricing shown for reference; connect live rates before launch
  const BUY_BUNDLES = {
    mtn: {
      label: 'MTN', tagStyle: 'single',
      plans: [
        { size:'1GB', price:'4.40' }, { size:'2GB', price:'8.50' },
        { size:'3GB', price:'12.80' }, { size:'4GB', price:'17.80' },
        { size:'5GB', price:'24.00' }, { size:'6GB', price:'28.00' },
        { size:'7GB', price:'30.00' }, { size:'8GB', price:'36.00' },
        { size:'10GB', price:'42.50' }, { size:'15GB', price:'69.44' },
        { size:'20GB', price:'89.82' }, { size:'25GB', price:'112.90' },
        { size:'30GB', price:'138.88' }, { size:'40GB', price:'178.08' },
        { size:'50GB', price:'195.00' }, { size:'100GB', price:'375.00' },
      ]
    },
    telecel: {
      label: 'Telecel Ghana', tagStyle: 'stats',
      plans: [
        { size:'10GB', price:'39.00' }, { size:'15GB', price:'55.00' },
        { size:'20GB', price:'75.00' }, { size:'25GB', price:'99.00' },
        { size:'30GB', price:'115.00' }, { size:'40GB', price:'150.01' },
        { size:'50GB', price:'212.80' },
      ]
    },
    at: {
      label: 'AirtelTigo', tagStyle: 'stats',
      plans: [
        { size:'3GB', price:'13.44' }, { size:'4GB', price:'17.70' },
        { size:'5GB', price:'22.23' }, { size:'6GB', price:'26.31' },
        { size:'7GB', price:'30.24' }, { size:'8GB', price:'34.26' },
        { size:'9GB', price:'38.30' },
      ]
    }
  };

  const buyModal = document.getElementById('buyModal');
  const buyCloseBtn = document.getElementById('buyCloseBtn');
  const buyNetTabs = document.getElementById('buyNetTabs');
  const buyBundleGrid = document.getElementById('buyBundleGrid');

  let activeNet = 'mtn';

  function renderBuyBundles(net){
    const data = BUY_BUNDLES[net];
    buyBundleGrid.className = 'buy-bundle-grid ' + net;
    buyBundleGrid.innerHTML = data.plans.map((p, i) => `
      <div class="buy-bundle-card" data-net="${net}" data-index="${i}">
        <div class="top-row">
          <span class="buy-bundle-pill">${data.label}</span>
          <span class="buy-bundle-chev">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </div>
        <div class="buy-bundle-size">${p.size}</div>
        <div class="buy-bundle-label">${data.label} Bundle</div>
        <div class="buy-bundle-divider"></div>
        <div class="buy-bundle-bottom">
          <div class="buy-bundle-price">GH₵${p.price}</div>
          ${data.tagStyle === 'single'
            ? `<div class="buy-bundle-tag">Non-expiry</div>`
            : `<div class="buy-bundle-stats"><small>Rollover: Yes</small><small>Duration: Non-expiry</small></div>`
          }
        </div>
      </div>
    `).join('');
  }

  function selectBuyCard(net, index){
    document.querySelectorAll('.buy-bundle-card').forEach(c => c.classList.remove('selected'));
    const card = buyBundleGrid.querySelector(`.buy-bundle-card[data-index="${index}"]`);
    if (card) card.classList.add('selected');
  }

  buyBundleGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.buy-bundle-card');
    if (!card) return;
    const net = card.dataset.net;
    const index = Number(card.dataset.index);
    selectBuyCard(net, index);
    // Tapping any package opens the dynamic checkout modal immediately,
    // pre-filled with that exact network/size/price — see openCheckoutModal().
    openCheckoutModal(net, index);
  });

  buyNetTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.buy-net-tab');
    if (!tab) return;
    document.querySelectorAll('.buy-net-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeNet = tab.dataset.net;
    renderBuyBundles(activeNet);
  });

  function openBuyModal(net){
    if (net && BUY_BUNDLES[net]){
      activeNet = net;
      document.querySelectorAll('.buy-net-tab').forEach(t => t.classList.toggle('active', t.dataset.net === net));
    }
    renderBuyBundles(activeNet);
    buyModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeBuyModal(){
    buyModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.buy-trigger').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openBuyModal(trigger.dataset.net);
    });
  });
  buyCloseBtn.addEventListener('click', closeBuyModal);
  document.getElementById('buyTrackLink').addEventListener('click', (e) => {
    e.preventDefault();
    closeBuyModal();
    document.getElementById('top').scrollIntoView();
    setTimeout(() => document.querySelector('footer#track').scrollIntoView({behavior:'smooth'}), 50);
  });

  // ---------------------------------------------------------------------
  // Dynamic network checkout modal
  //
  // One reusable component whose content (network branding, data size,
  // price, fee, total) is fully driven by whichever package the customer
  // selected. Never hard-code a network/size/price in here — everything
  // is read from BUY_BUNDLES, the single source of truth for pricing that
  // already powers the bundle grid above.
  // ---------------------------------------------------------------------

  // Display name + WhatsApp label per network. Colors/theme for each
  // network live in CSS under .checkout-modal[data-network="..."].
  // `prefixes` are the number prefixes (after the leading 0) accepted for each network.
  // MTN list confirmed by you; Telecel/AirtelTigo taken from the ticker data above -
  // double-check them before launch.
  const NETWORK_UI = {
    mtn: { display: 'MTN NETWORK', name: 'MTN', prefixes: ['024', '025', '053', '054', '055', '059'] },
    telecel: { display: 'TELECEL', name: 'Telecel', prefixes: ['020', '050'] },
    at: { display: 'AIRTELTIGO', name: 'AirtelTigo', prefixes: ['026', '027', '056', '057'] },
  };

  // Ghana has number portability, so a customer may keep an MTN-style prefix on
  // another network (or the reverse). Set to false to only check that the number
  // is a valid 10-digit Ghana number, without matching it to the network.
  const STRICT_NETWORK_PREFIX = true;

  // Placeholder transaction/service fee until this is wired to a live
  // rate from the backend. Reproduces the reference design's example
  // (MTN 1GB: GH₵4.40 + GH₵0.13 fee) at a flat 3% of the package price.
  const FEE_RATE = 0.03;
  function computeFee(price) {
    return Math.round(price * FEE_RATE * 100) / 100;
  }

  // Demo-only promo codes (client-side). Swap for a real backend/API
  // lookup before launch — do not treat these as production discounts.
  const PROMO_CODES = { SAVE5: 0.05, PLUS10: 0.10 };

  function formatGHS(n) {
    return 'GH₵' + n.toFixed(2);
  }

  const checkoutModal = document.getElementById('checkoutModal');
  const checkoutCloseBtn = document.getElementById('checkoutCloseBtn');
  const checkoutNetName = document.getElementById('checkoutNetName');
  const checkoutSize = document.getElementById('checkoutSize');
  const checkoutPrice = document.getElementById('checkoutPrice');
  const checkoutFee = document.getElementById('checkoutFee');
  const checkoutPhone = document.getElementById('checkoutPhone');
  const checkoutPhoneError = document.getElementById('checkoutPhoneError');
  const checkoutPromoToggle = document.getElementById('checkoutPromoToggle');
  const checkoutPromoPanel = document.getElementById('checkoutPromoPanel');
  const checkoutPromoInput = document.getElementById('checkoutPromoInput');
  const checkoutPromoApply = document.getElementById('checkoutPromoApply');
  const checkoutPromoMsg = document.getElementById('checkoutPromoMsg');
  const checkoutLockToggle = document.getElementById('checkoutLockToggle');
  const checkoutPayBtn = document.getElementById('checkoutPayBtn');
  const checkoutPayLabel = document.getElementById('checkoutPayLabel');

  // Current selection driving the modal. Always fully replaced by
  // openCheckoutModal() — never mutated in place — so switching network
  // or package can never leave stale data on screen.
  let checkoutState = null; // { net, size, price }
  let appliedPromo = null; // { code, discount } | null

  function currentTotal() {
    if (!checkoutState) return { fee: 0, total: 0, discountAmt: 0 };
    const fee = computeFee(checkoutState.price);
    let total = Math.round((checkoutState.price + fee) * 100) / 100;
    let discountAmt = 0;
    if (appliedPromo) {
      discountAmt = Math.round(total * appliedPromo.discount * 100) / 100;
      total = Math.round((total - discountAmt) * 100) / 100;
    }
    return { fee, total, discountAmt };
  }

  function renderCheckoutTotals() {
    if (!checkoutState) return;
    const { fee, total, discountAmt } = currentTotal();
    checkoutPrice.textContent = formatGHS(checkoutState.price);
    checkoutFee.textContent =
      `+${formatGHS(fee)} fee` +
      (appliedPromo ? ` · −${formatGHS(discountAmt)} (${appliedPromo.code})` : '');
    checkoutPayLabel.textContent = `PAY ${formatGHS(total)} & DELIVER`;
  }

  function openCheckoutModal(net, index) {
    const netData = BUY_BUNDLES[net];
    const plan = netData && netData.plans[index];
    if (!plan) return;

    checkoutState = { net, size: plan.size, price: parseFloat(plan.price) };
    appliedPromo = null;

    checkoutPromoInput.value = '';
    checkoutPromoMsg.textContent = '';
    checkoutPromoMsg.className = 'checkout-promo-msg';
    checkoutPromoPanel.classList.remove('show');
    checkoutPhone.value = '';
    checkoutPhoneError.classList.remove('show');

    checkoutModal.dataset.network = net;
    checkoutNetName.textContent = NETWORK_UI[net].display;
    checkoutSize.textContent = plan.size;
    renderCheckoutTotals();

    checkoutModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCheckoutModal() {
    checkoutModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
  });

  checkoutPromoToggle.addEventListener('click', () => {
    checkoutPromoPanel.classList.toggle('show');
  });

  checkoutPromoApply.addEventListener('click', () => {
    const code = checkoutPromoInput.value.trim().toUpperCase();
    if (!code) {
      appliedPromo = null;
      checkoutPromoMsg.textContent = 'Enter a code to apply.';
      checkoutPromoMsg.className = 'checkout-promo-msg error';
      renderCheckoutTotals();
      return;
    }
    if (Object.prototype.hasOwnProperty.call(PROMO_CODES, code)) {
      appliedPromo = { code, discount: PROMO_CODES[code] };
      checkoutPromoMsg.textContent = `Promo "${code}" applied.`;
      checkoutPromoMsg.className = 'checkout-promo-msg success';
    } else {
      appliedPromo = null;
      checkoutPromoMsg.textContent = 'Invalid promo code.';
      checkoutPromoMsg.className = 'checkout-promo-msg error';
    }
    renderCheckoutTotals();
  });

  // Turns "+233 24 123 4567", "233241234567" or "024 123 4567" into "0241234567".
  function normalizePhone(v) {
    let d = v.replace(/[\s\-()]/g, '');
    if (d.startsWith('+233')) d = '0' + d.slice(4);
    else if (d.startsWith('233') && d.length === 12) d = '0' + d.slice(3);
    return d;
  }

  // Valid = 10 digits starting with 0 and, when STRICT_NETWORK_PREFIX is on,
  // starting with one of the selected network's prefixes (e.g. MTN: 024, 054...).
  function isValidGhanaNumber(v, net) {
    const d = normalizePhone(v);
    if (!/^0\d{9}$/.test(d)) return false;
    if (!STRICT_NETWORK_PREFIX || !net) return true;
    return NETWORK_UI[net].prefixes.includes(d.slice(0, 3));
  }

  checkoutPhone.addEventListener('input', () => {
    checkoutPhoneError.classList.remove('show');
  });

  checkoutPayBtn.addEventListener('click', () => {
    if (!checkoutState) return;
    if (!isValidGhanaNumber(checkoutPhone.value, checkoutState.net)) {
      const ui = NETWORK_UI[checkoutState.net];
      checkoutPhoneError.textContent = STRICT_NETWORK_PREFIX
        ? `Enter a valid ${ui.name} number starting with ${ui.prefixes.join(', ')}`
        : 'Enter a valid Ghana mobile number (e.g. 024XXXXXXX)';
      checkoutPhoneError.classList.add('show');
      checkoutPhone.focus();
      return;
    }
    const { fee, total } = currentTotal();
    const netLabel = BUY_BUNDLES[checkoutState.net].label;
    const promoPart = appliedPromo ? `, promo ${appliedPromo.code} applied` : '';
    const msg = encodeURIComponent(
      `Hi Plus Data, I'd like to buy ${checkoutState.size} ${netLabel} for ` +
        `${formatGHS(checkoutState.price)} (+${formatGHS(fee)} fee${promoPart}) = ${formatGHS(total)}. ` +
        `Recipient: ${normalizePhone(checkoutPhone.value)}. ` +
        `Lock-screen alert: ${checkoutLockToggle.checked ? 'On' : 'Off'}.`
    );
    window.open(`https://wa.me/233000000000?text=${msg}`, '_blank');
  });

  // Chatbot widget
  const chatbotToggle = document.getElementById('chatbotToggle');
  const chatbotPanel = document.getElementById('chatbotPanel');
  const chatbotClose = document.getElementById('chatbotClose');
  const chatbotBody = document.getElementById('chatbotBody') || document.querySelector('.chatbot-body');
  const chatbotInput = document.getElementById('chatbotInput');
  const chatbotSend = document.getElementById('chatbotSend');

  function openChatbot(){
    chatbotPanel.classList.add('open');
    chatbotToggle.setAttribute('aria-expanded', 'true');
  }
  function closeChatbot(){
    chatbotPanel.classList.remove('open');
    chatbotToggle.setAttribute('aria-expanded', 'false');
  }
  chatbotToggle.addEventListener('click', () => {
    chatbotPanel.classList.contains('open') ? closeChatbot() : openChatbot();
  });
  chatbotClose.addEventListener('click', closeChatbot);

  function addBubble(text, fromUser){
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';
    bubble.textContent = text;
    if (fromUser){
      bubble.style.alignSelf = 'flex-end';
      bubble.style.background = 'var(--gold)';
      bubble.style.color = 'var(--ink)';
      bubble.style.borderRadius = '14px 14px 4px 14px';
    }
    chatbotBody.appendChild(bubble);
    chatbotBody.scrollTop = chatbotBody.scrollHeight;
  }

  function sendMessage(){
    const text = chatbotInput.value.trim();
    if (!text) return;
    addBubble(text, true);
    chatbotInput.value = '';
    setTimeout(() => {
      addBubble("Thanks! This demo chat isn't wired to a live agent yet — for a real answer, tap WhatsApp Channel below and our team will help.", false);
    }, 500);
  }
  chatbotSend.addEventListener('click', sendMessage);
  chatbotInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });