/* =========================================================
   Plus Data Ghana — Admin Dashboard
   Live data via Supabase
   Website-matched color system
   Needs: config.js (URL + anon key), supabase-schema.sql
   ========================================================= */


/* =========================================================
   HELPERS
   ========================================================= */

const $ = id => document.getElementById(id);

const GHS = n =>
  'GH₵' +
  Number(n || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const NUM = n =>
  Number(n || 0).toLocaleString('en-GH');

const TIME = iso =>
  new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Accra'
  });

const esc = s =>
  String(s ?? '').replace(
    /[&<>"']/g,
    c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c])
  );


/* =========================================================
   SUPABASE
   ========================================================= */

const sb = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


/* =========================================================
   PLUS DATA GHANA COLOR SYSTEM
   Matches the main website
   ========================================================= */

const COLORS = {
  navy: '#060d20',
  navy2: '#0a1430',
  navy3: '#0d1a3d',

  blue: '#3b8bff',
  blueLight: '#60a5fa',
  blueDark: '#2563eb',

  cyan: '#22d3ee',
  green: '#22d3a0',

  amber: '#f5a524',
  pink: '#f0506e',

  white: '#f8fbff',
  text: '#e8edff',
  muted: '#8b98c9',

  border: '#1c2a5a',
  borderLight: '#26386f'
};


/* =========================================================
   CHART DEFAULTS
   ========================================================= */

Chart.defaults.color = COLORS.muted;
Chart.defaults.borderColor = COLORS.border;
Chart.defaults.font.family =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

Chart.defaults.plugins.legend.labels.color = COLORS.text;


/* =========================================================
   STATE
   ========================================================= */

let D = null;
let range = 'Daily';


/* =========================================================
   NAVIGATION
   ========================================================= */

const NAV = [
  'Dashboard',
  'Agents',
  'API Users',
  'Orders',
  'Packages',
  'Withdrawal',
  'SMS',
  'Customers',
  'Leadership Board',
  'Reports',
  'Wallets & Transactions',
  'Disputes',
  'Notifications',
  'System Logs',
  'Financial Services',
  'Settings'
];


/* =========================================================
   ORDER STATUS COLORS
   ========================================================= */

const STATUS = [
  ['Completed', COLORS.green],
  ['Processing', COLORS.blue],
  ['Pending', COLORS.amber],
  ['Failed', COLORS.pink]
];


/* =========================================================
   NETWORK COLORS
   ========================================================= */

const NET = {
  MTN: ['mtn', 'MTN'],
  AirtelTigo: ['atl', 'ATL'],
  Telecel: ['tcl', 'TCL']
};


/* =========================================================
   CHART HELPER
   ========================================================= */

function mk(id, cfg) {
  const existing = Chart.getChart(id);

  if (existing) {
    existing.destroy();
  }

  return new Chart($(id), cfg);
}


/* =========================================================
   AUTH
   ========================================================= */

function showLogin(msg = '') {
  $('login').style.display = 'flex';
  $('loginErr').textContent = msg;
}


$('loginForm').onsubmit = async e => {
  e.preventDefault();

  $('loginErr').textContent = '';

  const { error } = await sb.auth.signInWithPassword({
    email: $('email').value.trim(),
    password: $('password').value
  });

  if (error) {
    $('loginErr').textContent =
      'Wrong email or password.';
    return;
  }

  $('password').value = '';

  await load();
};


$('logout').onclick = async () => {
  await sb.auth.signOut();
  showLogin();
};


/* =========================================================
   LOAD DASHBOARD DATA
   ========================================================= */

async function load() {
  const { data, error } =
    await sb.rpc('admin_dashboard');

  if (error) {
    await sb.auth.signOut();

    return showLogin(
      error.message.includes('forbidden')
        ? 'This account is not an admin.'
        : 'Could not load data. Check config.js and that the schema was run.'
    );
  }

  $('login').style.display = 'none';

  D = data;

  render();
}


/* =========================================================
   RENDER DASHBOARD
   ========================================================= */

