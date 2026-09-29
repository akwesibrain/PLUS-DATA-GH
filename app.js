// ================================================================
// PLUS DATA GHANA — MAIN FRONTEND JAVASCRIPT
// ================================================================


// ================================================================
// LIGHT / DARK THEME TOGGLE
// ================================================================

const SUN_PATH =
  '<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/>' +
  '<path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';

const MOON_PATH =
  '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';


// ================================================================
// HERO VIDEO — RESPECT REDUCED MOTION
// ================================================================

const heroVideo = document.querySelector('.hero-video video');

if (
  heroVideo &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  heroVideo.pause();
  heroVideo.removeAttribute('autoplay');
}


// ================================================================
// THEME
// ================================================================

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  if (!themeIcon) {
    return;
  }

  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeIcon.innerHTML = MOON_PATH;
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeIcon.innerHTML = SUN_PATH;
  }
}

const savedTheme = localStorage.getItem('pd-theme') || 'dark';

applyTheme(savedTheme);

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const next =
      document.documentElement.getAttribute('data-theme') === 'light'
        ? 'dark'
        : 'light';

    applyTheme(next);
    localStorage.setItem('pd-theme', next);
  });
}


// ================================================================
// MOBILE MENU
// ================================================================

const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('nav.primary');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.style.display === 'flex';

    nav.style.display = isOpen ? 'none' : 'flex';

    nav.style.cssText +=
      'flex-direction:column;' +
      'position:absolute;' +
      'top:100%;' +
      'left:0;' +
      'right:0;' +
      'background:var(--paper-raised);' +
      'padding:20px 24px;' +
      'border-bottom:1px solid var(--line);' +
      'gap:16px;';
  });
}


// ================================================================
// NETWORK COLOURS
// ================================================================

const netColors = {
  mtn: 'var(--mtn)',
  telecel: 'var(--telecel)',
  at: 'var(--at)'
};


// ================================================================
// PURCHASE TICKER
// ================================================================

const GH_NETS = [
  {
    key: 'mtn',
    name: 'MTN',
    prefixes: ['024', '054', '055', '059']
  },
  {
    key: 'telecel',
    name: 'Telecel',
    prefixes: ['020', '050']
  },
  {
    key: 'at',
    name: 'AirtelTigo',
    prefixes: ['027', '057', '026', '056']
  }
];

const GH_SIZES = [
  1,
  2,
  3,
  4,
  5,
  6,
  8,
  10,
  12,
  15,
  20,
  25,
  30
];

function randInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function maskedMomo(prefixes) {
  const pre =
    prefixes[randInt(0, prefixes.length - 1)];

  return (
    pre +
    '****' +
    String(randInt(100, 999))
  );
}

function minsLabel(n) {
  return n === 1 ? '1 min' : n + ' mins';
}

const tickerItems = Array.from(
  { length: 14 },
  () => {
    const net =
      GH_NETS[
        randInt(0, GH_NETS.length - 1)
      ];

    const size =
      GH_SIZES[
        randInt(0, GH_SIZES.length - 1)
      ];

    return {
      net: net.key,
      text:
        size +
        'GB ' +
        net.name +
        ' sent to ' +
        maskedMomo(net.prefixes) +
        ' ' +
        minsLabel(randInt(1, 18))
    };
  }
);

const track =
  document.getElementById('tickerTrack');

if (track) {
  const itemsHTML = tickerItems
    .map(
      (t) =>
        '<div class="ticker-item">' +
        '<span class="net-dot" style="background:' +
        netColors[t.net] +
        '"></span>' +
        t.text +
        '</div>'
    )
    .join('');

  track.innerHTML =
    itemsHTML + itemsHTML;
}


// ================================================================
// SUPABASE CONNECTION
// ================================================================

const SUPABASE_URL =
  'https://plbtnltcocsuekifddat.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_gwgxy9az6GagMy-0K_HoMw_FVcsVSVW';

let supabaseClient = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {
  supabaseClient =
    window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY
    );
} else {
  console.error(
    'Plus Data: Supabase library was not loaded. Make sure index.html loads @supabase/supabase-js before app.js.'
  );
}


