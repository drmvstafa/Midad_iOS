(function () {
  'use strict';

  const S = window.KOTOB_SOURCES;
  const CATS = window.KOTOB_CATALOG;
  const REC = window.KOTOB_RECOMMENDER;
  const HABIT = window.KOTOB_HABIT;
  const $ = (id) => document.getElementById(id);

  // Clean uniform SVG vector icon library (zero emojis anywhere in the app)
  const SVG = {
    grid: '<svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    compass: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    brain: '<svg class="ic" viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-5.04"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-5.04"/></svg>',
    heartPulse: '<svg class="ic" viewBox="0 0 24 24"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-3 2 6 1.5-3h5.27"/></svg>',
    briefcase: '<svg class="ic" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    feather: '<svg class="ic" viewBox="0 0 24 24"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg>',
    languages: '<svg class="ic" viewBox="0 0 24 24"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>',
    scroll: '<svg class="ic" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"/></svg>',
    code: '<svg class="ic" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    comics: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8"/><path d="M8 13h5"/></svg>',
    moonBook: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    rocket: '<svg class="ic" viewBox="0 0 24 24"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    atom: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5Z"/><path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5Z"/></svg>',
    columns: '<svg class="ic" viewBox="0 0 24 24"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><polygon points="12 2 20 7 4 7"/></svg>',
    quill: '<svg class="ic" viewBox="0 0 24 24"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
    heart: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    heartFill: '<svg class="ic sm filled" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    bookOpen: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
    download: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    user: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    sparkle: '<svg class="ic sm" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    starFill: '<svg class="ic sm filled" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    telegram: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>',
    globe: '<svg class="ic sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chevronDown: '<svg class="ic sm" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>',
    folder: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    flame: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    snowflake: '<svg class="ic sm" viewBox="0 0 24 24"><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/><path d="m20 16-4-4 4-4M4 8l4 4-4 4M16 4l-4 4-4-4M8 20l4-4 4 4"/></svg>',
    bell: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    check: '<svg class="ic sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
    messageSquare: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    thumbsUp: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>',
    trash: '<svg class="ic sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
    sliders: '<svg class="ic sm" viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    quote: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M10 11H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4"/><path d="M20 11h-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v6a4 4 0 0 1-4 4"/></svg>',
    refresh: '<svg class="ic sm" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
    headphones: '<svg class="ic sm" viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
    play: '<svg class="ic sm" viewBox="0 0 24 24"><polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/></svg>',
    pause: '<svg class="ic sm" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/></svg>',
    arabesque: '<svg class="ar-cov-motif" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><polygon points="12 2 15.5 8.5 22 12 15.5 15.5 12 22 8.5 15.5 2 12 8.5 8.5 12 2"/><circle cx="12" cy="12" r="3"/></svg>',
  };

  function catIcon(key) {
    return SVG[key] || SVG.grid;
  }

  // O(1) Global Book Registry so delegated clicks never scan arrays
  const BOOK_MAP = new Map();

  function loadJson(k, fb) {
    try { return JSON.parse(localStorage.getItem(k) || 'null') || fb; } catch (_) { return fb; }
  }
  function saveJson(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) { }
  }

  function initialTaste() {
    const saved = loadJson('wq_taste', null);
    if (saved && saved.cats) return saved;
    return JSON.parse(JSON.stringify(CATS.TABLET_TASTE_SEED));
  }

  const state = {
    tab: 'home',
    theme: localStorage.getItem('wq_theme') || 'sepia',
    prefLang: localStorage.getItem('wq_pref_lang') || 'both',
    prefFormat: localStorage.getItem('wq_pref_format') === 'epub' ? 'epub' : 'pdf',
    prefLength: (localStorage.getItem('wq_pref_length') === 'short' || localStorage.getItem('wq_pref_length') === 'long') ? localStorage.getItem('wq_pref_length') : 'all',
    showComics: localStorage.getItem('wq_show_comics') !== '0',
    prefCats: loadJson('wq_pref_cats', ['mystery_classics', 'psychology_habits', 'medicine_neuro', 'marketing_strategy', 'arabic_novels']),
    trendingCats: loadJson('wq_trending_cats', ['all']),
    sidebarHidden: localStorage.getItem('wq_rail_hidden') === '1',
    prefAccent: localStorage.getItem('wq_accent') || 'emerald',
    motionMode: localStorage.getItem('wq_motion') === 'reduced' ? 'reduced' : 'premium',
    gridDensity: localStorage.getItem('wq_density') === 'dense' ? 'dense' : 'normal',
    hapticsEnabled: localStorage.getItem('wq_haptics') !== '0',
    homeCat: 'all',
    discCat: 'mystery_classics',
    searchScope: 'all',
    searchLang: (localStorage.getItem('wq_pref_lang') === 'ar' ? 'ar' : (localStorage.getItem('wq_pref_lang') === 'en' ? 'en' : '')),
    searchFmt: '',
    searchQuery: '',
    searchResults: [],
    searchSeq: 0,
    savedSub: 'liked',
    bookmarks: loadJson('wq_bookmarks', []),
    liked: loadJson('wq_liked', []),
    history: loadJson('wq_history', []),
    recentQ: loadJson('wq_recent_q', []),
    taste: initialTaste(),
    downloads: [],
    localBooks: [],
    deviceBooks: [],
    cloudLibrary: loadJson('wq_cloud_library', []),
    uriSources: loadJson('wq_uri_sources', {}),
    onlineReviewsCache: {},
    onlineReviewsLoading: {},
    readProgressMap: loadJson('wq_read_progress', {}),
    prepJobs: new Map(),
    bookHadPrep: new Map(),
    activeRowKeyByBook: new Map(),
    activeScribdBook: null,
    activeScribdDocId: '',
    scribdZoom: 100,
    libFilter: 'all',
    libSort: localStorage.getItem('wq_lib_sort') || 'smart',
    libViewMode: localStorage.getItem('wq_lib_view') === 'compact' ? 'compact' : 'detailed',
    libFolders: loadJson('wq_lib_folders', []),
    libOpenFolderId: '',
    libQuery: '',
    libSelectedVer: {},
    hiddenWebUris: new Set(loadJson('wq_hidden_web', [])),
    seenDoneIds: new Set(),
    seenErrIds: new Set(),
    currentModalBook: null,
    currentModalLinks: [],
    modalGen: 0,
    currentAuthor: '',
    liveCache: { ar: [], en: [], trending: [], homeGrid: [], catLive: {}, disc: {} },
    catFetching: {},
    tasteRotation: 0,
    recTimeMode: localStorage.getItem('wq_time_mode') || 'auto',
    heroFocusMode: localStorage.getItem('wq_hero_focus_mode') || (localStorage.getItem('wq_show_continue_hero') === '0' ? 'discovery' : 'continue_only'),
    showContinueHero: (localStorage.getItem('wq_hero_focus_mode') || (localStorage.getItem('wq_show_continue_hero') === '0' ? 'discovery' : 'continue_only')) !== 'discovery',
    autoOpenLastBook: localStorage.getItem('wq_auto_open_last') === '1',
    homeMixFilter: 'all',
    habitConfigOpen: false,
    reviewSort: 'positive',
    discSubCat: '',
    readerTelemetry: (KTB.getReaderTelemetry && KTB.getReaderTelemetry()) || {},
    _lastHomeAlloc: null,
    _detailDwellTimer: null,
    abMode: 'all',
    abLang: 'all',
    abCat: 'all',
    abLatestBooks: [],
    abQuery: '',
    abSearchResults: [],
    abSearching: false,
    abCurrentBook: loadJson('wq_ab_current', null),
    abTracksCache: {},
    abChapterPlanMap: {},
    abAudioState: null,
    pickedAudioBooks: loadJson('wq_picked_audio_v1', []),
    abProgressMap: loadJson('wq_ab_progress_v1', {}),
  };
  window.__midadPrefFormat = state.prefFormat;

  function recordCopySource(uriOrFile, title, sourceName) {
    const src = String(sourceName || '').trim();
    if (!src) return;
    let dirty = false;
    if (uriOrFile) {
      const k = String(uriOrFile).trim();
      if (k && state.uriSources[k] !== src) { state.uriSources[k] = src; dirty = true; }
    }
    if (title) {
      const nt = typeof normBookText === 'function' ? normBookText(title) : String(title).toLowerCase().trim();
      if (nt && !state.uriSources['t:' + nt]) { state.uriSources['t:' + nt] = src; dirty = true; }
    }
    if (dirty) saveJson('wq_uri_sources', state.uriSources);
  }

  function resolveVersionSourceName(uri, fileName, title, explicitSource, sourceKind, folder) {
    if (explicitSource && String(explicitSource).trim() && String(explicitSource).trim() !== 'مداد') {
      return String(explicitSource).trim();
    }
    if (uri && state.uriSources[uri]) return state.uriSources[uri];
    if (fileName && state.uriSources[fileName]) return state.uriSources[fileName];
    if (String(uri || '').startsWith('scribd://')) return 'Scribd';
    if (String(uri || '').startsWith('webreader://')) return explicitSource || 'قراءة سحابية';
    const nt = typeof normBookText === 'function' ? normBookText(title || fileName || '') : '';
    if (nt && state.uriSources['t:' + nt]) return state.uriSources['t:' + nt];
    if (explicitSource && String(explicitSource).trim()) return String(explicitSource).trim();
    if (sourceKind === 'midad') return 'تحميلات مداد';
    return folder || 'ذاكرة الجهاز';
  }

  function recordReadingActivity(uri, title, label) {
    const now = Date.now();
    const rec = { lastReadAt: now, label: label || 'قيد القراءة • فُتح مؤخراً' };
    if (uri) state.readProgressMap[String(uri)] = rec;
    if (title && typeof normBookText === 'function') {
      const nt = normBookText(title);
      if (nt) state.readProgressMap['t:' + nt] = rec;
    }
    invalidateOwnedCache();
    saveJson('wq_read_progress', state.readProgressMap);
  }

  function openBookCopyInReader(uri, fileName, title, bookObj) {
    if (!uri) return;
    const isScUri = String(uri).startsWith('scribd://');
    const isWrUri = String(uri).startsWith('webreader://');
    recordReadingActivity(uri, title || fileName, isScUri ? 'قيد القراءة • Scribd' : (isWrUri ? 'قيد القراءة • أونلاين داخل مداد' : 'قيد القراءة • فُتح مؤخراً'));
    if (isScUri) {
      const docId = uri.slice(9).replace(/[^\d]/g, '');
      const bk = bookObj || state.cloudLibrary.find(c => String(c.uri) === String(uri)) || {
        id: 'scribd_' + docId,
        title: title || fileName || 'Scribd Document',
        source: 'Scribd',
        sourceId: 'scribd',
        format: 'pdf',
        url: 'https://www.scribd.com/document/' + docId,
        extra: { scribdId: docId },
      };
      openScribdInAppReader(bk, uri);
      return;
    }
    if (isWrUri) {
      const rawUrl = uri.slice(12);
      const bk = bookObj || state.cloudLibrary.find(c => String(c.uri) === String(uri)) || {
        id: 'wr_' + btoa(unescape(encodeURIComponent(rawUrl.slice(-30)))).replace(/[^a-z0-9]/gi, '').slice(0, 12),
        title: title || fileName || 'Comic',
        source: 'قراءة أونلاين',
        format: 'cbz',
        url: rawUrl,
      };
      openWebBookInAppReader(bk, rawUrl);
      return;
    }
    KTB.openInternalReader(uri, fileName || 'book.pdf', title || fileName || '');
    renderDownloads();
    refreshOwnedCardBadges();
  }

  function isComicsVisible() {
    return state.showComics !== false;
  }

  function getVisibleCategories(includeAll) {
    const showC = isComicsVisible();
    return (CATS.CATEGORIES || []).filter(c => {
      if (!includeAll && c.id === 'all') return false;
      if (!showC && c.id === 'comics_manga') return false;
      return true;
    });
  }

  function syncComicsSearchScopeVisibility() {
    const chip = document.querySelector('#searchScopeChips [data-scope="comics"], [data-scope="comics"]');
    if (chip) chip.classList.toggle('hidden', !isComicsVisible());
    if (!isComicsVisible() && state.searchScope === 'comics') {
      state.searchScope = 'all';
    }
  }

  function matchesPrefLang(b) {
    if (!b) return false;
    if (!isComicsVisible() && (b.isComic || b.cat === 'comics_manga')) return false;
    if (state.prefLang === 'ar') return b.lang === 'ar';
    if (state.prefLang === 'en') return b.lang !== 'ar';
    return true;
  }

  function getBookPagesNum(b) {
    if (!b) return 260;
    const raw = Number(String(b.pages || '').replace(/[^\d]/g, '')) || 0;
    if (raw > 0) return raw;
    if (REC && REC.enrichBook) return Number(REC.enrichBook(b).pages) || 260;
    return 260;
  }

  function interleaveByLengthMix(arr) {
    if (!Array.isArray(arr) || !arr.length) return arr || [];
    const pl = state.prefLength;
    if (pl !== 'short' && pl !== 'long') return arr;
    const isMatch = (b) => {
      const pg = getBookPagesNum(b);
      return pl === 'short' ? (pg < 250) : (pg >= 250);
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
  }

  function scorePrefLength(b) {
    if (!b || state.prefLength === 'all') return 0;
    const pages = getBookPagesNum(b);
    if (state.prefLength === 'short') return pages < 250 ? 22 : -14;
    if (state.prefLength === 'long') return pages >= 250 ? 18 : -12;
    return 0;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function coverColors(seed, cat, isAr) {
    if (isAr) {
      const catPalettes = {
        arabic_novels: [['#0e4f44', '#07221f'], ['#5b1b2b', '#260a12'], ['#14453d', '#091f23']],
        mystery_classics: [['#19284c', '#0b1024'], ['#2c2246', '#110d20']],
        psychology_habits: [['#0d474f', '#072028'], ['#1d3b5a', '#0c1b2e']],
        medicine_neuro: [['#0f5257', '#07262c'], ['#164458', '#0a1f2d']],
        marketing_strategy: [['#3c3318', '#1c1608'], ['#1c3e35', '#0c1f1a']],
        history_thought: [['#4d2c1b', '#24120a'], ['#352a1b', '#17110b']],
        languages_skills: [['#1e4234', '#0c1e17'], ['#23395b', '#0d1829']],
        tech_ai: [['#17324d', '#091626'], ['#1b434b', '#0b2025']],
        comics_manga: [['#4f1d34', '#1e0b16'], ['#1f3359', '#0c162b']],
        islamic_heritage: [['#0e4a38', '#051f18'], ['#3a3216', '#171408']],
        scifi_fantasy: [['#1d2452', '#0a0d24'], ['#341c4a', '#14091f']],
        science_cosmos: [['#0f3554', '#061526'], ['#163b4d', '#081822']],
        philosophy_wisdom: [['#3c2b21', '#1a120d'], ['#2c3047', '#11131e']],
        poetry_arts: [['#4d1f36', '#210b17'], ['#38284a', '#160f21']],
      };
      const choices = catPalettes[cat] || [['#0e4f44', '#082124'], ['#4a251d', '#1e0e0b'], ['#192a4c', '#0c1428']];
      let h = 0;
      const str = String(seed || 'book');
      for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
      return choices[Math.abs(h) % choices.length];
    }
    let h = 0;
    const str = String(seed || 'book');
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    const hue = Math.abs(h) % 360;
    return ['hsl(' + hue + ',44%,25%)', 'hsl(' + ((hue + 40) % 360) + ',34%,14%)'];
  }

  const COVER_CACHE_KEY = 'wq_cover_cache';
  let COVER_CACHE = {};
  try { COVER_CACHE = JSON.parse(localStorage.getItem(COVER_CACHE_KEY) || '{}') || {}; } catch (e) { COVER_CACHE = {}; }
  const LOCAL_PDF_COV_KEY = 'wq_local_cov_v1';
  let LOCAL_PDF_COVERS = {};
  try { LOCAL_PDF_COVERS = JSON.parse(localStorage.getItem(LOCAL_PDF_COV_KEY) || '{}') || {}; } catch (e) { LOCAL_PDF_COVERS = {}; }
  const DL_META_KEY = 'wq_dl_book_meta';
  let DL_META = {};
  try { DL_META = JSON.parse(localStorage.getItem(DL_META_KEY) || '{}') || {}; } catch (e) { DL_META = {}; }
  const COVER_MISS_KEY = 'wq_cover_miss_v1';
  let COVER_MISS;
  try {
    const arr = JSON.parse(localStorage.getItem(COVER_MISS_KEY) || '[]');
    COVER_MISS = new Set(Array.isArray(arr) ? arr : []);
  } catch (e) { COVER_MISS = new Set(); }
  try {
    if (localStorage.getItem('wq_cov_upgrade_v3') !== '1') {
      COVER_MISS.clear();
      localStorage.removeItem(COVER_MISS_KEY);
      for (const k of Object.keys(COVER_CACHE)) {
        const u = String(COVER_CACHE[k] || '');
        if (/telesco\.pe|nophoto|openlibrary\.org\/b\/isbn\/|-[SM]\.jpg/i.test(u)) {
          delete COVER_CACHE[k];
        } else if (/mzstatic\.com/i.test(u)) {
          COVER_CACHE[k] = u.replace(/\/\d+x\d+bb\./i, '/600x600bb.');
        } else if (/gr-assets\.com|goodreads\.com/i.test(u)) {
          COVER_CACHE[k] = u.replace(/\._S[XY]\d+_/i, '');
        }
      }
      localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(COVER_CACHE));
      localStorage.setItem('wq_cov_upgrade_v3', '1');
    }
  } catch (e) {}
  function saveCoverMiss(k) {
    if (!k) return;
    COVER_MISS.add(k);
    if (COVER_MISS.size > 260) {
      const keep = Array.from(COVER_MISS).slice(-200);
      COVER_MISS = new Set(keep);
    }
    try { localStorage.setItem(COVER_MISS_KEY, JSON.stringify(Array.from(COVER_MISS))); } catch (e) {}
  }
  function saveLocalPdfCovCache() {
    try {
      const entries = Object.entries(LOCAL_PDF_COVERS).filter(([, v]) => v && String(v).length < 130000);
      const trimmed = Object.fromEntries(entries.slice(-36));
      localStorage.setItem(LOCAL_PDF_COV_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }
  const CUSTOM_TITLES_KEY = 'wq_custom_titles_v1';
  let CUSTOM_TITLES = {};
  try { CUSTOM_TITLES = JSON.parse(localStorage.getItem(CUSTOM_TITLES_KEY) || '{}') || {}; } catch (e) { CUSTOM_TITLES = {}; }
  function getCustomBookTitle(uri, fileName, groupKey) {
    if (uri && CUSTOM_TITLES['u:' + uri]) return CUSTOM_TITLES['u:' + uri];
    if (groupKey && CUSTOM_TITLES['g:' + groupKey]) return CUSTOM_TITLES['g:' + groupKey];
    if (fileName && CUSTOM_TITLES['f:' + String(fileName).toLowerCase()]) return CUSTOM_TITLES['f:' + String(fileName).toLowerCase()];
    return '';
  }
  function setCustomBookTitle(g, newTitle) {
    const clean = String(newTitle || '').trim();
    if (!g) return;
    const setOrDel = (k) => {
      if (!k) return;
      if (clean) CUSTOM_TITLES[k] = clean;
      else delete CUSTOM_TITLES[k];
    };
    if (g.key) setOrDel('g:' + g.key);
    for (const v of (g.versions || [])) {
      if (v && v.uri) setOrDel('u:' + v.uri);
      if (v && v.fileName) setOrDel('f:' + String(v.fileName).toLowerCase());
    }
    try { localStorage.setItem(CUSTOM_TITLES_KEY, JSON.stringify(CUSTOM_TITLES)); } catch (e) {}
  }

  function saveDlBookMeta(book, uriOrId) {
    if (!book) return;
    const cov = safeBookCoverUrl(book);
    const auth = (S && S.cleanAuthorName) ? S.cleanAuthorName(book.author || '') : (book.author || '');
    const cleanAuth = (auth && auth !== 'مؤلف غير محدد') ? auth : '';
    if (!cov && !cleanAuth && !book.cat) return;
    const entry = { cover: cov || '', author: cleanAuth || '', cat: book.cat || '' };
    let dirty = false;
    const setK = (k) => {
      if (!k) return;
      const cur = DL_META[k] || {};
      const next = {
        cover: entry.cover || cur.cover || '',
        author: entry.author || cur.author || '',
        cat: entry.cat || cur.cat || '',
      };
      if (next.cover !== cur.cover || next.author !== cur.author || next.cat !== cur.cat) {
        DL_META[k] = next;
        dirty = true;
      }
    };
    if (uriOrId) setK(String(uriOrId));
    if (book.id) setK(String(book.id));
    if (book.localUri) setK(String(book.localUri));
    if (book.title) {
      const nt = (typeof normBookText === 'function') ? normBookText(book.title) : String(book.title).toLowerCase().trim();
      if (nt) setK('t:' + nt);
    }
    if (dirty) {
      const ks = Object.keys(DL_META);
      if (ks.length > 300) {
        const trim = {};
        for (const k of ks.slice(-240)) trim[k] = DL_META[k];
        DL_META = trim;
      }
      saveJson(DL_META_KEY, DL_META);
    }
  }

  function lookupDlBookMeta(uriOrId, fileName, title) {
    if (uriOrId && DL_META[uriOrId]) return DL_META[uriOrId];
    if (fileName && DL_META[fileName]) return DL_META[fileName];
    const nt = (typeof normBookText === 'function') ? normBookText(title || fileName || '') : '';
    if (nt && DL_META['t:' + nt]) return DL_META['t:' + nt];
    return null;
  }

  function saveCoverCache() {
    try {
      const keys = Object.keys(COVER_CACHE);
      if (keys.length > 420) {
        const trimmed = {};
        for (const k of keys.slice(-300)) trimmed[k] = COVER_CACHE[k];
        COVER_CACHE = trimmed;
      }
      localStorage.setItem(COVER_CACHE_KEY, JSON.stringify(COVER_CACHE));
    } catch (e) {}
  }

  function isSafeCoverForBook(b, cov) {
    if (!cov || /nophoto|no_cover|placeholder/i.test(cov)) return false;
    if (/^data:image\/(jpeg|png|webp);base64,/i.test(cov)) return true;
    // Block generic OpenLibrary ISBN fallbacks on Arabic books, while allowing verified Arabic editions (/b/id/)
    if (b && b.lang === 'ar' && /covers\.openlibrary\.org\/b\/isbn\//i.test(cov)) return false;
    return /^https?:\/\//i.test(cov);
  }

  function upgradeKnownCoverUrl(cov) {
    const s = String(cov || '').trim();
    if (!s) return '';
    if (S && typeof S.normalizeCoverUrl === 'function') return S.normalizeCoverUrl(s);
    return s
      .replace(/\/\d+x\d+bb\./i, '/600x600bb.')
      .replace(/(\/books\/\d+i\/\d+)\._S[XY]\d+_/i, '$1');
  }

  function safeBookCoverUrl(b) {
    if (!b) return '';
    const direct = b.cover ? upgradeKnownCoverUrl(b.cover) : '';
    if (isSafeCoverForBook(b, direct)) {
      if (direct !== b.cover) b.cover = direct;
      return direct;
    }
    const cached = b.id && COVER_CACHE[b.id] ? upgradeKnownCoverUrl(COVER_CACHE[b.id]) : '';
    if (isSafeCoverForBook(b, cached)) {
      b.cover = cached;
      return cached;
    }
    if (b.id && LOCAL_PDF_COVERS[b.id]) return LOCAL_PDF_COVERS[b.id];
    return '';
  }

  const brokenCovRetried = new Set();

  window.__midadImgErr = function (img) {
    if (!img) return;
    const isDetail = img.id === 'detailCovImg';
    const card = !isDetail ? img.closest('.bcard') : null;
    const bookId = isDetail
      ? (state.currentModalBook && state.currentModalBook.id)
      : (card && card.dataset && card.dataset.bookId);
    const parent = img.parentElement;
    if (parent) parent.classList.remove('has-cover-img');
    img.remove();
    const book = bookId ? (BOOK_MAP.get(bookId) || (isDetail ? state.currentModalBook : null)) : null;
    if (!book || brokenCovRetried.has(book.id)) return;
    if (!isDetail && (state.tab === 'downloads' || COVER_MISS.has(book.id))) return;
    brokenCovRetried.add(book.id);
    book.cover = '';
    if (COVER_CACHE[book.id]) {
      delete COVER_CACHE[book.id];
      saveCoverCache();
    }
    if (isDetail) COVER_MISS.delete(book.id);
    if (S && typeof S.resolveBookCover === 'function') {
      S.resolveBookCover(book, { force: isDetail, priority: isDetail ? 'high' : 'low' }).then(url => {
        if (!isSafeCoverForBook(book, url)) {
          if (!isDetail) rememberCoverMiss(book.id);
          return;
        }
        book.cover = url;
        COVER_CACHE[book.id] = url;
        saveCoverCache();
        applyCoverToCardDom(book.id, url);
        if (isDetail && state.currentModalBook && state.currentModalBook.id === book.id && $('detailCovFallback')) {
          let dImg = $('detailCovImg');
          if (!dImg) {
            dImg = document.createElement('img');
            dImg.id = 'detailCovImg';
            dImg.alt = '';
            dImg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s';
            dImg.onload = function () { window.__midadImgLoad(this); };
            dImg.onerror = function () { this.remove(); };
            $('detailCovFallback').appendChild(dImg);
          }
          dImg.src = url;
        }
      }).catch(() => {});
    }
  };

  window.__midadImgLoad = function (img) {
    if (!img || img.naturalWidth < 60 || img.naturalHeight < 60) {
      window.__midadImgErr(img);
      return;
    }
    // Reject Internet Archive's generic temple notfound placeholder images (320x220 / 160x110)
    if (/archive\.org/i.test(img.src || '')
        && ((img.naturalWidth === 320 && img.naturalHeight === 220)
            || (img.naturalWidth === 160 && img.naturalHeight === 110))) {
      window.__midadImgErr(img);
      return;
    }
    const ratio = img.naturalHeight > 0 ? (img.naturalWidth / img.naturalHeight) : 0.75;
    img.classList.toggle('cov-full', ratio > 0.45 && ratio <= 1.15);
    img.style.opacity = '1';
    if (img.parentElement) img.parentElement.classList.add('has-cover-img');
  };

  const CAT_SEAL_MAP = {
    mystery_classics: 'غموض وكلاسيك',
    psychology_habits: 'علم النفس',
    medicine_neuro: 'الطب والأعصاب',
    marketing_strategy: 'تسويق ومال',
    arabic_novels: 'أدب ورواية',
    languages_skills: 'لغات ومهارات',
    history_thought: 'تاريخ وفكر',
    tech_ai: 'تقنية وذكاء',
  };

  function coverInnerHtml(b) {
    const isAr = b && (b.lang === 'ar' || /[\u0600-\u06FF]/.test(b.title || ''));
    if (!isAr) {
      return '<strong>' + esc(b.title) + '</strong><span>' + esc(b.author) + '</span>';
    }
    const arTitle = String(b.title || '').split('—')[0].trim() || b.title;
    const cleanAuth = S.cleanAuthorName(b.author || '');
    const seal = CAT_SEAL_MAP[b.cat] || 'مداد العربية';
    return '<div class="ar-cov-top">' + SVG.arabesque + '<span class="ar-cov-seal">' + esc(seal) + '</span></div>'
      + '<strong class="ar-cov-title">' + esc(arTitle) + '</strong>'
      + '<div class="ar-cov-foot"><span class="ar-cov-rule"></span><span class="ar-cov-author">' + esc(cleanAuth) + '</span></div>';
  }

  function registerBook(b) {
    if (!b) return null;
    const prev = b.id ? BOOK_MAP.get(b.id) : null;
    const nb = S.normBook(b);
    if (b.desc && !nb.summary) nb.summary = b.desc;
    if (Array.isArray(b.tags)) nb.tags = b.tags;
    if (b.cat) nb.cat = b.cat;
    if (b.query) nb.query = b.query;
    const lu = b.localUri || (prev && prev.localUri);
    if (lu) nb.localUri = lu;
    const fn = b.fileName || (prev && prev.fileName);
    if (fn) nb.fileName = fn;
    const mv = Array.isArray(b._mergedVariants) ? b._mergedVariants : (prev && Array.isArray(prev._mergedVariants) ? prev._mergedVariants : null);
    if (mv) nb._mergedVariants = mv;
    const vc = Number(b._variantCount || (prev && prev._variantCount) || 0);
    if (vc > 1) nb._variantCount = vc;
    const sn = Array.isArray(b._sourceNames) ? b._sourceNames : (prev && Array.isArray(prev._sourceNames) ? prev._sourceNames : null);
    if (sn) nb._sourceNames = sn;
    if (b._relScore != null) nb._relScore = b._relScore;
    if (b._isAltEdition) nb._isAltEdition = true;
    if (b.subCat) nb.subCat = b.subCat;
    if (Array.isArray(b.microTags)) nb.microTags = b.microTags;
    if (b.tone) nb.tone = b.tone;
    if (b.toneLabel) nb.toneLabel = b.toneLabel;
    if (b.pages) nb.pages = b.pages;
    if (b.avgMinutes) nb.avgMinutes = b.avgMinutes;
    if (b.fame != null) nb.fame = b.fame;
    if (b._recReason) nb._recReason = b._recReason;
    if (b._recSector) nb._recSector = b._recSector;
    if (REC && REC.enrichBook) REC.enrichBook(nb);
    BOOK_MAP.set(nb.id, nb);
    return nb;
  }

  function isLiked(id) {
    return state.liked.some(x => x.id === id);
  }

  function isBookmarked(id) {
    return state.bookmarks.some(x => x.id === id);
  }

  // ------------------------------------------------------------------ Collapsible Sidebar & Theme
  function applySidebar() {
    $('appShell').classList.toggle('rail-hidden', !!state.sidebarHidden);
  }

  function toggleSidebar() {
    state.sidebarHidden = !state.sidebarHidden;
    localStorage.setItem('wq_rail_hidden', state.sidebarHidden ? '1' : '0');
    applySidebar();
    if (KTB.haptic) KTB.haptic('tick');
  }

  function applyVisualPrefs() {
    const root = document.documentElement;
    if (!root) return;
    const validAccents = ['emerald', 'amber', 'sapphire', 'violet'];
    const acc = validAccents.includes(state.prefAccent) ? state.prefAccent : 'emerald';
    state.prefAccent = acc;
    root.dataset.accent = acc;
    root.dataset.motion = state.motionMode === 'reduced' ? 'reduced' : 'premium';
    root.dataset.density = state.gridDensity === 'dense' ? 'dense' : 'normal';
    if (KTB.setHapticsEnabled) KTB.setHapticsEnabled(state.hapticsEnabled !== false);
  }

  let _themeAnimTimer = null;
  function updateThemeToggleGlyph(t) {
    const btn = $('btnTheme');
    if (!btn) return;
    const svgMap = {
      dark: '<svg class="ic" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      sepia: '<svg class="ic" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="13" cy="9" r="2.2"/></svg>',
      light: '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
    };
    btn.innerHTML = svgMap[t] || svgMap.dark;
  }

  function playThemeTransitionFx(prevTheme) {
    const btn = $('btnTheme');
    if (btn) {
      btn.classList.remove('theme-spin');
      void btn.offsetWidth;
      btn.classList.add('theme-spin');
    }
    const wave = $('themeTransitionWave');
    if (wave && state.motionMode !== 'reduced') {
      const oldBg = prevTheme === 'light' ? '#f4f7f6' : (prevTheme === 'sepia' ? '#f4ebd8' : '#141517');
      wave.style.backgroundColor = oldBg;
      wave.classList.remove('go');
      void wave.offsetWidth;
      wave.classList.add('go');
      clearTimeout(_themeAnimTimer);
      _themeAnimTimer = setTimeout(() => wave.classList.remove('go'), 240);
    }
  }

  function applyTheme(t, animateFlag) {
    const prev = state.theme;
    state.theme = t;
    if (prev && prev !== t && animateFlag !== false) {
      playThemeTransitionFx(prev);
    }
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('wq_theme', t);
    updateThemeToggleGlyph(t);
    if (KTB.setSystemBars) {
      const bgHex = t === 'light' ? '#f6f7fa' : (t === 'sepia' ? '#f3ebd8' : '#141517');
      KTB.setSystemBars(bgHex, t !== 'dark');
    }
  }

  function cycleTheme(ev) {
    const order = ['dark', 'sepia', 'light'];
    const next = order[(order.indexOf(state.theme) + 1) % order.length];
    applyTheme(next, ev !== false);
    if (KTB.haptic) KTB.haptic('light');
    const names = { dark: 'المظهر الداكن المريح', sepia: 'وضع الورق الدافئ', light: 'المظهر الفاتح' };
    KTB.toast(names[next]);
  }

  // ------------------------------------------------------------------ Navigation & Android Back
  let _lastTabRenderedSig = {};
  let _downloadsDirty = false;
  let _lastTelemetrySig = '';
  let _splashDismissed = false;
  let _pendingColdStart = false;

  function dismissLaunchSplash(immediate) {
    if (_splashDismissed) return;
    _splashDismissed = true;
    const fill = $('splashBarFill');
    if (fill) fill.style.width = '100%';
    const sp = $('appSplash');
    const finishAfter = () => {
      if (_pendingColdStart) {
        _pendingColdStart = false;
        openColdStartWizard();
      }
    };
    if (!sp) {
      finishAfter();
      return;
    }
    const hideNow = () => {
      sp.classList.add('done');
      finishAfter();
      setTimeout(() => { try { sp.remove(); } catch (_) {} }, 170);
    };
    if (immediate) hideNow();
    else setTimeout(hideNow, 40);
  }

  function switchTab(tab) {
    const changed = state.tab !== tab;
    state.tab = tab;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + tab));
    const topBarEl = document.querySelector('.top-bar');
    if (topBarEl) topBarEl.classList.remove('top-bar-hidden');
    if (changed && KTB.haptic) KTB.haptic('tick');
    if (tab === 'saved') {
      const sig = state.liked.length + '|' + state.bookmarks.length + '|' + (state.savedSub || '');
      if (_lastTabRenderedSig.saved !== sig) {
        _lastTabRenderedSig.saved = sig;
        renderSaved();
      }
    }
    if (tab === 'downloads') {
      _downloadsDirty = false;
      renderDownloads();
      const now = Date.now();
      if (KTB.isAndroid() && KTB.scanDeviceBooks && (now - _lastAutoScanAt > 25000)) {
        _lastAutoScanAt = now;
        requestAnimationFrame(() => setTimeout(() => KTB.scanDeviceBooks(), 120));
      }
    }
    if (tab === 'home' || tab === 'discover' || tab === 'search') {
      if (covQueue.length) setTimeout(pumpCovQueue, 40);
    }
    if (tab === 'discover') {
      const catEl = $('catCards');
      if (!catEl || !catEl.children.length) renderDiscover();
    }
    if (tab === 'audiobooks') {
      renderAudiobooks();
    }
  }

  KTB.openTab = switchTab;
  KTB.back = () => {
    const srm = $('scribdReaderModal');
    if (srm && !srm.classList.contains('hidden')) {
      if (typeof closeScribdReaderModal === 'function') closeScribdReaderModal();
      else srm.classList.add('hidden');
      if (KTB.haptic) KTB.haptic('tick');
      return true;
    }
    for (const mid of ['audiobookModal', 'tasteProfileModal', 'aboutModal', 'coldStartModal', 'renameBookModal', 'libBookActionsModal', 'libFolderModal', 'bookDeleteModal', 'pickCopyModal', 'confirmModal', 'authorModal', 'bookModal', 'settingsModal']) {
      const m = $(mid);
      if (m && !m.classList.contains('hidden')) {
        if (mid === 'coldStartModal') {
          try { localStorage.setItem('wq_cold_start_v2', '1'); } catch (_) { }
        } else if (mid === 'bookModal') {
          if (state._detailDwellTimer) { clearTimeout(state._detailDwellTimer); state._detailDwellTimer = null; }
          state.modalGen = (state.modalGen || 0) + 1;
          state.currentModalBook = null;
          state.currentModalLinks = [];
          if (KTB.abortHttp) KTB.abortHttp();
        }
        m.classList.add('hidden');
        if (KTB.haptic) KTB.haptic('tick');
        return true;
      }
    }
    if (state.tab !== 'home') {
      switchTab('home');
      return true;
    }
    return false;
  };

  // ------------------------------------------------------------------ Book Card Builder (Delegated Events + Fast Render)
  function cardHtml(raw, staggerIdx) {
    const b = registerBook(raw);
    const isAr = b.lang === 'ar' || /[\u0600-\u06FF]/.test(b.title || '');
    const [c1, c2] = coverColors(b.title, b.cat, isAr);
    const covUrl = safeBookCoverUrl(b);
    const liked = isLiked(b.id);
    const covHtml =
      '<div class="bcover-fallback' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + '">'
      + coverInnerHtml(b) + '</div>'
      + (covUrl
        ? '<img src="' + esc(covUrl) + '" alt="" loading="lazy" decoding="async" style="position:absolute;inset:0;opacity:0;transition:opacity .18s" onload="window.__midadImgLoad(this)" onerror="window.__midadImgErr(this)">'
        : '');

    const hasAuthor = b.author && b.author !== 'مؤلف غير محدد';
    const authorHtml = hasAuthor
      ? '<button type="button" class="bauthor-btn" data-author="' + esc(b.author) + '">' + esc(b.author) + '</button>'
      : '<span class="bauthor-btn" style="cursor:default">' + esc(b.author) + '</span>';

    const ownCount = findDownloadedMatches(b).length;
    const footStatus = ownCount > 1
      ? ('<button type="button" class="bfoot-owned" data-quick-read="' + esc(b.id) + '">' + ownCount + ' نسخ محملة</button>')
      : (ownCount === 1
        ? ('<button type="button" class="bfoot-owned" data-quick-read="' + esc(b.id) + '">محمل • جاهز</button>')
        : ('<button type="button" class="bcard-dl-btn" data-quick-dl="' + esc(b.id) + '" title="تحميل مباشر بضغطة واحدة">' + SVG.download + '<span>تحميل</span></button>'));

    const needCovAttr = (!covUrl && !COVER_MISS.has(b.id)) ? ' data-cov-needed="1"' : '';
    const vCount = Number(b._variantCount || 1);
    const vBadgeHtml = vCount > 1
      ? '<span class="bcard-variants-badge">' + vCount + ' مصادر: ' + esc((b._sourceNames || []).slice(0, 2).join(' + ')) + '</span>'
      : '';
    const recReason = (raw && raw._recReason) || b._recReason || '';
    const recSector = (raw && raw._recSector) || b._recSector || 'personal';
    const recReasonHtml = recReason
      ? '<div class="bcard-reason ' + esc(recSector) + '" title="' + esc(recReason) + '">' + esc(recReason) + '</div>'
      : '';
    const useStagger = typeof staggerIdx === 'number' && staggerIdx >= 0 && staggerIdx < 8;
    return '<article class="bcard' + (useStagger ? ' card-stagger' : '') + '" data-book-id="' + esc(b.id) + '"' + (useStagger ? (' style="--idx:' + staggerIdx + '"') : '') + '>'
      + '<div class="bcover"' + needCovAttr + '>'
      + covHtml
      + vBadgeHtml
      + '<button type="button" class="bcard-like ' + (liked ? 'on' : '') + '" data-like-id="' + esc(b.id) + '" title="أعجبني — اقترح مشابه">'
      + (liked ? SVG.heartFill : SVG.heart)
      + '</button>'
      + '</div>'
      + '<div class="bmeta">'
      + '<div class="btitle">' + esc(b.title) + '</div>'
      + authorHtml
      + recReasonHtml
      + '<div class="bfoot"><span>' + (b.year ? esc(b.year) : (b.lang === 'ar' ? 'عربي' : 'EN')) + '</span>' + footStatus + '</div>'
      + '</div></article>';
  }

  // Lazy Viewport Real-Cover Hydrator (max 2 concurrent HTTP lookups for visible un-covered cards)
  const covQueue = [];
  const covPendingIds = new Set();
  let covWorkers = 0;

  function applyCoverToCardDom(bookId, url) {
    if (!bookId || !url) return;
    document.querySelectorAll('.bcard[data-book-id="' + CSS.escape(bookId) + '"] .bcover').forEach(slot => {
      slot.removeAttribute('data-cov-needed');
      if (slot.querySelector('img')) return;
      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.style.cssText = 'position:absolute;inset:0;opacity:0;transition:opacity .2s';
      img.onload = function () { window.__midadImgLoad(this); };
      img.onerror = function () { window.__midadImgErr(this); };
      img.src = url;
      const overlayEl = slot.querySelector('.bcard-variants-badge, .bcard-like');
      if (overlayEl) slot.insertBefore(img, overlayEl);
      else slot.appendChild(img);
    });
  }

  function pumpCovQueue() {
    if (!S || typeof S.resolveBookCover !== 'function') return;
    if (state.tab === 'downloads') return;
    while (covWorkers < 4 && covQueue.length) {
      const bookId = covQueue.shift();
      const b = BOOK_MAP.get(bookId);
      if (!b || safeBookCoverUrl(b) || COVER_MISS.has(bookId) || !document.querySelector('.bcard[data-book-id="' + CSS.escape(bookId) + '"]')) {
        covPendingIds.delete(bookId);
        continue;
      }
      covWorkers++;
      S.resolveBookCover(b).then(url => {
        if (isSafeCoverForBook(b, url)) {
          b.cover = url;
          COVER_CACHE[b.id] = url;
          saveCoverCache();
          applyCoverToCardDom(b.id, url);
        } else {
          rememberCoverMiss(b.id);
        }
      }).catch(() => {}).finally(() => {
        covWorkers--;
        covPendingIds.delete(bookId);
        pumpCovQueue();
      });
    }
  }

  const covObserver = (typeof IntersectionObserver !== 'undefined')
    ? new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const slot = en.target;
        covObserver.unobserve(slot);
        const card = slot.closest('.bcard');
        const id = card && card.dataset.bookId;
        if (!id || covPendingIds.has(id) || COVER_MISS.has(id)) continue;
        const b = BOOK_MAP.get(id);
        if (!b || safeBookCoverUrl(b)) continue;
        covPendingIds.add(id);
        covQueue.push(id);
      }
      pumpCovQueue();
    }, { rootMargin: '240px' })
    : null;

  function observeLazyCovers(container) {
    if (!covObserver || !container) return;
    container.querySelectorAll('.bcover[data-cov-needed="1"]').forEach(el => covObserver.observe(el));
  }

  function skeletonCardsHtml(count) {
    let html = '';
    for (let i = 0; i < (count || 8); i++) {
      html += '<div class="bcard-skel" aria-hidden="true">'
        + '<div class="skel-cov"></div>'
        + '<div style="padding:10px;display:flex;flex-direction:column;gap:7px">'
        + '<div class="skel-line w75"></div>'
        + '<div class="skel-line w50"></div>'
        + '</div></div>';
    }
    return html;
  }

  function syncAllLikeButtonsForBook(bookId) {
    if (!bookId) return;
    const nowLiked = isLiked(bookId);
    document.querySelectorAll('[data-like-id="' + CSS.escape(bookId) + '"]').forEach(btn => {
      btn.classList.toggle('on', nowLiked);
      btn.innerHTML = nowLiked ? SVG.heartFill : SVG.heart;
    });
    if ($('modalLike') && state.currentModalBook && state.currentModalBook.id === bookId) {
      $('modalLike').classList.toggle('like-on', nowLiked);
    }
  }

  function renderCards(container, books) {
    if (!container) return;
    const gen = (container._renderGen = (container._renderGen || 0) + 1);
    if (!books || !books.length) {
      container.innerHTML = '';
      return;
    }
    const CHUNK = 20;
    if (books.length <= CHUNK) {
      container.innerHTML = books.map((b, i) => cardHtml(b, i)).join('');
      observeLazyCovers(container);
      return;
    }
    container.innerHTML = books.slice(0, CHUNK).map((b, i) => cardHtml(b, i)).join('');
    observeLazyCovers(container);
    let idx = CHUNK;
    const step = () => {
      if (container._renderGen !== gen || !container.isConnected) return;
      const slice = books.slice(idx, idx + CHUNK);
      if (slice.length) {
        appendCards(container, slice);
        idx += CHUNK;
        if (idx < books.length) requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  function appendCards(container, newBooks) {
    if (!container || !newBooks || !newBooks.length) return;
    const tpl = document.createElement('template');
    tpl.innerHTML = newBooks.map(b => cardHtml(b, -1)).join('');
    const added = Array.from(tpl.content.querySelectorAll('.bcover[data-cov-needed="1"]'));
    container.appendChild(tpl.content);
    if (covObserver) added.forEach(el => covObserver.observe(el));
  }

  // Global Event Delegation for ALL book cards, Like hearts, and Author links (ultra-fast!)
  document.addEventListener('click', (e) => {
    const likeBtn = e.target.closest('[data-like-id]');
    if (likeBtn) {
      e.stopPropagation();
      const book = BOOK_MAP.get(likeBtn.dataset.likeId);
      if (book) toggleLike(book);
      return;
    }
    const quickDlBtn = e.target.closest('[data-quick-dl]');
    if (quickDlBtn) {
      e.stopPropagation();
      const book = BOOK_MAP.get(quickDlBtn.dataset.quickDl);
      if (book) quickDownloadBook(book, quickDlBtn);
      return;
    }
    const quickReadBtn = e.target.closest('[data-quick-read]');
    if (quickReadBtn) {
      e.stopPropagation();
      const book = BOOK_MAP.get(quickReadBtn.dataset.quickRead);
      if (book) openReadOrPickCopy(book);
      return;
    }
    const authBtn = e.target.closest('[data-author]');
    if (authBtn) {
      e.stopPropagation();
      const authorName = authBtn.dataset.author;
      if (authorName) openAuthorHub(authorName);
      return;
    }
    const card = e.target.closest('.bcard[data-book-id]');
    if (card) {
      const book = BOOK_MAP.get(card.dataset.bookId);
      if (book) openBookDetail(book);
    }
  });

  // ------------------------------------------------------------------ Taste Engine & Like Recommendations
  function recordTaste(book, weight) {
    if (!book) return;
    const w = weight || 1;
    if (book.cat) {
      state.taste.cats[book.cat] = (state.taste.cats[book.cat] || 0) + w;
    }
    const ca = S.cleanAuthorName(book.author);
    if (ca && ca !== 'مؤلف غير محدد') {
      state.taste.authors[ca] = (state.taste.authors[ca] || 0) + w;
    }
    (book.tags || []).forEach(tg => {
      const k = String(tg).toLowerCase();
      state.taste.tags[k] = (state.taste.tags[k] || 0) + w * 0.8;
    });
    saveJson('wq_taste', state.taste);
  }

  const FAMOUS_AUTHORS_RE = /نجيب محفوظ|أجاثا كريستي|دوستويفسكي|أحمد خالد توفيق|محمد طه|طه حسين|ابن خلدون|غسان كنفاني|جبران|علي الوردي|مصطفى محمود|فيكتور فرانكل|جيمس كلير|روبرت غرين|كانيمان|رضوى عاشور|يوسف زيدان|سعود السنعوسي|أورويل|ستيفن كوفي|ديورانت|بيغوفيتش|الكواكبي|ألكسندر دوما|كافكا|كامو|أحمد مراد|يوسف الحسني|Sherlock|Agatha|Dostoevsky|Clear|Frankl|Netter|Guyton|Gray|Drake/i;

  function scoreBookFame(b) {
    if (!b) return 0;
    let sc = Number(b.fame || 0) * 0.4;
    if (String(b.id || '').startsWith('cur_')) sc += 35;
    if (FAMOUS_AUTHORS_RE.test((b.author || '') + ' ' + (b.title || ''))) sc += 30;
    if (safeBookCoverUrl(b)) sc += 60;
    if ((b.desc || b.summary || '').length > 25) sc += 10;
    if (b.dlUrl) sc += 8;
    return sc;
  }

  function tasteJitter(b, seed) {
    if (!seed || !b) return 0;
    const key = String(b.id || b.title || '');
    let h = seed * 2654435761;
    for (let i = 0; i < key.length; i++) {
      h = ((h << 5) - h + key.charCodeAt(i)) | 0;
    }
    return ((h >>> 0) % 15);
  }

  function scoreBookByTaste(b) {
    let sc = 0;
    if (b.cat && Array.isArray(state.prefCats) && state.prefCats.includes(b.cat)) sc += 6.0;
    if (b.cat && state.taste.cats[b.cat]) sc += state.taste.cats[b.cat] * 1.4;
    const ca = S.cleanAuthorName(b.author);
    if (ca && state.taste.authors[ca]) sc += state.taste.authors[ca] * 1.8;
    (b.tags || []).forEach(tg => {
      const w = state.taste.tags[String(tg).toLowerCase()];
      if (w) sc += w;
    });
    return sc;
  }

  function buildOwnedKeysSet() {
    const owned = new Set();
    if (!REC) return owned;
    const addTitle = (t) => {
      const k = REC.canonicalBookKey(t);
      if (k) owned.add(k);
    };
    (state.downloads || []).forEach(d => { if (d && d.status === 'done') addTitle(d.title || d.fileName); });
    (state.localBooks || []).forEach(l => { if (l) addTitle(l.title || l.fileName); });
    (state.deviceBooks || []).forEach(dv => { if (dv) addTitle(dv.title || dv.fileName); });
    (state.cloudLibrary || []).forEach(c => { if (c) addTitle(c.title); });
    return owned;
  }

  function getFullUniversePool() {
    const extraCatLive = Object.values(state.liveCache.catLive || {}).flat();
    return [...CATS.CURATED, ...state.liveCache.trending, ...state.liveCache.homeGrid, ...state.liveCache.ar, ...state.liveCache.en, ...extraCatLive];
  }

  function syncTelemetryAndSignals() {
    try {
      const latest = KTB.getReaderTelemetry ? KTB.getReaderTelemetry() : null;
      if (latest && typeof latest === 'object' && Object.keys(latest).length) {
        state.readerTelemetry = Object.assign({}, state.readerTelemetry || {}, latest);
      }
      if (HABIT && HABIT.syncFromTelemetry) {
        HABIT.syncFromTelemetry(state.readerTelemetry || {});
      }
      if (!REC) return false;
      return REC.ingestReaderTelemetry(state.readerTelemetry || {}, getFullUniversePool());
    } catch (_) {
      return false;
    }
  }

  function getHomeFeedAllocations(force) {
    if (!REC) return null;
    if (!force && state._lastHomeAlloc) return state._lastHomeAlloc;
    state._lastHomeAlloc = REC.buildHomeAllocations({
      pool: getFullUniversePool(),
      ownedKeys: buildOwnedKeysSet(),
      telemetryMap: state.readerTelemetry || {},
      likedBooks: state.liked || [],
      bookmarks: state.bookmarks || [],
      baseTasteSeed: state.taste || CATS.TABLET_TASTE_SEED,
      prefCats: state.prefCats || [],
      timeMode: state.recTimeMode || 'auto',
      rotation: state.tasteRotation || 0,
      prefLength: state.prefLength || 'all',
      matchesPref: matchesPrefLang,
      fameFn: scoreBookFame,
    });
    return state._lastHomeAlloc;
  }

  function refreshRecommendationShelves(opts) {
    const o = opts || {};
    state._lastHomeAlloc = null;
    renderHero();
    renderCompanionWidget();
    renderHomeGrid();
    renderTrendingShelf();
    if (state.tab === 'discover') renderDiscover();
    if (state.currentModalBook && !$('bookModal').classList.contains('hidden')) {
      renderDetailSimilar(state.currentModalBook);
    }
    if (o.recordImpressions && REC && state._lastHomeAlloc) {
      const shown = [
        ...(state._lastHomeAlloc.personal70 || []).slice(0, 12),
        ...(state._lastHomeAlloc.horizon20 || []).slice(0, 6),
        ...(state._lastHomeAlloc.explore10 || []).slice(0, 4),
      ];
      REC.recordImpressions(shown, Date.now(), { force: !!o.forceImpressions });
    }
  }

  function toggleLike(book) {
    if (!book) return;
    if (KTB.haptic) KTB.haptic('light');
    const idx = state.liked.findIndex(x => x && (x.id === book.id || (book.localUri && x.localUri && x.localUri === book.localUri)));
    let nowLiked = false;
    let reg = book;
    if (idx >= 0) {
      const removed = state.liked.splice(idx, 1)[0];
      if (removed && removed.id && removed.id !== book.id) syncAllLikeButtonsForBook(removed.id);
      if (REC) REC.syncFavoriteSignal(book, false);
      KTB.toast('أُزيل من المفضلة');
    } else {
      reg = registerBook(book) || book;
      state.liked.unshift(reg);
      state.liked = state.liked.slice(0, 120);
      recordTaste(reg, 4);
      if (REC) REC.syncFavoriteSignal(reg, true);
      nowLiked = true;
      KTB.toast('تمت الإضافة إلى المفضلة — تظهر في صفحة المفضلة (+8 لإشارات الذوق)');
    }
    saveJson('wq_liked', state.liked);
    syncAllLikeButtonsForBook(book.id);
    state._lastHomeAlloc = null;
    renderHero();
    renderLikedSimilarShelf();
    renderPersonalShelf();
    renderHorizonShelf();
    renderTrendingShelf();
    if (state.homeCat === 'all') renderHomeGrid();
    renderSaved();
    if (state.tab === 'downloads') renderDownloads();
    if (state.tab === 'discover') renderDiscover();
    return nowLiked;
  }

  function getSimilarFromPool(seedBook) {
    const rawPool = [...CATS.CURATED, ...state.liveCache.ar, ...state.liveCache.en, ...BOOK_MAP.values()];
    const pool = [];
    const seenIds = new Set();
    for (const raw of rawPool) {
      if (!raw) continue;
      const bid = raw.id || (raw.title ? slug(raw.title) : '');
      if (bid && seenIds.has(bid)) continue;
      if (bid) seenIds.add(bid);
      pool.push(raw);
    }
    if (REC && REC.getSimilarBooks) {
      const alloc = getHomeFeedAllocations(false);
      const res = REC.getSimilarBooks(seedBook, pool, {
        limit: 8,
        ownedKeys: buildOwnedKeysSet(),
        profile: alloc ? alloc.profile : null,
        excludeOwned: false,
      });
      if (res.length) {
        return res.map(x => Object.assign({}, x.book, { _recReason: x.reason, _recSector: 'personal' }));
      }
    }
    const ranked = [];
    for (const raw of pool) {
      const nb = registerBook(raw);
      const sc = S.scoreSimilar(seedBook, nb);
      if (sc > 0) ranked.push({ sc, book: nb });
    }
    ranked.sort((a, b) => b.sc - a.sc);
    return ranked.slice(0, 8).map(x => x.book);
  }

  function renderLikedSimilarShelf() {
    const wrap = $('likedSimilarWrap');
    const shelf = $('likedSimilarShelf');
    if (!state.liked.length) {
      wrap.classList.add('hidden');
      return;
    }
    const anchor = state.liked[0];
    $('likedSimilarTitle').textContent = 'مشابه لكتاب أعجبك: ' + anchor.title.slice(0, 38);
    const matches = getSimilarFromPool(anchor);
    if (!matches.length) {
      wrap.classList.add('hidden');
      return;
    }
    wrap.classList.remove('hidden');
    renderCards(shelf, matches);
  }

  function renderTimeCtxBar(timeCtx) {
    const bar = $('timeCtxBar');
    if (!bar) return;
    bar.querySelectorAll('[data-tmode]').forEach(btn => {
      const active = (state.recTimeMode || 'auto') === btn.dataset.tmode;
      btn.classList.toggle('on', active);
    });
    bar.title = timeCtx ? timeCtx.label : '';
  }

  function renderPersonalShelf() {
    if (state.homeMixFilter === 'personal' && state.homeCat === 'all') {
      renderHomeGrid();
    } else if (typeof renderHomeSmartMeta === 'function') {
      renderHomeSmartMeta(getHomeFeedAllocations(false));
    }
  }

  function renderHorizonShelf() {
    if (state.homeMixFilter === 'horizon' && state.homeCat === 'all') {
      renderHomeGrid();
    } else if (typeof renderHomeSmartMeta === 'function') {
      renderHomeSmartMeta(getHomeFeedAllocations(false));
    }
  }

  function toggleBookmark(book) {
    if (KTB.haptic) KTB.haptic('light');
    const idx = state.bookmarks.findIndex(x => x.id === book.id);
    if (idx >= 0) {
      state.bookmarks.splice(idx, 1);
      if (REC) REC.removeSignalsByDedupe('quote:' + REC.canonicalBookKey(book));
      KTB.toast('أُزيل من المحفوظة');
    } else {
      state.bookmarks.unshift(book);
      state.bookmarks = state.bookmarks.slice(0, 100);
      if (REC) REC.recordSignal(book, 'quote');
      KTB.toast('تم حفظ الكتاب وعلامة القراءة (+4 للترشيحات)');
    }
    saveJson('wq_bookmarks', state.bookmarks);
    state._lastHomeAlloc = null;
    if (state.tab === 'saved') renderSaved();
  }

  function pushHistory(book) {
    recordTaste(book, 1);
    state.history = [book, ...state.history.filter(x => x.id !== book.id)].slice(0, 60);
    saveJson('wq_history', state.history);
  }

  function resolveTelemetryForBook(book, telemetryMap) {
    if (!book || !telemetryMap) return null;
    const nt = typeof normBookText === 'function' ? normBookText(book.title || '') : '';
    const uriCandidates = new Set([book.localUri, book.uri].filter(Boolean).map(String));
    const matches = findDownloadedMatches(book);
    for (const m of matches) {
      if (m && m.uri) uriCandidates.add(String(m.uri));
    }
    let best = null;
    for (const [k, raw] of Object.entries(telemetryMap)) {
      if (!raw || typeof raw !== 'object') continue;
      const hitUri = uriCandidates.has(String(k)) || (raw.uri && uriCandidates.has(String(raw.uri)));
      const rawNt = typeof normBookText === 'function' ? normBookText(raw.title || '') : '';
      const hitTitle = nt && rawNt && (rawNt === nt || rawNt.includes(nt) || nt.includes(rawNt));
      if (hitUri || hitTitle) {
        if (!best || Number(raw.lastReadAt || 0) >= Number(best.lastReadAt || 0)) best = raw;
      }
    }
    return best;
  }

  function isValidDisplayBook(b) {
    if (S && typeof S.isGenuineBookItem === 'function') return S.isGenuineBookItem(b);
    if (!b || !b.title) return false;
    const t = String(b.title).trim();
    if (t.length < 2) return false;
    if (/^(بدون عنوان|untitled|document|book|unknown|null|undefined|pdf|epub)$/i.test(t)) return false;
    return true;
  }

  function findBookInPoolByTitleOrKey(rawEntry) {
    if (!rawEntry) return null;
    const pool = getFullUniversePool().filter(isValidDisplayBook);
    const nt = typeof normBookText === 'function' ? normBookText(rawEntry.title || '') : '';
    const rk = rawEntry.bookKey ? String(rawEntry.bookKey).toLowerCase() : '';
    for (const b of pool) {
      if (rk && String(b.id || '').toLowerCase() === rk) return b;
      const bNt = typeof normBookText === 'function' ? normBookText(b.title || '') : '';
      if (nt && bNt && (bNt === nt || bNt.includes(nt) || nt.includes(bNt))) return b;
    }
    return null;
  }

  function getContinueReadingContext(alloc) {
    const telMap = state.readerTelemetry || {};
    const entries = Object.entries(telMap).map(([k, v]) => Object.assign({ _k: k }, v || {}))
      .filter(v => {
        if (!(v.title || v.bookKey || v.page > 0 || v.maxPage > 0)) return false;
        if (getCustomBookTitle(v._k, v.fileName, '')) return true;
        if (v.title && S && typeof S.isGenuineBookItem === 'function' && !S.isGenuineBookItem({ title: v.title, format: 'pdf' })) return false;
        return true;
      })
      .sort((a, b) => Number(b.lastReadAt || 0) - Number(a.lastReadAt || 0));

    let chosenTel = null;
    for (const e of entries) {
      const rp = Number(e.maxPct != null ? e.maxPct : e.pct) || 0;
      const pctNorm = rp > 1 ? rp : rp * 100;
      if (pctNorm < 97) { chosenTel = e; break; }
    }
    if (!chosenTel && entries.length) chosenTel = entries[0];

    let ownedFallbackBook = null;
    let ownedCopy = null;
    if (!chosenTel) {
      const pool = getFullUniversePool().filter(isValidDisplayBook);
      let bestTs = -1;
      for (const b of pool) {
        const ms = findDownloadedMatches(b);
        if (ms.length && ms[0].hasReadProgress && Number(ms[0].lastReadAt || 0) >= bestTs) {
          bestTs = Number(ms[0].lastReadAt || 0);
          ownedFallbackBook = b;
          ownedCopy = ms[0];
        }
      }
    }

    let currentBook = null;
    let page = 0;
    let totalPages = 0;
    let pct = 0;
    let hasActiveRead = false;

    if (chosenTel) {
      hasActiveRead = true;
      const matched = findBookInPoolByTitleOrKey(chosenTel);
      const validTitle = chosenTel.title && !/^(بدون عنوان|untitled|document|unknown|null|undefined)$/i.test(String(chosenTel.title).trim());
      const cleanTelTitle = validTitle && S && typeof S.cleanDisplayBookTitle === 'function'
        ? S.cleanDisplayBookTitle(chosenTel.title, chosenTel.author)
        : chosenTel.title;
      const dlMeta = lookupDlBookMeta(chosenTel._k, chosenTel.fileName, cleanTelTitle || '');
      const localCov = (dlMeta && dlMeta.cover) || LOCAL_PDF_COVERS[chosenTel._k] || COVER_CACHE[chosenTel.bookKey || ''] || '';
      currentBook = matched || registerBook({
        id: chosenTel.bookKey || ('read_' + Math.abs(chosenTel._k.length * 997)),
        title: validTitle ? (cleanTelTitle || chosenTel.title) : ((dlMeta && dlMeta.title) || 'كتابك الحالي'),
        author: chosenTel.author || (dlMeta && dlMeta.author) || 'من قراءاتك الحالية',
        cat: chosenTel.cat || (dlMeta && dlMeta.cat) || 'selfdev',
        pages: Number(chosenTel.totalPages || 220),
        cover: localCov,
        lang: (dlMeta && dlMeta.lang) || (/[\u0600-\u06FF]/.test(chosenTel.title || '') ? 'ar' : 'en'),
        desc: 'كتاب تتابعه حالياً في قارئ مداد — واصل من الصفحة التي توقفت عندها.',
        localUri: /^content:\/\/|^file:\/\//i.test(chosenTel._k) ? chosenTel._k : '',
        fileName: chosenTel.fileName || '',
      });
      if (currentBook && !safeBookCoverUrl(currentBook) && currentBook.localUri && KTB.extractPdfCoverAsync) {
        KTB.extractPdfCoverAsync(currentBook.id, currentBook.localUri, currentBook.fileName || '', currentBook.title || '');
      }
      page = Math.max(1, Number(chosenTel.page || chosenTel.maxPage || 1));
      totalPages = Math.max(page, Number(chosenTel.totalPages || (currentBook && currentBook.pages) || 200));
      const rp = Number(chosenTel.pct != null ? chosenTel.pct : (chosenTel.maxPct != null ? chosenTel.maxPct : 0));
      pct = rp > 1 ? Math.round(rp) : (rp > 0 ? Math.round(rp * 100) : Math.round((page / Math.max(1, totalPages)) * 100));
      pct = Math.max(2, Math.min(100, pct));
    } else if (ownedFallbackBook) {
      hasActiveRead = true;
      currentBook = ownedFallbackBook;
      totalPages = Math.max(1, Number(currentBook.pages || 200));
      const lblMatch = String((ownedCopy && ownedCopy.progressLabel) || '').match(/(\d+)/);
      pct = lblMatch ? Math.min(99, Math.max(5, Number(lblMatch[1]))) : 24;
      page = Math.max(1, Math.round((pct / 100) * totalPages));
    } else {
      const filtered = CATS.CURATED.filter(b => isValidDisplayBook(b) && matchesPrefLang(b));
      const base = filtered.length ? filtered : CATS.CURATED.filter(isValidDisplayBook);
      currentBook = (alloc && isValidDisplayBook(alloc.heroBook) && alloc.heroBook) || base[0];
      totalPages = Math.max(1, Number((currentBook && currentBook.pages) || 220));
      page = 0;
      pct = 0;
    }

    const enrichedCurrent = (REC && REC.enrichBook ? REC.enrichBook(currentBook) : currentBook);
    const curId = enrichedCurrent && enrichedCurrent.id;
    const curNt = typeof normBookText === 'function' ? normBookText((enrichedCurrent && enrichedCurrent.title) || '') : '';
    const isNotCur = b => isValidDisplayBook(b) && b.id !== curId && (!curNt || (typeof normBookText === 'function' ? normBookText(b.title) !== curNt : true));
    const curatedValid = CATS.CURATED.filter(b => isNotCur(b) && matchesPrefLang(b));
    const pool = getFullUniversePool().filter(b => isNotCur(b) && matchesPrefLang(b));

    let nextBook = null;
    if (REC && REC.getSimilarBooks && enrichedCurrent) {
      const sims = REC.getSimilarBooks(enrichedCurrent, curatedValid.length >= 6 ? curatedValid : pool, { limit: 6 }).filter(isNotCur);
      if (sims && sims.length) nextBook = sims[0];
    }
    if (!nextBook && alloc) {
      const pList = [...(alloc.personal70 || []), ...(alloc.horizon20 || []), ...(alloc.explore10 || [])].filter(isNotCur);
      nextBook = pList.find(matchesPrefLang) || pList[0] || null;
    }
    if (!nextBook) nextBook = curatedValid[0] || pool[0] || CATS.CURATED.find(isNotCur) || null;

    return {
      hasActiveRead,
      currentBook: enrichedCurrent,
      nextBook: nextBook && REC && REC.enrichBook ? REC.enrichBook(nextBook) : nextBook,
      page,
      totalPages,
      pct,
      remainingPages: Math.max(0, totalPages - page),
      hook: HABIT && HABIT.getPositiveMotivationHook ? HABIT.getPositiveMotivationHook(enrichedCurrent, pct) : null,
      ownedCopy: ownedCopy || (enrichedCurrent ? findDownloadedMatches(enrichedCurrent)[0] || null : null),
      chosenTelUri: (chosenTel && chosenTel._k) ? String(chosenTel._k) : '',
      chosenTelFileName: (chosenTel && chosenTel.fileName) ? String(chosenTel.fileName) : '',
    };
  }

  let _autoOpenedOnBoot = false;
  let _awaitingAutoOpenDevice = false;

  function openContinueTargetBook(ctx) {
    const c = ctx || getContinueReadingContext(getHomeFeedAllocations(false));
    if (!c || !c.currentBook) return false;
    const matches = findDownloadedMatches(c.currentBook);
    if (matches.length) {
      if (c.chosenTelUri) {
        const exact = matches.find(m => m && String(m.uri) === String(c.chosenTelUri));
        if (exact) {
          openBookCopyInReader(exact.uri, exact.fileName, c.currentBook.title, c.currentBook);
          return true;
        }
      }
      openReadOrPickCopy(c.currentBook);
      return true;
    }
    const directUri = (c.chosenTelUri && /^(content:\/\/|file:\/\/|scribd:\/\/)/i.test(c.chosenTelUri))
      ? c.chosenTelUri
      : (c.currentBook.localUri && /^(content:\/\/|file:\/\/|scribd:\/\/)/i.test(c.currentBook.localUri) ? c.currentBook.localUri : '');
    if (directUri) {
      openBookCopyInReader(directUri, c.chosenTelFileName || c.currentBook.fileName || '', c.currentBook.title || '', c.currentBook);
      return true;
    }
    openBookDetail(c.currentBook);
    return true;
  }

  function findMostRecentProgressEntry() {
    const map = state.readProgressMap || {};
    let best = null;
    for (const [k, rec] of Object.entries(map)) {
      if (!rec || !/^(content:\/\/|file:\/\/|scribd:\/\/)/i.test(k)) continue;
      const ts = Number(rec.lastReadAt || 0);
      if (!best || ts >= best.lastReadAt) {
        best = { uri: k, lastReadAt: ts };
      }
    }
    return best;
  }

  function tryAutoOpenLastBookOnBoot(fromDeviceScan) {
    if (_autoOpenedOnBoot || !state.autoOpenLastBook) return false;
    // Do not interrupt if user already opened a modal manually
    if (state.currentModalBook || ($('scribdReaderModal') && !$('scribdReaderModal').classList.contains('hidden'))) {
      _autoOpenedOnBoot = true;
      _awaitingAutoOpenDevice = false;
      return false;
    }
    const ctx = getContinueReadingContext(getHomeFeedAllocations(false));
    const recentProg = findMostRecentProgressEntry();
    const ctxTs = ctx && ctx.hasActiveRead
      ? Number((ctx.ownedCopy && ctx.ownedCopy.lastReadAt) || (ctx.chosenTelUri && state.readerTelemetry && state.readerTelemetry[ctx.chosenTelUri] && state.readerTelemetry[ctx.chosenTelUri].lastReadAt) || 0)
      : 0;
    if (recentProg && (!ctx || !ctx.hasActiveRead || recentProg.lastReadAt > ctxTs)) {
      _autoOpenedOnBoot = true;
      _awaitingAutoOpenDevice = false;
      openBookCopyInReader(recentProg.uri, '', '');
      return true;
    }
    if (ctx && ctx.hasActiveRead && ctx.currentBook) {
      const matches = findDownloadedMatches(ctx.currentBook);
      const hasDirectUri = Boolean(
        (ctx.chosenTelUri && /^(content:\/\/|file:\/\/|scribd:\/\/)/i.test(ctx.chosenTelUri))
        || (ctx.currentBook.localUri && /^(content:\/\/|file:\/\/|scribd:\/\/)/i.test(ctx.currentBook.localUri))
      );
      if (matches.length || hasDirectUri) {
        _autoOpenedOnBoot = true;
        _awaitingAutoOpenDevice = false;
        return openContinueTargetBook(ctx);
      }
      if (!fromDeviceScan && KTB.isAndroid() && KTB.scanDeviceBooks) {
        _awaitingAutoOpenDevice = true;
        return false;
      }
      _autoOpenedOnBoot = true;
      _awaitingAutoOpenDevice = false;
      openBookDetail(ctx.currentBook);
      return true;
    }
    return false;
  }

  function setHeroFocusMode(mode) {
    const valid = (mode === 'continue_next' || mode === 'discovery') ? mode : 'continue_only';
    state.heroFocusMode = valid;
    state.showContinueHero = valid !== 'discovery';
    localStorage.setItem('wq_hero_focus_mode', valid);
    localStorage.setItem('wq_show_continue_hero', valid === 'discovery' ? '0' : '1');
  }

  function syncTopStreakBadge(evState) {
    const pill = $('btnTopStreak');
    const cnt = $('topStreakCount');
    const ev = evState || (HABIT && HABIT.evaluateState ? HABIT.evaluateState() : null);
    if (!pill || !ev) return;
    if (cnt) cnt.textContent = String(ev.streak || 0);
    pill.classList.remove('mood-eager', 'mood-angry', 'mood-frozen', 'mood-completed');
    pill.classList.add('mood-' + (ev.mood || 'eager'));
    pill.title = 'مهمة اليوم: ' + (ev.pagesToday || 0) + '/' + (ev.dailyGoalPages || 15) + ' ص — سلسلة ' + (ev.streak || 0) + ' يوم';
  }

  function renderCompanionWidget() {
    const host = $('homeCompanionHost');
    if (!HABIT) return;
    const ev = HABIT.evaluateState();
    syncTopStreakBadge(ev);
    if (!host) return;
    const ctx = getContinueReadingContext(getHomeFeedAllocations(false));
    const goalOptions = [5, 10, 15, 20, 30];
    const presetsHtml = goalOptions.map(g =>
      '<button type="button" class="comp-goal-pill' + (ev.dailyGoalPages === g ? ' on' : '') + '" data-goal-pages="' + g + '">' + g + ' ص</button>'
    ).join('');
    const moodBtns = [
      { id: 'auto', label: 'تلقائي' },
      { id: 'eager', label: 'متحمس' },
      { id: 'angry', label: 'غاضب' },
      { id: 'frozen', label: 'متجمد' },
      { id: 'completed', label: 'منجز' },
    ].map(m =>
      '<button type="button" class="comp-mood-chip' + (ev.previewMood === m.id ? ' on' : '') + '" data-mood-preview="' + m.id + '">' + m.label + '</button>'
    ).join('');

    const freezeHtml = (ev.mood === 'frozen' && ev.freezesAvailable > 0)
      ? '<button type="button" id="btnThawWithFreeze" class="btn emerald sm comp-thaw-btn">' + SVG.snowflake + '<span>ذوّب الجليد (' + ev.freezesAvailable + ')</span></button>'
      : '<span class="comp-freeze-pill" title="دروع حماية السلسلة">' + SVG.snowflake + '<span>' + ev.freezesAvailable + ' درع</span></span>';

    const taskNote = ev.mood === 'completed'
      ? 'تم إنجاز هدف اليوم'
      : (ev.mood === 'frozen'
        ? ('تجمّدت أمس — اقرأ ' + ev.thawRemaining + ' ص')
        : ('متبقي ' + ev.remainingPages + ' ص • ' + ev.reminderTimeStr));

    host.innerHTML = ''
      + '<section class="companion-card compact mood-' + esc(ev.mood) + (state.habitConfigOpen ? ' config-open' : '') + '" id="homeCompanionCard" data-mood="' + esc(ev.mood) + '">'
      + '<div class="comp-top-bar">'
      + '<span class="comp-mood-badge mood-' + esc(ev.mood) + '" id="compMoodBadge">' + esc(ev.badgeLabel) + '</span>'
      + '<div class="comp-top-chips">'
      + '<span class="comp-streak-pill" id="compStreakPill">' + SVG.flame + '<strong>' + ev.streak + '</strong><span>يوم</span></span>'
      + freezeHtml
      + '<button type="button" class="icon-btn sm comp-gear-btn" id="btnToggleHabitConfig" aria-label="ضبط مهمة القراءة" title="ضبط هدف الصفحات والتذكير">' + SVG.sliders + '</button>'
      + '</div></div>'
      + '<div class="comp-hero-row">'
      + '<button type="button" class="comp-mascot-btn" id="btnCompanionMascot" title="اضغط للتفاعل مع رفيق مداد">' + HABIT.getMascotSvg(ev.mood) + '</button>'
      + '<div class="comp-speech-col">'
      + '<div class="comp-quip-bubble" id="compQuipText">' + esc(ev.quip) + '</div>'
      + '<div class="comp-task-box">'
      + '<div class="comp-task-head"><span>مهمة اليوم</span><strong id="compTaskCounter">' + ev.pagesToday + ' / ' + ev.dailyGoalPages + ' (' + ev.progressPct + '%)</strong></div>'
      + '<div class="comp-prog-track"><div class="comp-prog-fill" style="width:' + ev.progressPct + '%"></div></div>'
      + '<div class="comp-task-sub" id="compTaskNote">' + esc(taskNote) + '</div>'
      + '</div></div></div>'
      + '<div class="comp-actions-row">'
      + '<button type="button" class="btn glass sm" id="btnLogPage1">' + SVG.check + '<span>+1 ص</span></button>'
      + '<button type="button" class="btn emerald sm" id="btnLogPage5">' + SVG.flame + '<span>+5 صفحات</span></button>'
      + '</div>'
      + '<div class="comp-config-drawer' + (state.habitConfigOpen ? '' : ' hidden') + '" id="compConfigDrawer">'
      + '<div class="comp-cfg-grp"><span class="comp-cfg-lbl">هدف الصفحات اليومي:</span><div class="comp-goal-pills">' + presetsHtml
      + '<input type="number" id="compGoalCustomInput" class="comp-num-inp" min="3" max="300" value="' + ev.dailyGoalPages + '" aria-label="عدد صفحات مخصص"/>'
      + '<button type="button" class="btn glass sm" id="btnSaveCustomGoal">حفظ</button></div></div>'
      + '<div class="comp-cfg-grp comp-cfg-row"><label class="comp-cfg-lbl" for="compReminderTime">' + SVG.bell + '<span>التذكير:</span></label>'
      + '<input type="time" id="compReminderTime" class="comp-time-inp" value="' + esc(ev.reminderTimeStr) + '"/>'
      + '<button type="button" class="btn glass sm' + (ev.notificationsEnabled ? ' on' : '') + '" id="btnToggleHabitNotif">' + (ev.notificationsEnabled ? 'مفعّل' : 'متوقف') + '</button>'
      + '<button type="button" class="btn glass sm" id="btnTestHabitNotif">اختبار</button></div>'
      + '<div class="comp-cfg-grp"><span class="comp-cfg-lbl">معاينة تفاعل الرفيق:</span><div class="comp-preview-row">' + moodBtns + '</div></div>'
      + '</div></section>';

    const bookStub = (ctx && ctx.currentBook) ? {
      id: ctx.currentBook.id,
      title: ctx.currentBook.title,
      author: ctx.currentBook.author,
      page: ctx.page || 1,
      totalPages: ctx.totalPages || ctx.currentBook.pages || 200,
    } : null;

    if ($('btnCompanionMascot')) {
      $('btnCompanionMascot').onclick = () => {
        const nextEv = HABIT.cycleMascotQuip();
        renderCompanionWidget();
        KTB.toast(nextEv.badgeLabel + ': ' + nextEv.quip);
      };
    }
    if ($('btnToggleHabitConfig')) {
      $('btnToggleHabitConfig').onclick = () => {
        state.habitConfigOpen = !state.habitConfigOpen;
        renderCompanionWidget();
      };
    }
    if ($('btnLogPage1')) {
      $('btnLogPage1').onclick = () => {
        const nextEv = HABIT.logPagesRead(1, bookStub);
        if (KTB.haptic) KTB.haptic('light');
        renderHero();
        renderCompanionWidget();
        KTB.toast(nextEv.mood === 'completed' ? 'أحسنت! أتممت هدف القراءة اليومي' : ('تم تسجيل صفحة • الإجمالي اليوم ' + nextEv.pagesToday + '/' + nextEv.dailyGoalPages));
      };
    }
    if ($('btnLogPage5')) {
      $('btnLogPage5').onclick = () => {
        const nextEv = HABIT.logPagesRead(5, bookStub);
        if (KTB.haptic) KTB.haptic('medium');
        renderHero();
        renderCompanionWidget();
        KTB.toast(nextEv.mood === 'completed' ? 'أنجزت مهمة اليوم بالكامل! سلسلتك الآن ' + nextEv.streak + ' يوم' : ('أضفت 5 صفحات • متبقي ' + nextEv.remainingPages + ' صفحة'));
      };
    }
    if ($('btnThawWithFreeze')) {
      $('btnThawWithFreeze').onclick = () => {
        if (HABIT.activateFreezeShield()) {
          renderCompanionWidget();
          KTB.toast('تم تفعيل درع التجميد وذوبان الجليد — سلسلتك آمنة!');
        }
      };
    }
    host.querySelectorAll('[data-goal-pages]').forEach(btn => {
      btn.onclick = () => {
        HABIT.updateConfig({ dailyGoalPages: Number(btn.dataset.goalPages) });
        renderCompanionWidget();
        KTB.toast('تم تحديد هدف القراءة اليومي: ' + btn.dataset.goalPages + ' صفحة');
      };
    });
    if ($('btnSaveCustomGoal') && $('compGoalCustomInput')) {
      $('btnSaveCustomGoal').onclick = () => {
        const v = Math.max(3, Math.min(300, Number($('compGoalCustomInput').value) || 15));
        HABIT.updateConfig({ dailyGoalPages: v });
        renderCompanionWidget();
        KTB.toast('تم حفظ هدف الصفحات اليومي: ' + v + ' صفحة');
      };
    }
    if ($('compReminderTime')) {
      $('compReminderTime').onchange = (e) => {
        HABIT.updateConfig({ reminderTime: e.target.value || '20:00' });
        renderCompanionWidget();
        KTB.toast('سيصلك إشعار مهمة القراءة يومياً الساعة ' + (e.target.value || '20:00'));
      };
    }
    if ($('btnToggleHabitNotif')) {
      $('btnToggleHabitNotif').onclick = () => {
        const cur = HABIT.evaluateState();
        const nextOn = !cur.notificationsEnabled;
        HABIT.updateConfig({ notificationsEnabled: nextOn });
        if (nextOn && KTB.requestNotificationPermission) KTB.requestNotificationPermission();
        renderCompanionWidget();
        KTB.toast(nextOn ? 'تم تفعيل تذكير القراءة اليومي' : 'تم إيقاف تذكير القراءة');
      };
    }
    if ($('btnTestHabitNotif')) {
      $('btnTestHabitNotif').onclick = () => {
        if (KTB.requestNotificationPermission) KTB.requestNotificationPermission();
        if (KTB.testReadingNotification && KTB.isNative) {
          KTB.testReadingNotification();
        }
        KTB.toast('إشعار مهمة اليوم: اقرأ ' + HABIT.evaluateState().dailyGoalPages + ' صفحة لتحافظ على سلسلتك');
      };
    }
    host.querySelectorAll('[data-mood-preview]').forEach(btn => {
      btn.onclick = () => {
        const mode = btn.dataset.moodPreview;
        HABIT.simulateMoodScenario(mode === 'auto' ? 'reset' : mode);
        renderCompanionWidget();
      };
    });
  }

  // ------------------------------------------------------------------ Home Boot & Shelves
  function resolveCoverAsyncForElem(book, targetCovEl) {
    if (!book || !targetCovEl) return;
    targetCovEl.dataset.coverBookId = book.id || '';
    if (safeBookCoverUrl(book)) return;
    if (book.localUri && KTB.extractPdfCoverAsync && (/\.pdf$/i.test(book.fileName || book.localUri) || !book.fileName)) {
      KTB.extractPdfCoverAsync(book.id, book.localUri, book.fileName || '', book.title || '');
    }
    if (!S || typeof S.resolveBookCover !== 'function') return;
    S.resolveBookCover(book).then(url => {
      if (!isSafeCoverForBook(book, url)) return;
      book.cover = url;
      COVER_CACHE[book.id] = url;
      saveCoverCache();
      if (targetCovEl && targetCovEl.isConnected && !targetCovEl.querySelector('img')) {
        const img = document.createElement('img');
        img.alt = '';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .2s';
        img.onload = function () { window.__midadImgLoad(this); };
        img.onerror = function () { this.remove(); };
        img.src = url;
        targetCovEl.appendChild(img);
      }
    }).catch(() => {});
  }

  function applyCoverToLibGroupDom(groupKey, url, gridEl) {
    if (!url || !groupKey) return;
    const scope = gridEl || $('libGroupedGrid') || document;
    const cards = scope.querySelectorAll('[data-lib-group]');
    for (const card of cards) {
      if (card.dataset.libGroup !== groupKey) continue;
      const host = card.querySelector('.lib-thumb, .lib-compact-cover');
      if (!host) continue;
      let img = host.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        img.alt = '';
        img.style.cssText = 'opacity:0;transition:opacity .15s';
        img.onload = function () { window.__midadImgLoad(this); };
        img.onerror = function () { this.remove(); };
        host.appendChild(img);
      }
      if (img.src !== url) img.src = url;
    }
  }

  function hydrateLibraryCovers(groups, gridEl) {
    if (!Array.isArray(groups) || !groups.length) return;
    let pdfQueue = 0;
    let webQueue = 0;
    for (const g of groups) {
      if (!g || g.cover) continue;
      const ver = (g.versions && g.versions[0]) || {};
      if (ver.uri && KTB.extractPdfCoverAsync && !LOCAL_PDF_COVERS[ver.uri] && pdfQueue < 14
          && (/\.pdf$/i.test(ver.fileName || ver.uri) || !ver.isCloudOnly)) {
        pdfQueue++;
        KTB.extractPdfCoverAsync(g.key, ver.uri, ver.fileName || '', g.title || '');
      }
      if (S && typeof S.resolveBookCover === 'function' && g.title && !COVER_MISS.has(g.key) && webQueue < 10) {
        const cleanTitle = (S.cleanDisplayBookTitle ? S.cleanDisplayBookTitle(g.title, g.author) : g.title).trim();
        if (cleanTitle.length < 3) continue;
        webQueue++;
        const stub = {
          id: g.key,
          title: cleanTitle,
          author: g.author || '',
          lang: g.lang || (/[\u0600-\u06FF]/.test(cleanTitle) ? 'ar' : 'en'),
          cat: g.cat || '',
          localUri: ver.uri || '',
        };
        S.resolveBookCover(stub).then(url => {
          if (!url || !isSafeCoverForBook(stub, url)) {
            saveCoverMiss(g.key);
            return;
          }
          g.cover = url;
          COVER_CACHE[g.key] = url;
          saveCoverCache();
          stub.cover = url;
          saveDlBookMeta(stub, ver.uri || ver.downloadId || g.key);
          applyCoverToLibGroupDom(g.key, url, gridEl);
        }).catch(() => { saveCoverMiss(g.key); });
      }
    }
  }

  function renderHero() {
    const heroEl = $('heroCarousel');
    const nextHost = $('heroNextHost');
    const subRow = $('homeLeadSubrow');
    if (!heroEl) return;
    const alloc = getHomeFeedAllocations(false);
    const filtered = CATS.CURATED.filter(b => isValidDisplayBook(b) && matchesPrefLang(b));
    const base = filtered.length ? filtered : CATS.CURATED.filter(isValidDisplayBook);
    const focusMode = state.heroFocusMode || (state.showContinueHero !== false ? 'continue_only' : 'discovery');

    if (focusMode === 'discovery') {
      if (nextHost) {
        nextHost.innerHTML = '';
        nextHost.classList.add('hidden');
      }
      if (subRow) {
        subRow.classList.add('no-next', 'hidden');
      }
      const pickRaw = (alloc && isValidDisplayBook(alloc.heroBook) && alloc.heroBook) || base[0];
      const pick = registerBook(pickRaw);
      const isAr = pick.lang === 'ar' || /[\u0600-\u06FF]/.test(pick.title || '');
      const [c1, c2] = coverColors(pick.title, pick.cat, isAr);
      const covUrl = safeBookCoverUrl(pick);
      const liked = isLiked(pick.id);
      const cov =
        '<div class="hero-cover hero-main-cov' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + ';position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:6px;text-align:center;font-weight:800;font-size:11px;background:linear-gradient(140deg,' + c1 + ',' + c2 + ')">'
        + (isAr ? coverInnerHtml(pick) : ('<span>' + esc(pick.title) + '</span>'))
        + (covUrl
          ? '<img src="' + esc(covUrl) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">'
          : '')
        + '</div>';
      const metaLine = [pick.subCat, pick.toneLabel, pick.readTimeLabel].filter(Boolean).join(' • ');
      const kickerText = pick._recReason
        ? ('مُرشّح الآن • ' + pick._recReason)
        : ('مُرشّح على ذوقك' + (alloc && alloc.timeCtx ? (' • ' + alloc.timeCtx.badge) : ''));

      heroEl.dataset.heroMode = 'discovery';
      heroEl.dataset.heroSubmode = 'discovery';
      heroEl.classList.add('hero-continue-card');
      heroEl.innerHTML = '<div class="hero-main-spotlight compact">'
        + cov
        + '<div class="hero-meta">'
        + '<div class="hero-kicker-row">'
        + '<div class="hero-kicker">' + SVG.sparkle + '<span>' + esc(kickerText) + '</span></div>'
        + '<button type="button" id="btnToggleContinueOption" class="hero-opt-toggle" title="متابعة آخر كتاب فقط">' + SVG.sliders + '</button>'
        + '</div>'
        + '<h1 class="hero-title">' + esc(pick.title) + '</h1>'
        + (metaLine ? '<p class="hero-sub-line">' + esc(metaLine) + '</p>' : '')
        + '<div class="hero-btns">'
        + '<button id="heroOpenBtn" class="btn emerald sm hero-continue-cta">' + SVG.bookOpen + '<span>تصفح وتحميل</span></button>'
        + '<button id="heroLikeBtn" class="btn ' + (liked ? 'like' : 'glass') + ' sm hero-like-icon-btn" title="' + (liked ? 'في المفضلة' : 'أعجبني') + '" aria-label="أعجبني">' + (liked ? SVG.heartFill : SVG.heart) + '</button>'
        + (pick.author ? '<button id="heroAuthorBtn" class="btn glass sm hero-author-chip">' + SVG.user + '<span>' + esc(S.cleanAuthorName(pick.author)) + '</span></button>' : '')
        + '</div></div></div>';

      $('heroOpenBtn').onclick = () => openBookDetail(pick);
      const discCovEl = heroEl.querySelector('.hero-cover');
      if (discCovEl) {
        discCovEl.style.cursor = 'pointer';
        discCovEl.onclick = () => openBookDetail(pick);
      }
      $('heroLikeBtn').onclick = () => { toggleLike(pick); renderHero(); };
      if ($('heroAuthorBtn')) $('heroAuthorBtn').onclick = () => openAuthorHub(pick.author);
      if ($('btnToggleContinueOption')) {
        $('btnToggleContinueOption').onclick = () => {
          setHeroFocusMode('continue_only');
          renderHero();
          KTB.toast('تم تفعيل واجهة متابعة آخر كتاب فقط');
        };
      }
      resolveCoverAsyncForElem(pick, heroEl.querySelector('.hero-cover'));
      return;
    }

    const ctx = getContinueReadingContext(alloc);
    const pick = registerBook(ctx.currentBook || base[0]);
    const isAr = pick.lang === 'ar' || /[\u0600-\u06FF]/.test(pick.title || '');
    const [c1, c2] = coverColors(pick.title, pick.cat, isAr);
    const covUrl = safeBookCoverUrl(pick);
    const liked = isLiked(pick.id);
    const cov =
      '<div class="hero-cover hero-main-cov' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + ';position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:6px;text-align:center;font-weight:800;font-size:11px;background:linear-gradient(140deg,' + c1 + ',' + c2 + ')">'
      + (isAr ? coverInnerHtml(pick) : ('<span>' + esc(pick.title) + '</span>'))
      + (covUrl
        ? '<img src="' + esc(covUrl) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">'
        : '')
      + '</div>';

    const metaLine = [S.cleanAuthorName(pick.author || ''), pick.subCat, pick.readTimeLabel].filter(Boolean).join(' • ');
    const kickerText = ctx.hasActiveRead
      ? ('متابعة آخر كتاب • ' + ctx.pct + '%')
      : ('ابدأ قراءتك الآن');

    const progressHtml = ctx.hasActiveRead
      ? '<div class="hero-prog-wrap">'
        + '<div class="hero-prog-head"><span>ص ' + ctx.page + ' / ' + ctx.totalPages + '</span><strong>متبقي ' + ctx.remainingPages + ' ص</strong></div>'
        + '<div class="hero-prog-track"><div class="hero-prog-fill" style="width:' + ctx.pct + '%"></div></div>'
        + '</div>'
      : (metaLine ? '<p class="hero-sub-line">' + esc(metaLine) + '</p>' : '<p class="hero-sub-line">' + esc(pick.desc || pick.summary) + '</p>');

    const authorBtnHtml = pick.author
      ? '<button id="heroAuthorBtn" class="btn glass sm hero-author-chip">' + SVG.user + '<span>' + esc(S.cleanAuthorName(pick.author)) + '</span></button>'
      : '';

    const primaryActionHtml = ctx.hasActiveRead
      ? '<button id="heroContinueBtn" class="btn emerald sm hero-continue-cta">' + SVG.bookOpen + '<span>متابعة القراءة</span></button>'
        + '<button id="heroOpenBtn" class="btn glass sm"><span>التفاصيل</span></button>'
      : '<button id="heroOpenBtn" class="btn emerald sm hero-continue-cta">' + SVG.bookOpen + '<span>قراءة وتحميل</span></button>';

    heroEl.dataset.heroMode = 'continue';
    heroEl.dataset.heroSubmode = focusMode;
    heroEl.classList.add('hero-continue-card');
    heroEl.innerHTML =
      '<div class="hero-main-spotlight compact">'
      + cov
      + '<div class="hero-meta">'
      + '<div class="hero-kicker-row">'
      + '<div class="hero-kicker' + (ctx.hasActiveRead ? ' resume' : '') + '">' + (ctx.hasActiveRead ? SVG.flame : SVG.bookOpen) + '<span>' + esc(kickerText) + '</span></div>'
      + '<button type="button" id="btnToggleContinueOption" class="hero-opt-toggle on" title="تبديل وضع المقدمة" aria-label="تبديل وضع المقدمة">' + SVG.sliders + '</button>'
      + '</div>'
      + '<h1 class="hero-title">' + esc(pick.title) + '</h1>'
      + progressHtml
      + '<div class="hero-btns">'
      + primaryActionHtml
      + '<button id="heroLikeBtn" class="btn ' + (liked ? 'like' : 'glass') + ' sm hero-like-icon-btn" title="' + (liked ? 'في المفضلة' : 'أعجبني') + '" aria-label="أعجبني">' + (liked ? SVG.heartFill : SVG.heart) + '</button>'
      + authorBtnHtml
      + '</div></div></div>';

    if ($('heroContinueBtn')) $('heroContinueBtn').onclick = () => openContinueTargetBook(ctx);
    if ($('heroOpenBtn')) $('heroOpenBtn').onclick = () => openBookDetail(pick);
    const mainCovEl = heroEl.querySelector('.hero-main-cov');
    if (mainCovEl) {
      mainCovEl.style.cursor = 'pointer';
      mainCovEl.title = ctx.hasActiveRead ? 'متابعة القراءة الآن' : 'فتح الكتاب';
      mainCovEl.onclick = () => (ctx.hasActiveRead ? openContinueTargetBook(ctx) : openBookDetail(pick));
    }
    if ($('heroLikeBtn')) $('heroLikeBtn').onclick = () => { toggleLike(pick); renderHero(); };
    if ($('heroAuthorBtn')) $('heroAuthorBtn').onclick = () => openAuthorHub(pick.author);
    if ($('btnToggleContinueOption')) {
      $('btnToggleContinueOption').onclick = () => {
        setHeroFocusMode('discovery');
        renderHero();
        KTB.toast('تم التبديل إلى واجهة الاكتشاف (يمكنك إعادتها لمتابعة آخر كتاب من الإعدادات)');
      };
    }

    resolveCoverAsyncForElem(pick, heroEl.querySelector('.hero-main-cov'));

    const showNext = focusMode === 'continue_next' && ctx.nextBook;
    const nb = showNext ? registerBook(ctx.nextBook) : null;
    if (nextHost) {
      if (nb) {
        const nAr = nb.lang === 'ar' || /[\u0600-\u06FF]/.test(nb.title || '');
        const [nc1, nc2] = coverColors(nb.title, nb.cat, nAr);
        const nCovUrl = safeBookCoverUrl(nb);
        const nCov =
          '<div class="hero-next-cov' + (nAr ? ' ar-cover' : '') + '" style="--c1:' + nc1 + ';--c2:' + nc2 + ';background:linear-gradient(140deg,' + nc1 + ',' + nc2 + ')">'
          + (nAr ? coverInnerHtml(nb) : ('<span>' + esc(nb.title) + '</span>'))
          + (nCovUrl
            ? '<img src="' + esc(nCovUrl) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">'
            : '')
          + '</div>';
        const nHook = HABIT && HABIT.getPositiveMotivationHook ? HABIT.getPositiveMotivationHook(nb, 0) : null;
        const nReason = nb._recReason || (nHook ? nHook.quote : (nb.subCat || 'اختيار متناسق مع قراءتك الحالية'));
        const nMeta = [nb.subCat, nb.toneLabel].filter(Boolean).join(' • ');
        nextHost.classList.remove('hidden');
        if (subRow) subRow.classList.remove('no-next', 'hidden');
        nextHost.innerHTML =
          '<article class="hero-next-card" id="heroNextCard">'
          + '<div class="hero-next-kicker">' + SVG.sparkle + '<span>الكتاب التالي المقترح</span></div>'
          + '<div class="hero-next-body">'
          + nCov
          + '<div class="hero-next-info">'
          + '<h3 class="hero-next-title">' + esc(nb.title) + '</h3>'
          + (nb.author ? '<div class="hero-next-author">' + esc(S.cleanAuthorName(nb.author)) + '</div>' : '')
          + (nMeta ? '<div class="hero-next-meta">' + esc(nMeta) + '</div>' : '')
          + '<p class="hero-next-why">' + esc(nReason) + '</p>'
          + '</div></div>'
          + '<button type="button" id="heroNextOpenBtn" class="btn glass sm hero-next-btn">' + SVG.bookOpen + '<span>تصفّح الكتاب التالي</span></button>'
          + '</article>';
        if ($('heroNextOpenBtn')) $('heroNextOpenBtn').onclick = (e) => { e.stopPropagation(); openBookDetail(nb); };
        if ($('heroNextCard')) $('heroNextCard').onclick = () => openBookDetail(nb);
        resolveCoverAsyncForElem(nb, nextHost.querySelector('.hero-next-cov'));
      } else {
        nextHost.innerHTML = '';
        nextHost.classList.add('hidden');
        if (subRow) subRow.classList.add('no-next', 'hidden');
      }
    }
  }

  async function fetchCategoryLiveBooks(catId, force) {
    if (!catId || catId === 'all') return [];
    const cat = CATS.CATEGORIES.find(c => c.id === catId);
    if (!cat) return [];
    const existing = state.liveCache.catLive[catId];
    if (!force && Array.isArray(existing) && existing.length) return existing;
    if (state.catFetching[catId]) return existing || [];
    state.catFetching[catId] = true;
    try {
      if (catId === 'comics_manga' && typeof S.searchAllComics === 'function') {
        const comicJobs = [];
        if (state.prefLang !== 'en') {
          comicJobs.push(S.searchYskComics('باتمان', { lang: 'ar' }).catch(() => []));
          if (typeof S.searchArabComics === 'function') comicJobs.push(S.searchArabComics('باتمان', { arQuery: 'باتمان', enQuery: 'batman' }).catch(() => []));
          if (typeof S.searchComicsGate === 'function') comicJobs.push(S.searchComicsGate('كوميكس', { browseHome: true }).catch(() => []));
          if (typeof S.searchComicverse === 'function') comicJobs.push(S.searchComicverse('كوميكس', { browseHome: true }).catch(() => []));
          comicJobs.push(S.searchArchiveComicsAr('ميكي تان ماجد', { rows: 10 }).catch(() => []));
          comicJobs.push(S.searchComicsTelegram('كوميكس', { maxChannels: 4, limitPerCh: 4 }).catch(() => []));
        }
        if (state.prefLang !== 'ar') {
          comicJobs.push(S.searchYskComics('spider', { lang: 'en' }).catch(() => []));
          comicJobs.push(S.searchGetComics('batman').catch(() => []));
          if (typeof S.searchWebtoon === 'function') comicJobs.push(S.searchWebtoon('batman', { enQuery: 'batman' }).catch(() => []));
          if (typeof S.searchGlobalComix === 'function') comicJobs.push(S.searchGlobalComix('batman', { enQuery: 'batman' }).catch(() => []));
          if (typeof S.searchTapas === 'function') comicJobs.push(S.searchTapas('action', { enQuery: 'action' }).catch(() => []));
          comicJobs.push(S.searchArchiveComicsEn('batman', { rows: 8 }).catch(() => []));
        }
        const comicChunks = await Promise.all(comicJobs);
        const seen = new Set();
        const merged = [];
        comicChunks.forEach(list => {
          if (!Array.isArray(list)) return;
          list.forEach(raw => {
            if (!raw || !raw.title) return;
            const key = raw.title.toLowerCase().trim();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(registerBook(Object.assign({}, raw, { cat: catId, isComic: true })));
          });
        });
        state.liveCache.catLive[catId] = merged.slice(0, 32);
        state.liveCache.disc[catId] = state.liveCache.catLive[catId];
        return state.liveCache.catLive[catId];
      }
      const tasks = [];
      if (state.prefLang !== 'en') {
        const fbPromise = cat.foulaSlug
          ? S.browseFoulabook(cat.foulaSlug).catch(() => [])
          : Promise.resolve([]);
        tasks.push(fbPromise);
        if (cat.arQuery) {
          tasks.push(S.searchFoulabook(cat.arQuery).catch(() => []));
          tasks.push(S.searchHindawiHttp(cat.arQuery).catch(() => []));
          tasks.push(S.searchArchive(cat.arQuery, { arabicOnly: true, rows: 10 }).catch(() => []));
          tasks.push(S.searchWikisource(cat.arQuery).catch(() => []));
          tasks.push(S.searchTelegramChannels(cat.arQuery, { maxChannels: 3, limitPerCh: 3 }).catch(() => []));
        }
      }
      if (state.prefLang !== 'ar') {
        if (cat.enSubject) tasks.push(S.subjectOpenLibrary(cat.enSubject).catch(() => []));
        if (cat.enQuery) {
          tasks.push(S.searchOpenLibrary(cat.enQuery).catch(() => []));
          if (catId === 'medicine_neuro' || catId === 'tech_ai' || catId === 'science_cosmos') {
            tasks.push(S.searchArxiv(cat.enQuery).catch(() => []));
          }
        }
      }
      const chunks = await Promise.all(tasks);
      const seen = new Set();
      const merged = [];
      chunks.forEach(list => {
        if (!Array.isArray(list)) return;
        list.forEach(raw => {
          if (!raw || !raw.title) return;
          const key = raw.title.toLowerCase().trim();
          if (seen.has(key)) return;
          seen.add(key);
          const item = Object.assign({}, raw, { cat: catId });
          merged.push(registerBook(item));
        });
      });
      state.liveCache.catLive[catId] = merged.slice(0, 32);
      state.liveCache.disc[catId] = state.liveCache.catLive[catId];
      return state.liveCache.catLive[catId];
    } finally {
      state.catFetching[catId] = false;
      if (state.homeCat === catId) renderHomeGrid();
      const chosenT = Array.isArray(state.trendingCats) && state.trendingCats[0];
      if (chosenT === catId) renderTrendingShelf();
      if (state.tab === 'discover' && state.discCat === catId) renderDiscover();
    }
  }

  function renderHomePills() {
    const visibleCats = getVisibleCategories(true);
    if (!isComicsVisible() && state.homeCat === 'comics_manga') state.homeCat = 'all';
    const pillsHtml = visibleCats.map((c, idx) => {
      const btn = '<button class="chip ' + (state.homeCat === c.id ? 'on' : '') + '" data-hcat="' + c.id + '">'
        + catIcon(c.iconKey) + '<span>' + esc(c.name) + '</span></button>';
      if (idx === 0) {
        return btn
          + '<button type="button" id="btnHomeJumpDiscover" class="chip cat-jump-chip">'
          + SVG.compass + '<span>كل التصنيفات ←</span></button>';
      }
      return btn;
    }).join('');
    $('homeCatPills').innerHTML = pillsHtml;
    const jumpBtn = $('btnHomeJumpDiscover');
    if (jumpBtn) {
      jumpBtn.onclick = () => {
        switchTab('discover');
        const mainScroll = $('mainScroll');
        if (mainScroll) mainScroll.scrollTop = 0;
      };
    }
    $('homeCatPills').querySelectorAll('button[data-hcat]').forEach(btn => {
      btn.onclick = () => {
        const nextCat = btn.dataset.hcat;
        state.homeCat = (nextCat === state.homeCat && nextCat !== 'all') ? 'all' : nextCat;
        renderHomePills();
        renderHomeGrid();
        if (state.homeCat !== 'all') fetchCategoryLiveBooks(state.homeCat);
      };
    });
  }

  function renderTrendingPills() {
    const el = $('trendingCatPills');
    if (!el) return;
    if (!isComicsVisible() && Array.isArray(state.trendingCats) && state.trendingCats[0] === 'comics_manga') {
      state.trendingCats = ['all'];
    }
    const chosenId = (Array.isArray(state.trendingCats) && state.trendingCats[0]) || 'all';
    el.innerHTML = getVisibleCategories(true).map(c => {
      const active = chosenId === c.id;
      return '<button type="button" class="chip ' + (active ? 'on' : '') + '" data-tcat="' + c.id + '">'
        + catIcon(c.iconKey) + '<span>' + esc(c.name) + '</span></button>';
    }).join('');

    el.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.tcat;
        state.trendingCats = (id === chosenId && id !== 'all') ? ['all'] : [id];
        saveJson('wq_trending_cats', state.trendingCats);
        renderTrendingPills();
        renderTrendingShelf();
        if (state.trendingCats[0] !== 'all') hydrateTrendingCategories();
      };
    });
  }

  function renderTrendingShelf() {
    if (state.homeMixFilter === 'trending' && state.homeCat === 'all') {
      renderHomeGrid();
    } else if (typeof renderHomeSmartMeta === 'function') {
      renderHomeSmartMeta(getHomeFeedAllocations(false));
    }
  }

  function renderHomeSmartMeta(alloc) {
    const subEl = $('homeSmartSub');
    if (!subEl) return;
    const mix = state.homeMixFilter || 'all';
    const timeNote = alloc && alloc.timeCtx ? (' • ' + alloc.timeCtx.badge) : '';
    if (mix === 'personal') {
      subEl.textContent = (alloc && alloc.personalSubtitle ? alloc.personalSubtitle : 'مختارات مبنية على ذوقك وتقاطعات القرّاء') + timeNote;
    } else if (mix === 'horizon') {
      subEl.textContent = (alloc && alloc.horizonSubtitle ? alloc.horizonSubtitle : 'توسيع الآفاق باهتمامات معرفية قريبة') + timeNote;
    } else if (mix === 'trending') {
      const chosenId = (Array.isArray(state.trendingCats) && state.trendingCats[0]) || 'all';
      const catObj = CATS.CATEGORIES.find(c => c.id === chosenId);
      subEl.textContent = (chosenId === 'all'
        ? '10% الأعلى رواجاً واكتشافات متجددة هذا الأسبوع'
        : ('الأكثر رواجاً في: ' + ((catObj && catObj.name) || chosenId))) + timeNote;
    } else {
      subEl.textContent = (alloc && alloc.personalSubtitle
        ? ('مزيج ذكي: 70% على ذوقك • 20% آفاق • 10% رواجاً — ' + alloc.personalSubtitle)
        : 'مكتبة هجينة ذكية تجمع ذوقك وتوسيع الآفاق والأكثر رواجاً') + timeNote;
    }
  }

  async function hydrateTrendingCategories() {
    const chosenId = (Array.isArray(state.trendingCats) && state.trendingCats[0]) || 'all';
    if (!chosenId || chosenId === 'all') return;
    await fetchCategoryLiveBooks(chosenId);
  }

  function renderHomeGrid() {
    const cat = CATS.CATEGORIES.find(c => c.id === state.homeCat) || CATS.CATEGORIES[0];
    const isFiltered = state.homeCat !== 'all';

    if ($('heroCarousel')) $('heroCarousel').classList.toggle('hidden', isFiltered);
    if ($('dailyQuoteStrip')) $('dailyQuoteStrip').classList.toggle('hidden', isFiltered);
    const hideNext = isFiltered || state.heroFocusMode !== 'continue_next' || !$('heroNextHost') || !$('heroNextHost').innerHTML.trim();
    if ($('heroNextHost')) $('heroNextHost').classList.toggle('hidden', hideNext);
    if ($('homeLeadSubrow')) $('homeLeadSubrow').classList.toggle('hidden', hideNext);
    if ($('homeTopShowcase')) $('homeTopShowcase').classList.toggle('filtered-out', isFiltered);
    if ($('likedSimilarWrap')) $('likedSimilarWrap').classList.toggle('hidden', isFiltered || !state.liked.length);
    if ($('homeSmartToolbar')) $('homeSmartToolbar').classList.toggle('hidden', isFiltered);
    if ($('btnSmartCustomize')) $('btnSmartCustomize').classList.toggle('hidden', isFiltered);
    if ($('btnResetHomeCat')) $('btnResetHomeCat').classList.toggle('hidden', !isFiltered);

    $('homeCatIcon').innerHTML = catIcon(cat.iconKey);
    $('homeGridTitle').textContent = !isFiltered ? 'مختارات مداد الذكية' : ('تخصص: ' + cat.name);

    const mix = state.homeMixFilter || 'all';
    if ($('smartMixTabs')) {
      $('smartMixTabs').querySelectorAll('[data-hmix]').forEach(btn => {
        btn.classList.toggle('on', btn.dataset.hmix === mix);
        btn.onclick = () => {
          state.homeMixFilter = btn.dataset.hmix || 'all';
          renderHomeGrid();
          if (state.homeMixFilter === 'trending') hydrateTrendingCategories();
        };
      });
    }
    if ($('trendingCatPills')) {
      $('trendingCatPills').classList.toggle('hidden', isFiltered || mix !== 'trending');
    }

    let merged = [];
    const alloc = !isFiltered ? getHomeFeedAllocations(false) : null;
    if (!isFiltered && alloc) {
      renderTimeCtxBar(alloc.timeCtx);
      renderHomeSmartMeta(alloc);
      if (mix === 'personal') {
        merged = (Array.isArray(alloc.personalFull) && alloc.personalFull.length ? alloc.personalFull : (alloc.personal70 || [])).slice(0, 60);
      } else if (mix === 'horizon') {
        merged = (Array.isArray(alloc.horizonFull) && alloc.horizonFull.length ? alloc.horizonFull : (alloc.horizon20 || [])).slice(0, 60);
      } else if (mix === 'trending') {
        const chosenId = (Array.isArray(state.trendingCats) && state.trendingCats[0]) || 'all';
        const catPool = chosenId === 'all' ? [] : (state.liveCache.catLive[chosenId] || []);
        const exploreBase = chosenId === 'all' && Array.isArray(alloc.exploreFull) && alloc.exploreFull.length
          ? alloc.exploreFull
          : [];
        const pool = [...exploreBase, ...catPool, ...state.liveCache.trending, ...CATS.CURATED];
        const dismissed = REC && REC.getDismissedMap ? REC.getDismissedMap() : {};
        const seen = new Set();
        merged = pool.filter(b => {
          if (!matchesPrefLang(b)) return false;
          if (chosenId !== 'all' && b.cat !== chosenId) return false;
          const bk = REC && REC.canonicalBookKey ? REC.canonicalBookKey(b) : (b.title || '').toLowerCase().trim();
          if (!bk || seen.has(bk) || dismissed[bk]) return false;
          seen.add(bk);
          return true;
        }).map(b => REC ? REC.enrichBook(b) : b).sort((a, b) => {
          const scA = scoreBookFame(a) + scorePrefLength(a) + (REC && REC.scoreBookForTimeContext ? Number(REC.scoreBookForTimeContext(a, state.recTimeMode)) || 0 : 0);
          const scB = scoreBookFame(b) + scorePrefLength(b) + (REC && REC.scoreBookForTimeContext ? Number(REC.scoreBookForTimeContext(b, state.recTimeMode)) || 0 : 0);
          return scB - scA;
        });
        merged = interleaveByLengthMix(merged).slice(0, 60);
      } else {
        merged = Array.isArray(alloc.combinedFeed) && alloc.combinedFeed.length
          ? alloc.combinedFeed.slice(0, 84)
          : [];
      }
    }
    if (!merged.length) {
      const catLive = isFiltered
        ? (state.liveCache.catLive[state.homeCat] || [])
        : [...state.liveCache.homeGrid, ...state.liveCache.trending, ...Object.values(state.liveCache.catLive || {}).flat()];
      const baseCurated = isFiltered
        ? CATS.CURATED.filter(b => b.cat === state.homeCat)
        : CATS.CURATED;
      const dismissed = REC && REC.getDismissedMap ? REC.getDismissedMap() : {};
      const seen = new Set();
      merged = [...baseCurated, ...catLive].filter(b => {
        if (!matchesPrefLang(b)) return false;
        if (isFiltered && b.cat !== state.homeCat) return false;
        const k = (b.title || '').toLowerCase().trim();
        const bk = REC && REC.canonicalBookKey ? REC.canonicalBookKey(b) : k;
        if (!k || seen.has(k) || dismissed[bk]) return false;
        seen.add(k);
        return true;
      }).map(b => REC ? REC.enrichBook(b) : b).sort((a, b) => {
        const sA = isFiltered
          ? (scoreBookFame(a) + scorePrefLength(a) + scoreBookByTaste(a) * 0.5)
          : (scoreBookByTaste(a) * 1.8 + scorePrefLength(a) + scoreBookFame(a) * 0.45 + tasteJitter(a, state.tasteRotation));
        const sB = isFiltered
          ? (scoreBookFame(b) + scorePrefLength(b) + scoreBookByTaste(b) * 0.5)
          : (scoreBookByTaste(b) * 1.8 + scorePrefLength(b) + scoreBookFame(b) * 0.45 + tasteJitter(b, state.tasteRotation));
        return sB - sA;
      });
      merged = interleaveByLengthMix(merged);
    }
    if ($('homeSmartSub') && isFiltered) {
      $('homeSmartSub').textContent = 'تصفية حسب تصنيف: ' + cat.name + ' (' + merged.length + ' كتاب)';
    }
    renderCards($('homeGrid'), merged);
    if (!isFiltered) {
      renderLikedSimilarShelf();
    }
  }

  async function hydrateHomeLive() {
    renderPersonalShelf();
    renderHorizonShelf();
    renderLikedSimilarShelf();
    renderTrendingPills();
    renderTrendingShelf();

    const [arFoula, arArch, arHind, arWiki, arTg, appleEn, stdEn] = await Promise.all([
      state.prefLang !== 'en' ? S.browseFoulabook('psychology').catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'en' ? S.searchArchive('نجيب محفوظ OR أجاثا كريستي OR دوستويفسكي', { arabicOnly: true, rows: 14 }).catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'en' ? S.searchHindawiHttp('طه حسين OR توفيق الحكيم').catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'en' ? S.searchWikisource('طوق الحمامة OR ابن خلدون').catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'en' ? S.searchTelegramChannels('رواية', { maxChannels: 3, limitPerCh: 3 }).catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'ar' ? S.getAppleCharts('us').catch(() => []) : Promise.resolve([]),
      state.prefLang !== 'ar' ? S.searchStandardEbooks('sherlock OR mystery').catch(() => []) : Promise.resolve([]),
    ]);

    arFoula.forEach(b => { b.cat = b.cat || 'psychology_habits'; if (REC) REC.enrichBook(b); });
    arArch.forEach(b => { b.cat = b.cat || 'mystery_classics'; if (REC) REC.enrichBook(b); });
    arHind.forEach(b => { b.cat = b.cat || 'arabic_novels'; if (REC) REC.enrichBook(b); });
    arWiki.forEach(b => { b.cat = b.cat || 'history_thought'; if (REC) REC.enrichBook(b); });
    arTg.forEach(b => { b.cat = b.cat || 'arabic_novels'; if (REC) REC.enrichBook(b); });
    appleEn.forEach(b => { b.cat = b.cat || 'psychology_habits'; if (REC) REC.enrichBook(b); });
    stdEn.forEach(b => { b.cat = b.cat || 'mystery_classics'; if (REC) REC.enrichBook(b); });

    state.liveCache.ar = [...arFoula.slice(0, 6), ...arHind.slice(0, 6), ...arTg.slice(0, 5), ...arArch.slice(0, 6), ...arWiki.slice(0, 4)];
    state.liveCache.en = [...stdEn.slice(0, 6), ...appleEn.slice(0, 6)];
    state.liveCache.trending = [...state.liveCache.ar, ...state.liveCache.en];

    if (!state.liveCache.homeGrid.length) {
      state.liveCache.homeGrid = [...arFoula.slice(0, 8), ...arHind.slice(0, 8), ...arTg.slice(0, 6), ...appleEn.slice(0, 6), ...stdEn.slice(0, 6)];
    }
    state._lastHomeAlloc = null;
    renderTrendingShelf();
    renderPersonalShelf();
    renderHorizonShelf();
    if (state.homeCat === 'all') renderHomeGrid();
    const topCat = (Object.entries(state.taste.cats || {}).sort((a, b) => b[1] - a[1])[0] || [])[0]
      || (Array.isArray(state.prefCats) && state.prefCats[0])
      || 'psychology_habits';
    if (topCat && topCat !== 'all' && !state.liveCache.catLive[topCat]) {
      fetchCategoryLiveBooks(topCat).catch(() => {});
    }
    renderLikedSimilarShelf();
  }

  // ------------------------------------------------------------------ Ultra-Smooth Multi-Source Search
  function showRecentBar() {
    const rb = $('recentSearches');
    if (!rb) return;
    if (state.recentQ && state.recentQ.length) rb.classList.remove('hidden');
  }

  function hideRecentBar() {
    const rb = $('recentSearches');
    if (rb) rb.classList.add('hidden');
  }

  function renderQuickPrompts() {
    $('quickPrompts').innerHTML = CATS.QUICK_PROMPTS.map(t =>
      '<button class="chip" data-qp="' + esc(t) + '">' + esc(t) + '</button>'
    ).join('');
    $('quickPrompts').querySelectorAll('button').forEach(b => {
      b.onclick = () => { $('q').value = b.dataset.qp; runSearch(b.dataset.qp); };
    });

    const rb = $('recentSearches');
    if (rb) {
      if (state.recentQ.length) {
        rb.innerHTML = '<span style="font-size:12px;color:var(--muted)">أبحاث سابقة:</span>'
          + state.recentQ.slice(0, 6).map(q => '<button class="chip" data-rq="' + esc(q) + '">' + esc(q) + '</button>').join('');
        rb.querySelectorAll('button').forEach(b => {
          b.onmousedown = (e) => { e.preventDefault(); };
          b.onclick = () => {
            $('q').value = b.dataset.rq;
            hideRecentBar();
            runSearch(b.dataset.rq);
          };
        });
        if (document.activeElement === $('q')) rb.classList.remove('hidden');
        else rb.classList.add('hidden');
      } else {
        rb.innerHTML = '';
        rb.classList.add('hidden');
      }
    }
  }

  function normSearchKey(b) {
    return (b.title || '').toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]/g, '') + '_' + (b.sourceId || '') + '_' + (b.url || b.id || '').slice(-16);
  }

  function canonicalBookGroupKey(b) {
    const rawPart = String((b && b.title) || '').split('—')[0];
    const k = normBookText(rawPart).replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim();
    return k.length >= 3 ? k : String((b && b.id) || Math.random());
  }

  function getPreferredFormat() {
    return state.prefFormat === 'epub' ? 'epub' : 'pdf';
  }

  function scoreEditionQuality(labelOrFile, urlOrName, sourceName) {
    let decoded = String(urlOrName || '');
    try { decoded = decodeURIComponent(decoded); } catch (_) {}
    const meta = (String(labelOrFile || '') + ' ' + decoded + ' ' + String(sourceName || '')).toLowerCase();
    let sc = 0;
    if (/\b(hq|hd|high[\s_-]?res|high[\s_-]?quality|original|vector|digital|epub3|searchable|retail|clean)\b|النسخة الأصلية|نسخة أصلية|الطبعة الأصلية|طبعة دار|طبعة كاملة|جودة عالية|دقة عالية|أصلي|منسق|ملون/i.test(meta)) {
      sc += 26;
    }
    if (/epub3\.images/i.test(meta)) sc += 12;
    else if (/\.noimages\b/i.test(meta)) sc -= 18;
    if (/_bw\.pdf|_text\.pdf|_abbyy\.|_djvu\.|_jp2|compressed|low[\s_-]?res|low[\s_-]?quality|small[\s_-]?size|thumbnail|نسخة مصغرة|مضغوط|جودة منخفضة|جودة ضعيفة|نص فقط|أبيض وأسود/i.test(meta)) {
      sc -= 110;
    }
    if (/\.zip(?:\?|#|$)/i.test(decoded)) sc -= 75;
    if (/\b(sample|preview|excerpt)\b|_sample\.|_preview\.|عينة مجانية|معاينة فقط/i.test(meta)) sc -= 120;
    return sc;
  }

  function scoreBookQuality(b, qIsArabic) {
    if (!b) return -999;
    let sc = Number(b._relScore || 0) * 1.4;
    const matches = findDownloadedMatches(b);
    if (matches.some(m => m.hasReadProgress)) sc += 600;
    else if (matches.length > 0) sc += 380;
    if (b.dlUrl && !/t\.me\/|scribd\.com\/search/i.test(String(b.dlUrl))) sc += 140;
    const prefFmt = getPreferredFormat();
    const fmt = String(b.format || '').toLowerCase();
    const isComicResult = Boolean(b.isComic || b.cat === 'comics_manga' || state.searchScope === 'comics');
    if (isComicResult && fmt.includes('cbz')) {
      sc += 125;
    } else if (prefFmt === 'pdf') {
      if (fmt.includes('pdf')) sc += 110;
      else if (fmt.includes('epub')) sc += 70;
      else if (fmt.includes('azw3') || fmt.includes('mobi')) sc += 60;
      else if (fmt.includes('cbz')) sc += 55;
    } else {
      if (fmt.includes('epub')) sc += 110;
      else if (fmt.includes('azw3') || fmt.includes('mobi')) sc += 80;
      else if (fmt.includes('pdf')) sc += 65;
      else if (fmt.includes('cbz')) sc += 55;
    }
    sc += scoreEditionQuality('', b.dlUrl || b.url || '', b.source || '');
    const srcTier = {
      yskcomics: 86,
      getcomics: 82,
      hindawi: 72,
      standardebooks: 70,
      gutenberg: 68,
      archive: 64,
      '8gharb': 64,
      foulabook: 62,
      alarabimag: 58,
      wikisource: 56,
      noorbook: 56,
      scribd: 52,
      waqfeya: 50,
      openlibrary: 48,
      libgen: 46,
      telegram: 40,
    };
    sc += (srcTier[String(b.sourceId || '').toLowerCase()] || 35);
    if (qIsArabic && b.lang === 'ar') sc += 28;
    if (b.cover) sc += 32;
    if (b.summary && String(b.summary).length > 35) sc += 22;
    if (b.pages && Number(b.pages) > 15) sc += 16;
    if (Number(b._variantCount || 1) > 1) sc += Math.min(40, Number(b._variantCount) * 8);
    return sc;
  }

  function groupAndRankSearchResults(rawList, qIsArabic) {
    if (!Array.isArray(rawList) || !rawList.length) return [];
    const groups = new Map();
    for (const raw of rawList) {
      const nb = registerBook(raw);
      const gk = canonicalBookGroupKey(nb);
      let arr = groups.get(gk);
      if (!arr) {
        arr = [];
        groups.set(gk, arr);
      }
      arr.push(nb);
    }

    const out = [];
    for (const variants of groups.values()) {
      variants.sort((a, b) => scoreBookQuality(b, qIsArabic) - scoreBookQuality(a, qIsArabic));
      const best = Object.assign({}, variants[0]);
      best._mergedVariants = variants.slice(1);
      best._variantCount = variants.length;
      const srcSeen = new Set();
      const srcNames = [];
      for (const v of variants) {
        if (!best.cover && v.cover) best.cover = v.cover;
        if (!best.dlUrl && v.dlUrl) best.dlUrl = v.dlUrl;
        if (!best.summary && v.summary) best.summary = v.summary;
        if (!best.pages && v.pages) best.pages = v.pages;
        const sn = String(v.source || '').trim();
        if (sn && !srcSeen.has(sn)) {
          srcSeen.add(sn);
          srcNames.push(sn);
        }
      }
      best._sourceNames = srcNames;
      BOOK_MAP.set(best.id, best);
      out.push(best);
    }

    // Preserve at least 2 visible cards when multiple raw editions exist under one canonical title
    if (out.length === 1 && out[0]._mergedVariants && out[0]._mergedVariants.length >= 1) {
      const alt = Object.assign({}, out[0]._mergedVariants[0], { _isAltEdition: true });
      BOOK_MAP.set(alt.id, alt);
      out.push(alt);
    }

    out.sort((a, b) => {
      if (!!a._isAltEdition !== !!b._isAltEdition) return a._isAltEdition ? 1 : -1;
      return scoreBookQuality(b, qIsArabic) - scoreBookQuality(a, qIsArabic);
    });
    return out;
  }

  function passesSearchFilter(b) {
    if (state.searchLang && b.lang !== state.searchLang) return false;
    if (state.searchFmt && !(b.format || '').toLowerCase().includes(state.searchFmt)) return false;
    return true;
  }

  function refilterSearchGrid() {
    const filtered = state.searchResults.filter(passesSearchFilter);
    renderCards($('searchGrid'), filtered);
    $('searchEmpty').classList.toggle('hidden', filtered.length > 0 || !!state.searchQuery);
  }

  const searchQueryCache = new Map();

  async function runSearch(query, onlyCf) {
    const q = (query || $('q').value || '').trim();
    if (!q) return;

    state.searchQuery = q;
    state.recentQ = [q, ...state.recentQ.filter(x => x !== q)].slice(0, 8);
    saveJson('wq_recent_q', state.recentQ);
    hideRecentBar();
    renderQuickPrompts();

    switchTab('search');
    $('qSpin').classList.remove('hidden');
    $('qClear').classList.remove('hidden');
    $('searchEmpty').classList.add('hidden');
    $('cfQuickBar').classList.toggle('hidden', !KTB.isAndroid() || onlyCf);

    const statusBar = $('searchStatusBar');
    statusBar.classList.remove('hidden');

    const sc = state.searchScope;
    const sLang = state.searchLang || '';
    const isGenericComic = !!(S && typeof S.isGenericComicQuery === 'function' && S.isGenericComicQuery(q));
    const isComicQ = sc === 'comics' || isGenericComic || !!(S && typeof S.isComicQuery === 'function' && S.isComicQuery(q));
    const cacheKey = (!onlyCf ? (sc + '|' + sLang + '|' + q.toLowerCase()) : '');
    const cached = cacheKey ? searchQueryCache.get(cacheKey) : null;
    if (cached && (Date.now() - cached.at) < 3 * 60 * 1000 && cached.results.length) {
      state.searchSeq++;
      state.searchResults = cached.results.map(x => {
        const reg = registerBook(x);
        if (x._mergedVariants) reg._mergedVariants = x._mergedVariants;
        if (x._variantCount) reg._variantCount = x._variantCount;
        if (x._sourceNames) reg._sourceNames = x._sourceNames;
        return reg;
      });
      refilterSearchGrid();
      $('qSpin').classList.add('hidden');
      statusBar.innerHTML = 'النتائج: <b>' + state.searchResults.length + '</b> كتاب (مرتبة حسب الجودة) — ' + esc(cached.sources);
      return;
    }

    const mySeq = ++state.searchSeq;
    const seenKeys = new Set();
    const rawSearchPool = [];
    const loosePool = [];
    const looseSeen = new Set();
    const qIsArabic = /[\u0600-\u06FF]/.test(q);
    const preferArabicRank = sLang === 'ar' ? true : (sLang === 'en' ? false : qIsArabic);

    if (!onlyCf) {
      covQueue.length = 0;
      covPendingIds.clear();
      if (KTB.abortHttp) KTB.abortHttp();
      state.searchResults = [];
      $('searchGrid').innerHTML = skeletonCardsHtml(8);
      statusBar.innerHTML = '<span class="spin"></span><span>جاري البحث وتجميع النسخ حسب الجودة...</span>';
    } else {
      state.searchResults.forEach(x => {
        seenKeys.add(normSearchKey(x));
        rawSearchPool.push(x);
        (x._mergedVariants || []).forEach(v => {
          seenKeys.add(normSearchKey(v));
          rawSearchPool.push(v);
        });
      });
    }

    let comicTerms = { arQuery: qIsArabic ? q : '', enQuery: !qIsArabic ? q : '', isGeneric: isGenericComic };
    if (isComicQ && S && typeof S.resolveComicSearchTerms === 'function') {
      try {
        const resolved = await S.resolveComicSearchTerms(q);
        if (state.searchSeq !== mySeq) return;
        if (resolved) comicTerms = resolved;
      } catch (_) { }
    }

    function scoreItemRel(nb) {
      if (!nb) return 0;
      if (isGenericComic && (nb.isComic || nb.cat === 'comics_manga')) {
        if (nb.sourceId === 'yskcomics' || nb.sourceId === 'getcomics') return 220;
        return 160;
      }
      if (!(S && typeof S.scoreSearchRelevance === 'function')) {
        const hay = ((nb.title || '') + ' ' + (nb.author || '')).toLowerCase();
        return hay.includes(q.toLowerCase()) ? 100 : 0;
      }
      let rel = S.scoreSearchRelevance(q, nb, { broadSearch: true });
      if (isComicQ && comicTerms) {
        if (comicTerms.arQuery && comicTerms.arQuery !== q) {
          rel = Math.max(rel, S.scoreSearchRelevance(comicTerms.arQuery, nb, { broadSearch: true }));
        }
        if (comicTerms.enQuery && comicTerms.enQuery !== q) {
          rel = Math.max(rel, S.scoreSearchRelevance(comicTerms.enQuery, nb, { broadSearch: true }));
        }
      }
      return rel;
    }

    // Coalesce rapid chunks via rAF & keep searchGrid grouped by book and ranked by quality
    let renderPending = false;
    function flushSortedGrid() {
      renderPending = false;
      if (state.searchSeq !== mySeq) return;
      state.searchResults = groupAndRankSearchResults(rawSearchPool, preferArabicRank);
      refilterSearchGrid();
    }

    function pushChunk(list) {
      if (state.searchSeq !== mySeq || !Array.isArray(list)) return;
      let added = false;
      for (const raw of list) {
        if (S && typeof S.isGenuineBookItem === 'function' && !S.isGenuineBookItem(raw)) continue;
        const nb = registerBook(raw);
        if (!isValidDisplayBook(nb)) continue;
        const rel = scoreItemRel(nb);
        const k = normSearchKey(nb);
        if (rel > 0) {
          if (seenKeys.has(k)) continue;
          seenKeys.add(k);
          nb._relScore = rel;
          rawSearchPool.push(nb);
          added = true;
        } else if (!onlyCf && loosePool.length < 16 && !looseSeen.has(k)) {
          const qWords = q.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
          const hay = ((nb.title || '') + ' ' + (nb.author || '')).toLowerCase();
          if (qWords.some(w => hay.includes(w))) {
            looseSeen.add(k);
            nb._relScore = 1;
            loosePool.push(nb);
          }
        }
      }
      if (added && !renderPending) {
        renderPending = true;
        requestAnimationFrame(flushSortedGrid);
      }
    }

    // Instant curated match check
    if (!onlyCf) {
      const localMatches = CATS.CURATED.filter(b => scoreItemRel(b) > 0);
      if (localMatches.length) pushChunk(localMatches);
    }

    const doneSources = [];
    const jobs = [];
    const waitWrap = (p, ms) => (S && typeof S.withTimeout === 'function') ? S.withTimeout(p, ms || 9500, []) : p;
    const track = (label, p, timeoutMs) => waitWrap(p, timeoutMs || 9500).then(res => {
      if (state.searchSeq !== mySeq) return;
      const arr = Array.isArray(res) ? res : (res && res.items) || [];
      if (arr.length) {
        doneSources.push(label + ' (' + arr.length + ')');
        pushChunk(arr);
      }
      statusBar.innerHTML = '<span class="spin"></span><span>جاري التجميع (' + state.searchResults.length + ' كتاب من ' + rawSearchPool.length + ' نسخة): ' + esc(doneSources.join(' • ') || 'جاري الاتصال...') + '</span>';
    }).catch(() => {});

    if (onlyCf || sc === 'cf') {
      if (KTB.isAndroid()) {
        statusBar.innerHTML = '<span class="spin"></span><span>جاري البحث في مكتبة نور وكتبي وهنداوي وScribd وAnna\'s...</span>';
        for (const id of ['noorbook', 'kotobati', 'hindawi', 'scribd', 'oceanofpdf', 'annas']) {
          if (state.searchSeq !== mySeq) return;
          await track(id, S.searchWebEngine(id, q), 22000);
        }
      } else {
        KTB.toast('محركات WebView (مكتبة نور / كتبي / Anna) تعمل داخل تطبيق التابلت فقط');
      }
      if (state.searchSeq !== mySeq) return;
      $('qSpin').classList.add('hidden');
      flushSortedGrid();
      statusBar.innerHTML = 'تم تجميع <b>' + state.searchResults.length + '</b> كتاب (' + rawSearchPool.length + ' نسخة ومصدر) — ' + esc(doneSources.join(' • ') || 'المحركات المحمية');
      return;
    }

    let pushedArchive = false;
    let pushedScribd = false;
    const arComicQ = (comicTerms && comicTerms.arQuery) || q;
    const enComicQ = (comicTerms && comicTerms.enQuery) || q;
    const wantArComics = sLang !== 'en' && sc !== 'global';
    const wantEnComics = sLang !== 'ar' && sc !== 'arabic';

    function pushComicJobs(fullMode) {
      if (wantArComics) {
        if (typeof S.searchYskComics === 'function') {
          jobs.push(track('YSK Comics عربي', S.searchYskComics(arComicQ, { lang: 'ar', arQuery: arComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchArabComics === 'function') {
          jobs.push(track('عرب كوميكس', S.searchArabComics(arComicQ, { arQuery: arComicQ, enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchComicsGate === 'function') {
          jobs.push(track('ComicsGate', S.searchComicsGate(arComicQ, { arQuery: arComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchComicverse === 'function') {
          jobs.push(track('Comicverse عربي', S.searchComicverse(arComicQ, { arQuery: arComicQ, enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchAzComics === 'function') {
          jobs.push(track('AZComics', S.searchAzComics(arComicQ, { enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchArchiveComicsAr === 'function') {
          jobs.push(track('أرشيف الكوميكس', S.searchArchiveComicsAr(arComicQ, { rows: fullMode ? 14 : 10 })));
        }
        if (typeof S.searchComicsTelegram === 'function') {
          jobs.push(track('تيليجرام كوميكس', S.searchComicsTelegram(arComicQ, { tag: 'search' })));
        }
      }
      if (wantEnComics) {
        if (typeof S.searchYskComics === 'function') {
          jobs.push(track('YSK Comics', S.searchYskComics(enComicQ, { lang: 'en', enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchGetComics === 'function') {
          jobs.push(track('GetComics', S.searchGetComics(enComicQ, { enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchWebtoon === 'function') {
          jobs.push(track('WEBTOON', S.searchWebtoon(enComicQ, { enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchGlobalComix === 'function') {
          jobs.push(track('GlobalComix', S.searchGlobalComix(enComicQ, { enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchTapas === 'function') {
          jobs.push(track('Tapas', S.searchTapas(enComicQ, { enQuery: enComicQ, browseHome: isGenericComic, tag: 'search' })));
        }
        if (typeof S.searchArchiveComicsEn === 'function') {
          jobs.push(track('Archive Comics', S.searchArchiveComicsEn(enComicQ, { rows: fullMode ? 14 : 10 })));
        }
        if (typeof S.searchLibgenComics === 'function') {
          jobs.push(track('LibGen Comics', S.searchLibgenComics(isGenericComic ? 'batman' : enComicQ, { tag: 'search' })));
        }
      }
    }

    if (!isGenericComic && (sc === 'arabic' || (sc === 'all' && qIsArabic && sLang !== 'en'))) {
      jobs.push(track('فولة بوك', S.searchFoulabook(q)));
      if (typeof S.search8gharb === 'function') jobs.push(track('قهوة 8 غرب', S.search8gharb(q)));
      jobs.push(track('مجلة العرب', S.searchAlarabimag(q)));
      jobs.push(track('مؤسسة هنداوي', S.searchHindawiHttp(q)));
      jobs.push(track('ويكي مصدر', S.searchWikisource(q)));
      jobs.push(track('الوقفية', S.searchWaqfeya(q)));
      jobs.push(track('الأرشيف', S.searchArchive(q, { arabicOnly: false, rows: 14 })));
      pushedArchive = true;
      if (typeof S.searchScribd === 'function') {
        jobs.push(track('Scribd', S.searchScribd(q)));
        pushedScribd = true;
      }
      jobs.push(track('تيليجرام', S.searchTelegramChannels(q, { maxChannels: 8, limitPerCh: 3 })));
      if (typeof S.searchTelegramMtproto === 'function' && S.getMtprotoConfig && S.getMtprotoConfig().url) {
        jobs.push(track('تيليجرام MTProto', S.searchTelegramMtproto(q, { format: getPreferredFormat() }), 18000));
      }
    }
    if (sc === 'telegram') {
      jobs.push(track('قنوات تيليجرام', S.searchTelegramChannels(q, { maxChannels: 10, limitPerCh: 8, tag: 'search' }), 8500));
      if (typeof S.searchTelegramMtproto === 'function' && S.getMtprotoConfig && S.getMtprotoConfig().url) {
        jobs.push(track('بوت تيليجرام MTProto', S.searchTelegramMtproto(q, { format: getPreferredFormat(), tag: 'search' }), 18000));
      }
      jobs.push(track('قهوة 8 غرب', typeof S.search8gharb === 'function' ? S.search8gharb(q, { tag: 'search' }) : Promise.resolve([]), 8000));
      jobs.push(track('هنداوي (أرشيف)', S.searchHindawiHttp(q), 7000));
    }
    if (sc === 'comics') {
      pushComicJobs(true);
    }
    if (sc === 'all' || sc === 'global') {
      if (!isGenericComic && sLang !== 'ar') {
        jobs.push(track('OpenLibrary', S.searchOpenLibrary(enComicQ)));
        if (!pushedArchive) jobs.push(track('Archive', S.searchArchive(q, { arabicOnly: false, rows: 16 })));
        jobs.push(track('Gutenberg', S.searchGutenberg(q)));
        if (typeof S.searchGutendex === 'function') jobs.push(track('Gutendex', S.searchGutendex(q)));
        jobs.push(track('StandardEbooks', S.searchStandardEbooks(q)));
        if (typeof S.searchDoab === 'function') jobs.push(track('DOAB', S.searchDoab(q)));
        jobs.push(track('LibGen', S.searchLibgen(q)));
      }
      if (isComicQ) {
        pushComicJobs(false);
      }
      if (!pushedScribd && typeof S.searchScribd === 'function' && !isGenericComic) {
        jobs.push(track('Scribd', S.searchScribd(q)));
        pushedScribd = true;
      }
      if (sc === 'all' && !qIsArabic && !isComicQ) {
        jobs.push(track('تيليجرام', S.searchTelegramChannels(q, { maxChannels: 4, limitPerCh: 3 })));
        if (typeof S.searchTelegramMtproto === 'function' && S.getMtprotoConfig && S.getMtprotoConfig().url) {
          jobs.push(track('تيليجرام MTProto', S.searchTelegramMtproto(q, { format: getPreferredFormat() }), 18000));
        }
      }
    }
    if (sc === 'arabic' && isComicQ) {
      pushComicJobs(false);
    }
    if ((sc === 'all' && !isGenericComic && sLang !== 'ar') || sc === 'academic') {
      jobs.push(track('arXiv', S.searchArxiv(q)));
      if (typeof S.searchDoab === 'function') jobs.push(track('DOAB', S.searchDoab(q)));
      if (typeof S.searchOapen === 'function') jobs.push(track('OAPEN', S.searchOapen(q)));
      if (sc === 'academic') {
        jobs.push(track('LibGen', S.searchLibgen(q)));
        if (!pushedScribd && typeof S.searchScribd === 'function') jobs.push(track('Scribd', S.searchScribd(q)));
      }
    }

    await Promise.all(jobs);
    if (state.searchSeq !== mySeq) return;
    if (!rawSearchPool.length && loosePool.length) {
      loosePool.forEach((b) => { rawSearchPool.push(b); });
    }
    flushSortedGrid();
    $('qSpin').classList.add('hidden');

    if (cacheKey && state.searchResults.length) {
      if (searchQueryCache.size >= 20) searchQueryCache.delete(searchQueryCache.keys().next().value);
      searchQueryCache.set(cacheKey, {
        at: Date.now(),
        results: state.searchResults.slice(),
        sources: doneSources.join(' • '),
      });
    }
    const visibleResultsCount = state.searchResults.filter(passesSearchFilter).length;
    const mergedNote = rawSearchPool.length > visibleResultsCount
      ? (' (مجمعة ومرتبة حسب الجودة من ' + rawSearchPool.length + ' نسخة)')
      : '';
    statusBar.innerHTML = visibleResultsCount
      ? 'النتائج: <b>' + visibleResultsCount + '</b> كتاب' + mergedNote + ' — ' + esc(doneSources.join(' • '))
      : 'لم نعثر على نتائج مطابقة — جرّب «بحث في نور وكتبي والمحمية» أعلى الشاشة أو عدّل العنوان';
  }

  // ------------------------------------------------------------------ Discover / Categories
  function renderTasteProfileContent() {
    const profile = REC && REC.buildDecayedProfile ? REC.buildDecayedProfile() : null;
    const catEntries = profile && Object.keys(profile.cats || {}).length
      ? Object.entries(profile.cats).sort((a, b) => b[1] - a[1])
      : Object.entries(state.taste.cats || {}).sort((a, b) => b[1] - a[1]);
    const authWeights = Object.entries((profile && Object.keys(profile.authors || {}).length ? profile.authors : state.taste.authors) || {})
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sigCounts = (profile && profile.signalCounts) || {};
    const sigSummary = [];
    if (sigCounts.complete) sigSummary.push('إتمام +10 (' + sigCounts.complete + ')');
    if (sigCounts.favrate) sigSummary.push('تفضيل +8 (' + sigCounts.favrate + ')');
    if (sigCounts.download) sigSummary.push('تحميل +5 (' + sigCounts.download + ')');
    if (sigCounts.quote) sigSummary.push('اقتباس +4 (' + sigCounts.quote + ')');
    if (sigCounts.browse30s) sigSummary.push('تصفح +2 (' + sigCounts.browse30s + ')');
    if (sigCounts.abandon_early) sigSummary.push('انسحاب -3 (' + sigCounts.abandon_early + ')');

    const pills = [
      ...catEntries.filter(([, sc]) => sc > 0).map(([id, sc]) => {
        const c = CATS.CATEGORIES.find(x => x.id === id);
        return c ? '<span class="chip">' + catIcon(c.iconKey) + '<span>' + esc(c.name) + ' (+' + Math.round(sc) + ')</span></span>' : '';
      }),
      ...authWeights.filter(([, sc]) => sc > 0).map(([name]) => '<button class="chip" data-author="' + esc(name) + '">' + SVG.user + '<span>' + esc(name) + '</span></button>'),
      ...sigSummary.map(lbl => '<span class="chip signal-pill">' + esc(lbl) + '</span>'),
    ].filter(Boolean);
    if ($('tastePills')) {
      $('tastePills').innerHTML = pills.length ? pills.join('') : '<span style="font-size:12px;color:var(--muted)">حمّل كتاباً أو قيّمه أو أكمل القراءة لبناء خريطة ذوقك الهجينة...</span>';
    }

    const cohortsRow = $('tasteCohortsRow');
    if (cohortsRow && REC && REC.matchReaderCohorts && profile) {
      const cohorts = REC.matchReaderCohorts(profile).slice(0, 3);
      if (cohorts.length) {
        cohortsRow.classList.remove('hidden');
        cohortsRow.innerHTML = cohorts.map(c =>
          '<span class="cohort-pill">' + SVG.sparkle + '<span>' + esc(c.label) + ' (' + c.similarityPct + '%)</span></span>'
        ).join('');
      } else {
        cohortsRow.classList.add('hidden');
        cohortsRow.innerHTML = '';
      }
    }
  }

  function openTasteProfileModal() {
    renderTasteProfileContent();
    if ($('tasteProfileModal')) $('tasteProfileModal').classList.remove('hidden');
  }

  function renderDiscover(scrollToList) {
    const visibleContentCats = getVisibleCategories(false);
    if (!visibleContentCats.some(c => c.id === state.discCat)) {
      state.discCat = (visibleContentCats[0] && visibleContentCats[0].id) || 'mystery_classics';
    }
    $('catCards').innerHTML = visibleContentCats.map(c => {
      return '<div class="cat-tile ' + (state.discCat === c.id ? 'on' : '') + '" data-dcat="' + c.id + '">'
        + '<div class="cat-tile-ic">' + catIcon(c.iconKey) + '</div>'
        + '<div class="cat-tile-body">'
        + '<div class="cat-tile-top"><strong>' + esc(c.name) + '</strong></div>'
        + (c.sub ? '<small class="cat-tile-sub">' + esc(c.sub) + '</small>' : '')
        + '</div>'
        + '</div>';
    }).join('');
    $('catCards').querySelectorAll('.cat-tile').forEach(el => {
      el.onclick = () => {
        state.discCat = el.dataset.dcat;
        state.discSubCat = 'all';
        renderDiscover(true);
        fetchCategoryLiveBooks(state.discCat);
      };
    });
    if (scrollToList && $('discTitle')) {
      setTimeout(() => {
        try { $('discTitle').scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) { }
      }, 40);
    }

    if ($('tasteProfileModal') && !$('tasteProfileModal').classList.contains('hidden')) {
      renderTasteProfileContent();
    }

    const activeCat = CATS.CATEGORIES.find(c => c.id === state.discCat) || CATS.CATEGORIES[1];
    const subCatsMap = (CATS.SUBCATEGORIES && CATS.SUBCATEGORIES[activeCat.id]) || [];
    const subWrap = $('discSubCats');
    if (subWrap) {
      if (subCatsMap.length) {
        subWrap.classList.remove('hidden');
        subWrap.innerHTML = ['all', ...subCatsMap].map(sc => {
          const lbl = sc === 'all' ? 'الكل في ' + activeCat.name : sc;
          const on = (state.discSubCat || 'all') === sc;
          return '<button class="chip ' + (on ? 'on' : '') + '" data-dsub="' + esc(sc) + '">' + esc(lbl) + '</button>';
        }).join('');
        subWrap.querySelectorAll('button').forEach(btn => {
          btn.onclick = () => {
            state.discSubCat = btn.dataset.dsub || 'all';
            renderDiscover();
          };
        });
      } else {
        subWrap.classList.add('hidden');
        subWrap.innerHTML = '';
      }
    }

    const activeSub = state.discSubCat && state.discSubCat !== 'all' ? state.discSubCat : '';
    $('discTitle').textContent = activeSub ? ('الأشهر: ' + activeCat.name + ' - ' + activeSub) : ('الأشهر في ' + activeCat.name);
    const base = CATS.CURATED.filter(b => b.cat === activeCat.id && matchesPrefLang(b));
    const live = (state.liveCache.catLive[activeCat.id] || state.liveCache.disc[activeCat.id] || []).filter(matchesPrefLang);
    const seen = new Set();
    const list = [...base, ...live].map(b => REC ? REC.enrichBook(b) : b).filter(b => {
      if (activeSub && (b.subCat || '') !== activeSub) return false;
      const k = (b.title || '').toLowerCase().trim();
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => {
      const tA = REC && REC.scoreBookForTimeContext ? Number(REC.scoreBookForTimeContext(a, state.recTimeMode)) || 0 : 0;
      const tB = REC && REC.scoreBookForTimeContext ? Number(REC.scoreBookForTimeContext(b, state.recTimeMode)) || 0 : 0;
      const sA = scoreBookFame(a) + scoreBookByTaste(a) * 0.45 + tA + scorePrefLength(a) + tasteJitter(a, state.tasteRotation);
      const sB = scoreBookFame(b) + scoreBookByTaste(b) * 0.45 + tB + scorePrefLength(b) + tasteJitter(b, state.tasteRotation);
      return sB - sA;
    });
    renderCards($('discGrid'), interleaveByLengthMix(list));
    renderTelegramHub();
    if (!live.length && !state.catFetching[activeCat.id]) {
      setTimeout(() => {
        if (state.tab === 'discover' && state.discCat === activeCat.id) {
          fetchCategoryLiveBooks(activeCat.id);
        }
      }, 40);
    }
  }

  function getCustomTelegramList() {
    const raw = loadJson('wq_tg_custom', []);
    return Array.isArray(raw) ? raw : [];
  }

  function openTelegramWithBook(handle, queryText) {
    const cleanH = S.sanitizeTelegramHandle(handle);
    if (!cleanH) return;
    const cleanQ = S.cleanSearchTitle(queryText || '');
    if (cleanQ) {
      KTB.copy(cleanQ);
      KTB.toast('تم نسخ اسم الكتاب "' + cleanQ.slice(0, 32) + '" — الصقه داخل @' + cleanH);
    } else {
      KTB.toast('جاري فتح @' + cleanH + ' في تيليجرام...');
    }
    KTB.openUrl('https://t.me/' + encodeURIComponent(cleanH));
  }

  function renderTelegramHub() {
    const grid = $('tgHubGrid');
    if (!grid) return;
    const preset = Array.isArray(CATS.TELEGRAM_HUB) ? CATS.TELEGRAM_HUB : [];
    const custom = getCustomTelegramList();
    const all = [
      ...custom.map(c => ({
        handle: c.handle || c,
        name: '@' + (c.handle || c),
        kind: String(c.handle || c).toLowerCase().includes('bot') ? 'bot' : 'channel',
        webSearch: !String(c.handle || c).toLowerCase().includes('bot'),
        badge: 'مخصصة',
        desc: 'قناة أو بوت أضفته بنفسك للبحث داخل مداد',
        isCustom: true,
      })),
      ...preset,
    ];

    const cntBadge = $('tgHubCountBadge');
    if (cntBadge) cntBadge.textContent = String(all.length);

    const toggleBtn = $('tgHubToggleBtn');
    const bodyEl = $('tgHubBody');
    if (toggleBtn && bodyEl && !toggleBtn._wired) {
      toggleBtn._wired = true;
      toggleBtn.onclick = () => {
        const willOpen = bodyEl.classList.contains('hidden');
        bodyEl.classList.toggle('hidden', !willOpen);
        toggleBtn.classList.toggle('open', willOpen);
        toggleBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      };
    }

    grid.innerHTML = all.map(item =>
      '<div class="tg-hub-card">'
      + '<div><div class="tg-hub-card-top"><h4>' + esc(item.name) + '</h4>'
      + '<span class="dl-src-pill tg">' + esc(item.kind === 'bot' ? 'بوت' : 'قناة') + '</span></div>'
      + '<small title="' + esc(item.desc || '') + '">@' + esc(item.handle) + (item.desc ? (' • ' + esc(item.desc)) : '') + '</small></div>'
      + '<div class="tg-hub-actions">'
      + (item.webSearch
        ? '<button type="button" class="btn emerald sm" data-tg-scan="' + esc(item.handle) + '">تصفح</button>'
        : '<button type="button" class="btn emerald sm" data-tg-open="' + esc(item.handle) + '">' + SVG.telegram + '<span>فتح البوت</span></button>')
      + (item.webSearch ? '<button type="button" class="btn glass sm" data-tg-open="' + esc(item.handle) + '">خارجي</button>' : '')
      + (item.isCustom ? '<button type="button" class="btn glass sm" data-tg-del="' + esc(item.handle) + '">حذف</button>' : '')
      + '</div></div>'
    ).join('');

    grid.querySelectorAll('[data-tg-open]').forEach(btn => {
      btn.onclick = () => openTelegramWithBook(btn.dataset.tgOpen, '');
    });
    grid.querySelectorAll('[data-tg-scan]').forEach(btn => {
      btn.onclick = async () => {
        const h = btn.dataset.tgScan;
        switchTab('search');
        $('sourceScope').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.scope === 'telegram'));
        state.searchScope = 'telegram';
        $('q').value = 'رواية';
        $('qClear').classList.remove('hidden');
        $('searchStatusBar').classList.remove('hidden');
        $('searchStatusBar').innerHTML = '<span class="spin"></span><span>جاري جلب أحدث الكتب من قناة @' + esc(h) + '...</span>';
        $('searchEmpty').classList.add('hidden');
        const hits = await S.searchTelegramChannels('كتاب OR رواية OR pdf', { channels: [h], maxChannels: 1, limitPerCh: 12 }).catch(() => []);
        state.searchQuery = '@' + h;
        state.searchResults = hits;
        $('searchStatusBar').innerHTML = '<span>عثرنا على <strong>' + hits.length + '</strong> كتاب في قناة @' + esc(h) + '</span>';
        renderCards($('searchGrid'), hits);
      };
    });
    grid.querySelectorAll('[data-tg-del]').forEach(btn => {
      btn.onclick = () => {
        const h = btn.dataset.tgDel;
        const next = getCustomTelegramList().filter(x => (x.handle || x) !== h);
        saveJson('wq_tg_custom', next);
        renderTelegramHub();
        KTB.toast('تمت إزالة @' + h);
      };
    });

    const addBtn = $('tgAddBtn');
    const inp = $('tgCustomInput');
    if (addBtn && inp && !addBtn._wired) {
      addBtn._wired = true;
      addBtn.onclick = () => {
        const h = S.sanitizeTelegramHandle(inp.value);
        if (!h || h.length < 3) {
          KTB.toast('أدخل معرّف قناة أو بوت صحيح مثل @ketab_n');
          return;
        }
        const curr = getCustomTelegramList();
        if (!curr.some(x => (x.handle || x).toLowerCase() === h.toLowerCase())) {
          curr.unshift({ handle: h });
          saveJson('wq_tg_custom', curr);
        }
        inp.value = '';
        renderTelegramHub();
        KTB.toast('تمت إضافة @' + h + ' لقنوات البحث والتحميل');
      };
    }
  }

  async function loadMoreCategory() {
    const activeCat = CATS.CATEGORIES.find(c => c.id === state.discCat);
    if (!activeCat) return;
    KTB.toast('جاري جلب كتب حية في ' + activeCat.name + '...');
    await fetchCategoryLiveBooks(activeCat.id, true);
    renderDiscover();
  }

  // ------------------------------------------------------------------ Saved / Liked / History
  function renderSaved() {
    const list = state.savedSub === 'liked'
      ? state.liked
      : (state.savedSub === 'bookmarks' ? state.bookmarks : state.history);
    renderCards($('savedGrid'), list);
    $('savedEmpty').classList.toggle('hidden', list.length > 0);
  }

  // ------------------------------------------------------------------ Author Hub Page Modal
  async function openAuthorHub(rawAuthor) {
    const clean = S.cleanAuthorName(rawAuthor);
    if (!clean || clean === 'مؤلف غير محدد') {
      KTB.toast('لا يتوفر اسم كاتب واضح لهذا الكتاب');
      return;
    }
    state.currentAuthor = clean;
    $('authorModal').classList.remove('hidden');
    $('authorTopTitle').textContent = 'صفحة الكاتب: ' + clean;
    $('authorSearchAll').onclick = () => {
      $('authorModal').classList.add('hidden');
      $('bookModal').classList.add('hidden');
      $('q').value = clean;
      runSearch(clean);
    };

    const body = $('authorBody');
    const initials = clean.slice(0, 2).toUpperCase();
    body.innerHTML =
      '<div class="author-hero">'
      + '<div class="author-avatar" id="authAvatar">' + esc(initials) + '</div>'
      + '<div class="author-meta">'
      + '<h2>' + esc(clean) + '</h2>'
      + '<p id="authBioText">جاري جلب نبذة عن الكاتب وجمع مؤلفاته من المكتبات...</p>'
      + '<div id="authBadges" class="detail-badges"></div>'
      + '</div></div>'
      + '<div class="sec-head" style="margin-bottom:10px">'
      + '<div class="sec-title">' + SVG.bookOpen + '<span>مؤلفات وأعمال ' + esc(clean) + '</span></div>'
      + '<span class="sec-sub" id="authCountTxt">جاري البحث...</span>'
      + '</div>'
      + '<div id="authorGrid" class="book-grid"></div>';

    // Show instant local curated matches first
    const needle = clean.toLowerCase();
    const localAuthBooks = [...CATS.CURATED, ...BOOK_MAP.values()]
      .filter((b, idx, arr) => {
        const ba = String(b.author || '').toLowerCase();
        return (ba.includes(needle) || needle.split(/\s+/).every(w => w.length < 3 || ba.includes(w)))
          && arr.findIndex(x => x.title === b.title) === idx;
      });
    const grid = $('authorGrid');
    const renderedIds = new Set(localAuthBooks.map(b => S.normBook(b).id));
    if (localAuthBooks.length) {
      renderCards(grid, localAuthBooks);
      $('authCountTxt').textContent = localAuthBooks.length + ' عمل';
    }

    // Load Author Bio + Multi-Source Bibliography in parallel
    S.fetchAuthorBio(clean).then((bio) => {
      if (state.currentAuthor !== clean || !bio) return;
      if (bio.image) {
        const av = $('authAvatar');
        if (av) {
          av.outerHTML = '<img id="authAvatar" class="author-avatar" src="' + esc(bio.image) + '" alt="" onerror="this.style.display=\'none\'">';
        }
      }
      const bioEl = $('authBioText');
      if (bioEl) bioEl.textContent = bio.extract || ('كاتب ومؤلف بارز — يمكنك تصفح أعماله أدناه.');
      const badges = [];
      if (bio.birthDate) badges.push('<span class="d-badge">ميلاد: ' + esc(bio.birthDate) + '</span>');
      if (bio.workCount) badges.push('<span class="d-badge">الأعمال المفهرسة: ' + bio.workCount + '</span>');
      if (bio.topWork) badges.push('<span class="d-badge">أشهر عمل: ' + esc(bio.topWork) + '</span>');
      const bb = $('authBadges');
      if (bb) bb.innerHTML = badges.join('');
    });

    let total = localAuthBooks.length;
    await S.searchAuthorBooks(clean, (chunk) => {
      if (state.currentAuthor !== clean) return;
      const fresh = [];
      for (const b of chunk) {
        const nb = registerBook(b);
        if (renderedIds.has(nb.id)) continue;
        renderedIds.add(nb.id);
        fresh.push(nb);
        total++;
      }
      if (fresh.length) {
        appendCards(grid, fresh);
        const cnt = $('authCountTxt');
        if (cnt) cnt.textContent = total + ' كتاب ونسخة';
      }
    });
    if (state.currentAuthor === clean && total === 0) {
      grid.innerHTML = '<div class="empty-state"><p>لم نجد كتباً مباشرة بهذا الاسم — اضغط "بحث شامل باسم الكاتب" أعلاه لتجربة المحركات الإضافية.</p></div>';
    }
  }

  // ------------------------------------------------------------------ Downloads & Device Library (Grouped + Multi-Edition)
  let _confirmAction = null;
  function showConfirmDialog(title, msg, okLabel, onConfirm) {
    const modal = $('confirmModal');
    if (!modal) { if (onConfirm) onConfirm(); return; }
    $('confirmTitle').textContent = title || 'تأكيد الإجراء';
    $('confirmMsg').textContent = msg || '';
    $('confirmOk').textContent = okLabel || 'تأكيد';
    _confirmAction = onConfirm || null;
    modal.classList.remove('hidden');
  }

  let _ownedCacheVer = 1;
  let _ownedBuiltVer = -1;
  let _ownedVersionsCache = [];
  let _ownedMatchCache = new Map();
  let _lastAutoScanAt = 0;

  function invalidateOwnedCache() {
    _ownedCacheVer++;
    _ownedMatchCache.clear();
  }

  function syncDownloadsFromNative(rescanDevice) {
    if (!KTB.isAndroid()) return;
    state.downloads = KTB.getDownloads();
    for (const j of state.downloads) {
      if (j.status === 'done') state.seenDoneIds.add(j.id);
      if (j.status === 'error') state.seenErrIds.add(j.id);
    }
    state.localBooks = KTB.getLocalBooks();
    invalidateOwnedCache();
    if (rescanDevice && KTB.scanDeviceBooks) {
      _lastAutoScanAt = Date.now();
      KTB.scanDeviceBooks();
    }
    renderDownloads();
  }

  function formatBytes(b) {
    if (!b || b <= 0) return '';
    if (b < 1024 * 1024) return Math.round(b / 1024) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function compareOwnedCopies(a, b) {
    const ra = a.hasReadProgress ? 1 : 0;
    const rb = b.hasReadProgress ? 1 : 0;
    if (ra !== rb) return rb - ra;
    const la = Number(a.lastReadAt || 0);
    const lb = Number(b.lastReadAt || 0);
    if (la !== lb) return lb - la;
    const ca = a.isCloudOnly ? 0 : 1;
    const cb = b.isCloudOnly ? 0 : 1;
    if (ca !== cb) return cb - ca;
    const sa = a.sourceKind === 'midad' ? 2 : (a.sourceKind === 'picked' ? 1 : 0);
    const sb = b.sourceKind === 'midad' ? 2 : (b.sourceKind === 'picked' ? 1 : 0);
    if (sa !== sb) return sb - sa;
    const prefFmt = getPreferredFormat();
    const fmtRank = prefFmt === 'epub'
      ? { epub: 5, azw3: 4, pdf: 3, mobi: 2, fb2: 1 }
      : { pdf: 5, epub: 4, azw3: 3, mobi: 2, fb2: 1 };
    const fa = fmtRank[a.format] || 0;
    const fb = fmtRank[b.format] || 0;
    if (fa !== fb) return fb - fa;
    const qa = scoreEditionQuality(a.fileName || a.title, a.uri, a.sourceName || a.folder);
    const qb = scoreEditionQuality(b.fileName || b.title, b.uri, b.sourceName || b.folder);
    if (qa !== qb) return qb - qa;
    return (b.modifiedAt || 0) - (a.modifiedAt || 0);
  }

  function resolveCopyProgress(uri, title, nativeProgress, nativeLastReadAt) {
    const nt = typeof normBookText === 'function' ? normBookText(title || '') : '';
    const mapRec = (uri && state.readProgressMap[uri]) || (nt && state.readProgressMap['t:' + nt]) || null;
    const label = nativeProgress || (mapRec && mapRec.label) || '';
    const lastReadAt = Math.max(Number(nativeLastReadAt || 0), Number((mapRec && mapRec.lastReadAt) || 0));
    return {
      progressLabel: label,
      lastReadAt,
      hasReadProgress: Boolean(label || lastReadAt > 0),
    };
  }

  let _ownedBuiltSig = '';
  function computeOwnedSig() {
    const doneCnt = Array.isArray(state.downloads) ? state.downloads.reduce((c, j) => c + (j && j.status === 'done' ? 1 : 0), 0) : 0;
    return _ownedCacheVer + ':' + doneCnt + ':' + (state.deviceBooks ? state.deviceBooks.length : 0) + ':' + (state.localBooks ? state.localBooks.length : 0) + ':' + (state.cloudLibrary ? state.cloudLibrary.length : 0) + ':' + (state.hiddenWebUris ? state.hiddenWebUris.size : 0);
  }

  const AUDIO_EXT_RE = /^(mp3|m4b|m4a|ogg|opus|aac|wav|flac)$/i;
  const AUDIO_NAME_RE = /\.(mp3|m4b|m4a|ogg|opus|aac|wav|flac)(\?.*)?$/i;
  function isAudioFileItem(fmt, fileName, uri) {
    return AUDIO_EXT_RE.test(String(fmt || '').trim())
      || AUDIO_NAME_RE.test(String(fileName || '').trim())
      || AUDIO_NAME_RE.test(String(uri || '').trim());
  }

  function collectAllOwnedVersions() {
    const sigNow = computeOwnedSig();
    if (_ownedBuiltVer === _ownedCacheVer && _ownedBuiltSig === sigNow) {
      return _ownedVersionsCache;
    }
    const out = [];
    const seenUri = new Set();
    const seenSig = new Set();
    function pushVer(v) {
      const uri = String(v.uri || '').trim();
      if (!uri || seenUri.has(uri) || state.hiddenWebUris.has(uri)) return;
      if (isAudioFileItem(v.format, v.fileName, uri)) return;
      const fmtLow = String(v.format || 'pdf').toLowerCase();
      const isUserAdded = v.sourceKind === 'picked'
        || v.sourceKind === 'cloud'
        || v.sourceKind === 'midad'
        || !!getCustomBookTitle(uri, v.fileName, '');
      if (!isUserAdded) {
        if (!['pdf', 'epub', 'azw3', 'mobi', 'prc', 'fb2', 'djvu', 'cbz'].includes(fmtLow)) return;
        const pc = Number(v.pageCount || v.pages || 0);
        if (fmtLow === 'pdf' && pc > 0 && pc < 10) return;
        if (S && typeof S.isGenuineBookItem === 'function' && !S.isGenuineBookItem({ title: v.title || v.fileName, format: fmtLow, pages: pc })) {
          return;
        }
      }
      const fnLow = String(v.fileName || '').toLowerCase().trim();
      const sz = Number(v.sizeBytes || 0);
      const sig = fnLow && sz > 0 ? (fnLow + '|' + sz) : '';
      if (sig && (seenSig.has(sig) || state.hiddenWebUris.has('sig:' + sig))) return;
      seenUri.add(uri);
      if (sig) seenSig.add(sig);
      const pg = resolveCopyProgress(uri, v.title || v.fileName, v.progressLabel, v.lastReadAt);
      v.progressLabel = pg.progressLabel;
      v.lastReadAt = pg.lastReadAt;
      v.hasReadProgress = pg.hasReadProgress;
      v.isCloudOnly = uri.startsWith('scribd://') || uri.startsWith('webreader://');
      v.sourceName = resolveVersionSourceName(uri, v.fileName, v.title, v.sourceName, v.sourceKind, v.folder);
      out.push(v);
    }

    for (const j of (state.downloads || [])) {
      if (j.status !== 'done') continue;
      const uri = j.localUri || j.uri || '';
      if (!uri) continue;
      const fn = j.fileName || ((j.title || 'book') + '.' + (j.format || 'pdf'));
      pushVer({
        uri,
        fileName: fn,
        title: j.title || fn,
        format: String(j.format || fn.split('.').pop() || 'pdf').toLowerCase(),
        sizeBytes: Number(j.bytes || j.downloaded || 0),
        folder: (uri.startsWith('scribd://') || uri.startsWith('webreader://')) ? 'قراءة سحابية' : 'مجلد مداد',
        sourceKind: (uri.startsWith('scribd://') || uri.startsWith('webreader://')) ? 'cloud' : 'midad',
        sourceName: j.source || '',
        downloadId: j.id,
        modifiedAt: Number(j.createdAt || j.finishedAt || 0),
        progressLabel: '',
      });
    }
    for (const d of (state.deviceBooks || [])) {
      pushVer({
        uri: d.uri,
        fileName: d.fileName || d.title || 'book.pdf',
        title: d.title || d.fileName,
        format: String(d.format || 'pdf').toLowerCase(),
        sizeBytes: Number(d.size || 0),
        pageCount: Number(d.pageCount || d.pages || 0),
        folder: d.folder || 'الذاكرة',
        sourceKind: d.origin || 'device',
        sourceName: d.source || '',
        modifiedAt: Number(d.modifiedAt || 0),
        lastReadAt: Number(d.lastReadAt || 0),
        progressLabel: d.progressLabel || '',
      });
    }
    for (const lb of (state.localBooks || [])) {
      pushVer({
        uri: lb.uri,
        fileName: lb.fileName || lb.title || 'book.pdf',
        title: lb.title || lb.fileName,
        format: String(lb.format || 'pdf').toLowerCase(),
        sizeBytes: Number(lb.size || 0),
        folder: 'مضاف يدوياً',
        sourceKind: 'picked',
        sourceName: lb.source || '',
        modifiedAt: Number(lb.addedAt || 0),
        progressLabel: '',
      });
    }
    for (const cb of (state.cloudLibrary || [])) {
      pushVer({
        uri: cb.uri,
        fileName: cb.fileName || ((cb.title || 'book') + '.pdf'),
        title: cb.title || cb.fileName,
        format: String(cb.format || 'pdf').toLowerCase(),
        sizeBytes: 0,
        folder: 'قراءة سحابية • المكتبة',
        sourceKind: 'cloud',
        sourceName: cb.source || 'Scribd',
        downloadId: cb.downloadId || ('scribd_' + cb.docId),
        modifiedAt: Number(cb.addedAt || 0),
        lastReadAt: Number(cb.addedAt || 0),
        progressLabel: 'قيد القراءة • محفوظ للمكتبة',
      });
    }
    for (const v of out) {
      const cat = matchCatalogForFile(v.title || v.fileName);
      v._catId = cat ? cat.id : '';
      v._normTitle = normBookText(v.title || v.fileName);
      v._normStripped = v._normTitle.replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim();
    }
    _ownedVersionsCache = out;
    _ownedBuiltVer = _ownedCacheVer;
    _ownedBuiltSig = sigNow;
    _ownedMatchCache.clear();
    return out;
  }

  function findDownloadedMatches(book) {
    if (!book) return [];
    const ownedList = collectAllOwnedVersions();
    const cacheKey = (book.id || '') + '|' + (book.title || '');
    const hitCached = _ownedMatchCache.get(cacheKey);
    if (hitCached) return hitCached;

    const bookKeys = String(book.title || '').split('—').map(normBookText).filter(k => k.length >= 3);
    const fullNorm = normBookText(book.title || '');
    if (fullNorm.length >= 3 && !bookKeys.includes(fullNorm)) bookKeys.unshift(fullNorm);
    const strippedBookKeys = bookKeys.map(k => k.replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim()).filter(k => k.length >= 3);
    const allBookKeys = Array.from(new Set([...bookKeys, ...strippedBookKeys]));

    const matches = [];
    for (const v of ownedList) {
      const isDirectUri = !!(book.localUri && v.uri && v.uri === book.localUri);
      const isDirectId = isDirectUri || (v.downloadId && (v.downloadId === book.id || String(v.downloadId).startsWith(book.id + '_')));
      let isMatch = !!isDirectId;
      if (!isMatch) {
        if (v._catId && book.id && v._catId === book.id) {
          isMatch = true;
        } else {
          const vn = v._normTitle || normBookText(v.title || v.fileName);
          const vStripped = v._normStripped || vn.replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim();
          for (const k of allBookKeys) {
            if (k === vn || k === vStripped || (k.length >= 6 && vn.length >= 6 && (vn.includes(k) || k.includes(vn)))) {
              isMatch = true;
              break;
            }
          }
        }
      }
      if (isMatch) matches.push(v);
    }

    matches.sort(compareOwnedCopies);
    _ownedMatchCache.set(cacheKey, matches);
    return matches;
  }

  function findDownloadedMatch(book) {
    return findDownloadedMatches(book)[0] || null;
  }

  function stripExtAndCopyTags(raw) {
    if (S && typeof S.cleanDisplayBookTitle === 'function') {
      return S.cleanDisplayBookTitle(raw);
    }
    return String(raw || '')
      .replace(/\.(pdf|epub|azw3|mobi|prc|fb2|cbz|djvu|txt|md|html?|xhtml)$/i, '')
      .replace(/[_•|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normBookText(s) {
    return stripExtAndCopyTags(s)
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .toLowerCase()
      .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  let _catAliasMap = null;
  function getCatalogAliasMap() {
    if (_catAliasMap) return _catAliasMap;
    _catAliasMap = [];
    for (const c of (CATS.CURATED || [])) {
      const parts = String(c.title || '').split('—').map(normBookText).filter(x => x.length >= 3);
      if (parts.length) _catAliasMap.push({ book: c, keys: parts });
    }
    return _catAliasMap;
  }

  function matchCatalogForFile(rawTitle) {
    const nt = normBookText(rawTitle);
    if (!nt || nt.length < 3) return null;
    const strippedPrefix = nt.replace(/^(كتاب|رواية|قصة|موسوعة|ملخص)\s+/, '').trim();
    for (const entry of getCatalogAliasMap()) {
      for (const k of entry.keys) {
        if (k === nt || k === strippedPrefix || (nt.length >= 6 && k.length >= 6 && (nt.includes(k) || k.includes(nt)))) {
          return entry.book;
        }
      }
    }
    return null;
  }

  function groupLibraryKeyAndMeta(item) {
    const raw = item.title || item.fileName || '';
    const customName = getCustomBookTitle(item.uri, item.fileName, '');
    const catMatch = matchCatalogForFile(customName || raw);
    const cleaned = customName || ((S && typeof S.cleanDisplayBookTitle === 'function')
      ? S.cleanDisplayBookTitle(raw)
      : (stripExtAndCopyTags(raw).replace(/\s*[-–—]\s*(pdf|epub|azw3)$/i, '').trim() || raw));
    const dlMeta = lookupDlBookMeta(item.downloadId || item.uri, item.fileName, cleaned || raw);
    const memCov = LOCAL_PDF_COVERS[item.uri] || '';
    if (catMatch) {
      const gKey = 'cat:' + catMatch.id;
      const keyCustom = customName || getCustomBookTitle(item.uri, item.fileName, gKey);
      return {
        key: gKey,
        displayTitle: keyCustom || catMatch.title,
        author: catMatch.author || (dlMeta && dlMeta.author) || '',
        cover: safeBookCoverUrl(catMatch) || (dlMeta && dlMeta.cover) || memCov || '',
        cat: catMatch.cat || '',
        lang: catMatch.lang || 'ar',
      };
    }
    const base = normBookText(raw).replace(/^(كتاب|رواية)\s+/, '').trim();
    const isAr = /[\u0600-\u06FF]/.test(cleaned);
    const compact = base.replace(/\s+/g, '');
    const rawKey = 'raw:' + (compact || String(item.fileName || item.uri).toLowerCase());
    const keyCustom = customName || getCustomBookTitle(item.uri, item.fileName, rawKey);
    const cachedCov = LOCAL_PDF_COVERS[rawKey] || COVER_CACHE[rawKey] || COVER_CACHE['lib_' + compact] || '';
    return {
      key: rawKey,
      displayTitle: keyCustom || cleaned || raw,
      author: (dlMeta && dlMeta.author) || '',
      cover: (dlMeta && dlMeta.cover) || memCov || cachedCov || '',
      cat: (dlMeta && dlMeta.cat) || '',
      lang: isAr ? 'ar' : 'en',
    };
  }

  function resolveLibraryGroupBook(g) {
    if (!g) return null;
    const ver = (g.versions && g.versions[0]) || {};
    const catMatch = (typeof g.key === 'string' && g.key.startsWith('cat:'))
      ? ((CATS.CURATED || []).find(c => ('cat:' + c.id) === g.key) || matchCatalogForFile(g.title))
      : matchCatalogForFile(g.title);
    if (catMatch) return registerBook(catMatch);

    if (ver.downloadId) {
      const baseId = String(ver.downloadId).replace(/_(pdf|epub|azw3|mobi|fb2|txt)$/i, '');
      if (BOOK_MAP.has(baseId)) return BOOK_MAP.get(baseId);
      const likedById = state.liked.find(x => x && x.id === baseId);
      if (likedById) return registerBook(likedById);
    }

    const gUris = new Set((g.versions || []).map(v => v && v.uri).filter(Boolean));
    const likedByUri = state.liked.find(x => x && x.localUri && gUris.has(x.localUri));
    if (likedByUri) return registerBook(likedByUri);

    const cleanNorm = normBookText(g.title || ver.fileName || '');
    const likedByNorm = state.liked.find(x => {
      const xn = normBookText(x && x.title);
      return xn && cleanNorm && (xn === cleanNorm || (xn.length >= 6 && cleanNorm.length >= 6 && (xn.includes(cleanNorm) || cleanNorm.includes(xn))));
    });
    if (likedByNorm) return registerBook(likedByNorm);

    const safeSlug = String(g.key || cleanNorm || ver.uri || '').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g, '_').slice(0, 64);
    return registerBook({
      id: 'lib_' + (safeSlug || Date.now()),
      title: g.title || ver.title || ver.fileName || 'كتاب محمل',
      author: g.author || 'من مكتبتي المحملة',
      cover: g.cover || '',
      cat: g.cat || '',
      lang: g.lang || (/[\u0600-\u06FF]/.test(g.title || '') ? 'ar' : 'en'),
      format: ver.format || 'pdf',
      source: ver.sourceName || ver.folder || 'مكتبتي',
      localUri: ver.uri || '',
      fileName: ver.fileName || '',
      url: ver.uri || '',
    });
  }

  function isLibraryGroupLiked(g) {
    if (!g) return false;
    const bk = resolveLibraryGroupBook(g);
    if (bk && isLiked(bk.id)) return true;
    const gUris = new Set((g.versions || []).map(v => v && v.uri).filter(Boolean));
    return state.liked.some(x => x && x.localUri && gUris.has(x.localUri));
  }

  function buildGroupedLibrary() {
    const rawVersions = collectAllOwnedVersions();

    const groupsMap = new Map();
    for (const v of rawVersions) {
      const meta = groupLibraryKeyAndMeta(v);
      let g = groupsMap.get(meta.key);
      if (!g) {
        g = {
          key: meta.key,
          title: meta.displayTitle,
          author: meta.author,
          cover: meta.cover,
          cat: meta.cat,
          lang: meta.lang,
          versions: [],
        };
        groupsMap.set(meta.key, g);
      } else {
        if (!g.cover && meta.cover) g.cover = meta.cover;
        if (!g.author && meta.author) g.author = meta.author;
        if (meta.displayTitle.length > 3 && meta.displayTitle.length < g.title.length + 12 && !/\(\d+\)$/.test(meta.displayTitle)) {
          if (meta.key.startsWith('cat:')) g.title = meta.displayTitle;
        }
      }
      g.versions.push(v);
    }

    const groups = Array.from(groupsMap.values());
    for (const g of groups) {
      g.versions.sort(compareOwnedCopies);
      g.hasProgress = g.versions.some(v => !!v.hasReadProgress || !!v.progressLabel);
      g.maxReadAt = g.versions.reduce((m, v) => Math.max(m, Number(v.lastReadAt || 0)), 0);
      g.maxMod = g.versions.reduce((m, v) => Math.max(m, v.modifiedAt || 0), 0);
      g.maxSize = g.versions.reduce((m, v) => Math.max(m, v.sizeBytes || 0), 0);
    }

    const sortMode = state.libSort || 'smart';
    groups.sort((a, b) => {
      if (sortMode === 'title_asc') {
        return String(a.title || '').localeCompare(String(b.title || ''), 'ar');
      }
      if (sortMode === 'size_desc') {
        if (a.maxSize !== b.maxSize) return b.maxSize - a.maxSize;
        return (b.maxMod || 0) - (a.maxMod || 0);
      }
      if (sortMode === 'newest') {
        return (b.maxMod || 0) - (a.maxMod || 0);
      }
      if (sortMode === 'copies_desc') {
        if (a.versions.length !== b.versions.length) return b.versions.length - a.versions.length;
        return (b.maxMod || 0) - (a.maxMod || 0);
      }
      if (a.hasProgress !== b.hasProgress) return a.hasProgress ? -1 : 1;
      if (a.maxReadAt !== b.maxReadAt) return (b.maxReadAt || 0) - (a.maxReadAt || 0);
      if ((a.versions.length > 1) !== (b.versions.length > 1)) return a.versions.length > 1 ? -1 : 1;
      return (b.maxMod || 0) - (a.maxMod || 0);
    });
    return groups;
  }

  let _prepTicker = null;
  function getDisplayDownloadPct(job) {
    if (!job) return 0;
    if (job._isPrep) return Math.max(1, Math.min(45, Math.round(Number(job.percent || 1))));
    const raw = Math.max(0, Math.min(100, Number(job.percent >= 0 ? job.percent : 0)));
    const hadPrep = state.bookHadPrep.has(job.id)
      || Array.from(state.bookHadPrep.keys()).some(bid => job.id === bid || String(job.id || '').startsWith(bid + '_'));
    if (hadPrep) return Math.max(45, Math.min(100, 45 + Math.round(raw * 0.55)));
    return raw;
  }

  const _doneBarCleanTimers = new Map();

  function cancelDoneBarCleanup(bookId) {
    if (!bookId || !_doneBarCleanTimers.has(bookId)) return;
    clearTimeout(_doneBarCleanTimers.get(bookId));
    _doneBarCleanTimers.delete(bookId);
  }

  function resolveRowProgKey(o, link) {
    if (o && o.progKey) return String(o.progKey);
    const engId = (o && o.engId) || (link && link.engId) || '';
    if (engId) return 'eng:' + engId;
    return String((o && o.linkUrl) || (link && link.url) || '');
  }

  function doesRowMatchActiveJob(bookId, progKey, linkUrl, srcName, rowFmt, activeJob) {
    if (!activeJob) return false;
    if (activeJob.engId) return progKey === ('eng:' + activeJob.engId);
    if (activeJob.linkUrl) return (progKey && progKey === activeJob.linkUrl) || (linkUrl && linkUrl === activeJob.linkUrl);
    const trackedKey = bookId ? (state.activeRowKeyByBook.get(bookId) || '') : '';
    if (trackedKey) return (progKey && progKey === trackedKey) || (linkUrl && linkUrl === trackedKey);
    const jobSrc = activeJob.source || '';
    const jobFmt = String(activeJob.format || (activeJob.id && activeJob.id.includes('_') ? activeJob.id.split('_').pop() : '') || '').toLowerCase();
    const srcOk = !!(jobSrc && srcName && srcName.includes(jobSrc));
    if (!srcOk) return false;
    if (jobFmt && rowFmt) return rowFmt.toLowerCase().includes(jobFmt);
    return true;
  }

  function setRowProgressUi(row, text, pct) {
    let pBox = row.querySelector('.dl-row-progress-wrap');
    if (!pBox) {
      pBox = document.createElement('div');
      pBox.className = 'dl-row-progress-wrap';
      pBox.innerHTML = '<div class="dl-row-progress-meta"><span class="dl-prog-txt"></span><span class="dl-prog-pct"></span></div><div class="dl-row-progress-track"><div class="dl-row-progress-fill"></div></div>';
      row.appendChild(pBox);
    }
    const txtEl = pBox.querySelector('.dl-prog-txt');
    const pctEl = pBox.querySelector('.dl-prog-pct');
    const fillEl = pBox.querySelector('.dl-row-progress-fill');
    if (txtEl) txtEl.textContent = text;
    if (pctEl) pctEl.textContent = pct + '%';
    if (fillEl) fillEl.style.width = pct + '%';
  }

  function startPrepProgress(book, sourceName, initialText, opts) {
    if (!book || !book.id) return;
    cancelDoneBarCleanup(book.id);
    const o = opts || {};
    const job = {
      id: book.id,
      bookId: book.id,
      title: book.title || '',
      format: (book.format || 'pdf').toLowerCase(),
      source: sourceName || book.source || 'مكتبة نور',
      linkUrl: o.linkUrl || '',
      engId: o.engId || '',
      status: 'preparing',
      percent: 4,
      timerSec: 0,
      phaseText: initialText || ('جاري تجهيز الكتاب من ' + (sourceName || 'المصدر') + '...'),
      startedAt: Date.now(),
      _isPrep: true,
    };
    const rowKey = resolveRowProgKey(o, null);
    if (rowKey) state.activeRowKeyByBook.set(book.id, rowKey);
    state.prepJobs.set(book.id, job);
    state.bookHadPrep.set(book.id, { source: job.source });
    if (!_prepTicker) {
      _prepTicker = setInterval(() => {
        if (!state.prepJobs.size) {
          clearInterval(_prepTicker);
          _prepTicker = null;
          return;
        }
        const now = Date.now();
        for (const pj of state.prepJobs.values()) {
          if (pj.timerSec <= 0 && pj.percent < 41) {
            const target = Math.min(41, 4 + Math.floor((now - pj.startedAt) / 600));
            if (target > pj.percent) pj.percent = target;
          }
          updateLivePrepDom(pj.bookId);
        }
        refreshActiveDownloadCardsOnly();
      }, 420);
    }
    updateLivePrepDom(book.id);
    renderActiveDownloadQueue();
    refreshActiveDownloadCardsOnly();
  }

  function stopPrepProgress(bookId, keepHadPrepFlag) {
    if (!bookId) return;
    state.prepJobs.delete(bookId);
    if (!keepHadPrepFlag) {
      state.bookHadPrep.delete(bookId);
    }
    updateLivePrepDom(bookId);
    renderActiveDownloadQueue();
    refreshOwnedCardBadges();
  }

  function updateLivePrepDom(bookId, justFinishedJob) {
    const activeJob = findActiveDownloadJob({ id: bookId });
    const pct = activeJob ? getDisplayDownloadPct(activeJob) : -1;
    const modalOpen = state.currentModalBook && state.currentModalBook.id === bookId && $('bookModal') && !$('bookModal').classList.contains('hidden');
    if (modalOpen) {
      const qBtn = $('detailQuickDlBtn');
      if (qBtn) {
        if (activeJob) {
          qBtn.classList.add('has-prog');
          let fill = qBtn.querySelector('.btn-prog-bar');
          if (!fill) {
            fill = document.createElement('span');
            fill.className = 'btn-prog-bar';
            qBtn.prepend(fill);
          }
          fill.style.width = pct + '%';
          const sp = qBtn.querySelector('span:not(.btn-prog-bar):not(.spin)');
          if (sp) sp.textContent = (activeJob._isPrep ? 'تجهيز الكتاب ' : 'جاري التحميل ') + pct + '%';
        } else if (justFinishedJob && justFinishedJob.status === 'done') {
          const fill = qBtn.querySelector('.btn-prog-bar');
          if (fill) fill.style.width = '100%';
          const sp = qBtn.querySelector('span:not(.btn-prog-bar):not(.spin)');
          if (sp && qBtn.classList.contains('has-prog')) sp.textContent = 'اكتمل التحميل 100%';
        } else {
          qBtn.classList.remove('has-prog');
          const fill = qBtn.querySelector('.btn-prog-bar');
          if (fill) fill.remove();
        }
      }
      const listHost = $('detailLinksList');
      if (listHost) {
        const rows = Array.from(listHost.querySelectorAll('[data-prog-key]'));
        if (activeJob) {
          cancelDoneBarCleanup(bookId);
          let matchedOne = false;
          rows.forEach(row => {
            const pk = row.dataset.progKey || '';
            const rUrl = row.dataset.rowUrl || pk;
            const rSrc = row.dataset.rowSrc || row.textContent || '';
            const rFmt = row.dataset.rowFmt || '';
            const matchRow = !matchedOne && doesRowMatchActiveJob(bookId, pk, rUrl, rSrc, rFmt, activeJob);
            if (matchRow) {
              matchedOne = true;
              setRowProgressUi(row, activeJob.phaseText || ('جاري التحميل من ' + (activeJob.source || 'المصدر') + '...'), pct);
            } else {
              const oldBox = row.querySelector('.dl-row-progress-wrap');
              if (oldBox) oldBox.remove();
            }
          });
        } else if (justFinishedJob && justFinishedJob.status === 'done') {
          let shownDone = false;
          rows.forEach(row => {
            const pk = row.dataset.progKey || '';
            const rUrl = row.dataset.rowUrl || pk;
            const rSrc = row.dataset.rowSrc || row.textContent || '';
            const rFmt = row.dataset.rowFmt || '';
            const hadBar = !!row.querySelector('.dl-row-progress-wrap');
            const matchDone = !shownDone && (doesRowMatchActiveJob(bookId, pk, rUrl, rSrc, rFmt, justFinishedJob) || hadBar);
            if (matchDone) {
              shownDone = true;
              setRowProgressUi(row, '100% • اكتمل التحميل بنجاح', 100);
            } else {
              const oldBox = row.querySelector('.dl-row-progress-wrap');
              if (oldBox) oldBox.remove();
            }
          });
          cancelDoneBarCleanup(bookId);
          _doneBarCleanTimers.set(bookId, setTimeout(() => {
            _doneBarCleanTimers.delete(bookId);
            if (!findActiveDownloadJob({ id: bookId })) {
              state.activeRowKeyByBook.delete(bookId);
              const lh = $('detailLinksList');
              if (lh) lh.querySelectorAll('.dl-row-progress-wrap').forEach(el => el.remove());
              const qb = $('detailQuickDlBtn');
              if (qb) {
                qb.classList.remove('has-prog');
                const fl = qb.querySelector('.btn-prog-bar');
                if (fl) fl.remove();
              }
            }
          }, 850));
        } else {
          cancelDoneBarCleanup(bookId);
          if (!state.prepJobs.has(bookId)) state.activeRowKeyByBook.delete(bookId);
          rows.forEach(row => {
            const oldBox = row.querySelector('.dl-row-progress-wrap');
            if (oldBox) oldBox.remove();
          });
        }
      }
    } else if (!activeJob && !state.prepJobs.has(bookId)) {
      state.activeRowKeyByBook.delete(bookId);
    }
    if (state.activeScribdBook && state.activeScribdBook.id === bookId) {
      updateScribdReaderDlPill(bookId);
    }
  }

  function renderActiveDownloadQueue() {
    const prepList = Array.from(state.prepJobs.values());
    const activeJobs = [
      ...prepList,
      ...state.downloads.filter(d => d.status === 'downloading' || d.status === 'queued'),
    ];
    const cleanableJobs = state.downloads.filter(d => d.status === 'done' || d.status === 'error' || d.status === 'canceled' || d.status === 'cancelled');
    const queuedOrErrJobs = [
      ...prepList,
      ...state.downloads.filter(d => d.status !== 'done'),
    ];
    const badge = $('dlBadge');
    if (badge) badge.classList.add('hidden');

    const clearBtn = $('btnClearDone');
    if (clearBtn) {
      clearBtn.disabled = cleanableJobs.length === 0;
      const lbl = clearBtn.querySelector('span');
      if (lbl) lbl.textContent = cleanableJobs.length ? ('تنظيف سجل المكتمل (' + cleanableJobs.length + ')') : 'تنظيف سجل التحميلات المكتملة';
    }

    const actWrap = $('dlActiveWrap');
    const actList = $('dlActiveList');
    if (actWrap && actList) {
      if (queuedOrErrJobs.length) {
        actWrap.classList.remove('hidden');
        actList.innerHTML = queuedOrErrJobs.map(j => {
          const isPrep = !!j._isPrep;
          const err = j.status === 'error';
          const can = j.status === 'canceled' || j.status === 'cancelled';
          const running = isPrep || j.status === 'downloading' || j.status === 'queued';
          const pct = getDisplayDownloadPct(j);
          const bytes = j.downloaded || j.bytes || 0;
          const srcTxt = j.source ? (' • ' + j.source) : '';
          const meta = err ? ('فشل التحميل: ' + esc(j.error || 'تعذر التحميل'))
            : can ? 'تم إيقاف التحميل'
              : isPrep ? (esc(j.phaseText || 'جاري تجهيز التحميل...') + ' (' + pct + '%)')
                : (pct + '%' + (bytes ? (' • ' + formatBytes(bytes)) : '') + srcTxt);
          return '<div class="dl-item"><div class="dl-info"><strong>' + esc(j.title) + '</strong><small>' + meta + '</small>'
            + (running ? '<div class="pbar"><span style="width:' + pct + '%"></span></div>' : '')
            + '</div><div style="display:flex;gap:6px">'
            + (isPrep
              ? '<button class="btn glass sm" data-cancel-prep="' + esc(j.bookId) + '">إيقاف</button>'
              : (running ? '<button class="btn glass sm" data-cancel-id="' + esc(j.id) + '">إيقاف</button>'
                : '<button class="btn glass sm" data-rm-id="' + esc(j.id) + '">إزالة</button>'))
            + '</div></div>';
        }).join('');
        actList.querySelectorAll('[data-cancel-prep]').forEach(b => {
          b.onclick = () => {
            if (KTB.cancelSolve) KTB.cancelSolve();
            stopPrepProgress(b.dataset.cancelPrep, false);
          };
        });
        actList.querySelectorAll('[data-cancel-id]').forEach(b => {
          b.onclick = () => KTB.cancelDownload(b.dataset.cancelId);
        });
        actList.querySelectorAll('[data-rm-id]').forEach(b => {
          b.onclick = () => { KTB.removeDownload(b.dataset.rmId); syncDownloadsFromNative(); };
        });
      } else {
        actWrap.classList.add('hidden');
        actList.innerHTML = '';
      }
    }
    return { activeJobs, queuedOrErrJobs };
  }

  function renderDownloads() {
    const { activeJobs, queuedOrErrJobs } = renderActiveDownloadQueue();

    const banner = $('libAccessBanner');
    if (banner) {
      const needPerm = KTB.isAndroid() && KTB.hasStorageAccess && !KTB.hasStorageAccess();
      banner.classList.toggle('hidden', !needPerm);
    }

    // Unified Device + Midad Grouped Bookshelf
    const allGroups = buildGroupedLibrary();
    const multiCount = allGroups.filter(g => g.versions.length > 1).length;
    const readingCount = allGroups.filter(g => g.hasProgress).length;
    const favCount = allGroups.filter(isLibraryGroupLiked).length;
    const totalFiles = allGroups.reduce((s, g) => s + g.versions.length, 0);

    const statsRow = $('libStatsRow');
    if (statsRow) {
      statsRow.innerHTML =
        '<span class="lib-stat-chip">' + allGroups.length + ' كتاب' + (totalFiles > allGroups.length ? (' (' + totalFiles + ' ملف)') : '') + '</span>'
        + (multiCount ? '<span class="lib-stat-chip hi">' + multiCount + ' كتب بنسخ متعددة</span>' : '')
        + (readingCount ? '<span class="lib-stat-chip">' + readingCount + ' قيد القراءة</span>' : '')
        + (favCount ? '<span class="lib-stat-chip">' + favCount + ' في المفضلة</span>' : '')
        + (activeJobs.length ? '<span class="lib-stat-chip hi">' + activeJobs.length + ' جاري التحميل</span>' : '');
    }

    const toolbar = $('libToolbar');
    const gridEl = $('libGroupedGrid');
    const emptyEl = $('dlEmpty');
    const hasAny = allGroups.length > 0 || queuedOrErrJobs.length > 0;
    if (emptyEl) emptyEl.classList.toggle('hidden', hasAny);
    if (toolbar) toolbar.classList.toggle('hidden', allGroups.length === 0);

    if (!allGroups.length) {
      if (gridEl) gridEl.innerHTML = '';
      return;
    }

    const filterDefs = [
      { id: 'all', name: 'الكل (' + allGroups.length + ')' },
      ...(favCount ? [{ id: 'fav', name: 'المفضلة (' + favCount + ')' }] : []),
      ...(multiCount ? [{ id: 'multi', name: 'نسخ متعددة (' + multiCount + ')' }] : []),
      ...(readingCount ? [{ id: 'reading', name: 'قيد القراءة (' + readingCount + ')' }] : []),
      { id: 'midad', name: 'تحميلات مداد' },
      { id: 'pdf', name: 'PDF' },
      { id: 'epub', name: 'EPUB' },
      { id: 'ebook', name: 'AZW3 / MOBI' },
    ];
    if (!filterDefs.some(f => f.id === state.libFilter)) state.libFilter = 'all';

    const pillsEl = $('libFilterPills');
    if (pillsEl) {
      pillsEl.innerHTML = filterDefs.map(f =>
        '<button type="button" class="chip ' + (state.libFilter === f.id ? 'on' : '') + '" data-lib-flt="' + esc(f.id) + '">' + esc(f.name) + '</button>'
      ).join('');
      pillsEl.querySelectorAll('[data-lib-flt]').forEach(btn => {
        btn.onclick = () => {
          state.libFilter = btn.dataset.libFlt;
          renderDownloads();
        };
      });
    }

    function saveLibFolders() {
      saveJson('wq_lib_folders', state.libFolders || []);
    }

    function assignBookKeysToFolder(folderId, keys, exclusive) {
      if (!folderId || !Array.isArray(keys)) return;
      const keySet = new Set(keys.filter(Boolean));
      const next = (state.libFolders || []).map(f => {
        const cur = Array.isArray(f.bookKeys) ? f.bookKeys : [];
        if (f.id === folderId) {
          return Object.assign({}, f, { bookKeys: Array.from(new Set([...cur, ...keySet])) });
        }
        return exclusive
          ? Object.assign({}, f, { bookKeys: cur.filter(k => !keySet.has(k)) })
          : f;
      });
      state.libFolders = next;
      saveLibFolders();
    }

    function removeBookKeyFromFolder(folderId, bookKey) {
      state.libFolders = (state.libFolders || []).map(f =>
        f.id === folderId
          ? Object.assign({}, f, { bookKeys: (f.bookKeys || []).filter(k => k !== bookKey) })
          : f
      );
      saveLibFolders();
    }

    function deleteLibFolderOnly(folderId) {
      state.libFolders = (state.libFolders || []).filter(f => f.id !== folderId);
      if (state.libOpenFolderId === folderId) state.libOpenFolderId = '';
      saveLibFolders();
    }

    function bindCardTapAndLongPress(el, onTap, onLongPress) {
      if (!el) return;
      let timer = null;
      let startX = 0;
      let startY = 0;
      let firedLong = false;
      const clearT = () => { if (timer) { clearTimeout(timer); timer = null; } };
      el.addEventListener('pointerdown', (e) => {
        if (e.button === 2) return;
        firedLong = false;
        startX = e.clientX || 0;
        startY = e.clientY || 0;
        clearT();
        timer = setTimeout(() => {
          timer = null;
          firedLong = true;
          if (KTB.haptic) KTB.haptic('heavy');
          if (onLongPress) onLongPress(e);
        }, 460);
      });
      el.addEventListener('pointermove', (e) => {
        if (!timer) return;
        if (Math.abs((e.clientX || 0) - startX) > 10 || Math.abs((e.clientY || 0) - startY) > 10) clearT();
      });
      el.addEventListener('pointerup', clearT);
      el.addEventListener('pointercancel', clearT);
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        clearT();
        firedLong = true;
        if (onLongPress) onLongPress(e);
      });
      el.addEventListener('click', (e) => {
        if (firedLong) {
          firedLong = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (e.target && e.target.closest('button, a, input, select')) return;
        if (onTap) onTap(e);
      });
    }

    function buildFolderMosaicHtml(containedBooks) {
      const books = (containedBooks || []).slice(0, 4);
      if (!books.length) {
        return '<div class="lib-folder-mosaic"><div class="lib-folder-empty-ic">' + SVG.folder + '<span>مجلد فارغ</span></div></div>';
      }
      return '<div class="lib-folder-mosaic">'
        + books.map(b => {
          const isAr = b.lang === 'ar' || /[\u0600-\u06FF]/.test(b.title);
          const [c1, c2] = coverColors(b.title, b.cat, isAr);
          return '<div class="lib-folder-mini" style="background:linear-gradient(155deg,' + c1 + ',' + c2 + ')">'
            + '<span>' + esc(String(b.title || '').slice(0, 14)) + '</span>'
            + (b.cover ? '<img src="' + esc(b.cover) + '" alt="" onload="window.__midadImgLoad(this)" onerror="this.remove()">' : '')
            + '</div>';
        }).join('')
        + '</div>';
    }

    function renderFolderCardHtml(folder, containedBooks, compactMode) {
      const count = containedBooks.length;
      const mosaic = buildFolderMosaicHtml(containedBooks);
      if (compactMode) {
        return '<article class="lib-folder-card compact" data-lib-folder="' + esc(folder.id) + '" title="' + esc(folder.name + ' (' + count + ')') + '">'
          + '<div class="lib-compact-cover is-folder">' + mosaic + '</div>'
          + '<div class="lib-compact-title">' + esc(folder.name) + ' (' + count + ')</div>'
          + '</article>';
      }
      const previewTitles = containedBooks.slice(0, 3).map(b => b.title).join(' • ');
      return '<article class="lib-folder-card" data-lib-folder="' + esc(folder.id) + '">'
        + '<div class="lib-thumb">' + mosaic + '</div>'
        + '<div class="lib-body">'
        + '<div>'
        + '<div class="lib-top-row">'
        + '<div class="lib-title">' + esc(folder.name) + '</div>'
        + '<span class="lib-multi-badge">' + count + ' كتاب</span>'
        + '</div>'
        + '<div class="lib-meta-line" style="margin-top:4px">'
        + '<span class="source-origin-pill">مجلد مخصص</span>'
        + (previewTitles ? ('<span>' + esc(previewTitles) + '</span>') : '<span>مجلد فارغ</span>')
        + '</div></div>'
        + '<div class="lib-card-acts">'
        + '<button type="button" class="btn emerald sm" data-open-folder="' + esc(folder.id) + '">' + SVG.folder + '<span>فتح المجلد</span></button>'
        + '<button type="button" class="btn glass sm" data-edit-folder="' + esc(folder.id) + '">إدارة الكتب والاسم</button>'
        + '<button type="button" class="btn glass sm" data-ungroup-folder="' + esc(folder.id) + '">فك المجلد</button>'
        + '</div></div></article>';
    }

    function renderLibraryBookCardHtml(g, compactMode, extraFolderName) {
      const idxRaw = state.libSelectedVer[g.key];
      const selIdx = (typeof idxRaw === 'number' && idxRaw >= 0 && idxRaw < g.versions.length) ? idxRaw : 0;
      const activeVer = g.versions[selIdx];
      const isAr = g.lang === 'ar' || /[\u0600-\u06FF]/.test(g.title);
      const [c1, c2] = coverColors(g.title, g.cat, isAr);
      const liked = isLibraryGroupLiked(g);

      if (compactMode) {
        return '<article class="lib-card compact ' + (g.versions.length > 1 ? 'has-multi' : '') + '" data-lib-group="' + esc(g.key) + '">'
          + '<div class="lib-compact-cover">'
          + '<div class="lib-thumb-mono' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + '">' + coverInnerHtml({ title: g.title, author: g.author || '', cat: g.cat || '', lang: isAr ? 'ar' : 'en' }) + '</div>'
          + (g.cover ? '<img src="' + esc(g.cover) + '" alt="" style="opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">' : '')
          + (liked ? '<span class="lib-compact-fav" title="في المفضلة">' + SVG.heartFill + '</span>' : '')
          + '</div>'
          + '<div class="lib-compact-title">' + esc(g.title) + '</div>'
          + '</article>';
      }

      const thumbHtml =
        '<div class="lib-thumb">'
        + '<div class="lib-thumb-mono' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + '">' + coverInnerHtml({ title: g.title, author: g.author || '', cat: g.cat || '', lang: isAr ? 'ar' : 'en' }) + '</div>'
        + (g.cover ? '<img src="' + esc(g.cover) + '" alt="" style="opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">' : '')
        + '</div>';

      let editionsHtml = '';
      if (g.versions.length > 1) {
        editionsHtml = '<div class="lib-editions">'
          + g.versions.map((v, i) => {
            const sz = formatBytes(v.sizeBytes);
            const parts = [];
            if (v.sourceName) parts.push(v.sourceName);
            if (sz) parts.push(sz);
            return '<button type="button" class="lib-ed-btn ' + (i === selIdx ? 'on' : '') + '" data-pick-key="' + esc(g.key) + '" data-pick-idx="' + i + '">'
              + (v.hasReadProgress ? '<span class="lib-prog-pill" style="font-size:10px;padding:1px 6px">مقروء</span>' : '')
              + '<span class="lib-ed-fmt">' + esc(v.format) + '</span>'
              + (parts.length ? '<span>' + esc(parts.join(' • ')) + '</span>' : '')
              + '</button>';
          }).join('')
          + '</div>';
      }

      const szActive = formatBytes(activeVer.sizeBytes);
      const metaBits = [
        extraFolderName ? ('<span class="lib-prog-pill">مجلد: ' + esc(extraFolderName) + '</span>') : '',
        '<span class="source-origin-pill">من: ' + esc(activeVer.sourceName || activeVer.folder || 'مداد') + '</span>',
        '<span>' + esc(activeVer.format.toUpperCase()) + '</span>',
        szActive ? ('<span>' + esc(szActive) + '</span>') : '',
        activeVer.folder ? ('<span>' + esc(activeVer.folder) + '</span>') : '',
      ].filter(Boolean).join('');

      const progBadge = activeVer.progressLabel
        ? '<span class="read-prio-pill">' + esc(activeVer.progressLabel) + '</span>'
        : '';
      const pctM = String(activeVer.progressLabel || '').match(/(\d{1,3})\s*%/);
      const pctNum = pctM ? Math.max(2, Math.min(100, parseInt(pctM[1], 10))) : 0;
      const readBarHtml = pctNum > 0
        ? '<div class="lib-read-track"><div class="lib-read-fill" style="width:' + pctNum + '%"></div></div>'
        : '';

      return '<article class="lib-card ' + (g.versions.length > 1 ? 'has-multi' : '') + '" data-lib-group="' + esc(g.key) + '">'
        + thumbHtml
        + '<div class="lib-body">'
        + '<div>'
        + '<div class="lib-top-row">'
        + '<div class="lib-title">' + esc(g.title) + '</div>'
        + (g.versions.length > 1 ? '<span class="lib-multi-badge">' + g.versions.length + ' نسخ</span>' : '')
        + '</div>'
        + (g.author ? '<div style="font-size:11.5px;color:var(--muted);margin-top:2px">' + esc(g.author) + '</div>' : '')
        + '<div class="lib-meta-line" style="margin-top:4px;gap:6px">' + metaBits + progBadge + '</div>'
        + readBarHtml
        + editionsHtml
        + '</div>'
        + '<div class="lib-card-acts">'
        + '<button type="button" class="btn emerald sm" data-read-uri="' + esc(activeVer.uri) + '" data-read-name="' + esc(activeVer.fileName) + '" data-read-title="' + esc(g.title) + '">' + SVG.bookOpen + '<span>اقرأ الآن</span></button>'
        + (!activeVer.isCloudOnly ? '<button type="button" class="btn glass sm" data-ext-uri="' + esc(activeVer.uri) + '" data-ext-name="' + esc(activeVer.fileName) + '">قارئ خارجي</button>' : '')
        + '<button type="button" class="btn glass sm lib-fav-btn ' + (liked ? 'on' : '') + '" data-lib-fav="' + esc(g.key) + '" aria-pressed="' + (liked ? 'true' : 'false') + '" title="' + (liked ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة') + '">' + (liked ? SVG.heartFill : SVG.heart) + '<span>' + (liked ? 'في المفضلة' : 'المفضلة') + '</span></button>'
        + '<button type="button" class="btn glass sm" data-rename-group="' + esc(g.key) + '" title="تعديل اسم الكتاب">تعديل الاسم</button>'
        + '<button type="button" class="btn glass sm" data-folder-book="' + esc(g.key) + '" title="إضافة أو نقل إلى مجلد">' + SVG.folder + '<span>مجلد</span></button>'
        + (g.versions.length > 1 ? '<button type="button" class="btn glass sm lib-dedup-btn" data-dedup-group="' + esc(g.key) + '" title="إبقاء الأفضل وحذف النسخ الزائدة">حذف المكرر (' + (g.versions.length - 1) + ')</button>' : '')
        + '<button type="button" class="btn glass sm" data-del-ver="' + esc(activeVer.uri) + '" data-del-group="' + esc(g.title) + '" title="خيارات الحذف">حذف</button>'
        + '</div>'
        + '</div></article>';
    }

    function openLibFolderModal(editFolderId, preselectBookKeys) {
      const modal = $('libFolderModal');
      if (!modal) return;
      const existing = editFolderId ? (state.libFolders || []).find(f => f.id === editFolderId) : null;
      const allGroups = buildGroupedLibrary();
      const selected = new Set(existing ? (existing.bookKeys || []) : (preselectBookKeys || []));

      $('libFolderModalTitle').textContent = existing ? ('تعديل مجلد: ' + existing.name) : 'إنشاء مجلد جديد وتجميع الكتب';
      const nameInput = $('libFolderNameInput');
      const filterInput = $('libFolderBookFilter');
      nameInput.value = existing ? existing.name : '';
      filterInput.value = '';

      const renderPickList = () => {
        const q = (filterInput.value || '').trim().toLowerCase();
        const filtered = allGroups.filter(g => !q || (g.title + ' ' + (g.author || '')).toLowerCase().includes(q));
        $('libFolderPickCount').textContent = 'تم اختيار ' + selected.size + ' كتاب لهذا المجلد';
        const listEl = $('libFolderBookList');
        if (!filtered.length) {
          listEl.innerHTML = '<div style="text-align:center;padding:18px;color:var(--muted);font-size:13px">لا توجد كتب مطابقة</div>';
          return;
        }
        listEl.innerHTML = filtered.map(g => {
          const on = selected.has(g.key);
          const activeV = g.versions[0];
          const sub = [activeV ? String(activeV.format || '').toUpperCase() : '', g.versions.length > 1 ? (g.versions.length + ' نسخ') : ''].filter(Boolean).join(' • ');
          return '<button type="button" class="lib-fld-pick-row ' + (on ? 'selected' : '') + '" data-fpick="' + esc(g.key) + '">'
            + '<span class="lib-fld-chk">' + (on ? '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>' : '') + '</span>'
            + '<div style="flex:1;min-width:0">'
            + '<div style="font-size:13.5px;font-weight:700;color:var(--fg);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(g.title) + '</div>'
            + (sub ? '<div style="font-size:11.5px;color:var(--muted)">' + esc(sub) + '</div>' : '')
            + '</div></button>';
        }).join('');
        listEl.querySelectorAll('[data-fpick]').forEach(row => {
          row.onclick = () => {
            const k = row.dataset.fpick;
            if (selected.has(k)) selected.delete(k);
            else selected.add(k);
            renderPickList();
          };
        });
      };

      filterInput.oninput = renderPickList;
      renderPickList();
      modal.classList.remove('hidden');
      setTimeout(() => nameInput.focus(), 60);

      $('libFolderSave').onclick = () => {
        const name = (nameInput.value || '').trim();
        if (!name) {
          KTB.toast('اكتب اسماً للمجلد أولاً');
          nameInput.focus();
          return;
        }
        const chosenKeys = Array.from(selected);
        if (existing) {
          existing.name = name;
          existing.bookKeys = [];
          assignBookKeysToFolder(existing.id, chosenKeys, true);
          KTB.toast('تم تحديث مجلد «' + name + '» (' + chosenKeys.length + ' كتاب)');
        } else {
          const newId = 'fld_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
          state.libFolders = [{ id: newId, name, bookKeys: [], createdAt: Date.now() }, ...(state.libFolders || [])];
          assignBookKeysToFolder(newId, chosenKeys, true);
          KTB.toast('تم إنشاء مجلد «' + name + '» (' + chosenKeys.length + ' كتاب)');
        }
        modal.classList.add('hidden');
        renderDownloads();
      };
    }

    function openLibraryFolderActionsModal(folder, containedBooks) {
      const modal = $('libBookActionsModal');
      if (!modal || !folder) return;
      $('libBookActHead').textContent = 'خيارات المجلد';
      $('libBookActBody').innerHTML =
        '<div style="margin-bottom:14px">'
        + '<strong style="font-size:16px;display:block;margin-bottom:4px">' + esc(folder.name) + '</strong>'
        + '<small style="color:var(--muted)">يحتوي على ' + (containedBooks ? containedBooks.length : 0) + ' كتاب</small>'
        + '</div>'
        + '<div class="choice-stack">'
        + '<button type="button" id="actOpenFldBtn" class="choice-opt-btn"><div><strong>فتح المجلد</strong><small>عرض الكتب المجمّعة داخل «' + esc(folder.name) + '»</small></div></button>'
        + '<button type="button" id="actEditFldBtn" class="choice-opt-btn"><div><strong>تعديل الاسم وإضافة أو إزالة كتب</strong><small>تسمية المجلد واختيار الكتب بداخله</small></div></button>'
        + '<button type="button" id="actUngroupFldBtn" class="choice-opt-btn danger"><div><strong>فك المجلد وإخراج الكتب</strong><small>تعود جميع الكتب إلى مكتبتك الرئيسية دون حذف أي ملف</small></div></button>'
        + '</div>';
      modal.classList.remove('hidden');
      $('actOpenFldBtn').onclick = () => { modal.classList.add('hidden'); state.libOpenFolderId = folder.id; renderDownloads(); };
      $('actEditFldBtn').onclick = () => { modal.classList.add('hidden'); openLibFolderModal(folder.id); };
      $('actUngroupFldBtn').onclick = () => {
        modal.classList.add('hidden');
        deleteLibFolderOnly(folder.id);
        renderDownloads();
        KTB.toast('تم فك المجلد وعادت الكتب للرئيسية');
      };
    }

    function openLibraryBookOptions(g) {
      const modal = $('libBookActionsModal');
      if (!modal || !g || !g.versions || !g.versions.length) return;
      const idxRaw = state.libSelectedVer[g.key];
      const selIdx = (typeof idxRaw === 'number' && idxRaw >= 0 && idxRaw < g.versions.length) ? idxRaw : 0;
      const activeVer = g.versions[selIdx];
      const isAr = g.lang === 'ar' || /[\u0600-\u06FF]/.test(g.title);
      const [c1, c2] = coverColors(g.title, g.cat, isAr);
      const currentFolder = (state.libFolders || []).find(f => Array.isArray(f.bookKeys) && f.bookKeys.includes(g.key));
      const sz = formatBytes(activeVer.sizeBytes);
      const liked = isLibraryGroupLiked(g);

      $('libBookActHead').textContent = g.title;
      $('libBookActBody').innerHTML =
        '<div class="lib-act-hero">'
        + '<div class="lib-thumb" style="width:62px;height:84px;min-height:84px">'
        + '<div class="lib-thumb-mono" style="--c1:' + c1 + ';--c2:' + c2 + '"><span>' + esc(g.title.slice(0, 24)) + '</span></div>'
        + (g.cover ? '<img src="' + esc(g.cover) + '" alt="" style="opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="this.remove()">' : '')
        + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<strong style="display:block;font-size:15px;margin-bottom:3px">' + esc(g.title) + '</strong>'
        + (g.author ? '<div style="font-size:12px;color:var(--muted);margin-bottom:5px">' + esc(g.author) + '</div>' : '')
        + '<div class="lib-meta-line">'
        + '<span class="source-origin-pill">من: ' + esc(activeVer.sourceName || activeVer.folder || 'مداد') + '</span>'
        + '<span>' + esc(activeVer.format.toUpperCase()) + '</span>'
        + (sz ? '<span>' + esc(sz) + '</span>' : '')
        + '</div>'
        + (activeVer.progressLabel ? '<div style="margin-top:5px"><span class="read-prio-pill">' + esc(activeVer.progressLabel) + '</span></div>' : '')
        + '</div></div>'

        + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
        + '<button type="button" id="actReadBookNow" class="btn emerald" style="flex:1">' + SVG.bookOpen + '<span>اقرأ الآن</span></button>'
        + '<button type="button" id="actFavBookBtn" class="btn ' + (liked ? 'like' : 'glass') + '" aria-pressed="' + (liked ? 'true' : 'false') + '">' + (liked ? SVG.heartFill : SVG.heart) + '<span>' + (liked ? 'في المفضلة' : 'إضافة للمفضلة') + '</span></button>'
        + (!activeVer.isCloudOnly ? '<button type="button" id="actExtReadBook" class="btn glass">قارئ خارجي</button>' : '')
        + '</div>'

        + (g.versions.length > 1
          ? ('<div class="lib-act-section">'
            + '<div class="lib-act-sec-title">باقي النسخ المتوفرة (' + g.versions.length + ')</div>'
            + '<div class="lib-act-copies">'
            + g.versions.map((v, i) => {
              const vsz = formatBytes(v.sizeBytes);
              return '<button type="button" class="lib-act-copy-btn" data-act-copy="' + i + '">'
                + '<span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
                + '<strong class="lib-ed-fmt">' + esc(v.format) + '</strong>'
                + '<span>' + esc(v.sourceName || v.folder || 'مداد') + '</span>'
                + (vsz ? ('<small style="color:var(--muted)">• ' + esc(vsz) + '</small>') : '')
                + (v.hasReadProgress ? '<span class="lib-prog-pill" style="font-size:10px">مقروء</span>' : '')
                + '</span>'
                + '<span style="font-size:12px;color:var(--accent-hi);font-weight:700">' + (i === selIdx ? 'محددة • قراءة' : 'قراءة') + '</span>'
                + '</button>';
            }).join('')
            + '</div>'
            + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">'
            + '<button type="button" id="actOpenPickModal" class="btn glass sm">عرض كل النسخ</button>'
            + '<button type="button" id="actDedupBookBtn" class="btn glass sm">حذف المكرر (' + (g.versions.length - 1) + ')</button>'
            + '</div></div>')
          : '')

        + '<div class="lib-act-section">'
        + '<div class="lib-act-sec-title">تجميع في مجلد' + (currentFolder ? (' (حالياً في: ' + esc(currentFolder.name) + ')') : '') + '</div>'
        + '<div class="lib-act-folder-chips">'
        + (currentFolder ? '<button type="button" id="actRemoveFromFld" class="btn glass sm">إخراج من المجلد للرئيسية</button>' : '')
        + (state.libFolders || []).filter(f => !currentFolder || f.id !== currentFolder.id).map(f =>
            '<button type="button" class="btn glass sm" data-act-movefld="' + esc(f.id) + '">' + SVG.folder + '<span>نقل إلى: ' + esc(f.name) + '</span></button>'
          ).join('')
        + '<button type="button" id="actNewFldForBook" class="btn emerald sm">' + SVG.folder + '<span>إنشاء مجلد جديد لهذا الكتاب...</span></button>'
        + '</div></div>'

        + '<div class="lib-act-section" style="padding-top:10px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap">'
        + '<button type="button" id="actRenameBookBtn" class="btn glass sm">تعديل اسم الكتاب</button>'
        + '<button type="button" id="actDelBookBtn" class="btn danger sm">حذف الكتاب...</button>'
        + '</div>';

      modal.classList.remove('hidden');

      $('actReadBookNow').onclick = () => {
        modal.classList.add('hidden');
        openBookCopyInReader(activeVer.uri, activeVer.fileName, g.title);
      };
      if ($('actFavBookBtn')) {
        $('actFavBookBtn').onclick = () => {
          const bk = resolveLibraryGroupBook(g);
          if (!bk) return;
          toggleLike(bk);
          const nowFav = isLibraryGroupLiked(g);
          const fb = $('actFavBookBtn');
          if (fb) {
            fb.className = 'btn ' + (nowFav ? 'like' : 'glass');
            fb.setAttribute('aria-pressed', nowFav ? 'true' : 'false');
            fb.innerHTML = (nowFav ? SVG.heartFill : SVG.heart) + '<span>' + (nowFav ? 'في المفضلة' : 'إضافة للمفضلة') + '</span>';
          }
          renderDownloads();
        };
      }
      if ($('actRenameBookBtn')) {
        $('actRenameBookBtn').onclick = () => {
          modal.classList.add('hidden');
          openRenameBookModal(g);
        };
      }
      if ($('actExtReadBook')) {
        $('actExtReadBook').onclick = () => {
          modal.classList.add('hidden');
          KTB.openExternalReader(activeVer.uri, activeVer.fileName);
        };
      }
      modal.querySelectorAll('[data-act-copy]').forEach(btn => {
        btn.onclick = () => {
          const i = Number(btn.dataset.actCopy || 0);
          state.libSelectedVer[g.key] = i;
          const ver = g.versions[i] || activeVer;
          modal.classList.add('hidden');
          openBookCopyInReader(ver.uri, ver.fileName, g.title);
        };
      });
      if ($('actOpenPickModal')) {
        $('actOpenPickModal').onclick = () => {
          modal.classList.add('hidden');
          openPickCopyModal(g, g.versions);
        };
      }
      if ($('actDedupBookBtn')) {
        $('actDedupBookBtn').onclick = () => {
          modal.classList.add('hidden');
          deleteDuplicateCopiesForGroup(g.versions, g.title);
        };
      }
      if ($('actRemoveFromFld') && currentFolder) {
        $('actRemoveFromFld').onclick = () => {
          modal.classList.add('hidden');
          removeBookKeyFromFolder(currentFolder.id, g.key);
          renderDownloads();
          KTB.toast('تم إخراج الكتاب من مجلد «' + currentFolder.name + '»');
        };
      }
      modal.querySelectorAll('[data-act-movefld]').forEach(btn => {
        btn.onclick = () => {
          const fid = btn.dataset.actMovefld;
          const fld = (state.libFolders || []).find(f => f.id === fid);
          assignBookKeysToFolder(fid, [g.key], true);
          modal.classList.add('hidden');
          renderDownloads();
          if (fld) KTB.toast('تم نقل «' + g.title + '» إلى مجلد «' + fld.name + '»');
        };
      });
      $('actNewFldForBook').onclick = () => {
        modal.classList.add('hidden');
        openLibFolderModal(null, [g.key]);
      };
      $('actDelBookBtn').onclick = () => {
        modal.classList.add('hidden');
        openBookDeleteModal(activeVer, g.title);
      };
    }

    function syncLibToolbarUi() {
      const viewSeg = $('libViewSeg');
      if (viewSeg) {
        viewSeg.querySelectorAll('[data-lview]').forEach(b => {
          b.classList.toggle('on', b.dataset.lview === state.libViewMode);
        });
      }
      if ($('libSortSelect')) $('libSortSelect').value = state.libSort || 'smart';
    }

    const q = (state.libQuery || '').trim().toLowerCase();
    const matchesLibFilterAndQuery = (g) => {
      if (state.libFilter === 'fav' && !isLibraryGroupLiked(g)) return false;
      if (state.libFilter === 'multi' && g.versions.length < 2) return false;
      if (state.libFilter === 'reading' && !g.hasProgress) return false;
      if (state.libFilter === 'midad' && !g.versions.some(v => v.sourceKind === 'midad')) return false;
      if (state.libFilter === 'pdf' && !g.versions.some(v => v.format === 'pdf')) return false;
      if (state.libFilter === 'epub' && !g.versions.some(v => v.format === 'epub')) return false;
      if (state.libFilter === 'ebook' && !g.versions.some(v => v.format === 'azw3' || v.format === 'mobi' || v.format === 'prc' || v.format === 'fb2')) return false;
      if (q) {
        const hay = (g.title + ' ' + g.author + ' ' + g.versions.map(v => v.fileName + ' ' + v.folder + ' ' + v.format).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    };

    const compactMode = state.libViewMode === 'compact';
    gridEl.classList.toggle('compact', compactMode);
    syncLibToolbarUi();

    const groupByKey = new Map(allGroups.map(g => [g.key, g]));
    const bookToFolderMap = new Map();
    const validFolders = (state.libFolders || []).filter(f => f && f.id && f.name);
    for (const f of validFolders) {
      for (const k of (f.bookKeys || [])) {
        if (!bookToFolderMap.has(k)) bookToFolderMap.set(k, f);
      }
    }

    const openFolder = state.libOpenFolderId ? validFolders.find(f => f.id === state.libOpenFolderId) : null;
    if (state.libOpenFolderId && !openFolder) state.libOpenFolderId = '';

    const folderBar = $('libFolderBar');
    if (folderBar) {
      folderBar.classList.toggle('hidden', !openFolder);
      if (openFolder) {
        const containedAll = (openFolder.bookKeys || []).map(k => groupByKey.get(k)).filter(Boolean);
        $('libFolderCrumbName').textContent = openFolder.name;
        $('libFolderCrumbCount').textContent = containedAll.length + ' كتاب';
      }
    }

    const htmlParts = [];
    const folderBooksMap = new Map();
    const visibleGroups = [];

    if (openFolder) {
      const contained = (openFolder.bookKeys || []).map(k => groupByKey.get(k)).filter(Boolean).filter(matchesLibFilterAndQuery);
      for (const g of contained) {
        visibleGroups.push(g);
        htmlParts.push(renderLibraryBookCardHtml(g, compactMode, ''));
      }
    } else if (q) {
      for (const f of validFolders) {
        const containedAll = (f.bookKeys || []).map(k => groupByKey.get(k)).filter(Boolean);
        const nameMatch = String(f.name || '').toLowerCase().includes(q);
        const itemMatch = containedAll.some(matchesLibFilterAndQuery);
        if (nameMatch || itemMatch) {
          folderBooksMap.set(f.id, containedAll);
          htmlParts.push(renderFolderCardHtml(f, containedAll, compactMode));
        }
      }
      for (const g of allGroups) {
        if (!matchesLibFilterAndQuery(g)) continue;
        visibleGroups.push(g);
        const ownerFld = bookToFolderMap.get(g.key);
        htmlParts.push(renderLibraryBookCardHtml(g, compactMode, ownerFld ? ownerFld.name : ''));
      }
    } else {
      for (const f of validFolders) {
        const containedAll = (f.bookKeys || []).map(k => groupByKey.get(k)).filter(Boolean);
        const containedMatched = containedAll.filter(matchesLibFilterAndQuery);
        if (state.libFilter !== 'all' && !containedMatched.length) continue;
        folderBooksMap.set(f.id, containedAll);
        htmlParts.push(renderFolderCardHtml(f, state.libFilter === 'all' ? containedAll : containedMatched, compactMode));
      }
      for (const g of allGroups) {
        if (bookToFolderMap.has(g.key)) continue;
        if (!matchesLibFilterAndQuery(g)) continue;
        visibleGroups.push(g);
        htmlParts.push(renderLibraryBookCardHtml(g, compactMode, ''));
      }
    }

    if (!htmlParts.length) {
      gridEl.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--muted)">'
        + (openFolder ? 'هذا المجلد فارغ حالياً — اضغط «إدارة وتسمية المجلد» لإضافة كتب إليه' : 'لا توجد كتب مطابقة لهذا الفلتر أو البحث')
        + '</div>';
      return;
    }

    gridEl.innerHTML = htmlParts.join('');
    hydrateLibraryCovers(visibleGroups, gridEl);

    const visibleVerByUri = new Map();
    const visibleGroupByKey = new Map();
    for (const g of visibleGroups) {
      visibleGroupByKey.set(g.key, g);
      for (const v of g.versions) visibleVerByUri.set(v.uri, v);
    }

    gridEl.querySelectorAll('[data-lib-folder]').forEach(el => {
      const fid = el.dataset.libFolder;
      const fld = validFolders.find(f => f.id === fid);
      if (!fld) return;
      const contained = folderBooksMap.get(fid) || [];
      bindCardTapAndLongPress(
        el,
        () => { state.libOpenFolderId = fid; renderDownloads(); },
        () => openLibraryFolderActionsModal(fld, contained)
      );
    });

    gridEl.querySelectorAll('[data-lib-group]').forEach(el => {
      const g = visibleGroupByKey.get(el.dataset.libGroup);
      if (!g) return;
      const idxRaw = state.libSelectedVer[g.key];
      const selIdx = (typeof idxRaw === 'number' && idxRaw >= 0 && idxRaw < g.versions.length) ? idxRaw : 0;
      const activeVer = g.versions[selIdx];
      bindCardTapAndLongPress(
        el,
        () => {
          if (compactMode && activeVer) {
            openBookCopyInReader(activeVer.uri, activeVer.fileName, g.title);
          }
        },
        () => openLibraryBookOptions(g)
      );
    });

    gridEl.querySelectorAll('[data-open-folder]').forEach(btn => {
      btn.onclick = () => { state.libOpenFolderId = btn.dataset.openFolder; renderDownloads(); };
    });
    gridEl.querySelectorAll('[data-edit-folder]').forEach(btn => {
      btn.onclick = () => openLibFolderModal(btn.dataset.editFolder);
    });
    gridEl.querySelectorAll('[data-ungroup-folder]').forEach(btn => {
      btn.onclick = () => {
        deleteLibFolderOnly(btn.dataset.ungroupFolder);
        renderDownloads();
        KTB.toast('تم فك المجلد وإعادة الكتب للرئيسية');
      };
    });
    gridEl.querySelectorAll('[data-lib-fav]').forEach(btn => {
      btn.onclick = (e) => {
        if (e) e.stopPropagation();
        const g = visibleGroupByKey.get(btn.dataset.libFav);
        const bk = resolveLibraryGroupBook(g);
        if (!bk) return;
        toggleLike(bk);
        renderDownloads();
      };
    });
    gridEl.querySelectorAll('[data-folder-book]').forEach(btn => {
      btn.onclick = () => {
        const g = visibleGroupByKey.get(btn.dataset.folderBook);
        if (g) openLibraryBookOptions(g);
      };
    });
    gridEl.querySelectorAll('[data-pick-key]').forEach(btn => {
      btn.onclick = () => {
        state.libSelectedVer[btn.dataset.pickKey] = Number(btn.dataset.pickIdx || 0);
        renderDownloads();
      };
    });
    gridEl.querySelectorAll('[data-read-uri]').forEach(btn => {
      btn.onclick = () => openBookCopyInReader(btn.dataset.readUri, btn.dataset.readName, btn.dataset.readTitle);
    });
    gridEl.querySelectorAll('[data-ext-uri]').forEach(btn => {
      btn.onclick = () => KTB.openExternalReader(btn.dataset.extUri, btn.dataset.extName);
    });
    gridEl.querySelectorAll('[data-dedup-group]').forEach(btn => {
      btn.onclick = () => {
        const g = visibleGroupByKey.get(btn.dataset.dedupGroup);
        if (g) deleteDuplicateCopiesForGroup(g.versions, g.title);
      };
    });
    gridEl.querySelectorAll('[data-rename-group]').forEach(btn => {
      btn.onclick = (e) => {
        if (e) e.stopPropagation();
        const g = visibleGroupByKey.get(btn.dataset.renameGroup);
        if (g) openRenameBookModal(g);
      };
    });
    gridEl.querySelectorAll('[data-del-ver]').forEach(btn => {
      btn.onclick = () => {
        const ver = visibleVerByUri.get(btn.dataset.delVer);
        if (ver) openBookDeleteModal(ver, btn.dataset.delGroup || ver.title);
      };
    });
    window.__midadOpenLibFolderModal = openLibFolderModal;
    window.__midadOpenRenameBookModal = openRenameBookModal;
  }

  let _renameTargetGroup = null;
  function openRenameBookModal(g) {
    const modal = $('renameBookModal');
    const inp = $('renameBookInput');
    if (!modal || !inp || !g) return;
    _renameTargetGroup = g;
    inp.value = g.title || '';
    modal.classList.remove('hidden');
    setTimeout(() => { inp.focus(); inp.select(); }, 30);
  }
  function closeRenameBookModal() {
    const modal = $('renameBookModal');
    if (modal) modal.classList.add('hidden');
    _renameTargetGroup = null;
  }

  let _delTarget = null;
  function performDeleteSingle(ver, fromDevice) {
    if (!ver) return false;
    if (ver.isCloudOnly) {
      state.cloudLibrary = state.cloudLibrary.filter(c => String(c.uri) !== String(ver.uri));
      saveJson('wq_cloud_library', state.cloudLibrary);
    }
    if (KTB.isAndroid() && KTB.deleteBook && !ver.isCloudOnly) {
      const ok = !!KTB.deleteBook({
        uri: ver.uri,
        downloadId: ver.downloadId || '',
        fileName: ver.fileName || '',
        sizeBytes: Number(ver.sizeBytes || 0),
        fromDevice: !!fromDevice,
      });
      if (!ok) return false;
    } else if (ver.isCloudOnly && KTB.removeDownload && ver.downloadId) {
      KTB.removeDownload(ver.downloadId);
    }
    if (fromDevice) {
      state.downloads = state.downloads.filter(d => (d.localUri || d.uri) !== ver.uri && d.id !== ver.downloadId);
      state.deviceBooks = state.deviceBooks.filter(d => d.uri !== ver.uri);
      state.localBooks = state.localBooks.filter(d => d.uri !== ver.uri);
    } else {
      state.downloads = state.downloads.filter(d => (d.localUri || d.uri) !== ver.uri && d.id !== ver.downloadId);
      state.hiddenWebUris.add(ver.uri);
      if (ver.fileName && ver.sizeBytes) {
        state.hiddenWebUris.add('sig:' + String(ver.fileName).toLowerCase() + '|' + ver.sizeBytes);
      }
      saveJson('wq_hidden_web', Array.from(state.hiddenWebUris));
    }
    invalidateOwnedCache();
    return true;
  }

  function performDeleteBook(ver, fromDevice, silent) {
    if (!ver) return;
    const ok = performDeleteSingle(ver, fromDevice);
    if (!ok) return;
    renderDownloads();
    refreshOwnedCardBadges();
    if (!silent) KTB.toast(fromDevice ? 'تم حذف الكتاب نهائياً من الجهاز' : 'تمت إزالة الكتاب من البرنامج مع بقائه على الجهاز');
  }

  function deleteDuplicateCopiesForGroup(versions, bookTitle) {
    if (!Array.isArray(versions) || versions.length < 2) return 0;
    const sorted = versions.slice().sort(compareOwnedCopies);
    const keep = sorted[0];
    const dupes = sorted.slice(1);
    let removed = 0;
    for (const d of dupes) {
      if (performDeleteSingle(d, true)) removed++;
    }
    renderDownloads();
    refreshOwnedCardBadges();
    if (removed > 0) {
      KTB.toast('تم حذف ' + removed + ' نسخة مكررة والإبقاء على: ' + (keep.sourceName || keep.format) + (keep.hasReadProgress ? ' (المقروءة)' : ''));
    }
    return removed;
  }

  function deleteAllDuplicateCopiesInLibrary() {
    const groups = buildGroupedLibrary().filter(g => g.versions.length > 1);
    if (!groups.length) {
      KTB.toast('لا توجد نسخ مكررة في مكتبتك حالياً');
      return 0;
    }
    let totalRemoved = 0;
    for (const g of groups) {
      const sorted = g.versions.slice().sort(compareOwnedCopies);
      for (const d of sorted.slice(1)) {
        if (performDeleteSingle(d, true)) totalRemoved++;
      }
    }
    renderDownloads();
    refreshOwnedCardBadges();
    KTB.toast('تم تنظيف المكتبة: حذف ' + totalRemoved + ' نسخة مكررة والإبقاء على أفضل نسخة مقروءة');
    return totalRemoved;
  }

  function findActiveDownloadJob(book) {
    if (!book) return null;
    const prep = state.prepJobs.get(book.id);
    if (prep) return prep;
    if (!Array.isArray(state.downloads)) return null;
    const prefix = book.id + '_';
    return state.downloads.find(j =>
      j && (j.status === 'downloading' || j.status === 'queued')
      && (j.id === book.id || String(j.id || '').startsWith(prefix))
    ) || null;
  }

  function refreshActiveDownloadCardsOnly() {
    const activeMap = new Map();
    for (const [bid, pj] of state.prepJobs.entries()) activeMap.set(bid, pj);
    for (const j of (state.downloads || [])) {
      if (!j || (j.status !== 'downloading' && j.status !== 'queued')) continue;
      const bid = j.bookId || (j.id && j.id.includes('_') ? j.id.slice(0, j.id.lastIndexOf('_')) : j.id);
      if (bid && !activeMap.has(bid)) activeMap.set(bid, j);
    }
    if (!activeMap.size) return;
    document.querySelectorAll('.bcard[data-book-id]').forEach(card => {
      const job = activeMap.get(card.dataset.bookId);
      if (!job) return;
      const foot = card.querySelector('.bfoot');
      if (!foot || foot.children.length < 2) return;
      const last = foot.children[1];
      if (last.classList.contains('bfoot-owned')) return;
      const pct = getDisplayDownloadPct(job);
      if (!last.classList.contains('downloading')) {
        last.className = 'bcard-dl-btn downloading';
        last.removeAttribute('data-quick-read');
        last.setAttribute('data-quick-dl', card.dataset.bookId);
      }
      const sp = last.querySelector('span:not(.spin)');
      if (sp) {
        if (sp.textContent !== pct + '%') sp.textContent = pct + '%';
      } else {
        last.innerHTML = '<span class="spin sm"></span><span>' + pct + '%</span>';
      }
    });
  }

  function refreshOwnedCardBadges() {
    document.querySelectorAll('.bcard[data-book-id]').forEach(card => {
      const b = BOOK_MAP.get(card.dataset.bookId);
      const foot = card.querySelector('.bfoot');
      if (!b || !foot || foot.children.length < 2) return;
      const n = findDownloadedMatches(b).length;
      const last = foot.children[1];
      if (n > 1) {
        last.className = 'bfoot-owned';
        last.removeAttribute('data-quick-dl');
        last.setAttribute('data-quick-read', b.id);
        last.textContent = n + ' نسخ محملة';
      } else if (n === 1) {
        last.className = 'bfoot-owned';
        last.removeAttribute('data-quick-dl');
        last.setAttribute('data-quick-read', b.id);
        last.textContent = 'محمل • جاهز';
      } else {
        const activeJob = findActiveDownloadJob(b);
        if (activeJob) {
          const pct = getDisplayDownloadPct(activeJob);
          last.className = 'bcard-dl-btn downloading';
          last.removeAttribute('data-quick-read');
          last.setAttribute('data-quick-dl', b.id);
          last.title = activeJob.phaseText || 'جاري التحميل المباشر';
          last.innerHTML = '<span class="spin sm"></span><span>' + pct + '%</span>';
        } else {
          last.className = 'bcard-dl-btn';
          last.removeAttribute('data-quick-read');
          last.setAttribute('data-quick-dl', b.id);
          last.title = 'تحميل مباشر بضغطة واحدة';
          last.innerHTML = SVG.download + '<span>تحميل</span>';
        }
      }
    });
  }

  function openBookDeleteModal(ver, groupTitle) {
    if (!$('bookDeleteModal')) return;
    _delTarget = ver;
    if ($('delBookTitle')) $('delBookTitle').textContent = groupTitle || ver.title || ver.fileName;
    const sz = formatBytes(ver.sizeBytes);
    const meta = [ver.sourceName ? ('من: ' + ver.sourceName) : '', ver.format ? ver.format.toUpperCase() : '', sz, ver.folder || ''].filter(Boolean).join(' • ');
    if ($('delBookMeta')) $('delBookMeta').textContent = meta + (ver.fileName ? (' — ' + ver.fileName) : '');
    $('bookDeleteModal').classList.remove('hidden');
  }

  function openPickCopyModal(book, initialMatches) {
    if (!$('pickCopyModal')) return;
    let matches = (initialMatches || findDownloadedMatches(book)).slice().sort(compareOwnedCopies);
    if ($('pickCopySub')) {
      $('pickCopySub').textContent = 'الكتاب «' + (book.title || '') + '» متوفر في ' + matches.length + ' نسخ محملة (النسخة المقروءة والأفضل مرتبة أولاً):';
    }
    const dedupBar = $('pickCopyDedupBar');
    const dedupInfo = $('pickCopyDedupInfo');
    const dedupBtn = $('btnPickCopyDedup');
    if (dedupBar) {
      dedupBar.classList.toggle('hidden', matches.length < 2);
      if (dedupInfo && matches.length >= 2) {
        dedupInfo.textContent = 'يوجد ' + (matches.length - 1) + ' نسخ زائدة — سيتم الإبقاء على «' + (matches[0].sourceName || matches[0].format) + '»';
      }
      if (dedupBtn) {
        dedupBtn.onclick = () => {
          deleteDuplicateCopiesForGroup(matches, book.title);
          const remaining = findDownloadedMatches(book);
          if (remaining.length <= 1) $('pickCopyModal').classList.add('hidden');
          else openPickCopyModal(book, remaining);
        };
      }
    }
    const listEl = $('pickCopyList');
    if (listEl) {
      listEl.innerHTML = matches.map((v, idx) => {
        const sz = formatBytes(v.sizeBytes);
        const metaBits = [
          v.hasReadProgress ? '<span class="read-prio-pill">' + esc(v.progressLabel || 'قيد القراءة • الأفضل') + '</span>' : (idx === 0 ? '<span class="read-prio-pill">الأفضل جودة</span>' : ''),
          '<span class="source-origin-pill">من: ' + esc(v.sourceName || v.folder || 'مداد') + '</span>',
          '<span class="lib-ed-fmt">' + esc((v.format || 'pdf').toUpperCase()) + '</span>',
          sz ? ('<span>' + esc(sz) + '</span>') : '',
          v.folder ? ('<span>' + esc(v.folder) + '</span>') : '',
        ].filter(Boolean).join('');
        return '<div class="copy-pick-row">'
          + '<div class="copy-pick-info">'
          + '<div class="copy-pick-name">' + esc(v.fileName || v.title) + '</div>'
          + '<div class="copy-pick-meta">' + metaBits + '</div>'
          + '</div>'
          + '<div class="copy-pick-acts">'
          + '<button type="button" class="btn emerald sm" data-pick-read="' + idx + '">' + SVG.bookOpen + '<span>اقرأ هنا</span></button>'
          + (!v.isCloudOnly ? '<button type="button" class="btn glass sm" data-pick-ext="' + idx + '">خارجي</button>' : '')
          + '<button type="button" class="btn glass sm pick-copy-del-btn" data-pick-del="' + idx + '" title="حذف هذه النسخة">حذف</button>'
          + '</div></div>';
      }).join('');
      listEl.querySelectorAll('[data-pick-read]').forEach(b => {
        b.onclick = () => {
          const v = matches[Number(b.dataset.pickRead)];
          if (v) {
            $('pickCopyModal').classList.add('hidden');
            openBookCopyInReader(v.uri, v.fileName, book.title, book);
          }
        };
      });
      listEl.querySelectorAll('[data-pick-ext]').forEach(b => {
        b.onclick = () => {
          const v = matches[Number(b.dataset.pickExt)];
          if (v) KTB.openExternalReader(v.uri, v.fileName);
        };
      });
      listEl.querySelectorAll('[data-pick-del]').forEach(b => {
        b.onclick = () => {
          const v = matches[Number(b.dataset.pickDel)];
          if (!v) return;
          performDeleteBook(v, true);
          const next = findDownloadedMatches(book);
          if (!next.length) $('pickCopyModal').classList.add('hidden');
          else openPickCopyModal(book, next);
        };
      });
    }
    $('pickCopyModal').classList.remove('hidden');
  }

  function openReadOrPickCopy(book) {
    const matches = findDownloadedMatches(book);
    if (!matches.length) return;
    if (matches.length === 1) {
      openBookCopyInReader(matches[0].uri, matches[0].fileName, book.title, book);
      return;
    }
    openPickCopyModal(book, matches);
  }

  function isDirectDownloadLink(l) {
    return Boolean(l && l.url && l.kind !== 'external' && l.kind !== 'webview_dl' && l.kind !== 'web_search_dl' && l.kind !== 'scribd_reader' && l.kind !== 'web_reader');
  }

  function scoreDownloadLink(l, bk) {
    if (!l) return -9999;
    const src = String(l.source || '').toLowerCase();
    let sc = l.kind === 'external' ? 0
      : (l.kind === 'webview_dl' ? (l.requiresAccount ? 190 : 250)
        : (l.kind === 'web_search_dl' ? (src.includes('نور') ? 275 : (l.requiresAccount ? 185 : 230)) : 1000));
    const fmt = String(l.format || '').toLowerCase();
    const url = String(l.url || '').toLowerCase();
    const prefFmt = getPreferredFormat();
    const isComicBk = Boolean(bk && (bk.isComic || bk.cat === 'comics_manga'));
    if (isComicBk) {
      if (fmt === 'cbz') sc += 110;
      else if (fmt === 'pdf') sc += 88;
      else if (fmt === 'epub') sc += 40;
    } else if (prefFmt === 'pdf') {
      if (fmt === 'pdf') sc += 95;
      else if (fmt === 'epub') sc += 45;
      else if (fmt === 'azw3') sc += 38;
      else if (fmt === 'mobi' || fmt === 'fb2') sc += 28;
      else if (fmt === 'cbz') sc += 20;
      else if (fmt === 'txt') sc += 12;
    } else {
      if (fmt === 'epub') sc += 95;
      else if (fmt === 'azw3') sc += 55;
      else if (fmt === 'pdf') sc += 45;
      else if (fmt === 'mobi' || fmt === 'fb2') sc += 30;
      else if (fmt === 'cbz') sc += 20;
      else if (fmt === 'txt') sc += 12;
    }
    if (src.includes('8 غرب') || src.includes('8ghrb') || url.includes('book-shadow.com') || url.includes('8ghrb.com')) sc += 600;
    else if (src.includes('ysk comics')) sc += 52;
    else if (src.includes('getcomics') || src.includes('azcomics') || src.includes('عرب كوميكس')) sc += 50;
    else if (src.includes('webtoon') || src.includes('tapas') || src.includes('comicverse') || src.includes('comicsgate') || src.includes('globalcomix')) sc += 46;
    else if (src.includes('هنداوي') || url.includes('hindawi.org')) sc += 48;
    else if (url.includes('standardebooks.org') || url.includes('gutenberg.org') || url.includes('arxiv.org/pdf/')) sc += 46;
    else if (src.includes('فولة') || url.includes('foulabook.com')) sc += 42;
    else if (src.includes('نور') || url.includes('noor-book.com')) sc += 40;
    else if (src.includes('مجلة العرب') || url.includes('alarabimag.com')) sc += 38;
    else if (url.includes('drive.usercontent.google.com') || url.includes('dropbox.com')) sc += 36;
    else if (url.includes('archive.org/download/')) sc += 34;
    else if (src.includes('الوقفية')) sc += 32;
    else if (src.includes('scribd') && sc >= 1000) sc += 28;
    else if (url.includes('mediafire.com') || src.includes('ketabpedia')) sc += 26;
    else if (src.includes('libgen') || url.includes('get.php')) sc += 20;
    sc += scoreEditionQuality(l.label, url, l.source);
    return sc;
  }

  function is8GharbDownloadLink(l) {
    if (!l) return false;
    const tag = (String(l.source || '') + ' ' + String(l.url || '')).toLowerCase();
    return tag.includes('8 غرب') || tag.includes('8ghrb') || tag.includes('book-shadow.com');
  }

  function isScribdDownloadLink(l) {
    if (!l) return false;
    if (l.kind === 'scribd_reader' || l.engId === 'scribd') return true;
    const tag = (String(l.source || '') + ' ' + String(l.url || '')).toLowerCase();
    return tag.includes('scribd');
  }

  function orderDownloadLinks(links, bk) {
    const arr = Array.isArray(links) ? links.filter(Boolean) : [];
    if (!arr.length) return [];
    const scribdLinks = [];
    const nonScribd = [];
    for (const l of arr) {
      if (isScribdDownloadLink(l)) scribdLinks.push(l);
      else nonScribd.push(l);
    }
    const cmp = (a, b) => {
      const a8 = is8GharbDownloadLink(a) ? 1 : 0;
      const b8 = is8GharbDownloadLink(b) ? 1 : 0;
      if (a8 !== b8) return b8 - a8;
      return scoreDownloadLink(b, bk) - scoreDownloadLink(a, bk);
    };
    nonScribd.sort(cmp);
    scribdLinks.sort((a, b) => scoreDownloadLink(b, bk) - scoreDownloadLink(a, bk));
    if (!scribdLinks.length) return nonScribd;
    const beforeScribd = nonScribd.slice(0, 4);
    const afterScribd = nonScribd.slice(4);
    return [...beforeScribd, ...scribdLinks, ...afterScribd];
  }

  function refreshModalActBar(book) {
    if (!state.currentModalBook || !book || state.currentModalBook.id !== book.id) return;
    if ($('bookModal').classList.contains('hidden')) return;
    const matches = findDownloadedMatches(book);
    const actBar = document.querySelector('#bookModal .detail-act-bar');
    if (!actBar) return;
    if (!matches.length) {
      const qBtn = $('detailQuickDlBtn');
      const activeJob = findActiveDownloadJob(book);
      if (qBtn && activeJob) {
        const pct = getDisplayDownloadPct(activeJob);
        qBtn.classList.add('has-prog');
        const lbl = (activeJob._isPrep ? 'تجهيز الكتاب ' : 'جاري التحميل المباشر ') + pct + '%';
        let fill = qBtn.querySelector('.btn-prog-bar');
        let txtSp = qBtn.querySelector('span:not(.btn-prog-bar):not(.spin)');
        if (!fill || !txtSp) {
          qBtn.innerHTML = '<span class="btn-prog-bar" style="width:' + pct + '%"></span><span class="spin sm"></span><span>' + esc(lbl) + '</span>';
        } else {
          fill.style.width = pct + '%';
          txtSp.textContent = lbl;
        }
      }
      return;
    }
    const qBtn = $('detailQuickDlBtn');
    if (qBtn) qBtn.remove();
    let btn = $('detailReadNowBtn');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'detailReadNowBtn';
      btn.className = 'btn emerald';
      actBar.prepend(btn);
    }
    const lbl = matches.length > 1 ? ('اقرأ الآن (اختيار من ' + matches.length + ' نسخ)') : 'اقرأ الآن (قارئ مداد)';
    btn.innerHTML = SVG.bookOpen + '<span>' + esc(lbl) + '</span>';
    btn.onclick = () => openReadOrPickCopy(book);
  }

  function cleanupCloudAfterLocalDownload(title, localUri) {
    if (!title || !localUri || String(localUri).startsWith('scribd://') || String(localUri).startsWith('webreader://')) return;
    const nt = typeof normBookText === 'function' ? normBookText(title) : '';
    if (!nt) return;
    const before = state.cloudLibrary.length;
    state.cloudLibrary = state.cloudLibrary.filter(c => normBookText(c.title) !== nt);
    if (state.cloudLibrary.length !== before) {
      saveJson('wq_cloud_library', state.cloudLibrary);
    }
  }

  function saveCloudBookToLibrary(book, uri, docId) {
    if (!book) return '';
    const rawUriStr = String(uri || '');
    const isWebRdr = rawUriStr.startsWith('webreader://');
    const dId = isWebRdr ? '' : String(docId || (S.extractScribdDocId && S.extractScribdDocId(rawUriStr || book.url || (book.extra && book.extra.scribdId) || '')) || '').trim();
    const cloudUri = (rawUriStr.startsWith('scribd://') || isWebRdr)
      ? rawUriStr
      : (dId ? ('scribd://' + dId) : String(book.url || ''));
    if (!cloudUri) return '';
    const srcLabel = isWebRdr ? (book.source || 'قراءة أونلاين') : 'Scribd';
    const existingLocal = findDownloadedMatches(book).find(v => !v.isCloudOnly);
    if (!existingLocal) {
      const idx = state.cloudLibrary.findIndex(c => c.uri === cloudUri || (dId && c.docId === dId));
      const entry = {
        uri: cloudUri,
        docId: dId,
        downloadId: dId ? ('scribd_' + dId) : ('cloud_' + book.id),
        title: book.title || '',
        author: book.author || '',
        cover: safeBookCoverUrl(book) || book.cover || '',
        format: isWebRdr ? 'cbz' : 'pdf',
        source: srcLabel,
        url: book.url || (dId ? ('https://www.scribd.com/document/' + dId) : ''),
        addedAt: Date.now(),
      };
      if (idx >= 0) state.cloudLibrary[idx] = entry;
      else state.cloudLibrary.unshift(entry);
      saveJson('wq_cloud_library', state.cloudLibrary);
    }
    recordCopySource(cloudUri, book.title, srcLabel);
    recordReadingActivity(cloudUri, book.title, 'قيد القراءة • ' + srcLabel);
    renderDownloads();
    refreshOwnedCardBadges();
    refreshModalActBar(book);
    return cloudUri;
  }

  function updateScribdReaderDlPill(bookId) {
    const pill = $('scribdReaderDlPill');
    if (!pill || !state.activeScribdBook) return;
    if (bookId && state.activeScribdBook.id !== bookId) return;
    const localHit = findDownloadedMatches(state.activeScribdBook).find(v => !v.isCloudOnly);
    if (localHit) {
      pill.textContent = 'متاح كاملاً أوفلاين في المكتبة';
      pill.className = 'sreader-dl-pill ready';
      return;
    }
    const activeJob = findActiveDownloadJob(state.activeScribdBook);
    if (activeJob) {
      const pct = getDisplayDownloadPct(activeJob);
      pill.textContent = 'تم الحفظ في المكتبة • التحميل في الخلفية ' + pct + '%';
      pill.className = 'sreader-dl-pill downloading';
      return;
    }
    pill.textContent = 'محفوظ في المكتبة للمتابعة لاحقاً';
    pill.className = 'sreader-dl-pill';
  }

  async function downloadScribdInBackground(book, scribdUrl, docId) {
    if (!book) return;
    if (findDownloadedMatches(book).some(v => !v.isCloudOnly)) {
      updateScribdReaderDlPill(book.id);
      return;
    }
    if (findActiveDownloadJob(book)) {
      updateScribdReaderDlPill(book.id);
      return;
    }
    recordCopySource(book.id, book.title, 'Scribd');
    try {
      const ex = book.extra || {};
      if (ex.isUnlocked && ex.downloadUrl) {
        triggerDownload(book, {
          url: ex.downloadUrl,
          format: 'pdf',
          source: 'Scribd',
          referer: scribdUrl || book.url || '',
        }, [], { quietToast: true });
        updateScribdReaderDlPill(book.id);
        return;
      }
      if (typeof S.findDirectMirrorsForBook === 'function') {
        const mirrors = await S.findDirectMirrorsForBook(book.title, book.author, book.lang).catch(() => []);
        if (Array.isArray(mirrors) && mirrors.length) {
          const directSorted = mirrors.filter(isDirectDownloadLink).sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book));
          if (directSorted.length) {
            const best = directSorted[0];
            triggerDownload(book, Object.assign({}, best, {
              source: best.source || 'Scribd',
            }), directSorted.slice(1, 3), { quietToast: true });
            updateScribdReaderDlPill(book.id);
            return;
          }
        }
      }
    } catch (_) {}
    updateScribdReaderDlPill(book.id);
  }

  function applyScribdZoom(pct) {
    const z = Math.max(70, Math.min(180, Number(pct) || 100));
    state.scribdZoom = z;
    const body = $('scribdReaderBody');
    const frame = $('scribdReaderFrame');
    if (body) body.style.setProperty('--sreader-zoom', String(z / 100));
    if (frame) frame.style.setProperty('--sreader-zoom', String(z / 100));
    const rst = $('sreaderZoomReset');
    if (rst) rst.textContent = z + '%';
  }

  async function openScribdInAppReader(book, linkOrUri) {
    if (!book) return;
    const rawStr = typeof linkOrUri === 'string' ? linkOrUri : '';
    let linkUrl = (typeof linkOrUri === 'object' && linkOrUri && linkOrUri.url) ? linkOrUri.url : (/^https?:/i.test(rawStr) ? rawStr : (book.url || ''));
    let docId = String(
      (typeof linkOrUri === 'object' && linkOrUri && linkOrUri.scribdId)
      || (S.extractScribdDocId && S.extractScribdDocId(rawStr || linkUrl || (book.extra && book.extra.scribdId) || ''))
      || ''
    ).trim();

    if (!docId && S && typeof S.searchScribd === 'function') {
      KTB.toast('جاري البحث عن نفس الكتاب في Scribd...');
      const cleanTitle = (S.cleanBookFileTags ? S.cleanBookFileTags(book.title || '') : (book.title || '')).trim();
      const engAlt = (book.extra && (book.extra.enTitle || book.extra.engTitle)) || (book.titleEn || '');
      const hits = await S.searchScribd(cleanTitle, book.author || '').catch(() => []);
      const strictHit = (hits || []).find(h => {
        const hid = String((h && (h.scribdId || (S.extractScribdDocId && S.extractScribdDocId(h.url || '')))) || '').trim();
        if (!hid) return false;
        if (typeof S.isStrictSameBook === 'function') {
          return S.isStrictSameBook(cleanTitle, h.title || '', book.author || '', h.author || '', engAlt);
        }
        return S.titleMatchesCandidate ? S.titleMatchesCandidate(cleanTitle, h.title || '', book.author || '') : true;
      });
      if (strictHit) {
        docId = String(strictHit.scribdId || (S.extractScribdDocId && S.extractScribdDocId(strictHit.url || '')) || '').trim();
        if (strictHit.url) linkUrl = strictHit.url;
      }
    }

    if (!docId) {
      if (S && typeof S.aggregateBookLinks === 'function') {
        KTB.toast('لم يُعثر على نسخة مطابقة في Scribd؛ جاري التحقق من المصادر المباشرة...');
        const resolved = await S.aggregateBookLinks(book).catch(() => []);
        const directMirror = (resolved || []).find(r => r && r.kind === 'direct' && r.url);
        if (directMirror) {
          triggerDownload(book, directMirror, resolved.filter(x => x && x.kind === 'direct'));
          return;
        }
      }
      KTB.toast('لم يُعثر على الكتاب المطلوب بدقة في Scribd');
      return;
    }

    saveCloudBookToLibrary(book, 'scribd://' + docId, docId);
    saveDlBookMeta(book, 'scribd://' + docId);
    state.activeScribdBook = book;
    state.activeScribdDocId = docId;

    if (KTB.isAndroid() && docId) {
      KTB.openInternalReader('scribd://' + docId, (book.title || 'Scribd') + '.pdf', book.title || '');
      downloadScribdInBackground(book, linkUrl, docId);
      return;
    }

    const modal = $('scribdReaderModal');
    const frame = $('scribdReaderFrame');
    const loading = $('scribdReaderLoading');
    const titleEl = $('scribdReaderTitle');
    if (docId && modal && frame) {
      if (titleEl) titleEl.textContent = book.title || 'وضع القراءة';
      updateScribdReaderDlPill(book.id);
      applyScribdZoom(state.scribdZoom || 100);
      const bmBtn = $('sreaderBookmarkBtn');
      if (bmBtn) {
        const bm = typeof isBookmarked === 'function' && isBookmarked(book.id);
        bmBtn.classList.toggle('active', !!bm);
        bmBtn.setAttribute('aria-pressed', bm ? 'true' : 'false');
      }
      if (loading) loading.classList.remove('hidden');
      frame.onload = () => { if (loading) loading.classList.add('hidden'); };
      setTimeout(() => { if (loading) loading.classList.add('hidden'); }, 2200);
      frame.src = 'https://www.scribd.com/embeds/' + docId + '/content?view_mode=scroll';
      modal.classList.remove('hidden');
      KTB.toast('تم فتح الكتاب في وضع القراءة وحفظه في مكتبتك مع التحميل في الخلفية');
      downloadScribdInBackground(book, linkUrl, docId);
      return;
    }
    if (linkUrl && !/scribd\.com\/search/i.test(linkUrl)) {
      KTB.openUrl(linkUrl);
    }
  }

  function openWebBookInAppReader(book, linkOrUrl) {
    if (!book) return;
    const rawUrl = (typeof linkOrUrl === 'object' && linkOrUrl && linkOrUrl.url)
      ? linkOrUrl.url
      : (typeof linkOrUrl === 'string' ? linkOrUrl : (book.url || ''));
    if (!rawUrl || !/^https?:/i.test(rawUrl)) {
      KTB.toast('لا يوجد رابط قراءة مباشر متاح');
      return;
    }
    const fakeKey = 'web_' + (book.id || Math.random().toString(36).slice(2, 9));
    const isWtUrl = /webtoons\.com/i.test(rawUrl);
    const webUri = (isWtUrl ? 'webtoon://' : 'webreader://') + rawUrl;
    saveCloudBookToLibrary(book, webUri, fakeKey);
    saveDlBookMeta(book, webUri);

    if (KTB.isAndroid()) {
      KTB.openInternalReader(webUri, (book.title || 'Comic') + '.cbz', book.title || '');
      return;
    }

    const modal = $('scribdReaderModal');
    const frame = $('scribdReaderFrame');
    const loading = $('scribdReaderLoading');
    const titleEl = $('scribdReaderTitle');
    if (modal && frame) {
      state.activeScribdBook = book;
      if (titleEl) titleEl.textContent = book.title || 'قراءة داخل مداد';
      applyScribdZoom(state.scribdZoom || 100);
      if (loading) loading.classList.remove('hidden');
      frame.onload = () => { if (loading) loading.classList.add('hidden'); };
      setTimeout(() => { if (loading) loading.classList.add('hidden'); }, 2200);
      frame.src = rawUrl;
      modal.classList.remove('hidden');
      KTB.toast('تم فتح الكوميكس في القارئ الداخلي وحفظها في مكتبتك');
      return;
    }
    KTB.openUrl(rawUrl);
  }

  function closeScribdReaderModal() {
    const modal = $('scribdReaderModal');
    const frame = $('scribdReaderFrame');
    if (modal) modal.classList.add('hidden');
    if (frame) frame.src = 'about:blank';
    state.activeScribdBook = null;
    state.activeScribdDocId = '';
  }

  function applyWebSolveOutcome(book, meta, r, directFallbacks) {
    const srcName = (meta && meta.source) || (r && r.source) || book.source || 'مداد';
    if (r && r.ok && r.savedLocal && r.uri) {
      const fn = String(r.fileName || '');
      const fmt = fn.toLowerCase().endsWith('.epub') ? 'epub' : ((meta && meta.format) || book.format || 'pdf');
      const dlId = book.id + '_' + fmt;
      stopPrepProgress(book.id, false);
      recordCopySource(r.uri, book.title, srcName);
      if (fn) recordCopySource(fn, book.title, srcName);
      saveDlBookMeta(book, r.uri || dlId);
      if (fn) saveDlBookMeta(book, fn);
      cleanupCloudAfterLocalDownload(book.title, r.uri);
      if (KTB.registerSavedDownload) {
        KTB.registerSavedDownload({
          id: dlId,
          title: book.title,
          format: fmt,
          uri: r.uri,
          fileName: fn,
          bytes: Number(r.bytes || 0),
          source: srcName,
        });
      }
      KTB.toast('اكتمل الحفظ في مجلد Midad: ' + (fn || book.title) + ' — جاهز للقراءة');
      syncDownloadsFromNative();
      refreshModalActBar(book);
      updateScribdReaderDlPill(book.id);
      return true;
    }
    const hitUrl = (r && r.ok && (r.dlUrl || r.url)) || '';
    if (r && r.ok && hitUrl) {
      triggerDownload(book, Object.assign({}, meta || {}, {
        source: srcName,
        kind: 'direct',
        url: hitUrl,
        referer: r.referer || (meta && meta.referer) || (meta && meta.url) || book.url || (srcName.includes('نور') ? 'https://www.noor-book.com/' : ''),
        cookie: r.cookie || '',
        mime: r.mime || '',
        disposition: r.disposition || '',
      }), directFallbacks);
      return true;
    }
    return false;
  }

  function resolveBestDirectQuick(book) {
    return new Promise((resolve) => {
      let settled = false;
      let graceTimer = null;
      let latestLinks = [];
      const finish = () => {
        if (settled) return;
        settled = true;
        if (graceTimer) clearTimeout(graceTimer);
        const sorted = latestLinks.slice().sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book));
        const directList = sorted.filter(isDirectDownloadLink);
        resolve({ best: directList[0] || null, fallbacks: directList.slice(1, 3), all: sorted });
      };
      S.aggregateBookLinks(book, (prog) => {
        if (settled || !prog) return;
        if (Array.isArray(prog.links)) latestLinks = prog.links;
        if (prog.done) { finish(); return; }
        if (!graceTimer && latestLinks.some(isDirectDownloadLink)) {
          const hasHighScore = latestLinks.some(l => isDirectDownloadLink(l) && scoreDownloadLink(l, book) >= 1115);
          graceTimer = setTimeout(finish, hasHighScore ? 90 : 320);
        }
      }).then((finalSnap) => {
        if (finalSnap && Array.isArray(finalSnap.links)) latestLinks = finalSnap.links;
        finish();
      }).catch(() => finish());
    });
  }

  async function resolveFallbackDirectForModal(book, directFallbacks) {
    const liveModalDirect = (state.currentModalBook && state.currentModalBook.id === book.id && Array.isArray(state.currentModalLinks))
      ? state.currentModalLinks.filter(isDirectDownloadLink).sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book))
      : [];
    if (liveModalDirect.length) return liveModalDirect;
    if (Array.isArray(directFallbacks) && directFallbacks.length) return directFallbacks;
    const snap = await resolveBestDirectQuick(book).catch(() => ({ best: null, fallbacks: [] }));
    if (snap && snap.best) return [snap.best, ...(snap.fallbacks || [])];
    if (typeof S.findDirectMirrorsForBook === 'function') {
      const m = await S.findDirectMirrorsForBook(book.title, book.author, book.lang).catch(() => []);
      if (Array.isArray(m) && m.length) {
        return m.filter(isDirectDownloadLink).sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book));
      }
    }
    return [];
  }

  const activeQuickDlIds = new Set();
  async function quickDownloadBook(book, btnEl) {
    if (!book) return;
    if (findDownloadedMatches(book).length > 0) {
      openReadOrPickCopy(book);
      return;
    }
    if (activeQuickDlIds.has(book.id)) return;
    if (book.sourceId === 'scribd' || book.resolverType === 'scribd' || /scribd\.com\//i.test(book.url || '')) {
      openScribdInAppReader(book, book.url);
      return;
    }
    const prefFmt = getPreferredFormat();
    const prefExtraUrl = book.extra && book.extra.formats && book.extra.formats[prefFmt] ? String(book.extra.formats[prefFmt]) : '';
    const rawDl = prefExtraUrl || String(book.dlUrl || '');
    const rawFmt = (prefExtraUrl ? prefFmt : String(book.format || 'pdf')).toLowerCase();
    const isVerifiedDirectDl = rawDl
      && !/t\.me\/|scribd\.com\/search|mediafire\.com|drive\.google\.com\/file/i.test(rawDl)
      && /(?:archive\.org\/download\/|downloads\.hindawi\.org|drive\.usercontent\.google\.com|dl=1|bookleaks\.com\/files\/|book-shadow\.com\/files\/|foulabook\.com\/book\/downloading|alarabimag\.com\/books|academy\.hsoub\.com\/files|gutenberg\.org\/|get\.php\?md5=|arxiv\.org\/pdf\/|\.(?:pdf|epub|azw3|mobi|fb2|cbz)(?:\?|#|$))/i.test(rawDl);
    const matchesPrefAndClean = rawFmt === prefFmt
      && scoreEditionQuality('', rawDl, book.source) >= 0;
    if (isVerifiedDirectDl && matchesPrefAndClean) {
      triggerDownload(book, {
        url: rawDl,
        format: rawFmt,
        source: book.source,
        referer: book.referer || book.url || '',
      }, []);
      return;
    }

    if ($('bookModal') && !$('bookModal').classList.contains('hidden')
      && state.currentModalBook && state.currentModalBook.id === book.id
      && Array.isArray(state.currentModalLinks) && state.currentModalLinks.some(isDirectDownloadLink)) {
      const directList = state.currentModalLinks.filter(isDirectDownloadLink)
        .sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book));
      if (directList.length) {
        triggerDownload(book, directList[0], directList.slice(1, 3));
        return;
      }
    }

    activeQuickDlIds.add(book.id);
    const origHtml = btnEl ? btnEl.innerHTML : '';
    const origDisabled = btnEl ? btnEl.disabled : false;
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.innerHTML = SVG.download + '<span>جاري التجهيز...</span>';
    }
    KTB.toast('جاري تجهيز أفضل نسخة مباشرة للكتاب...');

    try {
      const snap = await resolveBestDirectQuick(book);
      if (snap.best) {
        triggerDownload(book, snap.best, snap.fallbacks);
        return;
      }
      const webRdrLink = (snap.all || []).find(l => l && l.kind === 'web_reader' && l.url);
      if (webRdrLink) {
        openWebBookInAppReader(book, webRdrLink);
        return;
      }
      const rt = book.resolverType || '';
      if (KTB.isAndroid() && book.url && rt.startsWith('web_')) {
        const engId = rt.slice(4);
        const eng = S.WEB_ENGINES && S.WEB_ENGINES[engId];
        startPrepProgress(book, book.source || 'مكتبة نور', 'جاري الاتصال بـ ' + (book.source || 'المصدر') + ' وتجهيز رابط التحميل...', {
          engId,
          linkUrl: book.url,
        });
        const solveRes = await KTB.solveWeb(book.url, 'sniff_dl_ui', eng ? eng.dlScript : '').catch(() => ({ ok: false }));
        if (applyWebSolveOutcome(book, { source: book.source, url: book.url, format: book.format }, solveRes, [])) return;
        stopPrepProgress(book.id, false);
        if (solveRes && solveRes.error === 'cancelled') { KTB.toast('تم إلغاء الجلب'); return; }
        if (engId === 'noorbook') {
          const errMsg = String((solveRes && solveRes.error) || '');
          if (/حقوق النشر|NOOR_LOCKED|NOOR_SUB|مدفوع/i.test(errMsg)) {
            KTB.toast('هذا الكتاب محمي بحقوق النشر في مكتبة نور ولا يمكن تحميله منها');
          } else {
            KTB.toast('تعذر إتمام التحميل من مكتبة نور حالياً — افتح تفاصيل الكتاب لاختيار مصدر آخر إذا أردت');
          }
          return;
        }
      }
      if (typeof S.findDirectMirrorsForBook === 'function') {
        const directMirrors = await S.findDirectMirrorsForBook(book.title, book.author, book.lang).catch(() => []);
        if (Array.isArray(directMirrors) && directMirrors.length) {
          const sortedM = directMirrors.filter(isDirectDownloadLink).sort((a, b) => scoreDownloadLink(b, book) - scoreDownloadLink(a, book));
          if (sortedM.length) {
            triggerDownload(book, sortedM[0], sortedM.slice(1, 3));
            return;
          }
        }
      }
      if (KTB.isAndroid() && (book.lang === 'ar' || /[\u0600-\u06FF]/.test(book.title || ''))) {
        startPrepProgress(book, 'مكتبة نور', 'جاري البحث والتجهيز التلقائي من مكتبة نور...', { engId: 'noorbook' });
        const wsRes = await S.webSearchAndDownload('noorbook', book.title, {
          author: book.author || '',
          altTitle: (book.extra && (book.extra.enTitle || book.extra.engTitle)) || book.titleEn || book.altTitle || '',
          lang: book.lang,
          format: getPreferredFormat(),
        }).catch(() => ({ ok: false }));
        if (wsRes && wsRes.ok && wsRes.links && wsRes.links.length) {
          const firstHit = wsRes.links[0];
          applyWebSolveOutcome(book, {
            source: (wsRes.fromMirrorFallback ? firstHit.source : 'مكتبة نور'),
            url: (wsRes.picked && wsRes.picked.url) || book.url || '',
            referer: firstHit.referer || (wsRes.picked && wsRes.picked.url) || 'https://www.noor-book.com/',
            format: firstHit.format || book.format,
          }, Object.assign({ ok: true }, firstHit), []);
          return;
        }
        stopPrepProgress(book.id, false);
        if (wsRes && wsRes.error === 'cancelled') { KTB.toast('تم إلغاء الجلب'); return; }
      }
      KTB.toast('افتح تفاصيل الكتاب لاختيار من القنوات والمصادر المتاحة');
      if ($('bookModal').classList.contains('hidden')) openBookDetail(book);
    } finally {
      activeQuickDlIds.delete(book.id);
      if (btnEl && btnEl.isConnected) {
        btnEl.disabled = origDisabled;
        btnEl.innerHTML = origHtml;
      }
    }
  }

  async function triggerDownload(book, link, fallbackMirrors, opts) {
    const o = opts || {};
    const canAndroidNativeWebtoon = KTB.isAndroid() && link && link.episodeResolver === 'webtoon' && link.episodeViewerUrl;
    if (link && link.kind === 'cbz_images' && !link.imageUrls && link.episodeViewerUrl && !(o.fastAndroidExtract && canAndroidNativeWebtoon)) {
      if (!o.quietToast) KTB.toast('جاري تجميع صفحات الحلقة لتحويلها إلى CBZ أوفلاين...');
      let epImgs = [];
      try {
        if (link.episodeResolver === 'webtoon' && S && typeof S.extractWebtoonEpisodeImages === 'function') {
          epImgs = await S.extractWebtoonEpisodeImages(link.episodeViewerUrl);
        } else if (link.episodeResolver === 'tapas' && S && typeof S.extractTapasEpisodeImages === 'function') {
          epImgs = await S.extractTapasEpisodeImages(link.episodeViewerUrl);
        }
      } catch (_) { }
      if (Array.isArray(epImgs) && epImgs.length) {
        link = Object.assign({}, link, { imageUrls: epImgs });
      } else if (!canAndroidNativeWebtoon) {
        KTB.toast('الحلقة متاحة للقراءة أونلاين داخل مداد');
        openWebBookInAppReader(book, link.episodeViewerUrl || book.url);
        return;
      }
    }
    const fmt = (link.format || book.format || 'pdf').split(/[\/,|]/)[0].trim();
    const chapSuffix = link && link.chapterSlug ? ('_' + String(link.chapterSlug).replace(/[^a-z0-9_-]/gi, '').slice(0, 22)) : '';
    const dlId = book.id + '_' + fmt + chapSuffix;
    const dlTitle = (link && link.dlTitle) || book.title;
    const srcName = (link && link.source) || book.source || '';
    state.seenDoneIds.delete(dlId);
    state.seenErrIds.delete(dlId);
    if (srcName) recordCopySource(dlId, dlTitle, srcName);
    saveDlBookMeta(Object.assign({}, book, { title: dlTitle, format: fmt }), dlId);
    cancelDoneBarCleanup(book.id);
    const rowKey = resolveRowProgKey(o, link);
    if (rowKey && book && book.id) state.activeRowKeyByBook.set(book.id, rowKey);
    if (state.prepJobs.has(book.id)) stopPrepProgress(book.id, true);
    const refUrl = link.referer || book.url || '';
    const headers = {};
    if (refUrl) headers.Referer = refUrl;
    if (link.cookie) headers.Cookie = link.cookie;
    const mirrors = Array.isArray(fallbackMirrors)
      ? fallbackMirrors
        .filter(m => m && m.url && m.url !== link.url && m.kind !== 'external' && m.kind !== 'webview_dl' && m.kind !== 'web_search_dl' && m.kind !== 'scribd_reader' && m.kind !== 'web_reader' && m.kind !== 'cbz_images')
        .slice(0, 2)
        .map(m => ({ url: m.url, referer: m.referer || book.url || '' }))
      : [];
    KTB.downloadBook({
      id: dlId,
      title: dlTitle,
      url: link.url,
      kind: link.kind || '',
      imagesApiUrl: link.imagesApiUrl || (link.episodeResolver === 'webtoon' ? (link.episodeViewerUrl || '') : ''),
      imageUrls: Array.isArray(link.imageUrls) ? link.imageUrls : undefined,
      format: fmt,
      source: srcName,
      referer: refUrl,
      headers,
      mirrors,
    });
    recordTaste(book, 3);
    if (REC) REC.recordSignal(book, 'download');
    state._lastHomeAlloc = null;
    renderPersonalShelf();
    refreshHeroSafe();
    if (!o.quietToast) {
      KTB.toast('بدأ التحميل السريع في مجلد Midad — سيظهر زر «اقرأ الآن» فور اكتماله (+5 لإشارات الذوق)');
    }
    syncDownloadsFromNative();
  }

  async function downloadWebtoonBatch(book, epLinks, maxCount) {
    if (!book || !Array.isArray(epLinks) || !epLinks.length) return;
    const batch = epLinks.slice(0, Math.max(1, maxCount || 5));
    KTB.toast('جاري جدولة تحميل ' + batch.length + ' حلقات متتالية بصيغة CBZ...');
    for (let i = 0; i < batch.length; i++) {
      await triggerDownload(book, batch[i], [], { fastAndroidExtract: true, quietToast: true });
      if (i < batch.length - 1) await new Promise(r => setTimeout(r, 120));
    }
  }

  function refreshHeroSafe() {
    if (state.homeCat === 'all') {
      renderHero();
      renderHorizonShelf();
      renderTrendingShelf();
    }
  }

  // ------------------------------------------------------------------ Book Detail Modal (+ Like + Similar + Instant Read)
  async function openBookDetail(rawBook) {
    const book = registerBook(rawBook);
    if (REC) REC.enrichBook(book);
    if (state._detailDwellTimer) {
      clearTimeout(state._detailDwellTimer);
      state._detailDwellTimer = null;
    }
    if (state._linksRenderTimer) {
      clearTimeout(state._linksRenderTimer);
      state._linksRenderTimer = null;
    }
    state._linksRenderSig = '';
    if (KTB.haptic) KTB.haptic('tick');
    const modalGen = ++state.modalGen;
    state.currentModalBook = book;
    state.currentModalLinks = [];
    const mbEl = $('modalBody');
    if (mbEl) mbEl.scrollTop = 0;
    // Defer heavy synchronous localStorage/SQLite writes slightly off initial frame paint
    setTimeout(() => {
      pushHistory(book);
      if (REC && REC.markBookClicked) REC.markBookClicked(book);
    }, 60);
    state._detailDwellTimer = setTimeout(() => {
      state._detailDwellTimer = null;
      if (state.modalGen === modalGen && !$('bookModal').classList.contains('hidden') && REC) {
        REC.recordSignal(book, 'browse30s');
        state._lastHomeAlloc = null;
      }
    }, 30000);

    // If opened from Author modal, hide author modal cleanly so detail sits front and crisp
    $('authorModal').classList.add('hidden');
    $('bookModal').classList.remove('hidden');
    $('modalTopTitle').textContent = book.title;
    $('modalSave').classList.toggle('on', isBookmarked(book.id));
    $('modalLike').classList.toggle('like-on', isLiked(book.id));
    $('modalSave').onclick = () => {
      toggleBookmark(book);
      $('modalSave').classList.toggle('on', isBookmarked(book.id));
    };
    $('modalLike').onclick = () => {
      toggleLike(book);
      $('modalLike').classList.toggle('like-on', isLiked(book.id));
      renderDetailSimilar(book);
    };
    $('modalCopy').onclick = () => {
      KTB.copy(book.dlUrl || book.url || book.title);
      KTB.toast('تم نسخ الرابط');
    };

    const isAr = book.lang === 'ar' || /[\u0600-\u06FF]/.test(book.title || '');
    const [c1, c2] = coverColors(book.title, book.cat, isAr);
    const covUrl = safeBookCoverUrl(book);
    const covEl =
      '<div id="detailCovFallback" class="detail-cover' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + ';position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:14px;text-align:center;font-weight:800;font-size:13px;background:linear-gradient(150deg,' + c1 + ',' + c2 + ')">'
      + (isAr ? coverInnerHtml(book) : ('<span>' + esc(book.title) + '</span>'))
      + (covUrl
        ? '<img id="detailCovImg" src="' + esc(covUrl) + '" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s" onload="window.__midadImgLoad(this)" onerror="window.__midadImgErr(this)">'
        : '')
      + '</div>';

    const dlMatches = findDownloadedMatches(book);
    const readNowLabel = dlMatches.length > 1
      ? ('اقرأ الآن (اختيار من ' + dlMatches.length + ' نسخ)')
      : 'اقرأ الآن (قارئ مداد)';
    const cleanAuthor = S.cleanAuthorName(book.author);
    const hasAuthor = cleanAuthor && cleanAuthor !== 'مؤلف غير محدد';
    const liked = isLiked(book.id);
    state._linksExpanded = false;
    state._descExpanded = false;

    let hasExactPdfPages = false;
    let initialPages = String(book.pages || '').replace(/[^\d]/g, '');
    if (dlMatches.length && KTB.getPdfPageCount) {
      for (const dm of dlMatches) {
        if (String(dm.format || '').toLowerCase() === 'pdf' && dm.uri) {
          const pc = KTB.getPdfPageCount(dm.uri);
          if (pc > 0) {
            initialPages = String(pc);
            hasExactPdfPages = true;
            break;
          }
        }
      }
    }
    if (initialPages) book.pages = initialPages;
    const pagesLabel = initialPages ? ('عدد الصفحات: ' + initialPages + ' صفحة') : 'عدد الصفحات: جاري التحقق...';
    const readTimeLabel = book.readTimeLabel || (REC && REC.formatReadTime ? REC.formatReadTime(book.avgMinutes) : '');
    const microTagsHtml = Array.isArray(book.microTags) && book.microTags.length
      ? ('<div class="detail-micro-tags">' + book.microTags.slice(0, 4).map(t => '<span class="micro-tag-chip">' + esc(t) + '</span>').join('') + '</div>')
      : '';
    const curRating = REC && REC.getBookRating ? REC.getBookRating(book) : 0;
    const initSummaryTxt = (S && typeof S.ensureArabicSummary === 'function')
      ? S.ensureArabicSummary(book, book.desc || book.summary || '')
      : (book.summary || book.desc || '');
    const starsHtml = [1, 2, 3, 4, 5].map(st =>
      '<button type="button" class="star-btn ' + (st <= curRating ? 'on' : '') + '" data-rate="' + st + '" title="تقييم ' + st + ' من 5">' + SVG.starFill + '</button>'
    ).join('');
    const rateStatusTxt = curRating >= 4
      ? (curRating + '/5 (+8 نقاط للذوق)')
      : (curRating > 0 && curRating <= 2 ? (curRating + '/5 (تم تقليل المشابه)') : (curRating ? (curRating + '/5') : 'قيّم الكتاب'));

    $('modalBody').innerHTML =
      '<div class="detail-hero">'
      + covEl
      + '<div class="detail-info">'
      + '<h2>' + esc(book.title) + '</h2>'
      + (hasAuthor
        ? '<button type="button" id="detailAuthorChip" class="detail-author-chip">' + SVG.user + '<span>' + esc(book.author) + ' — كل كتبه</span></button>'
        : '<div style="font-size:12.5px;color:var(--muted);margin-bottom:6px">' + esc(book.author) + '</div>')
      + '<div class="detail-badges">'
      + '<span class="d-badge">' + esc((book.format || 'pdf').toUpperCase()) + '</span>'
      + '<span class="d-badge" id="detailPagesBadge">' + esc(pagesLabel) + '</span>'
      + (book.subCat ? '<span class="d-badge">' + esc(book.subCat) + '</span>' : '')
      + (readTimeLabel ? '<span class="d-badge">' + esc(readTimeLabel) + '</span>' : '')
      + ((Array.isArray(book._mergedVariants) && book._mergedVariants.length > 0)
        ? ('<span class="d-badge">' + esc('+' + book._mergedVariants.length + ' مصادر') + '</span>')
        : '')
      + (book.year ? '<span class="d-badge">' + esc(book.year) + '</span>' : '')
      + '<span class="d-badge d-badge-rating" id="detailCommunityBadge"></span>'
      + '</div>'
      + '</div></div>'
      + '<div class="detail-act-bar">'
      + (dlMatches.length
        ? '<button id="detailReadNowBtn" class="btn emerald detail-primary-cta">' + SVG.bookOpen + '<span>' + esc(readNowLabel) + '</span></button>'
        : '<button id="detailQuickDlBtn" class="btn emerald detail-primary-cta">' + SVG.download + '<span>تحميل الآن</span></button>')
      + '<div class="detail-sec-acts">'
      + '<button id="detailLikeBtn" class="btn ' + (liked ? 'like' : 'glass') + ' sm">' + (liked ? SVG.heartFill : SVG.heart) + '<span>' + (liked ? 'تم الإعجاب' : 'أعجبني') + '</span></button>'
      + '<button id="detailSearchAll" class="btn glass sm">' + SVG.sparkle + '<span>نسخ أخرى</span></button>'
      + (book.url ? '<button id="detailOrigUrl" class="btn glass sm">المصدر</button>' : '')
      + '</div></div>'
      + '<div class="detail-rate-box" id="detailRateBox">'
      + '<span class="detail-rate-lbl">تقييمك:</span>'
      + '<div class="star-rating-row" id="detailStarRow">' + starsHtml + '</div>'
      + '<span class="detail-rate-status" id="detailRateStatus">' + esc(rateStatusTxt) + '</span>'
      + '<button type="button" id="detailDismissBtn" class="link-btn" style="margin-inline-start:auto">غير مناسب لي</button>'
      + '</div>'
      + '<div class="detail-desc-wrap">'
      + '<div class="detail-desc-head">نبذة عن الكتاب</div>'
      + '<p id="detailDesc" class="detail-desc clamped">' + esc(initSummaryTxt || 'جاري جلب الوصف وروابط التحميل...') + '</p>'
      + '<button type="button" id="detailDescToggle" class="detail-desc-more hidden"><span>عرض المزيد</span>' + SVG.chevronDown + '</button>'
      + microTagsHtml
      + '</div>'
      + '<div class="dl-links-box" id="detailLinksBox"><div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)"><span class="spin"></span><span>جاري فحص روابط التحميل المباشرة...</span></div></div>'
      + '<div id="detailReviewsBox" class="reviews-sec"></div>'
      + '<div id="detailSimilarBox"></div>';

    if ($('detailJumpReviewsBtn') && $('detailReviewsBox')) {
      $('detailJumpReviewsBtn').onclick = () => {
        $('detailReviewsBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }

    if ($('detailStarRow')) {
      $('detailStarRow').querySelectorAll('.star-btn').forEach(sb => {
        sb.onclick = () => {
          const stars = Number(sb.dataset.rate) || 0;
          if (REC && REC.setBookRating) REC.setBookRating(book, stars, isLiked(book.id));
          if (stars >= 4) recordTaste(book, 4);
          $('detailStarRow').querySelectorAll('.star-btn').forEach(btn => {
            btn.classList.toggle('on', Number(btn.dataset.rate) <= stars);
          });
          if ($('composerStarRow')) {
            $('composerStarRow').querySelectorAll('[data-cstar]').forEach(btn => {
              btn.classList.toggle('on', Number(btn.dataset.cstar) <= stars);
            });
            $('composerStarRow').dataset.selectedStars = String(stars);
          }
          if ($('detailRateStatus')) {
            $('detailRateStatus').textContent = stars >= 4
              ? (stars + '/5 (+8 نقاط للذوق)')
              : (stars <= 2 ? (stars + '/5 (-3 لتعديل الذوق)') : (stars + '/5 (تم الحفظ)'));
          }
          refreshRecommendationShelves();
          KTB.toast(stars >= 4 ? 'شكراً لتقييمك (' + stars + '/5) — تم تعزيز الترشيحات المشابهة' : 'تم حفظ تقييمك وتحديث الترشيحات');
        };
      });
    }
    renderDetailReviews(book);
    if ($('detailDismissBtn')) {
      $('detailDismissBtn').onclick = () => {
        if (REC && REC.dismissRecommendation) REC.dismissRecommendation(book);
        $('bookModal').classList.add('hidden');
        if (state._detailDwellTimer) {
          clearTimeout(state._detailDwellTimer);
          state._detailDwellTimer = null;
        }
        state.modalGen = (state.modalGen || 0) + 1;
        state.currentModalBook = null;
        refreshRecommendationShelves();
        KTB.toast('تم إخفاء الكتاب وتقليل ترشيحاته المشابهة');
      };
    }

    if ($('detailReadNowBtn')) {
      $('detailReadNowBtn').onclick = () => openReadOrPickCopy(book);
    }
    if ($('detailQuickDlBtn')) {
      $('detailQuickDlBtn').onclick = () => quickDownloadBook(book, $('detailQuickDlBtn'));
    }
    if ($('detailAuthorChip')) {
      $('detailAuthorChip').onclick = () => openAuthorHub(book.author);
    }
    $('detailLikeBtn').onclick = () => {
      toggleLike(book);
      const now = isLiked(book.id);
      $('modalLike').classList.toggle('like-on', now);
      $('detailLikeBtn').className = 'btn ' + (now ? 'like' : 'glass') + ' sm';
      $('detailLikeBtn').innerHTML = (now ? SVG.heartFill : SVG.heart) + '<span>' + (now ? 'تم الإعجاب' : 'أعجبني') + '</span>';
      renderDetailSimilar(book);
    };
    $('detailSearchAll').onclick = () => {
      $('bookModal').classList.add('hidden');
      const sq = book.query || (book.title + ' ' + (hasAuthor ? cleanAuthor : ''));
      $('q').value = sq;
      runSearch(sq);
    };
    if ($('detailOrigUrl')) $('detailOrigUrl').onclick = () => KTB.openUrl(book.url);

    // Render Similar Books on next animation frame so modal opening stays at 60fps
    requestAnimationFrame(() => {
      if (state.modalGen === modalGen && state.currentModalBook && state.currentModalBook.id === book.id) {
        renderDetailSimilar(book);
      }
    });

    // Multi-Source Download Mirror Aggregation (Queries ALL compatible Arabic, Global & Telegram libraries simultaneously)
    const boxEl = $('detailLinksBox');
    if (boxEl) {
      boxEl.innerHTML =
        '<div id="detailLinksList"><div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)"><span class="spin"></span><span>جاري فحص المصادر والنسخ المتاحة لهذا الكتاب...</span></div></div>';
    }

    function applyDetailCover(url) {
      if (!isSafeCoverForBook(book, url)) return;
      if (state.modalGen !== modalGen) return;
      book.cover = url;
      COVER_CACHE[book.id] = url;
      saveCoverCache();
      applyCoverToCardDom(book.id, url);
      const wrap = $('detailCovFallback');
      if (!wrap) return;
      let img = $('detailCovImg');
      if (!img) {
        img = document.createElement('img');
        img.id = 'detailCovImg';
        img.alt = '';
        img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .15s';
        img.onload = function () { window.__midadImgLoad(this); };
        img.onerror = function () { window.__midadImgErr(this); };
        wrap.appendChild(img);
      }
      if (img.src !== url) img.src = url;
    }

    if (!covUrl && S && typeof S.resolveBookCover === 'function') {
      COVER_MISS.delete(book.id);
      S.resolveBookCover(book, { force: true, priority: 'high' }).then(applyDetailCover).catch(() => {});
    }

    function updateDetailDesc(text) {
      const descEl = $('detailDesc');
      const togBtn = $('detailDescToggle');
      if (!descEl) return;
      const finalTxt = (S && typeof S.ensureArabicSummary === 'function')
        ? S.ensureArabicSummary(book, text)
        : (text || '');
      if (descEl.textContent === finalTxt) return;
      descEl.textContent = finalTxt;
      descEl.classList.toggle('clamped', !state._descExpanded);
      if (!togBtn) return;
      togBtn.onclick = () => {
        state._descExpanded = !state._descExpanded;
        descEl.classList.toggle('clamped', !state._descExpanded);
        togBtn.classList.toggle('open', state._descExpanded);
        togBtn.querySelector('span').textContent = state._descExpanded ? 'عرض أقل' : 'عرض المزيد';
      };
      requestAnimationFrame(() => {
        if (state.modalGen !== modalGen) return;
        const wasExpanded = !descEl.classList.contains('clamped');
        if (wasExpanded) descEl.classList.add('clamped');
        const overflows = descEl.scrollHeight > descEl.clientHeight + 4;
        if (wasExpanded) descEl.classList.remove('clamped');
        togBtn.classList.toggle('hidden', !overflows);
        togBtn.classList.toggle('open', state._descExpanded);
        togBtn.querySelector('span').textContent = state._descExpanded ? 'عرض أقل' : 'عرض المزيد';
      });
    }
    updateDetailDesc(initSummaryTxt || 'جاري جلب الوصف وروابط التحميل...');

    function scheduleRenderLinks(links, stillLoading, phase) {
      const arr = Array.isArray(links) ? links : [];
      const hasRenderedRows = Boolean($('detailLinksList') && $('detailLinksList').querySelector('.dl-link-row'));
      if (!stillLoading || !arr.length || !hasRenderedRows) {
        if (state._linksRenderTimer) {
          clearTimeout(state._linksRenderTimer);
          state._linksRenderTimer = null;
        }
        renderResolvedLinksBox(book, arr, stillLoading, phase);
        return;
      }
      if (state._linksRenderTimer) clearTimeout(state._linksRenderTimer);
      state._linksRenderTimer = setTimeout(() => {
        state._linksRenderTimer = null;
        if (state.modalGen !== modalGen) return;
        renderResolvedLinksBox(book, state.currentModalLinks || arr, true, phase);
      }, 180);
    }

    await S.aggregateBookLinks(book, (prog) => {
      if (state.modalGen !== modalGen) return;
      if (Array.isArray(prog.links)) state.currentModalLinks = prog.links.slice();
      if (prog.summary) updateDetailDesc(prog.summary);
      if (prog.pages && !hasExactPdfPages) {
        book.pages = prog.pages;
        if (REC && REC.enrichBook) REC.enrichBook(book);
      }
      const pgBadge = $('detailPagesBadge');
      if (pgBadge) {
        if (book.pages) {
          pgBadge.textContent = 'عدد الصفحات: ' + book.pages + ' صفحة';
        } else if (prog.done) {
          pgBadge.textContent = 'عدد الصفحات: غير محدد';
        }
      }
      if (prog.cover) applyDetailCover(prog.cover);
      const qBtn = $('detailQuickDlBtn');
      if (qBtn && !qBtn.disabled && !activeQuickDlIds.has(book.id) && Array.isArray(prog.links)) {
        const bestDirect = orderDownloadLinks(prog.links.filter(isDirectDownloadLink), book)[0];
        if (bestDirect) {
          const sp = qBtn.querySelector('span');
          if (sp) {
            sp.textContent = 'تحميل الآن (' + (bestDirect.source || 'مباشر') + ' • ' + String(bestDirect.format || 'pdf').toUpperCase() + ')';
          }
        }
      }
      scheduleRenderLinks(prog.links, !prog.done, prog.phase);
    });
  }

  function sourcePillClass(src) {
    const s = String(src || '').toLowerCase();
    if (s.includes('تيليجرام') || s.includes('telegram')) return 'tg';
    if (s.includes('أرشيف') || s.includes('archive') || s.includes('وقفي')) return 'arch';
    if (s.includes('هنداوي') || s.includes('ويكي') || s.includes('libgen')) return 'hind';
    return '';
  }

  async function searchTelegramChipInApp(handle, queryText, book, isBot) {
    const cleanH = S.sanitizeTelegramHandle(handle);
    if (!cleanH || !book) return;
    const modalGen = state.modalGen;
    const cleanQ = S.cleanSearchTitle(queryText || book.title || '');
    const listHost = $('detailLinksList') || $('detailLinksBox');
    if (listHost) {
      listHost.innerHTML = '<span class="spin"></span><span>جاري البحث واستخراج روابط التحميل من @' + esc(cleanH) + ' داخل مداد...</span>';
    }
    const collected = [];
    const seen = new Set();
    const pushUnique = (arr) => {
      (arr || []).forEach((l) => {
        if (!l || !l.url || seen.has(l.url)) return;
        seen.add(l.url);
        collected.push(l);
      });
    };

    try {
      const targetChannels = isBot ? undefined : [cleanH];
      const hits = await S.searchTelegramChannels(cleanQ, targetChannels
        ? { channels: targetChannels, maxChannels: 1, limitPerCh: 6 }
        : { maxChannels: 6, limitPerCh: 3 }).catch(() => []);
      const firstBatch = await Promise.allSettled(
        hits.slice(0, 4).map(h => S.withTimeout(S.resolveTelegramPost(h, { skipFallbackMirrors: true }), 4000, { links: [] }))
      );
      firstBatch.forEach(s => { if (s.status === 'fulfilled' && s.value) pushUnique(s.value.links); });
      if (!collected.some(l => l.kind !== 'external')) {
        const fallbackHits = await S.searchTelegramChannels(cleanQ, { maxChannels: 6, limitPerCh: 2 }).catch(() => []);
        const secondBatch = await Promise.allSettled(
          fallbackHits.slice(0, 3).map(fh => S.withTimeout(S.resolveTelegramPost(fh), 4500, { links: [] }))
        );
        secondBatch.forEach(s => { if (s.status === 'fulfilled' && s.value) pushUnique(s.value.links); });
      }
    } catch (_) {}

    if (isBot || !collected.some(l => l.kind !== 'external')) {
      pushUnique([{
        label: 'فتح @' + cleanH + ' في تطبيق تيليجرام (اختياري — ينسخ اسم الكتاب)',
        format: book.format || 'pdf',
        kind: 'external',
        source: 'تيليجرام @' + cleanH,
        url: 'https://t.me/' + encodeURIComponent(cleanH),
        copyText: cleanQ,
      }]);
    }
    if (state.modalGen !== modalGen || !state.currentModalBook || state.currentModalBook.id !== book.id) return;
    renderResolvedLinksBox(book, collected, false, 'تيليجرام');
  }

  function renderModalTelegramStrip(book) {
    const host = $('detailTgStrip');
    if (!host) return;
    const cleanQ = S.cleanSearchTitle(book.title);
    const preset = Array.isArray(CATS.TELEGRAM_HUB) ? CATS.TELEGRAM_HUB : [];
    const custom = getCustomTelegramList().map(c => ({ handle: c.handle || c, name: '@' + (c.handle || c), kind: 'custom', cat: 'all' }));
    const picks = [
      ...custom.slice(0, 2),
      ...preset.filter(x => x.kind !== 'bot' && x.cat === book.cat),
      ...preset.filter(x => x.kind !== 'bot' && x.cat === 'all'),
      ...preset.filter(x => x.kind === 'bot'),
    ];
    const seenH = new Set();
    const uniquePicks = picks.filter(x => {
      if (!x.handle || seenH.has(x.handle)) return false;
      seenH.add(x.handle);
      return true;
    }).slice(0, 6);

    host.innerHTML =
      '<div class="tg-modal-box">'
      + '<div class="tg-modal-head">'
      + '<span style="display:inline-flex;align-items:center;gap:6px">' + SVG.telegram + '<span>بحث وتحميل مباشر من قنوات تيليجرام داخل مداد</span></span>'
      + '<button type="button" class="btn glass sm" id="tgSearchAllBtn">بحث داخل كل القنوات</button>'
      + '</div>'
      + '<div class="tg-chip-row">'
      + uniquePicks.map(p =>
        '<button type="button" class="tg-chip-btn" data-tg-book="' + esc(p.handle) + '" data-tg-bot="' + (p.kind === 'bot' ? '1' : '0') + '">'
        + SVG.telegram + '<span>' + esc(p.name) + ' (@' + esc(p.handle) + ')</span></button>'
      ).join('')
      + '</div></div>';

    host.querySelectorAll('[data-tg-book]').forEach(btn => {
      btn.onclick = () => searchTelegramChipInApp(btn.dataset.tgBook, cleanQ, book, btn.dataset.tgBot === '1');
    });
    const scanAll = $('tgSearchAllBtn');
    if (scanAll) {
      scanAll.onclick = () => {
        $('bookModal').classList.add('hidden');
        switchTab('search');
        $('sourceScope').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.scope === 'telegram'));
        state.searchScope = 'telegram';
        $('q').value = cleanQ;
        runSearch(cleanQ);
      };
    }
  }

  function renderResolvedLinksBox(book, links, stillLoading, activePhase) {
    const listHost = $('detailLinksList') || $('detailLinksBox');
    if (!listHost) return;
    if ((!links || !links.length) && stillLoading) return;
    const canTgBot = Boolean(S && typeof S.fetchViaTelegramBot === 'function' && (KTB.isAndroid() || (S.getMtprotoConfig && S.getMtprotoConfig().url)));
    const mtBotHandle = (S && S.getMtprotoConfig && S.getMtprotoConfig().bot) || 'GedoLibrary_bot';
    const tgBotBtnHtml = canTgBot
      ? ('<button type="button" id="btnFetchTgBot" class="btn glass sm">' + SVG.telegram + '<span>جلب مباشر من @' + esc(mtBotHandle) + '</span></button>')
      : '';
    const bindTgBotBtn = () => {
      const b = $('btnFetchTgBot');
      if (!b || !canTgBot) return;
      b.onclick = async () => {
        b.disabled = true;
        b.textContent = 'جاري الطلب من البوت...';
        startPrepProgress(book, 'تيليجرام @' + mtBotHandle, 'جاري إرسال طلب الكتاب إلى @' + mtBotHandle + ' واستلام الملف داخل مداد...', {
          engId: 'tg_bot',
          linkUrl: 'tg_bot://' + mtBotHandle,
        });
        const res = await S.fetchViaTelegramBot(book, { bot: mtBotHandle, format: getPreferredFormat() }).catch(() => ({ ok: false }));
        b.disabled = false;
        if (b.isConnected) b.innerHTML = SVG.telegram + '<span>جلب مباشر من @' + esc(mtBotHandle) + '</span>';
        if (res && res.ok && res.links && res.links.length) {
          const hit = res.links[0];
          applyWebSolveOutcome(book, Object.assign({}, hit, { source: hit.source || ('تيليجرام @' + mtBotHandle) }), Object.assign({ ok: true }, hit), []);
          return;
        }
        stopPrepProgress(book.id, false);
        if (res && res.error === 'cancelled') KTB.toast('تم إلغاء الطلب من تيليجرام');
        else if (res && res.error === 'TG_AUTH') KTB.toast('سجّل دخولك لتيليجرام داخل النافذة أولاً ثم أعد المحاولة');
        else KTB.toast('لم يرسل البوت ملفاً لهذا العنوان أو تعذر الوصول — جرب اسماً أوضح أو فعّل خادم MTProto من الإعدادات');
      };
    };

    if (!links || !links.length) {
      listHost.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">'
        + '<span style="font-size:13px;color:var(--muted)">لم نعثر على ملف مباشر مطابق في المصادر المفتوحة حالياً — يمكنك توسيع البحث أو الطلب من بوت تيليجرام.</span>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + tgBotBtnHtml + '<button id="btnFallbackSearch" class="btn emerald sm">بحث في كل المكتبات</button></div></div>';
      $('btnFallbackSearch').onclick = () => $('detailSearchAll').click();
      bindTgBotBtn();
      return;
    }

    const sortedLinks = orderDownloadLinks(links, book);

    function selectTopLinks(allSorted, limit) {
      if (allSorted.length <= limit) return allSorted;
      const picked = [];
      const seen = new Set();
      const srcCounts = {};
      const addItem = (item) => {
        if (!item || seen.has(item.url)) return false;
        seen.add(item.url);
        picked.push(item);
        const key = String(item.source || '').toLowerCase();
        srcCounts[key] = (srcCounts[key] || 0) + 1;
        return true;
      };

      const bestDirect = allSorted.find(isDirectDownloadLink);
      if (bestDirect) addItem(bestDirect);

      const webReaderItem = allSorted.find(l => l && l.kind === 'web_reader');
      if (webReaderItem) addItem(webReaderItem);

      const scribdItem = allSorted.find(isScribdDownloadLink);
      const nonScribdPool = allSorted.filter(l => !isScribdDownloadLink(l) && !(l && l.kind === 'web_reader'));
      const targetNonScribd = scribdItem ? (limit - 1) : limit;

      for (const l of nonScribdPool) {
        if (picked.length >= targetNonScribd) break;
        if (seen.has(l.url)) continue;
        const k = String(l.source || '').toLowerCase();
        if ((srcCounts[k] || 0) >= 2) continue;
        addItem(l);
      }
      for (const l of nonScribdPool) {
        if (picked.length >= targetNonScribd) break;
        addItem(l);
      }
      if (scribdItem && picked.length < limit) addItem(scribdItem);
      return orderDownloadLinks(picked, book);
    }

    const hasMore = sortedLinks.length > 5;
    const expanded = !!state._linksExpanded;
    const shownLinks = (hasMore && !expanded) ? selectTopLinks(sortedLinks, 5) : sortedLinks;
    const directFallbacks = sortedLinks.filter(isDirectDownloadLink);
    const activeJob = findActiveDownloadJob(book);
    const renderSig = [
      book.id,
      stillLoading ? '1' : '0',
      expanded ? '1' : '0',
      sortedLinks.length,
      shownLinks.map(l => (l.url || '') + '|' + (l.kind || '')).join(','),
      activeJob ? (activeJob.phaseText || '') + ':' + getDisplayDownloadPct(activeJob) : '',
    ].join('::');
    if (renderSig === state._linksRenderSig && listHost.querySelector('.dl-link-row')) return;
    state._linksRenderSig = renderSig;
    const headStatus = stillLoading
      ? (' <small style="font-weight:500;color:var(--muted)">(جاري فحص باقي المكتبات...)</small>')
      : '';

    const wtEps = sortedLinks.filter(l => l && l.kind === 'cbz_images' && l.episodeResolver === 'webtoon');
    const batchBtnHtml = wtEps.length >= 2
      ? ('<button type="button" id="btnWtBatchDl" class="btn emerald sm" style="margin-inline-start:auto">' + SVG.download + '<span>تحميل أول ' + Math.min(5, wtEps.length) + ' حلقات CBZ</span></button>')
      : '';

    listHost.innerHTML = '<div class="dl-links-head" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span>النسخ والروابط المتوفرة (' + sortedLinks.length + ')</span>' + headStatus + batchBtnHtml + '</div>'
      + shownLinks.map((l, idx) => {
        const srcName = l.source || book.source || 'مكتبة';
        const pillCls = sourcePillClass(srcName);
        const isExt = l.kind === 'external';
        const isWv = l.kind === 'webview_dl';
        const isWsDl = l.kind === 'web_search_dl';
        const isTgDirect = l.kind === 'tg_direct';
        const isScribdReader = l.kind === 'scribd_reader';
        const isWebReader = l.kind === 'web_reader';
        const isWtEp = l.kind === 'cbz_images' && l.episodeResolver === 'webtoon';
        const isBest = idx === 0 && !isExt && !isWv && !isWsDl && !isTgDirect && !isScribdReader && !isWebReader;
        const extLabel = 'فتح المصدر';
        const extIcon = SVG.globe;
        const wsLabel = l.requiresAccount ? ('حساب ' + (l.engId === 'scribd' ? 'Scribd' : srcName)) : 'تحميل مباشر';
        const wvLabel = l.requiresAccount ? ('حساب ' + (srcName.includes('Scribd') ? 'Scribd' : srcName)) : 'تحميل مباشر';
        let actionHtml;
        if (isScribdReader) {
          actionHtml = '<button class="btn emerald sm" data-scribd-idx="' + idx + '">' + SVG.bookOpen + '<span>قراءة فورية</span></button>';
        } else if (isWebReader) {
          actionHtml = '<button class="btn emerald sm" data-webrdr-idx="' + idx + '">' + SVG.bookOpen + '<span>قراءة داخل مداد</span></button>';
        } else if (isWtEp) {
          actionHtml = '<div style="display:flex;gap:5px;flex-wrap:wrap">'
            + '<button class="btn glass sm" data-wt-read-idx="' + idx + '">' + SVG.bookOpen + '<span>قراءة</span></button>'
            + '<button class="btn emerald sm" data-dl-idx="' + idx + '">' + SVG.download + '<span>CBZ</span></button>'
            + '</div>';
        } else if (isTgDirect) {
          actionHtml = '<button class="btn emerald sm" data-tgdl-idx="' + idx + '">' + SVG.download + '<span>تحميل مباشر</span></button>';
        } else if (isWsDl) {
          actionHtml = '<button class="btn ' + (l.requiresAccount ? 'glass' : 'emerald') + ' sm" data-wsdl-idx="' + idx + '">' + (l.requiresAccount ? SVG.globe : SVG.download) + '<span>' + wsLabel + '</span></button>';
        } else if (isWv) {
          actionHtml = '<button class="btn ' + (l.requiresAccount ? 'glass' : 'emerald') + ' sm" data-wv-idx="' + idx + '">' + (l.requiresAccount ? SVG.globe : SVG.download) + '<span>' + wvLabel + '</span></button>';
        } else if (isExt) {
          actionHtml = '<button class="btn glass sm" data-ext-idx="' + idx + '">' + extIcon + '<span>' + extLabel + '</span></button>';
        } else {
          actionHtml = '<button class="btn emerald sm" data-dl-idx="' + idx + '">' + SVG.download + '<span>تحميل مباشر</span></button>';
        }
        const progKey = l.engId ? ('eng:' + l.engId) : (l.url || '');
        const rowFmt = String(l.format || '').toLowerCase();
        const matchesJob = activeJob && doesRowMatchActiveJob(book.id, progKey, l.url || '', srcName, rowFmt, activeJob);
        const rowPct = matchesJob ? getDisplayDownloadPct(activeJob) : -1;
        const rowProgHtml = matchesJob
          ? ('<div class="dl-row-progress-wrap"><div class="dl-row-progress-meta"><span class="dl-prog-txt">' + esc(activeJob.phaseText || ('جاري التحميل من ' + srcName + '...')) + '</span><span class="dl-prog-pct">' + rowPct + '%</span></div><div class="dl-row-progress-track"><div class="dl-row-progress-fill" style="width:' + rowPct + '%"></div></div></div>')
          : '';
        return '<div class="dl-link-row" data-prog-key="' + esc(progKey) + '" data-row-url="' + esc(l.url || '') + '" data-row-src="' + esc(srcName) + '" data-row-fmt="' + esc(rowFmt) + '">'
          + '<div class="dl-link-main">'
          + '<div class="dl-link-meta">'
          + '<div class="dl-link-title-line">'
          + (isBest ? '<span class="dl-best-pill">الأفضل</span>' : '')
          + '<span class="dl-src-pill ' + pillCls + '">' + esc(srcName) + '</span>'
          + '<strong class="dl-link-lbl">' + esc(l.label) + '</strong></div>'
          + '<div class="dl-link-sub">' + esc((l.format || 'pdf').toUpperCase()) + (l.size ? ' • ' + esc(l.size) : '') + '</div>'
          + '</div>'
          + '<div class="dl-link-act">' + actionHtml + '</div>'
          + '</div>'
          + rowProgHtml
          + '</div>';
      }).join('')
      + (hasMore
        ? ('<button type="button" id="btnToggleMoreLinks" class="dl-more-btn' + (expanded ? ' open' : '') + '">'
          + '<span>' + (expanded ? 'عرض أفضل 5 روابط فقط' : ('عرض باقي الروابط (' + (sortedLinks.length - 5) + ' إضافية)')) + '</span>'
          + SVG.chevronDown + '</button>')
        : '');
    bindTgBotBtn();

    listHost.querySelectorAll('[data-dl-idx]').forEach(btn => {
      btn.onclick = () => triggerDownload(book, shownLinks[Number(btn.dataset.dlIdx)], directFallbacks);
    });
    listHost.querySelectorAll('[data-tgdl-idx]').forEach(btn => {
      btn.onclick = async () => {
        const l = shownLinks[Number(btn.dataset.tgdlIdx)];
        if (!l) return;
        btn.disabled = true;
        btn.textContent = 'جاري التحميل...';
        startPrepProgress(book, l.source || 'تيليجرام', 'جاري التحميل المباشر من تيليجرام...', { linkUrl: l.url });
        try {
          if (S && S.findDirectMirrorsForBook) {
            const mirrors = await S.findDirectMirrorsForBook(l.docName || book.title, book.author || '', book.lang || 'ar').catch(() => []);
            if (Array.isArray(mirrors) && mirrors.length) {
              triggerDownload(book, mirrors[0], mirrors.slice(1));
              return;
            }
          }
          if (S && typeof S.fetchViaTelegramBot === 'function') {
            const botRes = await S.fetchViaTelegramBot(book, { format: l.format || getPreferredFormat() }).catch(() => ({ ok: false }));
            if (botRes && botRes.ok && botRes.links && botRes.links.length) {
              const hit = botRes.links[0];
              applyWebSolveOutcome(book, Object.assign({}, hit, { source: hit.source || l.source }), Object.assign({ ok: true }, hit), directFallbacks);
              return;
            }
          }
          stopPrepProgress(book.id, false);
          KTB.toast('أضف خادم MTProto في الإعدادات أو استخدم @GedoLibrary_bot للتحميل المباشر');
        } finally {
          btn.disabled = false;
          if (btn.isConnected) btn.innerHTML = SVG.download + '<span>تحميل مباشر</span>';
        }
      };
    });
    listHost.querySelectorAll('[data-scribd-idx]').forEach(btn => {
      btn.onclick = () => {
        const l = shownLinks[Number(btn.dataset.scribdIdx)];
        if (l) openScribdInAppReader(book, l);
      };
    });
    listHost.querySelectorAll('[data-webrdr-idx]').forEach(btn => {
      btn.onclick = () => {
        const l = shownLinks[Number(btn.dataset.webrdrIdx)];
        if (l) openWebBookInAppReader(book, l);
      };
    });
    listHost.querySelectorAll('[data-wt-read-idx]').forEach(btn => {
      btn.onclick = () => {
        const l = shownLinks[Number(btn.dataset.wtReadIdx)];
        if (l) openWebBookInAppReader(book, l.episodeViewerUrl || l.readUrl || l.url);
      };
    });
    const wtBatchBtn = listHost.querySelector('#btnWtBatchDl');
    if (wtBatchBtn) {
      wtBatchBtn.onclick = () => {
        wtBatchBtn.disabled = true;
        downloadWebtoonBatch(book, wtEps, 5);
      };
    }
    listHost.querySelectorAll('[data-wsdl-idx]').forEach(btn => {
      btn.onclick = async () => {
        const l = shownLinks[Number(btn.dataset.wsdlIdx)];
        if (!l || !l.engId) return;
        if (l.engId === 'scribd') {
          openScribdInAppReader(book, l);
          return;
        }
        if (typeof S.webSearchAndDownload !== 'function') return;
        const resetLbl = l.requiresAccount ? ('فتح بحساب ' + (l.source || '')) : 'جلب وتحميل مباشر';
        btn.disabled = true;
        btn.textContent = 'جاري الجلب...';
        startPrepProgress(book, l.source || 'مكتبة نور', 'جاري الاتصال التلقائي بمكتبة ' + (l.source || 'المصدر') + ' وتجهيز الكتاب...', {
          engId: l.engId,
          linkUrl: 'eng:' + l.engId,
        });
        KTB.toast('جاري تجهيز الكتاب وتحميله مباشرة في Midad...');
        const bookUrl = (book.url && l.engId === 'noorbook' && /noor-book\.com/i.test(book.url) && !/search_for=/i.test(book.url)) ? book.url : undefined;
        const hasKnownDirect = Boolean(
          (state.currentModalBook && state.currentModalBook.id === book.id && Array.isArray(state.currentModalLinks) && state.currentModalLinks.some(isDirectDownloadLink))
          || (directFallbacks && directFallbacks.length)
        );
        const res = await S.webSearchAndDownload(l.engId, book.title, {
          author: book.author || '',
          altTitle: (book.extra && (book.extra.enTitle || book.extra.engTitle)) || book.titleEn || book.altTitle || '',
          lang: book.lang,
          format: l.format || book.format,
          bookUrl,
          skipMirrorFallback: l.engId === 'noorbook' ? true : hasKnownDirect,
        }).catch(() => ({ ok: false }));
        btn.disabled = false;
        if (btn.isConnected) btn.innerHTML = (l.requiresAccount ? SVG.globe : SVG.download) + '<span>' + resetLbl + '</span>';
        if (res && res.ok && res.links && res.links.length) {
          const hit = res.links[0];
          const refFallback = hit.referer || (res.picked && res.picked.url) || bookUrl || (l.engId === 'noorbook' ? 'https://www.noor-book.com/' : '');
          applyWebSolveOutcome(book, Object.assign({}, hit, {
            referer: refFallback,
            source: (res.fromMirrorFallback ? (hit.source || l.source) : (l.source || hit.source)),
          }), Object.assign({ ok: true, referer: refFallback }, hit), l.engId === 'noorbook' ? [] : directFallbacks);
          return;
        }
        stopPrepProgress(book.id, false);
        if (res && res.error === 'cancelled') {
          KTB.toast('تم إلغاء الجلب');
          return;
        }
        if (l.engId === 'noorbook') {
          const errMsg = String((res && res.error) || '');
          if (/حقوق النشر|NOOR_LOCKED|NOOR_SUB|مدفوع/i.test(errMsg)) {
            KTB.toast('هذا الكتاب محمي بحقوق النشر في مكتبة نور — يمكنك اختيار نسخة أخرى من القائمة');
          } else if (/NOOR_AUTH/i.test(errMsg)) {
            KTB.toast('يلزم تسجيل الدخول في مكتبة نور لإتمام التحميل');
          } else if (/CF_BLOCKED/i.test(errMsg)) {
            KTB.toast('مكتبة نور تطلب التحقق الأمني — أعد المحاولة وأكمل التحقق في الصفحة عند ظهوره');
          } else {
            KTB.toast('تعذر إتمام التحميل من مكتبة نور حالياً — يمكنك اختيار نسخة أخرى من القائمة');
          }
          return;
        }
        const fbList = await resolveFallbackDirectForModal(book, directFallbacks);
        if (fbList.length > 0) {
          triggerDownload(book, fbList[0], fbList.slice(1));
          KTB.toast('بدأ التحميل المباشر تلقائياً من ' + (fbList[0].source || 'البديل المفتوح'));
        } else {
          KTB.toast('لم يُعثر على نسخة قابلة للتحميل المباشر لهذا الكتاب حالياً');
        }
      };
    });
    listHost.querySelectorAll('[data-wv-idx]').forEach(btn => {
      btn.onclick = async () => {
        const l = shownLinks[Number(btn.dataset.wvIdx)];
        if (!l || !l.url) return;
        const resetLbl = l.requiresAccount ? ('فتح بحساب ' + (String(l.source || '').includes('Scribd') ? 'Scribd' : (l.source || ''))) : 'جلب وتحميل مباشر';
        btn.disabled = true;
        btn.textContent = 'جاري الجلب...';
        startPrepProgress(book, l.source || book.source || 'المصدر', 'جاري تجهيز الرابط المباشر من ' + (l.source || 'المصدر') + '...', {
          linkUrl: l.url,
        });
        KTB.toast('جاري جلب وتحميل النسخة المباشرة في الخلفية...');
        const r = await KTB.solveWeb(l.url, 'sniff_dl_ui', l.dlScript || '').catch(() => ({ ok: false }));
        btn.disabled = false;
        if (btn.isConnected) btn.innerHTML = (l.requiresAccount ? SVG.globe : SVG.download) + '<span>' + resetLbl + '</span>';
        if (applyWebSolveOutcome(book, l, r, directFallbacks)) return;
        stopPrepProgress(book.id, false);
        if (r && r.error === 'cancelled') {
          KTB.toast('تم إلغاء الجلب');
          return;
        }
        if (String(l.source || '').includes('نور') || /noor-book\.com/i.test(l.url || '')) {
          const errMsg = String((r && r.error) || '');
          if (/حقوق النشر|NOOR_LOCKED|NOOR_SUB|مدفوع/i.test(errMsg)) {
            KTB.toast('هذا الكتاب محمي بحقوق النشر في مكتبة نور — يمكنك اختيار نسخة أخرى من القائمة');
          } else {
            KTB.toast('تعذر إتمام التحميل من مكتبة نور حالياً — يمكنك اختيار نسخة أخرى من القائمة');
          }
          return;
        }
        const fbList = await resolveFallbackDirectForModal(book, directFallbacks);
        if (fbList.length > 0) {
          triggerDownload(book, fbList[0], fbList.slice(1));
          KTB.toast('بدأ التحميل المباشر تلقائياً من ' + (fbList[0].source || 'البديل المفتوح'));
        } else {
          KTB.toast('لم يُعثر على نسخة قابلة للتحميل المباشر لهذا الكتاب حالياً');
        }
      };
    });
    listHost.querySelectorAll('[data-ext-idx]').forEach(btn => {
      btn.onclick = () => {
        const l = shownLinks[Number(btn.dataset.extIdx)];
        if (l && l.url) {
          if (l.copyText) {
            KTB.copy(l.copyText);
            KTB.toast('تم نسخ اسم الكتاب "' + l.copyText.slice(0, 32) + '" — جاري فتح تيليجرام...');
          } else if (l.url.includes('t.me/')) {
            KTB.toast('جاري فتح المنشور في تيليجرام...');
          }
          KTB.openUrl(l.url);
        }
      };
    });
    const moreBtn = $('btnToggleMoreLinks');
    if (moreBtn) {
      moreBtn.onclick = () => {
        state._linksExpanded = !state._linksExpanded;
        renderResolvedLinksBox(book, sortedLinks, stillLoading, activePhase);
      };
    }
  }

  function onlineReviewCacheKey(book) {
    if (!book) return '';
    const title = S && S.cleanDisplayBookTitle ? S.cleanDisplayBookTitle(book.title || '', book.author || '') : String(book.title || '');
    return title.toLowerCase().replace(/\s+/g, ' ').trim() + '|' + String(book.author || '').toLowerCase().trim();
  }

  function renderDetailReviews(book, _fromAsyncFetch) {
    const box = $('detailReviewsBox');
    if (!box || !book || !HABIT) return;
    const prevDraft = (_fromAsyncFetch && $('reviewCommentInput') && $('reviewCommentInput').value) || '';
    const rKey = onlineReviewCacheKey(book);
    const cachedExt = (rKey && state.onlineReviewsCache[rKey]) || { reviews: [], externalStats: null };
    const extReviews = Array.isArray(cachedExt.reviews) ? cachedExt.reviews : [];
    const extStats = cachedExt.externalStats || null;

    if (!_fromAsyncFetch && rKey && !state.onlineReviewsCache[rKey] && !state.onlineReviewsLoading[rKey] && S && S.fetchRealOnlineReviews) {
      state.onlineReviewsLoading[rKey] = true;
      const openGen = state.modalGen;
      setTimeout(() => {
        if (state.modalGen !== openGen || !state.currentModalBook) {
          state.onlineReviewsLoading[rKey] = false;
          return;
        }
        S.fetchRealOnlineReviews(book).then((res) => {
          state.onlineReviewsLoading[rKey] = false;
          state.onlineReviewsCache[rKey] = res || { reviews: [], externalStats: null };
          if (state.modalGen === openGen && state.currentModalBook && $('bookModal') && !$('bookModal').classList.contains('hidden')) {
            renderDetailReviews(state.currentModalBook, true);
          }
        }).catch(() => {
          state.onlineReviewsLoading[rKey] = false;
          state.onlineReviewsCache[rKey] = { reviews: [], externalStats: null };
          if (state.modalGen === openGen && state.currentModalBook && $('bookModal') && !$('bookModal').classList.contains('hidden')) {
            renderDetailReviews(state.currentModalBook, true);
          }
        });
      }, 650);
    }

    const isLoadingExt = !!(rKey && state.onlineReviewsLoading[rKey]);
    const summary = HABIT.getRatingSummary(book, extReviews, extStats);
    const list = HABIT.getReviewsForBook(book, state.reviewSort || 'positive', extReviews);
    const hasWrittenReviews = list.length > 0;
    const hasAnyRating = summary.count > 0 && summary.average > 0;

    const badgeEl = $('detailCommunityBadge');
    if (badgeEl) {
      if (hasAnyRating) {
        badgeEl.classList.remove('hidden');
        badgeEl.innerHTML = SVG.starFill + '<span>' + esc(summary.average.toFixed(1)) + ' (' + summary.count + ' تقييم)</span>';
      } else {
        badgeEl.classList.add('hidden');
        badgeEl.innerHTML = '';
      }
    }

    const activeStars = (summary.userReview && summary.userReview.rating)
      || (REC && REC.getBookRating && REC.getBookRating(book))
      || 5;
    const tagChoices = ['أنصح بإكماله', 'ملهم وعميق', 'أسلوب سلس', 'مشوّق للغاية', 'مفيد عملياً'];
    let selectedTag = (summary.userReview && summary.userReview.tag) || tagChoices[0];
    let selectedRating = activeStars;

    const barsHtml = [5, 4, 3, 2, 1].map(star => {
      const cnt = (summary.distribution && summary.distribution[star]) || 0;
      const pct = hasWrittenReviews ? Math.round((cnt / list.length) * 100) : 0;
      return '<div class="rbar-row">'
        + '<span class="rbar-lbl">' + star + '</span>'
        + '<div class="rbar-track"><div class="rbar-fill" style="width:' + pct + '%"></div></div>'
        + '<span class="rbar-cnt">' + cnt + '</span>'
        + '</div>';
    }).join('');

    const composerStarsHtml = [1, 2, 3, 4, 5].map(n =>
      '<button type="button" class="star-btn' + (n <= selectedRating ? ' on' : '') + '" data-cstar="' + n + '" aria-label="' + n + ' نجوم">' + SVG.starFill + '</button>'
    ).join('');

    const tagPillsHtml = tagChoices.map(t =>
      '<button type="button" class="chip' + (selectedTag === t ? ' on' : '') + '" data-rtag="' + esc(t) + '">' + esc(t) + '</button>'
    ).join('');

    const sortPills = [
      { id: 'positive', label: 'الأكثر تحفيزاً' },
      { id: 'helpful', label: 'الأكثر فائدة' },
      { id: 'recent', label: 'الأحدث' },
    ].map(s =>
      '<button type="button" class="chip' + ((state.reviewSort || 'positive') === s.id ? ' on' : '') + '" data-rev-sort="' + s.id + '">' + s.label + '</button>'
    ).join('');

    const overviewHtml = hasAnyRating
      ? ('<div class="reviews-overview">'
        + '<div class="reviews-score-col">'
        + '<div class="reviews-avg-num" id="detailReviewsAvg">' + summary.average.toFixed(1) + '</div>'
        + '<div class="reviews-avg-stars">' + [1, 2, 3, 4, 5].map(n => '<span class="rev-star' + (n <= Math.round(summary.average) ? ' on' : '') + '">' + SVG.starFill + '</span>').join('') + '</div>'
        + '<div class="reviews-avg-cnt" id="detailReviewsCount">'
        + (summary.externalOnly
          ? ('تقييم عالمي حقيقي (' + summary.count + ' مصوّت • ' + esc(summary.externalSource || 'مصادر عالمية') + ')')
          : ('بناءً على ' + summary.count + ' تقييم حقيقي'))
        + '</div>'
        + '</div>'
        + (hasWrittenReviews ? '<div class="reviews-bars-col">' + barsHtml + '</div>' : '<div style="font-size:12px;color:var(--muted)">متوسط تقييم القرّاء الفعلي للكتاب عالمياً</div>')
        + '</div>')
      : '';

    const cardsHtml = hasWrittenReviews ? list.map(r => {
      const stars = Array.from({ length: 5 }, (_, idx) =>
        '<span class="rev-star' + ((idx + 1) <= r.rating ? ' on' : '') + '">' + SVG.starFill + '</span>'
      ).join('');
      const initial = esc(String(r.authorName || 'ق').trim().charAt(0) || 'ق');
      const pill = r.isUser
        ? '<span class="review-mine-pill">تقييمك</span>'
        : (r.isExternal
          ? '<span class="reviews-ext-pill">' + esc(r.translated ? 'قارئ عالمي • مترجم' : (r.sourceName || 'مراجعة حقيقية')) + '</span>'
          : '');
      return '<article class="review-card' + (r.isUser ? ' mine' : '') + '">'
        + '<div class="review-head">'
        + '<div class="review-author-row">'
        + '<span class="review-avatar">' + initial + '</span>'
        + '<div><div class="review-author-name">' + esc(r.authorName || 'قارئ') + pill + '</div>'
        + '<div class="review-stars-mini" aria-label="تقييم ' + r.rating + ' من 5">' + stars + '</div></div>'
        + '</div>'
        + (r.tag && !r.isExternal ? '<span class="review-tag-badge">' + esc(r.tag) + '</span>' : '')
        + '</div>'
        + (r.text ? '<p class="review-body-txt">' + esc(r.text) + '</p>' : '')
        + '<div class="review-foot">'
        + '<button type="button" class="review-helpful-btn' + (r.helpfulByMe ? ' on' : '') + '" data-helpful-id="' + esc(r.id) + '">' + SVG.thumbsUp + '<span>مفيد (' + Number(r.helpfulCount || 0) + ')</span></button>'
        + (r.isUser ? '<button type="button" class="review-del-btn" data-del-rev-id="' + esc(r.id) + '">' + SVG.trash + '<span>حذف</span></button>' : '')
        + '</div></article>';
    }).join('') : '';

    if (!hasAnyRating && !hasWrittenReviews) {
      box.innerHTML = isLoadingExt
        ? '<div class="reviews-loading-note">جاري التحقق من آراء القرّاء الحقيقية...</div>'
        : '';
      return;
    }

    box.innerHTML = ''
      + '<div class="sec-head" style="margin-bottom:10px">'
      + '<div class="sec-title">' + SVG.messageSquare + '<span>آراء القرّاء الحقيقية</span></div>'
      + '<span class="sec-sub">' + summary.count + ' تقييم • متوسط ' + summary.average.toFixed(1) + ' / 5</span>'
      + '</div>'
      + overviewHtml
      + (hasWrittenReviews ? '<div class="reviews-sort-bar"><span class="reviews-sort-lbl">آراء القرّاء (' + list.length + ')</span><div class="chips-row sm">' + sortPills + '</div></div>' : '')
      + '<div class="reviews-list" id="detailReviewsList">' + cardsHtml + '</div>';
    box.querySelectorAll('[data-rev-sort]').forEach(btn => {
      btn.onclick = () => {
        state.reviewSort = btn.dataset.revSort || 'positive';
        renderDetailReviews(book, true);
      };
    });
    box.querySelectorAll('[data-helpful-id]').forEach(btn => {
      btn.onclick = () => {
        const rid = btn.dataset.helpfulId;
        const on = HABIT.toggleHelpfulReview(book, rid);
        renderDetailReviews(book, true);
        KTB.toast(on ? 'شكراً لتصويتك: مراجعة مفيدة' : 'تم إلغاء التصويت');
      };
    });
    box.querySelectorAll('[data-del-rev-id]').forEach(btn => {
      btn.onclick = () => {
        const rid = btn.dataset.delRevId;
        HABIT.deleteUserReview(book, rid);
        if ($('reviewCommentInput')) $('reviewCommentInput').value = '';
        renderDetailReviews(book, false);
        renderHero();
        KTB.toast('تم حذف تعليقك');
      };
    });
  }

  async function renderDetailSimilar(book) {
    const box = $('detailSimilarBox');
    if (!box) return;
    const localSim = getSimilarFromPool(book);
    if (localSim.length) {
      box.innerHTML = '<div class="sec-head" style="margin-bottom:8px"><div class="sec-title">' + SVG.heart + '<span>كتب مشابهة قد تعجبك</span></div></div>'
        + '<div class="shelf" id="detailSimShelf"></div>';
      renderCards($('detailSimShelf'), localSim);
    } else {
      box.innerHTML = '';
      const online = await S.fetchSimilarOnline(book);
      if (state.currentModalBook && state.currentModalBook.id === book.id && online.length) {
        box.innerHTML = '<div class="sec-head" style="margin-bottom:8px"><div class="sec-title">' + SVG.heart + '<span>كتب مشابهة قد تعجبك</span></div></div>'
          + '<div class="shelf" id="detailSimShelf"></div>';
        renderCards($('detailSimShelf'), online);
      }
    }
  }

  // ------------------------------------------------------------------ Settings & Reading Preferences
  function applyLangPreference(lang) {
    state.prefLang = lang;
    localStorage.setItem('wq_pref_lang', lang);
    state.searchLang = lang === 'ar' ? 'ar' : (lang === 'en' ? 'en' : '');
    if ($('langFilter')) {
      $('langFilter').querySelectorAll('button').forEach(b => {
        b.classList.toggle('on', b.dataset.lang === state.searchLang);
      });
    }
    state.liveCache.homeGrid = [];
    renderHero();
    renderPersonalShelf();
    renderTrendingShelf();
    renderHomeGrid();
    hydrateHomeLive();
  }

  function applyFormatPreference(fmt) {
    const normalized = fmt === 'epub' ? 'epub' : 'pdf';
    state.prefFormat = normalized;
    window.__midadPrefFormat = normalized;
    localStorage.setItem('wq_pref_format', normalized);
    invalidateOwnedCache();
    renderHero();
    renderPersonalShelf();
    renderTrendingShelf();
    renderHomeGrid();
    if ($('tab-downloads') && $('tab-downloads').classList.contains('active')) renderDownloads();
    if (state.currentModalBook && $('bookModal') && !$('bookModal').classList.contains('hidden')) {
      if (Array.isArray(state.currentModalLinks) && state.currentModalLinks.length) {
        renderResolvedLinksBox(state.currentModalBook, state.currentModalLinks, false, '');
        const bestDirect = state.currentModalLinks.filter(isDirectDownloadLink).sort((a, b) => scoreDownloadLink(b, state.currentModalBook) - scoreDownloadLink(a, state.currentModalBook))[0];
        const qBtn = $('detailQuickDlBtn');
        if (qBtn && bestDirect && !qBtn.disabled) {
          const sp = qBtn.querySelector('span');
          if (sp) sp.textContent = 'تحميل الآن (' + (bestDirect.source || 'مباشر') + ' • ' + String(bestDirect.format || normalized).toUpperCase() + ')';
        }
      }
      refreshModalActBar(state.currentModalBook);
    }
  }

  function applyLengthPreference(len) {
    const normalized = (len === 'short' || len === 'long') ? len : 'all';
    state.prefLength = normalized;
    try { localStorage.setItem('wq_pref_length', normalized); } catch (_) { }
    state._lastHomeAlloc = null;
    refreshRecommendationShelves();
  }

  function applyComicsVisibility(show) {
    state.showComics = show !== false;
    try { localStorage.setItem('wq_show_comics', state.showComics ? '1' : '0'); } catch (_) { }
    if (!state.showComics) {
      if (state.homeCat === 'comics_manga') state.homeCat = 'all';
      if (state.discCat === 'comics_manga') state.discCat = 'mystery_classics';
      if (Array.isArray(state.trendingCats) && state.trendingCats[0] === 'comics_manga') {
        state.trendingCats = ['all'];
        saveJson('wq_trending_cats', state.trendingCats);
      }
    }
    syncComicsSearchScopeVisibility();
    state._lastHomeAlloc = null;
    renderHomePills();
    renderTrendingPills();
    refreshRecommendationShelves();
    if ($('tab-discover') && $('tab-discover').classList.contains('active')) renderDiscover();
  }

  function openSettings() {
    $('settingsModal').classList.remove('hidden');
    const isAndroid = KTB.isAndroid();
    const prefFmt = getPreferredFormat();
    const prefCats = Array.isArray(state.prefCats) ? state.prefCats : [];
    const focusMode = state.heroFocusMode || (state.showContinueHero !== false ? 'continue_only' : 'discovery');
    const catChips = getVisibleCategories(false).map(c => {
      const on = prefCats.includes(c.id);
      return '<button type="button" class="chip ' + (on ? 'on' : '') + '" data-pref-cat="' + c.id + '">'
        + catIcon(c.iconKey) + '<span>' + esc(c.name) + '</span></button>';
    }).join('');

    const hEv = HABIT ? HABIT.evaluateState() : { dailyGoalPages: 15, reminderTimeStr: '20:00', notificationsEnabled: true };
    const setGoalPills = [5, 10, 15, 20, 30].map(g =>
      '<button type="button" class="chip' + (hEv.dailyGoalPages === g ? ' on' : '') + '" data-set-goal="' + g + '">' + g + ' ص</button>'
    ).join('');

    $('setBody').innerHTML =
      '<div class="settings-compact-grid">'

      + '<div class="set-card set-card-full" id="setHeroHabitSection">'
      + '<div class="set-card-head"><strong>أولوية المقدمة ومهمة القراءة اليومية</strong><small>تحكّم في ما يظهر أولاً بالرئيسية وهدف الصفحات والتذكير</small></div>'
      + '<div class="seg-row" id="setContinueHeroSeg">'
      + '<button type="button" data-conthero="2" class="' + (focusMode === 'continue_only' ? 'on' : '') + '">متابعة آخر كتاب فقط</button>'
      + '<button type="button" data-conthero="1" class="' + (focusMode === 'continue_next' ? 'on' : '') + '">متابعة آخر كتاب + التالي</button>'
      + '<button type="button" data-conthero="0" class="' + (focusMode === 'discovery' ? 'on' : '') + '">اكتشاف عام فقط</button>'
      + '</div>'
      + '<div class="set-inline-row">'
      + '<span class="set-hint">عند فتح التطبيق:</span>'
      + '<div class="seg-row" id="setAutoOpenLastSeg">'
      + '<button type="button" data-autoopen="1" class="' + (state.autoOpenLastBook ? 'on' : '') + '">فتح آخر كتاب لاستكمال القراءة</button>'
      + '<button type="button" data-autoopen="0" class="' + (!state.autoOpenLastBook ? 'on' : '') + '">عرض الواجهة الرئيسية</button>'
      + '</div></div>'
      + '<div class="set-inline-row">'
      + '<span class="set-hint">الهدف اليومي:</span>'
      + '<div class="chips-row sm" id="setHabitGoalPills">' + setGoalPills + '</div>'
      + '</div>'
      + '<div class="set-inline-row">'
      + '<label class="set-hint" for="setHabitTimeInput">التذكير:</label>'
      + '<input type="time" id="setHabitTimeInput" class="comp-time-inp" value="' + esc(hEv.reminderTimeStr) + '"/>'
      + '<div class="seg-row" id="setHabitNotifSeg">'
      + '<button type="button" data-hnotif="1" class="' + (hEv.notificationsEnabled ? 'on' : '') + '">إشعار مفعّل</button>'
      + '<button type="button" data-hnotif="0" class="' + (!hEv.notificationsEnabled ? 'on' : '') + '">صامت</button>'
      + '</div>'
      + '<button type="button" id="setTestHabitNotifBtn" class="btn glass sm">اختبار</button>'
      + '</div></div>'

      + '<div class="set-card">'
      + '<div class="set-card-head"><strong>اللغة وصيغة التحميل</strong></div>'
      + '<div class="seg-row" id="setLangSeg">'
      + '<button type="button" data-plang="both" class="' + (state.prefLang === 'both' ? 'on' : '') + '">الاثنان</button>'
      + '<button type="button" data-plang="ar" class="' + (state.prefLang === 'ar' ? 'on' : '') + '">العربية</button>'
      + '<button type="button" data-plang="en" class="' + (state.prefLang === 'en' ? 'on' : '') + '">الأجنبية</button>'
      + '</div>'
      + '<div class="seg-row" id="setFmtSeg">'
      + '<button type="button" data-pfmt="pdf" class="' + (prefFmt === 'pdf' ? 'on' : '') + '">PDF أولاً</button>'
      + '<button type="button" data-pfmt="epub" class="' + (prefFmt === 'epub' ? 'on' : '') + '">EPUB أولاً</button>'
      + '</div></div>'

      + '<div class="set-card">'
      + '<div class="set-card-head"><strong>طول الكتب وتصنيف الكوميكس</strong><small>نسبة 80% للطول المفضّل وإظهار أو إخفاء الكوميكس</small></div>'
      + '<div class="seg-row" id="setLengthSeg">'
      + '<button type="button" data-plen="short" class="' + (state.prefLength === 'short' ? 'on' : '') + '">صغيرة (&lt; 250 صفحة)</button>'
      + '<button type="button" data-plen="long" class="' + (state.prefLength === 'long' ? 'on' : '') + '">طويلة (250+ صفحة)</button>'
      + '<button type="button" data-plen="all" class="' + (state.prefLength === 'all' ? 'on' : '') + '">الاثنان</button>'
      + '</div>'
      + '<div class="seg-row" id="setComicsSeg">'
      + '<button type="button" data-pcomics="1" class="' + (isComicsVisible() ? 'on' : '') + '">إظهار تصنيف الكوميكس</button>'
      + '<button type="button" data-pcomics="0" class="' + (!isComicsVisible() ? 'on' : '') + '">إخفاء الكوميكس</button>'
      + '</div></div>'

      + '<div class="set-card">'
      + '<div class="set-card-head"><strong>المظهر والألوان والحركة</strong></div>'
      + '<div class="seg-row" id="setThemeSeg">'
      + '<button type="button" data-ptheme="dark" class="' + (state.theme === 'dark' ? 'on' : '') + '">داكن</button>'
      + '<button type="button" data-ptheme="sepia" class="' + (state.theme === 'sepia' ? 'on' : '') + '">ورق دافئ</button>'
      + '<button type="button" data-ptheme="light" class="' + (state.theme === 'light' ? 'on' : '') + '">نهاري</button>'
      + '</div>'
      + '<div class="seg-row" id="setAccentSeg">'
      + '<button type="button" data-paccent="emerald" class="' + (state.prefAccent === 'emerald' ? 'on' : '') + '"><span class="accent-dot" style="background:#10b981"></span>زمردي</button>'
      + '<button type="button" data-paccent="amber" class="' + (state.prefAccent === 'amber' ? 'on' : '') + '"><span class="accent-dot" style="background:#d97706"></span>كهرماني</button>'
      + '<button type="button" data-paccent="sapphire" class="' + (state.prefAccent === 'sapphire' ? 'on' : '') + '"><span class="accent-dot" style="background:#2563eb"></span>ياقوتي</button>'
      + '<button type="button" data-paccent="violet" class="' + (state.prefAccent === 'violet' ? 'on' : '') + '"><span class="accent-dot" style="background:#7c3aed"></span>بنفسجي</button>'
      + '</div></div>'

      + '<div class="set-card">'
      + '<div class="set-card-head"><strong>السلاسة والكثافة واللمس</strong></div>'
      + '<div class="seg-row" id="setMotionSeg">'
      + '<button type="button" data-pmotion="premium" class="' + (state.motionMode === 'premium' ? 'on' : '') + '">حركة سلسة</button>'
      + '<button type="button" data-pmotion="reduced" class="' + (state.motionMode === 'reduced' ? 'on' : '') + '">حركة مخففة</button>'
      + '</div>'
      + '<div class="seg-row" id="setDensitySeg">'
      + '<button type="button" data-pdensity="normal" class="' + (state.gridDensity === 'normal' ? 'on' : '') + '">عرض مريح</button>'
      + '<button type="button" data-pdensity="dense" class="' + (state.gridDensity === 'dense' ? 'on' : '') + '">عرض مكثف</button>'
      + '</div>'
      + (isAndroid
        ? ('<div class="seg-row" id="setHapticSeg">'
          + '<button type="button" data-phaptic="1" class="' + (state.hapticsEnabled !== false ? 'on' : '') + '">اهتزاز لمسي: مفعّل</button>'
          + '<button type="button" data-phaptic="0" class="' + (state.hapticsEnabled === false ? 'on' : '') + '">معطّل</button>'
          + '</div>')
        : '')
      + '</div>'

      + '<div class="set-card">'
      + '<div class="set-card-head"><strong>الملفات والمكتبات المتصلة</strong><small>الحفظ في Download/Midad مع أكثر من 24 مصدراً</small></div>'
      + '<div class="set-inline-row">'
      + '<button id="setPickBook" class="btn emerald sm">افتح كتابك</button>'
      + '<button id="setRefreshMirrors" class="btn glass sm">تحديث المرايا</button>'
      + '<button id="setClearCache" class="btn glass sm">مسح الكاش</button>'
      + '</div></div>'

      + '<div class="set-card set-card-full">'
      + '<div class="set-card-head"><strong>التصنيفات المفضلة للترشيحات</strong></div>'
      + '<div id="setCatChips" class="chips-row sm set-cats-wrap">' + catChips + '</div>'
      + '</div>'

      + '</div>';

    $('setLangSeg').querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        applyLangPreference(btn.dataset.plang);
        openSettings();
        KTB.toast('تم تحديث لغة الكتب المفضلة');
      };
    });

    $('setFmtSeg').querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        if (KTB.haptic) KTB.haptic('light');
        applyFormatPreference(btn.dataset.pfmt);
        openSettings();
        KTB.toast('تم تعيين صيغة ' + String(btn.dataset.pfmt || 'pdf').toUpperCase() + ' كأولوية أولى للتحميل');
      };
    });

    if ($('setLengthSeg')) {
      $('setLengthSeg').querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          if (KTB.haptic) KTB.haptic('light');
          const pl = btn.dataset.plen || 'all';
          applyLengthPreference(pl);
          openSettings();
          KTB.toast(pl === 'short'
            ? 'تم تفضيل الكتب القصيرة (80% أقل من 250 صفحة)'
            : (pl === 'long' ? 'تم تفضيل الكتب الطويلة (80% 250 صفحة فأكثر)' : 'تم اختيار العرض المتنوع للطولين'));
        };
      });
    }

    if ($('setComicsSeg')) {
      $('setComicsSeg').querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          if (KTB.haptic) KTB.haptic('light');
          const show = btn.dataset.pcomics !== '0';
          applyComicsVisibility(show);
          openSettings();
          KTB.toast(show ? 'تم إظهار تصنيف الكوميكس والمانجا' : 'تم إخفاء تصنيف الكوميكس والمانجا');
        };
      });
    }

    if ($('setThemeSeg')) {
      $('setThemeSeg').querySelectorAll('[data-ptheme]').forEach(btn => {
        btn.onclick = () => {
          if (KTB.haptic) KTB.haptic('light');
          applyTheme(btn.dataset.ptheme || 'dark', btn);
          openSettings();
          KTB.toast('تم تغيير مظهر القراءة والتصفح');
        };
      });
    }
    if ($('setAccentSeg')) {
      $('setAccentSeg').querySelectorAll('[data-paccent]').forEach(btn => {
        btn.onclick = () => {
          state.prefAccent = btn.dataset.paccent || 'emerald';
          localStorage.setItem('wq_accent', state.prefAccent);
          applyVisualPrefs();
          if (KTB.haptic) KTB.haptic('light');
          openSettings();
          KTB.toast('تم تطبيق اللون المميز الجديد');
        };
      });
    }
    if ($('setMotionSeg')) {
      $('setMotionSeg').querySelectorAll('[data-pmotion]').forEach(btn => {
        btn.onclick = () => {
          state.motionMode = btn.dataset.pmotion === 'reduced' ? 'reduced' : 'premium';
          localStorage.setItem('wq_motion', state.motionMode);
          applyVisualPrefs();
          if (KTB.haptic) KTB.haptic('light');
          openSettings();
          KTB.toast(state.motionMode === 'reduced' ? 'تم تفعيل الحركة السريعة المخففة' : 'تم تفعيل الحركة البريميم السلسة');
        };
      });
    }
    if ($('setDensitySeg')) {
      $('setDensitySeg').querySelectorAll('[data-pdensity]').forEach(btn => {
        btn.onclick = () => {
          state.gridDensity = btn.dataset.pdensity === 'dense' ? 'dense' : 'normal';
          localStorage.setItem('wq_density', state.gridDensity);
          applyVisualPrefs();
          if (KTB.haptic) KTB.haptic('light');
          openSettings();
          KTB.toast(state.gridDensity === 'dense' ? 'تم تفعيل العرض المكثف للكتب' : 'تم استعادة العرض المريح للكتب');
        };
      });
    }
    if ($('setHapticSeg')) {
      $('setHapticSeg').querySelectorAll('[data-phaptic]').forEach(btn => {
        btn.onclick = () => {
          state.hapticsEnabled = btn.dataset.phaptic !== '0';
          localStorage.setItem('wq_haptics', state.hapticsEnabled ? '1' : '0');
          applyVisualPrefs();
          if (state.hapticsEnabled && KTB.haptic) KTB.haptic('medium');
          openSettings();
          KTB.toast(state.hapticsEnabled ? 'تم تفعيل الاهتزاز اللمسي الخفيف' : 'تم إيقاف الاهتزاز اللمسي');
        };
      });
    }

    $('setCatChips').querySelectorAll('[data-pref-cat]').forEach(btn => {
      btn.onclick = () => {
        const cid = btn.dataset.prefCat;
        const curr = Array.isArray(state.prefCats) ? state.prefCats.slice() : [];
        const idx = curr.indexOf(cid);
        if (idx >= 0) curr.splice(idx, 1);
        else curr.push(cid);
        state.prefCats = curr;
        saveJson('wq_pref_cats', curr);
        btn.classList.toggle('on', idx < 0);
        renderHero();
        renderHomeGrid();
      };
    });

    if ($('setAutoOpenLastSeg')) {
      $('setAutoOpenLastSeg').querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
          state.autoOpenLastBook = btn.dataset.autoopen === '1';
          localStorage.setItem('wq_auto_open_last', state.autoOpenLastBook ? '1' : '0');
          $('setAutoOpenLastSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === btn));
          if (KTB.haptic) KTB.haptic('light');
          KTB.toast(state.autoOpenLastBook
            ? 'سيُفتح آخر كتاب كنت تقرؤه تلقائياً عند تشغيل التطبيق'
            : 'سيفتح التطبيق على الواجهة الرئيسية المعتادة');
        };
      });
    }

    if (HABIT && $('setBody')) {
      $('setBody').querySelectorAll('#setContinueHeroSeg button').forEach(btn => {
        btn.onclick = () => {
          const val = btn.dataset.conthero;
          const nextMode = val === '2' ? 'continue_only' : (val === '0' ? 'discovery' : 'continue_next');
          setHeroFocusMode(nextMode);
          $('setBody').querySelectorAll('#setContinueHeroSeg button').forEach(x => x.classList.toggle('on', x === btn));
          renderHero();
          const msg = nextMode === 'continue_only'
            ? 'المقدمة تعرض متابعة آخر كتاب فقط'
            : (nextMode === 'discovery' ? 'المقدمة في وضع الاكتشاف العام' : 'المقدمة تعرض متابعة آخر كتاب مع الترشيح التالي');
          KTB.toast(msg);
        };
      });
      $('setBody').querySelectorAll('#setHabitGoalPills [data-set-goal]').forEach(btn => {
        btn.onclick = () => {
          const pages = Number(btn.dataset.setGoal) || 15;
          HABIT.updateConfig({ dailyGoalPages: pages });
          $('setBody').querySelectorAll('#setHabitGoalPills [data-set-goal]').forEach(x => x.classList.toggle('on', x === btn));
          renderCompanionWidget();
          KTB.toast('تم تحديد المهمة اليومية: ' + pages + ' صفحة');
        };
      });
      if ($('setHabitTimeInput')) {
        $('setHabitTimeInput').onchange = (e) => {
          HABIT.updateConfig({ reminderTime: e.target.value || '20:00' });
          renderCompanionWidget();
          KTB.toast('تم تحديث وقت تذكير القراءة: ' + (e.target.value || '20:00'));
        };
      }
      $('setBody').querySelectorAll('#setHabitNotifSeg button').forEach(btn => {
        btn.onclick = () => {
          const on = btn.dataset.hnotif === '1';
          HABIT.updateConfig({ notificationsEnabled: on });
          if (on && KTB.requestNotificationPermission) KTB.requestNotificationPermission();
          $('setBody').querySelectorAll('#setHabitNotifSeg button').forEach(x => x.classList.toggle('on', x === btn));
          renderCompanionWidget();
          KTB.toast(on ? 'تم تفعيل تذكير مهمة القراءة' : 'تم كتم التذكير اليومي');
        };
      });
      if ($('setTestHabitNotifBtn')) {
        $('setTestHabitNotifBtn').onclick = () => {
          if (KTB.requestNotificationPermission) KTB.requestNotificationPermission();
          if (KTB.testReadingNotification && KTB.isNative) KTB.testReadingNotification();
          KTB.toast('تذكير مداد: باقي ' + HABIT.evaluateState().remainingPages + ' صفحة لإتمام مهمة اليوم');
        };
      }
    }

    $('setPickBook').onclick = () => { $('settingsModal').classList.add('hidden'); KTB.pickLocalBook(); };
    $('setRefreshMirrors').onclick = async () => {
      KTB.toast('جاري فحص أفضل المرايا...');
      await S.refreshMirrors();
      KTB.toast('المكتبات جاهزة ومتصلة');
    };
    $('setClearCache').onclick = () => { KTB.clearCache(); KTB.toast('تم مسح ذاكرة التخزين المؤقت'); };
  }

  // ------------------------------------------------------------------ Audiobooks Module (Streaming, Offline Download, Player & Home Widget Sync)
  const AB_REG = new Map();
  let _abSeeking = false;
  let _abBarDismissed = false;
  let _abLastSavedPosAt = 0;
  let _abLastAudioErr = '';
  const AB_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  const AB_SLEEP_STEPS = [0, 15, 30, 45, 60, -1];

  function registerAudiobook(ab) {
    if (!ab || !ab.id) return ab;
    AB_REG.set(ab.id, ab);
    return ab;
  }

  function getCuratedAudiobooks() {
    const list = (CATS && Array.isArray(CATS.AUDIOBOOKS_CURATED)) ? CATS.AUDIOBOOKS_CURATED : [];
    list.forEach(registerAudiobook);
    return list;
  }

  function cleanAbId(raw) {
    return String(raw || 'book').replace(/[^a-zA-Z0-9-]/g, '_');
  }

  function abTrackJobPrefix(ab, idx) {
    return 'ab_' + cleanAbId(ab.id) + '__ch' + idx + '_';
  }

  function abTrackJobId(ab, idx, fmt) {
    return abTrackJobPrefix(ab, idx) + String(fmt || 'mp3').toLowerCase();
  }

  function parseAbJobId(jobId) {
    const m = /^ab_(.+?)__ch(\d+)_/i.exec(String(jobId || ''));
    if (!m) return null;
    return { cleanId: m[1], chapterIdx: Number(m[2]) };
  }

  function formatAudioMs(ms) {
    const tot = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    const h = Math.floor(tot / 3600);
    const m = Math.floor((tot % 3600) / 60);
    const s = tot % 60;
    const pad = (n) => (n < 10 ? '0' + n : String(n));
    return h > 0 ? (pad(h) + ':' + pad(m) + ':' + pad(s)) : (pad(m) + ':' + pad(s));
  }

  function findAudioJobForTrack(ab, track, idx) {
    const prefix = abTrackJobPrefix(ab, idx);
    const tUrl = track && track.url ? String(track.url) : '';
    let best = null;
    for (const j of (state.downloads || [])) {
      if (!j) continue;
      if (j.id && String(j.id).startsWith(prefix)) {
        if (j.status === 'done') return j;
        best = best || j;
      } else if (tUrl && j.url === tUrl && isAudioFileItem(j.format, j.fileName, j.localUri || j.uri)) {
        if (j.status === 'done') return j;
        best = best || j;
      }
    }
    return best;
  }

  function findOfflineAudioForBook(ab) {
    const curatedPrefix = 'ab_' + cleanAbId(ab.id) + '__ch';
    const matches = [];
    for (const item of getOfflineAudioTracks()) {
      if (item.bookId === ab.id || (item.downloadId && String(item.downloadId).startsWith(curatedPrefix))) {
        matches.push(item);
      }
    }
    return matches;
  }

  function getOfflineAudioTracks() {
    getCuratedAudiobooks();
    const out = [];
    const seen = new Set();
    for (const j of (state.downloads || [])) {
      if (!j || j.status !== 'done') continue;
      if (!isAudioFileItem(j.format, j.fileName, j.localUri || j.uri)) continue;
      const uri = String(j.localUri || j.uri || '').trim();
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      const parsed = parseAbJobId(j.id);
      let bookRef = null;
      if (parsed) {
        for (const candidate of AB_REG.values()) {
          if (cleanAbId(candidate.id) === parsed.cleanId) { bookRef = candidate; break; }
        }
      }
      out.push({
        id: j.id || uri,
        bookId: bookRef ? bookRef.id : (parsed ? parsed.cleanId : (j.bookId || ('dl_' + cleanAbId(j.title || uri)))),
        chapterIdx: parsed ? parsed.chapterIdx : 0,
        title: j.title || (bookRef && bookRef.title) || j.fileName || 'كتاب صوتي',
        author: (bookRef && bookRef.author) || j.source || 'محمل على الجهاز',
        cover: (bookRef && bookRef.cover) || '',
        uri,
        fileName: j.fileName || '',
        format: String(j.format || 'mp3').toLowerCase(),
        sizeBytes: Number(j.bytes || j.downloaded || 0),
        downloadId: j.id,
        jobUrl: j.url || '',
        sourceKind: 'download',
        modifiedAt: Number(j.finishedAt || j.createdAt || 0),
      });
    }
    for (const p of (state.pickedAudioBooks || [])) {
      const uri = String(p && p.uri || '').trim();
      if (!uri || seen.has(uri)) continue;
      seen.add(uri);
      out.push({
        id: p.id || ('picked_' + cleanAbId(uri)),
        bookId: p.bookId || ('picked_' + cleanAbId(uri)),
        chapterIdx: Number(p.chapterIdx || 0),
        title: p.title || p.fileName || 'ملف صوتي محلي',
        author: p.author || 'ملف من جهازك',
        cover: p.cover || '',
        uri,
        fileName: p.fileName || '',
        format: String((p.fileName || uri).split('.').pop() || 'mp3').toLowerCase(),
        sizeBytes: Number(p.sizeBytes || 0),
        downloadId: '',
        jobUrl: '',
        sourceKind: 'picked',
        modifiedAt: Number(p.addedAt || 0),
      });
    }
    out.sort((a, b) => (b.modifiedAt || 0) - (a.modifiedAt || 0));
    return out;
  }

  function getChapterOrigIdx(tr, fallbackIdx) {
    return (tr && Number.isFinite(Number(tr._origIdx))) ? Number(tr._origIdx) : Number(fallbackIdx || 0);
  }

  function stampTracksOrigIdx(list) {
    if (!Array.isArray(list)) return list;
    list.forEach((t, idx) => {
      if (t && !Number.isFinite(Number(t._origIdx))) t._origIdx = idx;
    });
    return list;
  }

  async function resolveTracksForBook(ab) {
    if (!ab) return [];
    registerAudiobook(ab);
    const cached = state.abTracksCache[ab.id];
    if (Array.isArray(cached) && cached.length) return stampTracksOrigIdx(cached);
    if (Array.isArray(ab.preloadedTracks) && ab.preloadedTracks.length) {
      const mapped = ab.preloadedTracks.map((t, idx) => ({
        _origIdx: idx,
        idx: Number.isFinite(t.idx) ? t.idx : idx,
        title: t.title || ('الفصل ' + (idx + 1)),
        ytVideoId: t.ytVideoId || '',
        url: t.url || '',
        durationSec: Number(t.durationSec || 0),
        durationLabel: t.durationLabel || (t.durationSec && S && S.formatDurationLabel ? S.formatDurationLabel(t.durationSec) : ''),
        format: String(t.format || 'mp3').toLowerCase(),
        sizeBytes: Number(t.sizeBytes || 0),
      }));
      state.abTracksCache[ab.id] = mapped;
      return mapped;
    }
    if (S && typeof S.resolveAudiobookTracks === 'function') {
      const resolved = await S.resolveAudiobookTracks(ab);
      if (Array.isArray(resolved) && resolved.length) {
        stampTracksOrigIdx(resolved);
        state.abTracksCache[ab.id] = resolved;
        return resolved;
      }
    }
    return [];
  }

  async function downloadAudioTrack(ab, track, idx) {
    if (!track) {
      KTB.toast('لا يوجد رابط مباشر لتحميل هذا الفصل');
      return;
    }
    const origIdx = getChapterOrigIdx(track, idx);
    if (track.ytVideoId && S && typeof S.resolveSingleAudioTrackUrl === 'function') {
      KTB.toast('جاري تجهيز رابط التحميل الصوتي...');
      await S.resolveSingleAudioTrackUrl(track);
    }
    if (!track.url) {
      KTB.toast('لا يوجد رابط مباشر لتحميل هذا الفصل');
      return;
    }
    const fmt = String(track.format || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
    const dlId = abTrackJobId(ab, origIdx, fmt);
    const titleStr = (ab.title || 'كتاب مسموع') + (track.title ? (' - ' + track.title) : '');
    KTB.downloadBook({
      id: dlId,
      title: titleStr,
      url: track.url,
      format: fmt,
      source: ab.source || 'كتب مسموعة',
      referer: ab.url || '',
    });
    KTB.toast('بدأ تحميل الفصل للاستماع بدون إنترنت: ' + titleStr);
    syncDownloadsFromNative();
    refreshAudiobookLiveUi();
  }

  async function downloadAllAudioChapters(ab, customTracks) {
    if (!ab) return;
    KTB.toast('جاري تجهيز ملفات الكتاب للتحميل...');
    const baseTracks = await resolveTracksForBook(ab);
    const tracks = Array.isArray(customTracks) && customTracks.length ? customTracks : baseTracks;
    if (!tracks.length) {
      KTB.toast('تعذر العثور على ملفات صوتية لهذا الكتاب');
      return;
    }
    if (S && typeof S.resolveSingleAudioTrackUrl === 'function') {
      const ytNeed = tracks.filter(t => t && t.ytVideoId);
      for (let i = 0; i < ytNeed.length; i += 4) {
        await Promise.allSettled(ytNeed.slice(i, i + 4).map(t => S.resolveSingleAudioTrackUrl(t)));
      }
    }
    let started = 0;
    for (let i = 0; i < tracks.length; i++) {
      const tr = tracks[i];
      if (!tr || !tr.url) continue;
      const origIdx = getChapterOrigIdx(tr, i);
      const existing = findAudioJobForTrack(ab, tr, origIdx);
      if (existing && (existing.status === 'done' || existing.status === 'downloading' || existing.status === 'queued')) continue;
      const fmt = String(tr.format || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
      KTB.downloadBook({
        id: abTrackJobId(ab, origIdx, fmt),
        title: (ab.title || 'كتاب مسموع') + (baseTracks.length > 1 && tr.title ? (' - ' + tr.title) : ''),
        url: tr.url,
        format: fmt,
        source: ab.source || 'كتب مسموعة',
        referer: ab.url || '',
      });
      started++;
    }
    if (started > 0) {
      KTB.toast('تمت إضافة ' + started + ' مقطع صوتي لقائمة التحميل');
      syncDownloadsFromNative();
      refreshAudiobookLiveUi();
    } else {
      KTB.toast('جميع المقاطع المحددة محملة أو قيد التحميل بالفعل');
    }
  }

  async function playAudioBook(ab, trackIdx, forceMode, customTracks) {
    if (!ab) return;
    registerAudiobook(ab);
    let baseTracks = state.abTracksCache[ab.id];
    if (!baseTracks || !baseTracks.length) {
      KTB.toast('جاري تجهيز المشغل الصوتي...');
      baseTracks = await resolveTracksForBook(ab);
    } else {
      stampTracksOrigIdx(baseTracks);
    }
    if (!baseTracks || !baseTracks.length) {
      KTB.toast('تعذر تحميل مقاطع الصوت لهذا الكتاب حالياً');
      return;
    }
    let tracks = Array.isArray(customTracks) && customTracks.length ? customTracks : baseTracks;
    const saved = state.abProgressMap[ab.id] || null;
    let idx = Number.isFinite(trackIdx) ? Number(trackIdx) : ((!customTracks && saved) ? Number(saved.chapterIdx || 0) : 0);
    if (idx < 0 || idx >= tracks.length) idx = 0;
    const track = tracks[idx];
    const trackOrigIdx = getChapterOrigIdx(track, idx);
    const dlJob = findAudioJobForTrack(ab, track, trackOrigIdx);
    const localUri = (dlJob && dlJob.status === 'done') ? (dlJob.localUri || dlJob.uri || '') : '';
    const useOffline = forceMode === 'offline' ? !!localUri : (forceMode === 'online' ? false : !!localUri);
    if (!useOffline && track && track.ytVideoId && S && typeof S.resolveSingleAudioTrackUrl === 'function') {
      if (!track.url) {
        _abBarDismissed = false;
        syncAudioPlayerUi({
          bookId: ab.id,
          title: ab.title || 'كتاب مسموع',
          author: ab.author || '',
          chapterTitle: track.title || ('الفصل ' + (idx + 1)),
          chapterIdx: idx,
          coverUrl: ab.cover || '',
          isOffline: false,
          durationMs: Math.round(Number(track.durationSec || 0) * 1000),
          positionMs: 0,
          isPlaying: true,
          isPreparing: true,
          stopped: false,
          speed: (state.abAudioState && Number(state.abAudioState.speed)) || 1.0,
        });
      }
      await S.resolveSingleAudioTrackUrl(track);
      const restYt = tracks.filter(t => t && t !== track && t.ytVideoId).slice(0, 15);
      if (restYt.length) {
        Promise.allSettled(restYt.map(t => S.resolveSingleAudioTrackUrl(t))).catch(() => {});
      }
    }
    if (!useOffline && (!track || !track.url)) {
      KTB.toast('تعذر استخراج رابط البث الصوتي لهذا المقطع حالياً');
      return;
    }
    if (forceMode === 'offline' && !localUri) {
      if (track && track.url) {
        downloadAudioTrack(ab, track, trackOrigIdx);
        return;
      }
      KTB.toast('هذا الفصل غير محمل على جهازك بعد');
      return;
    }
    const seekMs = (!customTracks && saved && Number(saved.chapterIdx) === trackOrigIdx && Number(saved.positionMs) > 2000)
      ? Number(saved.positionMs)
      : 0;
    const chaptersPayload = tracks.map((t, i) => {
      const oIdx = getChapterOrigIdx(t, i);
      const j = findAudioJobForTrack(ab, t, oIdx);
      const lUri = (j && j.status === 'done') ? (j.localUri || j.uri || '') : '';
      return {
        idx: i,
        origIdx: oIdx,
        title: t.title || ('الفصل ' + (i + 1)),
        url: t.url || '',
        localUri: lUri,
        format: t.format || 'mp3',
        durationMs: Math.round(Number(t.durationSec || 0) * 1000),
      };
    });
    const speed = (state.abAudioState && Number(state.abAudioState.speed)) || 1.0;
    const payload = {
      bookId: ab.id,
      title: ab.title || 'كتاب مسموع',
      author: ab.author || '',
      chapterTitle: track.title || ('الفصل ' + (idx + 1)),
      chapterIdx: idx,
      chapters: chaptersPayload,
      srcUrl: useOffline ? '' : (track.url || ''),
      localUri: useOffline ? localUri : '',
      coverUrl: ab.cover || '',
      isOffline: useOffline,
      durationMs: Math.round(Number(track.durationSec || 0) * 1000),
      seekMs,
      speed,
    };
    state.abCurrentBook = { id: ab.id, title: ab.title, author: ab.author, cover: ab.cover || '' };
    saveJson('wq_ab_current', state.abCurrentBook);
    _abLastAudioErr = '';
    _abBarDismissed = false;
    if (KTB.audioPlay) KTB.audioPlay(payload);
    syncAudioPlayerUi({
      ...payload,
      isPlaying: true,
      isPreparing: true,
      stopped: false,
      positionMs: seekMs,
    });
  }

  function playOfflineAudioItem(item) {
    if (!item || !item.uri) return;
    _abBarDismissed = false;
    const bookRef = item.bookId && AB_REG.get(item.bookId);
    if (bookRef && (state.abTracksCache[bookRef.id] || bookRef.preloadedTracks)) {
      playAudioBook(bookRef, item.chapterIdx || 0, 'offline');
      return;
    }
    const fakeAb = {
      id: item.bookId || item.id,
      title: item.title || 'ملف صوتي محلي',
      author: item.author || 'محمل على الجهاز',
      cover: item.cover || '',
      preloadedTracks: [{
        idx: 0,
        title: item.fileName || item.title || 'ملف صوتي',
        url: '',
        durationSec: 0,
        format: item.format || 'mp3',
      }],
    };
    const saved = state.abProgressMap[fakeAb.id] || null;
    const seekMs = (saved && Number(saved.positionMs) > 2000) ? Number(saved.positionMs) : 0;
    const speed = (state.abAudioState && Number(state.abAudioState.speed)) || 1.0;
    const payload = {
      bookId: fakeAb.id,
      title: fakeAb.title,
      author: fakeAb.author,
      chapterTitle: item.fileName || fakeAb.title,
      chapterIdx: 0,
      chapters: [{ idx: 0, title: fakeAb.title, url: '', localUri: item.uri, format: item.format || 'mp3', durationMs: 0 }],
      srcUrl: '',
      localUri: item.uri,
      coverUrl: fakeAb.cover,
      isOffline: true,
      durationMs: 0,
      seekMs,
      speed,
    };
    state.abCurrentBook = { id: fakeAb.id, title: fakeAb.title, author: fakeAb.author, cover: fakeAb.cover };
    saveJson('wq_ab_current', state.abCurrentBook);
    _abLastAudioErr = '';
    _abBarDismissed = false;
    if (KTB.audioPlay) KTB.audioPlay(payload);
    syncAudioPlayerUi({ ...payload, isPlaying: true, isPreparing: true, stopped: false, positionMs: seekMs });
  }

  function deleteOfflineAudioItem(item) {
    if (!item) return;
    if (item.sourceKind === 'picked') {
      state.pickedAudioBooks = (state.pickedAudioBooks || []).filter(p => p && p.uri !== item.uri);
      saveJson('wq_picked_audio_v1', state.pickedAudioBooks);
    } else {
      if (item.uri && KTB.deleteLocalBook) KTB.deleteLocalBook(item.uri);
      if (item.downloadId && KTB.removeDownload) KTB.removeDownload(item.downloadId);
      state.downloads = (state.downloads || []).filter(d => d && d.id !== item.downloadId && (d.localUri || d.uri) !== item.uri);
    }
    invalidateOwnedCache();
    renderAudiobooks();
    refreshAudiobookModalChapters();
    KTB.toast('تمت إزالة الملف الصوتي من الجهاز');
  }

  function syncAudioPlayerUi(st) {
    if (!st || typeof st !== 'object') return;
    state.abAudioState = st;
    if (st.isPlaying || st.isPreparing) {
      _abBarDismissed = false;
    }
    const hasTrack = Boolean(st.title || st.bookId || st.srcUrl || st.localUri);
    const shouldHide = !hasTrack || !!st.stopped || (_abBarDismissed && !st.isPlaying && !st.isPreparing);
    const card = $('abPlayerCard');
    const mini = $('abMiniBar');
    if (card) card.classList.toggle('hidden', shouldHide);
    if (mini) mini.classList.toggle('hidden', shouldHide);
    if (shouldHide) return;

    const badge = $('abPlayerModeBadge');
    if (badge) {
      badge.textContent = st.isOffline ? 'محمل على الجهاز • أوفلاين' : 'بث عبر الإنترنت';
      badge.classList.toggle('offline', !!st.isOffline);
    }
    if ($('abPlayerChapterLbl')) {
      $('abPlayerChapterLbl').textContent = st.chapterTitle || (st.isPreparing ? 'جاري التحميل...' : '');
    }
    if ($('abPlayerTitle')) $('abPlayerTitle').textContent = st.title || 'كتاب مسموع';
    if ($('abPlayerAuthor')) $('abPlayerAuthor').textContent = st.author || (st.isOffline ? 'استماع محلي بدون نت' : 'بث مباشر');

    const covEl = $('abPlayerCov');
    if (covEl) {
      const covUrl = st.coverUrl || (state.abCurrentBook && state.abCurrentBook.cover) || '';
      const curSrc = covEl.getAttribute('data-cov') || '';
      if (covUrl !== curSrc) {
        covEl.setAttribute('data-cov', covUrl);
        covEl.innerHTML = covUrl
          ? '<img src="' + esc(covUrl) + '" alt="" onerror="this.remove()">'
          : SVG.headphones;
      } else if (!covEl.innerHTML.trim()) {
        covEl.innerHTML = SVG.headphones;
      }
    }

    const durMs = Math.max(0, Number(st.durationMs || 0));
    const posMs = Math.max(0, Number(st.positionMs || 0));
    if (!_abSeeking) {
      const posTxt = formatAudioMs(posMs);
      const durTxt = durMs > 0 ? formatAudioMs(durMs) : '--:--';
      const pctStr = String(durMs > 0 ? Math.min(1000, Math.max(0, Math.round((posMs / durMs) * 1000))) : 0);
      if ($('abCurTime')) $('abCurTime').textContent = posTxt;
      if ($('abDurTime')) $('abDurTime').textContent = durTxt;
      if ($('abSeekRange')) $('abSeekRange').value = pctStr;
      if ($('abMiniCurTime')) $('abMiniCurTime').textContent = posTxt;
      if ($('abMiniDurTime')) $('abMiniDurTime').textContent = durTxt;
      if ($('abMiniSeekRange')) $('abMiniSeekRange').value = pctStr;
    }

    const spd = Number(st.speed || 1.0);
    if ($('abSpeedBtn')) $('abSpeedBtn').textContent = (Number.isInteger(spd) ? spd.toFixed(1) : String(spd)) + 'x';
    const sleepBtn = $('abSleepBtn');
    if (sleepBtn) {
      const remSec = Number(st.sleepRemainingSec || 0);
      if (st.sleepMode === 'chapter') {
        sleepBtn.textContent = 'نوم: الفصل';
        sleepBtn.classList.add('on');
      } else if (remSec > 0) {
        sleepBtn.textContent = 'نوم: ' + Math.max(1, Math.ceil(remSec / 60)) + 'د';
        sleepBtn.classList.add('on');
      } else {
        sleepBtn.textContent = 'نوم';
        sleepBtn.classList.remove('on');
      }
    }

    const playSvgInner = st.isPlaying
      ? '<rect x="6" y="4" width="4" height="16" fill="currentColor"/><rect x="14" y="4" width="4" height="16" fill="currentColor"/>'
      : '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor"/>';
    if ($('abPlayMainIc')) $('abPlayMainIc').innerHTML = playSvgInner;
    if ($('abMiniPlayBtn')) $('abMiniPlayBtn').innerHTML = '<svg class="ic sm" viewBox="0 0 24 24">' + playSvgInner + '</svg>';

    if ($('abMiniTitle')) $('abMiniTitle').textContent = st.title || 'كتاب مسموع';
    if ($('abMiniSub')) {
      const modeLbl = st.isPreparing ? 'جاري التجهيز...' : (st.isOffline ? 'أوفلاين' : 'بث مباشر');
      const chLbl = st.chapterTitle ? (st.chapterTitle + ' • ') : '';
      $('abMiniSub').textContent = chLbl + modeLbl;
    }

    if (st.bookId && (posMs > 0 || !st.isPlaying)) {
      const now = Date.now();
      if (!st.isPlaying || (now - _abLastSavedPosAt > 4500)) {
        _abLastSavedPosAt = now;
        state.abProgressMap[st.bookId] = {
          chapterIdx: Number(st.chapterIdx || 0),
          positionMs: posMs,
          durationMs: durMs,
          updatedAt: now,
        };
        saveJson('wq_ab_progress_v1', state.abProgressMap);
      }
    }

    if (st.error && st.error !== _abLastAudioErr) {
      _abLastAudioErr = String(st.error);
      KTB.toast(st.error);
    }
    highlightPlayingModalChapter(st);
  }

  function highlightPlayingModalChapter(st) {
    const modal = $('audiobookModal');
    if (!modal || modal.classList.contains('hidden')) return;
    const bid = state.abModalBookId || '';
    if (!bid || st.bookId !== bid) return;
    const curCh = Number(st.chapterIdx || 0);
    const curTitle = String(st.chapterTitle || '').trim();
    modal.querySelectorAll('.ab-chapter-row').forEach(row => {
      const posAttr = row.getAttribute('data-ch-pos');
      const strongEl = row.querySelector('.ab-chapter-main strong');
      const rowTitle = strongEl ? strongEl.textContent.replace(/^\d+\.\s*/, '').trim() : '';
      const isMatch = curTitle && rowTitle
        ? (rowTitle === curTitle)
        : (Number(posAttr != null ? posAttr : row.getAttribute('data-ch-idx')) === curCh);
      row.classList.toggle('playing', isMatch);
    });
  }

  function renderOfflineAudiobooks() {
    const wrap = $('abOfflineWrap');
    const listEl = $('abOfflineList');
    const badge = $('abOfflineCountBadge');
    if (!wrap || !listEl) return 0;

    const items = getOfflineAudioTracks();
    if (badge) badge.textContent = String(items.length) + ' ملف';

    const showWrap = state.abMode === 'offline' || (state.abMode === 'all' && items.length > 0);
    wrap.classList.toggle('hidden', !showWrap);
    if (!showWrap) return items.length;

    if (!items.length) {
      listEl.innerHTML = '<div class="empty-msg" style="padding:14px 8px">لا توجد ملفات صوتية محملة على جهازك بعد. اختر أي كتاب مسموع واضغط «تحميل للاستماع بدون نت» أو أضف ملفاً صوتياً من جهازك.</div>';
      return 0;
    }

    listEl.innerHTML = items.map((it, i) => {
      const meta = [
        it.author || '',
        (it.format || 'mp3').toUpperCase(),
        it.sizeBytes ? formatBytes(it.sizeBytes) : '',
      ].filter(Boolean).join(' • ');
      return '<div class="ab-offline-row">'
        + '<div class="ab-offline-row-main">'
        + '<strong>' + esc(it.title) + '</strong>'
        + '<span>' + esc(meta) + '</span>'
        + '</div>'
        + '<div class="ab-offline-row-acts">'
        + '<button type="button" class="btn emerald sm" data-ab-off-play="' + i + '">' + SVG.play + '<span>تشغيل</span></button>'
        + '<button type="button" class="icon-btn sm" data-ab-off-del="' + i + '" title="حذف الملف الصوتي" aria-label="حذف">' + SVG.trash + '</button>'
        + '</div>'
        + '</div>';
    }).join('');

    listEl.querySelectorAll('[data-ab-off-play]').forEach(btn => {
      btn.onclick = () => {
        const it = items[Number(btn.dataset.abOffPlay)];
        if (it) playOfflineAudioItem(it);
      };
    });
    listEl.querySelectorAll('[data-ab-off-del]').forEach(btn => {
      btn.onclick = () => {
        const it = items[Number(btn.dataset.abOffDel)];
        if (it) deleteOfflineAudioItem(it);
      };
    });
    return items.length;
  }

  function isWideAudioCover(ab) {
    if (!ab) return false;
    return ab.audioType === 'youtube' || /ytimg\.com/i.test(ab.cover || '') || !!(ab.ytVideoId);
  }

  function renderAudiobookCardHtml(ab) {
    registerAudiobook(ab);
    const isLicensed = ab.licenseType === 'licensed_store';
    const isWide = isWideAudioCover(ab);
    const offlineMatches = isLicensed ? [] : findOfflineAudioForBook(ab);
    const hasOffline = offlineMatches.length > 0;
    const isAr = ab.lang === 'ar' || /[\u0600-\u06FF]/.test(ab.title || '');
    const [c1, c2] = coverColors(ab.title, ab.cat || 'literature', isAr);
    const tracksTxt = typeof ab.tracksHint === 'number'
      ? (ab.tracksHint + (ab.tracksHint > 1 ? ' فصول' : ' فصل'))
      : (ab.tracksHint || 'كتاب مسموع');
    const langTxt = isAr ? 'عربي' : 'عالمي';
    const kindTxt = isLicensed ? 'منصة رسمية' : (ab.audioKind === 'summary' ? 'ملخص كتاب' : 'مجاني');
    const covHtml = '<div class="bcover-fallback' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + ';position:absolute;inset:0;padding:8px">'
      + coverInnerHtml({ title: ab.title, author: ab.author, lang: ab.lang }) + '</div>'
      + (ab.cover ? '<img src="' + esc(ab.cover) + '" alt="" loading="lazy" decoding="async" style="position:relative;z-index:1" onerror="this.remove()">' : '');
    const actsHtml = isLicensed
      ? ((ab.previewUrl
          ? '<button type="button" class="btn emerald sm" data-ab-play="' + esc(ab.id) + '">' + SVG.play + '<span>معاينة رسمية</span></button>'
          : '')
        + '<button type="button" class="btn glass sm" data-ab-open="' + esc(ab.id) + '">بديل مجاني</button>'
        + '<button type="button" class="btn glass sm" data-ab-ext="' + esc(ab.id) + '">المصدر</button>')
      : ('<button type="button" class="btn emerald sm" data-ab-play="' + esc(ab.id) + '">' + SVG.play + '<span>' + (hasOffline ? 'استماع أوفلاين' : 'استماع الآن') + '</span></button>'
        + '<button type="button" class="btn glass sm" data-ab-open="' + esc(ab.id) + '">الفصول والتحميل</button>');
    return '<article class="ab-card' + (isWide ? ' wide-cov' : '') + '" data-abid="' + esc(ab.id) + '">'
      + '<div class="ab-card-cov">' + covHtml + '</div>'
      + '<div class="ab-card-body">'
      + '<div>'
      + '<div class="ab-card-title">' + esc(ab.title) + '</div>'
      + '<div class="ab-card-author">' + esc(ab.author || ab.source || 'كتاب مسموع') + '</div>'
      + '</div>'
      + '<div class="ab-card-tags">'
      + '<span class="ab-tag">' + esc(langTxt) + '</span>'
      + '<span class="ab-tag ' + (isLicensed ? 'licensed' : (ab.audioKind === 'summary' ? 'offline' : 'accent')) + '">' + esc(kindTxt) + '</span>'
      + (tracksTxt !== kindTxt ? '<span class="ab-tag accent">' + esc(tracksTxt) + '</span>' : '')
      + (hasOffline ? '<span class="ab-tag offline">متاح أوفلاين (' + offlineMatches.length + ')</span>' : '')
      + '</div>'
      + '<div class="ab-card-acts">' + actsHtml + '</div>'
      + '</div>'
      + '</article>';
  }

  function filterAudiobooksByCategory(list, cat) {
    if (!cat || cat === 'all') return list;
    if (cat === 'free') return list.filter(b => b.licenseType !== 'licensed_store');
    if (cat === 'summaries') {
      return list.filter(b => b.audioKind === 'summary' || b.audioType === 'youtube' || /ملخص|تلخيص|خلاصة|بودكاست|summary|podcast/i.test((b.title || '') + ' ' + (b.source || '')));
    }
    if (cat === 'ar') return list.filter(b => b.lang === 'ar' || /[\u0600-\u06FF]/.test(b.title || ''));
    if (cat === 'en') return list.filter(b => b.lang !== 'ar' && !/[\u0600-\u06FF]/.test(b.title || ''));
    if (cat === 'fiction') return list.filter(b => b.cat === 'arabic_novels' || b.cat === 'mystery_classics');
    if (cat === 'self_dev') return list.filter(b => b.cat === 'psychology_habits' || b.cat === 'marketing_strategy' || b.cat === 'history_thought');
    if (cat === 'science_med') return list.filter(b => b.cat === 'science_med');
    if (cat === 'latest') {
      const lat = list.filter(b => b.isLatest || b.isHighlight);
      return lat.length ? lat : list.slice().reverse();
    }
    if (cat === 'popular') {
      const popIds = ['ab_enjoy_life_ar', 'ab_tashani_books_ar', 'ab_sherlock_holmes_en', 'ab_crime_punishment_en', 'ab_as_a_man_thinketh_en', 'ab_art_of_war_en'];
      return list.slice().sort((a, b) => {
        const ai = popIds.indexOf(a.id);
        const bi = popIds.indexOf(b.id);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
    }
    return list;
  }

  const _abCovRequested = new Set();
  async function upgradeAudiobookCardsCovers(list) {
    if (!S || typeof S.resolveBookCover !== 'function' || !Array.isArray(list)) return;
    const todo = list.filter(ab => ab && ab.id && !isWideAudioCover(ab) && (!ab.cover || /archive\.org/i.test(ab.cover)) && !_abCovRequested.has(ab.id)).slice(0, 8);
    if (!todo.length) return;
    todo.forEach(ab => _abCovRequested.add(ab.id));
    for (let i = 0; i < todo.length; i += 3) {
      await Promise.allSettled(todo.slice(i, i + 3).map(async (ab) => {
        const cleanAb = Object.assign({}, ab, { title: String(ab.title || '').replace(/\([^)]*\)/g, '').trim() });
        const url = await S.resolveBookCover(cleanAb, { priority: 'low' }).catch(() => '');
        if (!isSafeCoverForBook(ab, url)) return;
        ab.cover = url;
        document.querySelectorAll('.ab-card[data-abid="' + CSS.escape(ab.id) + '"] .ab-card-cov').forEach(slot => {
          let img = slot.querySelector('img');
          if (!img) {
            img = document.createElement('img');
            img.alt = '';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.style.cssText = 'position:relative;z-index:1';
            img.onerror = function () { this.remove(); };
            slot.appendChild(img);
          }
          img.src = url;
        });
      }));
    }
  }

  function renderAudiobooks() {
    const grid = $('abGrid');
    if (!grid) return;

    renderOfflineAudiobooks();
    if (S && typeof S.prewarmAudiobooksEngine === 'function') S.prewarmAudiobooksEngine();
    document.querySelectorAll('#abModeSeg button').forEach(b => b.classList.toggle('on', b.dataset.abmode === state.abMode));
    document.querySelectorAll('#abCatPills button').forEach(b => b.classList.toggle('on', b.dataset.abcat === state.abCat));

    if (state.abCat === 'latest' && !state.abLatestBooks.length && !state.abQuery && S && S.fetchLibriVoxLatest && !state._fetchingLatestAb) {
      state._fetchingLatestAb = true;
      S.fetchLibriVoxLatest({}).then(items => {
        if (Array.isArray(items) && items.length) {
          state.abLatestBooks = items;
          renderAudiobooks();
        }
      }).finally(() => { state._fetchingLatestAb = false; });
    }
    if ((state.abCat === 'summaries' || state.abCat === 'all') && !(state.abYtHighlights && state.abYtHighlights.length) && !state.abQuery && S && S.fetchYouTubeSummaryHighlights && !state._fetchingYtAb) {
      state._fetchingYtAb = true;
      S.fetchYouTubeSummaryHighlights({}).then(items => {
        if (Array.isArray(items) && items.length) {
          state.abYtHighlights = items;
          renderAudiobooks();
        }
      }).finally(() => { state._fetchingYtAb = false; });
    }

    const curated = getCuratedAudiobooks();
    const ytExtra = Array.isArray(state.abYtHighlights) ? state.abYtHighlights : [];
    let list = state.abQuery
      ? (state.abSearchResults || []).map(registerAudiobook)
      : [...curated, ...ytExtra, ...(state.abCat === 'latest' ? state.abLatestBooks : [])].map(registerAudiobook);

    list = filterAudiobooksByCategory(list, state.abCat);

    if (state.abMode === 'offline') {
      list = list.filter(b => b.licenseType !== 'licensed_store' && findOfflineAudioForBook(b).length > 0);
    } else if (S && typeof S.prefetchYouTubeAudioStreams === 'function') {
      S.prefetchYouTubeAudioStreams(list, 6).catch(() => {});
    }

    const titleEl = $('abCatalogTitle');
    const hintEl = $('abStatusHint');
    if (titleEl) {
      titleEl.textContent = state.abQuery
        ? ('نتائج البحث الصوتي: «' + state.abQuery + '»')
        : (state.abMode === 'offline' ? 'الكتب المسموعة المحملة' : 'مكتبة الكتب المسموعة');
    }
    if (hintEl) {
      if (state.abSearching) {
        hintEl.textContent = 'جاري البحث...';
      } else {
        hintEl.textContent = list.length + ' كتاب مسموع';
      }
    }

    if (!list.length) {
      grid.innerHTML = state.abSearching
        ? '<div class="empty-msg">جاري البحث عن الكتاب المسموع والملخصات الصوتية المرتبة...</div>'
        : (state.abMode === 'offline'
          ? '<div class="empty-msg">لتحميل كتب كاملة للاستماع بدون إنترنت، اختر تبويب «عبر الإنترنت (بث)» أو «الكل» واضغط «الفصول والتحميل».</div>'
          : '<div class="empty-msg">لا توجد نتائج مطابقة لهذا التصنيف. جرّب اختيار «الكل» أو البحث عن كتاب أو ملخص.</div>');
      return;
    }

    grid.innerHTML = list.map(renderAudiobookCardHtml).join('');
    upgradeAudiobookCardsCovers(list);
    grid.querySelectorAll('[data-ab-play]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const ab = AB_REG.get(btn.dataset.abPlay);
        if (ab) playAudioBook(ab, undefined, state.abMode === 'online' ? 'online' : 'auto');
      };
    });
    grid.querySelectorAll('[data-ab-open]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const ab = AB_REG.get(btn.dataset.abOpen);
        if (ab) openAudiobookModal(ab);
      };
    });
    grid.querySelectorAll('[data-ab-ext]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const ab = AB_REG.get(btn.dataset.abExt);
        if (ab && ab.externalUrl && KTB.openUrl) KTB.openUrl(ab.externalUrl);
      };
    });
    grid.querySelectorAll('.ab-card').forEach(card => {
      card.onclick = () => {
        const ab = AB_REG.get(card.dataset.abid);
        if (ab) openAudiobookModal(ab);
      };
    });
  }

  function ensureAbChapterPlan(ab, tracks) {
    stampTracksOrigIdx(tracks);
    const n = tracks.length;
    const validOrig = new Set(tracks.map((t, i) => getChapterOrigIdx(t, i)));
    let plan = ab && state.abChapterPlanMap[ab.id];
    if (!plan) {
      plan = {
        sortMode: 'asc',
        startPos: 1,
        pickCount: n,
        order: Array.from(validOrig),
        selectedSet: new Set(validOrig),
      };
      if (ab) state.abChapterPlanMap[ab.id] = plan;
    } else {
      const seen = new Set();
      const nextOrder = [];
      for (const oid of (plan.order || [])) {
        if (validOrig.has(oid) && !seen.has(oid)) {
          seen.add(oid);
          nextOrder.push(oid);
        }
      }
      for (const oid of validOrig) {
        if (!seen.has(oid)) {
          seen.add(oid);
          nextOrder.push(oid);
        }
      }
      plan.order = nextOrder;
      const nextSel = new Set();
      for (const oid of (plan.selectedSet || [])) {
        if (validOrig.has(oid)) nextSel.add(oid);
      }
      if (!nextSel.size && n > 0 && plan.pickCount !== 0) {
        for (const oid of nextOrder) nextSel.add(oid);
      }
      plan.selectedSet = nextSel;
      plan.startPos = Math.max(1, Math.min(Math.max(1, n), Number(plan.startPos) || 1));
      if (!Number.isFinite(plan.pickCount) || plan.pickCount < 0) plan.pickCount = n;
      if (plan.pickCount > n) plan.pickCount = n;
    }
    return plan;
  }

  function applyAbChapterSlice(plan, startPos, pickCount) {
    const n = plan.order.length;
    const s = Math.max(1, Math.min(Math.max(1, n), Number(startPos) || 1));
    const c = Math.max(0, Math.min(n - s + 1, Number.isFinite(Number(pickCount)) ? Number(pickCount) : n));
    plan.startPos = s;
    plan.pickCount = c;
    plan.selectedSet = new Set(plan.order.slice(s - 1, s - 1 + c));
  }

  function applyAbChapterSort(ab, tracks, mode) {
    const plan = ensureAbChapterPlan(ab, tracks);
    plan.sortMode = mode || 'asc';
    const items = tracks.map((tr, i) => ({ tr, oid: getChapterOrigIdx(tr, i) }));
    if (plan.sortMode === 'desc') {
      items.sort((a, b) => b.oid - a.oid);
    } else if (plan.sortMode === 'title') {
      items.sort((a, b) => String(a.tr.title || '').localeCompare(String(b.tr.title || ''), 'ar', { numeric: true }));
    } else {
      items.sort((a, b) => a.oid - b.oid);
    }
    plan.order = items.map(x => x.oid);
    applyAbChapterSlice(plan, plan.startPos, plan.pickCount);
    return plan;
  }

  function moveAbChapterOrder(ab, tracks, orderPos, delta) {
    const plan = ensureAbChapterPlan(ab, tracks);
    const target = orderPos + delta;
    if (orderPos < 0 || orderPos >= plan.order.length || target < 0 || target >= plan.order.length) return plan;
    plan.sortMode = 'custom';
    const tmp = plan.order[orderPos];
    plan.order[orderPos] = plan.order[target];
    plan.order[target] = tmp;
    return plan;
  }

  function getAbOrderedTracks(ab, tracks, selectedOnly) {
    if (!Array.isArray(tracks) || !tracks.length) return [];
    const plan = ensureAbChapterPlan(ab, tracks);
    const byOrig = new Map();
    tracks.forEach((t, i) => byOrig.set(getChapterOrigIdx(t, i), t));
    const ordered = plan.order.map(oid => byOrig.get(oid)).filter(Boolean);
    if (!selectedOnly) return ordered;
    const picked = ordered.filter((t, i) => plan.selectedSet.has(getChapterOrigIdx(t, i)));
    return picked.length ? picked : ordered;
  }

  function renderAbChapterToolsHtml(ab, tracks) {
    if (!ab || !Array.isArray(tracks) || tracks.length <= 1 || ab.licenseType === 'licensed_store') return '';
    const plan = ensureAbChapterPlan(ab, tracks);
    const n = tracks.length;
    const selCount = plan.selectedSet.size;
    const presets = [n, 3, 5, 10].filter((v, idx, arr) => v <= n && arr.indexOf(v) === idx);
    const presetHtml = presets.map(v => {
      const label = v === n ? ('الكل (' + n + ')') : String(v);
      const active = selCount === v && plan.startPos === 1;
      return '<button type="button" class="ab-ch-pill' + (active ? ' active' : '') + '" data-ch-preset="' + v + '">' + esc(label) + '</button>';
    }).join('');
    return '<div class="ab-ch-tools" id="abChTools">'
      + '<div class="ab-ch-tools-row">'
      + '<span class="ab-ch-lbl">ترتيب:</span>'
      + '<button type="button" class="ab-ch-pill' + (plan.sortMode === 'asc' ? ' active' : '') + '" data-ch-sort="asc">تصاعدي ١→' + n + '</button>'
      + '<button type="button" class="ab-ch-pill' + (plan.sortMode === 'desc' ? ' active' : '') + '" data-ch-sort="desc">تنازلي ' + n + '→١</button>'
      + '<button type="button" class="ab-ch-pill' + (plan.sortMode === 'title' ? ' active' : '') + '" data-ch-sort="title">بالاسم</button>'
      + (plan.sortMode === 'custom' ? '<span class="ab-tag accent">ترتيب يدوي</span>' : '')
      + '</div>'
      + '<div class="ab-ch-tools-row">'
      + '<label class="ab-ch-lbl" for="abChFromInput">من:</label>'
      + '<input type="number" id="abChFromInput" class="ab-ch-num" min="1" max="' + n + '" value="' + plan.startPos + '" inputmode="numeric">'
      + '<label class="ab-ch-lbl" for="abChCountInput">العدد:</label>'
      + '<input type="number" id="abChCountInput" class="ab-ch-num" min="1" max="' + n + '" value="' + (selCount || plan.pickCount || n) + '" inputmode="numeric">'
      + '<span class="ab-ch-total">من ' + n + '</span>'
      + '<div class="ab-ch-presets">' + presetHtml + '</div>'
      + '</div>'
      + '<div class="ab-ch-tools-row ab-ch-tools-acts">'
      + '<span class="ab-ch-summary" id="abChSelSummary">المحدد: ' + selCount + ' من ' + n + '</span>'
      + '<div class="ab-ch-acts-pair">'
      + '<button type="button" class="btn emerald sm" id="abChPlaySelectedBtn"' + (selCount ? '' : ' disabled') + '>' + SVG.play + '<span>تشغيل (' + selCount + ')</span></button>'
      + '<button type="button" class="btn glass sm" id="abChDlSelectedBtn"' + (selCount ? '' : ' disabled') + '>' + SVG.download + '<span>تحميل (' + selCount + ')</span></button>'
      + '</div>'
      + '</div>'
      + '</div>';
  }

  function renderAudiobookModalChaptersHtml(ab, tracks) {
    if (!tracks || !tracks.length) {
      return '<div class="empty-msg">' + (ab.licenseType === 'licensed_store'
        ? 'هذا الكتاب متوفر عبر المنصة الرسمية فقط — استخدم زر «فتح في المصدر الرسمي».'
        : 'تعذر جلب الفصول الصوتية حالياً — تحقق من الاتصال وحاول مجدداً.') + '</div>';
    }
    const isLicensed = ab.licenseType === 'licensed_store';
    const plan = ensureAbChapterPlan(ab, tracks);
    const orderedTracks = isLicensed ? tracks : getAbOrderedTracks(ab, tracks, false);
    const multi = !isLicensed && orderedTracks.length > 1;
    const curPlayingBook = state.abAudioState && state.abAudioState.bookId;
    const curPlayingIdx = state.abAudioState ? Number(state.abAudioState.chapterIdx || 0) : -1;
    const curPlayingTitle = state.abAudioState ? String(state.abAudioState.chapterTitle || '') : '';
    return orderedTracks.map((tr, pos) => {
      const origIdx = getChapterOrigIdx(tr, pos);
      const job = isLicensed ? null : findAudioJobForTrack(ab, tr, origIdx);
      const isDone = !!(job && job.status === 'done');
      const isActive = !!(job && (job.status === 'downloading' || job.status === 'queued'));
      const pct = isActive ? getDisplayDownloadPct(job) : 0;
      const isSelected = !multi || plan.selectedSet.has(origIdx);
      const isPlayingThis = curPlayingBook === ab.id && ((curPlayingTitle && tr.title && curPlayingTitle === tr.title) || (!multi && curPlayingIdx === origIdx));
      const metaParts = [
        tr.durationLabel || (tr.durationSec ? formatAudioMs(tr.durationSec * 1000) : ''),
        (tr.format || 'mp3').toUpperCase(),
        isLicensed ? 'معاينة رسمية (غير قابل للتحميل)' : (isDone ? 'محمل على الجهاز (أوفلاين)' : (isActive ? ('جاري التحميل ' + pct + '%') : 'بث مباشر')),
      ].filter(Boolean).join(' • ');
      return '<div class="ab-chapter-row' + (isPlayingThis ? ' playing' : '') + (isDone ? ' offline' : '') + (multi && !isSelected ? ' unselected' : '') + '" data-ch-pos="' + pos + '" data-ch-orig="' + origIdx + '">'
        + '<div class="ab-ch-top">'
        + (multi ? '<label class="ab-ch-chk-wrap"><input type="checkbox" class="ab-ch-chk" data-ch-chk="' + origIdx + '"' + (isSelected ? ' checked' : '') + '></label>' : '')
        + '<strong class="ab-ch-title">' + (pos + 1) + '. ' + esc(tr.title || ('الفصل ' + (origIdx + 1))) + '</strong>'
        + (multi
          ? ('<div class="ab-ch-mv-pair"><button type="button" class="icon-btn sm ab-ch-mv" data-ch-up="' + pos + '" title="أعلى" aria-label="تحريك لأعلى"' + (pos === 0 ? ' disabled' : '') + '>↑</button>'
            + '<button type="button" class="icon-btn sm ab-ch-mv" data-ch-dn="' + pos + '" title="أسفل" aria-label="تحريك لأسفل"' + (pos === orderedTracks.length - 1 ? ' disabled' : '') + '>↓</button></div>')
          : '')
        + '</div>'
        + '<div class="ab-ch-foot">'
        + '<span class="ab-ch-meta">' + esc(metaParts) + '</span>'
        + '<div class="ab-chapter-acts">'
        + '<button type="button" class="btn emerald sm" data-ch-play-pos="' + pos + '">' + SVG.play + '<span>' + (isLicensed ? 'معاينة' : (isDone ? 'أوفلاين' : 'تشغيل')) + '</span></button>'
        + (isLicensed ? '' : (isDone
          ? '<button type="button" class="icon-btn sm" data-ch-del="' + origIdx + '" title="حذف من الجهاز" aria-label="حذف">' + SVG.trash + '</button>'
          : (isActive
            ? '<span class="ab-tag accent">' + pct + '%</span>'
            : '<button type="button" class="btn glass sm" data-ch-dl="' + origIdx + '">' + SVG.download + '<span>تحميل</span></button>')))
        + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function updateAbChapterSelectionDom(ab, tracks, listEl) {
    const plan = ensureAbChapterPlan(ab, tracks);
    const n = tracks.length;
    const selCount = plan.selectedSet.size;
    if (listEl) {
      listEl.querySelectorAll('.ab-chapter-row[data-ch-orig]').forEach(row => {
        const oid = Number(row.dataset.chOrig);
        const on = plan.selectedSet.has(oid);
        row.classList.toggle('unselected', !on);
        const cb = row.querySelector('.ab-ch-chk');
        if (cb && cb.checked !== on) cb.checked = on;
      });
    }
    const sumEl = $('abChSelSummary');
    if (sumEl) sumEl.textContent = 'المحدد: ' + selCount + ' من ' + n;
    const playSel = $('abChPlaySelectedBtn');
    if (playSel) {
      playSel.disabled = selCount === 0;
      const sp = playSel.querySelector('span');
      if (sp) sp.textContent = 'تشغيل المحددة (' + selCount + ')';
    }
    const dlSel = $('abChDlSelectedBtn');
    if (dlSel) {
      dlSel.disabled = selCount === 0;
      const sp = dlSel.querySelector('span');
      if (sp) sp.textContent = 'تحميل المحددة (' + selCount + ')';
    }
    document.querySelectorAll('#abChTools [data-ch-preset]').forEach(b => {
      b.classList.toggle('active', Number(b.dataset.chPreset) === selCount && plan.startPos === 1);
    });
  }

  function wireAbChapterTools(ab, tracks, listEl) {
    const toolsEl = $('abModalChapterTools');
    if (!toolsEl) return;
    toolsEl.innerHTML = renderAbChapterToolsHtml(ab, tracks);
    const tools = $('abChTools');
    if (!tools) return;
    tools.querySelectorAll('[data-ch-sort]').forEach(btn => {
      btn.onclick = () => {
        applyAbChapterSort(ab, tracks, btn.dataset.chSort);
        refreshAudiobookModalChapters();
      };
    });
    tools.querySelectorAll('[data-ch-preset]').forEach(btn => {
      btn.onclick = () => {
        const plan = ensureAbChapterPlan(ab, tracks);
        applyAbChapterSlice(plan, 1, Number(btn.dataset.chPreset));
        refreshAudiobookModalChapters();
      };
    });
    const fromIn = $('abChFromInput');
    const cntIn = $('abChCountInput');
    const applyLiveInputs = () => {
      const plan = ensureAbChapterPlan(ab, tracks);
      const sVal = fromIn ? Number(fromIn.value) : plan.startPos;
      const cVal = cntIn ? Number(cntIn.value) : plan.pickCount;
      if (!Number.isFinite(sVal) || !Number.isFinite(cVal)) return;
      applyAbChapterSlice(plan, Math.max(1, Math.min(tracks.length, Math.trunc(sVal))), Math.max(0, Math.min(tracks.length, Math.trunc(cVal))));
      updateAbChapterSelectionDom(ab, tracks, listEl);
    };
    if (fromIn) {
      fromIn.oninput = applyLiveInputs;
      fromIn.onblur = () => refreshAudiobookModalChapters();
    }
    if (cntIn) {
      cntIn.oninput = applyLiveInputs;
      cntIn.onblur = () => refreshAudiobookModalChapters();
    }
    const playSelBtn = $('abChPlaySelectedBtn');
    if (playSelBtn) {
      playSelBtn.onclick = () => {
        const chosen = getAbOrderedTracks(ab, tracks, true);
        if (chosen.length) playAudioBook(ab, 0, 'online', chosen);
      };
    }
    const dlSelBtn = $('abChDlSelectedBtn');
    if (dlSelBtn) {
      dlSelBtn.onclick = () => {
        const chosen = getAbOrderedTracks(ab, tracks, true);
        if (chosen.length) downloadAllAudioChapters(ab, chosen);
      };
    }
  }

  function refreshAudiobookModalChapters() {
    const modal = $('audiobookModal');
    if (!modal || modal.classList.contains('hidden')) return;
    const ab = state.abModalBookId && AB_REG.get(state.abModalBookId);
    const listEl = $('abModalChapters');
    if (!ab || !listEl) return;
    const tracks = state.abTracksCache[ab.id];
    if (!Array.isArray(tracks)) return;
    wireAbChapterTools(ab, tracks, listEl);
    listEl.innerHTML = renderAudiobookModalChaptersHtml(ab, tracks);
    wireAudiobookModalChapterClicks(ab, tracks, listEl);
  }

  function wireAudiobookModalChapterClicks(ab, tracks, listEl) {
    const isLicensed = ab.licenseType === 'licensed_store';
    const ordered = isLicensed ? tracks : getAbOrderedTracks(ab, tracks, false);
    listEl.querySelectorAll('[data-ch-chk]').forEach(cb => {
      cb.onchange = () => {
        const plan = ensureAbChapterPlan(ab, tracks);
        const oid = Number(cb.dataset.chChk);
        if (cb.checked) plan.selectedSet.add(oid);
        else plan.selectedSet.delete(oid);
        plan.pickCount = plan.selectedSet.size;
        const cntIn = $('abChCountInput');
        if (cntIn) cntIn.value = String(plan.selectedSet.size);
        updateAbChapterSelectionDom(ab, tracks, listEl);
      };
    });
    listEl.querySelectorAll('[data-ch-up]').forEach(btn => {
      btn.onclick = () => {
        moveAbChapterOrder(ab, tracks, Number(btn.dataset.chUp), -1);
        refreshAudiobookModalChapters();
      };
    });
    listEl.querySelectorAll('[data-ch-dn]').forEach(btn => {
      btn.onclick = () => {
        moveAbChapterOrder(ab, tracks, Number(btn.dataset.chDn), 1);
        refreshAudiobookModalChapters();
      };
    });
    listEl.querySelectorAll('[data-ch-play-pos]').forEach(btn => {
      btn.onclick = () => {
        const pos = Number(btn.dataset.chPlayPos);
        if (isLicensed || ordered.length <= 1) {
          playAudioBook(ab, pos, 'auto');
          return;
        }
        const clicked = ordered[pos];
        const plan = ensureAbChapterPlan(ab, tracks);
        const clickedOid = getChapterOrigIdx(clicked, pos);
        if (plan.selectedSet.size > 0 && plan.selectedSet.size < ordered.length && plan.selectedSet.has(clickedOid)) {
          const subset = getAbOrderedTracks(ab, tracks, true);
          const subIdx = subset.indexOf(clicked);
          playAudioBook(ab, Math.max(0, subIdx), 'auto', subset);
        } else {
          playAudioBook(ab, pos, 'auto', ordered);
        }
      };
    });
    listEl.querySelectorAll('[data-ch-dl]').forEach(btn => {
      btn.onclick = () => {
        const origIdx = Number(btn.dataset.chDl);
        const tr = tracks.find((t, k) => getChapterOrigIdx(t, k) === origIdx);
        if (tr) downloadAudioTrack(ab, tr, origIdx);
      };
    });
    listEl.querySelectorAll('[data-ch-del]').forEach(btn => {
      btn.onclick = () => {
        const origIdx = Number(btn.dataset.chDel);
        const tr = tracks.find((t, k) => getChapterOrigIdx(t, k) === origIdx);
        const j = findAudioJobForTrack(ab, tr, origIdx);
        if (j) {
          deleteOfflineAudioItem({
            sourceKind: 'download',
            uri: j.localUri || j.uri || '',
            downloadId: j.id,
          });
        }
      };
    });
  }

  async function openAudiobookModal(ab) {
    if (!ab) return;
    registerAudiobook(ab);
    state.abModalBookId = ab.id;
    const modal = $('audiobookModal');
    const body = $('abModalBody');
    const topTitle = $('abModalTopTitle');
    if (!modal || !body) return;
    if (topTitle) topTitle.textContent = ab.title || 'تفاصيل الكتاب المسموع';

    const isAr = ab.lang === 'ar' || /[\u0600-\u06FF]/.test(ab.title || '');
    const [c1, c2] = coverColors(ab.title, 'literature', isAr);
    const covHtml = '<div class="bcover-fallback' + (isAr ? ' ar-cover' : '') + '" style="--c1:' + c1 + ';--c2:' + c2 + ';position:absolute;inset:0;padding:8px">'
      + coverInnerHtml({ title: ab.title, author: ab.author, lang: ab.lang }) + '</div>'
      + (ab.cover ? '<img src="' + esc(ab.cover) + '" alt="" style="position:relative;z-index:1" onerror="this.remove()">' : '');

    const isLicensed = ab.licenseType === 'licensed_store';
    const modeBtnsHtml = isLicensed
      ? ('<div class="ab-mode-acts">'
        + (ab.previewUrl ? '<button type="button" id="abModalStreamBtn" class="btn emerald sm">' + SVG.play + '<span>استماع للعينة الرسمية</span></button>' : '')
        + '<button type="button" id="abModalExtBtn" class="btn glass sm"><span>فتح في المصدر الرسمي</span></button>'
        + '</div>')
      : ('<div class="ab-mode-acts">'
        + '<button type="button" id="abModalStreamBtn" class="btn emerald sm">' + SVG.play + '<span>استماع عبر الإنترنت الآن</span></button>'
        + '<button type="button" id="abModalDlAllBtn" class="btn glass sm">' + SVG.download + '<span>تحميل للاستماع بدون نت</span></button>'
        + '</div>');

    body.innerHTML =
      '<div class="ab-modal-hero">'
      + '<div class="ab-modal-cov' + (isWideAudioCover(ab) ? ' wide' : '') + '" style="position:relative">' + covHtml + '</div>'
      + '<div class="ab-modal-meta">'
      + '<h3>' + esc(ab.title) + '</h3>'
      + '<div class="ab-card-author">' + esc((ab.author || '') + (ab.source ? ' • ' + ab.source : '')) + '</div>'
      + (ab.summary ? '<p>' + esc(ab.summary) + '</p>' : '')
      + '</div>'
      + '</div>'
      + modeBtnsHtml
      + '<div class="sec-head" style="margin-bottom:8px"><div class="sec-title">' + (isLicensed ? 'معاينة رسمية متوفرة' : 'فصول ومقاطع الكتاب الصوتي') + '</div></div>'
      + '<div id="abModalChapterTools"></div>'
      + '<div id="abModalChapters" class="ab-chapters-list"><div class="empty-msg">جاري تحميل قائمة الفصول الصوتية...</div></div>'
      + (isLicensed
        ? '<div id="abModalFreeAltWrap" style="margin-top:14px">'
          + '<div class="sec-head" style="margin-bottom:8px"><div class="sec-title">بدائل صوتية مجانية مفتوحة (LibriVox / Archive / بودكاست)</div></div>'
          + '<div id="abModalFreeAltList" class="ab-chapters-list"><div class="empty-msg">جاري البحث في المصادر المجانية المفتوحة عن نفس الكتاب...</div></div>'
          + '</div>'
        : '');

    modal.classList.remove('hidden');
    if ($('abModalStreamBtn')) {
      $('abModalStreamBtn').onclick = () => {
        const cached = state.abTracksCache[ab.id];
        if (Array.isArray(cached) && cached.length > 1 && !isLicensed) {
          const orderedSel = getAbOrderedTracks(ab, cached, true);
          playAudioBook(ab, 0, 'online', orderedSel);
        } else {
          playAudioBook(ab, undefined, 'online');
        }
      };
    }
    if ($('abModalDlAllBtn')) {
      $('abModalDlAllBtn').onclick = () => {
        const cached = state.abTracksCache[ab.id];
        if (Array.isArray(cached) && cached.length > 1) {
          const orderedSel = getAbOrderedTracks(ab, cached, true);
          downloadAllAudioChapters(ab, orderedSel);
        } else {
          downloadAllAudioChapters(ab);
        }
      };
    }
    if ($('abModalExtBtn')) $('abModalExtBtn').onclick = () => ab.externalUrl && KTB.openUrl && KTB.openUrl(ab.externalUrl);

    const tracksPromise = resolveTracksForBook(ab);
    const freeAltPromise = (isLicensed && S && typeof S.findFreeOpenAudiobookAlternatives === 'function')
      ? S.findFreeOpenAudiobookAlternatives(ab.title, ab.author, { lang: ab.lang }).catch(() => [])
      : Promise.resolve(null);

    const tracks = await tracksPromise;
    if (state.abModalBookId === ab.id) {
      const chHost = $('abModalChapters');
      if (chHost) {
        wireAbChapterTools(ab, tracks, chHost);
        chHost.innerHTML = renderAudiobookModalChaptersHtml(ab, tracks);
        wireAudiobookModalChapterClicks(ab, tracks, chHost);
      }
    }

    if (isLicensed) {
      const alts = await freeAltPromise;
      if (state.abModalBookId !== ab.id) return;
      const altHost = $('abModalFreeAltList');
      if (!altHost) return;
      if (!Array.isArray(alts) || !alts.length) {
        altHost.innerHTML = '<div class="empty-msg">لا توجد نسخة صوتية مجانية مفتوحة مسجلة لهذا العنوان — يمكنك سماع العينة الرسمية أو الاستماع عبر اشتراكك في المنصة الرسمية.</div>';
      } else {
        alts.forEach(registerAudiobook);
        altHost.innerHTML = alts.map((alt, i) => {
          const meta = [alt.source || 'مصدر مجاني مفتوح', alt.tracksHint || ''].filter(Boolean).join(' • ');
          return '<div class="ab-chapter-row">'
            + '<div class="ab-chapter-main">'
            + '<strong>' + esc(alt.title) + '</strong>'
            + '<span>' + esc(meta) + '</span>'
            + '</div>'
            + '<div class="ab-chapter-acts">'
            + '<button type="button" class="btn emerald sm" data-alt-play="' + i + '">' + SVG.play + '<span>استماع مجاني</span></button>'
            + '<button type="button" class="btn glass sm" data-alt-open="' + i + '">الفصول</button>'
            + '</div>'
            + '</div>';
        }).join('');
        altHost.querySelectorAll('[data-alt-play]').forEach(btn => {
          btn.onclick = () => {
            const alt = alts[Number(btn.dataset.altPlay)];
            if (alt) playAudioBook(alt, 0, 'online');
          };
        });
        altHost.querySelectorAll('[data-alt-open]').forEach(btn => {
          btn.onclick = () => {
            const alt = alts[Number(btn.dataset.altOpen)];
            if (alt) openAudiobookModal(alt);
          };
        });
      }
    }
  }

  function refreshAudiobookLiveUi() {
    if (state.tab === 'audiobooks') renderAudiobooks();
    refreshAudiobookModalChapters();
  }

  async function runAudiobookSearch(rawQ) {
    const q = String(rawQ || '').trim();
    state.abQuery = q;
    if ($('abSearchClear')) $('abSearchClear').classList.toggle('hidden', !q);
    if (!q) {
      state.abSearchResults = [];
      state.abSearching = false;
      renderAudiobooks();
      return;
    }
    state.abSearching = true;
    renderAudiobooks();
    try {
      const langOpt = state.abLang === 'all' ? '' : state.abLang;
      const res = (S && typeof S.searchAudiobooks === 'function')
        ? await S.searchAudiobooks(q, { lang: langOpt })
        : [];
      state.abSearchResults = Array.isArray(res) ? res : [];
    } catch (_) {
      state.abSearchResults = [];
    } finally {
      state.abSearching = false;
      renderAudiobooks();
    }
  }

  function wireAudiobooksUi() {
    if ($('btnPickLocalAudio')) {
      $('btnPickLocalAudio').onclick = () => {
        if (KTB.pickAudioFile) KTB.pickAudioFile();
      };
    }
    const closeAbModal = () => {
      state.abModalBookId = '';
      if ($('audiobookModal')) $('audiobookModal').classList.add('hidden');
    };
    if ($('abModalClose')) $('abModalClose').onclick = closeAbModal;
    if ($('abModalBackdrop')) $('abModalBackdrop').onclick = closeAbModal;

    document.querySelectorAll('#abModeSeg button').forEach(btn => {
      btn.onclick = () => {
        state.abMode = btn.dataset.abmode || 'all';
        renderAudiobooks();
      };
    });
    document.querySelectorAll('#abCatPills button').forEach(btn => {
      btn.onclick = () => {
        state.abCat = btn.dataset.abcat || 'all';
        renderAudiobooks();
      };
    });
    if ($('abSearchForm')) {
      $('abSearchForm').onsubmit = (e) => {
        e.preventDefault();
        runAudiobookSearch($('abSearchInput') ? $('abSearchInput').value : '');
      };
    }
    if ($('abSearchInput')) {
      $('abSearchInput').oninput = () => {
        const val = $('abSearchInput').value.trim();
        if ($('abSearchClear')) $('abSearchClear').classList.toggle('hidden', !val);
        if (!val && state.abQuery) runAudiobookSearch('');
      };
    }
    if ($('abSearchClear')) {
      $('abSearchClear').onclick = () => {
        if ($('abSearchInput')) $('abSearchInput').value = '';
        runAudiobookSearch('');
      };
    }

    if ($('abPlayToggle')) $('abPlayToggle').onclick = () => KTB.audioCommand && KTB.audioCommand('toggle', '');
    if ($('abMiniPlayBtn')) $('abMiniPlayBtn').onclick = () => KTB.audioCommand && KTB.audioCommand('toggle', '');
    if ($('abMiniOpen')) $('abMiniOpen').onclick = () => switchTab('audiobooks');
    if ($('abMiniClose')) {
      $('abMiniClose').onclick = (e) => {
        if (e && e.stopPropagation) e.stopPropagation();
        _abBarDismissed = true;
        if ($('abPlayerCard')) $('abPlayerCard').classList.add('hidden');
        if ($('abMiniBar')) $('abMiniBar').classList.add('hidden');
        if (KTB.audioCommand) KTB.audioCommand('stop', '');
      };
    }
    if ($('abRew15')) $('abRew15').onclick = () => KTB.audioCommand && KTB.audioCommand('delta', '-15000');
    if ($('abFwd15')) $('abFwd15').onclick = () => KTB.audioCommand && KTB.audioCommand('delta', '15000');
    if ($('abMiniRew15')) $('abMiniRew15').onclick = () => KTB.audioCommand && KTB.audioCommand('delta', '-15000');
    if ($('abMiniFwd15')) $('abMiniFwd15').onclick = () => KTB.audioCommand && KTB.audioCommand('delta', '15000');
    if ($('abPrevCh')) $('abPrevCh').onclick = () => KTB.audioCommand && KTB.audioCommand('prev', '');
    if ($('abNextCh')) $('abNextCh').onclick = () => KTB.audioCommand && KTB.audioCommand('next', '');
    if ($('abSpeedBtn')) {
      $('abSpeedBtn').onclick = () => {
        const cur = (state.abAudioState && Number(state.abAudioState.speed)) || 1.0;
        const idx = AB_SPEEDS.findIndex(x => Math.abs(x - cur) < 0.05);
        const next = AB_SPEEDS[(idx + 1) % AB_SPEEDS.length];
        if (KTB.audioCommand) KTB.audioCommand('speed', String(next));
      };
    }
    if ($('abSleepBtn')) {
      $('abSleepBtn').onclick = () => {
        const st = state.abAudioState || {};
        let curStep = 0;
        if (st.sleepMode === 'chapter') curStep = -1;
        else if (Number(st.sleepRemainingSec || 0) > 0) {
          const curMin = Math.ceil(Number(st.sleepRemainingSec) / 60);
          curStep = AB_SLEEP_STEPS.find(m => m > 0 && Math.abs(m - curMin) <= 15) || 15;
        }
        const idx = AB_SLEEP_STEPS.indexOf(curStep);
        const next = AB_SLEEP_STEPS[(idx + 1) % AB_SLEEP_STEPS.length];
        if (KTB.audioCommand) KTB.audioCommand('sleep', String(next));
        if (next === -1) KTB.toast('سيتم إيقاف التشغيل عند نهاية الفصل الحالي');
        else if (next > 0) KTB.toast('مؤقت النوم: إيقاف تلقائي بعد ' + next + ' دقيقة');
        else KTB.toast('تم إيقاف مؤقت النوم');
      };
    }
    const wireAudioSeekSlider = (seek) => {
      if (!seek) return;
      const startSeek = () => { _abSeeking = true; };
      const previewSeek = () => {
        _abSeeking = true;
        const durMs = (state.abAudioState && Number(state.abAudioState.durationMs)) || 0;
        if (durMs > 0) {
          const txt = formatAudioMs((Number(seek.value) / 1000) * durMs);
          if ($('abCurTime')) $('abCurTime').textContent = txt;
          if ($('abMiniCurTime')) $('abMiniCurTime').textContent = txt;
        }
        const other = seek.id === 'abMiniSeekRange' ? $('abSeekRange') : $('abMiniSeekRange');
        if (other && other.value !== seek.value) other.value = seek.value;
      };
      const commitSeek = () => {
        _abSeeking = false;
        const durMs = (state.abAudioState && Number(state.abAudioState.durationMs)) || 0;
        if (durMs > 0 && KTB.audioCommand) {
          const targetMs = Math.round((Number(seek.value) / 1000) * durMs);
          KTB.audioCommand('seek', String(targetMs));
        }
      };
      seek.addEventListener('pointerdown', startSeek);
      seek.addEventListener('touchstart', startSeek, { passive: true });
      seek.addEventListener('input', previewSeek);
      seek.addEventListener('change', commitSeek);
      seek.addEventListener('pointerup', () => { _abSeeking = false; });
      seek.addEventListener('touchend', () => { _abSeeking = false; });
    };
    wireAudioSeekSlider($('abSeekRange'));
    wireAudioSeekSlider($('abMiniSeekRange'));
  }

  // ------------------------------------------------------------------ Wire Events & Boot
  function wireUi() {
    applyTheme(state.theme, false);
    applyVisualPrefs();
    applySidebar();
    wireAudiobooksUi();
    if (S && typeof S.prewarmAudiobooksEngine === 'function') {
      setTimeout(() => S.prewarmAudiobooksEngine(), 500);
    }

    if ($('btnToggleSidebar')) $('btnToggleSidebar').onclick = toggleSidebar;
    if ($('btnCollapseRail')) $('btnCollapseRail').onclick = toggleSidebar;
    if ($('btnOpenLocalTop')) $('btnOpenLocalTop').onclick = () => KTB.pickLocalBook();
    $('btnPickLocal').onclick = () => KTB.pickLocalBook();

    document.querySelectorAll('.nav-btn').forEach(b => { b.onclick = () => switchTab(b.dataset.tab); });
    document.querySelectorAll('[data-jump]').forEach(b => { b.onclick = () => switchTab(b.dataset.jump); });

    if ($('btnTheme')) $('btnTheme').onclick = (e) => cycleTheme(e);
    if ($('btnMobileTheme')) $('btnMobileTheme').onclick = (e) => cycleTheme(e);
    if ($('btnSettings')) $('btnSettings').onclick = openSettings;
    if ($('btnMobileSettings')) $('btnMobileSettings').onclick = openSettings;
    if ($('btnMirrors')) {
      $('btnMirrors').onclick = async () => {
        if ($('mirrorTxt')) $('mirrorTxt').textContent = 'فحص...';
        await S.refreshMirrors();
        if ($('mirrorTxt')) $('mirrorTxt').textContent = 'متصل';
        KTB.toast('كل المكتبات والمرايا محدثة');
      };
    }

    const revealTopBar = () => {
      const tb = document.querySelector('.top-bar');
      if (tb) tb.classList.remove('top-bar-hidden');
    };
    $('searchForm').onsubmit = (e) => { e.preventDefault(); revealTopBar(); hideRecentBar(); runSearch(); };
    $('q').onfocus = () => { revealTopBar(); showRecentBar(); };
    $('q').onclick = () => { revealTopBar(); showRecentBar(); };
    $('q').onkeydown = (e) => { if (e.key === 'Escape') hideRecentBar(); };
    $('q').oninput = () => { revealTopBar(); $('qClear').classList.toggle('hidden', !$('q').value); };
    document.addEventListener('pointerdown', (e) => {
      const bar = $('recentSearches');
      if (!bar || bar.classList.contains('hidden')) return;
      if (e.target && (e.target.closest('.omni-wrap') || e.target.closest('#recentSearches'))) return;
      hideRecentBar();
    });
    window.addEventListener('kotob:localCover', (e) => {
      const d = (e && e.detail) || {};
      const url = d.dataUrl || '';
      if (!url) return;
      if (d.key) {
        LOCAL_PDF_COVERS[d.key] = url;
        COVER_CACHE[d.key] = url;
      }
      if (d.uri) LOCAL_PDF_COVERS[d.uri] = url;
      saveCoverCache();
      saveLocalPdfCovCache();
      if (d.key) applyCoverToLibGroupDom(d.key, url);
      document.querySelectorAll('[data-cover-book-id]').forEach(el => {
        if (d.key && el.dataset.coverBookId === d.key && !el.querySelector('img')) {
          const img = document.createElement('img');
          img.alt = '';
          img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .2s';
          img.onload = function () { window.__midadImgLoad(this); };
          img.onerror = function () { this.remove(); };
          img.src = url;
          el.appendChild(img);
        }
      });
    });
    $('qClear').onclick = () => {
      $('q').value = '';
      $('qClear').classList.add('hidden');
      state.searchQuery = '';
      state.searchResults = [];
      $('searchGrid').innerHTML = '';
      $('searchStatusBar').classList.add('hidden');
      $('searchEmpty').classList.remove('hidden');
    };

    $('sourceScope').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        $('sourceScope').querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.searchScope = b.dataset.scope;
        if (state.searchQuery) runSearch(state.searchQuery);
      };
    });
    $('langFilter').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        const nextLang = b.dataset.lang || '';
        const prevLang = state.searchLang || '';
        $('langFilter').querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.searchLang = nextLang;
        if (state.searchQuery && nextLang !== prevLang) {
          const isComicQNow = state.searchScope === 'comics'
            || (S && typeof S.isComicQuery === 'function' && S.isComicQuery(state.searchQuery));
          const qIsArNow = /[\u0600-\u06FF]/.test(state.searchQuery);
          const needsCrossLangFetch = isComicQNow
            || (nextLang === 'ar' && !qIsArNow)
            || (nextLang === 'en' && qIsArNow)
            || (nextLang === '' && prevLang !== '');
          if (needsCrossLangFetch) {
            runSearch(state.searchQuery);
            return;
          }
        }
        refilterSearchGrid();
      };
    });
    $('fmtFilter').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        $('fmtFilter').querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.searchFmt = b.dataset.fmt;
        refilterSearchGrid();
      };
    });

    $('btnSearchCf').onclick = () => runSearch(state.searchQuery, true);
    if ($('btnResetHomeCat')) {
      $('btnResetHomeCat').onclick = () => {
        state.homeCat = 'all';
        renderHomePills();
        renderHomeGrid();
      };
    }
    $('btnRefreshHome').onclick = () => {
      state.tasteRotation = (state.tasteRotation || 0) + 1;
      if (state.homeCat !== 'all') {
        renderHomeGrid();
        fetchCategoryLiveBooks(state.homeCat, true);
      } else {
        state.liveCache.homeGrid = [];
        refreshRecommendationShelves({ recordImpressions: true, forceImpressions: true });
        hydrateHomeLive();
      }
      KTB.toast('تم تجديد الترشيحات الذكية حسب ذوقك');
    };
    if ($('btnTasteProfileModal')) {
      $('btnTasteProfileModal').onclick = openTasteProfileModal;
    }
    if ($('tasteProfileClose')) {
      $('tasteProfileClose').onclick = () => $('tasteProfileModal').classList.add('hidden');
    }
    if ($('tasteProfileBackdrop')) {
      $('tasteProfileBackdrop').onclick = () => $('tasteProfileModal').classList.add('hidden');
    }
    if ($('btnOpenColdStart')) {
      $('btnOpenColdStart').onclick = () => {
        if ($('tasteProfileModal')) $('tasteProfileModal').classList.add('hidden');
        openColdStartWizard();
      };
    }
    $('btnLoadMoreCat').onclick = loadMoreCategory;
    $('btnClearTaste').onclick = () => {
      state.taste = { cats: {}, tags: {}, authors: {} };
      saveJson('wq_taste', state.taste);
      if (REC && REC.resetAll) REC.resetAll();
      else {
        localStorage.removeItem('wq_signal_log');
        localStorage.removeItem('wq_ratings');
        localStorage.removeItem('wq_impressions');
        localStorage.removeItem('wq_dismissed_books');
        localStorage.removeItem('wq_rec_rel_v1');
      }
      state._lastHomeAlloc = null;
      refreshRecommendationShelves();
      renderDiscover();
      renderTasteProfileContent();
      KTB.toast('تم إعادة ضبط خريطة اهتماماتك وإشارات الذوق');
    };

    $('savedSeg').querySelectorAll('button').forEach(b => {
      b.onclick = () => {
        $('savedSeg').querySelectorAll('button').forEach(x => x.classList.remove('on'));
        b.classList.add('on');
        state.savedSub = b.dataset.saved;
        renderSaved();
      };
    });

    $('btnLibMore').onclick = (e) => {
      e.stopPropagation();
      $('libMoreMenu').classList.toggle('hidden');
    };
    document.addEventListener('click', (e) => {
      const m = $('libMoreMenu');
      if (m && !m.classList.contains('hidden') && !e.target.closest('.lib-more-wrap')) {
        m.classList.add('hidden');
      }
    });

    if ($('btnScanDevice')) {
      $('btnScanDevice').onclick = () => {
        if (KTB.isAndroid() && KTB.scanDeviceBooks) {
          KTB.scanDeviceBooks();
          KTB.toast('جاري فحص جميع مجلدات الكتب على الجهاز...');
        } else {
          renderDownloads();
          KTB.toast('تم تحديث قائمة الكتب');
        }
      };
    }
    if ($('btnGrantStorage')) $('btnGrantStorage').onclick = () => KTB.requestStorageAccess && KTB.requestStorageAccess();
    if ($('btnPickFolderBanner')) $('btnPickFolderBanner').onclick = () => KTB.pickBookFolder && KTB.pickBookFolder();
    if ($('btnAddFolderMenu')) {
      $('btnAddFolderMenu').onclick = () => {
        $('libMoreMenu').classList.add('hidden');
        if (KTB.pickBookFolder) KTB.pickBookFolder();
      };
    }

    if ($('libSearchInput')) {
      $('libSearchInput').addEventListener('input', (e) => {
        state.libQuery = e.target.value || '';
        renderDownloads();
      });
    }
    if ($('libSortSelect')) {
      $('libSortSelect').value = state.libSort || 'smart';
      $('libSortSelect').addEventListener('change', (e) => {
        state.libSort = e.target.value || 'smart';
        localStorage.setItem('wq_lib_sort', state.libSort);
        renderDownloads();
      });
    }
    if ($('libViewSeg')) {
      $('libViewSeg').querySelectorAll('[data-lview]').forEach(btn => {
        btn.onclick = () => {
          state.libViewMode = btn.dataset.lview === 'compact' ? 'compact' : 'detailed';
          localStorage.setItem('wq_lib_view', state.libViewMode);
          renderDownloads();
        };
      });
    }
    if ($('btnNewLibFolder')) {
      $('btnNewLibFolder').onclick = () => {
        if (typeof window.__midadOpenLibFolderModal === 'function') window.__midadOpenLibFolderModal(null, []);
      };
    }
    if ($('btnLibBackRoot')) {
      $('btnLibBackRoot').onclick = () => {
        state.libOpenFolderId = '';
        renderDownloads();
      };
    }
    if ($('btnLibEditFolder')) {
      $('btnLibEditFolder').onclick = () => {
        if (state.libOpenFolderId && typeof window.__midadOpenLibFolderModal === 'function') {
          window.__midadOpenLibFolderModal(state.libOpenFolderId);
        }
      };
    }
    if ($('btnLibUngroupFolder')) {
      $('btnLibUngroupFolder').onclick = () => {
        if (!state.libOpenFolderId) return;
        state.libFolders = (state.libFolders || []).filter(f => f.id !== state.libOpenFolderId);
        state.libOpenFolderId = '';
        saveJson('wq_lib_folders', state.libFolders);
        renderDownloads();
        KTB.toast('تم فك المجلد وإعادة الكتب للرئيسية');
      };
    }
    const closeFolderModal = () => { if ($('libFolderModal')) $('libFolderModal').classList.add('hidden'); };
    if ($('libFolderClose')) $('libFolderClose').onclick = closeFolderModal;
    if ($('libFolderCancel')) $('libFolderCancel').onclick = closeFolderModal;
    if ($('libFolderBackdrop')) $('libFolderBackdrop').onclick = closeFolderModal;
    const closeBookActModal = () => { if ($('libBookActionsModal')) $('libBookActionsModal').classList.add('hidden'); };
    if ($('libBookActClose')) $('libBookActClose').onclick = closeBookActModal;
    if ($('libBookActBackdrop')) $('libBookActBackdrop').onclick = closeBookActModal;
    if ($('btnUnhideBooks')) {
      $('btnUnhideBooks').onclick = () => {
        $('libMoreMenu').classList.add('hidden');
        state.hiddenWebUris.clear();
        saveJson('wq_hidden_web', []);
        if (KTB.restoreHiddenBooks) KTB.restoreHiddenBooks();
        renderDownloads();
        KTB.toast('تم إظهار الكتب المخفية من البرنامج');
      };
    }
    if ($('btnDedupAll')) {
      $('btnDedupAll').onclick = () => {
        $('libMoreMenu').classList.add('hidden');
        const groups = buildGroupedLibrary().filter(g => g.versions.length > 1);
        if (!groups.length) {
          KTB.toast('لا توجد نسخ مكررة في مكتبتك حالياً');
          return;
        }
        const extraCount = groups.reduce((acc, g) => acc + (g.versions.length - 1), 0);
        showConfirmDialog(
          'حذف جميع النسخ المكررة في المكتبة',
          'سيتم الإبقاء على النسخة التي تقرأ فيها أو الأفضل جودة لكل كتاب وحذف ' + extraCount + ' نسخة مكررة عبر ' + groups.length + ' كتب.',
          'تأكيد حذف المكررات',
          () => deleteAllDuplicateCopiesInLibrary()
        );
      };
    }

    if ($('closeScribdReader')) $('closeScribdReader').onclick = closeScribdReaderModal;
    if ($('scribdReaderBackdrop')) $('scribdReaderBackdrop').onclick = closeScribdReaderModal;
    if ($('sreaderZoomOut')) $('sreaderZoomOut').onclick = () => applyScribdZoom((state.scribdZoom || 100) - 15);
    if ($('sreaderZoomReset')) $('sreaderZoomReset').onclick = () => applyScribdZoom(100);
    if ($('sreaderZoomIn')) $('sreaderZoomIn').onclick = () => applyScribdZoom((state.scribdZoom || 100) + 15);
    if ($('sreaderBookmarkBtn')) {
      $('sreaderBookmarkBtn').onclick = () => {
        const bk = state.activeScribdBook;
        if (!bk || typeof toggleBookmark !== 'function') return;
        toggleBookmark(bk);
        const bm = typeof isBookmarked === 'function' && isBookmarked(bk.id);
        $('sreaderBookmarkBtn').classList.toggle('active', !!bm);
        $('sreaderBookmarkBtn').setAttribute('aria-pressed', bm ? 'true' : 'false');
      };
    }
    document.querySelectorAll('[data-sreader-theme]').forEach(btn => {
      btn.onclick = () => {
        const th = btn.dataset.sreaderTheme || 'sepia';
        document.querySelectorAll('[data-sreader-theme]').forEach(b => b.classList.toggle('active', b === btn));
        const body = $('scribdReaderBody');
        if (body) {
          body.classList.remove('theme-dark', 'theme-sepia', 'theme-sage', 'theme-light');
          body.classList.add('theme-' + th);
        }
      };
    });
    if ($('scribdReaderNativeBtn')) {
      $('scribdReaderNativeBtn').onclick = () => {
        if (!state.activeScribdBook) return;
        const bk = state.activeScribdBook;
        const docId = state.activeScribdDocId;
        const localCopy = findDownloadedMatches(bk).find(v => !v.isCloudOnly);
        if (localCopy) {
          closeScribdReaderModal();
          openBookCopyInReader(localCopy.uri, localCopy.fileName, bk.title, bk);
          return;
        }
        if (KTB.isAndroid() && docId) {
          const uri = 'scribd://' + docId;
          recordReadingActivity(uri, bk.title, 'قيد القراءة • Scribd');
          KTB.openInternalReader(uri, (bk.title || 'Scribd') + '.pdf', bk.title || '');
          return;
        }
        KTB.toast('الكتاب محفوظ في مكتبتك وتستطيع قراءته هنا مباشرة');
      };
    }

    const closeDelModal = () => { if ($('bookDeleteModal')) $('bookDeleteModal').classList.add('hidden'); _delTarget = null; };
    if ($('delBookClose')) $('delBookClose').onclick = closeDelModal;
    if ($('delBookCancel')) $('delBookCancel').onclick = closeDelModal;
    if ($('delBookBackdrop')) $('delBookBackdrop').onclick = closeDelModal;
    if ($('btnDelFromApp')) {
      $('btnDelFromApp').onclick = () => {
        const tgt = _delTarget;
        closeDelModal();
        performDeleteBook(tgt, false);
      };
    }
    if ($('btnDelFromDevice')) {
      $('btnDelFromDevice').onclick = () => {
        const tgt = _delTarget;
        closeDelModal();
        performDeleteBook(tgt, true);
      };
    }

    const closePickCopy = () => { if ($('pickCopyModal')) $('pickCopyModal').classList.add('hidden'); };
    if ($('pickCopyClose')) $('pickCopyClose').onclick = closePickCopy;
    if ($('pickCopyBackdrop')) $('pickCopyBackdrop').onclick = closePickCopy;

    const closeConfirm = () => { if ($('confirmModal')) $('confirmModal').classList.add('hidden'); _confirmAction = null; };
    if ($('confirmClose')) $('confirmClose').onclick = closeConfirm;
    if ($('confirmCancel')) $('confirmCancel').onclick = closeConfirm;
    if ($('confirmBackdrop')) $('confirmBackdrop').onclick = closeConfirm;
    if ($('confirmOk')) {
      $('confirmOk').onclick = () => {
        const fn = _confirmAction;
        closeConfirm();
        if (typeof fn === 'function') fn();
      };
    }

    $('btnClearDone').onclick = () => {
      $('libMoreMenu').classList.add('hidden');
      const doneList = state.downloads.filter(d => d.status === 'done' || d.status === 'error' || d.status === 'canceled' || d.status === 'cancelled');
      if (!doneList.length) {
        KTB.toast('لا توجد تحميلات مكتملة لتنظيفها');
        return;
      }
      showConfirmDialog(
        'تنظيف سجل التحميلات المكتملة',
        'سيتم إزالة سجل التحميلات المكتملة والملغاة (' + doneList.length + ') من القائمة فقط، ولن يتم حذف ملفات الكتب من جهازك.',
        'تأكيد التنظيف',
        () => {
          doneList.forEach(d => KTB.removeDownload(d.id));
          if (KTB.isAndroid()) syncDownloadsFromNative();
          else {
            state.downloads = state.downloads.filter(d => d.status === 'downloading' || d.status === 'queued');
            renderDownloads();
          }
          KTB.toast('تم تنظيف سجل التحميلات المكتملة');
        }
      );
    };

    function closeBookModal() {
      state.modalGen = (state.modalGen || 0) + 1;
      if (state._detailDwellTimer) {
        clearTimeout(state._detailDwellTimer);
        state._detailDwellTimer = null;
      }
      state.currentModalBook = null;
      state.currentModalLinks = [];
      if (KTB.abortHttp) KTB.abortHttp();
      $('bookModal').classList.add('hidden');
    }
    $('modalClose').onclick = closeBookModal;
    $('modalBackdrop').onclick = closeBookModal;
    $('authorClose').onclick = () => $('authorModal').classList.add('hidden');
    $('authorBackdrop').onclick = () => $('authorModal').classList.add('hidden');
    $('setClose').onclick = () => $('settingsModal').classList.add('hidden');
    $('setBackdrop').onclick = () => $('settingsModal').classList.add('hidden');
    function openHabitModal() {
      renderCompanionWidget();
      const m = $('habitModal');
      if (m) m.classList.remove('hidden');
      if (KTB.haptic) KTB.haptic('tick');
    }
    function closeHabitModal() {
      const m = $('habitModal');
      if (m) m.classList.add('hidden');
    }
    if ($('btnTopStreak')) $('btnTopStreak').onclick = openHabitModal;
    if ($('habitClose')) $('habitClose').onclick = closeHabitModal;
    if ($('habitBackdrop')) $('habitBackdrop').onclick = closeHabitModal;
    function openAboutModal() {
      const m = $('aboutModal');
      if (m) m.classList.remove('hidden');
      if (KTB.haptic) KTB.haptic('tick');
    }
    function closeAboutModal() {
      const m = $('aboutModal');
      if (m) m.classList.add('hidden');
    }
    if ($('btnBrandAbout')) {
      $('btnBrandAbout').onclick = (e) => {
        if (e && e.target && e.target.closest('#btnCollapseRail')) return;
        openAboutModal();
      };
      $('btnBrandAbout').onkeydown = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && (!e.target || !e.target.closest('#btnCollapseRail'))) {
          e.preventDefault();
          openAboutModal();
        }
      };
    }
    if ($('btnMobileBrandAbout')) {
      $('btnMobileBrandAbout').onclick = openAboutModal;
      $('btnMobileBrandAbout').onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAboutModal();
        }
      };
    }
    if ($('aboutClose')) $('aboutClose').onclick = closeAboutModal;
    if ($('aboutBackdrop')) $('aboutBackdrop').onclick = closeAboutModal;
    if ($('aboutWhatsappBtn')) {
      $('aboutWhatsappBtn').onclick = () => KTB.openUrl('https://wa.me/201027608911');
    }
    if ($('aboutInstagramBtn')) {
      $('aboutInstagramBtn').onclick = () => KTB.openUrl('https://www.instagram.com/m.o.s.9.a.f.a?obrf=MTBlbHgzdWIyc214ag==');
    }
    if ($('aboutDonateBtn')) {
      $('aboutDonateBtn').onclick = () => {
        KTB.haptic('light');
        if (KTB.openInstaPay) KTB.openInstaPay('01027608911', '');
        else {
          KTB.copy('01027608911');
          KTB.toast('تم نسخ رقم InstaPay: 01027608911');
        }
      };
    }

    let _lastJobsSig = '';
    window.addEventListener('kotob:solverStatus', (e) => {
      let d = e && e.detail;
      if (typeof d === 'string') {
        try { d = JSON.parse(d); } catch (_) { d = {}; }
      }
      if (!d || !state.prepJobs.size) return;
      const evUrl = String(d.url || '');
      const pct = Number(d.prepPct);
      const sec = Number(d.timerSec || 0);
      const txt = String(d.text || '').trim();
      let touched = false;
      for (const pj of state.prepJobs.values()) {
        if (evUrl && pj.linkUrl && pj.linkUrl !== evUrl && pj.engId && !evUrl.includes('noor-book')) continue;
        if (pct > 0) pj.percent = Math.max(pj.percent || 1, Math.min(99, pct));
        if (sec >= 0) pj.timerSec = sec;
        if (txt) pj.phaseText = (sec > 0 && !txt.includes('ث)')) ? (txt + ' (' + sec + 'ث)') : txt;
        updateLivePrepDom(pj.bookId);
        touched = true;
      }
      if (touched) {
        renderActiveDownloadQueue();
        refreshOwnedCardBadges();
      }
    });

    window.addEventListener('kotob:jobs', (e) => {
      if (Array.isArray(e.detail)) {
        state.downloads = e.detail;
        for (const j of e.detail) {
          for (const bid of Array.from(state.prepJobs.keys())) {
            if (j.id === bid || String(j.id || '').startsWith(bid + '_')) {
              if (j.status === 'downloading' || j.status === 'queued') {
                state.prepJobs.delete(bid);
              } else {
                state.prepJobs.delete(bid);
                state.bookHadPrep.delete(bid);
              }
            }
          }
          if (j.status === 'done' || j.status === 'error' || j.status === 'canceled' || j.status === 'cancelled') {
            for (const bid of Array.from(state.bookHadPrep.keys())) {
              if (j.id === bid || String(j.id || '').startsWith(bid + '_')) {
                state.bookHadPrep.delete(bid);
              }
            }
          }
          if (j.status === 'done') {
            if (j.source) recordCopySource(j.localUri || j.uri || j.id, j.title, j.source);
            cleanupCloudAfterLocalDownload(j.title, j.localUri || j.uri);
            if (!state.seenDoneIds.has(j.id)) {
              state.seenDoneIds.add(j.id);
              if (REC) {
                const rawBid = String(j.id || '').replace(/_(pdf|epub|azw3|mobi)$/i, '');
                const matched = (j.bookId && BOOK_MAP.get(j.bookId))
                  || BOOK_MAP.get(rawBid)
                  || CATS.CURATED.find(x => normBookText(x.title) === normBookText(j.title));
                REC.recordSignal(matched || { id: rawBid || j.id, title: j.title, source: j.source }, 'download');
                state._lastHomeAlloc = null;
              }
              KTB.toast(isAudioFileItem(j.format, j.fileName, j.localUri || j.uri)
                ? ('اكتمل تحميل الكتاب الصوتي: ' + (j.title || '') + ' — جاهز للاستماع بدون نت')
                : ('اكتمل التحميل في مجلد Midad: ' + (j.title || '') + ' — جاهز للقراءة'));
            }
          } else if (j.status === 'error' && !state.seenErrIds.has(j.id)) {
            state.seenErrIds.add(j.id);
            KTB.toast('تعذر التحميل (' + (j.title || 'الكتاب') + '): ' + (j.error || 'فشل الاتصال بالمصدر'));
          }
        }
        const sig = e.detail.map(j => j.id + ':' + j.status).join('|');
        const modalOpen = state.currentModalBook && !$('bookModal').classList.contains('hidden');
        const modalBid = modalOpen ? state.currentModalBook.id : '';
        const justFinishedForModal = modalBid
          ? e.detail.find(j => j && j.status === 'done' && (j.bookId === modalBid || (j.id && j.id.startsWith(modalBid + '_'))))
          : null;
        if (sig === _lastJobsSig) {
          // Only download progress percentage changed: update active queue & matching active card badges cleanly
          renderActiveDownloadQueue();
          refreshActiveDownloadCardsOnly();
          refreshAudiobookModalChapters();
          if (modalOpen) {
            updateLivePrepDom(modalBid, justFinishedForModal);
          }
        } else {
          _lastJobsSig = sig;
          invalidateOwnedCache();
          renderDownloads();
          refreshOwnedCardBadges();
          refreshAudiobookLiveUi();
          if (modalOpen) {
            const hasTrackedOrBar = !!(state.activeRowKeyByBook.has(modalBid) || ($('detailLinksList') && $('detailLinksList').querySelector('.dl-row-progress-wrap')));
            updateLivePrepDom(modalBid, (justFinishedForModal && hasTrackedOrBar) ? justFinishedForModal : null);
          }
        }
        if (modalOpen) {
          refreshModalActBar(state.currentModalBook);
        }
        if (state.activeScribdBook) {
          updateScribdReaderDlPill(state.activeScribdBook.id);
        }
      }
    });
    window.addEventListener('kotob:audioState', (e) => {
      let st = e && e.detail;
      if (typeof st === 'string') {
        try { st = JSON.parse(st); } catch (_) { st = null; }
      }
      if (st) syncAudioPlayerUi(st);
    });
    window.addEventListener('kotob:pickedAudio', (e) => {
      const d = e && e.detail;
      if (!d || !d.uri) return;
      const item = {
        id: 'picked_' + cleanAbId(d.uri),
        bookId: 'picked_' + cleanAbId(d.uri),
        uri: d.uri,
        fileName: d.fileName || d.title || 'audio.mp3',
        title: d.title || d.fileName || 'ملف صوتي محلي',
        author: 'ملف من جهازك',
        addedAt: Number(d.addedAt || Date.now()),
        sourceKind: 'picked',
      };
      state.pickedAudioBooks = [item, ...(state.pickedAudioBooks || []).filter(x => x && x.uri !== item.uri)];
      saveJson('wq_picked_audio_v1', state.pickedAudioBooks);
      if (state.tab !== 'audiobooks') switchTab('audiobooks');
      else renderAudiobooks();
      playOfflineAudioItem(item);
      KTB.toast('تمت إضافة وتشغيل الملف الصوتي: ' + item.title);
    });
    window.addEventListener('kotob:localBook', () => {
      state.localBooks = KTB.getLocalBooks();
      invalidateOwnedCache();
      renderDownloads();
      refreshOwnedCardBadges();
    });
    window.addEventListener('kotob:deviceBooks', (e) => {
      if (Array.isArray(e.detail)) {
        state.deviceBooks = e.detail;
        invalidateOwnedCache();
        if (state.tab === 'downloads') {
          _downloadsDirty = false;
          renderDownloads();
        } else {
          _downloadsDirty = true;
          const badge = $('dlBadge');
          if (badge) badge.classList.add('hidden');
        }
        refreshOwnedCardBadges();
        if (KTB.isAndroid() && !_splashDismissed) dismissLaunchSplash(false);
        if (_awaitingAutoOpenDevice && !_autoOpenedOnBoot) {
          setTimeout(() => tryAutoOpenLastBookOnBoot(true), 40);
        }
      }
    });
    window.addEventListener('kotob:readerTelemetry', (e) => {
      let tel = e && e.detail;
      const rawSig = typeof tel === 'string' ? tel : JSON.stringify(tel || {});
      if (rawSig === _lastTelemetrySig) return;
      _lastTelemetrySig = rawSig;
      if (typeof tel === 'string') {
        try { tel = JSON.parse(tel); } catch (_) { tel = null; }
      }
      if (tel && typeof tel === 'object') {
        state.readerTelemetry = tel;
        syncTelemetryAndSignals();
        if (HABIT) HABIT.syncFromTelemetry(state.readerTelemetry || {});
        if (Object.keys(tel).length > 0) {
          refreshRecommendationShelves();
          renderCompanionWidget();
        }
      }
    });

    const mainEl = $('mainScroll');
    const topBarEl = document.querySelector('.top-bar');
    let _savedScrollRatio = 0;
    let _lastOrientW = window.innerWidth;
    let _lastOrientH = window.innerHeight;
    let _lastOrientIsLand = _lastOrientW > _lastOrientH;
    let _restoringOrient = false;
    let _topBarScrolled = false;
    window.addEventListener('kotob:openContinueReading', () => {
      switchTab('home');
      openContinueTargetBook();
    });
    if ($('renameBookClose')) $('renameBookClose').onclick = closeRenameBookModal;
    if ($('renameBookBackdrop')) $('renameBookBackdrop').onclick = closeRenameBookModal;
    if ($('renameBookCancel')) $('renameBookCancel').onclick = closeRenameBookModal;
    if ($('renameBookSave')) {
      $('renameBookSave').onclick = () => {
        const inp = $('renameBookInput');
        const nextName = inp ? inp.value.trim() : '';
        if (!nextName || !_renameTargetGroup) return;
        setCustomBookTitle(_renameTargetGroup, nextName);
        invalidateOwnedCache();
        closeRenameBookModal();
        renderDownloads();
        renderHero();
        KTB.toast('تم تحديث اسم الكتاب إلى: ' + nextName);
      };
    }
    if ($('renameBookReset')) {
      $('renameBookReset').onclick = () => {
        if (!_renameTargetGroup) return;
        setCustomBookTitle(_renameTargetGroup, '');
        invalidateOwnedCache();
        closeRenameBookModal();
        renderDownloads();
        renderHero();
        KTB.toast('تمت استعادة الاسم الأصلي');
      };
    }
    if ($('renameBookInput')) {
      $('renameBookInput').onkeydown = (e) => {
        if (e.key === 'Enter' && $('renameBookSave')) {
          e.preventDefault();
          $('renameBookSave').click();
        }
      };
    }

    if (mainEl) {
      let _lastScrollY = 0;
      mainEl.addEventListener('scroll', () => {
        const st = mainEl.scrollTop;
        const dy = st - _lastScrollY;
        _lastScrollY = st;
        if (topBarEl) {
          const isSc = st > 8;
          if (isSc !== _topBarScrolled) {
            _topBarScrolled = isSc;
            topBarEl.classList.toggle('scrolled', isSc);
          }
          const barH = topBarEl.offsetHeight || 58;
          topBarEl.style.setProperty('--topbar-h', barH + 'px');
          const searchFocused = document.activeElement === $('q');
          const recentOpen = $('recentSearches') && !$('recentSearches').classList.contains('hidden');
          const isHidden = topBarEl.classList.contains('top-bar-hidden');
          if (!searchFocused && !recentOpen) {
            if (dy > 8 && st > 56 && !isHidden) {
              topBarEl.classList.add('top-bar-hidden');
            } else if ((dy < -6 || st <= 24) && isHidden) {
              topBarEl.classList.remove('top-bar-hidden');
            }
          }
        }
        if (_restoringOrient) return;
        if (window.innerWidth !== _lastOrientW || window.innerHeight !== _lastOrientH) return;
        const maxS = Math.max(1, mainEl.scrollHeight - mainEl.clientHeight);
        _savedScrollRatio = st / maxS;
      }, { passive: true });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (KTB.back && KTB.back()) e.preventDefault();
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT' && $('q')) {
          e.preventDefault();
          $('q').focus();
        }
      }
    });
    let _orientSwitchTimer = null;
    const triggerOrientFastPath = () => {
      const root = document.documentElement;
      if (!root) return;
      root.classList.add('orient-switching');
      if (_orientSwitchTimer) clearTimeout(_orientSwitchTimer);
      _orientSwitchTimer = setTimeout(() => {
        root.classList.remove('orient-switching');
        _orientSwitchTimer = null;
      }, 180);
    };
    const restoreScrollAfterOrient = () => {
      triggerOrientFastPath();
      if (!mainEl) return;
      const r = _savedScrollRatio;
      _restoringOrient = true;
      requestAnimationFrame(() => {
        const maxS = Math.max(0, mainEl.scrollHeight - mainEl.clientHeight);
        if (maxS > 0 && r > 0) mainEl.scrollTop = Math.round(r * maxS);
        _lastOrientW = window.innerWidth;
        _lastOrientH = window.innerHeight;
        _restoringOrient = false;
      });
    };
    window.addEventListener('orientationchange', restoreScrollAfterOrient);
    window.addEventListener('kotob:orientationChanged', restoreScrollAfterOrient);
    window.addEventListener('resize', () => {
      const isLand = window.innerWidth > window.innerHeight;
      if (isLand !== _lastOrientIsLand) {
        _lastOrientIsLand = isLand;
        restoreScrollAfterOrient();
      } else {
        _lastOrientW = window.innerWidth;
        _lastOrientH = window.innerHeight;
      }
    });
  }

  function openColdStartWizard() {
    const modal = $('coldStartModal');
    if (!modal || !CATS) return;
    const returning = localStorage.getItem('wq_cold_start_v2') === '1';
    const selectedCats = new Set(returning && Array.isArray(state.prefCats) ? state.prefCats : []);
    const selectedBookIds = new Set(returning ? state.liked.map(b => b && b.id).filter(Boolean) : []);
    let chosenLen = (state.prefLength === 'short' || state.prefLength === 'long') ? state.prefLength : 'all';
    const landmarkIds = Array.isArray(CATS.COLD_START_BOOK_IDS) ? CATS.COLD_START_BOOK_IDS : [];
    const byId = new Map(CATS.CURATED.map(b => [b.id, b]));
    const orderedBooks = [
      ...landmarkIds.map(id => byId.get(id)).filter(Boolean),
      ...CATS.CURATED.filter(b => !landmarkIds.includes(b.id)),
    ];

    function syncCsLengthUi() {
      const grid = $('csLenGrid');
      const badge = $('csLenBadge');
      if (grid) {
        grid.querySelectorAll('.cs-len-card').forEach(btn => {
          btn.classList.toggle('on', (btn.dataset.cslen || 'all') === chosenLen);
        });
      }
      if (badge) {
        badge.textContent = chosenLen === 'short' ? 'أقل من 250 صفحة' : (chosenLen === 'long' ? '250+ صفحة' : 'الاثنان');
        badge.classList.add('ready');
      }
    }
    if ($('csLenGrid')) {
      $('csLenGrid').querySelectorAll('.cs-len-card').forEach(btn => {
        btn.onclick = () => {
          chosenLen = btn.dataset.cslen || 'all';
          applyLengthPreference(chosenLen);
          syncCsLengthUi();
          renderCsBooks();
        };
      });
    }
    syncCsLengthUi();

    let catsCollapsed = false;
    function setCatsCollapsed(flag) {
      catsCollapsed = !!flag;
      const sec = $('csCatSection');
      const tog = $('csCatToggleBtn');
      const sheetBody = modal.querySelector('.cs-modal-body');
      if (sec) sec.classList.toggle('collapsed', catsCollapsed);
      if (sheetBody) sheetBody.classList.toggle('cats-collapsed', catsCollapsed);
      if (tog) tog.textContent = catsCollapsed ? ('تعديل (' + selectedCats.size + ') ↓') : 'إخفاء ↑';
      if (catsCollapsed && sheetBody) sheetBody.scrollTop = 0;
    }

    function syncCounters() {
      if ($('csCatCounter')) {
        $('csCatCounter').textContent = selectedCats.size + ' / 3';
        $('csCatCounter').classList.toggle('ready', selectedCats.size >= 3);
      }
      if ($('csBookCounter')) {
        $('csBookCounter').textContent = selectedBookIds.size + ' / 3';
        $('csBookCounter').classList.toggle('ready', selectedBookIds.size >= 3);
      }
      if ($('csCatToggleBtn')) {
        $('csCatToggleBtn').textContent = catsCollapsed ? ('تعديل (' + selectedCats.size + ') ↓') : 'إخفاء ↑';
      }
    }

    function renderCsCats() {
      const grid = $('csCatGrid');
      if (!grid) return;
      grid.innerHTML = getVisibleCategories(false).map(c => {
        const on = selectedCats.has(c.id);
        return '<button type="button" class="cs-cat-card ' + (on ? 'on' : '') + '" data-cscat="' + esc(c.id) + '">'
          + catIcon(c.iconKey)
          + '<span>' + esc(c.name) + '</span>'
          + '</button>';
      }).join('');
      grid.querySelectorAll('.cs-cat-card').forEach(btn => {
        btn.onclick = () => {
          const cid = btn.dataset.cscat;
          if (!cid) return;
          if (selectedCats.has(cid)) selectedCats.delete(cid);
          else selectedCats.add(cid);
          btn.classList.toggle('on', selectedCats.has(cid));
          syncCounters();
          renderCsBooks();
          if (selectedCats.size >= 3 && !catsCollapsed) setCatsCollapsed(true);
        };
      });
    }

    function renderCsBooks() {
      const grid = $('csBookGrid');
      if (!grid) return;
      const q = normBookText(($('csBookSearch') && $('csBookSearch').value) || '');
      let list = orderedBooks.filter(matchesPrefLang);
      if (q) {
        list = list.filter(b => {
          const hay = normBookText([b.title, b.author, b.subCat, ...(b.microTags || [])].join(' '));
          return hay.includes(q);
        });
      } else if (selectedCats.size > 0 || chosenLen !== 'all') {
        const lenMatch = b => chosenLen === 'short' ? (getBookPagesNum(b) < 250) : (chosenLen === 'long' ? (getBookPagesNum(b) >= 250) : true);
        list = [...list].sort((a, b) => {
          const sa = (selectedCats.has(a.cat) ? 4 : 0) + (lenMatch(a) ? 3 : 0);
          const sb = (selectedCats.has(b.cat) ? 4 : 0) + (lenMatch(b) ? 3 : 0);
          return sb - sa;
        });
      }
      grid.innerHTML = list.slice(0, 36).map(b => {
        const on = selectedBookIds.has(b.id) || state.liked.some(x => x && x.id === b.id && returning);
        const subMeta = [b.author || '', b.subCat || ''].filter(Boolean).join(' • ');
        return '<button type="button" class="cs-book-card ' + (on ? 'on' : '') + '" data-csbook="' + esc(b.id) + '">'
          + '<strong>' + esc(b.title) + '</strong>'
          + '<small>' + esc(subMeta) + '</small>'
          + '</button>';
      }).join('');
      grid.querySelectorAll('.cs-book-card').forEach(btn => {
        btn.onclick = () => {
          const bid = btn.dataset.csbook;
          if (!bid) return;
          if (selectedBookIds.has(bid)) selectedBookIds.delete(bid);
          else selectedBookIds.add(bid);
          btn.classList.toggle('on', selectedBookIds.has(bid));
          syncCounters();
          if (!catsCollapsed) setCatsCollapsed(true);
        };
      });
    }

    function skipColdStart() {
      if (localStorage.getItem('wq_cold_start_v2') !== '1') {
        localStorage.setItem('wq_cold_start_v2', 'skipped');
      }
      modal.classList.add('hidden');
    }

    function applyColdStart() {
      if (selectedCats.size < 3 || selectedBookIds.size < 3) {
        KTB.toast('اختر 3 تصنيفات و3 كتب أعجبتك على الأقل');
        return;
      }
      state.prefLength = chosenLen;
      try { localStorage.setItem('wq_pref_length', chosenLen); } catch (_) { }
      state.prefCats = Array.from(selectedCats);
      saveJson('wq_pref_cats', state.prefCats);
      state.taste.cats = state.taste.cats || {};
      state.prefCats.forEach(cid => {
        state.taste.cats[cid] = (state.taste.cats[cid] || 0) + 6;
      });
      selectedBookIds.forEach(bid => {
        const raw = byId.get(bid);
        if (!raw) return;
        const reg = registerBook(raw);
        if (!state.liked.some(x => x && x.id === reg.id)) {
          state.liked.unshift(reg);
        }
        recordTaste(reg, 4);
        if (REC) REC.syncFavoriteSignal(reg, true);
      });
      state.liked = state.liked.slice(0, 120);
      saveJson('wq_liked', state.liked);
      saveJson('wq_taste', state.taste);
      localStorage.setItem('wq_cold_start_v2', '1');
      state.homeCat = 'all';
      state.trendingCats = ['all'];
      saveJson('wq_trending_cats', state.trendingCats);
      modal.classList.add('hidden');
      state._lastHomeAlloc = null;
      renderHomePills();
      renderTrendingPills();
      refreshRecommendationShelves({ recordImpressions: true, forceImpressions: true });
      renderSaved();
      KTB.toast('تم بناء ترشيحات 70 / 20 / 10 المخصصة لك');
    }

    if ($('csCatToggleBtn')) {
      $('csCatToggleBtn').onclick = () => setCatsCollapsed(!catsCollapsed);
    }
    if ($('csBookSearch')) {
      $('csBookSearch').value = '';
      $('csBookSearch').onfocus = () => { if (!catsCollapsed) setCatsCollapsed(true); };
      $('csBookSearch').oninput = renderCsBooks;
    }
    if ($('csBookGrid')) {
      $('csBookGrid').onscroll = () => {
        if (!catsCollapsed && $('csBookGrid').scrollTop > 18) setCatsCollapsed(true);
      };
    }
    if ($('coldStartClose')) $('coldStartClose').onclick = skipColdStart;
    if ($('coldStartSkipTop')) $('coldStartSkipTop').onclick = skipColdStart;
    if ($('btnColdStartSkip')) $('btnColdStartSkip').onclick = skipColdStart;
    if ($('coldStartBackdrop')) $('coldStartBackdrop').onclick = skipColdStart;
    if ($('btnColdStartApply')) $('btnColdStartApply').onclick = applyColdStart;

    renderCsCats();
    renderCsBooks();
    setCatsCollapsed(false);
    syncCounters();
    modal.classList.remove('hidden');
  }

  const LITERARY_WISDOM = [
    { quote: 'خير جليس في الزمان كتاب، تحيا به العقول وتتسع به الآفاق.', author: 'المتنبي', tag: 'قول مأثور' },
    { quote: 'أحببتُ الكتب لأن حياةً واحدة لا تكفي، وفي كل كتاب حياةٌ كاملة تُضاف إلى عمرك.', author: 'عباس محمود العقاد', tag: 'حكمة في القراءة' },
    { quote: 'القراءة ليست ترفاً فكرياً، بل هي النور الذي يبقي العقل متقداً يقظاً عبر السنين.', author: 'طه حسين', tag: 'فكر وأدب' },
    { quote: 'لا تقرأ لتتناقض أو تفحم الآخرين، بل اقرأ لتزن الأفكار وتتفكر في معانيها.', author: 'فرانسيس بيكون', tag: 'تأملات' },
    { quote: 'تُشعل القراءة عشرين دقيقة يومياً روابط عصبية جديدة وتحسن الذاكرة والتركيز بنسبة ملحوظة.', author: 'معلومة علمية', tag: 'حقيقة معرفية' },
    { quote: 'أنت لا تدفع ثمن الكتاب لتقرأ كلماته، بل لتشتري بصيرة كاتبه وتجربة أعوام من حياته.', author: 'جبران خليل جبران', tag: 'رؤية أدبية' },
    { quote: 'البيت الذي بلا كتب كالجسد الذي بلا روح.', author: 'شيشرون', tag: 'كلاسيكيات' },
    { quote: 'تترك القراءة قبل النوم بـ15 دقيقة أثراً مهدئاً يقلل التوتر بنحو 68% أكثر من الموسيقى.', author: 'دراسة جامعة ساسكس', tag: 'معلومة ثقافية' },
    { quote: 'القارئ الجيد يقرأ بعينين: عين على السطر، وعين على ما وراء المعنى.', author: 'أحمد خالد توفيق', tag: 'أدب حديث' },
    { quote: 'الكتاب هو الجار الذي لا يملك وقتاً للعتاب، والصديق الذي لا يخونك في الوحدة.', author: 'الجاحظ', tag: 'التراث العربي' },
    { quote: 'عشر دقائق من المطالعة الواعية كل يوم تصنع في عامٍ كامل ما لا تصنعه أعوام من العشوائية.', author: 'مداد — عادة القراءة', tag: 'إلهام يومي' },
    { quote: 'الكتب التي تقرؤها في شبابك تبني أثاث عقلك الذي تعيش فيه بقية عمرك.', author: 'مصطفى صادق الرافعي', tag: 'نثر عربي' },
    { quote: 'من يقرأ يعيش ألف حياة قبل أن يموت، أما الذي لا يقرأ فلا يعيش سوى حياة واحدة.', author: 'جورج مارتن', tag: 'قول مشهور' },
    { quote: 'كل كتاب تفتحه بصدق يفتح لك نافذة على عالم لم تكن لتراه بعينك وحدك.', author: 'نجيب محفوظ', tag: 'حكمة أدبية' },
    { quote: 'إن الفهم العميق يبدأ من التوقف عند الفكرة وتدوينها بقلمك في هامش الصفحة.', author: 'توفيق الحكيم', tag: 'منهج قراءة' },
    { quote: 'معدل قراءة 20 صفحة يومياً يتيح لك إتمام أكثر من 24 كتاباً في عام واحد دون عناء.', author: 'إحصائية معرفية', tag: 'رقم وحقيقة' },
  ];

  function initDailyQuoteStrip(forceNext) {
    const host = $('dailyQuoteStrip');
    if (!host || !LITERARY_WISDOM.length) return;
    let idx = 0;
    try {
      const prevRaw = localStorage.getItem('wq_quote_idx_v1');
      if (prevRaw != null) {
        const prev = parseInt(prevRaw, 10);
        idx = Number.isFinite(prev) ? ((prev + 1) % LITERARY_WISDOM.length) : 0;
      } else {
        idx = Math.floor(Math.random() * LITERARY_WISDOM.length);
      }
      if (forceNext) {
        const curIdx = Number(host.dataset.quoteIdx || idx);
        idx = (curIdx + 1) % LITERARY_WISDOM.length;
      }
      localStorage.setItem('wq_quote_idx_v1', String(idx));
    } catch (e) {}
    const item = LITERARY_WISDOM[idx] || LITERARY_WISDOM[0];
    host.dataset.quoteIdx = String(idx);
    host.innerHTML =
      '<div class="dq-inner">'
      + '<span class="dq-mark" aria-hidden="true">' + SVG.quote + '</span>'
      + '<p class="dq-text"><span class="dq-quote">«' + esc(item.quote) + '»</span> <span class="dq-author">— ' + esc(item.author) + '</span></p>'
      + '<button type="button" class="icon-btn sm dq-next-btn" id="btnNextDailyQuote" title="قول آخر" aria-label="عرض قول آخر">' + SVG.refresh + '</button>'
      + '</div>';
    if ($('btnNextDailyQuote')) {
      $('btnNextDailyQuote').onclick = () => initDailyQuoteStrip(true);
    }
  }

  function boot() {
    const fillEl = $('splashBarFill');
    if (fillEl) fillEl.style.width = '50%';
    wireUi();
    syncComicsSearchScopeVisibility();
    syncTelemetryAndSignals();
    try {
      const savedAud = KTB.audioGetState && KTB.audioGetState();
      if (savedAud && (savedAud.bookId || savedAud.title || savedAud.srcUrl || savedAud.localUri)) {
        syncAudioPlayerUi(savedAud);
      }
    } catch (_) { }
    renderHomePills();
    renderQuickPrompts();
    initDailyQuoteStrip(false);
    renderCompanionWidget();
    if (fillEl) fillEl.style.width = '88%';
    refreshRecommendationShelves({ recordImpressions: true });
    if (fillEl) fillEl.style.width = '100%';
    const needColdStart = !localStorage.getItem('wq_cold_start_v2') && !state.liked.length && !(REC && REC.getSignalLog && REC.getSignalLog().length);
    // Show first frame immediately without holding the user on a splash wait
    if (state.autoOpenLastBook) {
      syncDownloadsFromNative(false);
      _pendingColdStart = false;
      requestAnimationFrame(() => dismissLaunchSplash(true));
      setTimeout(() => tryAutoOpenLastBookOnBoot(false), 60);
    } else {
      _pendingColdStart = needColdStart;
      requestAnimationFrame(() => dismissLaunchSplash(true));
      // Defer heavy local scans & indexing smoothly in background
      setTimeout(() => syncDownloadsFromNative(false), 180);
    }
    setTimeout(hydrateHomeLive, KTB.isAndroid() ? 1100 : 380);
    if (REC && REC.syncCatalogToNativeDb && CATS && CATS.CURATED) {
      setTimeout(() => REC.syncCatalogToNativeDb(CATS.CURATED), 2200);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