function render() {

  /* -------------------------------------------------------
     WALLET
     ------------------------------------------------------- */

  $('wallet').textContent = GHS(D.wallet);


  /* -------------------------------------------------------
     KPI CARDS
     ------------------------------------------------------- */

  const k = D.kpis;

  const cards = [
    [
      'Total Agents',
      NUM(k.agents.total),
      k.agents,
      'blue'
    ],
    [
      'API Users',
      NUM(k.api_users.total),
      k.api_users,
      'green'
    ],
    [
      'Total Orders',
      NUM(k.orders.total),
      k.orders,
      'blue'
    ],
    [
      'Total Revenue',
      GHS(k.revenue.total),
      k.revenue,
      'amber'
    ],
    [
      'Total Withdrawal',
      GHS(k.withdrawals.total),
      k.withdrawals,
      'pink'
    ]
  ];


  $('kpis').innerHTML =
    cards
      .map(([label, value, metrics, color], i) => {

        const change =
          metrics.chg == null
            ? '<span class="flat">— no prior week yet</span>'
            : `
              <span class="${metrics.chg >= 0 ? 'up' : 'down'}">
                ${metrics.chg >= 0 ? '▲' : '▼'}
                ${Math.abs(metrics.chg)}% this week
              </span>
            `;

        return `
          <div class="card kpi ${color}">
            <span class="lbl">${label}</span>
            <span class="val">${value}</span>
            <span class="chg">${change}</span>
            <canvas id="sp${i}"></canvas>
          </div>
        `;
      })
      .join('');


  /* -------------------------------------------------------
     KPI MINI CHARTS
     ------------------------------------------------------- */

  cards.forEach(([, , metrics, color], i) => {

    const chartColor =
      color === 'blue'
        ? COLORS.blue
        : color === 'green'
          ? COLORS.green
          : color === 'amber'
            ? COLORS.amber
            : COLORS.pink;

    mk('sp' + i, {
      type: 'line',

      data: {
        labels: metrics.spark.map((_, j) => j),

        datasets: [
          {
            data: metrics.spark,

            borderColor: chartColor,

            borderWidth: 2,

            tension: 0.4,

            pointRadius: 0,

            fill: true,

            backgroundColor:
              chartColor + '22'
          }
        ]
      },

      options: {
        responsive: true,

        maintainAspectRatio: false,

        plugins: {
          legend: {
            display: false
          },

          tooltip: {
            enabled: false
          }
        },

        scales: {
          x: {
            display: false
          },

          y: {
            display: false,
            min: 0
          }
        }
      }
    });

  });


  /* -------------------------------------------------------
     REVENUE
     ------------------------------------------------------- */

  drawRevenue();


  /* -------------------------------------------------------
     ORDER STATUS DONUT
     ------------------------------------------------------- */

  const counts =
    STATUS.map(
      ([name]) =>
        Number(D.status[name] || 0)
    );

  const total =
    counts.reduce(
      (a, b) => a + b,
      0
    );


  mk('statusChart', {

    type: 'doughnut',

    data: {

      labels:
        STATUS.map(
          status => status[0]
        ),

      datasets: [
        {
          data:
            total
              ? counts
              : [1],

          backgroundColor:
            total
              ? STATUS.map(
                  status => status[1]
                )
              : [COLORS.border],

          borderWidth: 0
        }
      ]
    },

    options: {

      cutout: '68%',

      plugins: {

        legend: {
          display: false
        },

        tooltip: {
          enabled: total > 0
        }
      }
    },

    plugins: [

      {
        id: 'center',

        afterDraw(chart) {

          const {
            ctx,
            chartArea
          } = chart;

          const x =
            (chartArea.left +
              chartArea.right) / 2;

          const y =
            (chartArea.top +
              chartArea.bottom) / 2;

          ctx.save();

          ctx.textAlign = 'center';

          ctx.fillStyle = COLORS.text;

          ctx.font =
            '700 20px system-ui';

          ctx.fillText(
            NUM(total),
            x,
            y
          );

          ctx.font =
            '12px system-ui';

          ctx.fillStyle =
            COLORS.muted;

          ctx.fillText(
            'Total Orders',
            x,
            y + 18
          );

          ctx.restore();
        }
      }

    ]
  });


  /* -------------------------------------------------------
     ORDER STATUS LEGEND
     ------------------------------------------------------- */

  $('legend').innerHTML =
    STATUS
      .map(([name, color], i) => {

        return `
          <li>
            <i style="background:${color}"></i>
            ${name}
            <br>
            <small style="color:${COLORS.muted}">
              ${NUM(counts[i])}
              (
                ${
                  total
                    ? (
                        counts[i] /
                        total *
                        100
                      ).toFixed(1)
                    : '0.0'
                }%
              )
            </small>
          </li>
        `;

      })
      .join('');


  /* -------------------------------------------------------
     TOP PACKAGES
     ------------------------------------------------------- */

  $('pkgs').innerHTML =
    D.packages.length

      ? D.packages
          .map((p, i) => {

            const [
              cls,
              tag
            ] =
              NET[p.net] ||
              ['mtn', '?'];

            return `
              <div class="pkg">

                <span>
                  ${i + 1}.
                </span>

                <span class="net ${cls}">
                  ${tag}
                </span>

                <div>
                  ${esc(p.n)}

                  <small>
                    ${NUM(p.s)} Sales
                  </small>
                </div>

                <span class="price">
                  ${GHS(p.p)}
                </span>

              </div>
            `;
          })
          .join('')

      : '<p class="empty">No completed sales yet.</p>';


  /* -------------------------------------------------------
     SYSTEM HEALTH
     ------------------------------------------------------- */

  $('bars').innerHTML =
    '<i></i>'.repeat(14);


  /* -------------------------------------------------------
     WITHDRAWAL SUMMARY
     ------------------------------------------------------- */

  const pw =
    D.pending_withdrawals;

  $('wdTitle').textContent =
    `${NUM(pw.count)}
     Withdrawal Request
     ${pw.count === 1 ? '' : 's'}`;

  $('wdSub').textContent =
    `${GHS(pw.amount)}
     pending approval`;


  /* -------------------------------------------------------
     ORDERS TABLE
     ------------------------------------------------------- */

  $('ordersT').innerHTML =
    `
      <tr>
        <th>Order ID</th>
        <th>Network</th>
        <th>Package</th>
        <th>Amount</th>
        <th>Status</th>
        <th>Time</th>
      </tr>
    ` +

    (
      D.orders.length

        ? D.orders
            .map(o => {

              return `
                <tr>

                  <td>
                    #ORD-${o.id}
                  </td>

                  <td>
                    ${esc(o.network)}
                  </td>

                  <td>
                    ${esc(o.pkg)}
                  </td>

                  <td>
                    ${GHS(o.amount)}
                  </td>

                  <td>
                    <span class="st ${esc(o.status)}">
                      ${esc(o.status)}
                    </span>
                  </td>

                  <td>
                    ${TIME(o.created_at)}
                  </td>

                </tr>
              `;
            })
            .join('')

        : `
          <tr>
            <td
              colspan="6"
              class="empty"
            >
              No orders yet.
            </td>
          </tr>
        `
    );


  /* -------------------------------------------------------
     WITHDRAWALS TABLE
     ------------------------------------------------------- */

  $('wdT').innerHTML =
    `
      <tr>
        <th>ID</th>
        <th>Agent</th>
        <th>Amount</th>
        <th>Status</th>
      </tr>
    ` +

    (
      D.withdrawals.length

        ? D.withdrawals
            .map(w => {

              return `
                <tr>

                  <td>
                    #AWD-${w.id}
                  </td>

                  <td>
                    ${esc(w.agent)}
                  </td>

                  <td>
                    ${GHS(w.amount)}
                  </td>

                  <td>
                    <span class="st ${esc(w.status)}">
                      ${esc(w.status)}
                    </span>
                  </td>

                </tr>
              `;
            })
            .join('')

        : `
          <tr>
            <td
              colspan="4"
              class="empty"
            >
              No withdrawals yet.
            </td>
          </tr>
        `
    );


  /* -------------------------------------------------------
     CUSTOMER GROWTH
     ------------------------------------------------------- */

  const c =
    D.customers;

  $('custTotal').innerHTML =
    NUM(c.total) +

    (
      c.chg == null
        ? ''
        : `
          <small
            class="${c.chg >= 0 ? 'up' : 'down'}"
            style="font-size:13px"
          >
            ${c.chg >= 0 ? '▲' : '▼'}
            ${Math.abs(c.chg)}%
            this week
          </small>
        `
    );


  mk('custChart', {

    type: 'line',

    data: {

      labels:
        c.series.map(
          (_, i) => i
        ),

      datasets: [
        {
          data: c.series,

          borderColor:
            COLORS.blue,

          backgroundColor:
            COLORS.blue + '33',

          fill: true,

          tension: 0.4,

          pointRadius: 0
        }
      ]
    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        }
      },

      scales: {

        x: {
          display: false
        },

        y: {
          display: false,
          min: 0
        }
      }
    }
  });


  /* -------------------------------------------------------
     SYSTEM STATS
     ------------------------------------------------------- */

  const s =
    D.system;

  $('sys').innerHTML = [

    [
      'Active Agents',
      s.active_agents
    ],

    [
      'Customers',
      s.customers
    ],

    [
      'SMS Sent Today',
      s.sms_today
    ],

    [
      'Pending Orders',
      s.pending_orders
    ],

    [
      'Failed Orders',
      s.failed_orders
    ],

    [
      'Open Disputes',
      s.open_disputes
    ]

  ]
    .map(
      ([label, value]) => `
        <div
          style="
            display:flex;
            justify-content:space-between;
            align-items:center;
          "
        >
          <span
            style="color:${COLORS.muted}"
          >
            ${label}
          </span>

          <b
            style="color:${COLORS.text}"
          >
            ${NUM(value)}
          </b>
        </div>
      `
    )
    .join('');


  /* -------------------------------------------------------
     NOTIFICATION BADGE
     ------------------------------------------------------- */

  document
    .querySelectorAll('.nav .badge')
    .forEach(badge => {

      badge.textContent =
        D.notifications;

      badge.style.display =
        D.notifications
          ? ''
          : 'none';

    });
}