// ================================================================
// BUY DATA MODAL
// ================================================================

const BUY_BUNDLES = {
  mtn: {
    label: 'MTN',
    tagStyle: 'single',
    plans: []
  },

  telecel: {
    label: 'Telecel Ghana',
    tagStyle: 'stats',
    plans: []
  },

  at: {
    label: 'AirtelTigo',
    tagStyle: 'stats',
    plans: []
  }
};


// ================================================================
// SUPABASE NETWORK MAPPING
// ================================================================

const NETWORK_KEY = {
  MTN: 'mtn',
  TELECEL: 'telecel',
  'TELECEL GHANA': 'telecel',
  AIRTELTIGO: 'at',
  'AIRTEL TIGO': 'at',
  'AIRTEL-TIGO': 'at'
};

let packagesLoaded = false;
let packagesLoading = false;


// ================================================================
// BUY DATA DOM
// ================================================================

const buyModal =
  document.getElementById('buyModal');

const buyCloseBtn =
  document.getElementById('buyCloseBtn');

const buyNetTabs =
  document.getElementById('buyNetTabs');

const buyBundleGrid =
  document.getElementById('buyBundleGrid');

let activeNet = 'mtn';


// ================================================================
// LOAD PACKAGES FROM SUPABASE
// ================================================================

async function loadPackagesFromSupabase() {
  if (packagesLoaded) {
    return true;
  }

  if (packagesLoading) {
    return false;
  }

  if (!supabaseClient) {
    console.error(
      'Plus Data: Cannot load packages because Supabase is unavailable.'
    );

    return false;
  }

  packagesLoading = true;

  try {
    const {
      data,
      error
    } = await supabaseClient
      .from('data_packages')
      .select(
        'id, network, package_name, data_amount, price, status'
      )
      .eq('status', 'active')
      .order('id', {
        ascending: true
      });

    if (error) {
      console.error(
        'Plus Data: Supabase package loading failed:',
        error
      );

      return false;
    }

    BUY_BUNDLES.mtn.plans = [];
    BUY_BUNDLES.telecel.plans = [];
    BUY_BUNDLES.at.plans = [];

    for (const row of data || []) {
      const networkName =
        String(row.network || '')
          .trim()
          .toUpperCase();

      const networkKey =
        NETWORK_KEY[networkName];

      if (!networkKey) {
        console.warn(
          'Plus Data: Unknown network:',
          row.network
        );

        continue;
      }

      const numericPrice =
        Number(row.price);

      if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
      ) {
        console.warn(
          'Plus Data: Invalid package price:',
          row
        );

        continue;
      }

      BUY_BUNDLES[networkKey].plans.push({
        id: row.id,

        packageId: row.id,

        packageName:
          String(
            row.package_name || ''
          ).trim(),

        size:
          String(
            row.data_amount || ''
          ).trim(),

        price:
          numericPrice.toFixed(2)
      });
    }

    packagesLoaded = true;

    console.log(
      'Plus Data: Packages successfully loaded from Supabase.',
      BUY_BUNDLES
    );

    if (
      buyModal &&
      buyModal.classList.contains('open')
    ) {
      renderBuyBundles(activeNet);
    }

    return true;
  } catch (error) {
    console.error(
      'Plus Data: Unexpected package loading error:',
      error
    );

    return false;
  } finally {
    packagesLoading = false;
  }
}


// ================================================================
// RENDER BUY BUNDLES
// ================================================================

