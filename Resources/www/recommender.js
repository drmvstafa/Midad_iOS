(function () {
  'use strict';

  const DAY_MS = 86400000;
  const COOLDOWN_DAYS = 30;
  const IMPRESSION_HIDE_THRESHOLD = 3;
  const MIN_IMPRESSION_GAP_MS = 4000;
  const DECAY_LAMBDA = 0.05; // EXP(-0.05 * age_days)
  const REL_STORE_KEY = 'wq_rec_rel_v1';
  const ACTIVE_USER_ID = 1;

  const SIGNAL_WEIGHTS = {
    complete: 10,      // Reading >= 80% of book in reader (complete_80)
    complete_80: 10,
    favrate: 8,        // Rating 4-5 stars or adding to Favorites (rate_high)
    rate_high: 8,
    download: 5,       // Direct download / saving to device (download)
    quote: 4,          // Highlights or bookmarks in reader (highlight)
    highlight: 4,
    browse30s: 2,      // Viewing book summary & detail >= 30s (view_details)
    view_details: 2,
    abandon_early: -3, // Closed before page 15 & untouched for >= 14 days (abandon)
    abandon: -3,
    rate_low: -3,      // 1-2 star negative rating
    dismiss: -3,       // Explicit "not interested" dismissal
  };

  // Canonical DB action_type aliases matching PostgreSQL / SQLite user_interactions schema
  const ACTION_TYPE_MAP = {
    complete: 'complete_80',
    complete_80: 'complete_80',
    favrate: 'rate_high',
    rate_high: 'rate_high',
    download: 'download',
    quote: 'highlight',
    highlight: 'highlight',
    browse30s: 'view_details',
    view_details: 'view_details',
    abandon_early: 'abandon',
    abandon: 'abandon',
    rate_low: 'rate_low',
    dismiss: 'dismiss',
  };

  const LEGACY_SIGNAL_MAP = {
    complete_80: 'complete',
    rate_high: 'favrate',
    download: 'download',
    highlight: 'quote',
    view_details: 'browse30s',
    abandon: 'abandon_early',
    rate_low: 'rate_low',
    dismiss: 'dismiss',
  };

  const TONE_LABELS = {
    light: 'خفيف وسريع',
    deep: 'عميق ودسم',
    academic: 'أكاديمي',
    narrative: 'سردي',
  };

  function getCats() {
    return window.KOTOB_CATALOG || {};
  }

  function loadStore(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_) {
      return fallback;
    }
  }

  function saveStore(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) { }
  }

  function normKey(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0600-\u06FFa-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function canonicalBookKey(bookOrTitle) {
    if (!bookOrTitle) return '';
    if (typeof bookOrTitle === 'string') {
      const clean = bookOrTitle.split('—')[0].replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '');
      return normKey(clean) || normKey(bookOrTitle);
    }
    const raw = String(bookOrTitle.title || bookOrTitle.id || '').split('—')[0];
    const k = normKey(raw).replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim();
    return k.length >= 2 ? k : String(bookOrTitle.id || '');
  }

  function formatReadTime(minutes) {
    const m = Math.max(20, Math.round(Number(minutes) || 0));
    if (m < 60) return m + ' د قراءة';
    const h = Math.round(m / 60);
    return h === 1 ? 'ساعة قراءة' : (h <= 10 ? (h + ' ساعات قراءة') : (h + ' ساعة قراءة'));
  }

  // Enriches both curated and live-fetched books with full taxonomy metadata
  function enrichBook(book) {
    if (!book || typeof book !== 'object') return book;
    if (book._recEnriched && book.subCat && Array.isArray(book.microTags) && book.microTags.length && book.tone && book.pages) {
      return book;
    }

    const title = String(book.title || '');
    const desc = String(book.desc || book.summary || '');
    const rawTags = Array.isArray(book.tags) ? book.tags.map(t => String(t).toLowerCase()) : [];
    const blob = (title + ' ' + desc + ' ' + rawTags.join(' ') + ' ' + String(book.cat || '')).toLowerCase();

    let cat = book.cat || '';
    if (!cat || cat === 'all') {
      if (book.isComic || /كوميكس|كوميك|مانجا|باتمان|سبايدرمان|comic|manga|batman|spider/i.test(blob)) cat = 'comics_manga';
      else if (/تفسير|سيرة نبوية|صحيح|قرآن|تزكية|ابن القيم|ابن كثير|نووي|islam|prophet|seerah/.test(blob)) cat = 'islamic_heritage';
      else if (/مخ|دماغ|neuro|anatomy|طب|سريري|فيزيولوجيا|pharma|ecg/.test(blob)) cat = 'medicine_neuro';
      else if (/عادات|نفس|إنتاجية|habit|psychology|تطوير الذات|سلوك|إقناع|وقت/.test(blob)) cat = 'psychology_habits';
      else if (/تسويق|إدارة|مال|marketing|strategy|business|قيادة|غني/.test(blob)) cat = 'marketing_strategy';
      else if (/أجاثا|هولمز|جريمة|غموض|mystery|detective|شيرلوك|دوستويفسكي/.test(blob)) cat = 'mystery_classics';
      else if (/بايثون|برمجة|خوارزم|ذكاء|python|code|linux|sql|software|algorithm/.test(blob)) cat = 'tech_ai';
      else if (/ألمانية|german|deutsch|نحو|بلاغة|إنجليزية|grammar/.test(blob)) cat = 'languages_skills';
      else if (/كثيب|خيال علمي|فانتازيا|هوبيت|مؤسسة|dune|sci-fi|fantasy|hobbit|martian/.test(blob)) cat = 'scifi_fantasy';
      else if (/فيزياء|كون|فضاء|أحياء|تطور|فلك|cosmos|astrophysics|quantum|relativity|physics/.test(blob)) cat = 'science_cosmos';
      else if (/فلسفة|منطق|رواق|أفلاطون|أرسطو|نيتشه|كانط|philosophy|stoic|plato/.test(blob)) cat = 'philosophy_wisdom';
      else if (/شعر|ديوان|المتنبي|درويش|قباني|معلقات|poetry|poem|whitman/.test(blob)) cat = 'poetry_arts';
      else if (/تاريخ|أندلس|حضارة|مؤرخ|سيرة|history|andalus/.test(blob)) cat = 'history_thought';
      else if (/[\u0600-\u06FF]/.test(title)) cat = 'arabic_novels';
      else cat = 'mystery_classics';
    }
    book.cat = cat;

    const micro = Array.isArray(book.microTags) ? book.microTags.slice() : [];
    let subCat = book.subCat || '';
    let tone = book.tone || '';

    const pushMicro = (list) => {
      for (const item of list) {
        if (item && !micro.includes(item)) micro.push(item);
      }
    };

    if (/عادات|habit|atomic|الذرية|power of habit/.test(blob)) {
      subCat = subCat || 'تطوير الذات - بناء العادات';
      pushMicro(['تطوير الذات', 'بناء العادات', 'إنتاجية', 'علم نفس سلوكي']);
    }
    if (/وقت|time|deep work|العمل العميق|الأهم|essential|تركيز/.test(blob)) {
      subCat = subCat || 'تطوير الذات - إدارة الوقت';
      pushMicro(['إدارة الوقت', 'إنتاجية', 'تطوير الذات']);
    }
    if (/مخ|دماغ|neuro|brain|أعصاب|نوم|sleep|سلوك|behavior/.test(blob)) {
      pushMicro(['علم الأعصاب', 'عمل الدماغ', 'علم نفس سلوكي']);
    }
    if (/تبسيط|علم|فيزياء|الكون|cosmos|hawking|هوكينج|أبله|popscience|بيولوجيا/.test(blob)) {
      subCat = subCat || 'ثقافة عامة - تبسيط علوم';
      pushMicro(['تبسيط علوم', 'ثقافة عامة']);
    }
    if (/أندلس|غرناطة|andalus|طوق الحمامة/.test(blob)) {
      subCat = subCat || 'التاريخ والفكر - تاريخ أندلسي';
      pushMicro(['تاريخ أندلسي', 'حضارة وتاريخ']);
    }
    if (/سيرة|مذكرات|memoir|biography|أيام|حياته|رحلتي|عبقرية/.test(blob)) {
      subCat = subCat || 'التاريخ والفكر - سيرة ذاتية وفكر';
      pushMicro(['سيرة ذاتية', 'تجربة إنسانية']);
    }
    if (/مال|ثروة|finance|غني|بابل|استثمار|business|تسويق|strategy|إقناع/.test(blob)) {
      pushMicro(['ذكاء مالي', 'استراتيجية وتسويق', 'علم نفس عملي']);
    }
    if (/فلسفة|philosophy|تأملات|existential|وجود|معنى/.test(blob)) {
      pushMicro(['فلسفة', 'فكر وحضارة']);
    }
    if (/نفس|psychology|إقناع|علاقات|صحة نفسية|تأثير|قلق|شفاء/.test(blob)) {
      pushMicro(['علم نفس عملي', 'صحة نفسية']);
    }
    if (/جريمة|تحقيق|غموض|mystery|detective|هولمز|أجاثا|مقتل/.test(blob)) {
      pushMicro(['ألغاز وتحقيق', 'تشويق نفسي']);
    }

    const SUBCAT_FALLBACK = {
      psychology_habits: 'تطوير الذات - علم نفس عملي',
      medicine_neuro: 'الطب والأعصاب - مراجع إكلينيكية',
      marketing_strategy: 'التسويق والإدارة - استراتيجية وقيادة',
      history_thought: 'التاريخ والفكر - فلسفة وحضارة',
      mystery_classics: 'الغموض والإثارة - بوليسية وتحقيق',
      arabic_novels: 'الأدب العربي - رواية وأدب كلاسيكي',
      languages_skills: 'اللغات والمهارات - مهارات لغوية',
      tech_ai: 'البرمجة والذكاء - هندسة برمجيات',
      comics_manga: 'كوميكس ومصورة - قصص مصورة',
      islamic_heritage: 'التراث والفكر الإسلامي',
      scifi_fantasy: 'الخيال العلمي والفانتازيا',
      science_cosmos: 'العلوم والفضاء والمعرفة',
      philosophy_wisdom: 'الفلسفة والمنطق والاجتماع',
      poetry_arts: 'الشعر والبلاغة والأدب',
    };
    if (!subCat) subCat = SUBCAT_FALLBACK[cat] || 'ثقافة عامة - معرفة منوعة';
    if (!micro.length) micro.push(cat === 'arabic_novels' ? 'أدب عربي' : 'ثقافة عامة');

    if (!tone) {
      if (cat === 'medicine_neuro' && /مرجع|أطلس|atlas|clinical|textbook|guyton|snell|davidson|pharma/.test(blob)) tone = 'academic';
      else if (cat === 'tech_ai' || cat === 'languages_skills') tone = /قصص|stories|مبسطة/.test(blob) ? 'light' : 'academic';
      else if (cat === 'history_thought' || /دوستويفسكي|كارامازوف|العقاب|مئة عام|1984|فلسفة|الحضارة/.test(blob)) tone = 'deep';
      else if (cat === 'arabic_novels' || cat === 'mystery_classics') tone = /قصص|مقالات|يوتوبيا|أبيض|بيضاء|المسخ/.test(blob) ? 'light' : 'narrative';
      else tone = /السريع والبطيء|تصرف|بيولوجيا|الجسد/.test(blob) ? 'deep' : 'light';
    }

    let pages = Number(String(book.pages || '').replace(/[^\d]/g, '')) || 0;
    if (!pages) {
      if (tone === 'light') pages = 185;
      else if (tone === 'academic') pages = 440;
      else if (tone === 'deep') pages = 335;
      else pages = 270;
    }
    const avgMinutes = Number(book.avgMinutes) || Math.round(pages * (tone === 'academic' ? 1.55 : (tone === 'deep' ? 1.35 : 1.15)));
    const toneLabel = book.toneLabel || TONE_LABELS[tone] || 'متوازن';
    const readingDifficulty = (book.reading_difficulty === 'light' || book.reading_difficulty === 'medium' || book.reading_difficulty === 'deep')
      ? book.reading_difficulty
      : ((tone === 'light' && pages <= 240) ? 'light' : ((tone === 'deep' || tone === 'academic' || pages >= 420) ? 'deep' : 'medium'));

    book.subCat = subCat;
    book.microTags = micro.slice(0, 6);
    book.tone = tone;
    book.toneLabel = toneLabel;
    book.pages = pages;
    book.avgMinutes = avgMinutes;
    book.readTimeLabel = formatReadTime(avgMinutes);
    book.reading_difficulty = readingDifficulty;
    book.weightedTags = computeBookTagWeights(book);
    book._recEnriched = true;
    return book;
  }

  // Maps a book into normalized (tag, tag_type, relevance_weight 0.1..1.0) pairs for book_tags
  function computeBookTagWeights(book) {
    if (!book) return [];
    const list = [];
    const seen = new Set();
    const pushTag = (name, tagType, w) => {
      const clean = String(name || '').trim();
      if (!clean) return;
      const k = tagType + ':' + normKey(clean);
      if (seen.has(k)) return;
      seen.add(k);
      const clamped = Math.round(Math.max(0.10, Math.min(1.00, Number(w) || 0.5)) * 100) / 100;
      list.push({ name: clean, tag_type: tagType, relevance_weight: clamped });
    };

    const micro = Array.isArray(book.microTags) ? book.microTags : [];
    const hasCrossTopic = micro.length >= 2;
    if (book.cat) {
      pushTag('cat:' + book.cat, 'category', hasCrossTopic ? 0.85 : 1.00);
    }
    if (book.subCat) {
      pushTag(book.subCat, 'sub_category', 0.85);
    }
    const topicSchedule = [0.80, 0.55, 0.35, 0.25, 0.20, 0.15];
    micro.forEach((mt, idx) => {
      pushTag(mt, 'topic', topicSchedule[idx] || 0.20);
    });
    if (book.toneLabel) {
      pushTag('mood:' + book.toneLabel, 'mood', 0.45);
    }
    return list;
  }

  function nativeBridge() {
    return typeof window !== 'undefined' ? window.KTB : null;
  }

  function emptyRelState() {
    return {
      books: {},
      tags: {},
      book_tags: {},
      user_interactions: [],
      user_book_status: {},
      user_tag_affinity: {},
      recommendation_impressions: {},
    };
  }

  function loadRelState() {
    const rel = loadStore(REL_STORE_KEY, null);
    if (rel && typeof rel === 'object' && rel.books && rel.user_tag_affinity && rel.user_book_status) {
      // Keep tests or manual wq_signal_log resets cleanly synchronized
      const sigRaw = localStorage.getItem('wq_signal_log');
      if ((!sigRaw || sigRaw === '[]') && Array.isArray(rel.user_interactions) && rel.user_interactions.length > 0) {
        rel.user_interactions = [];
        rel.user_tag_affinity = {};
        saveStore(REL_STORE_KEY, rel);
      }
      return rel;
    }
    return emptyRelState();
  }

  function saveRelState(rel) {
    if (Array.isArray(rel.user_interactions) && rel.user_interactions.length > 500) {
      rel.user_interactions = rel.user_interactions.slice(-450);
    }
    const bookKeys = Object.keys(rel.books || {});
    if (bookKeys.length > 450) {
      const keep = new Set(bookKeys.slice(-380));
      for (const k of bookKeys) {
        if (!keep.has(k) && !(rel.user_book_status && rel.user_book_status[k])) {
          delete rel.books[k];
          if (rel.book_tags) delete rel.book_tags[k];
        }
      }
    }
    saveStore(REL_STORE_KEY, rel);
  }

  function serializeBookForRel(rawBook) {
    const nb = enrichBook(Object.assign({}, rawBook));
    const bk = canonicalBookKey(nb);
    if (!bk) return null;
    const weighted = Array.isArray(nb.weightedTags) && nb.weightedTags.length ? nb.weightedTags : computeBookTagWeights(nb);
    return {
      external_key: bk,
      book_id_str: nb.id || bk,
      title: nb.title || '',
      author_name: nb.author || '',
      cat: nb.cat || '',
      subCat: nb.subCat || '',
      page_count: Number(nb.pages) || 260,
      reading_difficulty: nb.reading_difficulty || 'medium',
      avg_rating: Number(nb.avg_rating || (nb.fame ? Math.min(5, Math.max(3.6, Number(nb.fame) / 20)) : 4.2)),
      downloads_count: Number(nb.downloads_count || 0),
      tags: weighted,
    };
  }

  function upsertRelBook(rel, rawBook) {
    const rec = serializeBookForRel(rawBook);
    if (!rec) return null;
    const bk = rec.external_key;
    rel.books[bk] = {
      id: bk,
      external_key: bk,
      title: rec.title,
      author_name: rec.author_name,
      cat: rec.cat,
      subCat: rec.subCat,
      page_count: rec.page_count,
      reading_difficulty: rec.reading_difficulty,
      avg_rating: rec.avg_rating,
      downloads_count: rec.downloads_count,
    };
    const btRows = [];
    for (const tg of rec.tags) {
      const tKey = normKey(tg.name);
      if (!tKey) continue;
      if (!rel.tags[tKey]) rel.tags[tKey] = { id: tKey, name: tg.name, tag_type: tg.tag_type };
      btRows.push({
        book_id: bk,
        tag_id: tKey,
        tag_name: tg.name,
        tag_type: tg.tag_type,
        relevance_weight: tg.relevance_weight,
      });
    }
    rel.book_tags[bk] = btRows;
    return rec;
  }

  // Incremental O(|tags_of_book|) affinity matrix maintenance
  function applyRelAffinityDelta(rel, bookKey, scoreDelta, countDelta, tsMs) {
    const btRows = (rel.book_tags && rel.book_tags[bookKey]) || [];
    for (const bt of btRows) {
      const tKey = bt.tag_id;
      const delta = Math.round(scoreDelta * bt.relevance_weight * 100) / 100;
      const cur = rel.user_tag_affinity[tKey];
      if (cur) {
        cur.affinity_score = Math.round((cur.affinity_score + delta) * 100) / 100;
        cur.interaction_count = Math.max(0, (cur.interaction_count || 0) + countDelta);
        if (tsMs > 0) cur.last_interacted_at = Math.max(cur.last_interacted_at || 0, tsMs);
        if (cur.interaction_count === 0 && Math.abs(cur.affinity_score) < 0.01) {
          delete rel.user_tag_affinity[tKey];
        }
      } else if (countDelta > 0) {
        rel.user_tag_affinity[tKey] = {
          user_id: ACTIVE_USER_ID,
          tag_id: tKey,
          tag_name: bt.tag_name,
          tag_type: bt.tag_type,
          affinity_score: delta,
          interaction_count: countDelta,
          last_interacted_at: tsMs || Date.now(),
        };
      }
    }
  }

  function upsertUserBookStatus(book, fields) {
    if (!book || !fields) return null;
    const rel = loadRelState();
    const rec = upsertRelBook(rel, book);
    if (!rec) return null;
    const bk = rec.external_key;
    const prev = rel.user_book_status[bk] || {};
    const nextStatus = fields.status || prev.status || 'reading';
    const next = {
      user_id: ACTIVE_USER_ID,
      book_id: bk,
      external_key: bk,
      status: nextStatus,
      progress_percentage: fields.progress_percentage != null
        ? Math.round(Math.max(0, Math.min(100, Number(fields.progress_percentage))) * 100) / 100
        : (prev.progress_percentage || 0),
      rating: fields.rating != null ? fields.rating : (prev.rating || null),
      last_opened_at: Number(fields.last_opened_at) || Date.now(),
    };
    rel.user_book_status[bk] = next;
    saveRelState(rel);

    const ktb = nativeBridge();
    if (ktb && ktb.recDbUpsertStatus) {
      ktb.recDbUpsertStatus({
        user_id: ACTIVE_USER_ID,
        status: next.status,
        progress_percentage: next.progress_percentage,
        rating: next.rating || 0,
        last_opened_at: next.last_opened_at,
        book: rec,
      });
    }
    return next;
  }

  function syncCatalogToNativeDb(booksList) {
    const ktb = nativeBridge();
    if (!Array.isArray(booksList) || !booksList.length) return 0;
    const rel = loadRelState();
    const payload = [];
    for (const raw of booksList) {
      if (!raw || !raw.title) continue;
      const rec = upsertRelBook(rel, raw);
      if (rec) payload.push(rec);
    }
    saveRelState(rel);
    if (ktb && ktb.recDbSyncBooks && payload.length) {
      return ktb.recDbSyncBooks(payload);
    }
    return payload.length;
  }

  function exponentialDecayFactor(ageDays) {
    return Math.exp(-DECAY_LAMBDA * Math.max(0, Number(ageDays) || 0));
  }

  // Signal storage management + relational table sync
  function getSignalLog() {
    const arr = loadStore('wq_signal_log', []);
    return Array.isArray(arr) ? arr : [];
  }

  function saveSignalLog(arr) {
    saveStore('wq_signal_log', Array.isArray(arr) ? arr.slice(-400) : []);
  }

  function getRatingsMap() {
    const m = loadStore('wq_ratings', {});
    return m && typeof m === 'object' ? m : {};
  }

  function getDismissedSet() {
    const arr = loadStore('wq_dismissed_books', []);
    return new Set(Array.isArray(arr) ? arr : []);
  }

  function getImpressionsMap() {
    const rel = loadRelState();
    if (rel && rel.recommendation_impressions && Object.keys(rel.recommendation_impressions).length) {
      return rel.recommendation_impressions;
    }
    const m = loadStore('wq_impressions', {});
    return m && typeof m === 'object' ? m : {};
  }

  function saveImpressionsMap(map) {
    const entries = Object.entries(map || {});
    if (entries.length > 500) {
      entries.sort((a, b) => (b[1].lastShownTs || b[1].last_shown_at || 0) - (a[1].lastShownTs || a[1].last_shown_at || 0));
      map = Object.fromEntries(entries.slice(0, 420));
    }
    saveStore('wq_impressions', map);
    const rel = loadRelState();
    rel.recommendation_impressions = map;
    saveRelState(rel);
  }

  function recordSignal(book, signalType, opts) {
    if (!book || !signalType || !Object.prototype.hasOwnProperty.call(SIGNAL_WEIGHTS, signalType)) return null;
    const o = opts || {};
    const nb = enrichBook(Object.assign({}, book));
    const bk = canonicalBookKey(nb);
    if (!bk) return null;

    const nowMs = Number(o.ts) || Date.now();
    const canonicalType = LEGACY_SIGNAL_MAP[signalType] || signalType;
    const dbActionType = ACTION_TYPE_MAP[signalType] || canonicalType;
    const weight = o.weight != null ? Number(o.weight) : SIGNAL_WEIGHTS[signalType];
    const dedupeKey = o.dedupeKey || (canonicalType + ':' + bk);
    const log = getSignalLog();

    const rel = loadRelState();
    const bookRec = upsertRelBook(rel, nb);

    if (o.replaceSameDedupe) {
      for (let i = log.length - 1; i >= 0; i--) {
        if (log[i] && log[i].dedupeKey === dedupeKey) log.splice(i, 1);
      }
      if (Array.isArray(rel.user_interactions)) {
        for (let i = rel.user_interactions.length - 1; i >= 0; i--) {
          const ri = rel.user_interactions[i];
          if (ri && ri.dedupe_key === dedupeKey) {
            applyRelAffinityDelta(rel, ri.book_id, -Number(ri.action_score || 0), -1, 0);
            rel.user_interactions.splice(i, 1);
          }
        }
      }
    } else if (o.unique !== false) {
      if (log.some(x => x && x.dedupeKey === dedupeKey)) {
        return null;
      }
    }

    const entry = {
      dedupeKey,
      bookId: nb.id || bk,
      bookKey: bk,
      title: nb.title || '',
      author: nb.author || '',
      cat: nb.cat || '',
      subCat: nb.subCat || '',
      microTags: (nb.microTags || []).slice(0, 6),
      tags: (nb.tags || []).slice(0, 6),
      tone: nb.tone || 'light',
      signalType: canonicalType,
      actionType: dbActionType,
      weight,
      ts: nowMs,
    };
    log.push(entry);
    saveSignalLog(log);

    // Insert into relational user_interactions & increment materialized user_tag_affinity
    rel.user_interactions.push({
      id: (rel.user_interactions.length ? (rel.user_interactions[rel.user_interactions.length - 1].id || 0) : 0) + 1,
      user_id: ACTIVE_USER_ID,
      book_id: bk,
      action_type: dbActionType,
      action_score: weight,
      dedupe_key: dedupeKey,
      created_at: nowMs,
    });
    applyRelAffinityDelta(rel, bk, weight, 1, nowMs);

    if (dbActionType === 'download' && (!rel.user_book_status[bk] || rel.user_book_status[bk].status === 'wishlist')) {
      rel.user_book_status[bk] = {
        user_id: ACTIVE_USER_ID,
        book_id: bk,
        external_key: bk,
        status: 'downloaded',
        progress_percentage: 0,
        rating: (rel.user_book_status[bk] && rel.user_book_status[bk].rating) || null,
        last_opened_at: nowMs,
      };
    }
    saveRelState(rel);

    const ktb = nativeBridge();
    if (ktb && ktb.recDbRecordInteraction && bookRec) {
      ktb.recDbRecordInteraction({
        user_id: ACTIVE_USER_ID,
        action_type: dbActionType,
        action_score: weight,
        dedupe_key: dedupeKey,
        created_at: nowMs,
        unique: o.unique !== false,
        replace: !!o.replaceSameDedupe,
        book: bookRec,
      });
      if (dbActionType === 'download' && ktb.recDbUpsertStatus) {
        ktb.recDbUpsertStatus({
          user_id: ACTIVE_USER_ID,
          status: 'downloaded',
          progress_percentage: 0,
          last_opened_at: nowMs,
          book: bookRec,
        });
      }
    }
    return entry;
  }

  function removeSignalsByDedupe(dedupeKey) {
    if (!dedupeKey) return;
    const log = getSignalLog();
    const next = log.filter(x => x && x.dedupeKey !== dedupeKey);
    if (next.length !== log.length) saveSignalLog(next);

    const rel = loadRelState();
    let dirty = false;
    if (Array.isArray(rel.user_interactions)) {
      for (let i = rel.user_interactions.length - 1; i >= 0; i--) {
        const ri = rel.user_interactions[i];
        if (ri && ri.dedupe_key === dedupeKey) {
          applyRelAffinityDelta(rel, ri.book_id, -Number(ri.action_score || 0), -1, 0);
          rel.user_interactions.splice(i, 1);
          dirty = true;
        }
      }
    }
    if (dirty) saveRelState(rel);
    const ktb = nativeBridge();
    if (ktb && ktb.recDbRemoveInteraction) {
      ktb.recDbRemoveInteraction(ACTIVE_USER_ID, dedupeKey);
    }
  }

  function syncFavoriteSignal(book, isNowFavorite, stars) {
    if (!book) return;
    const bk = canonicalBookKey(book);
    if (!bk) return;
    const ratings = getRatingsMap();
    const s = stars != null ? Number(stars) : Number(ratings[bk] || 0);

    if (s >= 4 || isNowFavorite) {
      removeSignalsByDedupe('rate_low:' + bk);
      recordSignal(book, 'favrate', { dedupeKey: 'favrate:' + bk, replaceSameDedupe: true });
    } else {
      removeSignalsByDedupe('favrate:' + bk);
      if (s > 0 && s <= 2) {
        recordSignal(book, 'rate_low', { dedupeKey: 'rate_low:' + bk, replaceSameDedupe: true });
      } else {
        removeSignalsByDedupe('rate_low:' + bk);
      }
    }
  }

  function setBookRating(book, stars, isLikedNow) {
    if (!book) return 0;
    const bk = canonicalBookKey(book);
    if (!bk) return 0;
    const clamped = Math.max(0, Math.min(5, Math.round(Number(stars) || 0)));
    const ratings = getRatingsMap();
    if (clamped > 0) ratings[bk] = clamped;
    else delete ratings[bk];
    saveStore('wq_ratings', ratings);
    const rel = loadRelState();
    if (rel.user_book_status && rel.user_book_status[bk]) {
      rel.user_book_status[bk].rating = clamped > 0 ? clamped : null;
      saveRelState(rel);
      const ktb = nativeBridge();
      if (ktb && ktb.recDbUpsertStatus) {
        const bookRec = serializeBookForRel(book);
        if (bookRec) {
          ktb.recDbUpsertStatus({
            user_id: ACTIVE_USER_ID,
            status: rel.user_book_status[bk].status,
            progress_percentage: rel.user_book_status[bk].progress_percentage || 0,
            rating: clamped,
            last_opened_at: Date.now(),
            book: bookRec,
          });
        }
      }
    }
    syncFavoriteSignal(book, !!isLikedNow, clamped);
    return clamped;
  }

  function getBookRating(book) {
    if (!book) return 0;
    const bk = canonicalBookKey(book);
    const ratings = getRatingsMap();
    return Number(ratings[bk] || 0);
  }

  function dismissRecommendation(book) {
    if (!book) return;
    const bk = canonicalBookKey(book);
    if (!bk) return;
    const set = getDismissedSet();
    set.add(bk);
    saveStore('wq_dismissed_books', Array.from(set).slice(-300));
    recordSignal(book, 'dismiss', { dedupeKey: 'dismiss:' + bk, replaceSameDedupe: true });
  }

  // Matches telemetry entry (URI/title) back to curated or local catalog metadata
  function findMetaBookForTelemetry(tEntry, allPool) {
    const tKey = canonicalBookKey(tEntry.title || tEntry.uri || '');
    if (tKey && Array.isArray(allPool)) {
      const found = allPool.find(b => b && canonicalBookKey(b) === tKey);
      if (found) return enrichBook(Object.assign({}, found));
    }
    return enrichBook({
      id: 'tel_' + (tEntry.bookKey || tKey || Date.now()),
      title: tEntry.title || 'كتاب داخلي',
      author: '',
      cat: '',
      tags: [],
    });
  }

  // Ingests Native ReaderActivity + Web reader telemetry into User Signals
  // Rules:
  //   pct >= 0.80 => +10 (complete)
  //   bookmarks / highlights added => +4 (quote, per newly discovered bookmark/highlight count cap)
  //   maxPage < 15 && now - lastReadAt >= 14 days => -3 (abandon_early)
  function ingestReaderTelemetry(telemetryMap, allPool, nowMs) {
    if (!telemetryMap || typeof telemetryMap !== 'object') return false;
    const now = Number(nowMs) || Date.now();
    let changed = false;

    for (const [k, raw] of Object.entries(telemetryMap)) {
      if (!raw || typeof raw !== 'object') continue;
      const meta = findMetaBookForTelemetry(raw, allPool);
      const bk = canonicalBookKey(meta) || k;
      const rawPct = Number(raw.maxPct != null ? raw.maxPct : raw.pct) || 0;
      const maxPct = rawPct > 1 ? (rawPct / 100) : rawPct;
      const maxPage = Number(raw.maxPage != null ? raw.maxPage : raw.page) || 0;
      const lastReadAt = Number(raw.lastReadAt) || 0;
      const annTotal = (Number(raw.bmCount) || 0) + (Number(raw.hlCount) || 0);

      // +10 completion signal (> 80% read)
      if (maxPct >= 0.80) {
        if (recordSignal(meta, 'complete', { dedupeKey: 'complete:' + bk })) changed = true;
        upsertUserBookStatus(meta, {
          status: 'completed',
          progress_percentage: Math.round(maxPct * 100),
          last_opened_at: lastReadAt || now,
        });
      }

      // +4 highlight / quote / bookmark signal
      if (annTotal > 0) {
        if (recordSignal(meta, 'quote', { dedupeKey: 'quote:' + bk })) changed = true;
      }

      // -3 early abandonment (< page 15 & >= 14 days idle without returning)
      if (lastReadAt > 0 && maxPage > 0 && maxPage < 15 && maxPct < 0.25 && (now - lastReadAt) >= 14 * DAY_MS) {
        if (recordSignal(meta, 'abandon_early', { dedupeKey: 'abandon:' + bk })) changed = true;
        upsertUserBookStatus(meta, {
          status: 'abandoned',
          progress_percentage: Math.round(maxPct * 100),
          last_opened_at: lastReadAt,
        });
      } else if (maxPage >= 15 || maxPct >= 0.30) {
        // User returned and read beyond page 15: lift earlier abandonment penalty
        const prevLen = getSignalLog().length;
        removeSignalsByDedupe('abandon:' + bk);
        if (getSignalLog().length !== prevLen) changed = true;
        if (maxPct < 0.80) {
          upsertUserBookStatus(meta, {
            status: 'reading',
            progress_percentage: Math.round(maxPct * 100),
            last_opened_at: lastReadAt || now,
          });
        }
      }
    }
    return changed;
  }

  // O(|user_tag_affinity|) Profile Reader with Exact Exponential Time Decay:
  //   affinity_score * EXP(-0.05 * age_days)
  function buildDecayedProfile(baseTasteSeed, prefCats, likedBooks, bookmarks, ownedKeys, nowMs) {
    const now = Number(nowMs) || Date.now();
    const log = getSignalLog();
    const rel = loadRelState();

    // Sync any legacy log items absent from relational store once
    if (log.length > 0 && Object.keys(rel.user_tag_affinity || {}).length === 0) {
      for (const s of log) {
        if (!s) continue;
        const bk = s.bookKey || canonicalBookKey(s);
        if (!bk) continue;
        upsertRelBook(rel, {
          id: s.bookId || bk,
          title: s.title || '',
          author: s.author || '',
          cat: s.cat || '',
          subCat: s.subCat || '',
          microTags: s.microTags || [],
          tags: s.tags || [],
          tone: s.tone || 'light',
        });
        applyRelAffinityDelta(rel, bk, Number(s.weight) || 0, 1, Number(s.ts) || now);
      }
      saveRelState(rel);
    }

    const cats = {};
    const subCats = {};
    const microTags = {};
    const authors = {};
    const tones = {};
    const bookAffinity = {};
    const decayedTagWeights = {};
    const recentSources = [];

    const addMap = (map, k, v) => {
      if (!k || !v) return;
      map[k] = (map[k] || 0) + v;
    };

    // Read pre-aggregated user_tag_affinity & apply EXP(-0.05 * age_days)
    let recentDecayedPosSum = 0;
    let olderDecayedPosSum = 0;
    for (const [tKey, row] of Object.entries(rel.user_tag_affinity || {})) {
      if (!row) continue;
      const ageDays = Math.max(0, (now - (Number(row.last_interacted_at) || now)) / DAY_MS);
      const decay = exponentialDecayFactor(ageDays);
      const eff = (Number(row.affinity_score) || 0) * decay;
      if (Math.abs(eff) < 0.0001) continue;
      decayedTagWeights[tKey] = (decayedTagWeights[tKey] || 0) + eff;
      if (eff > 0) {
        if (ageDays <= 7) recentDecayedPosSum += eff;
        else olderDecayedPosSum += eff;
      }

      const rawName = String(row.tag_name || '');
      if (row.tag_type === 'category' && rawName.startsWith('cat:')) {
        addMap(cats, rawName.slice(4), eff);
      } else if (row.tag_type === 'sub_category') {
        addMap(subCats, rawName, eff);
      } else if (row.tag_type === 'mood') {
        addMap(tones, rawName.replace(/^mood:/, ''), eff);
      } else {
        addMap(microTags, normKey(rawName), eff);
      }
    }

    // Soft cold-start floor when signals are sparse
    const seedDamp = log.length >= 3 ? 0.30 : 0.85;
    if (baseTasteSeed && baseTasteSeed.cats) {
      for (const [c, w] of Object.entries(baseTasteSeed.cats)) addMap(cats, c, Number(w) * seedDamp);
    }
    if (baseTasteSeed && baseTasteSeed.tags) {
      for (const [t, w] of Object.entries(baseTasteSeed.tags)) addMap(microTags, String(t).toLowerCase(), Number(w) * seedDamp);
    }
    if (baseTasteSeed && baseTasteSeed.authors) {
      for (const [a, w] of Object.entries(baseTasteSeed.authors)) addMap(authors, normKey(a), Number(w) * seedDamp);
    }
    if (Array.isArray(prefCats)) {
      prefCats.forEach(c => { if (c && c !== 'all') addMap(cats, c, 3.2); });
    }

    const loggedFavKeys = new Set(log.filter(x => x && x.signalType === 'favrate').map(x => x.bookKey));
    if (Array.isArray(likedBooks)) {
      for (const raw of likedBooks) {
        const b = enrichBook(Object.assign({}, raw));
        const bk = canonicalBookKey(b);
        if (!bk || loggedFavKeys.has(bk)) continue;
        addMap(cats, b.cat, 6.0);
        addMap(subCats, b.subCat, 5.0);
        (b.microTags || []).forEach(t => addMap(microTags, normKey(t), 4.0));
        if (b.author) addMap(authors, normKey(b.author), 4.8);
      }
    }

    // Extract recent signal metadata (author affinity + signal counts + recent source titles)
    const recentBookMap = new Map();
    const signalCounts = {};
    for (const s of log) {
      if (!s) continue;
      const st = LEGACY_SIGNAL_MAP[s.signalType] || s.signalType;
      if (st) signalCounts[st] = (signalCounts[st] || 0) + 1;
      const ageDays = Math.max(0, (now - (Number(s.ts) || now)) / DAY_MS);
      const eff = (Number(s.weight) || 0) * exponentialDecayFactor(ageDays);
      addMap(bookAffinity, s.bookKey, eff);
      const ca = normKey(s.author);
      if (ca) addMap(authors, ca, eff * 1.1);
      if (s.weight > 0) {
        const cur = recentBookMap.get(s.bookKey) || { bookKey: s.bookKey, title: s.title, cat: s.cat, subCat: s.subCat, score: 0, ts: s.ts, signalType: st };
        cur.score += eff;
        if (s.ts > cur.ts) { cur.ts = s.ts; cur.signalType = st; }
        recentBookMap.set(s.bookKey, cur);
      }
    }

    const positiveBooks = Array.from(recentBookMap.values()).sort((a, b) => b.score - a.score);
    recentSources.push(...positiveBooks.slice(0, 6));

    const rankedCats = Object.entries(cats).filter(([, w]) => w > 0.25).sort((a, b) => b[1] - a[1]);
    const rankedSubCats = Object.entries(subCats).filter(([, w]) => w > 0.25).sort((a, b) => b[1] - a[1]);
    const totalDecayedPos = recentDecayedPosSum + olderDecayedPosSum;
    const recentSharePct = totalDecayedPos > 0
      ? Math.round((recentDecayedPosSum * 100) / totalDecayedPos)
      : 0;

    return {
      cats,
      subCats,
      microTags,
      authors,
      tones,
      bookAffinity,
      decayedTagWeights,
      rankedCats,
      rankedSubCats,
      positiveBooks,
      recentSources,
      recentSharePct,
      signalCount: log.length,
      signalCounts,
    };
  }

  // Collaborative Filtering over Goodreads-style Reader Cohorts
  function matchReaderCohorts(profile, anchorBooks) {
    const cohorts = getCats().READER_COHORTS || [];
    const posIds = new Set();
    const posKeys = new Set();
    if (Array.isArray(anchorBooks)) {
      anchorBooks.forEach(b => {
        if (!b) return;
        if (b.id) posIds.add(b.id);
        posKeys.add(canonicalBookKey(b));
      });
    }
    profile.positiveBooks.forEach(p => {
      posKeys.add(p.bookKey);
      if (p.bookId) posIds.add(p.bookId);
    });

    const scored = cohorts.map(ch => {
      let overlap = 0;
      let sharedBookHits = 0;
      (ch.books || []).forEach(bid => {
        if (posIds.has(bid)) { overlap += 4.2; sharedBookHits++; }
      });
      (ch.cats || []).forEach(c => {
        if (profile.cats[c] > 0) overlap += Math.min(4.0, profile.cats[c] * 0.25);
      });
      (ch.tags || []).forEach(tg => {
        const nk = normKey(tg);
        if (profile.microTags[nk] > 0) overlap += Math.min(2.5, profile.microTags[nk] * 0.22);
      });
      // Boost cohort matching strongly once >= 2 shared books/strong topic overlap exist
      const maxRef = 14;
      const simRatio = Math.min(0.98, Math.max(0.12, overlap / maxRef));
      const simPct = Math.round(52 + simRatio * 45);
      return {
        id: ch.id,
        label: ch.label,
        cohort: ch,
        overlap,
        sharedBookHits,
        simPct,
        similarityPct: simPct,
      };
    }).filter(x => x.overlap > 1.5).sort((a, b) => b.overlap - a.overlap);

    return scored.slice(0, 4);
  }

  function getReadingTimeContext(overrideMode, nowDate) {
    const d = nowDate instanceof Date ? nowDate : new Date();
    const hr = d.getHours();
    const day = d.getDay(); // 5 = Fri, 6 = Sat
    const isWeekendEvening = (day === 5 || day === 6) && hr >= 14;
    let active = overrideMode && overrideMode !== 'auto' ? overrideMode : '';
    if (!active) {
      if (hr >= 5 && hr < 12) active = 'morning';
      else if (hr >= 12 && hr < 18 && !isWeekendEvening) active = 'afternoon';
      else active = 'evening';
    }
    const META = {
      morning: {
        mode: 'morning',
        label: 'صباحي • كتب خفيفة ومقالات للمواصلات',
        badge: 'قراءة الصباح والمواصلات',
      },
      afternoon: {
        mode: 'afternoon',
        label: 'الظهيرة • قراءات عملية وسردية متوازنة',
        badge: 'توازن الظهيرة',
      },
      evening: {
        mode: 'evening',
        label: 'مسائي وعطلة الأسبوع • قراءة ثقافية عميقة',
        badge: 'عمق المساء والعطلة',
      },
    };
    return META[active] || META.evening;
  }

  function scoreBookForTimeContext(book, timeCtxOrMode) {
    if (!book || !timeCtxOrMode) return 0;
    const ctxObj = typeof timeCtxOrMode === 'string'
      ? getReadingTimeContext(timeCtxOrMode)
      : timeCtxOrMode;
    const mode = ctxObj && ctxObj.mode;
    if (!mode) return 0;
    const pages = Number(book.pages) || 260;
    if (mode === 'morning') {
      let sc = 0;
      if (book.tone === 'light') sc += 9;
      if (pages <= 230) sc += 6;
      else if (pages <= 320) sc += 2.5;
      else sc -= 3;
      return sc;
    }
    if (mode === 'evening') {
      let sc = 0;
      if (book.tone === 'deep' || book.tone === 'narrative') sc += 8.5;
      else if (book.tone === 'academic') sc += 6;
      if (pages >= 280) sc += 4;
      return sc;
    }
    return book.tone === 'light' || book.tone === 'narrative' ? 4 : 2;
  }

  // Deterministic book-to-book similarity (for "العادات الذرية -> قوة العادات" & modal related list)
  function scoreBookToBook(seedRaw, candRaw) {
    const seed = enrichBook(Object.assign({}, seedRaw));
    const cand = enrichBook(Object.assign({}, candRaw));
    const sk = canonicalBookKey(seed);
    const ck = canonicalBookKey(cand);
    if (!ck || sk === ck || seed.id === cand.id) return { score: -1, sharedTags: [], reason: '' };

    let sc = 0;
    const sharedTags = [];
    if (seed.author && cand.author && normKey(seed.author) === normKey(cand.author) && seed.author !== 'مؤلف غير محدد') {
      sc += 11;
    }
    if (seed.subCat && cand.subCat && seed.subCat === cand.subCat) {
      sc += 9.5;
    }
    if (seed.cat && cand.cat && seed.cat === cand.cat) {
      sc += 5.5;
    }
    const seedMicro = new Set((seed.microTags || []).map(normKey));
    for (const mt of (cand.microTags || [])) {
      const nm = normKey(mt);
      if (seedMicro.has(nm)) {
        sc += 4.8;
        if (sharedTags.length < 3) sharedTags.push(mt);
      }
    }
    const seedRawTags = new Set((seed.tags || []).map(t => String(t).toLowerCase()));
    for (const tg of (cand.tags || [])) {
      if (seedRawTags.has(String(tg).toLowerCase())) sc += 2.6;
    }
    if (seed.tone === cand.tone) sc += 2.0;

    // Cross-keyword boost on titles/descriptions (e.g., "العادات" in title/query)
    const sw = normKey((seed.title || '') + ' ' + (seed.desc || '')).split(' ').filter(w => w.length >= 4);
    const ct = normKey((cand.title || '') + ' ' + (cand.desc || ''));
    let hits = 0;
    for (const w of sw) {
      if (hits >= 4) break;
      if (ct.includes(w)) { sc += 1.6; hits++; }
    }

    const reason = sharedTags.length
      ? ('تشابه: ' + sharedTags.slice(0, 2).join(' + '))
      : (seed.subCat && seed.subCat === cand.subCat ? cand.subCat : '');
    return { score: sc, sharedTags, reason };
  }

  function getSimilarBooks(seedBook, pool, opts) {
    if (!seedBook) return [];
    const o = opts || {};
    const limit = o.limit || 12;
    const ownedKeys = o.ownedKeys || new Set();
    const excludeKeys = o.excludeKeys || new Set();
    const profile = o.profile || null;
    const seen = new Set([canonicalBookKey(seedBook)]);

    const ranked = [];
    for (const raw of (pool || [])) {
      if (!raw || !raw.title) continue;
      const b = enrichBook(raw);
      const ck = canonicalBookKey(b);
      if (!ck || seen.has(ck) || excludeKeys.has(ck)) continue;
      if (o.excludeOwned && ownedKeys.has(ck)) continue;
      seen.add(ck);

      const sim = scoreBookToBook(seedBook, b);
      if (sim.score <= 0) continue;
      let total = sim.score;
      if (profile && profile.bookAffinity[ck] < 0) total -= 8;
      if (profile && b.cat && profile.cats[b.cat] > 0) total += Math.min(5, profile.cats[b.cat] * 0.25);
      ranked.push({
        book: b,
        score: total,
        reason: sim.reason || 'ذات صلة بالموضوع',
      });
    }
    ranked.sort((a, b) => b.score - a.score);
    return ranked.slice(0, limit);
  }

  function hashRotation(str, seed) {
    if (!seed) return 0;
    let h = seed * 2654435761;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    return (((h >>> 0) % 21) - 5) * 1.15;
  }

  function recordImpressions(books, nowMs, opts) {
    if (!Array.isArray(books) || !books.length) return [];
    const o = opts || {};
    const now = Number(nowMs) || Date.now();
    const imp = getImpressionsMap();
    const newlyHidden = [];
    const nativeItems = [];
    let dirty = false;

    for (const raw of books) {
      const bk = canonicalBookKey(raw);
      if (!bk) continue;
      const reason = (raw && raw._recReason) || (raw && raw._recSector) || 'topic_match';
      const rec = imp[bk] || {
        user_id: ACTIVE_USER_ID,
        book_id: bk,
        external_key: bk,
        recommendation_reason: reason,
        shown_count: 0,
        is_clicked: false,
        cooldown_until: null,
        last_shown_at: 0,
        count: 0,
        lastShownTs: 0,
        hiddenUntil: 0,
        clicked: false,
      };
      const prevTs = rec.lastShownTs || rec.last_shown_at || 0;
      if (!o.force && (now - prevTs) < MIN_IMPRESSION_GAP_MS) continue;
      const nextCount = (rec.shown_count || rec.count || 0) + 1;
      const isClicked = !!(rec.is_clicked || rec.clicked);
      rec.user_id = ACTIVE_USER_ID;
      rec.book_id = bk;
      rec.external_key = bk;
      rec.recommendation_reason = reason;
      rec.shown_count = nextCount;
      rec.count = nextCount;
      rec.is_clicked = isClicked;
      rec.clicked = isClicked;
      rec.last_shown_at = now;
      rec.lastShownTs = now;
      if (!isClicked && nextCount >= IMPRESSION_HIDE_THRESHOLD) {
        rec.cooldown_until = now + COOLDOWN_DAYS * DAY_MS;
        rec.hiddenUntil = rec.cooldown_until;
        newlyHidden.push(bk);
      }
      imp[bk] = rec;
      const bookRec = serializeBookForRel(raw);
      if (bookRec) nativeItems.push({ external_key: bk, recommendation_reason: reason, book: bookRec });
      dirty = true;
    }
    if (dirty) {
      saveImpressionsMap(imp);
      const rel = loadRelState();
      rel.recommendation_impressions = imp;
      saveRelState(rel);
    }
    const ktb = nativeBridge();
    if (ktb && ktb.recDbRecordImpressions && nativeItems.length) {
      ktb.recDbRecordImpressions(ACTIVE_USER_ID, nativeItems, now, !!o.force);
    }
    return newlyHidden;
  }

  function markBookClicked(book, nowMs) {
    const bk = canonicalBookKey(book);
    if (!bk) return;
    const now = Number(nowMs) || Date.now();
    const imp = getImpressionsMap();
    const rec = imp[bk] || { user_id: ACTIVE_USER_ID, book_id: bk, external_key: bk, recommendation_reason: 'clicked' };
    rec.user_id = ACTIVE_USER_ID;
    rec.book_id = bk;
    rec.external_key = bk;
    rec.is_clicked = true;
    rec.clicked = true;
    rec.shown_count = 0;
    rec.count = 0;
    rec.cooldown_until = null;
    rec.hiddenUntil = 0;
    rec.last_shown_at = now;
    rec.lastShownTs = now;
    rec.lastClickTs = now;
    imp[bk] = rec;
    saveImpressionsMap(imp);
    const rel = loadRelState();
    rel.recommendation_impressions = imp;
    saveRelState(rel);
    const ktb = nativeBridge();
    if (ktb && ktb.recDbMarkClicked) {
      ktb.recDbMarkClicked(ACTIVE_USER_ID, bk, now);
    }
  }

  // Computes exact relational score SUM(uta.affinity_score * bt.relevance_weight * EXP(-0.05 * age_days))
  function queryByAffinitySqlFormula(pool, opts) {
    const o = opts || {};
    const nowMs = Number(o.nowMs) || Date.now();
    const limit = Number(o.limit) || 20;
    const rel = loadRelState();
    const ubsMap = rel.user_book_status || {};
    const impMap = getImpressionsMap();

    const decayedTagMap = new Map();
    for (const [tKey, row] of Object.entries(rel.user_tag_affinity || {})) {
      if (!row) continue;
      const ageDays = Math.max(0, (nowMs - (Number(row.last_interacted_at) || nowMs)) / DAY_MS);
      const eff = (Number(row.affinity_score) || 0) * exponentialDecayFactor(ageDays);
      if (Math.abs(eff) > 0.0001) decayedTagMap.set(tKey, eff);
    }

    const out = [];
    const seen = new Set();
    for (const raw of (pool || [])) {
      if (!raw || !raw.title) continue;
      const b = enrichBook(Object.assign({}, raw));
      const bk = canonicalBookKey(b);
      if (!bk || seen.has(bk)) continue;
      seen.add(bk);

      // SQL WHERE ubs.book_id IS NULL AND (ri.cooldown_until IS NULL OR ri.cooldown_until < NOW())
      if (ubsMap[bk] && ubsMap[bk].status !== 'wishlist') continue;
      const ri = impMap[bk];
      const cdUntil = ri ? (ri.cooldown_until || ri.hiddenUntil || 0) : 0;
      if (cdUntil > nowMs && !(ri && (ri.is_clicked || ri.clicked))) continue;

      let sqlScore = 0;
      const tagsList = Array.isArray(b.weightedTags) ? b.weightedTags : computeBookTagWeights(b);
      for (const tg of tagsList) {
        const w = decayedTagMap.get(normKey(tg.name));
        if (w) sqlScore += w * tg.relevance_weight;
      }
      out.push({
        book_id: b.id || bk,
        external_key: bk,
        title: b.title,
        reading_difficulty: b.reading_difficulty || 'medium',
        final_recommendation_score: Math.round(sqlScore * 100) / 100,
        book: b,
      });
    }
    out.sort((a, b) => b.final_recommendation_score - a.final_recommendation_score);
    return out.slice(0, limit);
  }

  function getRelationalSnapshot() {
    const rel = loadRelState();
    return {
      books: Object.values(rel.books || {}),
      tags: Object.values(rel.tags || {}),
      book_tags: Object.values(rel.book_tags || {}).flat(),
      user_interactions: rel.user_interactions || [],
      user_book_status: Object.values(rel.user_book_status || {}),
      user_tag_affinity: Object.values(rel.user_tag_affinity || {}),
      recommendation_impressions: Object.values(
        (rel.recommendation_impressions && Object.keys(rel.recommendation_impressions).length)
          ? rel.recommendation_impressions
          : getImpressionsMap()
      ),
      native: nativeBridge() && nativeBridge().recDbGetState ? nativeBridge().recDbGetState(ACTIVE_USER_ID) : null,
    };
  }

  function resetAll() {
    saveStore('wq_signal_log', []);
    saveStore('wq_ratings', {});
    saveStore('wq_impressions', {});
    saveStore('wq_dismissed_books', []);
    saveStore(REL_STORE_KEY, emptyRelState());
    const ktb = nativeBridge();
    if (ktb && ktb.recDbResetUser) ktb.recDbResetUser(ACTIVE_USER_ID);
  }

  function buildHomeAllocations(params) {
    const p = params || {};
    const nowMs = Number(p.nowMs) || Date.now();
    const pool = Array.isArray(p.pool) ? p.pool : [];
    const ownedKeys = p.ownedKeys instanceof Set ? p.ownedKeys : new Set();
    const telemetryMap = p.telemetryMap || {};
    const likedBooks = Array.isArray(p.likedBooks) ? p.likedBooks : [];
    const bookmarks = Array.isArray(p.bookmarks) ? p.bookmarks : [];
    const matchesPref = typeof p.matchesPref === 'function' ? p.matchesPref : (() => true);
    const fameFn = typeof p.fameFn === 'function' ? p.fameFn : (b => Number(b.fame || 70));
    const timeCtx = getReadingTimeContext(p.timeMode || 'auto', new Date(nowMs));
    const rot = Number(p.rotation) || 0;
    const prefLength = (p.prefLength === 'short' || p.prefLength === 'long')
      ? p.prefLength
      : (typeof localStorage !== 'undefined' && (localStorage.getItem('wq_pref_length') === 'short' || localStorage.getItem('wq_pref_length') === 'long')
        ? localStorage.getItem('wq_pref_length') : 'all');

    // 1. Complete set of completed / negatively-rated / cooled-down books to exclude from suggestions
    const completedKeys = new Set();
    for (const raw of Object.values(telemetryMap)) {
      if (!raw) continue;
      const rp = Number(raw.maxPct != null ? raw.maxPct : raw.pct) || 0;
      const mp = rp > 1 ? (rp / 100) : rp;
      if (mp >= 0.80) completedKeys.add(canonicalBookKey(raw.title || raw.uri || ''));
    }
    for (const s of getSignalLog()) {
      if (s && s.signalType === 'complete' && s.bookKey) completedKeys.add(s.bookKey);
    }
    const ratings = getRatingsMap();
    const dismissed = getDismissedSet();
    const impressions = getImpressionsMap();
    const rel = loadRelState();
    const ubsMap = rel.user_book_status || {};

    const profile = buildDecayedProfile(p.baseTasteSeed, p.prefCats, likedBooks, bookmarks, ownedKeys, nowMs);
    const anchorPool = [...likedBooks, ...bookmarks];
    const cohorts = matchReaderCohorts(profile, anchorPool);

    // Build collaborative lookup map: bookId -> cohort info
    const collabBoostMap = new Map();
    for (const chInfo of cohorts) {
      for (const bid of (chInfo.cohort.books || [])) {
        if (!collabBoostMap.has(bid)) {
          collabBoostMap.set(bid, {
            cohortLabel: chInfo.cohort.label,
            simPct: chInfo.simPct,
            score: 14 * (chInfo.simPct / 100),
          });
        }
      }
    }

    // Deduplicate candidate universe and apply eligibility filtering
    const seenKeys = new Set();
    const candidates = [];
    const ownedOrCooldownSkipped = [];

    for (const raw of pool) {
      if (!raw || !raw.title) continue;
      const b = enrichBook(raw);
      if (!matchesPref(b)) continue;
      const ck = canonicalBookKey(b);
      if (!ck || seenKeys.has(ck)) continue;
      seenKeys.add(ck);

      const ubsRow = ubsMap[ck];
      const inUbs = !!(ubsRow && ubsRow.status !== 'wishlist');
      const isOwned = ownedKeys.has(ck);
      const isCompleted = completedKeys.has(ck);
      const isDismissed = dismissed.has(ck) || (Number(ratings[ck] || 0) > 0 && Number(ratings[ck] || 0) <= 2);
      const impRec = impressions[ck];
      const cdUntil = impRec ? (impRec.cooldown_until || impRec.hiddenUntil || 0) : 0;
      const inCooldown = !!(cdUntil && cdUntil > nowMs && !(impRec && (impRec.is_clicked || impRec.clicked)));

      if (isDismissed) continue;
      if (inUbs || isOwned || isCompleted || inCooldown) {
        ownedOrCooldownSkipped.push(b);
        continue;
      }
      candidates.push(b);
    }

    // Fallback safety only if candidate list is nearly empty (so UI never goes blank)
    const activeCandidates = candidates.length >= 12 ? candidates : [...candidates, ...ownedOrCooldownSkipped.slice(0, 20)];

    // Score each candidate for:
    //  (A) 70% Personal Hybrid (Content + Collaborative Cohorts + Time Context)
    //  (B) 20% Horizon Expansion (Cross-Domain Bridges outside user's #1 subCat)
    //  (C) 10% Trending & Fresh Discovery
    const primaryCat = (profile.rankedCats[0] && profile.rankedCats[0][0]) || 'psychology_habits';
    const primarySub = (profile.rankedSubCats[0] && profile.rankedSubCats[0][0]) || '';
    const bridges = (getCats().CROSS_DOMAIN_BRIDGES || {})[primaryCat] || [];

    const scoredPersonal = [];
    const scoredHorizon = [];
    const scoredExplore = [];

    const catNameMap = Object.fromEntries(((getCats().CATEGORIES || [])).map(c => [c.id, c.name]));

    for (const b of activeCandidates) {
      const ck = canonicalBookKey(b);
      const fam = fameFn(b);
      const timeSc = scoreBookForTimeContext(b, timeCtx);
      const jitter = hashRotation(b.id || ck, rot);

      // Content score from decayed profile
      let contentSc = 0;
      if (b.cat && profile.cats[b.cat]) contentSc += profile.cats[b.cat] * 1.45;
      if (b.subCat && profile.subCats[b.subCat]) contentSc += profile.subCats[b.subCat] * 1.85;
      const ca = normKey(b.author);
      if (ca && profile.authors[ca]) contentSc += profile.authors[ca] * 1.9;
      let matchedTag = '';
      let bestTagW = 0;
      for (const tg of [...(b.microTags || []), ...(b.tags || [])]) {
        const w = profile.microTags[normKey(tg)] || 0;
        if (w) {
          contentSc += w * 0.95;
          if (w > bestTagW && /[\u0600-\u06FF]/.test(tg)) { bestTagW = w; matchedTag = tg; }
        }
      }
      if (profile.bookAffinity[ck] < 0) contentSc += profile.bookAffinity[ck] * 3.0;
      // Relational weighted-tag dot-product: SUM(affinity_score * relevance_weight * EXP(-0.05 * age_days))
      let relTagScore = 0;
      const wTags = Array.isArray(b.weightedTags) ? b.weightedTags : computeBookTagWeights(b);
      for (const tg of wTags) {
        const tw = (profile.decayedTagWeights && profile.decayedTagWeights[normKey(tg.name)]) || 0;
        if (tw) relTagScore += tw * tg.relevance_weight;
      }
      contentSc += relTagScore * 0.65;

      // Collaborative cohort score
      const col = collabBoostMap.get(b.id);
      const collabSc = col ? col.score : 0;

      const bPages = Number(b.pages) || 260;
      const lenSc = prefLength === 'short'
        ? (bPages < 250 ? 22 : -15)
        : (prefLength === 'long' ? (bPages >= 250 ? 18 : -13) : 0);

      const personalTotal = contentSc + collabSc + timeSc * 0.75 + lenSc + fam * 0.35 + jitter;
      let pReason = '';
      if (col) pReason = 'قرّاء يشبهونك • تشابه ' + col.simPct + '%';
      else if (prefLength === 'short' && bPages < 250) pReason = 'كتاب قصير (' + bPages + ' صفحة)';
      else if (prefLength === 'long' && bPages >= 250) pReason = 'عمل معمّق (' + bPages + ' صفحة)';
      else if (timeCtx.mode === 'morning' && b.tone === 'light' && b.pages <= 240) pReason = 'مناسب للصباح والمواصلات';
      else if (timeCtx.mode === 'evening' && b.tone === 'deep') pReason = 'قراءة مسائية عميقة';
      else if (matchedTag) pReason = 'اهتمامك بـ: ' + matchedTag;
      else if (catNameMap[b.cat]) pReason = 'على ذوقك: ' + catNameMap[b.cat];

      scoredPersonal.push({ book: b, score: personalTotal, reason: pReason, sector: 'personal' });

      // Cross-Domain Horizon (20%): books matching bridges AND differing from primarySub
      let hScore = 0;
      let hReason = '';
      for (const br of bridges) {
        if (b.cat === br.targetCat) {
          hScore += 16;
          hReason = br.reason;
        }
        const bMicroSet = new Set((b.microTags || []).map(normKey));
        for (const bt of (br.targetTags || [])) {
          if (bMicroSet.has(normKey(bt))) {
            hScore += 8;
            if (!hReason) hReason = br.reason;
          }
        }
      }
      if (hScore > 0 && b.subCat !== primarySub) {
        const accessibleBoost = (b.tone === 'academic' && primaryCat !== 'medicine_neuro' && primaryCat !== 'tech_ai') ? -9 : 5;
        scoredHorizon.push({
          book: b,
          score: hScore + accessibleBoost + timeSc * 0.45 + lenSc * 0.65 + fam * 0.4 + jitter,
          reason: hReason || 'توسيع آفاق معرفية جديدة',
          sector: 'horizon',
        });
      }

      // Explore & Weekly Trending (10%): strong fame + novelty outside #1 category
      const noveltyBonus = b.cat !== primaryCat ? 14 : 0;
      const eReason = 'الأكثر رواجاً' + (catNameMap[b.cat] ? ' • ' + catNameMap[b.cat] : '');
      scoredExplore.push({
        book: b,
        score: fam * 1.15 + noveltyBonus + timeSc * 0.25 + lenSc * 0.6 + jitter,
        reason: eReason,
        sector: 'explore',
      });
    }

    scoredPersonal.sort((a, b) => b.score - a.score);
    scoredHorizon.sort((a, b) => b.score - a.score);
    scoredExplore.sort((a, b) => b.score - a.score);

    // Partition cleanly without duplicate cards across 70 / 20 / 10 shelves
    const used = new Set();
    const takeUnique = (arr, limit) => {
      const out = [];
      for (const item of arr) {
        const ck = canonicalBookKey(item.book);
        if (used.has(ck)) continue;
        used.add(ck);
        out.push(Object.assign({}, item.book, { _recReason: item.reason, _recSector: item.sector }));
        if (out.length >= limit) break;
      }
      return out;
    };

    const interleaveLengthRatio = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return arr || [];
      if (prefLength !== 'short' && prefLength !== 'long') return arr;
      const isMatch = (b) => {
        const pg = Number(b && b.pages) || 260;
        return prefLength === 'short' ? (pg < 250) : (pg >= 250);
      };
      const primary = [];
      const secondary = [];
      for (const x of arr) {
        if (isMatch(x)) primary.push(x);
        else secondary.push(x);
      }
      if (!primary.length || !secondary.length) return arr;
      const mixed = [];
      let pi = 0, si = 0;
      while (pi < primary.length || si < secondary.length) {
        for (let k = 0; k < 4 && pi < primary.length; k++) mixed.push(primary[pi++]);
        if (si < secondary.length) mixed.push(secondary[si++]);
        if (pi >= primary.length && si < secondary.length) {
          while (si < secondary.length) mixed.push(secondary[si++]);
        }
        if (si >= secondary.length && pi < primary.length) {
          while (pi < primary.length) mixed.push(primary[pi++]);
        }
      }
      return mixed;
    };

    // Total shelf budget = 40 -> exact 70% = 28 cards, 20% = 8 cards, 10% = 4 cards
    const personal70 = interleaveLengthRatio(takeUnique(scoredPersonal, 28));
    const horizon20 = interleaveLengthRatio(takeUnique(scoredHorizon, 8));
    const explore10 = interleaveLengthRatio(takeUnique(scoredExplore, 4));

    // Interleaved 70 / 20 / 10 full feed for the lower browsable grid (7 : 2 : 1 cadence)
    const feed70Pool = scoredPersonal.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'personal' }));
    const feed20Pool = scoredHorizon.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'horizon' }));
    const feed10Pool = scoredExplore.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'explore' }));

    const combinedFeedRaw = [];
    const seenFeed = new Set();
    const pullNext = (arr) => {
      while (arr.length) {
        const cand = arr.shift();
        const ck = canonicalBookKey(cand);
        if (!seenFeed.has(ck)) {
          seenFeed.add(ck);
          return cand;
        }
      }
      return null;
    };
    while (feed70Pool.length || feed20Pool.length || feed10Pool.length) {
      let pushed = false;
      for (let i = 0; i < 7; i++) { const x = pullNext(feed70Pool); if (x) { combinedFeedRaw.push(x); pushed = true; } }
      for (let i = 0; i < 2; i++) { const x = pullNext(feed20Pool); if (x) { combinedFeedRaw.push(x); pushed = true; } }
      for (let i = 0; i < 1; i++) { const x = pullNext(feed10Pool); if (x) { combinedFeedRaw.push(x); pushed = true; } }
      if (!pushed) break;
    }
    const combinedFeed = interleaveLengthRatio(combinedFeedRaw);

    // Dynamic reason headers
    const topRecentTitle = profile.recentSources[0] ? profile.recentSources[0].title.split('—')[0].trim() : '';
    const primaryCatName = catNameMap[primaryCat] || 'الكتب المختارة';
    const topCohort = cohorts[0] || null;
    const personalSubtitle = topRecentTitle
      ? ('مبنية على قراءاتك وتحميلاتك الأخيرة (' + topRecentTitle.slice(0, 28) + ')' + (topCohort ? (' + ' + topCohort.cohort.label) : ''))
      : ('مزيج المحتوى المتشابه مع قرّاء يشبهونك في ' + primaryCatName);

    const bridgeReason = (bridges[0] && bridges[0].reason) || 'كتب متقاطعة معرفياً مع مجال اهتمامك لكسر الروتين';

    return {
      profile,
      cohorts,
      timeCtx,
      personal70,
      horizon20,
      explore10,
      personalFull: interleaveLengthRatio(scoredPersonal.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'personal' }))),
      horizonFull: interleaveLengthRatio(scoredHorizon.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'horizon' }))),
      exploreFull: interleaveLengthRatio(scoredExplore.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'explore' }))),
      combinedFeed,
      personalSubtitle,
      horizonSubtitle: bridgeReason,
      exploreSubtitle: 'الأكثر تحميلاً وقراءة لتجديد الاكتشاف',
      heroBook: personal70[0] || activeCandidates[0] || null,
    };
  }

  window.KOTOB_RECOMMENDER = {
    SIGNAL_WEIGHTS,
    ACTION_TYPE_MAP,
    DECAY_LAMBDA,
    TONE_LABELS,
    canonicalBookKey,
    normKey,
    formatReadTime,
    computeBookTagWeights,
    exponentialDecayFactor,
    enrichBook,
    syncCatalogToNativeDb,
    upsertUserBookStatus,
    getSignalLog,
    recordSignal,
    removeSignalsByDedupe,
    syncFavoriteSignal,
    setBookRating,
    getBookRating,
    getRatingsMap,
    dismissRecommendation,
    ingestReaderTelemetry,
    buildDecayedProfile,
    matchReaderCohorts,
    getReadingTimeContext,
    scoreBookForTimeContext,
    scoreBookToBook,
    getSimilarBooks,
    recordImpressions,
    markBookClicked,
    getImpressionsMap,
    queryByAffinitySqlFormula,
    getRelationalSnapshot,
    resetAll,
    buildHomeAllocations,
  };
})();
