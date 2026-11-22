/**
 * Unified Native Android <-> Web Preview Bridge.
 * In Android APK: dispatches via window.Native (Java Bridge) + async cbId polling.
 * In PC Browser (tools/devserver.py): routes via POST /api/http and /api/download.
 */
(function () {
  const N = typeof window.Native !== 'undefined' ? window.Native : null;
  const pending = {};
  const activeHttp = new Map();
  const webQueue = [];
  const MAX_WEB_CONCURRENT = 16;
  let webInFlight = 0;
  let seq = 1;

  function abortHttp(tag) {
    for (let i = webQueue.length - 1; i >= 0; i--) {
      const qEntry = webQueue[i];
      if (!tag || qEntry.tag === tag) {
        webQueue.splice(i, 1);
        qEntry.cancel();
      }
    }
    for (const [reqId, cancelFn] of Array.from(activeHttp.entries())) {
      if (!tag || cancelFn.tag === tag) {
        activeHttp.delete(reqId);
        try { cancelFn(); } catch (_) { }
      }
    }
  }

  function pumpWebQueue() {
    while (webInFlight < MAX_WEB_CONCURRENT && webQueue.length) {
      let bestIdx = 0;
      for (let i = 1; i < webQueue.length; i++) {
        if (webQueue[i].prio < webQueue[bestIdx].prio) bestIdx = i;
      }
      const task = webQueue.splice(bestIdx, 1)[0];
      if (task && !task.aborted) {
        webInFlight++;
        task.start();
      }
    }
  }

  function nextId() {
    return 'c_' + Date.now().toString(36) + '_' + (seq++);
  }

  function ev(type, data) {
    window.dispatchEvent(new CustomEvent('kotob:' + type, { detail: data }));
  }

  function cb(id) {
    const fn = pending[id];
    if (!fn) return;
    delete pending[id];
    let raw = '{}';
    try { raw = N ? N.takeResp(id) : '{}'; } catch (_) { }
    try { fn(JSON.parse(raw)); } catch (_) { fn({ code: 0, body: raw }); }
  }

  async function http(url, opts) {
    const o = opts || {};
    const method = (o.method || 'GET').toUpperCase();
    const payload = o.payload != null ? String(o.payload) : '';
    const headersJson = o.headers ? JSON.stringify(o.headers) : '';
    const timeoutMs = Number(o.timeoutMs) > 0 ? Number(o.timeoutMs) : (N ? 0 : 4500);
    const tag = o.tag ? String(o.tag) : '';

    if (N) {
      return new Promise((resolve) => {
        const id = nextId();
        let settled = false;
        let timer = null;
        const finish = (res) => {
          if (settled) return;
          settled = true;
          if (timer) clearTimeout(timer);
          activeHttp.delete(id);
          delete pending[id];
          resolve(res);
        };
        pending[id] = finish;
        const cancelFn = () => finish({ code: 0, error: 'aborted', body: '' });
        cancelFn.tag = tag;
        activeHttp.set(id, cancelFn);
        if (o.signal) {
          if (o.signal.aborted) { cancelFn(); return; }
          o.signal.addEventListener('abort', cancelFn, { once: true });
        }
        if (timeoutMs > 0) {
          timer = setTimeout(() => finish({ code: 0, error: 'timeout', body: '' }), timeoutMs);
        }
        try {
          N.http(id, method, url, payload, headersJson);
        } catch (e) {
          finish({ code: 0, error: String(e), body: '' });
        }
      });
    }

    const prio = (o.priority === 'high' || tag === 'search' || tag === 'modal') ? 0 : ((o.priority === 'low' || tag === 'cover') ? 2 : 1);
    const reqId = nextId();
    return new Promise((resolve) => {
      let finished = false;
      let timer = null;
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const done = (res) => {
        if (finished) return;
        finished = true;
        if (timer) clearTimeout(timer);
        activeHttp.delete(reqId);
        if (o.signal) try { o.signal.removeEventListener('abort', onCancel); } catch (_) { }
        resolve(res);
      };
      const onCancel = () => {
        qEntry.aborted = true;
        const qi = webQueue.indexOf(qEntry);
        if (qi >= 0) webQueue.splice(qi, 1);
        try { ctrl && ctrl.abort(); } catch (_) { }
        done({ code: 0, error: 'aborted', body: '' });
      };
      onCancel.tag = tag;
      const qEntry = {
        prio,
        tag,
        aborted: false,
        cancel: onCancel,
        start: async () => {
          activeHttp.set(reqId, onCancel);
          if (timeoutMs > 0) {
            timer = setTimeout(() => {
              try { ctrl && ctrl.abort(); } catch (_) { }
              done({ code: 0, error: 'timeout', body: '' });
            }, timeoutMs);
          }
          try {
            const r = await fetch('/api/http', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                method,
                url,
                payload: payload || null,
                headers: o.headers || {},
                timeoutMs,
              }),
              signal: ctrl ? ctrl.signal : undefined,
            });
            done(await r.json());
          } catch (e) {
            done({ code: 0, error: (e && e.name === 'AbortError') ? 'aborted' : String(e), body: '' });
          } finally {
            webInFlight = Math.max(0, webInFlight - 1);
            pumpWebQueue();
          }
        },
      };
      if (o.signal) {
        if (o.signal.aborted) { done({ code: 0, error: 'aborted', body: '' }); return; }
        o.signal.addEventListener('abort', onCancel, { once: true });
      }
      webQueue.push(qEntry);
      pumpWebQueue();
    });
  }

  async function solveWeb(url, mode, script) {
    if (!N) {
      return { ok: false, error: 'web_preview_no_cf_solver' };
    }
    return new Promise((resolve) => {
      const id = nextId();
      pending[id] = resolve;
      try {
        N.solveWeb(id, url, mode || 'html', script || '');
      } catch (e) {
        delete pending[id];
        resolve({ ok: false, error: String(e) });
      }
    });
  }

  function cancelSolve() {
    if (N && N.cancelSolve) {
      try { N.cancelSolve(); } catch (_) {}
    }
  }

  function isAndroid() { return !!N; }
  function isIOS() { return !!(N && N._ios) || (/iPad|iPhone|iPod/.test(navigator.userAgent || '') && !window.MSStream); }
  function has1DM() { return N ? (N.has1DM() || '') : ''; }
  function send1DM(url, title, referer) { return N ? !!N.send1DM(url, title, referer || '') : false; }

  function downloadBook(job) {
    if (N) {
      N.downloadNative(JSON.stringify(job));
      return true;
    }
    const u = '/api/download?url=' + encodeURIComponent(job.url)
      + '&name=' + encodeURIComponent((job.title || 'book') + '.' + (job.format || 'pdf'))
      + (job.referer ? '&referer=' + encodeURIComponent(job.referer) : '');
    const a = document.createElement('a');
    a.href = u;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  }

  function cancelDownload(id) { if (N) N.cancelDownload(id); }
  function registerSavedDownload(job) {
    if (N && N.registerSavedDownload) {
      N.registerSavedDownload(JSON.stringify(job));
      return true;
    }
    return false;
  }
  function removeDownload(id) { if (N) N.removeDownload(id); }
  function getDownloads() {
    if (!N) return [];
    try { return JSON.parse(N.getDownloads() || '[]'); } catch (_) { return []; }
  }
  function openBook(uri, fileName, title) {
    if (!N) return false;
    return !!N.openInternalReader(uri, fileName || 'book.pdf', title || fileName || '');
  }
  function openExternalReader(uri, fileName) { return N ? !!N.openExternalReader(uri, fileName || 'book.pdf') : false; }
  function pickLocalBook() {
    if (N) { N.pickLocalBook(); return true; }
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.pdf,.epub,.azw3,.mobi,.prc,.fb2,.cbz,.txt,.md,.html,.htm,application/pdf,application/epub+zip,application/vnd.amazon.ebook,text/plain,text/html';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      window.open(url, '_blank', 'noopener');
    };
    inp.click();
    return true;
  }
  function getLocalBooks() {
    if (!N) return [];
    try { return JSON.parse(N.getLocalBooks() || '[]'); } catch (_) { return []; }
  }
  function removeLocalBook(uri) { if (N) N.removeLocalBook(uri); }
  function deleteBook(opts) {
    const o = opts || {};
    if (N && N.deleteBook) {
      return !!N.deleteBook(o.uri || '', o.downloadId || '', o.fileName || '', Number(o.sizeBytes || 0), !!o.fromDevice);
    }
    return true;
  }
  function restoreHiddenBooks() {
    if (N && N.restoreHiddenBooks) N.restoreHiddenBooks();
  }
  function hasStorageAccess() { return N ? !!N.hasStorageAccess() : true; }
  function requestStorageAccess() { if (N) N.requestStorageAccess(); }
  function pickBookFolder() { if (N) N.pickBookFolder(); else pickLocalBook(); }
  function scanDeviceBooks() { if (N && N.scanDeviceBooks) N.scanDeviceBooks(); }
  function openUrl(url) {
    if (N) N.openUrl(url);
    else window.open(url, '_blank', 'noopener');
  }
  function openInstaPay(number, paymentUrl) {
    const clean = String(number || '01027608911').trim();
    const pUrl = String(paymentUrl || '').trim();
    if (N && N.openInstaPay) {
      N.openInstaPay(clean, pUrl);
      return;
    }
    copy(clean);
    toast('تم نسخ رقم InstaPay: ' + clean + ' — افتح تطبيق InstaPay للتحويل');
    if (pUrl) window.open(pUrl, '_blank', 'noopener');
  }
  function getPdfPageCount(uri) {
    if (N && N.getPdfPageCount && uri) {
      try { return N.getPdfPageCount(String(uri)) || 0; } catch (_) { return 0; }
    }
    return 0;
  }
  function extractPdfCoverAsync(bookKey, uri, fileName, title) {
    if (N && N.extractPdfCoverAsync && uri) {
      try { N.extractPdfCoverAsync(String(bookKey || ''), String(uri), String(fileName || ''), String(title || '')); } catch (_) { }
    }
  }
  function copy(txt) {
    if (N) N.copy(txt);
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
  }
  function toast(msg) {
    const el = document.getElementById('toast');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden', 'toast-pop');
      void el.offsetWidth;
      el.classList.add('toast-pop');
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        el.classList.add('hidden');
        el.classList.remove('toast-pop');
      }, 2600);
    } else if (N) {
      N.toast(msg);
    }
  }
  function haptic(style) {
    if (window.__midadHapticsEnabled === false) return;
    if (N && N.haptic) {
      try { N.haptic(style || 'light'); } catch (_) {}
    }
  }
  function setHapticsEnabled(on) {
    window.__midadHapticsEnabled = !!on;
    if (N && N.setHapticsEnabled) {
      try { N.setHapticsEnabled(!!on); } catch (_) {}
    }
  }
  function setSystemBars(bgHex, lightIcons) {
    if (N && N.setSystemBars) {
      try { N.setSystemBars(bgHex || '#0f1215', !!lightIcons); } catch (_) {}
    }
  }
  function clearCache() { if (N) N.clearCache(); }
  function getReaderTelemetry() {
    if (N && N.getReaderTelemetry) {
      try { return JSON.parse(N.getReaderTelemetry() || '{}') || {}; } catch (_) { return {}; }
    }
    try { return JSON.parse(localStorage.getItem('wq_reader_telemetry') || 'null') || {}; } catch (_) { return {}; }
  }
  function recDbSyncBooks(books) {
    if (N && N.recDbSyncBooks) {
      try { return N.recDbSyncBooks(JSON.stringify(books || [])); } catch (_) { return 0; }
    }
    return 0;
  }
  function recDbRecordInteraction(payload) {
    if (N && N.recDbRecordInteraction) {
      try { return !!N.recDbRecordInteraction(JSON.stringify(payload || {})); } catch (_) { return false; }
    }
    return false;
  }
  function recDbRemoveInteraction(userId, dedupeKey) {
    if (N && N.recDbRemoveInteraction) {
      try { return N.recDbRemoveInteraction(Number(userId) || 1, String(dedupeKey || '')); } catch (_) { return 0; }
    }
    return 0;
  }
  function recDbUpsertStatus(payload) {
    if (N && N.recDbUpsertStatus) {
      try { return !!N.recDbUpsertStatus(JSON.stringify(payload || {})); } catch (_) { return false; }
    }
    return false;
  }
  function recDbRecordImpressions(userId, items, nowMs, force) {
    if (N && N.recDbRecordImpressions) {
      try { return N.recDbRecordImpressions(Number(userId) || 1, JSON.stringify(items || []), Number(nowMs) || Date.now(), !!force); } catch (_) { return 0; }
    }
    return 0;
  }
  function recDbMarkClicked(userId, externalKey, nowMs) {
    if (N && N.recDbMarkClicked) {
      try { N.recDbMarkClicked(Number(userId) || 1, String(externalKey || ''), Number(nowMs) || Date.now()); } catch (_) {}
    }
  }
  function recDbQueryRecommendations(userId, limit, nowMs) {
    if (N && N.recDbQueryRecommendations) {
      try { return JSON.parse(N.recDbQueryRecommendations(Number(userId) || 1, Number(limit) || 20, Number(nowMs) || Date.now()) || '[]') || []; } catch (_) { return []; }
    }
    return null;
  }
  function recDbGetState(userId) {
    if (N && N.recDbGetState) {
      try { return JSON.parse(N.recDbGetState(Number(userId) || 1) || '{}') || {}; } catch (_) { return {}; }
    }
    return null;
  }
  function recDbResetUser(userId) {
    if (N && N.recDbResetUser) {
      try { N.recDbResetUser(Number(userId) || 1); } catch (_) {}
    }
  }
  function recDbSaveReview(payload) {
    if (N && N.recDbSaveReview) {
      try { return !!N.recDbSaveReview(JSON.stringify(payload || {})); } catch (_) { return false; }
    }
    return false;
  }
  function recDbGetReviews(externalKey) {
    if (N && N.recDbGetReviews) {
      try { return JSON.parse(N.recDbGetReviews(String(externalKey || '')) || '[]') || []; } catch (_) { return []; }
    }
    return [];
  }
  function recDbDeleteReview(externalKey, reviewId) {
    if (N && N.recDbDeleteReview) {
      try { return !!N.recDbDeleteReview(String(externalKey || ''), String(reviewId || '')); } catch (_) { return false; }
    }
    return false;
  }
  function recDbToggleReviewHelpful(externalKey, reviewId, delta) {
    if (N && N.recDbToggleReviewHelpful) {
      try { N.recDbToggleReviewHelpful(String(externalKey || ''), String(reviewId || ''), Number(delta) || 1); } catch (_) {}
    }
  }
  function syncHabitState(habitObj) {
    if (N && N.syncHabitState) {
      try { N.syncHabitState(JSON.stringify(habitObj || {})); } catch (_) {}
    }
  }
  function getNativeHabitToday() {
    if (N && N.getNativeHabitToday) {
      try { return JSON.parse(N.getNativeHabitToday() || '{}') || {}; } catch (_) { return {}; }
    }
    return {};
  }
  function testReadingNotification() {
    if (N && N.testReadingNotification) {
      try { return !!N.testReadingNotification(); } catch (_) { return false; }
    }
    return false;
  }
  function requestNotificationPermission() {
    if (N && N.requestNotificationPermission) {
      try { return !!N.requestNotificationPermission(); } catch (_) { return true; }
    }
    return true;
  }

  // Browser Fallback Audio Player (mirrors Android AudioPlaybackService API when N == null)
  let _webAudioEl = null;
  let _webAudioState = (() => {
    try { return JSON.parse(localStorage.getItem('midad_web_audio_state') || '{}') || {}; } catch (_) { return {}; }
  })();
  let _webAudioPosMap = (() => {
    try { return JSON.parse(localStorage.getItem('midad_web_audio_pos') || '{}') || {}; } catch (_) { return {}; }
  })();

  function _saveWebAudioPos() {
    if (_webAudioState && _webAudioState.bookId) {
      _webAudioPosMap[_webAudioState.bookId + ':' + (_webAudioState.chapterIdx || 0)] = Math.max(0, Number(_webAudioState.positionMs || 0));
      try { localStorage.setItem('midad_web_audio_pos', JSON.stringify(_webAudioPosMap)); } catch (_) { }
    }
  }

  function _emitWebAudio() {
    try { localStorage.setItem('midad_web_audio_state', JSON.stringify(_webAudioState)); } catch (_) { }
    ev('audioState', Object.assign({}, _webAudioState));
  }

  function _ensureWebAudio() {
    if (_webAudioEl || typeof Audio === 'undefined') return _webAudioEl;
    _webAudioEl = new Audio();
    _webAudioEl.preload = 'metadata';
    _webAudioEl.addEventListener('loadedmetadata', () => {
      _webAudioState.isPreparing = false;
      if (Number.isFinite(_webAudioEl.duration) && _webAudioEl.duration > 0) {
        _webAudioState.durationMs = Math.round(_webAudioEl.duration * 1000);
      }
      if (_webAudioState._pendingSeekSec > 0 && (!_webAudioEl.duration || _webAudioState._pendingSeekSec < _webAudioEl.duration - 2)) {
        try { _webAudioEl.currentTime = _webAudioState._pendingSeekSec; } catch (_) { }
      }
      _webAudioState._pendingSeekSec = 0;
      _emitWebAudio();
    });
    _webAudioEl.addEventListener('timeupdate', () => {
      _webAudioState.positionMs = Math.round((_webAudioEl.currentTime || 0) * 1000);
      if (Number.isFinite(_webAudioEl.duration) && _webAudioEl.duration > 0) {
        _webAudioState.durationMs = Math.round(_webAudioEl.duration * 1000);
      }
      _saveWebAudioPos();
      _emitWebAudio();
    });
    _webAudioEl.addEventListener('play', () => { _webAudioState.isPlaying = true; _webAudioState.isPreparing = false; _emitWebAudio(); });
    _webAudioEl.addEventListener('pause', () => { _webAudioState.isPlaying = false; _saveWebAudioPos(); _emitWebAudio(); });
    _webAudioEl.addEventListener('ended', () => {
      _webAudioState.isPlaying = false;
      _webAudioState.positionMs = 0;
      _saveWebAudioPos();
      if (_webAudioState.sleepMode === 'chapter') {
        _webAudioState.sleepMode = '';
        _webAudioState.sleepRemainingSec = 0;
        _emitWebAudio();
        return;
      }
      audioCommand('next', '1');
    });
    _webAudioEl.addEventListener('error', () => {
      _webAudioState.isPlaying = false;
      _webAudioState.isPreparing = false;
      _webAudioState.error = 'تعذر تشغيل البث الصوتي مباشرة';
      _emitWebAudio();
    });
    return _webAudioEl;
  }

  function audioPlay(payloadJson) {
    if (N && N.audioPlay) {
      N.audioPlay(typeof payloadJson === 'string' ? payloadJson : JSON.stringify(payloadJson || {}));
      return;
    }
    let obj = {};
    try { obj = typeof payloadJson === 'string' ? JSON.parse(payloadJson) : (payloadJson || {}); } catch (_) { }
    const posKey = (obj.bookId || '') + ':' + (obj.chapterIdx || 0);
    const savedMs = Number(_webAudioPosMap[posKey] || 0);
    const reqSeek = obj.seekMs != null && Number(obj.seekMs) >= 0 ? Number(obj.seekMs) : savedMs;
    _webAudioState = {
      bookId: obj.bookId || '',
      title: obj.title || 'كتاب مسموع',
      author: obj.author || '',
      chapterTitle: obj.chapterTitle || '',
      chapterIdx: Number(obj.chapterIdx || 0),
      chaptersJson: Array.isArray(obj.chapters) ? JSON.stringify(obj.chapters) : (obj.chaptersJson || '[]'),
      srcUrl: obj.srcUrl || '',
      localUri: obj.localUri || '',
      coverUrl: obj.coverUrl || '',
      isOffline: !!obj.isOffline,
      isPlaying: true,
      isPreparing: true,
      durationMs: Number(obj.durationMs || 0),
      positionMs: reqSeek,
      speed: Number(obj.speed || _webAudioState.speed || 1.0),
      stopped: false,
      error: '',
      _pendingSeekSec: reqSeek / 1000,
    };
    const au = _ensureWebAudio();
    const targetSrc = _webAudioState.localUri || _webAudioState.srcUrl;
    if (au && targetSrc) {
      au.src = targetSrc;
      au.playbackRate = _webAudioState.speed || 1.0;
      _emitWebAudio();
      const pr = au.play();
      if (pr && pr.catch) pr.catch(() => { _webAudioState.isPlaying = false; _webAudioState.isPreparing = false; _emitWebAudio(); });
    } else {
      _webAudioState.isPlaying = false;
      _webAudioState.isPreparing = false;
      _emitWebAudio();
    }
  }

  function audioCommand(cmd, arg) {
    if (N && N.audioCommand) {
      N.audioCommand(String(cmd || ''), arg != null ? String(arg) : '');
      return;
    }
    const au = _ensureWebAudio();
    if (cmd === 'toggle') {
      if (!au || !au.src) {
        if (_webAudioState.srcUrl || _webAudioState.localUri) audioPlay(_webAudioState);
        return;
      }
      if (au.paused) { _webAudioState.stopped = false; au.play().catch(() => {}); } else { au.pause(); }
    } else if (cmd === 'pause') {
      if (au && !au.paused) au.pause();
    } else if (cmd === 'stop') {
      if (au) { au.pause(); au.currentTime = 0; }
      _webAudioState.isPlaying = false;
      _webAudioState.isPreparing = false;
      _webAudioState.stopped = true;
      _webAudioState.positionMs = 0;
      _emitWebAudio();
    } else if (cmd === 'seek') {
      const ms = Math.max(0, Number(arg) || 0);
      _webAudioState.positionMs = ms;
      if (au && au.src) { try { au.currentTime = ms / 1000; } catch (_) { } }
      _saveWebAudioPos();
      _emitWebAudio();
    } else if (cmd === 'delta') {
      const curMs = au && au.src ? Math.round((au.currentTime || 0) * 1000) : Number(_webAudioState.positionMs || 0);
      audioCommand('seek', curMs + (Number(arg) || 0));
    } else if (cmd === 'speed') {
      const spd = Math.max(0.5, Math.min(2.5, Number(arg) || 1.0));
      _webAudioState.speed = spd;
      if (au) au.playbackRate = spd;
      _emitWebAudio();
    } else if (cmd === 'sleep') {
      const mins = parseInt(arg, 10) || 0;
      if (window.__ktbWebSleepTimer) { clearInterval(window.__ktbWebSleepTimer); window.__ktbWebSleepTimer = null; }
      if (mins === -1) {
        _webAudioState.sleepMode = 'chapter';
        _webAudioState.sleepEndAtMs = 0;
        _webAudioState.sleepRemainingSec = 0;
      } else if (mins > 0) {
        _webAudioState.sleepMode = 'timer';
        _webAudioState.sleepEndAtMs = Date.now() + mins * 60000;
        _webAudioState.sleepRemainingSec = mins * 60;
        window.__ktbWebSleepTimer = setInterval(() => {
          const rem = Math.max(0, Math.round(((_webAudioState.sleepEndAtMs || 0) - Date.now()) / 1000));
          _webAudioState.sleepRemainingSec = rem;
          if (rem <= 0) {
            clearInterval(window.__ktbWebSleepTimer);
            window.__ktbWebSleepTimer = null;
            _webAudioState.sleepMode = '';
            _webAudioState.sleepEndAtMs = 0;
            audioCommand('pause', '');
          } else {
            _emitWebAudio();
          }
        }, 1000);
      } else {
        _webAudioState.sleepMode = '';
        _webAudioState.sleepEndAtMs = 0;
        _webAudioState.sleepRemainingSec = 0;
      }
      _emitWebAudio();
    } else if (cmd === 'next' || cmd === 'prev') {
      try {
        const chs = JSON.parse(_webAudioState.chaptersJson || '[]');
        const nextIdx = Number(_webAudioState.chapterIdx || 0) + (cmd === 'next' ? 1 : -1);
        if (nextIdx >= 0 && nextIdx < chs.length) {
          const ch = chs[nextIdx];
          audioPlay(Object.assign({}, _webAudioState, {
            chapterIdx: nextIdx,
            chapterTitle: ch.title || ('الفصل ' + (nextIdx + 1)),
            srcUrl: ch.url || ch.srcUrl || _webAudioState.srcUrl,
            localUri: ch.localUri || '',
            isOffline: !!(ch.isOffline || ch.localUri),
            durationMs: Number(ch.durationMs || 0),
          }));
        }
      } catch (_) { }
    }
  }

  function audioGetState() {
    if (N && N.audioGetState) {
      try { return JSON.parse(N.audioGetState() || '{}') || {}; } catch (_) { return {}; }
    }
    return Object.assign({}, _webAudioState);
  }

  function pickAudioFile() {
    if (N && N.pickAudioFile) { N.pickAudioFile(); return true; }
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.mp3,.m4b,.m4a,.ogg,.opus,.aac,.wav,audio/*';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const u = URL.createObjectURL(f);
      ev('pickedAudio', {
        uri: u,
        fileName: f.name,
        title: f.name.replace(/\.[^.]+$/, '').replace(/[_•|]+/g, ' ').trim(),
        addedAt: Date.now(),
      });
    };
    inp.click();
    return true;
  }

  window.KTB = {
    isAndroid, isIOS, http, abortHttp, solveWeb, cancelSolve, cb, ev,
    has1DM, send1DM, downloadBook, registerSavedDownload, cancelDownload, removeDownload, getDownloads,
    openBook, openInternalReader: openBook, openExternalReader, pickLocalBook, getLocalBooks, removeLocalBook, deleteBook, restoreHiddenBooks,
    hasStorageAccess, requestStorageAccess, pickBookFolder, scanDeviceBooks, getPdfPageCount, extractPdfCoverAsync, getReaderTelemetry,
    audioPlay, audioCommand, audioGetState, pickAudioFile,
    recDbSyncBooks, recDbRecordInteraction, recDbRemoveInteraction, recDbUpsertStatus, recDbRecordImpressions, recDbMarkClicked, recDbQueryRecommendations, recDbGetState, recDbResetUser,
    recDbSaveReview, recDbGetReviews, recDbDeleteReview, recDbToggleReviewHelpful,
    syncHabitState, getNativeHabitToday, testReadingNotification, requestNotificationPermission,
    openUrl, openInstaPay, copy, toast, haptic, setHapticsEnabled, setSystemBars, clearCache,
    openTab: () => {},
    back: () => false,
  };
})();