function renderBuyBundles(net) {
  if (!buyBundleGrid) {
    return;
  }

  const data =
    BUY_BUNDLES[net];

  if (!data) {
    console.error(
      'Plus Data: Unknown package network:',
      net
    );

    return;
  }

  buyBundleGrid.className =
    'buy-bundle-grid ' + net;

  if (!data.plans.length) {
    buyBundleGrid.innerHTML = `
      <div class="buy-bundle-empty">
        <p>No active packages are available for this network right now.</p>
      </div>
    `;

    return;
  }

  buyBundleGrid.innerHTML =
    data.plans
      .map(
        (p, i) => `
          <div
            class="buy-bundle-card"
            data-net="${net}"
            data-index="${i}"
          >
            <div class="top-row">
              <span class="buy-bundle-pill">
                ${data.label}
              </span>

              <span class="buy-bundle-chev">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>

            <div class="buy-bundle-size">
              ${p.size}
            </div>

            <div class="buy-bundle-label">
              ${data.label} Bundle
            </div>

            <div class="buy-bundle-divider"></div>

            <div class="buy-bundle-bottom">
              <div class="buy-bundle-price">
                GH₵${p.price}
              </div>

              ${
                data.tagStyle === 'single'
                  ? `
                    <div class="buy-bundle-tag">
                      Non-expiry
                    </div>
                  `
                  : `
                    <div class="buy-bundle-stats">
                      <small>Rollover: Yes</small>
                      <small>Duration: Non-expiry</small>
                    </div>
                  `
              }
            </div>
          </div>
        `
      )
      .join('');
}


// ================================================================
// SELECT BUY CARD
// ================================================================

function selectBuyCard(net, index) {
  if (!buyBundleGrid) {
    return;
  }

  buyBundleGrid
    .querySelectorAll('.buy-bundle-card')
    .forEach((card) => {
      card.classList.remove('selected');
    });

  const card =
    buyBundleGrid.querySelector(
      `.buy-bundle-card[data-net="${net}"][data-index="${index}"]`
    );

  if (card) {
    card.classList.add('selected');
  }
}


// ================================================================
// OPEN CHECKOUT
// ================================================================

function openCheckoutModal(net, index) {
  const netData =
    BUY_BUNDLES[net];

  const plan =
    netData &&
    netData.plans[index];

  if (!plan) {
    console.error(
      'Plus Data: Selected package could not be found.'
    );

    return;
  }

  checkoutState = {
    net,
    size: plan.size,
    price: parseFloat(plan.price),
    packageId:
      plan.packageId ||
      plan.id ||
      null,
    packageName:
      plan.packageName ||
      plan.size
  };

  if (checkoutPhone) {
    checkoutPhone.value = '';
  }

  if (checkoutEmail) {
    checkoutEmail.value = '';
  }

  if (checkoutPhoneError) {
    checkoutPhoneError.classList.remove('show');
  }

  if (!checkoutModal) {
    return;
  }

  checkoutModal.dataset.network = net;

  if (checkoutNetName) {
    checkoutNetName.textContent =
      NETWORK_UI[net].display;
  }

  if (checkoutSize) {
    checkoutSize.textContent =
      plan.size;
  }

  renderCheckoutTotals();

  checkoutModal.classList.add('open');

  document.body.style.overflow =
    'hidden';
}


// ================================================================
// BUY BUNDLE CLICK
// ================================================================

if (buyBundleGrid) {
  buyBundleGrid.addEventListener(
    'click',
    (e) => {
      const card =
        e.target.closest(
          '.buy-bundle-card'
        );

      if (!card) {
        return;
      }

      const net =
        card.dataset.net;

      const index =
        Number(card.dataset.index);

      selectBuyCard(
        net,
        index
      );

      openCheckoutModal(
        net,
        index
      );
    }
  );
}


// ================================================================
// NETWORK TABS
// ================================================================

if (buyNetTabs) {
  buyNetTabs.addEventListener(
    'click',
    (e) => {
      const tab =
        e.target.closest(
          '.buy-net-tab'
        );

      if (!tab) {
        return;
      }

      document
        .querySelectorAll(
          '.buy-net-tab'
        )
        .forEach((t) => {
          t.classList.remove(
            'active'
          );
        });

      tab.classList.add(
        'active'
      );

      activeNet =
        tab.dataset.net;

      if (packagesLoaded) {
        renderBuyBundles(
          activeNet
        );
      }
    }
  );
}


// ================================================================
// OPEN BUY MODAL
// ================================================================

