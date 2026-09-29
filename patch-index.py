#!/usr/bin/env python3
"""
Adds sign in / sign up, "Become an Agent" store application, admin redirect
and a checkout email field to index.html. It only INSERTS text — nothing in
your file is removed, reordered or rewritten.

Usage (in your project folder, next to index.html and auth.js):
    python3 patch-index.py            # or: python patch-index.py path/to/index.html
A backup is saved as index.html.bak first. Safe to re-run on the ORIGINAL
unpatched file; running it twice on an already-patched file is refused.
"""
import pathlib
import re
import shutil
import sys

path = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
if not path.exists():
    sys.exit(f"Cannot find {path}. Run this next to index.html.")

html = path.read_text(encoding="utf-8")
if 'id="authModal"' in html:
    sys.exit("Already patched. Nothing to do.")

# ---------------------------------------------------------------- CSS
CSS = """
      /* ---------- Auth modal (sign in / sign up) + Agent modal ---------- */
      .auth-modal {
        position: fixed;
        inset: 0;
        z-index: 96;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(4, 3, 2, 0.72);
        backdrop-filter: blur(6px);
      }
      .auth-modal.open {
        display: flex;
      }
      .auth-card {
        position: relative;
        width: 100%;
        max-width: 420px;
        max-height: calc(100vh - 40px);
        overflow-y: auto;
        border-radius: var(--radius-l);
        border: 1px solid rgba(221, 160, 21, 0.4);
        background:
          radial-gradient(120% 100% at 50% 0%, rgba(221, 160, 21, 0.14), transparent 60%),
          linear-gradient(180deg, #17130c 0%, #0d0b08 60%, #060504 100%);
        padding: 26px 26px 28px;
        color: #f3efe6;
        box-shadow: 0 30px 70px -20px rgba(0, 0, 0, 0.65);
      }
      .auth-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
        font-size: 18px;
        line-height: 1;
        z-index: 1;
      }
      .auth-close:hover {
        background: rgba(255, 255, 255, 0.16);
      }
      .auth-card h2 {
        font-family: "Baloo 2", sans-serif;
        font-weight: 700;
        font-size: 26px;
        color: #fff;
        margin-bottom: 4px;
      }
      .auth-sub {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
        margin-bottom: 20px;
      }
      /* Pill toggle (Sign In / Sign Up) */
      .auth-toggle {
        display: flex;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        padding: 4px;
        margin-bottom: 22px;
      }
      .auth-toggle button {
        flex: 1;
        padding: 12px;
        border-radius: 999px;
        font-weight: 800;
        font-size: 12.5px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: rgba(255, 255, 255, 0.55);
        transition: background 0.15s, color 0.15s;
      }
      .auth-toggle button.active {
        background: var(--gold);
        color: var(--ink);
      }
      .auth-field {
        margin-bottom: 14px;
        text-align: left;
      }
      .auth-label {
        display: block;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: rgba(243, 239, 230, 0.6);
        margin-bottom: 7px;
      }
      .auth-input,
      .agent-input {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: var(--radius-m);
        padding: 13px 16px;
        color: #f3efe6;
        font-size: 15px;
        font-family: inherit;
      }
      .auth-input::placeholder,
      .agent-input::placeholder {
        color: rgba(243, 239, 230, 0.4);
      }
      .auth-input:focus,
      .agent-input:focus {
        outline: none;
        border-color: var(--gold);
      }
      .auth-pwd-row { position: relative; }
      .auth-pwd-row .auth-input { padding-right: 46px; }
      .auth-pwd-toggle {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        width: 34px;
        height: 34px;
        border-radius: 50%;
        color: rgba(243, 239, 230, 0.55);
      }
      .auth-pwd-toggle:hover { color: #f3efe6; background: rgba(255,255,255,0.06); }
      .auth-pwd-toggle.showing { color: var(--gold); }
      .auth-signup-only {
        display: none;
      }
      .auth-modal.signup .auth-signup-only {
        display: block;
      }
      .auth-msg {
        display: none;
        font-size: 13px;
        border-radius: var(--radius-s);
        padding: 10px 12px;
        margin-bottom: 14px;
      }
      .auth-msg.show {
        display: block;
      }
      .auth-msg.error {
        color: #ff8a96;
        background: rgba(228, 40, 58, 0.12);
        border: 1px solid rgba(228, 40, 58, 0.35);
      }
      .auth-msg.info {
        color: #3ddc9a;
        background: rgba(61, 220, 154, 0.1);
        border: 1px solid rgba(61, 220, 154, 0.32);
      }
      .auth-submit {
        width: 100%;
        background: var(--gold);
        color: #12161f;
        border-radius: var(--radius-m);
        padding: 15px 18px;
        font-family: "Space Grotesk", sans-serif;
        font-weight: 800;
        font-size: 15px;
        transition: transform 0.15s ease, background 0.15s ease;
      }
      .auth-submit:hover {
        background: var(--gold-deep);
        transform: translateY(-1px);
      }
      .auth-submit:disabled {
        opacity: 0.6;
        cursor: wait;
        transform: none;
      }

      /* Agent ("Become a Data Agent") modal */
      .agent-modal-card {
        max-width: 460px;
      }
      .agent-steps {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11.5px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        margin-bottom: 20px;
      }
      .agent-steps span.on { color: var(--gold); }
      .agent-steps .sep { color: rgba(255, 255, 255, 0.25); }
      .agent-feat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-bottom: 22px;
      }
      .agent-feat {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-m);
        padding: 12px 14px;
      }
      .agent-feat b {
        display: block;
        font-size: 13px;
        color: #fff;
        margin-bottom: 2px;
      }
      .agent-feat span {
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.55);
      }
      .agent-store-row {
        display: flex;
        align-items: center;
      }
      .agent-store-prefix {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-right: 0;
        border-radius: var(--radius-m) 0 0 var(--radius-m);
        padding: 13px 12px;
        font-size: 13px;
        color: rgba(243, 239, 230, 0.55);
        white-space: nowrap;
      }
      .agent-store-row .agent-input {
        border-radius: 0 var(--radius-m) var(--radius-m) 0;
      }
"""

