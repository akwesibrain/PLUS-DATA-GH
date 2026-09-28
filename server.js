// Plus Data Ghana - minimal secure backend.
// Secrets are read from process.env (loaded/decrypted by dotenvx) and NEVER sent to the browser.
const path = require('path');
const crypto = require('crypto');
const express = require('express');

const app = express();
const ROOT = __dirname;

const REQUIRED = ['PAYSTACK_PUBLIC_KEY', 'PAYSTACK_SECRET_KEY'];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('Missing environment variables: ' + missing.join(', '));
  process.exit(1);
}

// Paystack webhook: needs the RAW body to verify the signature, so it comes before express.json().
app.post('/api/paystack/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');
  const received = String(req.headers['x-paystack-signature'] || '');
  const ok =
    expected.length === received.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  if (!ok) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString('utf8'));
  if (event.event === 'charge.success') {
    // TODO: confirm amount/reference against your order, then call the data provider
    // using process.env.DATA_PROVIDER_API_KEY to deliver the bundle.
    console.log('Payment confirmed:', event.data && event.data.reference);
  }
  res.sendStatus(200);
});

app.use(express.json());

// Only PUBLIC values go to the browser.
app.get('/api/config', (req, res) => {
  res.json({
    paystackPublicKey: process.env.PAYSTACK_PUBLIC_KEY,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  });
});

// Serve ONLY the public site files, never the project root (that would expose .env).
app.get('/', (req, res) => res.sendFile(path.join(ROOT, 'index.html')));
app.get('/app.js', (req, res) => res.sendFile(path.join(ROOT, 'app.js')));
app.get('/logo%20for.jpg', (req, res) => res.sendFile(path.join(ROOT, 'logo for.jpg')));
app.use('/images', express.static(path.join(ROOT, 'images'), { dotfiles: 'deny' }));
app.use('/videos', express.static(path.join(ROOT, 'videos'), { dotfiles: 'deny' }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Plus Data Ghana running on port ' + port));