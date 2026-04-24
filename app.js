// ═══════════════════════════════════════════════════════
// DATABASE
// ═══════════════════════════════════════════════════════
const DB = {
  get(k, d) { const v = localStorage.getItem('g31_' + k); return v ? JSON.parse(v) : d },
  set(k, v) { localStorage.setItem('g31_' + k, JSON.stringify(v)) }
};

// ═══════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════
let pendingReferralCode = '';
let state = {
  currentUser: null,
  allUsers: DB.get('users', {}),
  globalRewards: DB.get('globalRewards', [
    { id: 'r1', name: 'Starter Pack', tier: 'basic', value: '₹50', description: 'Digital assets' },
    { id: 'r2', name: 'Coffee Gift', tier: 'advanced', value: '₹100', description: 'Cafe voucher' }
  ]),
  spinRecords: DB.get('spinRecords', []),
  sessionTermsAccepted: DB.get('termsAccepted', false),
  currentView: DB.get('lastView', 'dashView'),
  isBuyingSlots: false
};

function restoreSession() {
  const currentPhone = DB.get('currentUserPhone', null);
  if (currentPhone && state.allUsers[currentPhone]) {
    state.currentUser = state.allUsers[currentPhone];

    // Sync profile inputs if on setup view
    setTimeout(() => {
      const u = state.currentUser;
      const ni = document.getElementById('usernameInput');
      const cs = document.getElementById('countrySelect');
      const ls = document.getElementById('langSelect');
      if (ni) ni.value = u.username || '';
      if (cs) cs.value = u.country || 'IN';
      if (ls) ls.value = u.lang || 'en';
      if (u.avatar) {
        const ae = document.getElementById('avatarEmoji');
        if (ae) ae.innerText = u.avatar;
      }
    }, 100);
  }
}

function prefillReferralFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const ref = (params.get('ref') || params.get('referral') || params.get('code') || '').trim();
  if (ref) {
    pendingReferralCode = ref.toUpperCase();
    DB.set('referralCode', pendingReferralCode);
  } else {
    pendingReferralCode = DB.get('referralCode', '');
  }
  const refInput = document.getElementById('refCodeInput');
  if (refInput && pendingReferralCode) {
    refInput.value = pendingReferralCode;
  }
}

function fillReferralInputIfNeeded() {
  const refInput = document.getElementById('refCodeInput');
  if (refInput && !refInput.value) {
    pendingReferralCode = pendingReferralCode || DB.get('referralCode', '');
    if (pendingReferralCode) {
      refInput.value = pendingReferralCode;
    }
  }
}

// Tiers data (Tiers 1-31, pricing increases per tier)
const MAX_TIERS = 31;
const TIER_PRICE = 30;

const TIERS = [];
for (let i = 1; i <= MAX_TIERS; i++) {
  const reversedMembers = Math.pow(2, MAX_TIERS - i);
  TIERS.push({ num: i, members: reversedMembers, price: i }); // Tier i costs ₹i, higher tier has fewer members
}

const TIER_COLORS = [
  '#ff5252', '#ff7043', '#ffa726', '#ffca28', '#d4e157',
  '#66bb6a', '#26a69a', '#29b6f6', '#42a5f5', '#5c6bc0',
  '#7e57c2', '#ab47bc', '#ec407a', '#ef5350', '#ff7043',
  '#ff8a65', '#ffd54f', '#a5d6a7', '#80cbc4', '#81d4fa',
  '#ce93d8', '#f48fb1', '#ffcc80', '#bcaaa4', '#b0bec5',
  '#90caf9', '#80deea', '#a5d6a7', '#c5e1a5', '#fff176', '#ffe082'
];

const SPIN_PRIZES = [
  { label: '30 🪙', coins: 30, color: '#f5c518', prob: 1 },      // 1 in 5000 (rarest)
  { label: '1 🪙', coins: 1, color: '#448aff', prob: 5000 },      // most common
  { label: '10 🪙', coins: 10, color: '#00e676', prob: 200 },
  { label: '0 🪙', coins: 0, color: '#555577', prob: 1000 },      // zero option → watch ad
  { label: '5 🪙', coins: 5, color: '#ce93d8', prob: 400 },
  { label: '15 🪙', coins: 15, color: '#29b6f6', prob: 80 },
  { label: '20 🪙', coins: 20, color: '#ab47bc', prob: 40 },
  { label: '3 🪙', coins: 3, color: '#ffa726', prob: 800 },
];