# ---------------------------------------------------------------- Checkout email field
EMAIL_FIELD = """
        <div class="checkout-field">
          <label class="checkout-label" for="checkoutEmail">Your email</label>
          <input
            type="email"
            id="checkoutEmail"
            class="checkout-phone-input"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />
          <div class="checkout-phone-error" id="checkoutEmailError">
            Enter a valid email address for your payment receipt
          </div>
        </div>
"""

# ---------------------------------------------------------------- Auth modal markup (pill toggle style)
AUTH_HTML = """
    <div
      class="auth-modal"
      id="authModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="authToggle"
    >
      <div class="auth-card">
        <button type="button" class="auth-close" id="authClose" aria-label="Close">
          &times;
        </button>

        <div class="auth-toggle" id="authToggle">
          <button type="button" data-mode="signin" class="active">Sign In</button>
          <button type="button" data-mode="signup">Sign Up</button>
        </div>

        <form id="authForm" novalidate>
          <div class="auth-field auth-signup-only">
            <label class="auth-label" for="authName">Full Name</label>
            <input type="text" id="authName" class="auth-input" placeholder="Kwame Asante" autocomplete="name" />
          </div>
          <div class="auth-field auth-signup-only">
            <label class="auth-label" for="authPhone">Phone number</label>
            <input type="tel" id="authPhone" class="auth-input" placeholder="024 XXX XXXX" inputmode="tel" autocomplete="tel" />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="authEmail">Email</label>
            <input type="email" id="authEmail" class="auth-input" placeholder="kwame@example.com" autocomplete="email" />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="authPassword">Password</label>
            <div class="auth-pwd-row">
              <input type="password" id="authPassword" class="auth-input" placeholder="At least 6 characters" autocomplete="current-password" />
              <button type="button" class="auth-pwd-toggle" id="authPwdToggle" aria-label="Show password">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="auth-field auth-signup-only">
            <label class="auth-label" for="authConfirm">Confirm Password</label>
            <input type="password" id="authConfirm" class="auth-input" placeholder="Repeat your password" autocomplete="new-password" />
          </div>

          <div class="auth-msg" id="authMsg" role="alert"></div>

          <button type="submit" class="auth-submit" id="authSubmit">Sign In</button>
        </form>
      </div>
    </div>
"""

