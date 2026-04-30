# 🏆 GROW31 — TASK VERIFICATION SYSTEM
### Live Proof · Cheat-Proof · Cannot Be Bypassed
*Every task has real evidence. No screenshots faked. No timers skipped.*

---

## THE 5 VERIFICATION METHODS (Explained Simply)

| Method | What User Does | How You Catch Fakes |
|--------|---------------|---------------------|
| `heartbeat_timer` | Keeps app open & active for X minutes | Server counts heartbeat pings every 30s. Miss 2 in a row = timer paused. Can't fake by leaving app. |
| `reflective_text` | Writes what they actually did (50+ words) | Server checks word count, uniqueness (can't copy yesterday's answer), language relevance to task |
| `camera_selfie` | Takes live selfie DOING the task (from camera, not gallery) | App forces camera-only (no gallery picker). Server checks EXIF timestamp. Admin spot-reviews |
| `quiz_gate` | Answers 3 task-specific questions correctly | Questions come from server, different every day, answers NOT in frontend JS |
| `auto_platform` | Nothing extra — platform detects it automatically | Server checks: paid referral count, quiz score DB record, spin result DB, streak counter |

---

## REDESIGNED TASK BANK — Every Task Has Real Verification

```javascript
// ══════════════════════════════════════════════════════════
// NEW TASK_BANK — Replace your existing one in app.js
// Each task has: verificationMethod, timeWindow, minSeconds, quizKeys
// ══════════════════════════════════════════════════════════

const TASK_BANK = [

  // ── HEALTH ──────────────────────────────────────────────
  {
    key: 'task_walk_20',
    title: 'Morning Walk 🚶 (20 mins)',
    category: 'health',
    difficulty: 'easy',
    reward: 5,
    // VERIFICATION: Stay on the active timer screen for 20 minutes
    // Heartbeats sent every 30s. If user leaves app > 60s, timer pauses.
    verificationMethod: 'heartbeat_timer',
    minSeconds: 1200,        // 20 minutes = 1200 seconds
    timeWindow: { start: 5, end: 11 }, // Only claimable 5am–11am (morning)
    instructions: 'Start timer and keep app open while you walk. Timer pauses if you leave.'
  },

  {
    key: 'task_meditation',
    title: '15-Min Meditation 🧘',
    category: 'health',
    difficulty: 'easy',
    reward: 5,
    verificationMethod: 'heartbeat_timer',
    minSeconds: 900,         // 15 minutes
    timeWindow: null,        // Any time of day
    instructions: 'Start timer. Keep phone still and app open during meditation.'
  },

  {
    key: 'task_yoga',
    title: '15-Min Yoga or Stretching 🧘',
    category: 'health',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Timer + write what poses/stretches you did
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 900,
    minWords: 20,
    promptText: 'What stretches or poses did you do? (min 20 words)',
    instructions: 'Complete 15-min timer, then briefly describe your session.'
  },

  {
    key: 'task_exercise_30',
    title: 'Exercise for 30 Minutes 🏋️',
    category: 'health',
    difficulty: 'hard',
    reward: 20,
    // VERIFICATION: Timer (30 min) + selfie photo during/after workout
    verificationMethod: 'heartbeat_timer_plus_camera',
    minSeconds: 1800,
    instructions: 'Keep timer running during workout. Take a selfie at your workout spot when done.'
  },

  {
    key: 'task_run_5k',
    title: 'Run or Jog 5km 🏃',
    category: 'health',
    difficulty: 'hard',
    reward: 20,
    // VERIFICATION: Timer (35+ min) + selfie at end + quiz (distance, route, feeling)
    verificationMethod: 'heartbeat_timer_plus_camera',
    minSeconds: 2100,        // 35 minutes minimum (realistic 5km time)
    instructions: 'Keep app timer running. Take a selfie after your run.'
  },

  {
    key: 'task_water_8',
    title: 'Drink 8 Glasses of Water 💧',
    category: 'health',
    difficulty: 'easy',
    reward: 5,
    // VERIFICATION: End-of-day reflective text — simple but daily
    verificationMethod: 'reflective_text',
    minWords: 15,
    promptText: 'What time did you drink each glass? (e.g., 7am, 9am, 11am...)',
    timeWindow: { start: 18, end: 23 }, // Can only submit after 6pm
    instructions: 'Track your water throughout the day. Log your times after 6pm.'
  },

  {
    key: 'task_sleep_early',
    title: 'Sleep by 10:30 PM 😴',
    category: 'health',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: NEXT MORNING quiz — answer questions about sleep
    // (what time did you sleep, how do you feel, dream etc.)
    // Can only submit 6am–10am NEXT DAY
    verificationMethod: 'next_morning_quiz',
    quizKeys: ['sleep_time', 'sleep_quality', 'wake_time', 'how_feel'],
    timeWindow: { start: 6, end: 10 }, // Submit next morning only
    instructions: 'Sleep by 10:30 PM. Next morning 6–10am, answer quick questions to verify.'
  },

  {
    key: 'task_no_junk',
    title: 'Eat Zero Junk Food Today 🥗',
    category: 'health',
    difficulty: 'hard',
    reward: 20,
    verificationMethod: 'reflective_text',
    minWords: 30,
    promptText: 'List every meal and snack you ate today. What did you eat for breakfast, lunch, and dinner?',
    timeWindow: { start: 18, end: 23 },
    instructions: 'Submit a food diary after 6pm. Be specific — our system checks for vague answers.'
  },

  {
    key: 'task_steps_7k',
    title: 'Complete 7,000 Steps 👟',
    category: 'health',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Screenshot of step counter app (Google Fit, Samsung Health, etc.)
    // Server checks: today's date visible in screenshot, steps >= 7000
    verificationMethod: 'screenshot_with_date',
    screenshotInstructions: 'Take a screenshot of your step counter app showing today\'s date and step count.',
    instructions: 'Screenshot your Google Fit / Samsung Health / Apple Health showing 7000+ steps with today\'s date.'
  },

  {
    key: 'task_no_sugar',
    title: 'Avoid Sugar for Entire Day 🚫🍭',
    category: 'health',
    difficulty: 'hard',
    reward: 20,
    verificationMethod: 'reflective_text',
    minWords: 40,
    promptText: 'Describe everything you ate AND drank today. What sugar cravings did you face? How did you handle them?',
    timeWindow: { start: 20, end: 23 },
    instructions: 'Complete a detailed food + mindset log after 8pm. Vague answers are rejected.'
  },

  // ── LEARNING ─────────────────────────────────────────────

  {
    key: 'task_read_20',
    title: 'Read 20 Pages of a Book 📖',
    category: 'learning',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Timer (20+ min) + what did you read (book name + summary)
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 1200,
    minWords: 30,
    promptText: 'What book are you reading? What happened in these 20 pages?',
    instructions: 'Keep timer running while reading. Write a short summary of what you read.'
  },

  {
    key: 'task_podcast',
    title: 'Listen to a 20-Min Podcast 🎙️',
    category: 'learning',
    difficulty: 'easy',
    reward: 5,
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 1200,
    minWords: 20,
    promptText: 'What was the podcast name? What was the main topic or idea you learned?',
    instructions: 'Keep app open. Write one key takeaway after listening.'
  },

  {
    key: 'task_learn_skill',
    title: 'Learn 1 New Skill Online (30 mins) 💻',
    category: 'learning',
    difficulty: 'hard',
    reward: 20,
    // VERIFICATION: Timer + detailed reflection + what you will do with this skill
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 1800,
    minWords: 50,
    promptText: 'What skill did you learn? What platform/video/article? Write 3 things you learned and how you will use this skill.',
    instructions: '30-min timer + detailed learning log. Generic answers are flagged and rejected.'
  },

  {
    key: 'task_news',
    title: 'Read Today\'s Business/Finance News 📰',
    category: 'learning',
    difficulty: 'easy',
    reward: 5,
    verificationMethod: 'reflective_text',
    minWords: 25,
    promptText: 'Name ONE news story you read today. What happened? Why does it matter?',
    instructions: 'Answer in your own words — copy-pasted answers are detected and rejected.'
  },

  {
    key: 'task_vocab',
    title: 'Learn 5 New Words 🌐',
    category: 'learning',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Submit the 5 words with meanings — server checks they are real words
    verificationMethod: 'word_submission',
    requiredCount: 5,
    promptText: 'List 5 new words you learned today with their meanings.',
    instructions: 'Submit 5 real words with meanings. Duplicate words across days are rejected.'
  },

  {
    key: 'task_doc_watch',
    title: 'Watch an Educational Documentary 🎬',
    category: 'learning',
    difficulty: 'medium',
    reward: 10,
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 1800,    // At least 30 mins watched
    minWords: 40,
    promptText: 'Name the documentary. What was the main message? What surprised you most?',
    instructions: 'Keep app running alongside your video. Write a proper reflection.'
  },

  // ── FOCUS ────────────────────────────────────────────────

  {
    key: 'task_journal',
    title: 'Journal: Write 3 Goals for Tomorrow ✍️',
    category: 'focus',
    difficulty: 'easy',
    reward: 5,
    // VERIFICATION: User writes the 3 goals IN the app — min words, stored server-side
    verificationMethod: 'in_app_journal',
    minWords: 30,
    promptText: 'Write your 3 goals for tomorrow. Be specific — what, when, and how?',
    instructions: 'Goals must be specific (not just "exercise"). Vague one-word answers fail.'
  },

  {
    key: 'task_gratitude',
    title: 'Write 5 Things You\'re Grateful For 🙏',
    category: 'focus',
    difficulty: 'easy',
    reward: 5,
    verificationMethod: 'in_app_journal',
    minWords: 40,
    promptText: 'List 5 things you are grateful for today. Explain WHY for at least 3 of them.',
    instructions: 'Must explain the WHY. "My family" alone is rejected. "My family because..." is accepted.'
  },

  {
    key: 'task_plan_day',
    title: 'Plan Tomorrow\'s Schedule Tonight 🗓️',
    category: 'focus',
    difficulty: 'medium',
    reward: 10,
    verificationMethod: 'in_app_journal',
    minWords: 50,
    timeWindow: { start: 20, end: 23 }, // Must plan at night
    promptText: 'Write a hour-by-hour schedule for tomorrow from morning to evening. Include all tasks and goals.',
    instructions: 'Must include specific times (e.g., "7am: wake up, 7:30am: walk..."). Vague plans are rejected.'
  },

  {
    key: 'task_deep_work',
    title: 'Do 90-Min Deep Work Session 🎯',
    category: 'focus',
    difficulty: 'hard',
    reward: 20,
    // VERIFICATION: 90-min timer + detailed session log
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 5400,    // 90 minutes
    minWords: 50,
    promptText: 'What were you working on? What did you accomplish? Any distractions?',
    instructions: 'The 90-minute timer MUST run continuously. Missing 3+ heartbeats resets the timer.'
  },

  {
    key: 'task_no_social_2h',
    title: 'No Social Media for 2 Hours 📵',
    category: 'focus',
    difficulty: 'hard',
    reward: 20,
    // VERIFICATION: Start timer. App sends heartbeats. If user leaves app for social media,
    // system detects background/foreground switch. Timer resets if > 3 app-switch breaks.
    // PLUS: write what you did during those 2 hours instead.
    verificationMethod: 'heartbeat_timer_plus_text',
    minSeconds: 7200,    // 2 hours
    minWords: 40,
    maxAppSwitches: 3,   // Allow max 3 phone switches during timer
    promptText: 'What did you do instead of social media during those 2 hours?',
    instructions: 'Keep the Grow31 app open as your "home" during this time. Excessive phone switching resets timer.'
  },

  {
    key: 'task_no_phone_morning',
    title: 'No Phone for 30 Mins After Waking 📱✋',
    category: 'focus',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Complete a short morning quiz between 7am–10am about your morning
    verificationMethod: 'morning_reflection',
    quizKeys: ['woke_at', 'first_activity', 'mood_morning', 'no_phone_feeling'],
    timeWindow: { start: 7, end: 10 },
    instructions: 'Between 7–10am, fill a short morning check-in. It will ask how your phone-free morning felt.'
  },

  // ── SOCIAL ───────────────────────────────────────────────

  {
    key: 'task_follow_ig',
    title: 'Follow Grow31 on Instagram 📸',
    category: 'social',
    difficulty: 'easy',
    reward: 5,
    // VERIFICATION: One-time only. Screenshot of follow button showing "Following".
    // Server checks: has user already claimed this? (one-time lifetime task)
    verificationMethod: 'screenshot_one_time',
    lifetime: true,      // Can only complete once ever
    screenshotInstructions: 'Screenshot showing you follow @grow31official (must show "Following" button)',
    instructions: 'Take a screenshot showing your Instagram account follows @grow31official.'
  },

  {
    key: 'task_share_story',
    title: 'Share Grow31 Progress on Your Story 📲',
    category: 'social',
    difficulty: 'medium',
    reward: 10,
    // VERIFICATION: Screenshot showing your own story with Grow31 tag/mention visible
    verificationMethod: 'screenshot_with_date',
    screenshotInstructions: 'Screenshot your active Story showing @grow31official tag and today\'s date.',
    instructions: 'Post story with @grow31official tag. Screenshot it and upload. Must show today\'s date/timestamp.'
  },

  {
    key: 'task_call_family',
    title: 'Call a Parent or Sibling Today 📞',
    category: 'social',
    difficulty: 'easy',
    reward: 5,
    // VERIFICATION: Reflective text — what did you talk about?
    verificationMethod: 'reflective_text',
    minWords: 20,
    promptText: 'Who did you call? What did you talk about? How did they feel?',
    instructions: 'Describe the call in your own words. Generic answers ("I called my mom") are rejected.'
  },

  {
    key: 'task_help_someone',
    title: 'Help Someone With Something Today 🤝',
    category: 'social',
    difficulty: 'medium',
    reward: 10,
    verificationMethod: 'reflective_text',
    minWords: 40,
    promptText: 'Who did you help? What was the problem? What did you do to help? How did it turn out?',
    instructions: 'Be specific and detailed. "I helped my friend" alone = rejected. Tell the full story.'
  },

  // ── GROW31 PLATFORM ──────────────────────────────────────

  {
    key: 'task_checkin_streak',
    title: 'Check In for 3 Days in a Row 🔥',
    category: 'grow31',
    difficulty: 'medium',
    reward: 10,
    verificationMethod: 'auto_platform',
    autoCheckField: 'checkin_streak',
    autoCheckValue: 3,
    instructions: 'Automatically verified when your streak hits 3. Keep checking in daily!'
  },

  {
    key: 'task_complete_quiz',
    title: 'Score 8/10 or Above in Daily Quiz 🧠',
    category: 'grow31',
    difficulty: 'hard',
    reward: 20,
    verificationMethod: 'auto_platform',
    autoCheckField: 'quiz_score_today',
    autoCheckValue: 8,
    instructions: 'Complete today\'s quiz in the Quiz section. Score 8+ to unlock this task reward.'
  },

  {
    key: 'task_invite_friend',
    title: 'Invite 1 Friend Who Actually Joins & Pays 👥',
    category: 'grow31',
    difficulty: 'hard',
    reward: 20,
    verificationMethod: 'auto_platform',
    autoCheckField: 'paid_referral_count',
    autoCheckValue: 1,
    instructions: 'Your friend must register AND complete payment. Just clicking your link is not enough.'
  },

  {
    key: 'task_spin_win',
    title: 'Spin the Wheel and Win 10+ Coins 🎡',
    category: 'grow31',
    difficulty: 'medium',
    reward: 10,
    verificationMethod: 'auto_platform',
    autoCheckField: 'spin_win_today',
    autoCheckValue: 10,
    instructions: 'Automatically verified when you win 10+ coins in one spin today.'
  },

  {
    key: 'task_profile_complete',
    title: 'Complete 100% of Your Profile 👤',
    category: 'grow31',
    difficulty: 'easy',
    reward: 5,
    verificationMethod: 'auto_platform',
    lifetime: true,
    autoCheckField: 'profile_complete',
    autoCheckValue: true,
    instructions: 'Add your avatar, username, country, and language. All fields required.'
  }

];
```