const AVATARS = [
  { id: 'av1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix', label: 'av1' },
  { id: 'av2', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Aneka', label: 'av2' },
  { id: 'av3', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Jasper', label: 'av3' },
  { id: 'av4', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Luna', label: 'av4' },
  { id: 'av5', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Oliver', label: 'av5' },
  { id: 'av6', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sasha', label: 'av6' }
];
const LANGS = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' }, { code: 'ta', label: 'தமிழ்' }, { code: 'te', label: 'తెలుగు' }, { code: 'bn', label: 'বাংলা' }];
const COUNTRIES = [{ code: 'IN', label: '🇮🇳 India' }, { code: 'US', label: '🇺🇸 United States' }, { code: 'UK', label: '🇬🇧 United Kingdom' }, { code: 'AE', label: '🇦🇪 UAE' }, { code: 'SG', label: '🇸🇬 Singapore' }];

function getAvatarUrl(u) {
  if (!u) return AVATARS[0].url;
  const photo = u.avatarPhoto || u.photoUrl;
  if (photo) return photo;
  const av = AVATARS.find(a => a.id === u.avatar);
  if (av) return av.url;
  if (u.avatar && u.avatar.startsWith('http')) return u.avatar;
  return AVATARS[0].url;
}

const VIDEOS = [
  { icon: '🎬', title: 'Getting Started', desc: 'Learn the basics', duration: '4 min', level: 'Beginner', url: 'https://www.youtube.com/@grow31-u3s' },
  { icon: '🏆', title: 'Win Strategies', desc: 'Maximize earnings', duration: '5 min', level: 'Intermediate', url: 'https://www.youtube.com/@grow31-u3s' },
  { icon: '💰', title: 'Earn More Coins', desc: 'Advanced tips', duration: '6 min', level: 'Advanced', url: 'https://www.youtube.com/@grow31-u3s' },
  { icon: '📅', title: 'Daily Routine', desc: 'Stay on track', duration: '3 min', level: 'Beginner', url: 'https://www.youtube.com/@grow31-u3s' }
];

// ═══════════════════════════════════════════════════════
// SPLASH
// ═══════════════════════════════════════════════════════
function goHome() {
  const splash = document.getElementById('splashView');
  if (splash) splash.style.display = 'none';

  if (state.currentUser) {
    // Force reset to home tab for dashboard
    DB.set('lastDashPage', 'pageHome');
    state.currentView = 'dashView';
    DB.set('lastView', 'dashView');
    showView('dashView');

    // Explicitly switch the tab UI to Home (using the correct ID 'pageHome')
    if (typeof showDashPage === 'function') {
      showDashPage('pageHome');
    }

    setTimeout(renderDash, 10);
  } else {
    // For guests, clicking logo should at least take them to Auth/Login
    showView('authView');
  }
}

window.addEventListener('load', () => {
  restoreSession();
  prefillReferralFromUrl();
  const splash = document.getElementById('splashView');
  if (state.currentUser) {
    // Instant skip for logged in users
    if (splash) splash.style.display = 'none';
    loginSuccess();
    initRealtimeSync();
    if (window.lucide) lucide.createIcons();
  } else {
    // Normal flow for guests
    setTimeout(() => {
      if (splash) splash.classList.add('hidden');
      setTimeout(() => {
        if (splash) splash.style.display = 'none';
        if (!state.sessionTermsAccepted) {
          showView('termsView');
        } else {
          showView('authView');
        }
        if (window.lucide) lucide.createIcons();
      }, 600);
    }, 2700);
  }
});

function initRealtimeSync() {
  const u = state.currentUser;
  if (!u) return;
  const ni = document.getElementById('usernameInput');
  const cs = document.getElementById('countrySelect');
  const ls = document.getElementById('langSelect');

  if (ni) ni.addEventListener('input', (e) => { u.username = e.target.value; saveData(); });
  if (cs) cs.addEventListener('change', (e) => { u.country = e.target.value; saveData(); });
  if (ls) ls.addEventListener('change', (e) => { u.lang = e.target.value; saveData(); });
}

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
let tempPhone = "";
let otpTimerInterval = null;

function startOTPTimer() {
  let secs = 60;
  const countdown = document.getElementById('otpCountdown');
  const timerEl = document.getElementById('otpResendTimer');
  const resendBtn = document.getElementById('otpResendBtn');
  if (timerEl) timerEl.style.display = 'inline';
  if (resendBtn) resendBtn.classList.remove('visible');
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  otpTimerInterval = setInterval(() => {
    secs--;
    if (countdown) countdown.innerText = secs;
    if (secs <= 0) {
      clearInterval(otpTimerInterval);
      if (timerEl) timerEl.style.display = 'none';
      if (resendBtn) resendBtn.classList.add('visible');
    }
  }, 1000);
}

function sendOTP() {
  tempPhone = document.getElementById('phoneInput')?.value?.trim() || '';
  if (tempPhone.length < 10 || !/^\d+$/.test(tempPhone)) return showToast("Enter valid 10-digit number", "error");

  const stepPhone = document.getElementById('stepPhone');
  const stepOTP = document.getElementById('stepOTP');
  const otpPhoneDisplay = document.getElementById('otpPhoneDisplay');

  if (stepPhone) stepPhone.style.display = 'none';
  if (stepOTP) stepOTP.style.display = 'block';
  if (otpPhoneDisplay) otpPhoneDisplay.innerText = tempPhone;
  startOTPTimer();
  showToast("OTP sent to +91 " + tempPhone, "success");
}

function goBackToPhone() {
  const stepPhone = document.getElementById('stepPhone');
  const stepOTP = document.getElementById('stepOTP');
  if (otpTimerInterval) clearInterval(otpTimerInterval);
  if (stepOTP) stepOTP.style.display = 'none';
  if (stepPhone) stepPhone.style.display = 'block';
}

function resendOTP() {
  startOTPTimer();
  showToast("OTP resent to +91 " + tempPhone, "success");
}

function verifyOTP() {
  const otpInput = document.getElementById('otpInput');
  const otp = otpInput?.value?.trim() || '';
  if (otp.length !== 6 || !/^\d+$/.test(otp)) return showToast("Enter valid 6-digit OTP", "error");
  // In production, validate against real OTP service
  // Demo: accept any 6-digit code
  if (state.allUsers[tempPhone]) {
    state.currentUser = state.allUsers[tempPhone];
    DB.set('currentUserPhone', tempPhone);
    loginSuccess();
  } else {
    const stepOTP = document.getElementById('stepOTP');
    const stepReferral = document.getElementById('stepReferral');
    if (stepOTP) stepOTP.style.display = 'none';
    if (stepReferral) stepReferral.style.display = 'block';
    fillReferralInputIfNeeded();
  }
}

// Global tier queue counter
function getNextTierPosition() {
  const totalUsers = Object.keys(state.allUsers).length;
  return totalUsers + 1; // sequential position
}

function getQueuePositionForTier(tierNum) {
  return Math.max(1, Math.min(MAX_TIERS, MAX_TIERS + 1 - Math.max(1, Math.min(MAX_TIERS, tierNum))));
}

// Assign tier based on position: position 1 = Tier 31, position 2 = Tier 30, ..., position 31 = Tier 1
function positionToTierName(pos) {
  const normalized = Math.max(1, Math.min(MAX_TIERS, pos));
  return MAX_TIERS + 1 - normalized;
}

function completeSignup() {
  const uid = 'u' + Date.now();
  const refCodeInput = document.getElementById('refCodeInput');
  const inviteCode = (refCodeInput?.value?.trim()?.toUpperCase() || pendingReferralCode || '').trim();

  // Auto-assign tier position
  const queuePos = getNextTierPosition();
  const nextTierIndex = getGlobalOccupiedTiers() + 1;
  const tierNum = getTierByIndex(nextTierIndex);

  // Generate username-based referral code format: Grow31/username-randomnumber
  const tempUsername = 'Grower' + uid.slice(-4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const refCode = 'Grow31/' + tempUsername + '-' + randomNum;

  const newUser = {
    id: uid, phone: tempPhone, username: tempUsername,
    hasPaid: false, profileComplete: false,
    coins: 100, streak: 0, day: 1, refCode, referrals: 0,
    referralList: [], // list of referred user ids
    avatar: 'https://api.dicebear.com/7.x/notionists/svg?seed=' + uid, lang: 'en', country: 'IN',
    tasks: initTasks(), claimedRewards: [],
    followedSocials: [], checkedInToday: false, lastCheckIn: '',
    tier: tierNum, queuePosition: getQueuePositionForTier(tierNum),
    ownedTiers: [tierNum],
    spinTickets: 3, spinTokens: 0,
    tiersOwned: 1, tiersPurchased: 0, tiersClaimed: 0, investment: 0,
    joinedAt: Date.now(),
    payoutStatus: 'pending',
    txHistory: [{ type: 'signup', coins: 100, desc: 'Welcome bonus', time: Date.now() }]
  };

  if (inviteCode) {
    Object.values(state.allUsers).forEach(u => {
      if (u.refCode === inviteCode || u.refCode === inviteCode.replace('GROW31/', 'Grow31/')) {
        const refCoins = getTierCoinsPerReferral(u.tier || 1);
        u.referrals += 1;
        u.coins += refCoins;
        if (!u.referralList) u.referralList = [];
        u.referralList.push({ id: uid, name: newUser.username, time: Date.now() });
        if (!u.txHistory) u.txHistory = [];
        u.txHistory.unshift({ type: 'referral', coins: refCoins, desc: 'Referral bonus from ' + newUser.username, time: Date.now() });
        newUser.coins += 50;
        newUser.txHistory.unshift({ type: 'referral', coins: 50, desc: 'Referral bonus applied', time: Date.now() });
      }
    });
  }

  state.allUsers[tempPhone] = newUser;
  state.currentUser = newUser;
  DB.set('currentUserPhone', tempPhone);
  saveData();
  loginSuccess();
}

function loginSuccess() {
  const u = state.currentUser;
  // Daily Tier Login Bonus — 10x of tier number, once per day
  if (u && u.hasPaid && u.profileComplete) {
    const today = new Date().toDateString();
    if (u.lastTierBonus !== today) {
      const tierBonus = (u.tier || 1) * 10;
      u.coins += tierBonus;
      u.lastTierBonus = today;
      if (!u.txHistory) u.txHistory = [];
      u.txHistory.unshift({ type: 'tier_bonus', coins: tierBonus, desc: 'Daily Tier Login Bonus (Tier ' + (u.tier || 1) + ' × 10)', time: Date.now() });
      saveData();
      setTimeout(() => showToast('🎉 Tier Bonus! +' + tierBonus + ' 🪙 (Tier ' + (u.tier || 1) + ' × 10)', 'success'), 800);
    }
  }

  // Mandatory Onboarding Flow
  if (!state.sessionTermsAccepted) {
    showView('termsView');
  } else if (!u.hasPaid) {
    state.pendingPayment = { qty: 1, total: getNextTierPrice() };
    showView('paymentView');
  }
  // View Persistence
  else if (state.currentView && state.currentView !== 'authView' && state.currentView !== 'splashView') {
    showView(state.currentView);
    if (state.currentView === 'dashView') {
      renderDash();
      initSpinWheel();
    }
  }
  // Fallback
  else if (!u.profileComplete) {
    showView('profileSetupView');
  } else {
    showView('dashView');
    renderDash();
    initSpinWheel();
  }
}

// ═══════════════════════════════════════════════════════
// TERMS TABS
// ═══════════════════════════════════════════════════════
function switchTermsTab(id, btn) {
  ['tc', 'privacy', 'refund'].forEach(t => {
    const p = document.getElementById('tpanel-' + t);
    if (p) {
      p.classList.remove('active');
      p.style.display = 'none';
      p.classList.add('collapsed');
    }
  });
  document.querySelectorAll('#termsView .terms-tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tpanel-' + id);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
  if (btn) btn.classList.add('active');
  const rm = document.getElementById('termsReadMore');
  if (rm) rm.style.display = 'block';
}

function expandTerms(btn) {
  document.querySelectorAll('#termsView .terms-body').forEach(el => el.classList.remove('collapsed'));
  if (btn && btn.parentElement) btn.parentElement.style.display = 'none';
}

function switchTermsTab2(id, btn) {
  ['tc2', 'privacy2', 'refund2'].forEach(t => {
    const p = document.getElementById('tpanel-' + t);
    if (p) {
      p.classList.remove('active');
      p.style.display = 'none';
      p.classList.add('collapsed');
    }
  });
  document.querySelectorAll('#termsView2 .terms-tab-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById('tpanel-' + id);
  if (panel) { panel.classList.add('active'); panel.style.display = 'block'; }
  if (btn) btn.classList.add('active');
  const rm = document.getElementById('termsReadMore2');
  if (rm) rm.style.display = 'block';
}

function expandTerms2(btn) {
  document.querySelectorAll('#termsView2 .terms-body').forEach(el => el.classList.remove('collapsed'));
  if (btn && btn.parentElement) btn.parentElement.style.display = 'none';
}

// ═══════════════════════════════════════════════════════
// TERMS
// ═══════════════════════════════════════════════════════
function acceptTerms() {
  if (!document.getElementById('termsCheck').checked) return showToast("Please accept the terms first", "error");
  state.sessionTermsAccepted = true;
  DB.set('termsAccepted', true);
  if (!state.currentUser) {
    showView('authView');
  } else if (!state.currentUser.hasPaid) {
    state.pendingPayment = state.pendingPayment || { qty: 1, total: getNextTierPrice() };
    showView('paymentView');
  } else {
    showView('dashView');
    renderDash();
  }
}

// ═══════════════════════════════════════════════════════
// PAYMENT
// ═══════════════════════════════════════════════════════
function processPayment() {
  const btn = document.getElementById('payBtn');
  btn.disabled = true;
  document.getElementById('payBtnText').innerHTML = '<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(0,0,0,0.3);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite"></span> Processing...';

  showToast('Demo payment processing...', 'success');
  setTimeout(() => {
    showView('confirmView');
    simulateConfirm();
  }, 800);
}

function updatePaymentView() {
  const btn = document.getElementById('payBtn');
  if (btn) { btn.disabled = false; }
  const priceDisplay = document.getElementById('paymentPriceDisplay');
  const priceMeta = document.getElementById('paymentPriceMeta');
  const btnText = document.getElementById('payBtnText');
  const pending = state.pendingPayment || { qty: 1, total: getNextTierPrice(), plan: getTierPurchasePlan(1) };
  state.pendingPayment = pending;
  const plan = pending.plan || getTierPurchasePlan(pending.qty);

  if (priceDisplay) priceDisplay.innerText = '₹' + pending.total;
  if (priceMeta) {
    const prices = plan.tiers.map(item => item.price);
    if (new Set(prices).size === 1) {
      priceMeta.innerText = pending.qty + ' tier' + (pending.qty > 1 ? 's' : '') + ' @ ₹' + prices[0] + ' each';
    } else {
      priceMeta.innerText = prices.map(p => '₹' + p).join(' + ') + ' = ₹' + pending.total;
    }
  }
  if (btnText) btnText.innerText = 'Pay ₹' + pending.total + ' for ' + pending.qty + ' tier' + (pending.qty > 1 ? 's' : '') + ' →';

  showPaymentWithTierInfo();
}

function simulateConfirm() {
  const spinner = document.getElementById('confirmSpinner');
  const success = document.getElementById('confirmSuccess');
  const msg = document.getElementById('confirmMsg');
  spinner.style.display = 'block';
  success.style.display = 'none';
  msg.innerText = 'Processing your demo payment...';

  setTimeout(() => {
    msg.innerText = 'Verifying payment...';
  }, 800);
  setTimeout(() => {
    spinner.style.display = 'none';
    success.style.display = 'block';
    msg.style.display = 'none';
    const pending = state.pendingPayment || { qty: 1 };
    const u = state.currentUser || {};
    const totalTiers = (u.tiersOwned || 1) + pending.qty;
    const confirmDetails = document.getElementById('confirmDetails');
    if (confirmDetails) {
      confirmDetails.innerText = 'You will have ' + totalTiers + ' tier' + (totalTiers > 1 ? 's' : '') + ' after this purchase.';
    }
  }, 2200);
}

function afterPayment() {
  const btnText = document.getElementById('confirmDetails');
  const qty = state.pendingPayment?.qty || 1;
  const u = state.currentUser;
  if (!u) {
    return showView('authView');
  }
  const plan = state.pendingPayment?.plan || getTierPurchasePlan(qty);
  const paidAmount = state.pendingPayment?.total || (qty * getNextTierPrice());
  u.hasPaid = true;
  u.tiersOwned = (u.tiersOwned || 0) + qty;
  u.tiersPurchased = (u.tiersPurchased || 0) + qty;
  u.tiersClaimed = (u.tiersClaimed || 0) + qty;
  u.investment = (u.investment || 0) + paidAmount;
  if (!u.ownedTiers) u.ownedTiers = [u.tier || 1];
  plan.tiers.forEach(item => u.ownedTiers.push(item.tier));
  u.tier = Math.max(...u.ownedTiers);
  u.queuePosition = getQueuePositionForTier(u.tier);
  state.isBuyingSlots = false;
  if (!u.txHistory) u.txHistory = [];
  u.txHistory.unshift({ type: 'purchase', amount: paidAmount, desc: 'Tier purchase', time: Date.now() });
  saveData();
  state.pendingPayment = null;
  if (btnText) {
    btnText.innerText = 'You now have ' + u.tiersOwned + ' tier' + (u.tiersOwned > 1 ? 's' : '') + ' in your pool.';
  }
  showToast('Purchase complete! Total tiers: ' + u.tiersOwned + ' · Invested ₹' + u.investment, 'success');
  showView('dashView');
  renderDash();
  renderTiers();
  initSpinWheel();
}

// ═══════════════════════════════════════════════════════
// PROFILE SETUP
// ═══════════════════════════════════════════════════════

// Fix emoji dialog grid
document.addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('emojiDialog');
  if (d) {
    const inner = d.querySelector('.dialog');
    const g = document.createElement('div');
    g.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:8px';
    inner.appendChild(g);
  }
});

function saveProfile() {
  const uname = document.getElementById('usernameInput').value.trim();
  if (!uname) return showToast("Enter a username", "error");
  if (uname.length < 3) return showToast("Username too short", "error");

  const u = state.currentUser;
  u.username = uname;
  // u.avatar is now managed by selectAvatar/generateRandomAvatar directly
  u.country = document.getElementById('countrySelect').value;
  u.lang = document.getElementById('langSelect').value;
  u.profileComplete = true;
  u.coins += 100; // profile complete bonus
  // Update referral code with actual username
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  u.refCode = 'Grow31/' + uname + '-' + randomNum;
  if (!u.txHistory) u.txHistory = [];
  u.txHistory.unshift({ type: 'profile', coins: 100, desc: 'Profile completion bonus', time: Date.now() });
  if (!u.referralList) u.referralList = [];
  saveData();
  showToast("Profile saved! +100 coins bonus 🎉", "success");
  setTimeout(() => {
    showView('dashView');
    renderDash();
    initSpinWheel();
  }, 500);
}

// ═══════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════
let currentDashPage = 'pageHome';

function showDashPage(pageId) {
  ['pageHome', 'pageTasks', 'pageTiers', 'pageSpin', 'pageLeader', 'pageMore', 'pageQuiz'].forEach(p => {
    document.getElementById(p).style.display = 'none';
  });
  const pageEl = document.getElementById(pageId);
  pageEl.style.display = 'block';
  pageEl.scrollTop = 0;
  currentDashPage = pageId;

  // Update nav
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const map = { pageHome: 'navHome', pageTasks: 'navTasks', pageTiers: 'navTiers', pageSpin: 'navSpin', pageLeader: 'navMore', pageMore: 'navMore', pageQuiz: 'navTasks' };
  const navId = map[pageId];
  if (navId) document.getElementById(navId)?.classList.add('active');

  if (pageId === 'pageSpin') initSpinWheel();
  if (pageId === 'pageTiers') renderTiers();
  if (pageId === 'pageLeader') renderLeaderboard(Object.values(state.allUsers).sort((a, b) => b.coins - a.coins));
  if (pageId === 'pageMore') renderMore();
  if (pageId === 'pageHome') renderDash();
  if (pageId === 'pageQuiz') renderQuiz();
  if (pageId === 'pageTasks') renderTasksPage();

  syncFixedBarHeights();
  updateMobileBackBtn();
  if (window.lucide) lucide.createIcons();
}

function renderDash() {
  const u = state.currentUser;
  if (!u) return;

  // Header
  document.getElementById('headerCoins').innerText = u.coins.toLocaleString();
  document.getElementById('userName').innerText = u.username;
  document.getElementById('userDay').innerText = u.day;
  updateAvatarDisplays();
  document.getElementById('homeRefCode').innerText = u.refCode;
  const homeRefCoinsEl = document.getElementById('homeRefCoins');
  if (homeRefCoinsEl) homeRefCoinsEl.innerText = '+' + getTierCoinsPerReferral(u.tier || 1) + ' coins';

  // Stats
  document.getElementById('statStreak').innerText = u.streak;
  const sorted = Object.values(state.allUsers).sort((a, b) => b.coins - a.coins);
  const rank = sorted.findIndex(x => x.id === u.id) + 1;
  document.getElementById('statRank').innerText = '#' + rank;

  // Profile completion card
  const pCard = document.getElementById('completeProfileCard');
  if (u.profileComplete) { pCard.style.display = 'none'; }
  else { pCard.style.display = 'flex'; }

  // Mini tasks
  const mini = document.getElementById('miniTasksList');
  const todayTasks = u.tasks.filter(t => t.day === u.day).slice(0, 2);
  mini.innerHTML = todayTasks.map(t => `
<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:.88rem">
  <span>${t.done ? '✅ ' : ''}<span style="${t.done ? 'opacity:.5' : ''};">${t.title}</span></span>
  <span style="color:#FFD700;font-weight:700;font-size:.8rem">${t.done ? 'Done' : '+' + t.reward + ' G'}</span>
</div>
`).join('');

  // Home day grid
  const g = document.getElementById('homeGrid');
  if (g) {
    g.innerHTML = '';
    for (let i = 1; i <= 31; i++) {
      let cls = i < u.day ? 'day-past' : i === u.day ? 'day-current' : 'day-future';
      g.innerHTML += `<div class="day-cell ${cls}">${i}</div>`;
    }
  }

  // Gamified element
  const gamCoins = document.getElementById('gamifiedCoins');
  if (gamCoins) gamCoins.innerText = u.coins.toLocaleString();
  const homeFill = document.getElementById('homeProgressFill');
  if (homeFill) homeFill.style.width = Math.max(3, Math.round((u.day / 31) * 100)) + '%';
  const homeDay = document.getElementById('homeProgressDay');
  if (homeDay) homeDay.innerText = u.day;

  // Spin coins display
  if (document.getElementById('spinCoins')) document.getElementById('spinCoins').innerText = u.coins.toLocaleString();
  if (document.getElementById('spinTickets')) document.getElementById('spinTickets').innerText = u.spinTickets || 0;
  if (document.getElementById('followCoins')) document.getElementById('followCoins').innerText = u.coins.toLocaleString();

  // Sticky rank bar
  updateRankBar(u, rank);



  renderTasksPage();
  startCountdownTimers();
  syncFixedBarHeights();
  updateMobileBackBtn();
}

function updateRankBar(u, rank) {
  const r = rank || '—';
  const el = id => document.getElementById(id);
  // Avatar is already updated by updateAvatarDisplays in callers like renderDash
  if (el('rankBarName')) el('rankBarName').innerText = u.username;
  if (el('rankBarTier')) el('rankBarTier').innerText = u.tier || 1;
  if (el('rankBarDay')) el('rankBarDay').innerText = u.day;
  if (el('rankBarRank')) el('rankBarRank').innerText = '#' + r;
  if (el('rankBarCoins')) el('rankBarCoins').innerText = u.coins.toLocaleString();
}

function renderTasksPage() {
  const u = state.currentUser;
  const el = document.getElementById('taskDayNum');
  if (el) el.innerText = u.day;

  const c = document.getElementById('tasksList');
  if (!c) return;
  c.innerHTML = '';
  u.tasks.filter(t => t.day === u.day).forEach(t => {
    const div = document.createElement('div');
    div.className = `task-item${t.done ? ' done' : ''}`;
    div.onclick = () => completeTask(t.id);
    div.innerHTML = `
  <div class="flex justify-between w-full" style="align-items:center">
    <span style="font-weight:500">${t.done ? '✅ ' : ''}${t.title}</span>
    <span style="color:#FFD700;font-weight:700;font-size:.85rem">+${t.reward} G</span>
  </div>`;
    c.appendChild(div);
  });

  const g = document.getElementById('dayGrid');
  if (g) {
    g.innerHTML = '';
    for (let i = 1; i <= 31; i++) {
      let cls = i < u.day ? 'day-past' : i === u.day ? 'day-current' : 'day-future';
      g.innerHTML += `<div class="day-cell ${cls}">${i}</div>`;
    }
  }
}

function completeTask(tid) {
  const t = state.currentUser.tasks.find(x => x.id === tid);
  if (t.done) return;
  t.done = true;
  state.currentUser.coins += t.reward;
  if (!state.currentUser.txHistory) state.currentUser.txHistory = [];
  state.currentUser.txHistory.unshift({ type: 'task', coins: t.reward, desc: 'Task: ' + t.title, time: Date.now() });
  saveData();
  showToast("Task Done! +" + t.reward + " G");
  renderDash();
}

function renderMore() {
  const u = state.currentUser;
  if (!u) return;
  const perksCoinsEl = document.getElementById('perksCoins');
  if (perksCoinsEl) perksCoinsEl.innerText = u.coins.toLocaleString();
  const perksRefCountEl = document.getElementById('perksRefCount');
  if (perksRefCountEl) perksRefCountEl.innerText = (u.referrals || 0) + ' refs';
  document.getElementById('moreUsername').innerText = u.username;
  document.getElementById('morePhone').innerText = '+91 ' + u.phone;
  document.getElementById('moreCoins').innerText = u.coins.toLocaleString();
  document.getElementById('moreTier').innerText = u.tier || 1;
  document.getElementById('moreRefCount').innerText = u.referrals;
  updateAvatarDisplays();
  const refLink = document.getElementById('moreRefLink');
  if (refLink) refLink.innerText = u.refCode || 'Grow31/' + u.username;

  const countryMap = { 'IN': '🇮🇳 India', 'US': '🇺🇸 United States', 'UK': '🇬🇧 United Kingdom', 'AE': '🇦🇪 UAE', 'SG': '🇸🇬 Singapore' };
  const langMap = { 'en': 'English', 'hi': 'हिंदी', 'ta': 'தமிழ்', 'te': 'తెలుగు', 'bn': 'বাংলা' };
  document.getElementById('moreCountry').innerText = (countryMap[u.country] || '🇮🇳 India') + ' ›';
  document.getElementById('moreLang').innerText = (langMap[u.lang] || 'English') + ' ›';
}

function renderLeaderboard(sorted) {
  const c = document.getElementById('leaderboardList');
  if (!c) return;
  const u = state.currentUser;
  const userRank = sorted.findIndex(x => x.id === u.id) + 1;
  c.innerHTML = `<div class="card-header"><div class="card-title">🏆 Top Players · Your Rank: #${userRank}</div></div>`;
  sorted.slice(0, 15).forEach((usr, i) => {
    const isMe = usr.id === u.id;
    const finalPhoto = getAvatarUrl(usr);
    const avHtml = `<div class="avatar-sleek" style="width:36px;height:36px;background-image:url('${finalPhoto}');background-size:cover;background-position:center;border:none;flex-shrink:0"></div>`;

    c.innerHTML += `
  <div class="list-item" style="${isMe ? 'background:rgba(68,138,255,0.08);border-left:3px solid #448aff;' : ''}">
    <div style="font-weight:800;font-size:.8rem;color:rgba(255,255,255,0.3);width:20px">${i + 1}</div>
    ${avHtml}
    <div style="flex:1;min-width:0">
      <b style="font-size:.92rem;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${usr.username}${isMe ? ' <span class="badge badge-blue" style="font-size:10px">You</span>' : ''}</b>
      <div style="display:flex;gap:4px;margin-top:2px">
        <span class="badge badge-gray" style="font-size:.65rem;padding:2px 6px">Tier ${usr.tier || 1}</span>
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-weight:800;font-size:1rem;color:#FFD700"><span class="g-coin"></span> ${usr.coins.toLocaleString()}</div>
      <div class="text-xs text-muted" style="font-size:10px">G-credits</div>
    </div>
  </div>`;
  });
}

// ═══════════════════════════════════════════════════════
// TIERS SYSTEM (Auto-assigned, inverted naming)
// ═══════════════════════════════════════════════════════
function renderTiers() {
  const u = state.currentUser;
  const cur = u.tier || MAX_TIERS;
  const queuePos = u.queuePosition || 1;
  const seats = u.ownedTiers ? u.ownedTiers.length : Math.max(1, u.tiersOwned || (u.tier ? 1 : 0));
  const currentTierSeats = u.ownedTiers ? u.ownedTiers.filter(t => t === cur).length : seats;
  document.getElementById('currentTierNum').innerText = cur;
  document.getElementById('currentQueuePos').innerText = '#' + queuePos;
  document.getElementById('currentTierMembers').innerText = TIERS[cur - 1].members.toLocaleString();
  const seatsEl = document.getElementById('tierSeatsOwned');
  if (seatsEl) seatsEl.innerText = seats + ' tier' + (seats > 1 ? 's' : '') + (currentTierSeats && currentTierSeats !== seats ? ' · ' + currentTierSeats + ' in this tier' : '');
  const pct = Math.min(100, Math.round((queuePos / Math.max(1, Object.keys(state.allUsers).length)) * 100));
  document.getElementById('tierProgress').style.width = pct + '%';

  const summaryPurchased = document.getElementById('tierPurchasedCount');
  const summaryClaimed = document.getElementById('tierClaimedCount');
  const summaryInvested = document.getElementById('tierInvestment');
  if (summaryPurchased) summaryPurchased.innerText = (u.tiersPurchased || 0) + ' tier' + ((u.tiersPurchased || 0) > 1 ? 's' : '');
  if (summaryClaimed) summaryClaimed.innerText = (u.tiersClaimed || 0) + ' claimed';
  if (summaryInvested) summaryInvested.innerText = '₹' + (u.investment || 0).toLocaleString();

  const c = document.getElementById('tiersList');
  c.innerHTML = '';
  // Show tiers from 31 down to 1 (highest tier first)
  for (let i = MAX_TIERS; i >= 1; i--) {
    const s = TIERS[i - 1];
    const isCurrentTier = s.num === cur;
    const isAbove = s.num > cur; // higher tier = earlier in queue
    const isLocked = s.num < cur - 3;
    const div = document.createElement('div');
    div.className = `tier-card ${isCurrentTier ? 'current-tier' : ''} ${isLocked ? 'locked-tier' : ''}`;
    div.onclick = () => openTierDialog(s);

    const colIdx = (s.num - 1) % TIER_COLORS.length;
    const col = TIER_COLORS[colIdx];
    const membersStr = s.members >= 1000000000 ? '1,073,741,824' : s.members.toLocaleString();
    const queueLabel = getQueuePositionForTier(s.num);

    div.innerHTML = `
  <div style="display:flex;align-items:center;gap:12px">
    <div class="tier-badge" style="background:${col}22;border:1px solid ${col}44;color:${col}">T${s.num}</div>
    <div>
      <p style="font-weight:700;font-size:.92rem">Tier ${s.num} <span style="color:rgba(255,255,255,0.35);font-size:.75rem;color:#FFD700">(Queue #${queueLabel})</span></p>
      <p class="text-muted text-xs">Pool: ${membersStr} members</p>
      <p class="text-muted text-xs">Entry price: ₹${getTierPrice(s.num)} · public pool details visible</p>
    </div>
  </div>
  <div style="text-align:right">
    ${isCurrentTier ? `<span class="badge badge-green">Yours ✓</span>` : ''}
    ${isAbove ? `<span class="badge badge-blue">Higher Tier 🔼</span>` : ''}
    ${isLocked ? `<span style="font-size:1.1rem">🔒</span>` : ''}
    ${!isCurrentTier && !isAbove && !isLocked ? `<span class="text-muted text-xs">›</span>` : ''}
  </div>`;
    c.appendChild(div);
  }
}

function openTierDialog(tier) {
  const u = state.currentUser;
  const ownedSeats = u.ownedTiers?.filter(t => t === tier.num).length || 0;
  const membersStr = tier.members >= 1000000000 ? '1,073,741,824' : tier.members.toLocaleString();
  const tierPrice = getTierPrice(tier.num);
  document.getElementById('tierDialogTitle').innerText = 'Tier ' + tier.num + ' 🎰 (₹' + tierPrice + ')';
  document.getElementById('tierDialogDesc').innerText = 'Members: ' + membersStr + ' · Price: ₹' + tierPrice;
  const col = TIER_COLORS[(tier.num - 1) % TIER_COLORS.length];
  document.getElementById('tierDialogContent').innerHTML = `
<div style="background:${col}11;border:1px solid ${col}33;border-radius:14px;padding:16px;text-align:center;margin-bottom:16px">
  <div style="font-family:'Poppins',sans-serif;font-size:2.5rem;font-weight:800;color:${col}">${tier.num}</div>
  <p style="font-size:.85rem;color:rgba(255,255,255,0.6)">Tier Level</p>
  <p style="font-size:.75rem;color:${col};margin-top:8px;font-weight:700">Entry Price: ₹${tierPrice}</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
  <div style="text-align:center;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px">
    <p class="text-muted text-xs">Pool Members</p>
    <p style="font-weight:700;font-family:'Poppins',sans-serif;font-size:1rem">${membersStr}</p>
  </div>
  <div style="text-align:center;background:rgba(255,255,255,0.04);border-radius:10px;padding:12px">
    <p class="text-muted text-xs">Entry Price</p>
    <p style="font-weight:700;font-family:'Poppins',sans-serif;font-size:1rem">₹${tierPrice}</p>
  </div>
</div>
<div style="background:rgba(255,167,38,0.08);border:1px solid rgba(255,167,38,0.2);border-radius:10px;padding:12px;margin-bottom:14px;text-align:center">
  <p class="text-xs" style="color:#ffa726">⏳ Payout Status: <b>Pending Admin Verification</b></p>
</div>
${ownedSeats > 0 ? `<div style="background:rgba(76,175,80,0.08);border:1px solid rgba(76,175,80,0.16);border-radius:10px;padding:14px;margin-bottom:14px;text-align:center"><p class="text-sm" style="margin:0;color:#c8e6c9">You own ${ownedSeats} seat${ownedSeats > 1 ? 's' : ''} in this tier.</p></div>` : ''}
<p class="text-muted text-sm" style="margin-bottom:14px;line-height:1.6">Tiers are auto-assigned. Tier 1 costs ₹1 (entry level), Tier 31 costs ₹31 (highest tier). Each tier has exponentially more members. Payouts are credited after admin verification.</p>
${tier.num === u.tier || ownedSeats > 0 ? `<button class="btn btn-white btn-full btn-lg" onclick="showMyTierClaimInfo()">Claim / View My Tier</button>` : ''}
`;
  document.getElementById('tierDialog').classList.add('open');
}

function showMyTierClaimInfo() {
  const u = state.currentUser;
  if (!u) return showToast('Login first to view your tiers', 'error');
  const seats = u.ownedTiers ? u.ownedTiers.length : (u.tiersOwned || 1);
  const tierNum = u.tier || 1;
  const tierPrice = getTierPrice(tierNum);
  const queuePos = u.queuePosition || 1;
  const purchased = u.tiersPurchased || 0;
  const claimed = u.tiersClaimed || 0;
  const invested = u.investment || 0;
  const currentTierSeats = u.ownedTiers ? u.ownedTiers.filter(t => t === tierNum).length : seats;
  const tierCounts = u.ownedTiers ? u.ownedTiers.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {}) : { [tierNum]: seats };
  const breakdownHtml = Object.keys(tierCounts).sort((a, b) => b - a).map(t => `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><span>Tier ${t}</span><strong>${tierCounts[t]} seat${tierCounts[t] > 1 ? 's' : ''}</strong></div>`).join('');
  const content = `
<div style="text-align:center;margin-bottom:18px">
  <div style="font-size:2.5rem;margin-bottom:12px">🎟️</div>
  <h3 style="font-family:'Poppins',sans-serif;font-size:1.2rem;font-weight:800;margin-bottom:8px">Your Tier Details</h3>
  <p class="text-muted text-sm">Tier ${tierNum} (₹${tierPrice}) · Queue #${queuePos}</p>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
  <div style="background:rgba(102,187,106,0.1);border:1px solid rgba(102,187,106,0.2);border-radius:14px;padding:16px;text-align:center">
    <p class="text-muted text-xs">Total seats owned</p>
    <p style="font-weight:700;font-size:1.2rem">${seats}</p>
  </div>
  <div style="background:rgba(89,110,255,0.1);border:1px solid rgba(89,110,255,0.2);border-radius:14px;padding:16px;text-align:center">
    <p class="text-muted text-xs">Seats in this tier</p>
    <p style="font-weight:700;font-size:1.2rem">${currentTierSeats}</p>
  </div>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
  <div style="background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.2);border-radius:14px;padding:16px;text-align:center">
    <p class="text-muted text-xs">Purchased tiers</p>
    <p style="font-weight:700;font-size:1.2rem">${purchased}</p>
  </div>
  <div style="background:rgba(255,82,82,0.1);border:1px solid rgba(255,82,82,0.2);border-radius:14px;padding:16px;text-align:center">
    <p class="text-muted text-xs">Total investment</p>
    <p style="font-weight:700;font-size:1.2rem">₹${invested.toLocaleString()}</p>
  </div>
</div>
<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:16px">
  <p class="text-muted text-xs" style="margin-bottom:10px">Seat breakdown by tier</p>
  ${breakdownHtml}
</div>
<p class="text-muted text-sm" style="line-height:1.6;margin-bottom:16px">Your tier seat counts are shown above. Use the tier dashboard to see the full tier map and your current position. Each tier has dynamic pricing: Tier 1 = ₹1, Tier 2 = ₹2, ..., Tier 31 = ₹31.</p>
<button class="btn btn-blue btn-full" onclick="closeDialog('tierDialog'); openBuyTiersDialog();" style="margin-bottom:10px">Get More Slots 🚀</button>
`;
  document.getElementById('tierDialogTitle').innerText = 'My Tier Info';
  document.getElementById('tierDialogDesc').innerText = 'View your tier details and pricing.';
  document.getElementById('tierDialogContent').innerHTML = content;
  document.getElementById('tierDialog').classList.add('open');
}
// SPIN WHEEL
// ═══════════════════════════════════════════════════════
let spinning = false, spinAngle = 0, spinVelocity = 0;
let spinRAF = null;

function initSpinWheel() {
  const canvas = document.getElementById('spinCanvas');
  if (!canvas) return;
  drawWheel(canvas, spinAngle);
}

function drawWheel(canvas, angle) {
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 4;
  const seg = SPIN_PRIZES.length;
  const arc = (2 * Math.PI) / seg;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Outer ring
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, 2 * Math.PI);
  const gOuter = ctx.createRadialGradient(cx, cy, r - 10, cx, cy, r + 4);
  gOuter.addColorStop(0, '#b8860b');
  gOuter.addColorStop(0.5, '#ffd700');
  gOuter.addColorStop(1, '#8b6914');
  ctx.fillStyle = gOuter;
  ctx.fill();

  // Decorative dots on ring
  for (let i = 0; i < seg * 2; i++) {
    const a = ((2 * Math.PI) / seg / 2) * i + angle;
    const dx = cx + Math.cos(a) * (r - 2);
    const dy = cy + Math.sin(a) * (r - 2);
    ctx.beginPath();
    ctx.arc(dx, dy, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff8e1';
    ctx.fill();
    // gems
    ctx.beginPath();
    ctx.arc(dx, dy, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = SPIN_PRIZES[i % seg].color;
    ctx.fill();
  }

  // Segments
  SPIN_PRIZES.forEach((prize, i) => {
    const startA = arc * i + angle - Math.PI / 2;
    const endA = startA + arc;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r - 10, startA, endA);
    ctx.closePath();
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.12)');
    gr.addColorStop(1, prize.color + 'cc');
    ctx.fillStyle = gr;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Text
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startA + arc / 2);
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px Syne,sans-serif';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(prize.label, r - 18, 5);
    ctx.restore();
  });

  // Center circle
  const gc = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, 28);
  gc.addColorStop(0, '#fff');
  gc.addColorStop(1, '#999');
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = gc;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(245,197,24,0.9)';
  ctx.fill();
  ctx.font = 'bold 16px Syne';
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', cx, cy);
}

function doSpin(type) {
  if (spinning) return;
  const u = state.currentUser;

  if (type === 'coins') {
    if ((u.spinTickets || 0) < 1) return showToast("Not enough tickets! Earn tickets from tasks", "error");
    u.spinTickets--;
  } else {
    const tokCost = 200;
    if ((u.spinTokens || 0) < tokCost) return showToast("Not enough tokens! Need 200 tokens", "error");
    u.spinTokens -= tokCost;
  }

  spinning = true;
  document.getElementById('spinBtn1').disabled = true;
  const spinBtn2 = document.getElementById('spinBtn2');
  if (spinBtn2) spinBtn2.disabled = true;

  const totalRotation = Math.PI * 2 * (10 + Math.random() * 8);
  const duration = 4500 + Math.random() * 1000;
  const startTime = Date.now();
  const startAngle = spinAngle;

  function animate() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 1 ? 1 - Math.pow(1 - t, 4) : 1;
    spinAngle = startAngle + totalRotation * ease;

    const canvas = document.getElementById('spinCanvas');
    if (canvas) drawWheel(canvas, spinAngle);

    if (t < 1) {
      spinRAF = requestAnimationFrame(animate);
    } else {
      spinning = false;
      document.getElementById('spinBtn1').disabled = false;
      const spinBtn2b = document.getElementById('spinBtn2');
      if (spinBtn2b) spinBtn2b.disabled = false;

      // Determine winning segment based on the pointer at the top of the wheel
      const seg = SPIN_PRIZES.length;
      const arc = (2 * Math.PI) / seg;
      const normalizedAngle = ((spinAngle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
      const pointerAngle = (2 * Math.PI - normalizedAngle) % (2 * Math.PI);
      const idx = Math.floor(pointerAngle / arc) % seg;
      const prize = SPIN_PRIZES[idx] || SPIN_PRIZES[0];

      // Award prize (pending admin approval for higher amounts)
      if (prize.coins && prize.coins > 0) {
        u.coins += prize.coins;
        if (!u.txHistory) u.txHistory = [];
        u.txHistory.unshift({ type: 'spin', coins: prize.coins, desc: 'Spin wheel win: ' + prize.label, time: Date.now(), status: 'pending' });
      }
      saveData();

      // Record
      const record = { user: u.username, prize: prize.label, time: Date.now() };
      state.spinRecords.unshift(record);
      if (state.spinRecords.length > 20) state.spinRecords.pop();
      DB.set('spinRecords', state.spinRecords);

      renderSpinRecords();

      // Show result dialog
      const isZero = prize.coins === 0;
      document.getElementById('spinResultIcon').innerText = prize.coins >= 20 ? '🎰' : prize.coins >= 10 ? '💰' : isZero ? '📺' : '🎉';
      document.getElementById('spinResultTitle').innerText = isZero ? 'Better luck next time!' : 'You won ' + prize.label + '!';
      document.getElementById('spinResultDesc').innerText = isZero ? 'Watch an ad to get a bonus spin! 📺' : prize.coins + ' coins added · ⏳ Payout pending admin verification';
      document.getElementById('spinResultDialog').classList.add('open');
      if (document.getElementById('spinCoins')) document.getElementById('spinCoins').innerText = u.coins.toLocaleString();
      if (document.getElementById('spinTickets')) document.getElementById('spinTickets').innerText = u.spinTickets || 0;
      if (document.getElementById('headerCoins')) document.getElementById('headerCoins').innerText = u.coins.toLocaleString();
    }
  }
  spinRAF = requestAnimationFrame(animate);
}

function renderSpinRecords() {
  const c = document.getElementById('spinRecords');
  if (!c) return;
  if (state.spinRecords.length === 0) {
    c.innerHTML = `<p class="text-muted text-sm text-center" style="padding:20px;opacity:.5">No spins yet. Spin to win!</p>`;
    return;
  }
  c.innerHTML = state.spinRecords.slice(0, 8).map(r => `
<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
  <span style="font-size:.85rem;font-weight:500">${r.user}</span>
  <span style="font-weight:700;color:#ce93d8;font-size:.85rem">${r.prize}</span>
</div>`).join('');
}

function buyTickets() {
  showToast("Complete tasks and referrals to earn spin tickets!", "success");
}

function watchAdForSpin() {
  const u = state.currentUser;
  const today = new Date().toDateString();
  if (u.lastAdDate !== today) { u.adsWatchedToday = 0; u.lastAdDate = today; }
  if ((u.adsWatchedToday || 0) >= 5) return showToast("Daily ad limit reached (5/5). Come back tomorrow! 📅", "error");
  u.adsWatchedToday = (u.adsWatchedToday || 0) + 1;
  u.spinTickets = (u.spinTickets || 0) + 1;
  saveData();
  const remaining = 5 - u.adsWatchedToday;
  showToast("📺 Ad watched! +1 spin ticket 🎟️ (" + remaining + " ads left today)", "success");
  if (document.getElementById('spinTickets')) document.getElementById('spinTickets').innerText = u.spinTickets;
  if (document.getElementById('adsRemaining')) document.getElementById('adsRemaining').innerText = remaining + '/5 left today';
}

// ═══════════════════════════════════════════════════════
// FOLLOW & EARN
// ═══════════════════════════════════════════════════════
function followSocial(platform, coins, btn) {
  const u = state.currentUser;
  if (u.followedSocials.includes(platform)) {
    return showToast("Already followed! Bonus already claimed", "error");
  }
  if (btn.disabled) {
    return;
  }

  const links = {
    twitter: 'https://twitter.com/grow31official',
    telegram: 'https://t.me/+JhvCkrA8Fg8yZTVl',
    instagram: 'https://www.instagram.com/_grow31',
    youtube: 'https://www.youtube.com/@grow31-u3s',
    facebook: 'https://www.facebook.com/grow31official',
    whatsapp: 'https://wa.me/message/Y2CDYZEVKWA3M1'
  };
  const url = links[platform] || 'https://grow31.com';
  window.open(url, '_blank');

  btn.innerText = '⏳ Opened. Verifying...';
  btn.disabled = true;
  btn.classList.remove('btn-blue');
  btn.classList.add('btn-outline');

  // Simulated verification delay after redirect
  setTimeout(() => {
    if (!u.followedSocials.includes(platform)) {
      u.followedSocials.push(platform);
      u.coins += coins;
      if (!u.txHistory) u.txHistory = [];
      u.txHistory.unshift({ type: 'follow', coins, desc: 'Follow bonus: ' + platform, time: Date.now() });
      saveData();
      showToast('+' + coins + ' coins earned! 🎉', "success");
      if (document.getElementById('followCoins')) document.getElementById('followCoins').innerText = u.coins.toLocaleString();
      if (document.getElementById('headerCoins')) document.getElementById('headerCoins').innerText = u.coins.toLocaleString();
    }
    btn.innerText = '✓ Verified';
    btn.classList.remove('btn-outline');
    btn.classList.add('btn-green');
    btn.disabled = true;
  }, 25000);

  showToast("Opened the follow link. Verification will complete soon.", "success");
}

function doCheckIn() {
  const u = state.currentUser;
  const today = new Date().toDateString();
  if (u.checkedInToday && u.lastCheckIn === today) {
    return showToast("Already checked in today! Come back tomorrow", "error");
  }
  u.checkedInToday = true;
  u.lastCheckIn = today;
  u.coins += 5;
  u.streak++;
  u.spinTickets = (u.spinTickets || 0) + 1;
  if (!u.txHistory) u.txHistory = [];
  u.txHistory.unshift({ type: 'checkin', coins: 5, desc: 'Daily check-in bonus', time: Date.now() });
  saveData();
  showToast("✓ Checked in! +5 G-coins + 1 spin ticket 🎟️", "success");
  // Update home button
  const homeBtn = document.getElementById('homeCheckInBtn');
  if (homeBtn) {
    homeBtn.innerText = '✓ Checked In Today!';
    homeBtn.disabled = true;
    homeBtn.style.background = 'rgba(255,255,255,0.1)';
    homeBtn.style.color = 'rgba(255,255,255,0.5)';
    homeBtn.style.boxShadow = 'none';
    homeBtn.style.cursor = 'not-allowed';
  }
  // Update follow button if it exists
  const followBtn = document.getElementById('followCheckInBtn');
  if (followBtn) {
    followBtn.innerText = '✓ Checked In Today!';
    followBtn.disabled = true;
    followBtn.style.background = 'rgba(255,255,255,0.1)';
    followBtn.style.color = 'rgba(255,255,255,0.5)';
    followBtn.style.boxShadow = 'none';
    followBtn.style.cursor = 'not-allowed';
  }
  if (document.getElementById('followCoins')) document.getElementById('followCoins').innerText = u.coins.toLocaleString();
  updateRankBar(u);
}

// ═══════════════════════════════════════════════════════
// WINNERS TABS
// ═══════════════════════════════════════════════════════
function switchWinnersTab(tab) {
  ['winners', 'updates', 'schedule'].forEach(t => {
    document.getElementById(t + 'Tab').style.display = 'none';
    document.getElementById('wTab' + ['winners', 'updates', 'schedule'].indexOf(t) + 1).className = 'btn btn-outline btn-sm';
  });
  document.getElementById(tab + 'Tab').style.display = 'block';
  const idx = ['winners', 'updates', 'schedule'].indexOf(tab) + 1;
  document.getElementById('wTab' + idx).className = 'btn btn-blue btn-sm';
}

// ═══════════════════════════════════════════════════════
// REFERRAL
// ═══════════════════════════════════════════════════════
function openReferralDialog() {
  const u = state.currentUser;
  const refLink = u.refCode || 'Grow31/' + u.username;
  document.getElementById('myRefCodeDisplay').innerText = refLink;
  document.getElementById('refDialogCount').innerText = u.referrals;
  const tierCoinsPerRef = getTierCoinsPerReferral(u.tier || 1);
  document.getElementById('refDialogEarned').innerText = ((u.referrals || 0) * tierCoinsPerRef).toLocaleString();
  const refPerLabel = document.getElementById('refPerReferralLabel');
  if (refPerLabel) refPerLabel.innerText = '+' + tierCoinsPerRef + ' 🪙';

  // Render referral list
  const c = document.getElementById('refListContainer');
  if (c) {
    const list = u.referralList || [];
    if (list.length === 0) {
      c.innerHTML = `<p class="text-muted text-xs text-center" style="padding:12px;opacity:.5">No referrals yet. Share your link!</p>`;
    } else {
      c.innerHTML = list.map((r, i) => `
    <div class="ref-list-item">
      <div class="avatar av-default" style="width:30px;height:30px;font-size:.75rem;flex-shrink:0">${i + 1}</div>
      <div style="flex:1">
        <p style="font-size:.85rem;font-weight:600">${r.name || 'User'}</p>
        <p class="text-xs text-muted">${new Date(r.time).toLocaleDateString('en-IN')}</p>
      </div>
      <span class="badge badge-yellow" style="font-size:.65rem">+${getTierCoinsPerReferral(state.currentUser?.tier || 1)} 🪙</span>
    </div>`).join('');
    }
  }

  // Daily referral timer
  const timerEl = document.getElementById('refResetTimer');
  if (timerEl) {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    timerEl.innerText = h + 'h ' + m + 'm';
  }

  document.getElementById('refDialog').classList.add('open');
}

function copyRef() {
  const u = state.currentUser;
  const refLink = u.refCode || 'Grow31/' + u.username;
  const msg = 'Join Grow31 – 31 Days Challenge! Use my referral: ' + refLink + ' 🎉 Visit: https://grow31.com';
  navigator.clipboard.writeText(msg).then(() => showToast("Referral link copied! 📋")).catch(() => {
    const t = document.createElement('textarea');
    t.value = msg; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t);
    showToast("Referral link copied!");
  });
}

function shareRef() {
  const u = state.currentUser;
  if (!u || !u.refCode) return;
  const refLink = u.refCode || 'Grow31/' + u.username;
  const msg = 'Join Grow31 – 31 Days, Real Rewards! 🚀\nUse my referral: ' + refLink + '\nGet +50 bonus coins on signup! 🎁\nhttps://grow31.com';
  if (navigator.share) {
    navigator.share({ title: 'Grow31 Referral', text: msg }).catch(() => { });
  } else {
    navigator.clipboard.writeText(msg).then(() => showToast("Share text copied!")).catch(() => { });
  }
}

// ═══════════════════════════════════════════════════════
// DRAWER
// ═══════════════════════════════════════════════════════
function openDrawer() {
  const u = state.currentUser;
  if (u) {
    const drawerName = document.getElementById('drawerName');
    const drawerPhone = document.getElementById('drawerPhone');
    const drawerAvatar = document.getElementById('drawerAvatar');

    if (drawerName) drawerName.innerText = u.username;
    if (drawerPhone) drawerPhone.innerText = '+91 ' + u.phone;
    updateAvatarDisplays();
  }

  const overlay = document.getElementById('drawerOverlay');
  const drawer = document.getElementById('mainDrawer');
  if (overlay) overlay.classList.add('open');
  if (drawer) drawer.classList.add('open');
  updateMobileBackBtn();
  if (window.lucide) lucide.createIcons();
}

function closeDrawer() {
  const drawer = document.getElementById('mainDrawer');
  if (drawer) drawer.classList.remove('open');
  const overlay = document.getElementById('drawerOverlay');
  if (overlay) overlay.classList.remove('open');
  updateMobileBackBtn();
  if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════
// LANGUAGE / COUNTRY DIALOGS
// ═══════════════════════════════════════════════════════
function showLangDialog() {
  const c = document.getElementById('langOptions');
  if (!c) return;
  c.innerHTML = LANGS.map(l => `
<div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="setLang('${l.code}')">
  <span style="font-size:.95rem;font-weight:500">${l.label}</span>
  ${(state.currentUser?.lang || 'en') === l.code ? '<span class="badge badge-green">✓ Active</span>' : '<span class="text-muted text-sm">›</span>'}
</div>`).join('');
  const dialog = document.getElementById('langDialog');
  if (dialog) { dialog.classList.add('open'); if (window.lucide) lucide.createIcons(); }
}

function setLang(code) {
  if (state.currentUser) { state.currentUser.lang = code; saveData(); }
  closeDialog('langDialog');
  showToast("Language updated!");
  renderMore();
}

function showCountryDialog() {
  const c = document.getElementById('countryOptions');
  if (!c) return;
  c.innerHTML = COUNTRIES.map(ct => `
<div style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="setCountry('${ct.code}')">
  <span style="font-size:.95rem;font-weight:500">${ct.label}</span>
  ${(state.currentUser?.country || 'IN') === ct.code ? '<span class="badge badge-green">✓ Active</span>' : '<span class="text-muted text-sm">›</span>'}
</div>`).join('');
  const dialog = document.getElementById('countryDialog');
  if (dialog) { dialog.classList.add('open'); if (window.lucide) lucide.createIcons(); }
}

function setCountry(code) {
  if (state.currentUser) { state.currentUser.country = code; saveData(); }
  closeDialog('countryDialog');
  showToast("Country updated!");
  renderMore();
}

// ═══════════════════════════════════════════════════════
// AI CHAT
// ═══════════════════════════════════════════════════════
let chatHistory = [];

async function sendChat() {
  const input = document.getElementById('chatInput');
  if (!input) return;

  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  appendBubble(msg, 'user');
  chatHistory.push({ role: 'user', content: msg });

  const typing = appendBubble('...', 'ai');

  try {
    // Use fallback responses instead of unsafe API calls
    const fallbacks = [
      "You earn coins through daily tasks (+10-15 each), referrals (+50 each), spin wheel wins, social follows, and daily check-ins!",
      "The tier system has 31 levels. Tier 1 has 1 member (entry), Tier 31 has 1,073,741,824 members! Advance by completing referrals.",
      "Daily competition: Days 1-6 have 1 referral win and 1 pool win per day. Higher days unlock more winners!",
      "To spin the wheel, you need spin tickets (from daily check-ins) or spin tokens. Prizes range from 10 coins to 500,000 coins!",
      "Complete your daily tasks and refer friends to earn coins and advance through tiers. The more you refer, the higher your tier!"
    ];
    const reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    if (typing) typing.innerText = reply;
    chatHistory.push({ role: 'assistant', content: reply });
  } catch (e) {
    if (typing) typing.innerText = "I'm having trouble connecting. Please try again!";
    chatHistory.push({ role: 'assistant', content: "I'm having trouble connecting. Please try again!" });
  }

  // Scroll to bottom
  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function appendBubble(text, type) {
  const d = document.getElementById('chatMessages');
  if (!d) return null;
  const b = document.createElement('div');
  b.className = `chat-bubble ${type}`;
  b.innerText = text;
  d.appendChild(b);
  d.scrollTop = d.scrollHeight;
  if (window.lucide) lucide.createIcons();
  return b;
}

function clearChat() {
  chatHistory = [];
  const d = document.getElementById('chatMessages');
  if (d) {
    d.innerHTML = `<div class="chat-bubble ai">👋 Hi! I'm your Grow31 AI assistant. Ask me anything about the challenge, tiers, spin wheel, referrals, or how to earn more coins!</div>`;
  }
}

// ═══════════════════════════════════════════════════════
// WALLET
// ═══════════════════════════════════════════════════════
function openWalletDialog() {
  const u = state.currentUser;
  if (!u) return;
  document.getElementById('walletBalance').innerText = u.coins.toLocaleString();
  const txEl = document.getElementById('walletTxList');
  if (txEl) {
    const history = u.txHistory || [];
    if (history.length === 0) {
      txEl.innerHTML = `<p class="text-muted text-xs text-center" style="padding:16px;opacity:.5">No transactions yet</p>`;
    } else {
      txEl.innerHTML = history.slice(0, 20).map(tx => {
        const d = new Date(tx.time);
        const dateStr = d.toLocaleDateString('en-IN') + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const icon = tx.type === 'spin' ? '🎡' : tx.type === 'referral' ? '👥' : tx.type === 'follow' ? '❤️' : tx.type === 'task' ? '✅' : tx.type === 'profile' ? '✨' : '💰';
        return `<div class="wallet-tx">
      <div>
        <span style="font-size:.82rem">${icon} ${tx.desc || 'Transaction'}</span>
        <p class="text-xs text-muted" style="margin-top:2px">${dateStr}</p>
      </div>
      <span class="wallet-${tx.coins > 0 ? 'credit' : 'pending'}">+${tx.coins} <span class="g-coin"></span></span>
    </div>`;
      }).join('');
    }
  }
  openDialog('walletDialog');
}

// ═══════════════════════════════════════════════════════
// USERNAME EDIT
// ═══════════════════════════════════════════════════════
function openUsernameEditDialog() {
  const inp = document.getElementById('newUsernameInput');
  if (inp) inp.value = state.currentUser.username || '';
  openDialog('usernameEditDialog');
}

function saveNewUsername() {
  const inp = document.getElementById('newUsernameInput');
  const newName = (inp?.value || '').trim();
  if (!newName || newName.length < 3) return showToast("Username must be at least 3 characters", "error");
  if (newName.length > 20) return showToast("Username too long (max 20)", "error");
  state.currentUser.username = newName;
  // Regenerate referral code with new username
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  state.currentUser.refCode = 'Grow31/' + newName + '-' + randomNum;
  saveData();
  closeDialog('usernameEditDialog');
  showToast("Username updated! ✓", "success");
  renderMore();
  renderDash();
}

function updateAvatarDisplays() {
  const u = state.currentUser;
  if (!u) return;
  const finalUrl = getAvatarUrl(u);

  const displays = ['dashAvatar', 'moreAvatar', 'drawerAvatar', 'rankBarAvatar', 'navMoreAvatar', 'avatarPickerBtn', 'completeProfileAvatar'];
  displays.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('avatar-sleek');
    if (finalUrl) {
      el.style.backgroundImage = `url('${finalUrl}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.innerHTML = '';
    } else {
      el.style.backgroundImage = 'none';
      el.innerHTML = '🧑';
    }
  });
  if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════
// CONTACT
// ═══════════════════════════════════════════════════════
function sendContactMsg() {
  const msg = document.getElementById('contactMsg')?.value?.trim() || '';
  if (!msg) return showToast("Please write your message", "error");
  // In production, send via API/email
  showToast("Message sent! We'll reply within 24 hours 📬", "success");
  document.getElementById('contactMsg').value = '';
}

// ═══════════════════════════════════════════════════════
// ADMIN
// ═══════════════════════════════════════════════════════
function switchAdminTab(t, btn) {
  if (!btn) return;
  document.querySelectorAll('#adminView .tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('#adminView .tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById('atab-' + t);
  if (panel) panel.classList.add('active');
  if (t === 'users') renderAdminUsers();
  if (window.lucide) lucide.createIcons();
}

function renderAdminUsers() {
  const c = document.getElementById('adminUserList');
  if (!c) return;
  c.innerHTML = '';
  Object.values(state.allUsers).forEach(u => {
    const tierNum = u.tier || 31;
    const qPos = u.queuePosition || 1;
    c.innerHTML += `
  <div class="admin-user-card">
    <div><b style="font-family:'Poppins',sans-serif">${u.username}</b><br>
      <small class="text-muted">${u.phone}</small><br>
      <small class="text-muted" style="font-size:.65rem">${u.refCode || '—'}</small>
    </div>
    <div class="text-right">
      <span class="badge badge-yellow" style="color:#FFD700">🪙 ${u.coins.toLocaleString()}</span><br>
      <small class="text-muted" style="margin-top:4px;display:block">Tier ${tierNum} · Q#${qPos}</small>
      <small class="text-muted">Refs: ${u.referrals || 0}</small><br>
      <button class="btn btn-green btn-sm" style="margin-top:4px;font-size:.65rem;padding:3px 8px" onclick="adminVerifyPayout('${u.phone}')">✓ Verify Payout</button>
    </div>
  </div>`;
  });
  if (window.lucide) lucide.createIcons();
}

function adminVerifyPayout(phone) {
  const u = state.allUsers[phone];
  if (!u) return;
  u.payoutStatus = 'verified';
  if (!u.txHistory) u.txHistory = [];
  u.txHistory.unshift({ type: 'payout', coins: 0, desc: 'Payout verified by admin', time: Date.now() });
  saveData();
  showToast("Payout verified for " + u.username, "success");
  renderAdminUsers();
}

function addRewardAdmin() {
  const name = document.getElementById('admRewName')?.value || '';
  const tier = document.getElementById('admRewTier')?.value || '';
  const val = document.getElementById('admRewValue')?.value || '';
  const desc = document.getElementById('admRewDesc')?.value || '';

  if (!name || !val) return showToast("Fill all fields", "error");
  state.globalRewards.push({ id: 'r' + Date.now(), name, tier, value: val, description: desc });
  DB.set('globalRewards', state.globalRewards);
  showToast("Reward Added!", "success");

  const nameInput = document.getElementById('admRewName');
  const descInput = document.getElementById('admRewDesc');
  if (nameInput) nameInput.value = '';
  if (descInput) descInput.value = '';
}


// ═══════════════════════════════════════════════════════
// TIER-BASED COINS PER REFERRAL
// ═══════════════════════════════════════════════════════
function getTierCoinsPerReferral(tierNum) {
  // Referral bonus is fixed for all users to keep counts stable.
  return 50;
}

// Get tier price (₹1 per tier: Tier 1 = ₹1, Tier 2 = ₹2, ..., Tier 31 = ₹31)
function getTierPrice(tierNum) {
  return Math.max(1, Math.min(MAX_TIERS, tierNum || 1));
}

function getUserOwnedTiers(user) {
  const ownedTierCount = Number(user?.ownedTiers?.length ?? user?.tiersOwned ?? 1);
  return Math.max(1, ownedTierCount);
}

function getGlobalOccupiedTiers() {
  return Object.values(state.allUsers).reduce((sum, user) => sum + getUserOwnedTiers(user), 0);
}



function openAvatarPicker() {
  const u = state.currentUser;
  const grid = document.getElementById('avatarOptionsGrid');
  if (!grid) return;

  grid.innerHTML = '';
  AVATARS.forEach(av => {
    const opt = document.createElement('div');
    opt.className = `av-option ${u.avatar === av.id ? 'selected' : ''}`;
    opt.style.background = 'rgba(255,255,255,0.05)';
    opt.innerHTML = `<img src="${av.url}" style="width:80%;height:80%">`;
    opt.onclick = () => {
      u.avatar = av.id;
      u.photoUrl = null;
      updateAvatarDisplays();
      openAvatarPicker();
      saveData();
      
      // Live update leaderboard
      const sorted = Object.values(state.allUsers).sort((a, b) => b.coins - a.coins);
      renderLeaderboard(sorted);
    };
    grid.appendChild(opt);
  });

  openDialog('avatarPickerDialog');
}

function generateRandomAvatar() {
  const u = state.currentUser;
  const seed = Math.random().toString(36).substring(7);
  const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}`;
  u.avatar = url;
  u.photoUrl = null;
  updateAvatarDisplays();
  saveData();
  showToast('Random avatar generated! 🎨', 'success');
  closeDialog('avatarPickerDialog');
  
  // Live update leaderboard
  const sorted = Object.values(state.allUsers).sort((a, b) => b.coins - a.coins);
  renderLeaderboard(sorted);
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) return showToast('Image too large. Max 2MB.', 'error');

  const reader = new FileReader();
  reader.onload = (e) => {
    const url = e.target.result;
    state.currentUser.photoUrl = url;
    state.currentUser.avatar = 'custom';
    updateAvatarDisplays();
    closeDialog('avatarPickerDialog');
    saveData();
    showToast('Profile photo updated!', 'success');
  };
  reader.readAsDataURL(file);
}

function getTierByIndex(index) {
  let remaining = index;
  for (let tier = MAX_TIERS; tier >= 1; tier--) {
    const capacity = TIERS[tier - 1].members;
    if (remaining <= capacity) {
      return tier;
    }
    remaining -= capacity;
  }
  return 1;
}

function getTierPurchasePlan(qty, startingOwned) {
  const owned = Number(startingOwned ?? getGlobalOccupiedTiers());
  const tiers = [];
  const startIndex = owned + 1;
  for (let i = 0; i < qty; i++) {
    const tierIndex = startIndex + i;
    const tier = getTierByIndex(tierIndex);
    const price = getTierPrice(tier);
    tiers.push({ tier, price, index: tierIndex });
  }
  const total = tiers.reduce((sum, item) => sum + item.price, 0);
  return { qty, tiers, total };
}

function getNextTierPrice() {
  const plan = getTierPurchasePlan(1);
  return plan.tiers[0]?.price || TIER_PRICE;
}

// ═══════════════════════════════════════════════════════
// BUY MORE TIERS DIALOG
// ═══════════════════════════════════════════════════════
function openBuyTiersDialog() {
  const u = state.currentUser;
  if (!u) return;
  const nextPlan = getTierPurchasePlan(1);
  const nextTier = nextPlan.tiers[0]?.tier || (u?.tier || MAX_TIERS);
  const nextPrice = nextPlan.tiers[0]?.price || getNextTierPrice();
  const qPos = u.queuePosition || 1;
  const poolSize = TIERS[nextTier - 1]?.members || 1;

  document.getElementById('bsCurrentTier').innerText = 'Tier ' + nextTier;
  const queueEl = document.getElementById('bsQueuePos');
  if (queueEl) queueEl.innerText = '#' + qPos;
  const poolEl = document.getElementById('bsPoolSize');
  if (poolEl) poolEl.innerText = poolSize.toLocaleString() + ' seats';
  const priceEl = document.getElementById('bsPerTierPrice');
  if (priceEl) priceEl.innerText = '₹' + nextPrice;

  updateBuyTierPrice();

  openDialog('buyTiersDialog');
}

function updateBuyTierPrice() {
  const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('bsQty')?.value || 1)));
  const plan = getTierPurchasePlan(qty);
  const el = document.getElementById('bsTotalPrice');
  if (el) el.innerText = '₹' + plan.total;
  const perTier = document.getElementById('bsPerTier');
  if (perTier) {
    const prices = plan.tiers.map(item => item.price);
    if (new Set(prices).size === 1) {
      perTier.innerText = qty + ' tier' + (qty > 1 ? 's' : '') + ' @ ₹' + prices[0] + ' each';
    } else {
      perTier.innerText = qty + ' tiers · ' + prices.map(p => '₹' + p).join(' + ');
    }
  }
}

