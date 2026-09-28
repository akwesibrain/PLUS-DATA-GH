/* =========================================================
   Plus Data Ghana — Admin dashboard (live data via Supabase)
   Needs: config.js (URL + anon key), supabase-schema.sql run once.
   ========================================================= */
const $ = id => document.getElementById(id);
const GHS = n => 'GH₵' + Number(n || 0).toLocaleString('en-GH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
const NUM = n => Number(n || 0).toLocaleString('en-GH');
const TIME = iso => new Date(iso).toLocaleString('en-GB', {day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra'});
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
Chart.defaults.color = '#8b98c9';
Chart.defaults.borderColor = '#1c2a5a';

let D = null;            // latest dashboard data
let range = 'Daily';     // selected revenue range
const NAV = ['Dashboard','Agents','API Users','Orders','Packages','Withdrawal','SMS','Customers','Leadership Board','Reports','Wallets & Transactions','Disputes','Notifications','System Logs','Financial Services','Settings'];
const COLORS = {blue: '#3b8bff', green: '#22d3a0', amber: '#f5a524', pink: '#f0506e'};
const STATUS = [['Completed', '#22d3a0'], ['Processing', '#3b8bff'], ['Pending', '#f5a524'], ['Failed', '#f0506e']];
const NET = {MTN: ['mtn', 'MTN'], AirtelTigo: ['atl', 'ATL'], Telecel: ['tcl', 'TCL']};

/* ---------- chart helper: destroys the old chart so refreshes don't stack ---------- */
function mk(id, cfg) { Chart.getChart(id)?.destroy(); return new Chart($(id), cfg); }

/* ---------- AUTH ---------- */
function showLogin(msg = '') { $('login').style.display = 'flex'; $('loginErr').textContent = msg; }

$('loginForm').onsubmit = async e => {
  e.preventDefault();
  $('loginErr').textContent = '';
  const {error} = await sb.auth.signInWithPassword({email: $('email').value.trim(), password: $('password').value});
  if (error) return ($('loginErr').textContent = 'Wrong email or password.');
  $('password').value = '';
  await load();
};
$('logout').onclick = async () => { await sb.auth.signOut(); showLogin(); };

/* ---------- LOAD ---------- */
async function load() {
  const {data, error} = await sb.rpc('admin_dashboard');
  if (error) {
    await sb.auth.signOut();
    return showLogin(error.message.includes('forbidden') ? 'This account is not an admin.' : 'Could not load data. Check config.js and that the schema was run.');
  }
  $('login').style.display = 'none';
  D = data;
  render();
}

/* ---------- RENDER ---------- */
function render() {
  $('wallet').textContent = GHS(D.wallet);

  // KPI cards
  const k = D.kpis;
  const cards = [
    ['Total Agents', NUM(k.agents.total), k.agents, 'blue'],
    ['API Users', NUM(k.api_users.total), k.api_users, 'green'],
    ['Total Orders', NUM(k.orders.total), k.orders, 'blue'],
    ['Total Revenue', GHS(k.revenue.total), k.revenue, 'amber'],
    ['Total Withdrawal', GHS(k.withdrawals.total), k.withdrawals, 'pink']
  ];
  $('kpis').innerHTML = cards.map(([l, v, m, c], i) => {
    const chg = m.chg == null ? '<span class="flat">— no prior week yet</span>'
      : `<span class="${m.chg >= 0 ? 'up' : 'down'}">${m.chg >= 0 ? '▲' : '▼'} ${Math.abs(m.chg)}% this week</span>`;
    return `<div class="card kpi ${c}"><span class="lbl">${l}</span><span class="val">${v}</span><span class="chg">${chg}</span><canvas id="sp${i}"></canvas></div>`;
  }).join('');
  cards.forEach(([, , m, c], i) => mk('sp' + i, {
    type: 'line',
    data: {labels: m.spark.map((_, j) => j), datasets: [{data: m.spark, borderColor: COLORS[c], borderWidth: 2, tension: .4, pointRadius: 0, fill: true, backgroundColor: COLORS[c] + '22'}]},
    options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}, tooltip: {enabled: false}}, scales: {x: {display: false}, y: {display: false, min: 0}}}
  }));

  drawRevenue();

  // Order status donut
  const counts = STATUS.map(([n]) => Number(D.status[n] || 0));
  const total = counts.reduce((a, b) => a + b, 0);
  mk('statusChart', {
    type: 'doughnut',
    data: {labels: STATUS.map(s => s[0]), datasets: [{data: total ? counts : [1], backgroundColor: total ? STATUS.map(s => s[1]) : ['#1c2a5a'], borderWidth: 0}]},
    options: {cutout: '68%', plugins: {legend: {display: false}, tooltip: {enabled: total > 0}}},
    plugins: [{id: 'center', afterDraw(c) {
      const {ctx, chartArea: a} = c, x = (a.left + a.right) / 2, y = (a.top + a.bottom) / 2;
      ctx.save(); ctx.textAlign = 'center'; ctx.fillStyle = '#e8edff'; ctx.font = '700 20px system-ui'; ctx.fillText(NUM(total), x, y);
      ctx.font = '12px system-ui'; ctx.fillStyle = '#8b98c9'; ctx.fillText('Total Orders', x, y + 18); ctx.restore();
    }}]
  });
  $('legend').innerHTML = STATUS.map(([n, c], i) =>
    `<li><i style="background:${c}"></i>${n}<br><small style="color:var(--mute)">${NUM(counts[i])} (${total ? (counts[i] / total * 100).toFixed(1) : '0.0'}%)</small></li>`).join('');

  // Top packages
  $('pkgs').innerHTML = D.packages.length ? D.packages.map((p, i) => {
    const [cls, tag] = NET[p.net] || ['mtn', '?'];
    return `<div class="pkg"><span>${i + 1}.</span><span class="net ${cls}">${tag}</span><div>${esc(p.n)}<small>${NUM(p.s)} Sales</small></div><span class="price">${GHS(p.p)}</span></div>`;
  }).join('') : '<p class="empty">No completed sales yet.</p>';

  // Health bars + withdrawal summary
  $('bars').innerHTML = '<i></i>'.repeat(14);
  const pw = D.pending_withdrawals;
  $('wdTitle').textContent = `${NUM(pw.count)} Withdrawal Request${pw.count === 1 ? '' : 's'}`;
  $('wdSub').textContent = `${GHS(pw.amount)} pending approval`;

  // Tables
  $('ordersT').innerHTML = '<tr><th>Order ID</th><th>Network</th><th>Package</th><th>Amount</th><th>Status</th><th>Time</th></tr>' +
    (D.orders.length ? D.orders.map(o => `<tr><td>#ORD-${o.id}</td><td>${esc(o.network)}</td><td>${esc(o.pkg)}</td><td>${GHS(o.amount)}</td><td><span class="st ${esc(o.status)}">${esc(o.status)}</span></td><td>${TIME(o.created_at)}</td></tr>`).join('')
      : '<tr><td colspan="6" class="empty">No orders yet.</td></tr>');
  $('wdT').innerHTML = '<tr><th>ID</th><th>Agent</th><th>Amount</th><th>Status</th></tr>' +
    (D.withdrawals.length ? D.withdrawals.map(w => `<tr><td>#AWD-${w.id}</td><td>${esc(w.agent)}</td><td>${GHS(w.amount)}</td><td><span class="st ${esc(w.status)}">${esc(w.status)}</span></td></tr>`).join('')
      : '<tr><td colspan="4" class="empty">No withdrawals yet.</td></tr>');

  // Customer growth
  const c = D.customers;
  $('custTotal').innerHTML = NUM(c.total) + (c.chg == null ? '' : ` <small class="${c.chg >= 0 ? 'up' : 'down'}" style="font-size:13px">${c.chg >= 0 ? '▲' : '▼'} ${Math.abs(c.chg)}% this week</small>`);
  mk('custChart', {
    type: 'line',
    data: {labels: c.series.map((_, i) => i), datasets: [{data: c.series, borderColor: '#3b8bff', backgroundColor: '#3b8bff33', fill: true, tension: .4, pointRadius: 0}]},
    options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}}, scales: {x: {display: false}, y: {display: false, min: 0}}}
  });

  // System stats
  const s = D.system;
  $('sys').innerHTML = [['Active Agents', s.active_agents], ['Customers', s.customers], ['SMS Sent Today', s.sms_today], ['Pending Orders', s.pending_orders], ['Failed Orders', s.failed_orders], ['Open Disputes', s.open_disputes]]
    .map(([l, v]) => `<div style="display:flex;justify-content:space-between"><span style="color:var(--mute)">${l}</span><b>${NUM(v)}</b></div>`).join('');

  // Notification badge
  document.querySelectorAll('.nav .badge').forEach(b => { b.textContent = D.notifications; b.style.display = D.notifications ? '' : 'none'; });
}