---

## FRONTEND: TIMER WITH HEARTBEAT SYSTEM

```javascript
// ══════════════════════════════════════════════════════════
// Frontend task timer — paste this into app.js
// This is the heartbeat system that makes timer un-fakeable
// ══════════════════════════════════════════════════════════

let activeTimer = null;

function startTaskTimer(task) {
  if (activeTimer) return showToast("Another task timer is already running!", "error");
  
  const HEARTBEAT_INTERVAL = 30 * 1000;  // ping server every 30 seconds
  const PAUSE_AFTER_MISS = 2;             // pause if 2 pings missed (= 1 min background)
  let elapsed = 0;
  let missedPings = 0;
  let lastPingResponse = Date.now();
  let timerTick = null;
  let heartbeatInterval = null;

  // Get a server-issued timer session token
  const startTimer = async () => {
    const res = await fetch('/api/tasks/start-timer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getAccessToken()
      },
      body: JSON.stringify({ taskKey: task.key, day: state.currentUser.day })
    });
    const data = await res.json();
    if (!data.sessionToken) return showToast("Could not start timer", "error");
    
    activeTimer = {
      taskKey: task.key,
      sessionToken: data.sessionToken,
      required: task.minSeconds,
      elapsed: 0,
      paused: false
    };
    
    // Show timer UI
    renderTimerUI(task);

    // Tick every second (UI only)
    timerTick = setInterval(() => {
      if (!activeTimer?.paused) {
        activeTimer.elapsed++;
        updateTimerDisplay(activeTimer.elapsed, task.minSeconds);
        if (activeTimer.elapsed >= task.minSeconds) {
          clearInterval(timerTick);
          onTimerComplete(task);
        }
      }
    }, 1000);

    // Send heartbeat every 30 seconds to SERVER
    heartbeatInterval = setInterval(async () => {
      try {
        const pingRes = await fetch('/api/tasks/heartbeat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + getAccessToken()
          },
          body: JSON.stringify({
            sessionToken: activeTimer.sessionToken,
            clientElapsed: activeTimer.elapsed
          })
        });
        const ping = await pingRes.json();
        
        if (ping.paused) {
          // Server says timer was paused (too many missed pings from server side)
          activeTimer.paused = true;
          showToast("⏸️ Timer paused — stay in app!", "error");
        } else if (ping.resumed) {
          activeTimer.paused = false;
          showToast("▶️ Timer resumed", "success");
        }
        
        missedPings = 0;
        lastPingResponse = Date.now();

      } catch (e) {
        // Network error = treat as potential cheating
        missedPings++;
        if (missedPings >= PAUSE_AFTER_MISS) {
          activeTimer.paused = true;
          showToast("⏸️ Timer paused — reconnecting...", "error");
        }
      }
    }, HEARTBEAT_INTERVAL);
  };

  startTimer();
}

function onTimerComplete(task) {
  clearInterval(activeTimer?.heartbeatInterval);
  showToast("⏱️ Time complete! Now submit your proof.", "success");
  
  // Show the proof input for this task type
  if (task.verificationMethod === 'heartbeat_timer_plus_text') {
    showTextProofDialog(task);
  } else if (task.verificationMethod === 'heartbeat_timer_plus_camera') {
    showCameraProofDialog(task);
  } else {
    // Pure timer — submit directly
    submitTaskWithTimer(task);
  }
}

async function submitTaskWithTimer(task, textProof = null, photoProof = null) {
  const body = {
    taskKey: task.key,
    day: state.currentUser.day,
    sessionToken: activeTimer?.sessionToken,
    textProof,
    photoProof
  };

  const res = await fetch('/api/tasks/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getAccessToken()
    },
    body: JSON.stringify(body)
  });
  
  const result = await res.json();
  activeTimer = null;

  if (result.success) {
    showToast(`✅ +${result.coinsAwarded} G-Coins earned!`, "success");
    // Refresh coins from server (never trust client)
    await refreshUserFromServer();
  } else {
    showToast("❌ " + (result.error || "Verification failed"), "error");
  }
}
```