function changeBuyQty(delta) {
  const inp = document.getElementById('bsQty');
  if (!inp) return;
  let val = parseInt(inp.value || 1) + delta;
  if (val < 1) val = 1;
  if (val > 10) val = 10;
  inp.value = val;
  updateBuyTierPrice();
}

function confirmBuyTiers() {
  const qty = Math.max(1, Math.min(10, parseInt(document.getElementById('bsQty')?.value || 1)));
  const plan = getTierPurchasePlan(qty);
  const total = plan.total;
  state.isBuyingSlots = true;
  closeDialog('buyTiersDialog');

  state.pendingPayment = { qty, total, plan };
  document.getElementById('paymentTierInfo').innerHTML =
    '<div style="background:rgba(156,39,176,0.1);border:1px solid rgba(156,39,176,0.3);border-radius:12px;padding:14px;margin-bottom:16px;text-align:center">' +
    '<p style="font-weight:700;font-size:1rem;color:#ce93d8">📦 Buying ' + qty + ' tier' + (qty > 1 ? 's' : '') + '</p>' +
    '<p class="text-muted text-xs" style="margin-top:4px">Next tiers: ' + plan.tiers.map(item => 'Tier ' + item.tier + ' @ ₹' + item.price).join(' + ') + ' = ₹' + total + '</p>' +
    '</div>';
  document.getElementById('payBtnText').innerText = 'Pay ₹' + total + ' for ' + qty + ' tier' + (qty > 1 ? 's' : '') + ' →';

  showView('paymentView');
}