/* =========================================================
   REVENUE CHART
   ========================================================= */

function drawRevenue() {

  const r =
    D.revenue[range];

  mk('revChart', {

    type: 'line',

    data: {

      labels:
        r.labels,

      datasets: [
        {

          data:
            r.data,

          borderColor:
            COLORS.blue,

          backgroundColor:
            COLORS.blue + '25',

          fill: true,

          tension: 0.4,

          pointBackgroundColor:
            COLORS.cyan,

          pointBorderColor:
            COLORS.blue,

          pointBorderWidth: 2,

          pointRadius: 4,

          pointHoverRadius: 6
        }
      ]
    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      plugins: {

        legend: {
          display: false
        },

        tooltip: {

          callbacks: {

            label: c =>
              GHS(c.parsed.y)

          }
        }
      },

      scales: {

        y: {

          beginAtZero: true,

          ticks: {

            color:
              COLORS.muted,

            callback: v =>
              'GH₵' + NUM(v)
          },

          grid: {
            color:
              COLORS.border
          }
        },

        x: {

          ticks: {
            color:
              COLORS.muted
          },

          grid: {
            display: false
          }
        }
      }
    }
  });


  $('revTotal').textContent =
    GHS(r.total);


  document
    .querySelectorAll(
      '#rangeTabs button'
    )
    .forEach(button => {

      button.classList.toggle(
        'on',
        button.dataset.r === range
      );

    });
}