function openBuyModal(net) {
  if (
    net &&
    BUY_BUNDLES[net]
  ) {
    activeNet = net;

    document
      .querySelectorAll(
        '.buy-net-tab'
      )
      .forEach((tab) => {
        tab.classList.toggle(
          'active',
          tab.dataset.net === net
        );
      });
  }

  if (buyModal) {
    buyModal.classList.add(
      'open'
    );

    document.body.style.overflow =
      'hidden';
  }

  if (packagesLoaded) {
    renderBuyBundles(
      activeNet
    );

    return;
  }

  if (buyBundleGrid) {
    buyBundleGrid.innerHTML = `
      <div class="buy-bundle-loading">
        <p>Loading data packages...</p>
      </div>
    `;
  }

  loadPackagesFromSupabase().then(
    (success) => {
      if (success) {
        renderBuyBundles(
          activeNet
        );

        return;
      }

      if (buyBundleGrid) {
        buyBundleGrid.innerHTML = `
          <div class="buy-bundle-error">
            <p>We couldn't load the packages right now.</p>

            <button
              type="button"
              id="retryPackagesBtn"
            >
              Try Again
            </button>
          </div>
        `;

        const retryBtn =
          document.getElementById(
            'retryPackagesBtn'
          );

        if (retryBtn) {
          retryBtn.addEventListener(
            'click',
            () => {
              packagesLoaded = false;
              openBuyModal(
                activeNet
              );
            }
          );
        }
      }
    }
  );
}


// ================================================================
// CLOSE BUY MODAL
// ================================================================

function closeBuyModal() {
  if (buyModal) {
    buyModal.classList.remove(
      'open'
    );
  }

  document.body.style.overflow =
    '';
}


// ================================================================
// BUY TRIGGERS
// ================================================================

document
  .querySelectorAll(
    '.buy-trigger'
  )
  .forEach((trigger) => {
    trigger.addEventListener(
      'click',
      (e) => {
        e.preventDefault();

        openBuyModal(
          trigger.dataset.net
        );
      }
    );
  });

if (buyCloseBtn) {
  buyCloseBtn.addEventListener(
    'click',
    closeBuyModal
  );
}


// ================================================================
// BUY TRACK LINK
// ================================================================

const buyTrackLink =
  document.getElementById(
    'buyTrackLink'
  );