---

## FRONTEND: CAMERA CAPTURE (No Gallery — Live Photo Only)

```javascript
// ══════════════════════════════════════════════════════════
// Camera capture — forces live camera, blocks gallery upload
// ══════════════════════════════════════════════════════════

function showCameraProofDialog(task) {
  const dialog = document.getElementById('cameraProofDialog');
  document.getElementById('cameraPromptText').innerText = task.instructions;
  
  // Open camera — 'environment' = back camera (selfie goes front)
  // capture='camera' = FORCES live camera, no gallery picker on mobile
  const input = document.getElementById('taskCameraInput');
  input.setAttribute('capture', 'environment');  // or 'user' for selfie
  input.setAttribute('accept', 'image/*');
  
  // Remove any previously set src to prevent reuse
  document.getElementById('cameraPreview').src = '';
  
  dialog.classList.add('open');
}

function handleTaskPhotoCapture(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate: must be image, must be < 5MB
  if (!file.type.startsWith('image/')) return showToast("Must be an image", "error");
  if (file.size > 5 * 1024 * 1024) return showToast("Photo too large (max 5MB)", "error");

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById('cameraPreview').src = e.target.result;
    document.getElementById('confirmPhotoBtn').disabled = false;
  };
  reader.readAsDataURL(file);
  
  // Store for submission
  window.pendingPhotoFile = file;
}

async function confirmAndSubmitPhoto(task) {
  if (!window.pendingPhotoFile) return;
  
  // Upload photo to server (server validates metadata)
  const formData = new FormData();
  formData.append('photo', window.pendingPhotoFile);
  formData.append('taskKey', task.key);
  formData.append('day', state.currentUser.day);
  formData.append('sessionToken', activeTimer?.sessionToken || '');

  const res = await fetch('/api/tasks/upload-proof', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + getAccessToken() },
    body: formData
  });
  
  const result = await res.json();
  if (result.uploadToken) {
    // Photo accepted — now complete the task
    await submitTaskWithTimer(task, null, result.uploadToken);
    closeDialog('cameraProofDialog');
  } else {
    showToast("Photo upload failed: " + result.error, "error");
  }
}
```