# ---------------------------------------------------------------- Agent modal markup
AGENT_HTML = """
    <div
      class="auth-modal"
      id="agentModal"
      role="dialog"
      aria-modal="true"
      aria-label="Become a Plus Data Ghana agent"
    >
      <div class="auth-card agent-modal-card">
        <button type="button" class="auth-close" id="agentClose" aria-label="Close">
          &times;
        </button>
        <h2>Become a <span style="color:var(--gold)">Plus Data Ghana</span> Agent</h2>
        <p class="auth-sub">Set up your own data store and start earning.</p>

        <div class="agent-steps">
          <span class="on" id="agentStep1">1. Account</span>
          <span class="sep">&mdash;</span>
          <span id="agentStep2">2. Awaiting approval</span>
        </div>

        <div class="agent-feat-grid">
          <div class="agent-feat"><b>Wallet system</b><span>Top up &amp; profit on every sale.</span></div>
          <div class="agent-feat"><b>Mini store</b><span>Your own branded shop link.</span></div>
          <div class="agent-feat"><b>Referral bonuses</b><span>Earn from every signup.</span></div>
          <div class="agent-feat"><b>Leaderboard rewards</b><span>Weekly recognition &amp; badges.</span></div>
        </div>

        <form id="agentForm" novalidate>
          <div class="auth-field">
            <label class="auth-label" for="agentName">Full name</label>
            <input type="text" id="agentName" class="agent-input" placeholder="Kwame Asante" autocomplete="name" />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="agentPhone">Phone</label>
            <input type="tel" id="agentPhone" class="agent-input" placeholder="0241234567" inputmode="tel" autocomplete="tel" />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="agentStore">Store username</label>
            <div class="agent-store-row">
              <span class="agent-store-prefix">plusdata.gh/</span>
              <input type="text" id="agentStore" class="agent-input" placeholder="kwame" autocomplete="off" />
            </div>
          </div>
          <div class="auth-field">
            <label class="auth-label" for="agentEmail">Email</label>
            <input type="email" id="agentEmail" class="agent-input" placeholder="kwame@example.com" autocomplete="email" />
          </div>
          <div class="auth-field">
            <label class="auth-label" for="agentPassword">Password</label>
            <input type="password" id="agentPassword" class="agent-input" placeholder="At least 6 characters" autocomplete="new-password" />
          </div>

          <div class="auth-msg" id="agentMsg" role="alert"></div>

          <button type="submit" class="auth-submit" id="agentSubmit">Create Store Account</button>
        </form>
      </div>
    </div>
"""


def fail(msg):
    sys.exit(f"Stopped, file NOT changed: {msg}")


# 1) CSS: insert just before the closing </style>
if "</style>" not in html:
    fail("could not find </style>")
html = html.replace("</style>", CSS + "    </style>", 1)

# 2) Checkout email: right after the recipient phone field block
m = re.search(r'id="checkoutPhoneError"[^>]*>.*?</div>\s*</div>', html, re.S)
if not m:
    fail("could not find the checkout phone field (id=checkoutPhoneError)")
html = html[: m.end()] + "\n" + EMAIL_FIELD + html[m.end():]

# 3) Give the agent-card's "Become a Data Agent" button an id, so JS can open
#    the agent modal instead of navigating to WhatsApp. Its href is left
#    untouched (nothing removed) — only an id attribute is added.
AGENT_ANCHOR_OLD = '<a href="https://wa.me/233540309637" class="btn btn-gold btn-lg"'
AGENT_ANCHOR_NEW = '<a href="https://wa.me/233540309637" id="agentTriggerBtn" class="btn btn-gold btn-lg"'
if html.count(AGENT_ANCHOR_OLD) != 1:
    fail(f"expected exactly one 'Become a Data Agent' button, found {html.count(AGENT_ANCHOR_OLD)}")
html = html.replace(AGENT_ANCHOR_OLD, AGENT_ANCHOR_NEW, 1)

# 4) Auth + Agent modal markup: before the first script tag after the chatbot
anchor = '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>'
if anchor not in html:
    anchor = '<script src="app.js"></script>'
if anchor not in html:
    fail('could not find <script src="app.js"></script>')
html = html.replace(anchor, AUTH_HTML.lstrip("\n") + AGENT_HTML.lstrip("\n") + "    " + anchor, 1)

# 5) auth.js: right after app.js (auth.js needs your existing supabaseClient)
app_tag = '<script src="app.js"></script>'
if app_tag not in html:
    fail('could not find <script src="app.js"></script>')
html = html.replace(app_tag, app_tag + '\n    <script src="auth.js"></script>', 1)

# Sanity checks
for needle in ('id="authModal"', 'id="agentModal"', 'id="checkoutEmail"', 'id="agentTriggerBtn"', 'src="auth.js"', '.auth-modal {'):
    if needle not in html:
        fail(f"verification failed for {needle}")

backup = path.with_name(path.name + ".bak")
shutil.copy(path, backup)
path.write_text(html, encoding="utf-8")
print(f"Done. Backup saved as {backup.name}.")
for needed in ("auth.js",):
    if not (path.parent / needed).exists():
        print(f"REMINDER: put {needed} in the same folder as index.html.")