if (buyTrackLink) {
  buyTrackLink.addEventListener(
    'click',
    (e) => {
      e.preventDefault();

      closeBuyModal();

      const top =
        document.getElementById(
          'top'
        );

      const footerTrack =
        document.querySelector(
          'footer#track'
        );

      if (top) {
        top.scrollIntoView();
      }

      setTimeout(() => {
        if (footerTrack) {
          footerTrack.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, 50);
    }
  );
}


// ================================================================
// DYNAMIC NETWORK CHECKOUT
// ================================================================

const NETWORK_UI = {
  mtn: {
    display: 'MTN NETWORK',
    name: 'MTN',
    prefixes: [
      '024',
      '025',
      '053',
      '054',
      '055',
      '059'
    ]
  },

  telecel: {
    display: 'TELECEL',
    name: 'Telecel',
    prefixes: [
      '020',
      '050'
    ]
  },

  at: {
    display: 'AIRTELTIGO',
    name: 'AirtelTigo',
    prefixes: [
      '026',
      '027',
      '056',
      '057'
    ]
  }
};


// ================================================================
// NETWORK PHONE VALIDATION
// ================================================================

const STRICT_NETWORK_PREFIX = true;


// ================================================================
// CHECKOUT HELPERS
// ================================================================

function formatGHS(n) {
  return (
    'GH₵' +
    Number(n).toFixed(2)
  );
}


// ================================================================
// CHECKOUT DOM
// ================================================================

const checkoutModal =
  document.getElementById(
    'checkoutModal'
  );

const checkoutCloseBtn =
  document.getElementById(
    'checkoutCloseBtn'
  );

const checkoutNetName =
  document.getElementById(
    'checkoutNetName'
  );

const checkoutSize =
  document.getElementById(
    'checkoutSize'
  );

const checkoutPrice =
  document.getElementById(
    'checkoutPrice'
  );

const checkoutFee =
  document.getElementById(
    'checkoutFee'
  );

const checkoutPhone =
  document.getElementById(
    'checkoutPhone'
  );

const checkoutEmail =
  document.getElementById(
    'checkoutEmail'
  );

const checkoutPhoneError =
  document.getElementById(
    'checkoutPhoneError'
  );

const checkoutPromoToggle =
  document.getElementById(
    'checkoutPromoToggle'
  );

const checkoutPromoPanel =
  document.getElementById(
    'checkoutPromoPanel'
  );

const checkoutPromoInput =
  document.getElementById(
    'checkoutPromoInput'
  );

const checkoutPromoApply =
  document.getElementById(
    'checkoutPromoApply'
  );

const checkoutPromoMsg =
  document.getElementById(
    'checkoutPromoMsg'
  );

const checkoutLockToggle =
  document.getElementById(
    'checkoutLockToggle'
  );

const checkoutPayBtn =
  document.getElementById(
    'checkoutPayBtn'
  );

const checkoutPayLabel =
  document.getElementById(
    'checkoutPayLabel'
  );

let checkoutState = null;


// ================================================================
// CHECKOUT TOTAL
// ================================================================
//
// Plus Data does NOT add a processing fee.
//
// The package price is sent to Paystack.
// Paystack handles the approved customer fee.
//
// ================================================================

function currentTotal() {
  if (!checkoutState) {
    return {
      fee: 0,
      total: 0,
      discountAmt: 0
    };
  }

  return {
    fee: 0,
    total: checkoutState.price,
    discountAmt: 0
  };
}


// ================================================================
// RENDER CHECKOUT TOTALS
// ================================================================

function renderCheckoutTotals() {
  if (!checkoutState) {
    return;
  }

  const {
    total
  } = currentTotal();

  if (checkoutPrice) {
    checkoutPrice.textContent =
      formatGHS(
        checkoutState.price
      );
  }

  if (checkoutFee) {
    checkoutFee.textContent =
      'Paystack fee applied at checkout';
  }

  if (checkoutPayLabel) {
    checkoutPayLabel.textContent =
      `PAY ${formatGHS(total)} & DELIVER`;
  }
}


// ================================================================
// CLOSE CHECKOUT MODAL
// ================================================================

function closeCheckoutModal() {
  if (checkoutModal) {
    checkoutModal.classList.remove(
      'open'
    );
  }

  document.body.style.overflow =
    '';
}


// ================================================================
// CHECKOUT CLOSE BUTTON
// ================================================================

if (checkoutCloseBtn) {
  checkoutCloseBtn.addEventListener(
    'click',
    closeCheckoutModal
  );
}


// ================================================================
// CLICK OUTSIDE CHECKOUT MODAL
// ================================================================

if (checkoutModal) {
  checkoutModal.addEventListener(
    'click',
    (e) => {
      if (
        e.target ===
        checkoutModal
      ) {
        closeCheckoutModal();
      }
    }
  );
}


// ================================================================
// PROMO UI
// ================================================================

if (checkoutPromoToggle) {
  checkoutPromoToggle.style.display =
    'none';
}

if (checkoutPromoPanel) {
  checkoutPromoPanel.classList.remove(
    'show'
  );
}


// ================================================================
// NORMALIZE GHANA PHONE NUMBER
// ================================================================

function normalizePhone(value) {
  let d =
    String(value || '')
      .replace(/[\s\-()]/g, '');

  if (d.startsWith('+233')) {
    d =
      '0' +
      d.slice(4);
  } else if (
    d.startsWith('233') &&
    d.length === 12
  ) {
    d =
      '0' +
      d.slice(3);
  }

  return d;
}


// ================================================================
// VALIDATE GHANA PHONE NUMBER
// ================================================================

function isValidGhanaNumber(
  value,
  net
) {
  const d =
    normalizePhone(value);

  if (!/^0\d{9}$/.test(d)) {
    return false;
  }

  if (
    !STRICT_NETWORK_PREFIX ||
    !net
  ) {
    return true;
  }

  return NETWORK_UI[net]
    .prefixes
    .includes(
      d.slice(0, 3)
    );
}


// ================================================================
// PHONE ERROR CLEAR
// ================================================================

if (
  checkoutPhone &&
  checkoutPhoneError
) {
  checkoutPhone.addEventListener(
    'input',
    () => {
      checkoutPhoneError.classList.remove(
        'show'
      );
    }
  );
}


// ================================================================
// EMAIL VALIDATION
// ================================================================

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    String(value || '').trim()
  );
}