// ═══════════════════════════════════════════════════════
// AVATAR PHOTO UPLOAD
// ═══════════════════════════════════════════════════════
function triggerPhotoUpload() {
  document.getElementById('avatarPhotoInput')?.click();
}

function handlePhotoUpload(input) {
  const file = input.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return showToast("Please select an image", "error");
  const reader = new FileReader();
  reader.onload = function (e) {
    const dataUrl = e.target.result;
    if (!state.currentUser) return;
    state.currentUser.avatarPhoto = dataUrl;
    updateAvatarDisplays();
    closeDialog('emojiDialog');
    closeDialog('usernameEditDialog');
    saveData();
    showToast("Photo updated! 📸", "success");
    renderMore();
    renderDash();
    // Live update leaderboard
    const sorted = Object.values(state.allUsers).sort((a, b) => b.coins - a.coins);
    renderLeaderboard(sorted);
  };
  reader.readAsDataURL(file);
  input.value = ''; // Reset for next selection
}



// ═══════════════════════════════════════════════════════
// COUNTDOWN TIMERS FOR WINNERS & LEADERBOARD
// ═══════════════════════════════════════════════════════
let countdownInterval = null;

function startCountdownTimers() {
  if (countdownInterval) clearInterval(countdownInterval);
  updateCountdowns();
  countdownInterval = setInterval(updateCountdowns, 1000);
}

