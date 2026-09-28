// ================================================================
// PLUS DATA GHANA — MAIN FRONTEND JAVASCRIPT
// ================================================================

// ----------------------------------------------------------------
// Light/dark theme toggle
// ----------------------------------------------------------------

const SUN_PATH = '<circle cx="12" cy="12" r="4.5" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8L6 18M18 6l1.8-1.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>';
const MOON_PATH = '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>';

const heroVideo = document.querySelector('.hero-video video');

if (
  heroVideo &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
) {
  heroVideo.pause();
  heroVideo.removeAttribute('autoplay');
}

const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  if (!themeIcon) return;

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

// ----------------------------------------------------------------
// Mobile menu toggle
// ----------------------------------------------------------------

const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('nav.primary');

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = nav.style.display === 'flex';

    nav.style.display = isOpen ? 'none' : 'flex';

    nav.style.cssText +=
      'flex-direction:column; position:absolute; top:100%; left:0; right:0; background:var(--paper-raised); padding:20px 24px; border-bottom:1px solid var(--line); gap:16px;';
  });
}

// ----------------------------------------------------------------
// Network colours
// ----------------------------------------------------------------

const netColors = {
  mtn: 'var(--mtn)',
  telecel: 'var(--telecel)',
  at: 'var(--at)'
};

// ----------------------------------------------------------------
// Ticker — random Ghana deliveries
// ----------------------------------------------------------------

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
  const pre = prefixes[randInt(0, prefixes.length - 1)];

  return pre + '****' + String(randInt(100, 999));
}

function minsLabel(n) {
  return n === 1 ? '1 min' : n + ' mins';
}

const tickerItems = Array.from({ length: 14 }, () => {
  const net = GH_NETS[randInt(0, GH_NETS.length - 1)];
  const size = GH_SIZES[randInt(0, GH_SIZES.length - 1)];

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
});

const track = document.getElementById('tickerTrack');

if (track) {
  const itemsHTML = tickerItems
    .map(
      (t) =>
        '<div class="ticker-item"><span class="net-dot" style="background:' +
        netColors[t.net] +
        '"></span>' +
        t.text +
        '</div>'
    )
    .join('');

  track.innerHTML = itemsHTML + itemsHTML;
}

// ----------------------------------------------------------------
// SUPABASE CONNECTION
// ----------------------------------------------------------------

const SUPABASE_URL =
  'https://plbtnltcocsuekifddat.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  'sb_publishable_gwgxy9az6GagMy-0K_HoMw_FVcsVSVW';

let supabaseClient = null;

if (
  window.supabase &&
  typeof window.supabase.createClient === 'function'
) {
  supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
} else {
  console.error(
    'Plus Data: Supabase library was not loaded. Make sure index.html loads @supabase/supabase-js before app.js.'
  );
}

// ----------------------------------------------------------------
// Buy Data modal
// ----------------------------------------------------------------
// Package prices are NO LONGER hard-coded here.
// They are loaded from public.data_packages in Supabase.
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Supabase network mapping
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Load packages from Supabase
// ----------------------------------------------------------------

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

    // Clear the existing frontend arrays.
    BUY_BUNDLES.mtn.plans = [];
    BUY_BUNDLES.telecel.plans = [];
    BUY_BUNDLES.at.plans = [];

    // Convert Supabase rows into the format
    // already expected by the existing UI.
    for (const row of data || []) {
      const networkName = String(
        row.network || ''
      )
        .trim()
        .toUpperCase();

      const networkKey = NETWORK_KEY[networkName];

      if (!networkKey) {
        console.warn(
          'Plus Data: Unknown network:',
          row.network
        );

        continue;
      }

      const numericPrice = Number(row.price);

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

        packageName: String(
          row.package_name || ''
        ).trim(),

        size: String(
          row.data_amount || ''
        ).trim(),

        price: numericPrice.toFixed(2)
      });
    }

    packagesLoaded = true;

    console.log(
      'Plus Data: Packages successfully loaded from Supabase.',
      BUY_BUNDLES
    );

    // Refresh the package selector if it is currently open.
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

// ----------------------------------------------------------------
// Buy Data DOM elements
// ----------------------------------------------------------------

const buyModal = document.getElementById('buyModal');
const buyCloseBtn = document.getElementById('buyCloseBtn');
const buyNetTabs = document.getElementById('buyNetTabs');
const buyBundleGrid = document.getElementById('buyBundleGrid');

let activeNet = 'mtn';

// ----------------------------------------------------------------
// Render Buy Data packages
// ----------------------------------------------------------------