if (checkoutEmail) {
  checkoutEmail.addEventListener(
    'input',
    () => {
      checkoutEmail.setCustomValidity(
        ''
      );
    }
  );
}


// ================================================================
// LIVE PAYSTACK CHECKOUT
// ================================================================

if (checkoutPayBtn) {
  checkoutPayBtn.addEventListener(
    'click',
    async () => {
      if (
        !checkoutState ||
        !supabaseClient
      ) {
        return;
      }

      // ----------------------------------------------------------
      // VALIDATE PHONE
      // ----------------------------------------------------------

      if (
        !checkoutPhone ||
        !isValidGhanaNumber(
          checkoutPhone.value,
          checkoutState.net
        )
      ) {
        const ui =
          NETWORK_UI[
            checkoutState.net
          ];

        if (checkoutPhoneError) {
          checkoutPhoneError.textContent =
            STRICT_NETWORK_PREFIX
              ? `Enter a valid ${ui.name} number starting with ${ui.prefixes.join(', ')}`
              : 'Enter a valid Ghana mobile number (e.g. 024XXXXXXX)';

          checkoutPhoneError.classList.add(
            'show'
          );
        }

        if (checkoutPhone) {
          checkoutPhone.focus();
        }

        return;
      }

      // ----------------------------------------------------------
      // VALIDATE EMAIL
      // ----------------------------------------------------------

      const email =
        checkoutEmail
          ? checkoutEmail.value
              .trim()
              .toLowerCase()
          : '';

      if (!isValidEmail(email)) {
        alert(
          'Please enter a valid email address for your Paystack receipt.'
        );

        if (checkoutEmail) {
          checkoutEmail.focus();
        }

        return;
      }

      // ----------------------------------------------------------
      // DISABLE BUTTON
      // ----------------------------------------------------------

      checkoutPayBtn.disabled =
        true;

      const originalLabel =
        checkoutPayLabel
          ? checkoutPayLabel.textContent
          : '';

      if (checkoutPayLabel) {
        checkoutPayLabel.textContent =
          'STARTING SECURE PAYMENT...';
      }

      // ----------------------------------------------------------
      // START PAYSTACK CHECKOUT
      // ----------------------------------------------------------

      try {
        const response =
          await fetch(
            `${SUPABASE_URL}/functions/v1/paystack-initialize`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                apikey:
                  SUPABASE_PUBLISHABLE_KEY
              },

              body: JSON.stringify({
                package_id:
                  checkoutState.packageId,

                customer_phone:
                  normalizePhone(
                    checkoutPhone.value
                  ),

                customer_email:
                  email
              })
            }
          );

        let result = null;

        try {
          result =
            await response.json();
        } catch {
          result = null;
        }

        if (
          !response.ok ||
          !result ||
          !result.success ||
          !result.authorization_url
        ) {
          throw new Error(
            result?.error ||
              'Unable to start Paystack checkout.'
          );
        }

        // --------------------------------------------------------
        // STORE PAYMENT REFERENCE
        // --------------------------------------------------------

        if (result.reference) {
          sessionStorage.setItem(
            'plusdata_paystack_reference',
            result.reference
          );
        }

        if (result.order_id) {
          sessionStorage.setItem(
            'plusdata_order_id',
            result.order_id
          );
        }

        // --------------------------------------------------------
        // CLOSE MODAL
        // --------------------------------------------------------

        closeCheckoutModal();

        // --------------------------------------------------------
        // REDIRECT TO PAYSTACK
        // --------------------------------------------------------

        window.location.href =
          result.authorization_url;
      } catch (error) {
        console.error(
          'Plus Data: Paystack initialization failed:',
          error
        );

        alert(
          error?.message ||
            'We could not start the payment. Please try again.'
        );

        checkoutPayBtn.disabled =
          false;

        if (checkoutPayLabel) {
          checkoutPayLabel.textContent =
            originalLabel ||
            'PAY & DELIVER';
        }

        return;
      }

      checkoutPayBtn.disabled =
        false;
    }
  );
}


// ================================================================
// PAYSTACK CALLBACK / VERIFICATION
// ================================================================