function updateCountdowns() {
  const now = new Date();
  // Next midnight = reset time
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const timeStr = h + 'h ' + m + 'm ' + s + 's';

  document.querySelectorAll('.countdown-timer').forEach(el => {
    el.innerText = timeStr;
  });
}

// ═══════════════════════════════════════════════════════
// PERKS SYSTEM
// ═══════════════════════════════════════════════════════
function openPerksView() {
  const u = state.currentUser;
  if (u) {
    const perksCoinsEl = document.getElementById('perksCoins');
    if (perksCoinsEl) perksCoinsEl.innerText = u.coins.toLocaleString();
    const perksRefCountEl = document.getElementById('perksRefCount');
    if (perksRefCountEl) perksRefCountEl.innerText = (u.referrals || 0) + ' refs';
  }
  renderPerks();
  showView('perksView');
}

function renderPerks() {
  const u = state.currentUser;
  const refs = u.referrals || 0;
  const c = document.getElementById('perksList');
  if (!c) return;

  const perks = [
    { id: 'giveaway', title: '🎁 Giveaway Entry', desc: 'Enter exclusive giveaways and win real prizes!', req: 2, icon: '🎁', color: '#ce93d8' },
    { id: 'spinbonus', title: '🎰 Extra Spin Tickets', desc: 'Get +5 bonus spin tickets every day', req: 5, icon: '🎡', color: '#448aff' },
    { id: 'coinboost', title: '⚡ Coin Boost x2', desc: 'Double coins from all tasks for 7 days', req: 10, icon: '⚡', color: '#ffa726' },
    { id: 'vip', title: '👑 VIP Badge', desc: 'Exclusive VIP badge and leaderboard highlight', req: 20, icon: '👑', color: '#f5c518' },
  ];

  c.innerHTML = perks.map(p => {
    const unlocked = refs >= p.req;
    const pct = Math.min(100, Math.round((refs / p.req) * 100));
    return `
  <div style="background:${unlocked ? 'rgba(0,230,118,0.05)' : 'rgba(255,255,255,0.04)'};border:1px solid ${unlocked ? 'rgba(0,230,118,0.25)' : 'rgba(255,255,255,0.08)'};border-radius:16px;padding:18px;margin-bottom:12px;transition:all .2s">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
      <div style="width:48px;height:48px;background:${p.color}22;border:1px solid ${p.color}44;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;flex-shrink:0">${p.icon}</div>
      <div style="flex:1">
        <p style="font-weight:700;font-size:.95rem;margin-bottom:2px">${p.title}</p>
        <p class="text-muted text-xs">${p.desc}</p>
      </div>
      ${unlocked ? '<span class="badge badge-green">✓ Unlocked</span>' : '<span class="badge badge-gray">🔒 Locked</span>'}
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <div class="progress-track" style="flex:1;height:5px">
        <div class="progress-fill" style="width:${pct}%;background:${unlocked ? '#00e676' : p.color}"></div>
      </div>
      <span class="text-xs text-muted">${refs}/${p.req} refs</span>
    </div>
    ${unlocked && p.id === 'giveaway' ? '<button class="btn btn-green btn-full btn-sm" style="margin-top:10px" onclick="enterGiveaway()">Enter Giveaway 🎁</button>' : ''}
    ${!unlocked && p.id === 'giveaway' ? '<p class="text-xs text-muted text-center" style="margin-top:8px">Need <b style="color:#ce93d8">' + (p.req - refs) + ' more referrals</b> to unlock</p>' : ''}
  </div>`;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

function enterGiveaway() {
  showToast("🎉 You've entered the giveaway! Winner announced at midnight.", "success");
}

// ═══════════════════════════════════════════════════════
// PAYMENT PAGE TIER DISPLAY
// ═══════════════════════════════════════════════════════
function showPaymentWithTierInfo() {
  const u = state.currentUser;
  if (!u) return;
  const pending = state.pendingPayment || { qty: 1, total: getNextTierPrice(), plan: getTierPurchasePlan(1) };
  const plan = pending.plan || getTierPurchasePlan(pending.qty);
  const qPos = u.queuePosition || 1;
  const nextTier = plan.tiers[0];
  const priceSummary = plan.tiers.map(item => '₹' + item.price).join(' + ');
  const el = document.getElementById('paymentTierInfo');
  if (el) {
    el.innerHTML = '<div style="background:rgba(156,39,176,0.1);border:1px solid rgba(156,39,176,0.3);border-radius:12px;padding:14px;margin-bottom:16px;text-align:center">' +
      '<p style="font-weight:700;color:#ce93d8">🎰 Next tier: <span style="font-size:1.2rem">Tier ' + nextTier.tier + '</span></p>' +
      '<p class="text-muted text-xs" style="margin-top:4px">Queue #' + qPos + ' · Price per tier: ₹' + nextTier.price + '</p>' +
      '<p class="text-muted text-xs" style="margin-top:8px">Purchasing <b>' + pending.qty + ' tier' + (pending.qty > 1 ? 's' : '') + '</b> for ₹' + pending.total + '</p>' +
      '<p class="text-muted text-xs" style="margin-top:4px;color:#ddd">(' + priceSummary + ')</p>' +
      '</div>';
  }
}

function resetAllData() {
  if (confirm("Delete everything?")) { localStorage.clear(); location.reload(); }
}

function adminShortcut() { showView('adminView') }

function exitAdmin() { if (state.currentUser) loginSuccess(); }

// ═══════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════
function syncFixedBarHeights() {
  const root = document.documentElement;
  const nav = document.querySelector('.bottom-nav');
  const rank = document.getElementById('stickyRankBar');
  if (nav) {
    const navH = Math.ceil(nav.getBoundingClientRect().height || 0);
    if (navH > 0) root.style.setProperty('--nav-height', navH + 'px');
  }
  if (rank) {
    const rankH = Math.ceil(rank.getBoundingClientRect().height || 0);
    if (rankH > 0) root.style.setProperty('--rankbar-height', rankH + 'px');
  }
}

function updateMobileBackBtn() {
  const btn = document.getElementById('mobileBackBtn');
  if (!btn) return;
  const isSmall = window.matchMedia('(max-width: 680px)').matches;
  const hasDialog = !!document.querySelector('.dialog-overlay.open');
  const drawerOpen = document.getElementById('mainDrawer')?.classList.contains('open');
  const dashActive = document.getElementById('dashView')?.classList.contains('active');
  const canBack = hasDialog || drawerOpen || viewHistory.length > 1 || (dashActive && currentDashPage !== 'pageHome');
  btn.style.display = (isSmall && canBack) ? 'inline-flex' : 'none';
}

function mobileBackAction() {
  const openDialog = document.querySelector('.dialog-overlay.open');
  if (openDialog) {
    openDialog.classList.remove('open');
    updateMobileBackBtn();
    return;
  }
  if (document.getElementById('mainDrawer')?.classList.contains('open')) {
    closeDrawer();
    updateMobileBackBtn();
    return;
  }
  const dashActive = document.getElementById('dashView')?.classList.contains('active');
  if (dashActive && currentDashPage !== 'pageHome') {
    showDashPage('pageHome');
    updateMobileBackBtn();
    return;
  }
  goBack();
  updateMobileBackBtn();
}

let viewHistory = ['authView'];
function pushView(id) {
  if (viewHistory[viewHistory.length - 1] !== id) {
    viewHistory.push(id);
  }
  if (viewHistory.length > 10) viewHistory.shift();
}
function goBack() {
  if (state.isBuyingSlots) {
    state.isBuyingSlots = false;
    showView('dashView', false);
    renderDash();
    openBuyTiersDialog();
    return;
  }
  if (viewHistory.length > 1) {
    viewHistory.pop();
    const prev = viewHistory[viewHistory.length - 1];
    if (prev === 'authView' && state.currentUser) {
      showView('dashView', false);
      renderDash();
      initSpinWheel();
      return;
    }
    showView(prev, false);
    if (prev === 'dashView') { renderDash(); initSpinWheel(); }
  } else if (state.currentUser) {
    showView('dashView', false);
    renderDash();
    initSpinWheel();
  } else {
    showView('authView', false);
  }
  syncFixedBarHeights();
  updateMobileBackBtn();
}
function showView(id, addHistory = true) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('active');
    v.style.display = 'none';
  });
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'flex';
  el.classList.add('active');

  // Persist view for refresh recovery
  if (id !== 'splashView' && id !== 'authView' && id !== 'termsView') {
    state.currentView = id;
    DB.set('lastView', id);
  }

  if (addHistory) pushView(id);
  if (id === 'paymentView') {
    updatePaymentView();
  }
  syncFixedBarHeights();
  updateMobileBackBtn();
  if (window.lucide) lucide.createIcons();
}

