const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
app.use(cors());
app.use(express.json());

// API Keys සහ ඒවාට අදාළ Tiers (Free හෝ Paid)
const API_KEYS = {
  'FREE_USER_ABC123': { tier: 'free', name: 'Free User' },
  'PAID_USER_XYZ999': { tier: 'paid', name: 'VIP Paid User' }
};

// 1. Free Users සඳහා Rate Limit (මිනිත්තුවකට Request 5යි)
const freeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { error: 'Free tier limit reached. Please upgrade to a Paid plan for more requests!' }
});

// 2. Paid Users සඳහා Rate Limit (මිනිත්තුවකට Request 100යි)
const paidLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { error: 'Paid tier rate limit exceeded.' }
});

// Middleware: API Key එක පරීක්ෂා කිරීම සහ Tier එක තීරණය කිරීම
const checkApiKey = (req, res, next) => {
  const userKey = req.headers['x-api-key'];

  if (!userKey || !API_KEYS[userKey]) {
    return res.status(401).json({ error: 'Invalid or missing API Key. Provide valid x-api-key in headers.' });
  }

  req.userTier = API_KEYS[userKey].tier;

  // අදාළ Tier එකට අදාළ Rate Limit එක ක්‍රියාත්මක කිරීම
  if (req.userTier === 'free') {
    return freeLimiter(req, res, next);
  } else if (req.userTier === 'paid') {
    return paidLimiter(req, res, next);
  }
};

// --- API Endpoints ---

// Home Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Free & Paid API Platform!' });
});

// Protected API Data Route (මෙය ලබා ගැනීමට API Key එකක් අවශ්‍ය වේ)
app.get('/api/data', checkApiKey, (req, res) => {
  res.json({
    success: true,
    tier: req.userTier,
    data: [
      { id: 1, title: 'Sample API Resource A', description: 'Available for everyone based on tier limits.' },
      { id: 2, title: 'Sample API Resource B', description: 'High-speed data endpoint.' }
    ]
  });
});

// Server එක Start කිරීම
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