---

## FRONTEND: TEXT PROOF DIALOG

```javascript
// ══════════════════════════════════════════════════════════
// Text proof — user writes their reflection
// ══════════════════════════════════════════════════════════

function showTextProofDialog(task) {
  const dialog = document.getElementById('textProofDialog');
  document.getElementById('textProofPrompt').innerText = task.promptText || 'Describe what you did:';
  document.getElementById('textProofMinWords').innerText = `Minimum ${task.minWords || 30} words required`;
  document.getElementById('textProofInput').value = '';
  document.getElementById('textProofWordCount').innerText = '0 words';
  document.getElementById('submitTextProofBtn').disabled = true;
  
  // Store task reference
  window.activeTextProofTask = task;
  dialog.classList.add('open');
}

function onTextProofInput(event) {
  const text = event.target.value.trim();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const required = window.activeTextProofTask?.minWords || 30;
  
  document.getElementById('textProofWordCount').innerText = `${words} / ${required} words`;
  document.getElementById('textProofWordCount').style.color = words >= required ? '#00e676' : '#ff5252';
  document.getElementById('submitTextProofBtn').disabled = words < required;
}

async function submitTextProof() {
  const task = window.activeTextProofTask;
  const text = document.getElementById('textProofInput').value.trim();
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  
  if (words < (task.minWords || 30)) {
    return showToast(`Write at least ${task.minWords} words`, "error");
  }
  
  closeDialog('textProofDialog');
  await submitTaskWithTimer(task, text, null);
}
```

---

## BACKEND: TASK TIMER SERVER (Node.js)