async function handlePaystackCallback() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const reference =
    params.get('reference');

  if (!reference) {
    return;
  }

  try {
    const response =
      await fetch(
        `${SUPABASE_URL}/functions/v1/paystack-verify`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            apikey:
              SUPABASE_PUBLISHABLE_KEY
          },

          body: JSON.stringify({
            reference
          })
        }
      );

    let result = null;

    try {
      result =
        await response.json();
    } catch {
      result = null;
    }

    if (
      response.ok &&
      result &&
      result.verified &&
      result.payment_status ===
        'success'
    ) {
      sessionStorage.removeItem(
        'plusdata_paystack_reference'
      );

      sessionStorage.removeItem(
        'plusdata_order_id'
      );

      alert(
        'Payment confirmed successfully. Your Plus Data order is now being processed.'
      );
    } else {
      alert(
        result?.message ||
          result?.error ||
          'Payment could not be confirmed yet. Please contact Plus Data support with your payment reference.'
      );
    }
  } catch (error) {
    console.error(
      'Plus Data: Paystack callback verification failed:',
      error
    );

    alert(
      'We could not confirm the payment automatically. Please contact Plus Data support with your payment reference.'
    );
  } finally {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}


// ================================================================
// CHATBOT WIDGET
// ================================================================

const chatbotToggle =
  document.getElementById(
    'chatbotToggle'
  );

const chatbotPanel =
  document.getElementById(
    'chatbotPanel'
  );

const chatbotClose =
  document.getElementById(
    'chatbotClose'
  );

const chatbotBody =
  document.getElementById(
    'chatbotBody'
  ) ||
  document.querySelector(
    '.chatbot-body'
  );

const chatbotInput =
  document.getElementById(
    'chatbotInput'
  );

const chatbotSend =
  document.getElementById(
    'chatbotSend'
  );


// ================================================================
// CHATBOT STATE
// ================================================================

let chatbotBusy = false;

const CHATBOT_FUNCTION_URL =
  `${SUPABASE_URL}/functions/v1/ai-assistant`;


// ================================================================
// CHATBOT OPEN / CLOSE
// ================================================================

function openChatbot() {
  if (!chatbotPanel) {
    return;
  }

  chatbotPanel.classList.add(
    'open'
  );

  if (chatbotToggle) {
    chatbotToggle.setAttribute(
      'aria-expanded',
      'true'
    );
  }

  setTimeout(() => {
    if (chatbotInput) {
      chatbotInput.focus();
    }
  }, 100);
}

function closeChatbot() {
  if (!chatbotPanel) {
    return;
  }

  chatbotPanel.classList.remove(
    'open'
  );

  if (chatbotToggle) {
    chatbotToggle.setAttribute(
      'aria-expanded',
      'false'
    );
  }
}

if (chatbotToggle) {
  chatbotToggle.addEventListener(
    'click',
    () => {
      if (!chatbotPanel) {
        return;
      }

      if (
        chatbotPanel.classList.contains(
          'open'
        )
      ) {
        closeChatbot();
      } else {
        openChatbot();
      }
    }
  );
}

if (chatbotClose) {
  chatbotClose.addEventListener(
    'click',
    closeChatbot
  );
}


// ================================================================
// CHATBOT MESSAGE BUBBLE
// ================================================================

function addBubble(
  text,
  fromUser = false
) {
  if (!chatbotBody) {
    return null;
  }

  const bubble =
    document.createElement(
      'div'
    );

  bubble.className =
    'chatbot-bubble';

  bubble.textContent =
    String(text || '');

  if (fromUser) {
    bubble.style.alignSelf =
      'flex-end';

    bubble.style.background =
      'var(--gold)';

    bubble.style.color =
      'var(--ink)';

    bubble.style.borderRadius =
      '14px 14px 4px 14px';
  }

  chatbotBody.appendChild(
    bubble
  );

  chatbotBody.scrollTop =
    chatbotBody.scrollHeight;

  return bubble;
}


// ================================================================
// CHATBOT TYPING INDICATOR
// ================================================================