function openDialog(id) {
  const d = document.getElementById(id);
  if (d) {
    d.classList.add('open');
    updateMobileBackBtn();
    if (window.lucide) lucide.createIcons();
  }
}

function closeDialog(id) {
  const d = document.getElementById(id);
  if (d) {
    d.classList.remove('open');
    updateMobileBackBtn();
    if (window.lucide) lucide.createIcons();
  }
}

function showToast(m, type = "success") {
  const c = document.getElementById('toastContainer');
  const e = document.createElement('div');
  e.className = `toast ${type}`;
  e.innerText = m;
  c.appendChild(e);
  setTimeout(() => e.remove(), 3000);
}

function backToDash() {
  showView('dashView');
  renderDash();
  initSpinWheel();
}

function goToProfileSetup() { showView('profileSetupView') }

function initTasks() {
  const taskList = [
    { title: 'Morning Walk 🚶 (10 mins)' },
    { title: 'Read 10 Pages 📖' },
    { title: 'Drink 8 Glasses of Water 💧' },
    { title: 'Journaling ✍️ (5 mins)' },
    { title: '10-Min Meditation 🧘' },
    { title: 'Evening Exercise 🏋️ (15 mins)' },
    { title: 'No Social Media for 1 Hour 📵' },
    { title: 'Eat a Healthy Meal 🥗' },
    { title: 'Sleep by 11 PM 😴' },
    { title: 'Write a Gratitude Note 🙏' },
  ];
  const tasks = [];
  for (let d = 1; d <= 31; d++) {
    taskList.forEach((t, i) => {
      tasks.push({ id: d * 100 + i, day: d, title: t.title, reward: 5, done: false });
    });
  }
  return tasks;
}