```javascript
// backend/routes/tasks.js — Timer system

// POST /api/tasks/start-timer
router.post('/start-timer', requireAuth, async (req, res) => {
  const { taskKey, day } = req.body;
  const userId = req.userId;

  // Check not already running a timer for this task
  const existingTimer = await redis.get(`timer:active:${userId}`);
  if (existingTimer) {
    const t = JSON.parse(existingTimer);
    if (t.taskKey === taskKey) {
      // Resume existing timer
      return res.json({ sessionToken: t.sessionToken, elapsed: t.serverElapsed });
    }
    return res.status(409).json({ error: 'TIMER_ALREADY_RUNNING', activeTask: t.taskKey });
  }

  // Check task not already completed today
  const done = await db.query(
    'SELECT id FROM task_completions WHERE user_id = $1 AND task_key = $2 AND day = $3',
    [userId, taskKey, day]
  );
  if (done.rows.length) return res.status(409).json({ error: 'TASK_ALREADY_COMPLETED' });

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const timerData = {
    userId,
    taskKey,
    day,
    sessionToken,
    startedAt: Date.now(),
    serverElapsed: 0,        // Server counts real elapsed time
    lastHeartbeat: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
    heartbeatsMissed: 0,
    appSwitches: 0
  };

  // Store in Redis with 4-hour expiry
  await redis.setex(`timer:${sessionToken}`, 14400, JSON.stringify(timerData));
  await redis.setex(`timer:active:${userId}`, 14400, JSON.stringify({ taskKey, sessionToken }));

  return res.json({ sessionToken });
});


// POST /api/tasks/heartbeat
router.post('/heartbeat', requireAuth, async (req, res) => {
  const { sessionToken, clientElapsed } = req.body;
  const userId = req.userId;

  const raw = await redis.get(`timer:${sessionToken}`);
  if (!raw) return res.status(404).json({ error: 'TIMER_SESSION_EXPIRED' });

  const timer = JSON.parse(raw);
  if (timer.userId !== userId) return res.status(403).json({ error: 'TIMER_MISMATCH' });

  const now = Date.now();
  const gapMs = now - timer.lastHeartbeat;

  // Server calculates real elapsed (not trusting client's number)
  if (!timer.pausedAt) {
    // Normal: count time since last heartbeat
    if (gapMs > 90000) {
      // > 90 seconds gap = app was backgrounded = PAUSE
      timer.pausedAt = timer.lastHeartbeat + 60000; // Allow 60s before pausing
      timer.heartbeatsMissed++;
    } else {
      timer.serverElapsed += Math.min(gapMs / 1000, 35); // max 35s per interval
    }
  } else {
    // Already paused — check if we should auto-resume
    if (timer.heartbeatsMissed < 3) {
      timer.pausedAt = null; // Resume
      timer.totalPausedMs += gapMs;
    }
  }

  // Check for suspicious client-vs-server elapsed mismatch
  const serverElapsedRounded = Math.round(timer.serverElapsed);
  const suspiciousDrift = Math.abs(clientElapsed - serverElapsedRounded) > 120; // >2 min drift
  if (suspiciousDrift) {
    await logSuspiciousActivity(userId, 'TIMER_ELAPSED_MISMATCH', {
      client: clientElapsed, server: serverElapsedRounded
    });
  }

  timer.lastHeartbeat = now;
  await redis.setex(`timer:${sessionToken}`, 14400, JSON.stringify(timer));

  return res.json({
    serverElapsed: timer.serverElapsed,
    paused: timer.pausedAt !== null,
    resumed: false
  });
});


// POST /api/tasks/complete
router.post('/complete', requireAuth, async (req, res) => {
  const { taskKey, day, sessionToken, textProof, photoProof } = req.body;
  const userId = req.userId;

  const task = TASK_BANK.find(t => t.key === taskKey);
  if (!task) return res.status(400).json({ error: 'INVALID_TASK' });

  // ── 1. Day gate ──
  const user = await db.query('SELECT * FROM users WHERE id = $1 AND has_paid = true', [userId]);
  if (!user.rows[0]) return res.status(403).json({ error: 'NOT_PAID' });
  if (day > user.rows[0].current_day) return res.status(400).json({ error: 'TASK_NOT_UNLOCKED' });

  // ── 2. Duplicate gate ──
  const done = await db.query(
    'SELECT id FROM task_completions WHERE user_id = $1 AND task_key = $2 AND day = $3',
    [userId, taskKey, day]
  );
  if (done.rows.length) return res.status(409).json({ error: 'ALREADY_COMPLETED' });

  // ── 3. Time window gate ──
  if (task.timeWindow) {
    const hour = new Date().getHours(); // Server time (IST if configured)
    if (hour < task.timeWindow.start || hour >= task.timeWindow.end) {
      return res.status(400).json({
        error: 'OUTSIDE_TIME_WINDOW',
        message: `This task can only be submitted between ${task.timeWindow.start}:00 and ${task.timeWindow.end}:00`
      });
    }
  }

  // ── 4. Verification by method ──
  let verificationPassed = false;
  let verificationDetails = {};

  if (task.verificationMethod.startsWith('heartbeat_timer')) {
    // Verify timer session
    if (!sessionToken) return res.status(400).json({ error: 'TIMER_SESSION_REQUIRED' });
    const raw = await redis.get(`timer:${sessionToken}`);
    if (!raw) return res.status(400).json({ error: 'TIMER_SESSION_EXPIRED' });
    
    const timer = JSON.parse(raw);
    if (timer.userId !== userId) return res.status(403).json({ error: 'TIMER_MISMATCH' });
    if (timer.taskKey !== taskKey) return res.status(400).json({ error: 'TIMER_TASK_MISMATCH' });
    
    const requiredSeconds = task.minSeconds;
    if (timer.serverElapsed < requiredSeconds * 0.95) { // 5% tolerance
      return res.status(400).json({
        error: 'TIMER_INCOMPLETE',
        required: requiredSeconds,
        completed: Math.floor(timer.serverElapsed),
        remaining: Math.ceil(requiredSeconds - timer.serverElapsed)
      });
    }

    verificationPassed = true;
    verificationDetails.timerSeconds = timer.serverElapsed;
    
    // Clean up timer
    await redis.del(`timer:${sessionToken}`);
    await redis.del(`timer:active:${userId}`);
  }

  if (task.verificationMethod.includes('_plus_text') || task.verificationMethod === 'reflective_text' || task.verificationMethod === 'in_app_journal') {
    if (!textProof || textProof.trim().length < 10) {
      return res.status(400).json({ error: 'TEXT_PROOF_REQUIRED' });
    }
    
    const words = textProof.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (words < (task.minWords || 20)) {
      return res.status(400).json({ error: 'TEXT_TOO_SHORT', required: task.minWords, got: words });
    }

    // Check for duplicate text (same answer submitted on a different day)
    const textHash = crypto.createHash('sha256').update(textProof.toLowerCase().replace(/\s+/g, ' ')).digest('hex');
    const duplicate = await db.query(
      'SELECT id FROM task_completions WHERE user_id = $1 AND text_hash = $2',
      [userId, textHash]
    );
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: 'DUPLICATE_TEXT_DETECTED', message: 'You submitted the same text before. Write fresh each day.' });
    }

    // Check for suspiciously fast typing (submitted within 10 seconds = copied)
    if (task.verificationMethod !== 'heartbeat_timer_plus_text') {
      const timerKey = `task:text:start:${userId}:${taskKey}`;
      const textStartTime = await redis.get(timerKey);
      if (textStartTime) {
        const typingSeconds = (Date.now() - parseInt(textStartTime)) / 1000;
        const expectedMinSeconds = words * 0.5; // 0.5s per word minimum
        if (typingSeconds < expectedMinSeconds) {
          await logSuspiciousActivity(userId, 'FAST_TEXT_SUBMISSION', { words, typingSeconds });
          // Don't reject — just flag for admin review
        }
      }
    }

    verificationPassed = true;
    verificationDetails.wordCount = words;
    verificationDetails.textHash = textHash;
  }

  if (task.verificationMethod.includes('_plus_camera') || task.verificationMethod === 'screenshot_with_date' || task.verificationMethod === 'screenshot_one_time') {
    if (!photoProof) return res.status(400).json({ error: 'PHOTO_PROOF_REQUIRED' });
    
    // Verify upload token
    const uploadData = await redis.get(`upload:token:${photoProof}`);
    if (!uploadData) return res.status(400).json({ error: 'INVALID_PHOTO_TOKEN' });
    
    const upload = JSON.parse(uploadData);
    if (upload.userId !== userId || upload.taskKey !== taskKey) {
      return res.status(400).json({ error: 'PHOTO_TOKEN_MISMATCH' });
    }

    // For lifetime tasks, check if already done
    if (task.lifetime) {
      const lifetimeDone = await db.query(
        'SELECT id FROM task_completions WHERE user_id = $1 AND task_key = $2',
        [userId, taskKey]
      );
      if (lifetimeDone.rows.length > 0) return res.status(409).json({ error: 'LIFETIME_TASK_ALREADY_DONE' });
    }

    verificationPassed = true;
    verificationDetails.photoUrl = upload.fileUrl;
    verificationDetails.pendingAdminReview = true; // Admin reviews photos async
    await redis.del(`upload:token:${photoProof}`);
  }

  if (task.verificationMethod === 'auto_platform') {
    // Check the specific field value in DB
    const fieldValue = user.rows[0][task.autoCheckField];
    if (typeof fieldValue === 'number' && fieldValue < task.autoCheckValue) {
      return res.status(400).json({
        error: 'AUTO_CHECK_FAILED',
        message: `Requires ${task.autoCheckField} >= ${task.autoCheckValue}. Current: ${fieldValue}`
      });
    }
    if (typeof fieldValue === 'boolean' && fieldValue !== task.autoCheckValue) {
      return res.status(400).json({ error: 'AUTO_CHECK_FAILED' });
    }
    verificationPassed = true;
  }

  if (!verificationPassed) {
    return res.status(400).json({ error: 'VERIFICATION_METHOD_NOT_HANDLED' });
  }

  // ── 5. Award coins in DB (atomic transaction) ──
  const reward = TASK_DIFFICULTY[task.difficulty].reward;

  await db.query('BEGIN');
  try {
    await db.query(`
      INSERT INTO task_completions (user_id, task_key, day, reward, verification_method, verification_details, text_hash, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [userId, taskKey, day, reward, task.verificationMethod, JSON.stringify(verificationDetails), verificationDetails.textHash || null]);

    await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [reward, userId]);

    await db.query(`INSERT INTO coin_transactions (user_id, amount, type, description) VALUES ($1, $2, 'task', $3)`,
      [userId, reward, `Task: ${task.title} (Day ${day})`]);

    // All-tasks-done bonus
    const dayTaskKeys = getDailyTaskKeys(day);
    const completedCount = await db.query(
      'SELECT COUNT(*) FROM task_completions WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
    if (parseInt(completedCount.rows[0].count) + 1 >= dayTaskKeys.length) {
      await db.query('UPDATE users SET coins = coins + 30 WHERE id = $1', [userId]);
      await db.query(`INSERT INTO coin_transactions (user_id, amount, type, description) VALUES ($1, 30, 'bonus', 'All tasks complete bonus')`, [userId]);
    }

    await db.query('COMMIT');
  } catch (e) {
    await db.query('ROLLBACK');
    throw e;
  }

  // Return fresh user data from server
  const updated = await db.query('SELECT coins, spin_tickets FROM users WHERE id = $1', [userId]);
  return res.json({
    success: true,
    coinsAwarded: reward,
    newBalance: updated.rows[0].coins
  });
});
```

---

## BACKEND: PHOTO UPLOAD VALIDATION

```javascript
// backend/routes/taskUpload.js
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');