function addTypingBubble() {
  if (!chatbotBody) {
    return null;
  }

  const bubble =
    document.createElement(
      'div'
    );

  bubble.className =
    'chatbot-bubble chatbot-typing';

  bubble.textContent =
    'Thinking...';

  chatbotBody.appendChild(
    bubble
  );

  chatbotBody.scrollTop =
    chatbotBody.scrollHeight;

  return bubble;
}


// ================================================================
// REMOVE TYPING INDICATOR
// ================================================================

function removeTypingBubble(
  bubble
) {
  if (
    bubble &&
    bubble.parentNode
  ) {
    bubble.parentNode.removeChild(
      bubble
    );
  }
}


// ================================================================
// BUILD AI PACKAGE CONTEXT
// ================================================================

function getAssistantPackageContext() {
  return Object.entries(
    BUY_BUNDLES
  ).map(
    ([networkKey, network]) => ({
      network:
        network.label,

      packages:
        network.plans.map(
          (plan) => ({
            id: plan.id,
            package_name:
              plan.packageName,
            data_amount:
              plan.size,
            price:
              plan.price
          })
        )
    })
  );
}


// ================================================================
// SEND MESSAGE TO AI ASSISTANT
// ================================================================

async function askAI(message) {
  const response =
    await fetch(
      CHATBOT_FUNCTION_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          apikey:
            SUPABASE_PUBLISHABLE_KEY
        },

        body: JSON.stringify({
          message,

          context: {
            business:
              'Plus Data Ghana',

            packages:
              getAssistantPackageContext()
          }
        })
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    throw new Error(
      result?.error ||
        'The AI assistant could not respond right now.'
    );
  }

  // The deployed Edge Function returns:
  // { reply: "..." }

  if (
    !result ||
    typeof result.reply !==
      'string' ||
    !result.reply.trim()
  ) {
    throw new Error(
      result?.error ||
        'The AI assistant returned an invalid response.'
    );
  }

  return result.reply.trim();
}


// ================================================================
// CHATBOT SEND MESSAGE
// ================================================================

async function sendMessage() {
  if (
    !chatbotInput ||
    chatbotBusy
  ) {
    return;
  }

  const text =
    chatbotInput.value.trim();

  if (!text) {
    return;
  }

  addBubble(
    text,
    true
  );

  chatbotInput.value =
    '';

  chatbotBusy =
    true;

  if (chatbotSend) {
    chatbotSend.disabled =
      true;
  }

  chatbotInput.disabled =
    true;

  const typingBubble =
    addTypingBubble();

  try {
    const reply =
      await askAI(text);

    removeTypingBubble(
      typingBubble
    );

    addBubble(
      reply,
      false
    );
  } catch (error) {
    console.error(
      'Plus Data AI assistant error:',
      error
    );

    removeTypingBubble(
      typingBubble
    );

    addBubble(
      'Sorry, I could not connect to the Plus Data assistant right now. Please try again in a moment or contact our support team.',
      false
    );
  } finally {
    chatbotBusy =
      false;

    if (chatbotSend) {
      chatbotSend.disabled =
        false;
    }

    chatbotInput.disabled =
      false;

    chatbotInput.focus();
  }
}


// ================================================================
// CHATBOT SEND BUTTON
// ================================================================

if (chatbotSend) {
  chatbotSend.addEventListener(
    'click',
    sendMessage
  );
}


// ================================================================
// CHATBOT ENTER KEY
// ================================================================

if (chatbotInput) {
  chatbotInput.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    }
  );
}


// ================================================================
// INITIALIZE SUPABASE PACKAGES
// ================================================================

loadPackagesFromSupabase();


// ================================================================
// CHECK FOR PAYSTACK CALLBACK
// ================================================================

handlePaystackCallback();


// ================================================================
// CHATBOT DEBUG CHECK
// ================================================================

console.log(
  'Plus Data chatbot:',
  {
    toggleFound:
      !!chatbotToggle,

    panelFound:
      !!chatbotPanel,

    inputFound:
      !!chatbotInput,

    sendButtonFound:
      !!chatbotSend,

    aiFunction:
      CHATBOT_FUNCTION_URL
  }
);


// ================================================================
// END OF APP.JS
// ================================================================