// ═══════════════════════════════════════════════════════
// QUIZ SYSTEM
// ═══════════════════════════════════════════════════════
const QUIZ_QUESTIONS = [
  {
    q: "How many days does the Grow31 challenge last?",
    opts: ["21 Days", "28 Days", "31 Days", "45 Days"],
    ans: 2
  },
  {
    q: "What do you earn by completing daily tasks?",
    opts: ["Points", "Stars", "🪙 Coins", "Badges"],
    ans: 2
  },
  {
    q: "How many coins does each daily task give you?",
    opts: ["2 Coins", "5 Coins", "10 Coins", "20 Coins"],
    ans: 1
  },
  {
    q: "What is the maximum number of daily tasks?",
    opts: ["5", "8", "10", "15"],
    ans: 2
  },
  {
    q: "How many questions are in the daily quiz?",
    opts: ["5", "8", "10", "12"],
    ans: 2
  },
  {
    q: "What happens when you refer a friend?",
    opts: ["Nothing", "You get coins", "They get banned", "You lose coins"],
    ans: 1
  },
  {
    q: "Which tier is the highest (top) tier?",
    opts: ["Tier 1", "Tier 15", "Tier 31", "Tier 10"],
    ans: 2
  },
  {
    q: "When is the daily tier login bonus credited?",
    opts: ["Every hour", "Every login", "Once per day", "Never"],
    ans: 2
  },
  {
    q: "What is the formula for the daily tier bonus?",
    opts: ["Tier × 5", "Tier × 10", "Tier × 2", "Fixed 50 coins"],
    ans: 1
  },
  {
    q: "How can you get free Spin tickets?",
    opts: ["Buy only", "Watch an ad", "Invite 10 friends", "Complete all tasks"],
    ans: 1
  }
];