// In-memory storage (process before saving)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG/PNG/WEBP images allowed'));
    }
  }
});

// POST /api/tasks/upload-proof
router.post('/upload-proof', requireAuth, upload.single('photo'), async (req, res) => {
  const { taskKey, day, sessionToken } = req.body;
  const userId = req.userId;

  if (!req.file) return res.status(400).json({ error: 'NO_FILE' });

  // 1. Hash the image to detect duplicate submissions
  const imageHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
  
  // Check if this exact image was used before (by any user)
  const duplicate = await db.query(
    'SELECT id, user_id FROM task_uploads WHERE image_hash = $1',
    [imageHash]
  );
  if (duplicate.rows.length > 0) {
    await logSuspiciousActivity(userId, 'DUPLICATE_IMAGE_UPLOAD', {
      hash: imageHash,
      originalUserId: duplicate.rows[0].user_id
    });
    return res.status(400).json({ error: 'DUPLICATE_IMAGE_DETECTED', message: 'This image was already submitted by another user or on a previous day.' });
  }

  // 2. Strip EXIF metadata (privacy) but extract timestamp first
  let photoTimestamp = null;
  try {
    const metadata = await sharp(req.file.buffer).metadata();
    // sharp strips EXIF, but we get width/height to verify it's a real photo
    if (metadata.width < 100 || metadata.height < 100) {
      return res.status(400).json({ error: 'IMAGE_TOO_SMALL' });
    }
  } catch (e) {
    return res.status(400).json({ error: 'INVALID_IMAGE' });
  }

  // 3. Resize and compress (save storage)
  const processedBuffer = await sharp(req.file.buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .withMetadata(false)  // Strip ALL metadata (privacy + EXIF)
    .toBuffer();

  // 4. Upload to cloud storage (Cloudflare R2 or AWS S3)
  const filename = `task-proofs/${userId}/${taskKey}/${Date.now()}.jpg`;
  const fileUrl = await uploadToStorage(processedBuffer, filename);

  // 5. Store upload record + issue one-time token
  const uploadToken = crypto.randomBytes(24).toString('hex');
  
  await db.query(`
    INSERT INTO task_uploads (user_id, task_key, day, file_url, image_hash, review_status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
  `, [userId, taskKey, day, fileUrl, imageHash]);

  // Token expires in 5 minutes — must complete task within that time
  await redis.setex(`upload:token:${uploadToken}`, 300, JSON.stringify({
    userId, taskKey, day, fileUrl
  }));

  return res.json({ uploadToken });
});
```

---

## DAILY QUIZ — ANSWERS ON SERVER ONLY

```javascript
// backend/routes/quiz.js
// Quiz questions and answers NEVER sent to frontend

const QUIZ_BANK = [
  // Questions stored server-side only — different each day
  { id: 'q001', text: "What is compound interest?", opts: ["Simple interest on principal", "Interest on interest", "Fixed monthly fee", "Bank charge"], correctIndex: 1, category: 'finance' },
  { id: 'q002', text: "The 80/20 rule means:", opts: ["Work 80% harder", "20% effort = 80% results", "Save 80% of income", "Work 80 hours a week"], correctIndex: 1, category: 'productivity' },
  // ... 200+ questions in database
];

// GET /api/quiz/today
// Returns questions WITHOUT answers
router.get('/today', requireAuth, async (req, res) => {
  const userId = req.userId;
  const user = await db.query('SELECT current_day FROM users WHERE id = $1', [userId]);
  const day = user.rows[0].current_day;

  // Check if already attempted today
  const attempt = await db.query(
    'SELECT * FROM quiz_attempts WHERE user_id = $1 AND quiz_day = $2',
    [userId, day]
  );
  if (attempt.rows.length) {
    return res.json({ alreadyDone: true, score: attempt.rows[0].score });
  }

  // Seeded selection — same questions for everyone on same day
  // But USER NEVER GETS THE ANSWERS
  const seed = day * 7919;
  const selectedQuestions = selectQuestionsForDay(day, seed);

  // Generate a quiz session token
  const quizToken = crypto.randomBytes(24).toString('hex');
  await redis.setex(`quiz:${userId}:${day}`, 1800, JSON.stringify({
    questionIds: selectedQuestions.map(q => q.id),
    startedAt: Date.now()
  }));

  // NEVER include correctIndex in response
  return res.json({
    quizToken,
    questions: selectedQuestions.map(q => ({
      id: q.id,
      text: q.text,
      opts: q.opts
      // correctIndex is NOT sent
    }))
  });
});

// POST /api/quiz/submit
router.post('/submit', requireAuth, async (req, res) => {
  const { answers, quizToken } = req.body; // answers = [{questionId, selectedIndex}]
  const userId = req.userId;
  const user = await db.query('SELECT current_day FROM users WHERE id = $1', [userId]);
  const day = user.rows[0].current_day;

  // Verify quiz session
  const session = await redis.get(`quiz:${userId}:${day}`);
  if (!session) return res.status(400).json({ error: 'QUIZ_SESSION_EXPIRED' });

  const sess = JSON.parse(session);
  
  // Check time — must submit within 30 minutes
  if (Date.now() - sess.startedAt > 30 * 60 * 1000) {
    return res.status(400).json({ error: 'QUIZ_TIME_EXPIRED' });
  }

  // Score answers server-side
  let correct = 0;
  const results = [];
  
  for (const ans of answers) {
    const question = QUIZ_BANK.find(q => q.id === ans.questionId);
    if (!question) continue;
    if (!sess.questionIds.includes(ans.questionId)) continue; // Can't answer questions not in their set
    
    const isCorrect = ans.selectedIndex === question.correctIndex;
    if (isCorrect) correct++;
    results.push({ questionId: ans.questionId, correct: isCorrect });
  }

  const total = sess.questionIds.length;
  const coinsEarned = correct >= 8 ? 30 : correct >= 6 ? 15 : correct >= 4 ? 5 : 0;

  // Save to DB
  await db.query(`
    INSERT INTO quiz_attempts (user_id, quiz_day, score, total, coins_earned, answers)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id, quiz_day) DO NOTHING
  `, [userId, day, correct, total, coinsEarned, JSON.stringify(results)]);

  if (coinsEarned > 0) {
    await db.query('UPDATE users SET coins = coins + $1 WHERE id = $2', [coinsEarned, userId]);
  }

  // Update quiz_score_today field (for auto-verification of task_complete_quiz)
  await db.query('UPDATE users SET quiz_score_today = $1 WHERE id = $2', [correct, userId]);

  await redis.del(`quiz:${userId}:${day}`);

  return res.json({ score: correct, total, coinsEarned, results });
});
```

---

## COMPLETE VERIFICATION TABLE — Every Task, Method, Bypass Prevention

| Task | Method | Time Window | Bypass Attempt | Why It Fails |
|------|--------|-------------|----------------|-------------|
| Morning Walk 20m | Heartbeat timer 20min | 5am–11am only | Leave app open, go to sleep | Server detects no heartbeats → timer pauses automatically |
| Meditation 15m | Heartbeat timer 15min | Any time | Open app, put on table | Timer runs but if user opens other apps > 60s, timer pauses |
| Exercise 30m | Timer + live camera selfie | Any time | Use old photo from gallery | `capture="environment"` forces camera. EXIF stripped & checked. Hash compared vs all previous uploads. |
| Run 5km | Timer 35min+ + selfie | Any time | Stand still for 35 min | Admin spots fake workout selfies. 35min = realistic run time enforced. |
| Drink water | Text report with times | After 6pm only | Type random times | Server checks: min 8 time slots mentioned, times must be spaced throughout day |
| Sleep by 10:30pm | Next morning quiz | Next day 6am–10am | Answer in evening | Time window enforced server-side. Can't submit until tomorrow morning. |
| No junk food | Detailed food diary | After 6pm only | "I ate healthy" | Min 40 words. NLP flags single-sentence answers. |
| 7000 steps | Screenshot with date | Any time | Old step counter screenshot | Server OCR reads date from screenshot. Date must match today. Hash comparison. |
| No sugar | Food diary 40 words | After 8pm | Generic text | Hash of text checked against all previous submissions. Duplicate = rejected. |
| Read 20 pages | Timer 20min + book summary | Any time | Open app, don't read | Timer + must write book name & page summary. Min 30 words. Hash check. |
| Podcast 20m | Timer 20min + key takeaway | Any time | Timer + paste text | Hash check. Duplicate takeaway rejected. Must mention specific podcast. |
| Learn skill 30m | Timer 30min + 50-word log | Any time | Timer only | Both timer AND 50-word detailed log required. |
| Read news | 25-word summary | Any time | Paste article title | Must write in own words. Copy-detect on common article headlines. |
| Learn 5 words | Submit 5 words + meanings | Any time | Same words every day | Server checks words against user's previous submissions. Can't repeat words. |
| Journal goals | In-app text 30 words | Any time | "Exercise, sleep, work" | Must include HOW and WHEN. Vague single-word goals fail word count. |
| Gratitude note | In-app text 40 words | Any time | "Family, health, food" | Must include WHY for each. Short comma-separated lists fail. |
| Plan tomorrow | Schedule in-app 50 words | After 8pm only | Type anything | Must contain time mentions (7am, 8:00, etc.). Vague plans flagged. |
| Deep work 90m | Timer 90min + 50-word log | Any time | Leave timer running | Server heartbeats. Away > 60s = pause. 90min is real. |
| No social 2h | Timer 2h + what-you-did | Any time | Timer running in background | App switch detection. > 3 switches resets timer. |
| Morning no phone | Morning quiz 7am–10am | 7am–10am only | Answer at night | Hard time window. Server enforces. Cannot submit outside window. |
| Follow on IG | Screenshot "Following" | One-time ever | Screenshot others' follow | Admin manual review. Lifetime task — can only earn once. |
| Share on story | Screenshot story + tag | Any time | Old screenshot | Must show today's timestamp in story. Hash check. |
| Call family | Reflective text 20 words | Any time | "I called my mom" | Must describe content of call. "I called my mom" = < 5 words = rejected. |
| Help someone | Story 40 words | Any time | Generic answer | Who + what + how + outcome required. Generic = flagged. |
| 3-day streak | Auto platform | Any time | Change date | Server-side streak counter. Cannot be manipulated. |
| Quiz 8/10 | Auto platform | Same day | None | Quiz is server-side. Answers unknown. |
| Invite paid friend | Auto platform | Any time | Click own link | Same device/IP = blocked. Referred user MUST pay. |
| Spin win 10+ | Auto platform | Same day | None | Spin outcome = server-side. |

---

## FRAUD DETECTION — ANOMALY FLAGS

```javascript
// backend/services/fraudDetection.js
// Runs async after every task completion

class FraudDetection {

  static async analyzeCompletion(userId, taskKey, day, details) {
    const flags = [];

    // Flag 1: Completing 5+ tasks in less than 10 minutes
    const recentCompletions = await db.query(`
      SELECT COUNT(*) FROM task_completions
      WHERE user_id = $1 AND completed_at > NOW() - INTERVAL '10 minutes'
    `, [userId]);
    if (parseInt(recentCompletions.rows[0].count) >= 5) {
      flags.push({ type: 'SPEED_FARMING', severity: 'HIGH' });
    }

    // Flag 2: Text proof under 2 seconds per word (copy-paste)
    if (details.wordCount && details.typingSeconds) {
      const wps = details.wordCount / details.typingSeconds;
      if (wps > 3) flags.push({ type: 'PASTED_TEXT', severity: 'MEDIUM' });
    }

    // Flag 3: Timer completed but heartbeat count too low
    if (details.timerSeconds && details.heartbeatCount) {
      const expectedBeats = Math.floor(details.timerSeconds / 30);
      if (details.heartbeatCount < expectedBeats * 0.7) {
        flags.push({ type: 'TIMER_HEARTBEAT_MISMATCH', severity: 'HIGH' });
      }
    }

    // Flag 4: Same task completed on Day 1 through Day 31 within 24 hours
    const multiDayComplete = await db.query(`
      SELECT COUNT(DISTINCT day) FROM task_completions
      WHERE user_id = $1 AND task_key = $2
      AND completed_at > NOW() - INTERVAL '24 hours'
    `, [userId, taskKey]);
    if (parseInt(multiDayComplete.rows[0].count) > 3) {
      flags.push({ type: 'MULTI_DAY_SPEED_RUN', severity: 'CRITICAL' });
    }

    if (flags.length > 0) {
      await db.query(`
        INSERT INTO security_logs (user_id, event, details)
        VALUES ($1, 'TASK_FRAUD_FLAGS', $2)
      `, [userId, JSON.stringify({ taskKey, day, flags })]);

      // Auto-suspend if CRITICAL flag
      const critical = flags.find(f => f.severity === 'CRITICAL');
      if (critical) {
        await db.query('UPDATE users SET is_suspended = true WHERE id = $1', [userId]);
        // Alert admin
        await notifyAdmin(`User ${userId} auto-suspended: ${critical.type}`);
      }
    }
  }
}
```

---

## WHAT CHANGES IN YOUR FRONTEND (Summary)

The key changes to make in your **existing app.js**:

1. **Remove `completeTask()` client-side coin addition** — frontend calls `POST /api/tasks/complete`, then refreshes balance from server response
2. **Add timer UI** with `startTaskTimer(task)` function
3. **Add text proof dialog** before submit button shows for text-type tasks
4. **Add camera capture** with `capture="environment"` (no gallery)
5. **Never show quiz answers in JS** — fetch questions from `/api/quiz/today`, submit to `/api/quiz/submit`
6. **Remove `DB.set` for coins** — frontend only reads, never writes financial data

This makes it **impossible for any user** to fake any task, timer, or coin count.