function drawRevenue() {
  const r = D.revenue[range];
  mk('revChart', {
    type: 'line',
    data: {labels: r.labels, datasets: [{data: r.data, borderColor: '#6c7dff', backgroundColor: '#3b3fd633', fill: true, tension: .4, pointBackgroundColor: '#3b8bff', pointRadius: 4}]},
    options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {display: false}, tooltip: {callbacks: {label: c => GHS(c.parsed.y)}}},
      scales: {y: {beginAtZero: true, ticks: {callback: v => 'GH₵' + NUM(v)}, grid: {color: '#12204d'}}, x: {grid: {display: false}}}}
  });
  $('revTotal').textContent = GHS(r.total);
  document.querySelectorAll('#rangeTabs button').forEach(b => b.classList.toggle('on', b.dataset.r === range));
}

/* ---------- STATIC UI (runs once) ---------- */
$('nav').innerHTML = NAV.map((n, i) => `<a href="#" class="${i === 0 ? 'active' : ''}">${n}${n === 'Notifications' ? '<span class="badge">0</span>' : ''}</a>`).join('');
$('nav').addEventListener('click', e => {
  const a = e.target.closest('a'); if (!a) return; e.preventDefault();
  document.querySelectorAll('.nav a').forEach(x => x.classList.remove('active')); a.classList.add('active');
});
$('date').textContent = new Date().toLocaleString('en-GB', {dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Accra'});
$('rangeTabs').innerHTML = ['Daily', 'Weekly', 'Monthly'].map(r => `<button data-r="${r}">${r}</button>`).join('');
$('rangeTabs').addEventListener('click', e => { if (e.target.dataset.r && D) { range = e.target.dataset.r; drawRevenue(); } });
$('newPkg').onclick = () => alert('Open your "Create Package" form here.');

// AI assistant widget
const chat = $('chat'), msgs = $('msgs');
$('fab').onclick = () => { chat.classList.add('open'); $('fab').style.display = 'none'; };
$('closeChat').onclick = () => { chat.classList.remove('open'); $('fab').style.display = 'block'; };
$('quick').innerHTML = ["Show me today's orders", 'Top agents this week', 'Create a new package', 'Check system status'].map(q => `<button>${q}</button>`).join('');
function addMsg(t, who) { const d = document.createElement('div'); d.className = 'msg ' + who; d.textContent = t; msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight; }
function ask(q) {
  addMsg(q, 'me');
  // TODO: call YOUR backend (e.g. a Supabase Edge Function) — never put an AI API key in this file.
  addMsg('Assistant is not connected yet.', 'bot');
}
$('quick').onclick = e => e.target.tagName === 'BUTTON' && ask(e.target.textContent);
$('chatForm').onsubmit = e => { e.preventDefault(); const v = $('chatIn').value.trim(); if (v) { ask(v); $('chatIn').value = ''; } };

/* ---------- START ---------- */
(async () => {
  const {data: {session}} = await sb.auth.getSession();
  session ? load() : showLogin();
  setInterval(() => { if (D) load(); }, 60000);   // auto-refresh every 60 seconds
})();