let quizState = {
  current: 0,
  score: 0,
  answered: false,
  done: false,
  lastDate: ''
};

function renderQuiz() {
  const u = state.currentUser;
  const today = new Date().toDateString();

  // Load saved quiz state for today
  if (!u.quizState || u.quizState.date !== today) {
    u.quizState = { date: today, current: 0, score: 0, done: false };
    saveData();
  }
  quizState = {
    current: u.quizState.current || 0,
    score: u.quizState.score || 0,
    answered: false,
    done: u.quizState.done || false,
    lastDate: today
  };

  if (quizState.done) {
    showQuizResult();
    return;
  }
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const qContainer = document.getElementById('quizContainer');
  const qResult = document.getElementById('quizResult');
  if (!qContainer) return;
  qResult.style.display = 'none';
  qContainer.style.display = 'block';

  const total = QUIZ_QUESTIONS.length;
  const idx = quizState.current;
  const pct = Math.round((idx / total) * 100);
  const progBar = document.getElementById('quizProgressBar');
  if (progBar) progBar.style.width = pct + '%';

  if (idx >= total) {
    showQuizResult();
    return;
  }

  const q = QUIZ_QUESTIONS[idx];
  qContainer.innerHTML = `
<div class="card" style="margin-bottom:16px;overflow:visible">
  <div class="card-content" style="padding:20px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:6px">
      <span class="badge badge-blue">Q${idx + 1} of ${total}</span>
      <span style="font-size:.78rem;color:#FFD700;font-weight:600">+5 🪙 if correct</span>
    </div>
    <p style="font-family:'Poppins',sans-serif;font-size:1rem;font-weight:700;line-height:1.5;margin-bottom:18px">${q.q}</p>
    <div id="quizOpts" style="display:flex;flex-direction:column;gap:10px">
      ${q.opts.map((opt, i) => `
        <button onclick="selectQuizAnswer(${i})" id="qopt${i}" style="
          width:100%;text-align:left;padding:13px 16px;border-radius:12px;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
          color:#fff;font-size:.92rem;font-weight:500;cursor:pointer;
          transition:all .2s ease;font-family:'Poppins',sans-serif;
        " onmouseover="if(!this.dataset.locked)this.style.background='rgba(68,138,255,0.15)'"
           onmouseout="if(!this.dataset.locked)this.style.background='rgba(255,255,255,0.06)'">
          <span style="display:inline-block;width:24px;height:24px;border-radius:50%;
            background:rgba(68,138,255,0.2);color:#82b1ff;font-size:.72rem;font-weight:700;
            text-align:center;line-height:24px;margin-right:10px">${String.fromCharCode(65 + i)}</span>
          ${opt}
        </button>
      `).join('')}
    </div>
  </div>
</div>
<div id="quizFeedback" style="display:none;padding:14px;border-radius:12px;margin-bottom:14px;text-align:center;font-weight:600"></div>
<button id="quizNextBtn" onclick="nextQuizQuestion()" style="display:none" class="btn btn-white btn-full btn-lg">
  ${idx + 1 < total ? 'Next Question →' : 'See Results 🎉'}
</button>
`;
}

function selectQuizAnswer(selected) {
  if (quizState.answered) return;
  quizState.answered = true;

  const q = QUIZ_QUESTIONS[quizState.current];
  const isCorrect = selected === q.ans;
  if (isCorrect) quizState.score++;

  const feedback = document.getElementById('quizFeedback');
  const nextBtn = document.getElementById('quizNextBtn');

  q.opts.forEach((_, i) => {
    const btn = document.getElementById('qopt' + i);
    if (!btn) return;
    btn.dataset.locked = '1';
    btn.style.cursor = 'default';
    if (i === q.ans) {
      btn.style.background = 'rgba(0,230,118,0.2)';
      btn.style.borderColor = 'rgba(0,230,118,0.5)';
      btn.style.color = '#00e676';
    } else if (i === selected && !isCorrect) {
      btn.style.background = 'rgba(255,82,82,0.2)';
      btn.style.borderColor = 'rgba(255,82,82,0.5)';
      btn.style.color = '#ff8a80';
    }
  });

  if (feedback) {
    feedback.style.display = 'block';
    if (isCorrect) {
      feedback.style.background = 'rgba(0,230,118,0.12)';
      feedback.style.border = '1px solid rgba(0,230,118,0.3)';
      feedback.style.color = '#00e676';
      feedback.innerHTML = '✅ Correct! +5 🪙';
    } else {
      feedback.style.background = 'rgba(255,82,82,0.12)';
      feedback.style.border = '1px solid rgba(255,82,82,0.3)';
      feedback.style.color = '#ff8a80';
      feedback.innerHTML = '❌ Wrong! Correct: <b>' + q.opts[q.ans] + '</b>';
    }
  }

  if (nextBtn) nextBtn.style.display = 'flex';

  const progBar = document.getElementById('quizProgressBar');
  if (progBar) {
    const pct = Math.round(((quizState.current + 1) / QUIZ_QUESTIONS.length) * 100);
    progBar.style.width = pct + '%';
  }
}

function nextQuizQuestion() {
  quizState.current++;
  quizState.answered = false;

  const u = state.currentUser;
  if (!u.quizState) u.quizState = {};
  u.quizState.current = quizState.current;
  u.quizState.score = quizState.score;
  u.quizState.date = quizState.lastDate;

  if (quizState.current >= QUIZ_QUESTIONS.length) {
    const earned = quizState.score * 5;
    u.coins += earned;
    if (!u.txHistory) u.txHistory = [];
    u.txHistory.unshift({ type: 'quiz', coins: earned, desc: 'Daily Quiz: ' + quizState.score + '/' + QUIZ_QUESTIONS.length + ' correct', time: Date.now() });
    u.quizState.done = true;
    quizState.done = true;
    saveData();
    showQuizResult();
  } else {
    u.quizState.done = false;
    saveData();
    renderQuizQuestion();
  }
}

function showQuizResult() {
  const qContainer = document.getElementById('quizContainer');
  const qResult = document.getElementById('quizResult');
  if (qContainer) qContainer.style.display = 'none';
  if (qResult) qResult.style.display = 'block';

  const total = QUIZ_QUESTIONS.length;
  const score = quizState.score;
  const earned = score * 5;

  const progBar = document.getElementById('quizProgressBar');
  if (progBar) progBar.style.width = '100%';

  const emoji = score >= 8 ? '🏆' : score >= 5 ? '🎉' : '💪';
  const title = score >= 8 ? 'Excellent!' : score >= 5 ? 'Good Job!' : 'Keep Practicing!';
  const sub = score + ' out of ' + total + ' correct answers';

  const emojiEl = document.getElementById('quizResultEmoji');
  const titleEl = document.getElementById('quizResultTitle');
  const subEl = document.getElementById('quizResultSub');
  const coinsEl = document.getElementById('quizCoinsEarned');
  if (emojiEl) emojiEl.innerText = emoji;
  if (titleEl) titleEl.innerText = title;
  if (subEl) subEl.innerText = sub;
  if (coinsEl) coinsEl.innerHTML = `<span class="g-coin"></span> ${earned}`;

  // Update header coins
  const u = state.currentUser;
  if (u) {
    const hc = document.getElementById('headerCoins');
    if (hc) hc.innerText = u.coins.toLocaleString();
  }
}

function resetQuiz() {
  showToast("Quiz resets daily at midnight! Come back tomorrow 🌙", "success");
}

function saveData() { DB.set('users', state.allUsers) }

function doLogout() {
  localStorage.removeItem('g31_currentUserPhone');
  localStorage.removeItem('g31_termsAccepted');
  localStorage.removeItem('g31_lastView');
  localStorage.removeItem('g31_lastDashPage');
  state.currentUser = null;
  location.reload();
}

// Profile setup - avatar picker (completed)
// pickEmoji was replaced by professional openAvatarPicker logic above


// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!state.currentUser) prefillReferralFromUrl();
});

window.addEventListener('resize', () => {
  syncFixedBarHeights();
  updateMobileBackBtn();
});