/* =========================================================
   STATIC UI
   ========================================================= */

$('nav').innerHTML =
  NAV
    .map(
      (name, i) => `
        <a
          href="#"
          class="${i === 0 ? 'active' : ''}"
        >
          ${name}

          ${
            name === 'Notifications'
              ? '<span class="badge">0</span>'
              : ''
          }
        </a>
      `
    )
    .join('');


/* =========================================================
   NAVIGATION CLICK
   ========================================================= */

$('nav').addEventListener(
  'click',
  e => {

    const a =
      e.target.closest('a');

    if (!a) return;

    e.preventDefault();

    document
      .querySelectorAll('.nav a')
      .forEach(x =>
        x.classList.remove('active')
      );

    a.classList.add('active');
  }
);


/* =========================================================
   DATE
   ========================================================= */

$('date').textContent =
  new Date().toLocaleString(
    'en-GB',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Accra'
    }
  );


/* =========================================================
   REVENUE RANGE TABS
   ========================================================= */

$('rangeTabs').innerHTML =
  ['Daily', 'Weekly', 'Monthly']
    .map(
      r =>
        `<button data-r="${r}">
          ${r}
        </button>`
    )
    .join('');


$('rangeTabs').addEventListener(
  'click',
  e => {

    if (
      e.target.dataset.r &&
      D
    ) {

      range =
        e.target.dataset.r;

      drawRevenue();
    }
  }
);