function renderBuyBundles(net) {
  if (!buyBundleGrid) return;

  const data = BUY_BUNDLES[net];

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
        <p>
          No active packages are available for this network right now.
        </p>
      </div>
    `;

    return;
  }

  buyBundleGrid.innerHTML = data.plans
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

// ----------------------------------------------------------------
// Select package card
// ----------------------------------------------------------------

function selectBuyCard(net, index) {
  if (!buyBundleGrid) return;

  buyBundleGrid
    .querySelectorAll('.buy-bundle-card')
    .forEach((card) => {
      card.classList.remove('selected');
    });

  const card = buyBundleGrid.querySelector(
    `.buy-bundle-card[data-net="${net}"][data-index="${index}"]`
  );

  if (card) {
    card.classList.add('selected');
  }
}

// ----------------------------------------------------------------
// Buy Data package click
// ----------------------------------------------------------------

if (buyBundleGrid) {
  buyBundleGrid.addEventListener('click', (e) => {
    const card = e.target.closest(
      '.buy-bundle-card'
    );

    if (!card) return;

    const net = card.dataset.net;
    const index = Number(
      card.dataset.index
    );

    selectBuyCard(net, index);

    openCheckoutModal(
      net,
      index
    );
  });
}

// ----------------------------------------------------------------
// Network tab click
// ----------------------------------------------------------------

if (buyNetTabs) {
  buyNetTabs.addEventListener('click', (e) => {
    const tab = e.target.closest(
      '.buy-net-tab'
    );

    if (!tab) return;

    document
      .querySelectorAll('.buy-net-tab')
      .forEach((t) => {
        t.classList.remove('active');
      });

    tab.classList.add('active');

    activeNet = tab.dataset.net;

    if (packagesLoaded) {
      renderBuyBundles(activeNet);
    }
  });
}

// ----------------------------------------------------------------
// Open Buy Data modal
// ----------------------------------------------------------------

function openBuyModal(net) {
  if (
    net &&
    BUY_BUNDLES[net]
  ) {
    activeNet = net;

    document
      .querySelectorAll('.buy-net-tab')
      .forEach((tab) => {
        tab.classList.toggle(
          'active',
          tab.dataset.net === net
        );
      });
  }

  if (buyModal) {
    buyModal.classList.add('open');

    document.body.style.overflow =
      'hidden';
  }

  if (packagesLoaded) {
    renderBuyBundles(activeNet);

    return;
  }

  if (buyBundleGrid) {
    buyBundleGrid.innerHTML = `
      <div class="buy-bundle-loading">
        <p>Loading data packages...</p>
      </div>
    `;
  }

  loadPackagesFromSupabase()
    .then((success) => {
      if (success) {
        renderBuyBundles(
          activeNet
        );
      } else if (buyBundleGrid) {
        buyBundleGrid.innerHTML = `
          <div class="buy-bundle-error">
            <p>
              We couldn't load the packages right now.
            </p>

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
    });
}

// ----------------------------------------------------------------
// Close Buy Data modal
// ----------------------------------------------------------------

function closeBuyModal() {
  if (buyModal) {
    buyModal.classList.remove(
      'open'
    );
  }

  document.body.style.overflow = '';
}

// ----------------------------------------------------------------
// Buy Data triggers
// ----------------------------------------------------------------

document
  .querySelectorAll('.buy-trigger')
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

// ----------------------------------------------------------------
// Dynamic network checkout modal
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Ghana mobile number validation
// ----------------------------------------------------------------

const STRICT_NETWORK_PREFIX = true;

// ----------------------------------------------------------------
// Transaction/service fee
// ----------------------------------------------------------------

const FEE_RATE = 0.03;

function computeFee(price) {
  return Math.round(
    price * FEE_RATE * 100
  ) / 100;
}

// ----------------------------------------------------------------
// Demo promo codes
// ----------------------------------------------------------------

const PROMO_CODES = {
  SAVE5: 0.05,
  PLUS10: 0.10
};

function formatGHS(n) {
  return 'GH₵' +
    Number(n).toFixed(2);
}

// ----------------------------------------------------------------
// Checkout DOM elements
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Checkout state
// ----------------------------------------------------------------

let checkoutState = null;

/*
  checkoutState structure:

  {
    net,
    size,
    price,
    packageId,
    packageName
  }
*/

let appliedPromo = null;

// ----------------------------------------------------------------
// Calculate checkout total
// ----------------------------------------------------------------

function currentTotal() {
  if (!checkoutState) {
    return {
      fee: 0,
      total: 0,
      discountAmt: 0
    };
  }

  const fee =
    computeFee(
      checkoutState.price
    );

  let total =
    Math.round(
      (
        checkoutState.price +
        fee
      ) * 100
    ) / 100;

  let discountAmt = 0;

  if (appliedPromo) {
    discountAmt =
      Math.round(
        total *
        appliedPromo.discount *
        100
      ) / 100;

    total =
      Math.round(
        (
          total -
          discountAmt
        ) * 100
      ) / 100;
  }

  return {
    fee,
    total,
    discountAmt
  };
}

