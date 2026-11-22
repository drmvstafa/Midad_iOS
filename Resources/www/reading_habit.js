/* Midad Daily Reading Habit, Duolingo-Style Companion Mascot & Book Reviews Engine */
(function () {
  'use strict';

  const HABIT_KEY = 'wq_reading_habit_v1';
  const REVIEWS_KEY = 'wq_reviews_v1';
  const HELPFUL_KEY = 'wq_review_helpful_v1';
  const DAY_MS = 86400000;

  function REC() { return window.KOTOB_RECOMMENDER; }
  function KTB() { return window.KTB; }

  function loadJson(k, fb) {
    try { return JSON.parse(localStorage.getItem(k) || 'null') || fb; } catch (_) { return fb; }
  }
  function saveJson(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {}
  }

  function dateKey(ms) {
    const d = new Date(Number(ms) || Date.now());
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function prevDateKey(key) {
    const parts = String(key || '').split('-').map(Number);
    if (parts.length !== 3) return dateKey(Date.now() - DAY_MS);
    const dt = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    return dateKey(dt.getTime() - DAY_MS);
  }

  function normBookKey(bookOrTitle) {
    if (REC() && REC().canonicalBookKey) return REC().canonicalBookKey(bookOrTitle);
    const t = typeof bookOrTitle === 'string' ? bookOrTitle : (bookOrTitle && bookOrTitle.title) || '';
    return String(t).toLowerCase().trim();
  }

  function serializeBookStub(book) {
    if (!book) return null;
    const bk = normBookKey(book);
    if (!bk) return null;
    const en = REC() && REC().enrichBook ? REC().enrichBook(Object.assign({}, book)) : book;
    const tags = REC() && REC().computeBookTagWeights ? REC().computeBookTagWeights(en) : [];
    return {
      external_key: bk,
      title: String(en.title || '').trim() || bk,
      author_name: String(en.author || ''),
      page_count: Number(en.pages) || null,
      reading_difficulty: en.reading_difficulty || 'medium',
      tags,
    };
  }

  function defaultHabitState() {
    return {
      dailyGoalPages: 15,
      reminderHour: 20,
      reminderMinute: 0,
      notificationsEnabled: true,
      dailyHistory: {},
      lastReadDate: '',
      streak: 0,
      longestStreak: 0,
      freezesAvailable: 1,
      freezeUsedDates: {},
      frozenPending: false,
      thawTargetPages: 5,
      previewMood: 'auto',
      lastBookTitle: '',
      lastBookKey: '',
      lastBookPage: 0,
      lastBookTotal: 1,
      telemetryWatermark: {},
      quipIndex: 0,
    };
  }

  function loadHabit() {
    const raw = loadJson(HABIT_KEY, null);
    if (!raw || typeof raw !== 'object') return defaultHabitState();
    return Object.assign(defaultHabitState(), raw, {
      dailyHistory: Object.assign({}, raw.dailyHistory || {}),
      freezeUsedDates: Object.assign({}, raw.freezeUsedDates || {}),
      telemetryWatermark: Object.assign({}, raw.telemetryWatermark || {}),
    });
  }

  function recomputeStreakAndFrozen(h, nowMs) {
    const now = Number(nowMs) || Date.now();
    const today = dateKey(now);
    const yesterday = prevDateKey(today);
    const hist = h.dailyHistory || {};
    const freezes = h.freezeUsedDates || {};
    const goal = Math.max(1, Number(h.dailyGoalPages) || 15);
    const todayPages = Math.max(0, Number(hist[today] || 0));

    // Detect if prior active streak skipped yesterday without a freeze shield
    const lastD = String(h.lastReadDate || '');
    const missedGap = !!(lastD && lastD !== today && lastD !== yesterday && !freezes[yesterday]);
    if (missedGap && (h.streak > 0 || Object.keys(hist).length > 0)) {
      if (todayPages >= Math.min(h.thawTargetPages || 5, goal)) {
        h.frozenPending = false;
      } else {
        h.frozenPending = true;
      }
    } else if (!missedGap && (lastD === today || lastD === yesterday)) {
      if (!missedGap) h.frozenPending = false;
    }

    // Count contiguous active streak backwards from today (or yesterday if not read today yet)
    let streak = 0;
    let cursor = todayPages > 0 ? today : yesterday;
    for (let i = 0; i < 400; i++) {
      const p = Number(hist[cursor] || 0);
      if (p > 0 || freezes[cursor]) {
        streak++;
        cursor = prevDateKey(cursor);
      } else {
        break;
      }
    }
    h.streak = streak;
    h.longestStreak = Math.max(Number(h.longestStreak || 0), streak);
    return h;
  }

  function saveHabit(h, nowMs) {
    recomputeStreakAndFrozen(h, nowMs);
    saveJson(HABIT_KEY, h);
    pushToNativeBridge(h, nowMs);
    return h;
  }

  function pushToNativeBridge(h, nowMs) {
    const ktb = KTB();
    if (!ktb || !ktb.syncHabitState) return;
    const ev = evaluateState(nowMs, h);
    ktb.syncHabitState({
      dailyGoalPages: ev.dailyGoalPages,
      reminderHour: ev.reminderHour,
      reminderMinute: ev.reminderMinute,
      notificationsEnabled: ev.notificationsEnabled,
      todayDate: ev.today,
      todayPages: ev.pagesToday,
      lastReadDate: h.lastReadDate || '',
      streak: ev.streak,
      mood: ev.mood,
      lastBookTitle: h.lastBookTitle || '',
      lastBookPage: h.lastBookPage || 0,
      lastBookTotal: h.lastBookTotal || 1,
    });
  }

  const MOOD_QUIPS = {
    completed: [
      'أحسنت! أتممت ورد اليوم وحافظت على وهج السلسلة.',
      'إنجاز رائع! عقلك يزداد ثراءً مع كل صفحة تنهيها.',
      'شعلة مداد متّقدة بفضل التزامك — هل تفتح الكتاب للتمتع بصفحات إضافية؟',
    ],
    eager: [
      'جلسة قصيرة الآن تقرّبك أكثر من إنهاء كتابك! هيا بنا.',
      'رفيق مداد يجهّز علامة التوقف الأخيرة بانتظارك.',
      'بضع دقائق من القراءة الهادئة الآن تصنع فارقاً رائعاً في يومك.',
    ],
    angry: [
      'تأخرت على صفحاتك اليوم! لا تجعل شعلة السلسلة تنطفئ قبل منتصف الليل.',
      'ما زلتُ أحدّق في الساعة! بقي القليل على هدفك — افتح كتابك فوراً.',
      'همة! خمس دقائق قراءة الآن ترضيني وتنقذ سلسلتك بالكامل.',
    ],
    frozen: [
      'أوه! فوّتّ يوماً فتجمدت السلسلة — اقرأ 5 صفحات الآن لإذابة الجليد فوراً!',
      'بردٌ قارس هنا! ضغطة واحدة على «أكمل القراءة» تعيد الدفء لسلسلتك.',
      'لا تستسلم! إما أن تذيب الجليد بقراءة اليوم أو تستخدم درع التجميد المتاح.',
    ],
  };

  function evaluateState(nowMs, providedHabit) {
    const now = Number(nowMs) || Date.now();
    const h = providedHabit || recomputeStreakAndFrozen(loadHabit(), now);
    const today = dateKey(now);
    const goal = Math.max(1, Number(h.dailyGoalPages) || 15);
    const pagesToday = Math.max(0, Number((h.dailyHistory || {})[today] || 0));
    const remainingPages = Math.max(0, goal - pagesToday);
    const progressPct = Math.min(100, Math.round((pagesToday * 100) / goal));
    const d = new Date(now);
    const nowMins = d.getHours() * 60 + d.getMinutes();
    const dueMins = (Number(h.reminderHour) || 20) * 60 + (Number(h.reminderMinute) || 0);

    let mood = h.previewMood;
    if (!['completed', 'eager', 'angry', 'frozen'].includes(mood)) {
      if (h.frozenPending && pagesToday < Math.min(h.thawTargetPages || 5, goal)) {
        mood = 'frozen';
      } else if (pagesToday >= goal) {
        mood = 'completed';
      } else if ((nowMins >= dueMins + 60 || d.getHours() >= 22) && pagesToday < goal) {
        mood = 'angry';
      } else {
        mood = 'eager';
      }
    }

    const thawNeed = Math.max(0, Math.min(h.thawTargetPages || 5, goal) - pagesToday);
    const quipPool = MOOD_QUIPS[mood] || MOOD_QUIPS.eager;
    const quip = quipPool[Math.abs(Number(h.quipIndex || 0)) % quipPool.length];
    const badgeMap = {
      completed: 'تمت مهمة اليوم',
      eager: 'مهمة اليوم نشطة',
      angry: 'تأخرت عن الموعد!',
      frozen: 'السلسلة متجمدة',
    };
    const remTimeStr = String(h.reminderHour).padStart(2, '0') + ':' + String(h.reminderMinute).padStart(2, '0');

    return {
      today,
      pagesToday,
      dailyGoalPages: goal,
      remainingPages,
      progressPct,
      streak: h.streak || 0,
      longestStreak: h.longestStreak || 0,
      freezesAvailable: Number(h.freezesAvailable || 0),
      frozenPending: !!h.frozenPending,
      thawRemaining: thawNeed,
      mood,
      badgeLabel: badgeMap[mood] || 'رفيق مداد',
      quip,
      reminderHour: Number(h.reminderHour) || 20,
      reminderMinute: Number(h.reminderMinute) || 0,
      reminderTimeStr: remTimeStr,
      notificationsEnabled: h.notificationsEnabled !== false,
      lastBookTitle: h.lastBookTitle || '',
      lastBookPage: Number(h.lastBookPage || 0),
      lastBookTotal: Math.max(1, Number(h.lastBookTotal || 1)),
      previewMood: h.previewMood || 'auto',
    };
  }

  function updateConfig(patch, nowMs) {
    const h = loadHabit();
    if (patch.dailyGoalPages != null) {
      h.dailyGoalPages = Math.max(1, Math.min(300, Math.round(Number(patch.dailyGoalPages) || 15)));
    }
    if (patch.reminderTime) {
      const m = String(patch.reminderTime).match(/^(\d{1,2}):(\d{1,2})$/);
      if (m) {
        h.reminderHour = Math.max(0, Math.min(23, Number(m[1])));
        h.reminderMinute = Math.max(0, Math.min(59, Number(m[2])));
      }
    }
    if (patch.reminderHour != null) h.reminderHour = Math.max(0, Math.min(23, Number(patch.reminderHour)));
    if (patch.reminderMinute != null) h.reminderMinute = Math.max(0, Math.min(59, Number(patch.reminderMinute)));
    if (patch.notificationsEnabled != null) {
      h.notificationsEnabled = !!patch.notificationsEnabled;
      if (h.notificationsEnabled && KTB() && KTB().requestNotificationPermission) {
        KTB().requestNotificationPermission();
      }
    }
    if (patch.previewMood != null) {
      h.previewMood = ['auto', 'completed', 'eager', 'angry', 'frozen'].includes(patch.previewMood)
        ? patch.previewMood : 'auto';
    }
    return saveHabit(h, nowMs);
  }

  function logPagesRead(deltaPages, bookMeta, nowMs) {
    const now = Number(nowMs) || Date.now();
    const today = dateKey(now);
    const delta = Math.max(0, Math.min(250, Math.round(Number(deltaPages) || 0)));
    const h = loadHabit();
    const prevToday = Math.max(0, Number(h.dailyHistory[today] || 0));
    h.dailyHistory[today] = prevToday + delta;
    if (delta > 0) {
      h.lastReadDate = today;
      const yesterday = prevDateKey(today);
      if (h.frozenPending && h.dailyHistory[today] >= Math.min(h.thawTargetPages || 5, h.dailyGoalPages || 15)) {
        h.frozenPending = false;
        h.freezeUsedDates[yesterday] = true;
      }
      if (h.previewMood === 'angry' || h.previewMood === 'frozen') {
        if (h.dailyHistory[today] >= (h.dailyGoalPages || 15)) h.previewMood = 'auto';
      }
    }
    if (bookMeta && bookMeta.title) {
      h.lastBookTitle = bookMeta.title;
      h.lastBookKey = normBookKey(bookMeta);
      if (bookMeta.page) h.lastBookPage = Number(bookMeta.page);
      if (bookMeta.totalPages) h.lastBookTotal = Math.max(1, Number(bookMeta.totalPages));
    }
    // Award bonus Freeze shield when hitting milestones every 7 days
    saveHabit(h, now);
    const ev = evaluateState(now, h);
    if (ev.streak > 0 && ev.streak % 7 === 0 && !h.freezeUsedDates['bonus_' + ev.streak]) {
      h.freezeUsedDates['bonus_' + ev.streak] = true;
      h.freezesAvailable = Math.min(3, (h.freezesAvailable || 0) + 1);
      saveHabit(h, now);
    }
    return ev;
  }

  function activateFreezeShield(nowMs) {
    const now = Number(nowMs) || Date.now();
    const today = dateKey(now);
    const yesterday = prevDateKey(today);
    const h = loadHabit();
    if ((h.freezesAvailable || 0) <= 0) return false;
    h.freezesAvailable = Math.max(0, h.freezesAvailable - 1);
    h.freezeUsedDates[yesterday] = true;
    h.frozenPending = false;
    h.lastReadDate = yesterday;
    if (h.previewMood === 'frozen') h.previewMood = 'auto';
    saveHabit(h, now);
    return true;
  }

  function simulateMoodScenario(mode, nowMs) {
    const now = Number(nowMs) || Date.now();
    const h = loadHabit();
    if (mode === 'reset') {
      const def = defaultHabitState();
      saveHabit(def, now);
      return evaluateState(now, def);
    }
    if (mode === 'frozen') {
      const twoDaysAgo = prevDateKey(prevDateKey(dateKey(now)));
      h.dailyHistory[twoDaysAgo] = h.dailyGoalPages || 15;
      delete h.dailyHistory[dateKey(now)];
      delete h.dailyHistory[prevDateKey(dateKey(now))];
      delete h.freezeUsedDates[prevDateKey(dateKey(now))];
      h.lastReadDate = twoDaysAgo;
      h.streak = Math.max(3, h.streak || 3);
      h.frozenPending = true;
      h.previewMood = 'frozen';
    } else if (['auto', 'completed', 'eager', 'angry'].includes(mode)) {
      h.previewMood = mode;
    }
    saveHabit(h, now);
    return evaluateState(now, h);
  }

  function cycleMascotQuip() {
    const h = loadHabit();
    h.quipIndex = (Number(h.quipIndex || 0) + 1) % 12;
    saveHabit(h);
    return evaluateState(Date.now(), h);
  }

  function syncFromTelemetry(telemetryMap, nowMs) {
    const now = Number(nowMs) || Date.now();
    const today = dateKey(now);
    const h = loadHabit();
    let changed = false;

    // 1) Pull native Android reader & Home Widget daily count (if higher than web count for today)
    const nat = KTB() && KTB().getNativeHabitToday ? KTB().getNativeHabitToday() : null;
    if (nat && nat.todayDate === today && Number(nat.todayPages) > Number(h.dailyHistory[today] || 0)) {
      h.dailyHistory[today] = Number(nat.todayPages);
      if (nat.lastReadDate) h.lastReadDate = nat.lastReadDate;
      if (Number(nat.streak) > Number(h.streak || 0)) h.streak = Number(nat.streak);
      h.frozenPending = false;
      changed = true;
    }

    // 2) Inspect telemetryMap entries for recent reading position + incremental page gains
    let bestBook = null;
    let bestTs = 0;
    for (const [k, raw] of Object.entries(telemetryMap || {})) {
      if (!raw || typeof raw !== 'object') continue;
      const maxP = Math.max(0, Number(raw.maxPage != null ? raw.maxPage : raw.page) || 0);
      const curP = Math.max(0, Number(raw.page) || maxP);
      const ts = Number(raw.lastReadAt || 0);
      if (ts > bestTs && (raw.title || raw.bookKey)) {
        bestTs = ts;
        bestBook = raw;
      }
      if (maxP > 0) {
        const prevWm = h.telemetryWatermark[k];
        if (prevWm == null) {
          h.telemetryWatermark[k] = maxP;
          // Only credit small first-session delta if updated within the last 12 hours
          if (ts > 0 && dateKey(ts) === today && maxP <= 25 && !(nat && nat.todayPages > 0)) {
            h.dailyHistory[today] = Math.max(0, Number(h.dailyHistory[today] || 0)) + maxP;
            h.lastReadDate = today;
          }
          changed = true;
        } else if (maxP > prevWm) {
          const gain = Math.min(60, maxP - prevWm);
          h.telemetryWatermark[k] = maxP;
          if (!ts || dateKey(ts) === today) {
            h.dailyHistory[today] = Math.max(0, Number(h.dailyHistory[today] || 0)) + gain;
            h.lastReadDate = today;
          }
          changed = true;
        }
      }
    }

    if (bestBook && bestBook.title && bestBook.title !== h.lastBookTitle) {
      h.lastBookTitle = bestBook.title;
      h.lastBookKey = normBookKey(bestBook);
      h.lastBookPage = Number(bestBook.page || 1);
      h.lastBookTotal = Math.max(1, Number(bestBook.totalPages || 1));
      changed = true;
    }

    if (changed) saveHabit(h, now);
    else recomputeStreakAndFrozen(h, now);
    return evaluateState(now, h);
  }

  // Exclusive Midad Reading Character Vector Mascot ('Habbour' — Ink & Quill Book Spirit, Zero Emojis)
  function getMascotSvg(mood) {
    const m = (mood === 'completed' || mood === 'angry' || mood === 'frozen') ? mood : 'eager';
    const pal = m === 'completed'
      ? { top: '#6ee7b7', mid: '#10b981', bot: '#047857', shade: '#064e3b', cheek: '#fb7185', belly: '#fef3c7', qTop: '#fef08a', qBot: '#ca8a04', cov: '#92400e', covHi: '#fbbf24', rib: '#f59e0b' }
      : (m === 'angry'
        ? { top: '#4ade80', mid: '#16a34a', bot: '#15803d', shade: '#14532d', cheek: '#f43f5e', belly: '#fef2f2', qTop: '#fca5a5', qBot: '#dc2626', cov: '#9f1239', covHi: '#fb7185', rib: '#fde047' }
        : (m === 'frozen'
          ? { top: '#bae6fd', mid: '#38bdf8', bot: '#0284c7', shade: '#075985', cheek: '#7dd3fc', belly: '#f0f9ff', qTop: '#e0f2fe', qBot: '#0369a1', cov: '#0369a1', covHi: '#7dd3fc', rib: '#e0f2fe' }
          : { top: '#34d399', mid: '#10b981', bot: '#047857', shade: '#065f46', cheek: '#fb7185', belly: '#fffbeb', qTop: '#fde047', qBot: '#d97706', cov: '#b45309', covHi: '#f59e0b', rib: '#ef4444' }));

    const glassesFace = m === 'completed'
      ? '<g transform="translate(0,1)">'
        + '<circle cx="72.5" cy="63" r="13.5" fill="rgba(255,255,255,0.22)" stroke="#f59e0b" stroke-width="3.2"/>'
        + '<circle cx="107.5" cy="63" r="13.5" fill="rgba(255,255,255,0.22)" stroke="#f59e0b" stroke-width="3.2"/>'
        + '<path d="M86 63 Q90 60 94 63" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>'
        + '<path d="M66 64 Q72.5 55 79 64" fill="none" stroke="#064e3b" stroke-width="3.6" stroke-linecap="round"/>'
        + '<path d="M101 64 Q107.5 55 114 64" fill="none" stroke="#064e3b" stroke-width="3.6" stroke-linecap="round"/>'
        + '<path d="M83 75 Q90 84 97 75 Z" fill="#fb7185" stroke="#064e3b" stroke-width="2.2" stroke-linejoin="round"/>'
        + '</g>'
      : (m === 'angry'
        ? '<g transform="translate(0,2)">'
          + '<circle cx="72.5" cy="65" r="13.2" fill="rgba(255,255,255,0.24)" stroke="#f59e0b" stroke-width="3.2"/>'
          + '<circle cx="107.5" cy="65" r="13.2" fill="rgba(255,255,255,0.24)" stroke="#f59e0b" stroke-width="3.2"/>'
          + '<path d="M85.7 65 Q90 63 94.3 65" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>'
          + '<ellipse cx="72.5" cy="63.5" rx="6.5" ry="7" fill="#ffffff"/><ellipse cx="107.5" cy="63.5" rx="6.5" ry="7" fill="#ffffff"/>'
          + '<circle cx="74" cy="63" r="3.9" fill="#0f172a"/><circle cx="106" cy="63" r="3.9" fill="#0f172a"/>'
          + '<circle cx="75.3" cy="61.2" r="1.4" fill="#fff"/><circle cx="107.3" cy="61.2" r="1.4" fill="#fff"/>'
          + '<path d="M60 51 L82 57" stroke="#0f172a" stroke-width="4.2" stroke-linecap="round"/>'
          + '<path d="M120 51 L98 57" stroke="#0f172a" stroke-width="4.2" stroke-linecap="round"/>'
          + '<path d="M82 79 Q90 73 98 79" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>'
          + '</g>'
        : (m === 'frozen'
          ? '<g>'
            + '<circle cx="72.5" cy="63" r="13.2" fill="rgba(224,242,254,0.4)" stroke="#bae6fd" stroke-width="3.2"/>'
            + '<circle cx="107.5" cy="63" r="13.2" fill="rgba(224,242,254,0.4)" stroke="#bae6fd" stroke-width="3.2"/>'
            + '<path d="M85.7 63 Q90 60 94.3 63" fill="none" stroke="#bae6fd" stroke-width="3" stroke-linecap="round"/>'
            + '<ellipse cx="72.5" cy="63" rx="6.4" ry="6.8" fill="#f8fafc"/><ellipse cx="107.5" cy="63" rx="6.4" ry="6.8" fill="#f8fafc"/>'
            + '<circle cx="72.5" cy="64" r="3.4" fill="#0c4a6e"/><circle cx="107.5" cy="64" r="3.4" fill="#0c4a6e"/>'
            + '<path d="M63 52 Q71 49 79 53" fill="none" stroke="#0c4a6e" stroke-width="2.6" stroke-linecap="round"/>'
            + '<path d="M117 52 Q109 49 101 53" fill="none" stroke="#0c4a6e" stroke-width="2.6" stroke-linecap="round"/>'
            + '<path d="M81 77 L85.5 74 L90 77 L94.5 74 L99 77" fill="none" stroke="#0c4a6e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
            + '</g>'
          : '<g>'
            + '<circle cx="72.5" cy="63" r="13.5" fill="rgba(255,255,255,0.22)" stroke="#f59e0b" stroke-width="3.2"/>'
            + '<circle cx="107.5" cy="63" r="13.5" fill="rgba(255,255,255,0.22)" stroke="#f59e0b" stroke-width="3.2"/>'
            + '<path d="M86 63 Q90 60 94 63" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>'
            + '<ellipse cx="72.5" cy="63" rx="6.9" ry="7.3" fill="#ffffff"/><ellipse cx="107.5" cy="63" rx="6.9" ry="7.3" fill="#ffffff"/>'
            + '<circle class="owl-pupil" cx="73.8" cy="63" r="4.1" fill="#0f172a"/>'
            + '<circle class="owl-pupil" cx="108.8" cy="63" r="4.1" fill="#0f172a"/>'
            + '<circle cx="75.5" cy="60.8" r="1.6" fill="#fff"/><circle cx="110.5" cy="60.8" r="1.6" fill="#fff"/>'
            + '<path d="M84 74.5 Q90 80 96 74.5" fill="none" stroke="#064e3b" stroke-width="2.8" stroke-linecap="round"/>'
            + '</g>'));

    const pawsSvg = m === 'completed'
      ? '<ellipse cx="48" cy="86" rx="11" ry="8.5" transform="rotate(-28 48 86)" fill="' + pal.top + '" stroke="' + pal.shade + '" stroke-width="2"/>'
        + '<ellipse cx="132" cy="86" rx="11" ry="8.5" transform="rotate(28 132 86)" fill="' + pal.top + '" stroke="' + pal.shade + '" stroke-width="2"/>'
      : '<ellipse cx="62" cy="100" rx="11.5" ry="7.8" fill="' + pal.top + '" stroke="' + pal.shade + '" stroke-width="2"/>'
        + '<ellipse cx="118" cy="100" rx="11.5" ry="7.8" fill="' + pal.top + '" stroke="' + pal.shade + '" stroke-width="2"/>';

    const extrasSvg = m === 'completed'
      ? '<g transform="translate(90,22)"><path d="M-15 8 L-18 -6 L-6 1 L0 -10 L6 1 L18 -6 L15 8 Z" fill="#fbbf24" stroke="#b45309" stroke-width="2" stroke-linejoin="round"/></g>'
        + '<g class="celebrate-sparks"><path d="M26 42 L30 34 L34 42 L42 46 L34 50 L30 58 L26 50 L18 46 Z" fill="#fde047"/>'
        + '<path d="M148 34 L151 28 L154 34 L160 37 L154 40 L151 46 L148 40 L142 37 Z" fill="#fde047"/></g>'
      : (m === 'angry'
        ? '<g class="angry-steam"><path d="M36 46 Q28 34 38 24" fill="none" stroke="#fbbf24" stroke-width="3.6" stroke-linecap="round"/>'
          + '<path d="M144 46 Q152 34 142 24" fill="none" stroke="#fbbf24" stroke-width="3.6" stroke-linecap="round"/></g>'
        : (m === 'frozen'
          ? '<g class="ice-overlay"><polygon points="36,34 144,32 152,118 28,120" fill="rgba(186,230,253,0.34)" stroke="#e0f2fe" stroke-width="2.4" stroke-linejoin="round"/>'
            + '<polygon points="44,34 52,20 60,34" fill="#bae6fd"/><polygon points="122,32 129,18 136,32" fill="#bae6fd"/></g>'
          : '<path d="M144 36 L146.5 30 L149 36 L155 38.5 L149 41 L146.5 47 L144 41 L138 38.5 Z" fill="#fde047"/>'));

    return '<svg class="companion-mascot-svg mood-' + m + '" viewBox="0 0 180 132" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'
      + '<path d="M46 92 Q15 74 20 48 Q31 59 38 74 Q45 82 51 86 Z" fill="' + pal.qBot + '" stroke="' + pal.shade + '" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M88 30 Q90 6 112 8 Q104 24 94 31 Z" fill="' + pal.qTop + '" stroke="' + pal.shade + '" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M90 24 C104 24,114 33,122 45 C133 58,138 77,132 95 C126 108,54 108,48 95 C42 77,47 58,58 45 C66 33,76 24,90 24 Z" fill="' + pal.mid + '" stroke="' + pal.shade + '" stroke-width="2.5" stroke-linejoin="round"/>'
      + '<ellipse cx="78" cy="40" rx="11" ry="5.5" transform="rotate(-18 78 40)" fill="#ffffff" opacity="0.22"/>'
      + '<ellipse cx="90" cy="81" rx="27" ry="19" fill="' + pal.belly + '" opacity="0.93"/>'
      + '<ellipse cx="57.5" cy="73.5" rx="6" ry="3.5" fill="' + pal.cheek + '" opacity="0.78"/>'
      + '<ellipse cx="122.5" cy="73.5" rx="6" ry="3.5" fill="' + pal.cheek + '" opacity="0.78"/>'
      + glassesFace
      + '<path d="M28 106 L90 118 L152 106 L154 114 L90 124 L26 114 Z" fill="' + pal.cov + '" stroke="#451a03" stroke-width="1.8" stroke-linejoin="round"/>'
      + '<path d="M32 98 Q61 92 90 103 L90 116 Q61 106 31 110 Z" fill="#fffbeb" stroke="' + pal.covHi + '" stroke-width="1.8" stroke-linejoin="round"/>'
      + '<path d="M148 98 Q119 92 90 103 L90 116 Q119 106 149 110 Z" fill="#fffbeb" stroke="' + pal.covHi + '" stroke-width="1.8" stroke-linejoin="round"/>'
      + '<path d="M98 112 L103 114 L103 128 L99.5 124 L96 128 Z" fill="' + pal.rib + '" stroke="#7f1d1d" stroke-width="1"/>'
      + pawsSvg
      + extrasSvg
      + '</svg>';
  }

  // ==================================================================
  // Real Book Ratings & User / Verified Reader Reviews System (No Fake Seeded Reviews)
  // ==================================================================
  function getStoredReviewsMap() { return loadJson(REVIEWS_KEY, {}); }
  function saveStoredReviewsMap(map) { saveJson(REVIEWS_KEY, map); }
  function getHelpfulSet() { return new Set(loadJson(HELPFUL_KEY, [])); }
  function saveHelpfulSet(set) { saveJson(HELPFUL_KEY, Array.from(set)); }

  function seededReviewsForBook() {
    return [];
  }

  function getReviewsForBook(book, sortBy, externalReviews) {
    const bk = normBookKey(book);
    if (!bk) return [];
    const storedMap = getStoredReviewsMap();
    const userStored = Array.isArray(storedMap[bk]) ? storedMap[bk] : [];
    const extList = Array.isArray(externalReviews) ? externalReviews : [];
    const helpfulSet = getHelpfulSet();

    const combined = [];
    const seenIds = new Set();
    for (const r of [...userStored, ...extList]) {
      if (!r || !r.id || seenIds.has(r.id)) continue;
      seenIds.add(r.id);
      const voted = helpfulSet.has(bk + '|' + r.id);
      combined.push(Object.assign({}, r, {
        helpfulByMe: voted,
        helpfulCount: Math.max(0, Number(r.helpfulCount || 0) + (voted && r.isExternal ? 1 : 0)),
      }));
    }

    const mode = sortBy || 'positive';
    if (mode === 'recent') {
      combined.sort((a, b) => (b.isUser ? 1 : 0) - (a.isUser ? 1 : 0) || (b.ts || 0) - (a.ts || 0));
    } else if (mode === 'helpful') {
      combined.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0) || (b.rating || 0) - (a.rating || 0));
    } else {
      combined.sort((a, b) => (b.isUser ? 1 : 0) - (a.isUser ? 1 : 0) || (b.rating || 0) - (a.rating || 0) || (b.helpfulCount || 0) - (a.helpfulCount || 0));
    }
    return combined;
  }

  function getRatingSummary(book, externalReviews, externalStats) {
    const list = getReviewsForBook(book, 'recent', externalReviews);
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    let userReview = null;
    for (const r of list) {
      const rt = Math.max(1, Math.min(5, Number(r.rating) || 5));
      dist[rt] = (dist[rt] || 0) + 1;
      sum += rt;
      if (r.isUser && !userReview) userReview = r;
    }
    const count = list.length;
    if (count > 0) {
      return {
        average: Math.round((sum / count) * 10) / 10,
        count,
        distribution: dist,
        userReview,
        externalOnly: false,
      };
    }
    if (externalStats && Number(externalStats.average) > 0 && Number(externalStats.count) > 0) {
      return {
        average: Math.round(Number(externalStats.average) * 10) / 10,
        count: Number(externalStats.count),
        distribution: dist,
        userReview: null,
        externalOnly: true,
        externalSource: externalStats.source || '',
      };
    }
    return { average: 0, count: 0, distribution: dist, userReview: null, externalOnly: false };
  }

  function saveUserReview(book, fields) {
    const bk = normBookKey(book);
    if (!bk || !fields) return null;
    const rating = Math.max(1, Math.min(5, Number(fields.rating) || 5));
    const text = String(fields.text || '').trim();
    const tag = String(fields.tag || '').trim() || (rating >= 4 ? 'أنصح بإكماله' : 'انطباع قارئ');
    const authorName = String(fields.authorName || 'أنت (قارئ مداد)').trim();
    const now = Date.now();

    const map = getStoredReviewsMap();
    const existingArr = Array.isArray(map[bk]) ? map[bk].slice() : [];
    const prevIdx = existingArr.findIndex(x => x && x.isUser);
    const id = prevIdx >= 0 ? existingArr[prevIdx].id : ('user_rev_' + now);
    const prevHelpful = prevIdx >= 0 ? Number(existingArr[prevIdx].helpfulCount || 0) : 0;

    const revObj = {
      id,
      authorName,
      rating,
      tag,
      text: text || ('تقييم ' + rating + ' نجوم — ' + tag),
      helpfulCount: prevHelpful,
      isUser: true,
      ts: now,
    };
    if (prevIdx >= 0) existingArr[prevIdx] = revObj;
    else existingArr.unshift(revObj);
    map[bk] = existingArr;
    saveStoredReviewsMap(map);

    if (REC() && REC().setBookRating) {
      REC().setBookRating(book, rating, false);
    }
    const ktb = KTB();
    if (ktb && ktb.recDbSaveReview) {
      ktb.recDbSaveReview({
        user_id: 1,
        review_id: id,
        external_key: bk,
        author_name: authorName,
        rating,
        review_text: revObj.text,
        sentiment_tag: tag,
        helpful_count: prevHelpful,
        is_user: true,
        created_at: now,
        book: serializeBookStub(book),
      });
    }
    return revObj;
  }

  function deleteUserReview(book, reviewId) {
    const bk = normBookKey(book);
    if (!bk || !reviewId) return false;
    const map = getStoredReviewsMap();
    const arr = Array.isArray(map[bk]) ? map[bk] : [];
    const next = arr.filter(r => !(r && r.id === reviewId && r.isUser));
    if (next.length === arr.length) return false;
    if (next.length) map[bk] = next;
    else delete map[bk];
    saveStoredReviewsMap(map);
    const ktb = KTB();
    if (ktb && ktb.recDbDeleteReview) ktb.recDbDeleteReview(bk, reviewId);
    return true;
  }

  function toggleHelpfulReview(book, reviewId) {
    const bk = normBookKey(book);
    if (!bk || !reviewId) return false;
    const hSet = getHelpfulSet();
    const k = bk + '|' + reviewId;
    const nowOn = !hSet.has(k);
    if (nowOn) hSet.add(k);
    else hSet.delete(k);
    saveHelpfulSet(hSet);

    const map = getStoredReviewsMap();
    const arr = Array.isArray(map[bk]) ? map[bk] : [];
    const idx = arr.findIndex(r => r && r.id === reviewId);
    if (idx >= 0) {
      arr[idx].helpfulCount = Math.max(0, Number(arr[idx].helpfulCount || 0) + (nowOn ? 1 : -1));
      saveStoredReviewsMap(map);
    }
    const ktb = KTB();
    if (ktb && ktb.recDbToggleReviewHelpful) ktb.recDbToggleReviewHelpful(bk, reviewId, nowOn ? 1 : -1);
    return nowOn;
  }

  function getPositiveMotivationHook(book, pct) {
    const list = getReviewsForBook(book, 'positive');
    const bestPos = list.find(r => Number(r.rating || 0) >= 4 && String(r.text || '').trim().length > 10);
    if (!bestPos) return null;
    let stagePrefix = '';
    const p = Number(pct || 0);
    if (p >= 75) stagePrefix = 'أوشكت على خط النهاية!';
    else if (p >= 35) stagePrefix = 'وصلت للجزء الأمتع من الكتاب!';
    else if (p > 0) stagePrefix = 'بداية ممتازة — واصل الزخم!';
    else stagePrefix = 'رأي قارئ حقيقي:';
    return {
      stagePrefix,
      quote: bestPos.text,
      reviewer: bestPos.authorName + ' • ' + bestPos.rating + '/5',
      tag: bestPos.tag || 'أنصح بإكماله',
    };
  }

  function resetAllHabit() {
    localStorage.removeItem(HABIT_KEY);
    localStorage.removeItem(REVIEWS_KEY);
    localStorage.removeItem(HELPFUL_KEY);
    pushToNativeBridge(defaultHabitState(), Date.now());
  }

  window.KOTOB_HABIT = {
    MOOD_QUIPS,
    dateKey,
    prevDateKey,
    evaluateState,
    updateConfig,
    logPagesRead,
    activateFreezeShield,
    simulateMoodScenario,
    cycleMascotQuip,
    syncFromTelemetry,
    getMascotSvg,
    getReviewsForBook,
    getRatingSummary,
    saveUserReview,
    deleteUserReview,
    toggleHelpfulReview,
    getPositiveMotivationHook,
    resetAllHabit,
  };
})();