/* =========================================================
   NEW PACKAGE
   ========================================================= */

$('newPkg').onclick = () =>
  alert(
    'Open your "Create Package" form here.'
  );


/* =========================================================
   ADMIN AI ASSISTANT
   ========================================================= */

const chat = $('chat');
const msgs = $('msgs');


/* ---------------------------------------------------------
   OPEN CHAT
   --------------------------------------------------------- */

$('fab').onclick = () => {

  chat.classList.add('open');

  $('fab').style.display =
    'none';
};


/* ---------------------------------------------------------
   CLOSE CHAT
   --------------------------------------------------------- */

$('closeChat').onclick = () => {

  chat.classList.remove('open');

  $('fab').style.display =
    'block';
};


/* ---------------------------------------------------------
   QUICK ACTIONS
   --------------------------------------------------------- */

$('quick').innerHTML = [

  "Show me today's orders",

  'Top agents this week',

  'Create a new package',

  'Check system status'

]
  .map(
    q =>
      `<button>${q}</button>`
  )
  .join('');


/* ---------------------------------------------------------
   CHAT MESSAGE
   --------------------------------------------------------- */

function addMsg(text, who) {

  const div =
    document.createElement('div');

  div.className =
    'msg ' + who;

  div.textContent =
    text;

  msgs.appendChild(div);

  msgs.scrollTop =
    msgs.scrollHeight;
}


/* ---------------------------------------------------------
   ADMIN AI REQUEST
   --------------------------------------------------------- */

async function ask(q) {

  addMsg(q, 'me');


  /*
    IMPORTANT:

    Never place an OpenRouter,
    OpenAI or other AI API key
    inside this JavaScript file.

    The request should go through
    your Supabase Edge Function.
  */

  try {

    const response =
      await fetch(
        `${SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
            'apikey':
              SUPABASE_ANON_KEY,
            'Authorization':
              `Bearer ${SUPABASE_ANON_KEY}`
          },

          body: JSON.stringify({

            message: q,

            context: {
              business:
                'Plus Data Ghana',

              dashboard: D
            }
          })
        }
      );


    if (!response.ok) {

      throw new Error(
        `AI request failed: ${response.status}`
      );
    }


    const result =
      await response.json();


    const reply =
      result.reply ||
      result.message ||
      result.answer;


    if (!reply) {

      throw new Error(
        'No AI response received.'
      );
    }


    addMsg(
      reply,
      'bot'
    );


  } catch (error) {

    console.error(
      'Admin AI error:',
      error
    );


    addMsg(
      'I could not connect to the Plus Data Ghana AI assistant right now. Please try again.',
      'bot'
    );
  }
}


/* =========================================================
   QUICK CHAT BUTTONS
   ========================================================= */

$('quick').onclick = e => {

  if (
    e.target.tagName ===
    'BUTTON'
  ) {

    ask(
      e.target.textContent
    );
  }
};


/* =========================================================
   CHAT FORM
   ========================================================= */

$('chatForm').onsubmit = e => {

  e.preventDefault();

  const value =
    $('chatIn').value.trim();

  if (!value) return;

  ask(value);

  $('chatIn').value = '';
};


/* =========================================================
   START
   ========================================================= */

(async () => {

  const {
    data: {
      session
    }
  } =
    await sb.auth.getSession();


  if (session) {

    await load();

  } else {

    showLogin();
  }


  /* -------------------------------------------------------
     AUTO REFRESH
     ------------------------------------------------------- */

  setInterval(
    () => {

      if (D) {
        load();
      }

    },
    60000
  );

})();