// ----------------------------------------------------------------
// Render checkout totals
// ----------------------------------------------------------------

function renderCheckoutTotals() {
  if (!checkoutState) return;

  const {
    fee,
    total,
    discountAmt
  } = currentTotal();

  if (checkoutPrice) {
    checkoutPrice.textContent =
      formatGHS(
        checkoutState.price
      );
  }

  if (checkoutFee) {
    checkoutFee.textContent =
      `+${formatGHS(fee)} fee` +
      (
        appliedPromo
          ? ` · −${formatGHS(discountAmt)} (${appliedPromo.code})`
          : ''
      );
  }

  if (checkoutPayLabel) {
    checkoutPayLabel.textContent =
      `PAY ${formatGHS(total)} & DELIVER`;
  }
}

// ----------------------------------------------------------------
// Open checkout modal
// ----------------------------------------------------------------

function openCheckoutModal(
  net,
  index
) {
  const netData =
    BUY_BUNDLES[net];

  const plan =
    netData &&
    netData.plans[index];

  if (!plan) return;

  checkoutState = {
    net,
    size: plan.size,
    price: parseFloat(
      plan.price
    ),
    packageId:
      plan.packageId ||
      plan.id ||
      null,
    packageName:
      plan.packageName ||
      plan.size
  };

  appliedPromo = null;

  if (checkoutPromoInput) {
    checkoutPromoInput.value = '';
  }

  if (checkoutPromoMsg) {
    checkoutPromoMsg.textContent = '';

    checkoutPromoMsg.className =
      'checkout-promo-msg';
  }

  if (checkoutPromoPanel) {
    checkoutPromoPanel.classList.remove(
      'show'
    );
  }

  if (checkoutPhone) {
    checkoutPhone.value = '';
  }

  if (checkoutPhoneError) {
    checkoutPhoneError.classList.remove(
      'show'
    );
  }

  if (!checkoutModal) return;

  checkoutModal.dataset.network =
    net;

  if (checkoutNetName) {
    checkoutNetName.textContent =
      NETWORK_UI[net].display;
  }

  if (checkoutSize) {
    checkoutSize.textContent =
      plan.size;
  }

  renderCheckoutTotals();

  checkoutModal.classList.add(
    'open'
  );

  document.body.style.overflow =
    'hidden';
}

// ----------------------------------------------------------------
// Close checkout modal
// ----------------------------------------------------------------

function closeCheckoutModal() {
  if (checkoutModal) {
    checkoutModal.classList.remove(
      'open'
    );
  }

  document.body.style.overflow =
    '';
}

if (checkoutCloseBtn) {
  checkoutCloseBtn.addEventListener(
    'click',
    closeCheckoutModal
  );
}

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

// ----------------------------------------------------------------
// Promo toggle
// ----------------------------------------------------------------

if (
  checkoutPromoToggle &&
  checkoutPromoPanel
) {
  checkoutPromoToggle.addEventListener(
    'click',
    () => {
      checkoutPromoPanel.classList.toggle(
        'show'
      );
    }
  );
}

// ----------------------------------------------------------------
// Promo code application
// ----------------------------------------------------------------

if (checkoutPromoApply) {
  checkoutPromoApply.addEventListener(
    'click',
    () => {
      const code =
        checkoutPromoInput
          ? checkoutPromoInput.value
              .trim()
              .toUpperCase()
          : '';

      if (!code) {
        appliedPromo = null;

        if (checkoutPromoMsg) {
          checkoutPromoMsg.textContent =
            'Enter a code to apply.';

          checkoutPromoMsg.className =
            'checkout-promo-msg error';
        }

        renderCheckoutTotals();

        return;
      }

      if (
        Object.prototype.hasOwnProperty.call(
          PROMO_CODES,
          code
        )
      ) {
        appliedPromo = {
          code,
          discount:
            PROMO_CODES[code]
        };

        if (checkoutPromoMsg) {
          checkoutPromoMsg.textContent =
            `Promo "${code}" applied.`;

          checkoutPromoMsg.className =
            'checkout-promo-msg success';
        }
      } else {
        appliedPromo = null;

        if (checkoutPromoMsg) {
          checkoutPromoMsg.textContent =
            'Invalid promo code.';

          checkoutPromoMsg.className =
            'checkout-promo-msg error';
        }
      }

      renderCheckoutTotals();
    }
  );
}

