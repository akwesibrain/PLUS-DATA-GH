/* Plus Data Ghana — sign in / sign up, agent store application, admin redirect, checkout email.
   Load this AFTER app.js so the existing global `supabaseClient` already exists.
   No secret keys here: it only uses your existing supabaseClient (anon key). */
(function () {
  'use strict';

  var ADMIN_URL = 'admin.html'; // change if your admin page lives elsewhere

  if (typeof supabaseClient === 'undefined') {
    console.error('auth.js: supabaseClient not found. Make sure auth.js loads after app.js.');
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var GH_PHONE_RE = /^0[25]\d{8}$/;
  var STORE_RE = /^[a-z0-9-]{3,20}$/;

  function normalizePhone(v) {
    var d = String(v || '').replace(/[\s\-()]/g, '');
    if (d.indexOf('+233') === 0) d = '0' + d.slice(4);
    else if (d.indexOf('233') === 0 && d.length === 12) d = '0' + d.slice(3);
    return d;
  }
  function friendly(err) {
    var m = (err && err.message) || 'Something went wrong. Please try again.';
    if (/invalid login credentials/i.test(m)) return 'Wrong email or password.';
    if (/already registered|already exists/i.test(m)) return 'An account with this email already exists. Try signing in.';
    if (/email not confirmed/i.test(m)) return 'Please confirm your email first, then sign in.';
    if (/rate limit|too many/i.test(m)) return 'Too many attempts. Please wait a minute and try again.';
    return m;
  }

  /* =========================================================
     SIGN IN / SIGN UP MODAL
     ========================================================= */
  var modal = $('authModal');
  var form = $('authForm');
  var signInBtn = document.querySelector('.signin-btn');
  var originalBtnText = signInBtn ? signInBtn.textContent : 'Sign In';
  var mode = 'signin';
  var busy = false;
  var signedIn = false;
  var checkedFor = null;

  function showMsg(box, type, text) {
    box.className = 'auth-msg show ' + type;
    box.textContent = text;
  }
  function hideMsg(box) { box.className = 'auth-msg'; }

  function setBusy(on) {
    busy = on;
    var b = $('authSubmit');
    b.disabled = on;
    b.textContent = on ? 'Please wait…' : (mode === 'signin' ? 'Sign In' : 'Create Account');
  }

  function setMode(next) {
    mode = next;
    modal.classList.toggle('signup', mode === 'signup');
    document.querySelectorAll('#authToggle button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.mode === mode);
    });
    $('authSubmit').textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
    $('authPassword').setAttribute('autocomplete', mode === 'signin' ? 'current-password' : 'new-password');
    hideMsg($('authMsg'));
  }

  function openAuthModal(next) {
    setMode(next || 'signin');
    modal.classList.add('open');
    setTimeout(function () { $(mode === 'signup' ? 'authName' : 'authEmail').focus(); }, 30);
  }
  function closeAuthModal() { modal.classList.remove('open'); }

  async function redirectIfAdmin(user) {
    if (!user) return false;
    try {
      var res = await supabaseClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
      if (!res.error && res.data && res.data.role === 'admin') {
        var here = location.pathname.split('/').pop();
        if (here !== ADMIN_URL) location.href = ADMIN_URL;
        return true;
      }
    } catch (e) { console.error('auth.js role check failed', e); }
    return false;
  }

  function prefillCheckoutEmail(email) {
    var input = $('checkoutEmail');
    if (input && email && !input.value) input.value = email;
  }
  function updateSignInButton() {
    if (signInBtn) signInBtn.textContent = signedIn ? 'Sign Out' : originalBtnText;
  }
  function syncSession(session) {
    var user = session && session.user;
    signedIn = !!user;
    updateSignInButton();
    if (!user) { checkedFor = null; return; }
    prefillCheckoutEmail(user.email);
    if (checkedFor !== user.id) {
      checkedFor = user.id;
      redirectIfAdmin(user);
    }
  }
  async function afterAuth(user) {
    var isAdmin = await redirectIfAdmin(user);
    if (!isAdmin) closeAuthModal();
  }

  async function handleAuthSubmit(e) {
    e.preventDefault();
    if (busy) return;
    var msg = $('authMsg');
    hideMsg(msg);

    var email = $('authEmail').value.trim();
    var password = $('authPassword').value;
    var name = '', phone = '';

    if (mode === 'signup') {
      name = $('authName').value.trim();
      phone = normalizePhone($('authPhone').value);
      if (!name) return showMsg(msg, 'error', 'Please enter your full name.');
      if (!GH_PHONE_RE.test(phone)) return showMsg(msg, 'error', 'Enter a valid Ghana mobile number (e.g. 024XXXXXXX).');
    }
    if (!EMAIL_RE.test(email)) return showMsg(msg, 'error', 'Enter a valid email address.');
    if (password.length < 6) return showMsg(msg, 'error', 'Password must be at least 6 characters.');
    if (mode === 'signup' && password !== $('authConfirm').value) return showMsg(msg, 'error', 'Passwords do not match.');

    setBusy(true);
    try {
      if (mode === 'signin') {
        var r = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
        if (r.error) throw r.error;
        await afterAuth(r.data.user);
      } else {
        var s = await supabaseClient.auth.signUp({
          email: email, password: password,
          options: { data: { full_name: name, phone: phone } }
        });
        if (s.error) throw s.error;
        if (s.data.user && s.data.user.identities && s.data.user.identities.length === 0) {
          throw new Error('User already registered');
        }
        if (s.data.session) {
          await afterAuth(s.data.user);
        } else {
          setMode('signin');
          showMsg(msg, 'info', 'Account created! Check your email to confirm your address, then sign in.');
        }
      }
    } catch (err) {
      showMsg(msg, 'error', friendly(err));
    } finally {
      setBusy(false);
    }
  }

  if (signInBtn) {
    signInBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (signedIn) { supabaseClient.auth.signOut(); return; }
      openAuthModal('signin');
    });
  }
  form.addEventListener('submit', handleAuthSubmit);
  document.getElementById('authToggle').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-mode]');
    if (b) setMode(b.dataset.mode);
  });
  $('authClose').addEventListener('click', closeAuthModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeAuthModal(); });
  $('authPwdToggle').addEventListener('click', function () {
    var f = $('authPassword');
    var show = f.type === 'password';
    f.type = show ? 'text' : 'password';
    this.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    this.classList.toggle('showing', show);
  });

  supabaseClient.auth.getSession().then(function (r) { syncSession(r.data && r.data.session); });
  supabaseClient.auth.onAuthStateChange(function (event, session) {
    setTimeout(function () { syncSession(session); }, 0);
  });

  /* =========================================================
     BECOME AN AGENT — create a store account (no fees)
     ========================================================= */
  var agentModal = $('agentModal');
  var agentForm = $('agentForm');
  var agentBusy = false;

  function openAgentModal() {
    hideMsg($('agentMsg'));
    agentForm.reset();
    agentForm.style.display = '';
    $('agentStep2').classList.remove('on');
    $('agentStep1').classList.add('on');
    agentModal.classList.add('open');
    setTimeout(function () { $('agentName').focus(); }, 30);
  }
  function closeAgentModal() { agentModal.classList.remove('open'); }

  function setAgentBusy(on) {
    agentBusy = on;
    var b = $('agentSubmit');
    b.disabled = on;
    b.textContent = on ? 'Please wait…' : 'Create Store Account';
  }

  async function handleAgentSubmit(e) {
    e.preventDefault();
    if (agentBusy) return;
    var msg = $('agentMsg');
    hideMsg(msg);

    var name = $('agentName').value.trim();
    var phone = normalizePhone($('agentPhone').value);
    var store = $('agentStore').value.trim().toLowerCase();
    var email = $('agentEmail').value.trim();
    var password = $('agentPassword').value;

    if (!name) return showMsg(msg, 'error', 'Please enter your full name.');
    if (!GH_PHONE_RE.test(phone)) return showMsg(msg, 'error', 'Enter a valid Ghana mobile number (e.g. 024XXXXXXX).');
    if (!STORE_RE.test(store)) return showMsg(msg, 'error', 'Store username must be 3-20 characters: lowercase letters, numbers, and dashes only.');
    if (!EMAIL_RE.test(email)) return showMsg(msg, 'error', 'Enter a valid email address.');
    if (password.length < 6) return showMsg(msg, 'error', 'Password must be at least 6 characters.');

    setAgentBusy(true);
    try {
      var s = await supabaseClient.auth.signUp({
        email: email, password: password,
        options: { data: { full_name: name, phone: phone, store_username: store, is_agent_applicant: true } }
      });
      if (s.error) throw s.error;
      if (s.data.user && s.data.user.identities && s.data.user.identities.length === 0) {
        throw new Error('User already registered');
      }

      // Best-effort: record the application for the admin to review. If the
      // agent_applications table doesn't exist yet (see agent-schema.sql),
      // this silently fails and the account is still created.
      try {
        await supabaseClient.from('agent_applications').insert({
          user_id: s.data.user ? s.data.user.id : null,
          full_name: name, phone: phone, store_username: store, email: email, status: 'pending'
        });
      } catch (dbErr) { console.warn('agent_applications insert skipped:', dbErr); }

      $('agentStep2').classList.add('on');
      $('agentStep1').classList.remove('on');
      showMsg(msg, 'info', 'Store account created! Your application is awaiting approval \u2014 we will notify you by email.');
      agentForm.style.display = 'none';
    } catch (err) {
      showMsg(msg, 'error', friendly(err));
    } finally {
      setAgentBusy(false);
    }
  }

  var agentTrigger = $('agentTriggerBtn');
  if (agentTrigger) {
    agentTrigger.addEventListener('click', function (e) {
      e.preventDefault();
      openAgentModal();
    });
  }
  agentForm.addEventListener('submit', handleAgentSubmit);
  $('agentClose').addEventListener('click', closeAgentModal);
  agentModal.addEventListener('click', function (e) { if (e.target === agentModal) closeAgentModal(); });

  /* ---------- checkout email: required before the existing pay button runs ---------- */
  var checkout = $('checkoutModal');
  var emailInput = $('checkoutEmail');
  var emailErr = $('checkoutEmailError');
  if (checkout && emailInput) {
    checkout.addEventListener('click', function (e) {
      if (!e.target.closest('#checkoutPayBtn')) return;
      if (!EMAIL_RE.test(emailInput.value.trim())) {
        e.preventDefault();
        e.stopImmediatePropagation();
        emailErr.classList.add('show');
        emailInput.focus();
      } else {
        emailErr.classList.remove('show');
      }
    }, true);
    emailInput.addEventListener('input', function () { emailErr.classList.remove('show'); });
  }
})();