// ----------------------------------------------------------------
// Normalize Ghana phone number
// ----------------------------------------------------------------

function normalizePhone(v) {
  let d = String(v || '')
    .replace(
      /[\s\-()]/g,
      ''
    );

  if (
    d.startsWith('+233')
  ) {
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

// ----------------------------------------------------------------
// Validate Ghana phone number
// ----------------------------------------------------------------

function isValidGhanaNumber(
  v,
  net
) {
  const d =
    normalizePhone(v);

  if (
    !/^0\d{9}$/.test(d)
  ) {
    return false;
  }

  if (
    !STRICT_NETWORK_PREFIX ||
    !net
  ) {
    return true;
  }

  return NETWORK_UI[
    net
  ].prefixes.includes(
    d.slice(0, 3)
  );
}

// ----------------------------------------------------------------
// Phone input validation
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Checkout / WhatsApp
// ----------------------------------------------------------------

if (checkoutPayBtn) {
  checkoutPayBtn.addEventListener(
    'click',
    () => {
      if (!checkoutState) {
        return;
      }

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

      const {
        fee,
        total
      } = currentTotal();

      const netLabel =
        BUY_BUNDLES[
          checkoutState.net
        ].label;

      const promoPart =
        appliedPromo
          ? `, promo ${appliedPromo.code} applied`
          : '';

      const msg =
        encodeURIComponent(
          `Hi Plus Data, I'd like to buy ${checkoutState.size} ${netLabel} for ` +
          `${formatGHS(checkoutState.price)} (+${formatGHS(fee)} fee${promoPart}) = ${formatGHS(total)}. ` +
          `Recipient: ${normalizePhone(checkoutPhone.value)}. ` +
          `Package ID: ${checkoutState.packageId || 'N/A'}. ` +
          `Lock-screen alert: ${
            checkoutLockToggle &&
            checkoutLockToggle.checked
              ? 'On'
              : 'Off'
          }.`
        );

      // ----------------------------------------------------------
      // CURRENT CHECKOUT DESTINATION
      // ----------------------------------------------------------
      // Replace 233000000000 with the real Plus Data WhatsApp number.
      // Paystack/backend checkout will replace this later.
      // ----------------------------------------------------------

      window.open(
        `https://wa.me/233000000000?text=${msg}`,
        '_blank'
      );
    }
  );
}

// ----------------------------------------------------------------
// Chatbot widget
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// Open chatbot
// ----------------------------------------------------------------

function openChatbot() {
  if (!chatbotPanel) return;

  chatbotPanel.classList.add(
    'open'
  );

  if (chatbotToggle) {
    chatbotToggle.setAttribute(
      'aria-expanded',
      'true'
    );
  }
}

// ----------------------------------------------------------------
// Close chatbot
// ----------------------------------------------------------------

function closeChatbot() {
  if (!chatbotPanel) return;

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

// ----------------------------------------------------------------
// Chatbot toggle
// ----------------------------------------------------------------

if (chatbotToggle) {
  chatbotToggle.addEventListener(
    'click',
    () => {
      if (!chatbotPanel) return;

      chatbotPanel.classList.contains(
        'open'
      )
        ? closeChatbot()
        : openChatbot();
    }
  );
}

if (chatbotClose) {
  chatbotClose.addEventListener(
    'click',
    closeChatbot
  );
}

// ----------------------------------------------------------------
// Add chatbot message
// ----------------------------------------------------------------

function addBubble(
  text,
  fromUser
) {
  if (!chatbotBody) return;

  const bubble =
    document.createElement(
      'div'
    );

  bubble.className =
    'chatbot-bubble';

  bubble.textContent =
    text;

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
}

// ----------------------------------------------------------------
// Send chatbot message
// ----------------------------------------------------------------

function sendMessage() {
  if (!chatbotInput) return;

  const text =
    chatbotInput.value.trim();

  if (!text) return;

  addBubble(
    text,
    true
  );

  chatbotInput.value = '';

  setTimeout(() => {
    addBubble(
      "Thanks! This demo chat isn't wired to a live agent yet — for a real answer, tap WhatsApp Channel below and our team will help.",
      false
    );
  }, 500);
}

if (chatbotSend) {
  chatbotSend.addEventListener(
    'click',
    sendMessage
  );
}

if (chatbotInput) {
  chatbotInput.addEventListener(
    'keydown',
    (e) => {
      if (
        e.key === 'Enter'
      ) {
        sendMessage();
      }
    }
  );
}

// ----------------------------------------------------------------
// INITIALIZE SUPABASE PACKAGES
// ----------------------------------------------------------------

loadPackagesFromSupabase();

// ----------------------------------------------------------------
// END OF APP.JS
// ----------------------------------------------------------------