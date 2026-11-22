/**
 * Multi-Source Library Engine:
 * Connects 15+ Arabic, Global & Academic libraries in parallel,
 * resolves direct PDF/EPUB URLs (plus WebView Cloudflare bypass inside the Tablet APK),
 * and monitors shadow mirrors dynamically via open-slum.org.
 */
window.KOTOB_SOURCES = (function () {
  const MIRRORS = {
    libgen: ['https://libgen.li', 'https://libgen.bz', 'https://libgen.la', 'https://libgen.vg'],
    annas: ['https://annas-archive.li', 'https://annas-archive.pk', 'https://annas-archive.gl', 'https://annas-archive.gd'],
    foulaToken: '',
    foulaTokenAt: 0,
  };

  function stripTags(html) {
    return String(html || '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(Number(n)); } catch (_) { return ' '; } })
      .replace(/&#x([0-9a-f]+);/gi, (_, h) => { try { return String.fromCodePoint(parseInt(h, 16)); } catch (_) { return ' '; } })
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function absUrl(base, href) {
    try { return new URL(href, base).toString(); } catch (_) { return href || ''; }
  }

  function isArabicText(s) {
    return /[\u0600-\u06FF]/.test(String(s || ''));
  }

  function normalizeText(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function cleanSearchTitle(t, authorHint) {
    let s = stripTags(t || '')
      .split('—')[0]
      .split(' - ')[0]
      .split(' – ')[0]
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/\bPDF\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (authorHint) {
      const a = stripTags(authorHint).replace(/[\u064B-\u065F\u0670\u0640]/g, '').trim();
      if (a.length >= 3 && s.toLowerCase().endsWith(' ' + a.toLowerCase())) {
        s = s.slice(0, s.length - a.length).trim();
      }
    }
    return s;
  }

  function extractArabicSearchQuery(title, authorHint) {
    const raw = stripTags(title || '');
    if (!raw) return '';
    const parts = raw.split(/[—–|]/).map(s => s.trim()).filter(Boolean);
    const arSeg = parts.find(p => isArabicText(p));
    const chosen = arSeg || raw;
    return cleanSearchTitle(chosen, authorHint) || cleanSearchTitle(raw, authorHint) || chosen;
  }

  function withTimeout(promise, ms, fallbackVal) {
    let timer = null;
    return Promise.race([
      Promise.resolve(promise).catch(() => fallbackVal),
      new Promise((resolve) => {
        timer = setTimeout(() => resolve(fallbackVal), ms);
      }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
  }

  function firstNonEmpty(promises) {
    return new Promise((resolve) => {
      let pending = promises.length;
      if (!pending) return resolve(null);
      let settled = false;
      promises.forEach((p) => {
        Promise.resolve(p).then((val) => {
          const ok = Array.isArray(val) ? val.length > 0 : Boolean(val && val.links && val.links.length);
          if (!settled && ok) {
            settled = true;
            resolve(val);
          }
        }).catch(() => {}).finally(() => {
          pending--;
          if (!settled && pending <= 0) resolve(null);
        });
      });
    });
  }

  const MATCH_STOP = new Set([
    'في', 'من', 'عن', 'على', 'الي', 'مع', 'او', 'و', 'كتاب', 'روايه', 'مجموعه',
    'تحميل', 'قراءه', 'مجانا', 'نسخه', 'الكتاب', 'pdf', 'epub', 'azw3', 'mobi',
    'the', 'and', 'of', 'in', 'to', 'a', 'an', 'for', 'by', 'book',
  ]);

  function stripArAl(w) {
    return String(w || '').replace(/^ال(?=[\u0600-\u06FFa-z0-9]{2,})/, '');
  }

  function coreTokens(s) {
    const norm = normalizeText(s);
    if (!norm) return [];
    return norm.split(' ').filter(w => w.length >= 2 && !MATCH_STOP.has(w) && !MATCH_STOP.has(stripArAl(w)));
  }

  function tokenMatches(tok, normText, normToks) {
    if (!tok) return false;
    const stem = stripArAl(tok);
    if (Array.isArray(normToks) && normToks.length) {
      for (const tt of normToks) {
        const tStem = stripArAl(tt);
        if (tt === tok || tStem === stem) return true;
        if (stem.length >= 4 && (tt.includes(stem) || (tStem.length >= 4 && stem.includes(tStem)))) return true;
      }
      return false;
    }
    return normText.includes(tok) || (stem.length >= 4 && normText.includes(stem));
  }

  const EDITION_STOP_WORDS = new Set([
    'روايه', 'كتاب', 'قصه', 'مجموعه', 'ملخص', 'ترجمه', 'مترجم', 'المترجم', 'مترجمه', 'المترجمه',
    'كامل', 'كامله', 'الكامله', 'الاعمال', 'مجلد', 'المجلد', 'جزء', 'الجزء', 'طبعه', 'نسخه', 'مصوره',
    'الاصليه', 'عربي', 'بالعربيه', 'مكتبه', 'دار', 'منشورات', 'للنشر', 'والتوزيع', 'تحقيق',
    'شرح', 'تقديم', 'قراءه', 'تاليف', 'بقلم', 'مولف', 'للكاتب',
    'اول', 'الاول', 'ثاني', 'الثاني', 'ثالث', 'الثالث', 'رابع', 'الرابع', 'خامس', 'الخامس', 'سادس', 'السادس',
    '1', '2', '3', '4', '5', 'ج1', 'ج2', 'ج3', 'ط1', 'ط2',
    'حصريا', 'وتحميل', 'مباشر', 'اونلاين', 'بصيغه', 'اصدار', 'الاصدار', 'بدون', 'نت',
    'pdf', 'epub', 'azw3', 'mobi', 'novel', 'book', 'complete', 'edition', 'summary', 'translated', 'arabic', 'scribd'
  ]);

  const KNOWN_AUTHOR_AR_MAP = {
    'dostoevsky': ['دوستويفسكي', 'ديستويفسكي', 'فيودور'],
    'fyodor': ['فيودور', 'دوستويفسكي'],
    'دوستويفسكي': ['dostoevsky', 'fyodor'],
    'ديستويفسكي': ['dostoevsky', 'fyodor'],
    'فيودور': ['fyodor', 'dostoevsky'],
    'kafka': ['كافكا', 'فرانز'],
    'كافكا': ['kafka', 'franz'],
    'tolstoy': ['تولستوي', 'ليو'],
    'تولستوي': ['tolstoy', 'leo'],
    'doyle': ['دويل', 'كونان', 'ارثر'],
    'دويل': ['doyle', 'conan', 'arthur'],
    'christie': ['كريستي', 'اجاثا'],
    'كريستي': ['christie', 'agatha'],
    'orwell': ['اورويل', 'جورج'],
    'اورويل': ['orwell', 'george'],
    'camus': ['كامو', 'البير'],
    'كامو': ['camus', 'albert'],
    'marquez': ['ماركيز', 'غابرييل', 'جابرييل'],
    'ماركيز': ['marquez', 'gabriel'],
    'hugo': ['هوغو', 'هوجو', 'فيكتور'],
    'هوغو': ['hugo', 'victor'],
    'dickens': ['ديكنز', 'تشارلز'],
    'ديكنز': ['dickens', 'charles'],
    'sharma': ['شارما', 'روبن', 'روبين'],
    'شارما': ['sharma', 'robin'],
    'coelho': ['كويلو', 'باولو'],
    'كويلو': ['coelho', 'paulo'],
    'clear': ['كلير', 'جيمس'],
    'كلير': ['clear', 'james'],
    'naguib': ['نجيب', 'محفوظ'],
    'mahfouz': ['محفوظ', 'نجيب'],
    'محفوظ': ['mahfouz', 'naguib'],
    'burnett': ['برنيت', 'دين'],
    'برنيت': ['burnett', 'dean']
  };

  function expandAuthorTokens(authorStr) {
    const base = coreTokens(authorStr);
    const out = new Set(base);
    for (const tok of base) {
      const alts = KNOWN_AUTHOR_AR_MAP[tok] || KNOWN_AUTHOR_AR_MAP[stripArAl(tok)];
      if (Array.isArray(alts)) {
        for (const a of alts) {
          const na = normalizeText(a);
          if (na) out.add(na);
        }
      }
    }
    return Array.from(out);
  }

  function cleanBookFileTags(raw) {
    return stripTags(raw || '')
      .replace(/\.(pdf|epub|azw3|mobi|prc|fb2|cbz|djvu|txt|md|html?|xhtml)$/i, '')
      .replace(/[_•|]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function stripSubjectTokens(text, authTokSet) {
    const raw = coreTokens(text);
    const stripped = raw.filter(t => {
      const st = stripArAl(t);
      if (EDITION_STOP_WORDS.has(t) || EDITION_STOP_WORDS.has(st)) return false;
      if (authTokSet && (authTokSet.has(t) || authTokSet.has(st))) return false;
      return true;
    });
    return stripped.length ? stripped : raw;
  }

  function isStrictSameBook(seedTitle, candTitle, seedAuthor, candAuthor, altEngTitle) {
    if (!seedTitle || !candTitle) return false;
    const rawAlt = String(altEngTitle || '').trim();
    if (rawAlt.length >= 4 && !isArabicText(rawAlt)) {
      if (isStrictSameBook(rawAlt, candTitle, seedAuthor, candAuthor, '')) return true;
    }

    const seedParts = stripTags(seedTitle).split('—').map(s => s.trim()).filter(Boolean);
    if (!rawAlt && seedParts.length > 1) {
      for (let i = 1; i < seedParts.length; i++) {
        if (seedParts[i].length >= 4 && !isArabicText(seedParts[i])) {
          if (isStrictSameBook(seedParts[i], candTitle, seedAuthor, candAuthor, '')) return true;
        }
      }
    }

    const seedClean = cleanSearchTitle(seedTitle, seedAuthor);
    const authExpanded = expandAuthorTokens((seedAuthor || '') + ' ' + (candAuthor || ''));
    const authSet = new Set(authExpanded);
    const sToks = stripSubjectTokens(seedClean, authSet);
    if (!sToks.length) return false;

    const candNoExt = cleanBookFileTags(candTitle);
    const candClean = cleanSearchTitle(candNoExt, candAuthor) || candNoExt;
    const candParts = candNoExt.split(/(?:\s+[-–—|\/:]\s+|\s+(?:تأليف|للكاتب|بقلم|لـ|ترجمة|المترجم|تحقيق|شرح|تقديم|دار|منشورات|الجزء|المجلد)\s+)/i).map(s => s.trim()).filter(Boolean);
    const cFullToks = stripSubjectTokens(candClean, authSet);
    if (!cFullToks.length) return false;

    let cPrimaryToks = cFullToks;
    if (candParts.length > 1) {
      const p0Toks = stripSubjectTokens(candParts[0], authSet);
      if (p0Toks.some(pt => tokenMatches(sToks[0], '', [pt]))) {
        cPrimaryToks = p0Toks;
      }
    }

    // Author Conflict Check when both authors are specified and meaningful
    const saRaw = String(seedAuthor || '').trim();
    const caRaw = String(candAuthor || '').trim();
    if (saRaw && caRaw && !/غير محدد|ويكي|scribd|archive|أرشيف|مكتبة|تيليجرام|telegram/i.test(caRaw)) {
      const sAuth = expandAuthorTokens(saRaw);
      const cAuth = expandAuthorTokens(caRaw);
      if (sAuth.length > 0 && cAuth.length > 0) {
        const hasArS = sAuth.some(isArabicText);
        const hasArC = cAuth.some(isArabicText);
        const hasLatS = sAuth.some(t => /[a-z]/.test(t));
        const hasLatC = cAuth.some(t => /[a-z]/.test(t));
        if ((hasArS && hasArC) || (hasLatS && hasLatC)) {
          const overlap = sAuth.some(sa => tokenMatches(sa, '', cAuth));
          if (!overlap) return false;
        }
      }
    }

    const activeCandToks = cPrimaryToks.length <= cFullToks.length ? cPrimaryToks : cFullToks;
    let hits = 0;
    sToks.forEach(w => { if (tokenMatches(w, '', cFullToks)) hits++; });

    if (sToks.length === 1) {
      if (hits !== 1) return false;
      // Reject unrelated multi-concept titles like "المخ الأبله" vs "الأبله"
      if (cPrimaryToks.length === 1 && tokenMatches(sToks[0], '', [cPrimaryToks[0]])) {
        return true;
      }
      if (tokenMatches(sToks[0], '', [cFullToks[0]]) && cFullToks.length <= 3) {
        return true;
      }
      return false;
    }

    if (sToks.length === 2) {
      if (hits !== 2) return false;
      return cFullToks.length <= 4 || cPrimaryToks.length <= 3;
    }

    const reqHits = Math.ceil(sToks.length * 0.75);
    const minLen = Math.max(1, Math.min(cFullToks.length, activeCandToks.length));
    return hits >= reqHits && (hits / minLen) >= 0.45;
  }

  function titleMatchesCandidate(seedTitle, candTitle, seedAuthor, candAuthor, altEngTitle) {
    return isStrictSameBook(seedTitle, candTitle, seedAuthor, candAuthor, altEngTitle);
  }

  function scoreSearchRelevance(query, book, seedAuthor, altEngTitle) {
    if (!query || !book || !book.title) return 0;
    const isBroad = Boolean(seedAuthor && typeof seedAuthor === 'object' && seedAuthor.broadSearch);
    const sAuthStr = typeof seedAuthor === 'string' ? seedAuthor : ((seedAuthor && seedAuthor.author) || '');
    const altEng = typeof altEngTitle === 'string' ? altEngTitle : '';

    if (!isBroad) {
      if (!isStrictSameBook(query, book.title, sAuthStr, book.author, altEng)) {
        return 0;
      }
    }

    const qn = normalizeText(cleanSearchTitle(query, sAuthStr) || query);
    const tn = normalizeText(cleanSearchTitle(book.title, book.author) || book.title);
    const an = normalizeText(book.author || '');
    const tagsN = normalizeText(Array.isArray(book.tags) ? book.tags.join(' ') : '');
    if (!qn || !tn) return 0;

    const qToks = coreTokens(qn);
    const tToks = normalizeText(book.title).split(' ').filter(Boolean);
    const aToks = an ? an.split(' ').filter(Boolean) : [];
    const tagToks = tagsN ? tagsN.split(' ').filter(Boolean) : [];

    if (!qToks.length) {
      if (tn === qn) return 200;
      if (tn.includes(qn)) return 100;
      if (an.includes(qn)) return 60;
      return 0;
    }

    let tHits = 0;
    let aHits = 0;
    let taHits = 0;
    let tagHits = 0;
    qToks.forEach((tok) => {
      const inT = tokenMatches(tok, tn, tToks);
      const inA = an ? tokenMatches(tok, an, aToks) : false;
      const inTag = tagsN ? tokenMatches(tok, tagsN, tagToks) : false;
      if (inT) tHits++;
      if (inA) aHits++;
      if (inT || inA) taHits++;
      if (inT || inA || inTag) tagHits++;
    });

    const titleExact = tn === qn;
    const titleStarts = tn.startsWith(qn + ' ');
    const titleContains = tn.includes(qn);
    const authorContains = Boolean(an && an.includes(qn));

    let eligible = titleExact || titleStarts || titleContains || authorContains;
    if (!eligible) {
      if (qToks.length === 1) eligible = taHits === 1 || tagHits === 1;
      else if (qToks.length === 2) eligible = taHits === 2 || tagHits === 2;
      else eligible = taHits >= Math.ceil(qToks.length * 0.6) || tagHits === qToks.length;
    }
    if (!eligible) return 0;

    let sc = 0;
    if (titleExact) sc += 240;
    else if (titleStarts) sc += 150;
    else if (titleContains) sc += 110;
    if (authorContains) sc += 85;
    if (tHits === qToks.length) {
      sc += 95 - Math.min(30, Math.abs(tToks.length - qToks.length) * 3);
    } else {
      sc += Math.round((tHits / qToks.length) * 65);
    }
    sc += Math.round((aHits / qToks.length) * 45);
    if (taHits === qToks.length) sc += 45;
    if (tagHits > taHits) sc += 15;
    if (sAuthStr && book.author) {
      const sAuthExp = expandAuthorTokens(sAuthStr);
      const cAuthExp = expandAuthorTokens(book.author);
      if (sAuthExp.some(sa => tokenMatches(sa, '', cAuthExp))) sc += 45;
    }
    if (isBroad && qToks.length === 1 && !titleExact && !authorContains) {
      if (!isStrictSameBook(query, book.title, sAuthStr, book.author, altEng)) {
        sc = Math.max(15, sc - 135);
      }
    }
    if (book.dlUrl) sc += 8;
    if (book.cover) sc += 5;
    if (book.pages) sc += 4;
    return Math.max(1, Math.round(sc));
  }

  function cleanDisplayBookTitle(raw, authorHint) {
    let s = stripTags(raw || '')
      .replace(/\.(pdf|epub|azw3|mobi|prc|fb2|cbz|djvu|txt|md|docx?|rtf|rar|zip|html?|xhtml)$/i, '')
      .replace(/https?:\/\/\S+/gi, ' ')
      .replace(/@[a-zA-Z0-9_]{3,}/g, ' ')
      .replace(/[_•|]+/g, ' ')
      .trim();
    if (!s) return '';
    if (s.includes('—')) {
      return s.split('—').map(seg => cleanDisplayBookTitle(seg, authorHint)).filter(Boolean).join(' — ') || s;
    }
    if (authorHint) {
      const a = stripTags(authorHint).replace(/\s+/g, ' ').trim();
      if (a.length >= 4 && s.length > a.length + 3 && s.toLowerCase().endsWith(' - ' + a.toLowerCase())) {
        s = s.slice(0, s.length - a.length - 3).trim();
      }
    }
    s = s
      .replace(/^(?:تحميل|قراءة|تصفح|حصريا|مجاناً|كتاب\s+إلكتروني)\s*[:\-–]?\s*/i, '')
      .replace(/^(?!1[5-9]\d\d\b|20\d\d\b)\d{1,3}\s*[-–.)\]]+\s+(?=[\u0600-\u06FFa-zA-Z])/u, '')
      .replace(/^\d{5,}\s+/, '')
      .replace(/[\(\[\{][^)\]\}]*(?:pdf|epub|azw3|mobi|foulabook|noor|hindawi|telegram|scribd|archive|pdfdrive|z-lib|oceanofpdf|midad|مكتبة|قناة|نسخة|كامل|مترجم|طبعة|مصورة|بدون\s+نت)[^)\]\}]*[\)\]\}]/gi, ' ')
      .replace(/[\(\[\{]\s*\d{1,6}\s*[\)\]\}]/g, ' ')
      .replace(/\s+(?:[-–]\s*)?(?:v\d+(?:\.\d+)?|copy|final|ebook|ocr|hq|hd)\s*$/i, '')
      .replace(/\s+(?:[-–]\s*\d{1,5}|#?\d{5,})\s*$/g, '')
      .replace(/\s+[-–]\s*(?:تحميل|مكتبة\s+\S+|قناة\s+\S+|pdf|epub|azw3|scribd|pdfdrive|z-lib)\s*$/gi, '')
      .replace(/(?:\s+|_+)(?:pdf|epub|azw3|mobi|scribd|pdfdrive|z-lib|free\s+pdf)\s*$/gi, '')
      .replace(/\s*[-–:]+\s*$/, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (authorHint) {
      const a = stripTags(authorHint).replace(/\s+/g, ' ').trim();
      if (a.length >= 4 && s.length > a.length + 3 && s.toLowerCase().endsWith(' - ' + a.toLowerCase())) {
        s = s.slice(0, s.length - a.length - 3).trim();
      }
    }
    return s || stripTags(raw || '').trim();
  }

  const NON_BOOK_RE = /(?:^|[\s\-–_:;,/()\[\]"'«»])(?:journal|newspaper|newsletter|magazine|periodical|proceedings|symposium|annual\s+report|financial\s+report|bank\s+statement|tax\s+return|invoice|receipt|catalog|brochure|flyer|presentation|slides|curriculum\s+vitae|cv|resume|syllabus|exam\s+paper|answer\s+key|datasheet|manual\s+service|press\s+release|ticket|boarding\s+pass|passport|certificate|payslip|prescription|lab\s+report|application\s+form|camscanner|screenshot|img_\d+|scan_\d+|doc_?\d{4,}|مجلة|صحيفة|جريدة|العدد\s+\d+|تقرير\s+(?:سنوي|مالي|طبي)|تحليل\s+طبي|روشتة|كتالوج|نشرة\s+إخبارية|فهرس\s+عام|فاتورة|فاتوره|إيصال|ايصال|استمارة|استماره|نموذج|تذكرة|حجز|كشف\s*حساب|شهادة\s*(?:ميلاد|تخرج|تقدير|خبرة)|جواز\s*سفر|رخصة|بطاقة|طلب\s*(?:توظيف|التحاق)|سجل\s*مدني|ضريبة|ضريبه|جدول\s*(?:حصص|امتحانات)|سيرة\s*ذاتية|اشترك\s+في\s+القناة|بوت\s+تحميل|روابط\s+قنوات|قائمة\s+الكتب|أسئلة\s+امتحان)(?=$|[\s\-–_:;,/()\[\]"'«»])/i;

  function isGenuineBookItem(b) {
    if (!b || !b.title) return false;
    const rawT = stripTags(b.title || '').trim();
    const fmt = String(b.format || 'pdf').toLowerCase();
    const isComic = Boolean(b.isComic || b.cat === 'comics_manga' || fmt === 'cbz' || fmt === 'cbr' || /^(?:yskcomics|getcomics|comicsgate|arabcomics|comicverse|azcomics|webtoon|globalcomix|tapas)$/.test(String(b.sourceId || '')));
    const t = cleanDisplayBookTitle(rawT, b.author);
    if (!t || t.length < 2) return false;
    if (/^(?:بدون عنوان|untitled|document|book|unknown|null|undefined|pdf|epub|file)$/i.test(t)) return false;
    if (!/[\u0600-\u06FFa-zA-Z0-9]/.test(t)) return false;
    if (/^\d+$/.test(t) && !/^(?:1984|2001)$/.test(t)) return false;
    if (/\b(?:mp3|mp4|mkv|avi|wav|exe|apk|zip|rar)\b/i.test(fmt)) return false;
    if (!isComic && (NON_BOOK_RE.test(rawT) || NON_BOOK_RE.test(t))) return false;
    if (b.pages && Number(b.pages) > 0 && Number(b.pages) < 5 && fmt === 'pdf' && b.sourceId === 'scribd') return false;
    return true;
  }

  function normBook(b) {
    const rawAuthor = stripTags(b.author || '');
    const title = cleanDisplayBookTitle(b.title || 'بدون عنوان', rawAuthor) || 'كتاب';
    const author = rawAuthor;
    const fmt = String(b.format || 'pdf').toLowerCase().replace(/[^a-z0-9/ ]/g, '').trim() || 'pdf';
    const isComic = Boolean(b.isComic || b.cat === 'comics_manga' || fmt === 'cbz' || fmt === 'cbr' || /^(?:yskcomics|getcomics|comicsgate|arabcomics|comicverse|azcomics|webtoon|globalcomix|tapas)$/.test(String(b.sourceId || '')));
    return {
      id: b.id || (b.sourceId + '_' + btoa(unescape(encodeURIComponent((title + '|' + (b.url || '')).slice(0, 70)))).replace(/[^a-z0-9]/gi, '').slice(0, 18)),
      title,
      author,
      cover: b.cover || '',
      source: b.source || 'مكتبة',
      sourceId: b.sourceId || 'misc',
      lang: b.lang || (isArabicText(title) ? 'ar' : 'en'),
      year: String(b.year || ''),
      rating: b.rating ? String(b.rating) : '',
      format: fmt,
      size: b.size || '',
      pages: b.pages ? String(b.pages) : '',
      url: b.url || '',
      dlUrl: b.dlUrl || '',
      referer: b.referer || b.url || '',
      needsResolve: !!b.needsResolve,
      resolverType: b.resolverType || '',
      summary: stripTags(b.summary || ''),
      cat: b.cat || '',
      isComic,
      extra: b.extra || null,
    };
  }

  function parseDoc(html) {
    return new DOMParser().parseFromString(String(html || ''), 'text/html');
  }

  // ------------------------------------------------------------------ Live Mirror Refresh
  async function refreshMirrors() {
    const r = await KTB.http('https://open-slum.org/');
    if (r.code >= 200 && r.body) {
      const annas = r.body.match(/https?:\/\/annas-archive\.[a-z]{2,5}/gi);
      if (annas && annas.length) {
        MIRRORS.annas = Array.from(new Set(annas.map(u => u.toLowerCase())));
      }
      const lib = r.body.match(/https?:\/\/libgen\.[a-z]{2,5}/gi);
      if (lib && lib.length) {
        const merged = Array.from(new Set([...lib.map(u => u.toLowerCase()), ...MIRRORS.libgen]));
        MIRRORS.libgen = merged.slice(0, 6);
      }
      return { ok: true, annas: MIRRORS.annas, libgen: MIRRORS.libgen };
    }
    return { ok: false, annas: MIRRORS.annas, libgen: MIRRORS.libgen };
  }

  // ------------------------------------------------------------------ 1. Foulabook (Arabic, No CF)
  async function ensureFoulaToken() {
    if (MIRRORS.foulaToken && Date.now() - MIRRORS.foulaTokenAt < 10 * 60 * 1000) {
      return MIRRORS.foulaToken;
    }
    const r = await KTB.http('https://foulabook.com/ar/books');
    const m = String(r.body || '').match(/name="_token"\s+value="([^"]+)"/);
    if (m) {
      MIRRORS.foulaToken = m[1];
      MIRRORS.foulaTokenAt = Date.now();
    }
    return MIRRORS.foulaToken;
  }

  function parseFoulaCards(html) {
    const doc = parseDoc(html);
    const out = [];
    const seen = new Set();
    doc.querySelectorAll('figure').forEach((fig) => {
      const a = fig.querySelector('a[href*="/ar/book/"]');
      if (!a) return;
      const href = absUrl('https://foulabook.com', a.getAttribute('href'));
      if (seen.has(href)) return;
      seen.add(href);
      const img = fig.querySelector('img');
      const card = fig.parentElement;
      const h5 = card ? card.querySelector('h5 a, h4 a, .title a') : null;
      const authorEl = card ? card.querySelector('a[href*="/author/"], small, .author') : null;
      const title = (h5 && h5.textContent.trim()) || (img && img.getAttribute('alt')) || 'كتاب عربي';
      out.push(normBook({
        title,
        author: authorEl ? authorEl.textContent : '',
        cover: img ? absUrl('https://foulabook.com', img.getAttribute('src') || img.getAttribute('data-src')) : '',
        source: 'فولة بوك',
        sourceId: 'foulabook',
        lang: 'ar',
        format: 'pdf',
        url: href,
        needsResolve: true,
        resolverType: 'foulabook',
      }));
    });
    return out;
  }

  async function searchFoulabook(q) {
    const cleanQ = cleanSearchTitle(q) || q;
    const tok = await ensureFoulaToken();
    if (!tok) return [];
    const payload = '_token=' + encodeURIComponent(tok) + '&search=' + encodeURIComponent(cleanQ);
    let r = await KTB.http('https://foulabook.com/ar/searching', {
      method: 'POST',
      payload,
      headers: { Referer: 'https://foulabook.com/ar/books', Origin: 'https://foulabook.com' },
    });
    if (r.code === 419 || r.code === 403) {
      MIRRORS.foulaToken = '';
      const tok2 = await ensureFoulaToken();
      if (!tok2) return [];
      r = await KTB.http('https://foulabook.com/ar/searching', {
        method: 'POST',
        payload: '_token=' + encodeURIComponent(tok2) + '&search=' + encodeURIComponent(cleanQ),
        headers: { Referer: 'https://foulabook.com/ar/books', Origin: 'https://foulabook.com' },
      });
    }
    return parseFoulaCards(r.body).slice(0, 18);
  }

  async function browseFoulabook(url) {
    const r = await KTB.http(url || 'https://foulabook.com/ar/books');
    return parseFoulaCards(r.body).slice(0, 20);
  }

  async function resolveFoulabook(book) {
    const rawUrl = String((book && book.url) || '');
    const reqUrl = /[^\x00-\x7F]/.test(rawUrl) ? encodeURI(rawUrl) : rawUrl;
    const r = await KTB.http(reqUrl);
    const html = r.body || '';
    const m = html.match(/href="(https?:\/\/foulabook\.com\/book\/downloading\/[^"]+|\/book\/downloading\/[^"]+)"/i);
    const descM = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
    const imgM = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
    const pgM = html.match(/(?:عدد\s*الصفحات|الصفحات)\s*[:\-]?\s*(?:<[^>]+>\s*)*(\d{2,5})/i)
      || html.match(/(\d{2,5})\s*صفحة/i);
    const links = [];
    if (m) {
      links.push({
        label: 'تحميل مباشر PDF من فولة بوك',
        format: 'pdf',
        url: absUrl('https://foulabook.com', m[1]),
        referer: book.url,
      });
    }
    return {
      links,
      summary: descM ? descM[1] : book.summary,
      cover: imgM ? imgM[1] : book.cover,
      pages: pgM ? (pgM[1] || pgM[2] || '') : (book.pages || ''),
    };
  }

  // ------------------------------------------------------------------ 2. Alarabimag (Arabic, No CF)
  async function searchAlarabimag(q) {
    const r = await KTB.http('https://www.alarabimag.com/search/?q=' + encodeURIComponent(q));
    if (r.code !== 200) return [];
    const doc = parseDoc(r.body);
    const out = [];
    doc.querySelectorAll('article.search-card').forEach((art) => {
      const a = art.querySelector('h2 a, a.search-card-cover, a[href*="/books/"]');
      if (!a) return;
      const href = absUrl('https://www.alarabimag.com', a.getAttribute('href'));
      const img = art.querySelector('img');
      const title = (art.querySelector('h2') || a).textContent.trim() || (img && img.alt) || '';
      const authorEl = art.querySelector('a[href*="/author/"], .author');
      const pEl = art.querySelector('p');
      if (!title) return;
      out.push(normBook({
        title,
        author: authorEl ? authorEl.textContent : '',
        cover: img ? absUrl('https://www.alarabimag.com', img.getAttribute('src')) : '',
        source: 'مجلة الكتب العربية',
        sourceId: 'alarabimag',
        lang: 'ar',
        format: 'pdf',
        url: href,
        summary: pEl ? pEl.textContent : '',
        needsResolve: true,
        resolverType: 'alarabimag',
      }));
    });
    return out.slice(0, 18);
  }

  async function resolveAlarabimag(book) {
    const r1 = await KTB.http(book.url);
    const doc1 = parseDoc(r1.body);
    const dlPageA = doc1.querySelector('a[href*="/download/"][href*="-pdf"], a[href*="/download/"]');
    const links = [];
    if (dlPageA) {
      const dlPageUrl = absUrl('https://www.alarabimag.com', dlPageA.getAttribute('href'));
      const r2 = await KTB.http(dlPageUrl, { headers: { Referer: book.url } });
      const m = String(r2.body || '').match(/href="(\/download\/book\/\?b=[^"]+)"/);
      if (m) {
        links.push({
          label: 'تحميل PDF مباشر (مجلة العرب)',
          format: 'pdf',
          url: 'https://www.alarabimag.com' + m[1],
          referer: dlPageUrl,
        });
      }
    }
    return { links };
  }

  // ------------------------------------------------------------------ 3. Internet Archive (Arabic + Global + Hindawi + Waqfeya Index)
  function buildArchiveBookExpr(q) {
    const raw = String(q || '').trim();
    if (!raw || /\b(AND|OR|NOT)\b|[:()]/i.test(raw)) return raw;
    const plain = raw
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/[-_|—–:\/\\()\[\]{}"'«»،,.!?]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!plain) return raw;
    const stop = new Set(['pdf', 'epub', 'book', 'scribd', 'download', 'كتاب', 'تحميل', 'قراءة', 'مجانا', 'the', 'and', 'for', 'with', 'in', 'of', 'to', 'by']);
    const toks = plain.split(' ').filter(w => w.length >= 2 && !stop.has(w.toLowerCase()));
    if (toks.length >= 2) {
      const phrase = toks.slice(0, 3).join(' ');
      const andClause = toks.slice(0, 3).map(t => '"' + t.replace(/"/g, '') + '"').join(' AND ');
      return '("' + phrase.replace(/"/g, '') + '" OR (' + andClause + '))';
    }
    return '"' + plain.replace(/"/g, '') + '"';
  }

  async function searchArchive(q, opts) {
    const o = typeof opts === 'string'
      ? { arabicOnly: opts === 'ar', label: opts === 'ar' ? 'الأرشيف عربي' : 'Archive' }
      : (opts || {});
    const expr = buildArchiveBookExpr(q);
    let queryStr = 'mediatype:texts AND (' + expr + ') AND -collection:(journals OR newspapers)';
    if (o.rawQuery) queryStr = o.rawQuery;
    else if (o.collection) queryStr = 'mediatype:texts AND collection:(' + o.collection + ') AND (' + expr + ')';
    else if (o.arabicOnly) queryStr = 'mediatype:texts AND language:(Arabic OR ara) AND (' + expr + ')';
    if (!o.includeRestricted && !o.rawQuery) queryStr += ' AND -access-restricted-item:true';

    const u = 'https://archive.org/advancedsearch.php?q=' + encodeURIComponent(queryStr)
      + '&sort[]=' + encodeURIComponent(o.sort || 'downloads desc')
      + '&rows=' + (o.rows || 18)
      + '&output=json&fl[]=identifier,title,creator,downloads,year,language,description,imagecount';
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    let docs = [];
    try { docs = JSON.parse(r.body).response.docs || []; } catch (_) { return []; }

    return docs.map((d) => {
      const id = d.identifier;
      const author = Array.isArray(d.creator) ? d.creator.join('، ') : (d.creator || '');
      const desc = Array.isArray(d.description) ? d.description[0] : (d.description || '');
      return normBook({
        id: 'ia_' + (o.collection ? o.collection + '_' : '') + id,
        title: Array.isArray(d.title) ? d.title[0] : d.title,
        author,
        cover: o.collection === 'hindawi' || String(d.language || '').toLowerCase().includes('ara') || isArabicText(d.title)
          ? 'https://archive.org/services/img/' + encodeURIComponent(id)
          : 'https://archive.org/services/img/' + encodeURIComponent(id),
        source: o.label || (o.arabicOnly ? 'الأرشيف عربي' : 'أرشيف الكتب'),
        sourceId: 'archive',
        lang: (String(d.language || '').toLowerCase().includes('ara') || isArabicText(d.title)) ? 'ar' : 'en',
        year: d.year ? String(d.year) : '',
        pages: d.imagecount ? String(d.imagecount) : '',
        format: 'pdf',
        url: 'https://archive.org/details/' + encodeURIComponent(id),
        summary: desc,
        needsResolve: true,
        resolverType: 'archive',
        extra: { iaId: id, downloads: d.downloads || 0 },
      });
    }).filter(isGenuineBookItem);
  }

  async function resolveArchive(iaId, seedTitle, opts) {
    const o = opts || {};
    const r = await KTB.http('https://archive.org/metadata/' + encodeURIComponent(iaId) + '/files');
    if (r.code !== 200) return [];
    let files = [];
    try { files = JSON.parse(r.body).result || []; } catch (_) { return []; }
    let valid = files.filter((f) =>
      /\.(pdf|epub|azw3|mobi|fb2|cbz|txt)$/i.test(f.name || '')
      && !/preview|_bw\.pdf|_lcp\.|_encrypted\./i.test(f.name || '')
      && !f.private
    );
    if (seedTitle && valid.length > 2) {
      const cleanSeed = cleanSearchTitle(seedTitle);
      const sToks = stripSubjectTokens(cleanSeed);
      const distinctBooks = new Set(valid.map(f => normalizeText(cleanBookFileTags(f.name))));
      if (distinctBooks.size > 2) {
        const matched = valid.filter((f) => {
          const baseName = cleanBookFileTags(f.name);
          if (isStrictSameBook(seedTitle, baseName)) return true;
          const fnToks = coreTokens(baseName);
          if (!sToks.length || !fnToks.length) return false;
          const hits = sToks.filter(st => tokenMatches(st, '', fnToks)).length;
          return sToks.length === 1 ? (hits === 1 && fnToks.length <= 3) : (hits >= Math.ceil(sToks.length * 0.75));
        });
        if (matched.length) valid = matched;
        else if (distinctBooks.size > 4) return [];
      }
    }
    const prefFmt = (typeof window !== 'undefined' && window.__midadPrefFormat === 'epub') ? 'epub' : 'pdf';
    const fmtRank = o.preferCbz
      ? { cbz: 0, pdf: 1, epub: 2, azw3: 3, mobi: 4, fb2: 5, txt: 6 }
      : (prefFmt === 'epub'
        ? { epub: 0, azw3: 1, pdf: 2, mobi: 3, fb2: 4, cbz: 5, txt: 6 }
        : { pdf: 0, epub: 1, azw3: 2, mobi: 3, fb2: 4, cbz: 5, txt: 6 });
    const scoreArchiveFile = (f) => {
      const name = String(f.name || '').toLowerCase();
      const ea = name.split('.').pop();
      let sc = 100 - (fmtRank[ea] ?? 9) * 18;
      if (/_bw\.pdf|_text\.pdf|_abbyy|_djvu|_jp2|compressed|small|low[\s_-]?res|sample|preview/i.test(name)) sc -= 200;
      if (/original|digital|vector|epub3\.images|searchable|hq|high/i.test(name)) sc += 20;
      else if (/\.noimages\b/i.test(name)) sc -= 18;
      return sc;
    };
    valid.sort((a, b) => scoreArchiveFile(b) - scoreArchiveFile(a));
    return valid.slice(0, 6).map((f) => {
      const ext = String(f.name).split('.').pop().toLowerCase() || 'pdf';
      const mb = f.size ? (Number(f.size) / (1024 * 1024)).toFixed(1) + ' MB' : '';
      return {
        label: f.name + (mb ? ' (' + mb + ')' : ''),
        format: ext,
        size: mb,
        source: 'الأرشيف (Archive)',
        url: 'https://archive.org/download/' + encodeURIComponent(iaId) + '/' + encodeURIComponent(f.name),
        referer: 'https://archive.org/details/' + encodeURIComponent(iaId),
      };
    });
  }

  // ------------------------------------------------------------------ 4. Waqfeya (Islamic/Heritage + Archive cross-links)
  async function searchWaqfeya(q) {
    const [archiveWaq, r] = await Promise.all([
      withTimeout(searchArchive(q, {
        rawQuery: 'mediatype:texts AND (waqfeya OR collection:waqfeya OR identifier:FP* OR identifier:waq*) AND (' + q + ')',
        rows: 10,
        label: 'المكتبة الوقفية',
      }), 5000, []),
      withTimeout(KTB.http('https://waqfeya.net/books?search=' + encodeURIComponent(q)), 5000, { code: 0 }),
    ]);
    const books = [...(Array.isArray(archiveWaq) ? archiveWaq : [])];
    if (r && r.code === 200 && r.body) {
      const doc = parseDoc(r.body);
      const qToks = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const seen = new Set();
      doc.querySelectorAll('a[href^="/books/"]').forEach((a) => {
        const href = absUrl('https://waqfeya.net', a.getAttribute('href'));
        const txt = stripTags(a.textContent);
        if (!txt || seen.has(href)) return;
        if (qToks.length && !qToks.some(t => txt.toLowerCase().includes(t))) return;
        seen.add(href);
        const img = a.closest('div, article, li') ? a.closest('div, article, li').querySelector('img') : null;
        books.push(normBook({
          title: txt,
          cover: img ? img.getAttribute('src') : '',
          source: 'المكتبة الوقفية',
          sourceId: 'waqfeya',
          lang: 'ar',
          format: 'pdf',
          url: href,
          needsResolve: true,
          resolverType: 'waqfeya',
        }));
      });
    }
    return books.slice(0, 14);
  }

  async function resolveWaqfeya(book) {
    const r = await withTimeout(KTB.http(book.url), 6000, { code: 0, body: '' });
    const links = [];
    const html = String(r.body || '');
    const iaMatches = html.match(/https?:\/\/archive\.org\/details\/([A-Za-z0-9_.-]+)/g) || [];
    const iaResults = await Promise.all(
      Array.from(new Set(iaMatches)).slice(0, 2).map(u => resolveArchive(u.split('/details/')[1]).catch(() => []))
    );
    iaResults.forEach(files => links.push(...files));
    const directPdfs = html.match(/https?:\/\/[^"'\s\\<>]+\.pdf/gi) || [];
    for (const p of Array.from(new Set(directPdfs)).slice(0, 3)) {
      links.push({ label: 'تحميل PDF مباشر (الوقفية)', format: 'pdf', url: p, referer: book.url });
    }
    const pgM = html.match(/(?:عدد\s*الصفحات|الصفحات)\s*[:\-]?\s*(?:<[^>]+>\s*)*(\d{2,5})/i);
    return { links, pages: pgM ? pgM[1] : (book.pages || '') };
  }

  // Shared URL / mirror extractor for Qahwa 8 Gharb, Telegram channels, and HTML post fragments
  async function resolveCandidateUrls(urlList, opts) {
    const o = opts || {};
    const sourcePrefix = o.sourcePrefix || 'رابط مباشر';
    const referer = o.referer || '';
    const bookFmt = o.format || 'pdf';
    const out = [];
    const seen = new Set();

    const pushItem = (item) => {
      if (!item || !item.url || seen.has(item.url)) return;
      seen.add(item.url);
      out.push(item);
    };

    const mfQueue = [];
    const ydQueue = [];
    const iaQueue = [];
    const kpQueue = [];
    const fbQueue = [];

    for (const raw of (urlList || [])) {
      const u = typeof raw === 'string' ? raw : (raw && raw.url);
      const hintLabel = typeof raw === 'object' && raw ? (raw.label || '') : '';
      if (!u || /^#|^javascript:/i.test(u)) continue;
      if (/facebook\.com\/(groups|sharer|share)|twitter\.com\/intent|instagram\.com|youtube\.com|pinterest\.com|wa\.me|whatsapp\.com|\.(jpe?g|png|gif|webp|svg|css|js)(\?|$)/i.test(u)) continue;

      const drive = extractDriveDirectUrl(u);
      const dropbox = extractDropboxDirectUrl(u);
      if (drive) {
        pushItem({
          label: 'تحميل مباشر عبر Google Drive (' + bookFmt.toUpperCase() + ')',
          format: bookFmt,
          source: sourcePrefix + ' • Drive',
          url: drive,
          referer,
        });
      } else if (dropbox) {
        pushItem({
          label: 'تحميل مباشر عبر Dropbox (' + bookFmt.toUpperCase() + ')',
          format: bookFmt,
          source: sourcePrefix + ' • Dropbox',
          url: dropbox,
          referer,
        });
      } else if (/mediafire\.com\/(file|download)\//i.test(u)) {
        mfQueue.push(u);
      } else if (/(?:yadi\.sk|disk\.yandex\.(?:com|ru))\//i.test(u)) {
        ydQueue.push(u);
      } else if (/archive\.org\/details\//i.test(u)) {
        const iaId = (u.split('/details/')[1] || '').split(/[/?#]/)[0];
        if (iaId) iaQueue.push(iaId);
      } else if (/ketabpedia\.com/i.test(u)) {
        kpQueue.push(u);
      } else if (/foulabook\.com\/[a-z]+\/book\//i.test(u)) {
        fbQueue.push(u);
      } else if (/\.(pdf|epub|azw3|mobi|fb2|cbz)(\?|$)/i.test(u)) {
        const lm = u.toLowerCase().match(/\.(pdf|epub|azw3|mobi|fb2|cbz)(\?|$)/);
        const fmt = lm ? lm[1] : bookFmt;
        const cleanLbl = hintLabel && !/^(?:اضغط|للتحميل|تحميل)$/i.test(hintLabel) ? hintLabel : ('رابط مباشر (' + fmt.toUpperCase() + ')');
        pushItem({
          label: cleanLbl,
          format: fmt,
          source: sourcePrefix,
          url: u,
          referer,
        });
      }
    }

    const asyncTasks = [];
    mfQueue.slice(0, 2).forEach((u) => {
      asyncTasks.push(withTimeout(resolveMediaFireDirect(u), 4500, '').then((mfDirect) => {
        if (mfDirect) {
          pushItem({
            label: 'تحميل مباشر عبر MediaFire (' + bookFmt.toUpperCase() + ')',
            format: u.toLowerCase().includes('.epub') ? 'epub' : bookFmt,
            source: sourcePrefix + ' • MediaFire',
            url: mfDirect,
            referer: u,
          });
        }
      }));
    });
    ydQueue.slice(0, 2).forEach((u) => {
      asyncTasks.push(withTimeout(resolveYandexDiskDirect(u), 4500, '').then((ydDirect) => {
        if (ydDirect) {
          pushItem({
            label: 'تحميل مباشر عبر Yandex Disk (' + bookFmt.toUpperCase() + ')',
            format: bookFmt,
            source: sourcePrefix + ' • Yandex',
            url: ydDirect,
            referer: u,
          });
        }
      }));
    });
    iaQueue.slice(0, 2).forEach((iaId) => {
      asyncTasks.push(withTimeout(resolveArchive(iaId), 4500, []).then((iaFiles) => {
        iaFiles.forEach(f => pushItem(Object.assign({}, f, { source: sourcePrefix + ' -> الأرشيف' })));
      }));
    });
    kpQueue.slice(0, 2).forEach((u) => {
      asyncTasks.push(withTimeout(resolveKetabpedia(u), 4500, []).then((kp) => kp.forEach(pushItem)));
    });
    fbQueue.slice(0, 1).forEach((u) => {
      asyncTasks.push(withTimeout(resolveFoulabook({ url: u, title: o.title || '' }), 4500, { links: [] }).then((fb) => {
        (fb.links || []).forEach(l => pushItem(Object.assign({ source: sourcePrefix + ' -> فولة بوك' }, l)));
      }));
    });
    if (asyncTasks.length) await Promise.allSettled(asyncTasks);
    return out;
  }

  // ------------------------------------------------------------------ 4b. Qahwa 8 Gharb (https://8ghrb.com — Popular Arabic WP Library)
  function parse8gharbPostTitle(raw) {
    let txt = stripTags(raw)
      .replace(/^(?:تحميل|قراءة\s+و?تحميل|كتاب)\s+(?:وملخص\s+)?(?:كتاب\s+|رواية\s+)?/i, '')
      .replace(/\s*\bPDF\b\s*$/i, '')
      .trim();
    let author = '';
    const dashSplit = txt.split(/\s+[–—-]\s+/);
    if (dashSplit.length >= 2) {
      const last = dashSplit[dashSplit.length - 1].trim();
      if (last.length >= 3 && last.length <= 40 && !/^(?:الجزء|المجلد|pdf|\d+)$/i.test(last)) {
        author = last.replace(/^(?:للكاتب|تأليف|بقلم)\s+/i, '').trim();
        txt = dashSplit.slice(0, -1).join(' - ').trim();
      }
    } else {
      const mAuth = txt.match(/^(.*?)\s+(?:للكاتب|للمؤلف|تأليف|بقلم)\s+([^\n]+)$/);
      if (mAuth && mAuth[1] && mAuth[2]) {
        txt = mAuth[1].trim();
        author = mAuth[2].trim();
      }
    }
    return { title: txt || stripTags(raw), author };
  }

  async function search8gharb(q, opts) {
    const cleanQ = cleanSearchTitle(q) || q;
    if (!cleanQ) return [];
    const o = opts || {};
    const u = 'https://8ghrb.com/wp-json/wp/v2/posts?search=' + encodeURIComponent(cleanQ) + '&per_page=10&_embed';
    const r = await withTimeout(KTB.http(u, { timeoutMs: 4200, signal: o.signal, tag: o.tag || '' }), 7200, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    let posts = [];
    try { posts = JSON.parse(r.body); } catch (_) { return []; }
    if (!Array.isArray(posts)) return [];

    const out = [];
    for (const p of posts) {
      if (!p || !p.link) continue;
      const parsed = parse8gharbPostTitle((p.title && p.title.rendered) || '');
      if (!parsed.title) continue;

      let cover = '';
      try {
        const fm = p._embedded && p._embedded['wp:featuredmedia'] && p._embedded['wp:featuredmedia'][0];
        cover = (fm && (fm.source_url || (fm.media_details && fm.media_details.sizes && fm.media_details.sizes.medium && fm.media_details.sizes.medium.source_url))) || '';
      } catch (_) { }

      const bodyHtml = (p.content && p.content.rendered) || '';
      const rawUrls = [];
      let dlUrl = '';
      if (bodyHtml) {
        const doc = parseDoc(bodyHtml);
        doc.querySelectorAll('a[href]').forEach((a) => {
          const href = absUrl(p.link, a.getAttribute('href') || '');
          if (!href) return;
          rawUrls.push({ url: href, label: stripTags(a.textContent) });
          if (!dlUrl) {
            const drv = extractDriveDirectUrl(href);
            const dbx = extractDropboxDirectUrl(href);
            if (drv) dlUrl = drv;
            else if (dbx) dlUrl = dbx;
            else if (/book-shadow\.com\/files\/[^"'\s<>]+\.(pdf|epub|azw3|mobi)|\.(pdf|epub|azw3|mobi)(\?|$)/i.test(href)) dlUrl = href;
          }
        });
      }
      const pgM = bodyHtml.match(/(?:عدد\s*الصفحات|الصفحات)\s*[:\-]?\s*(\d{2,5})/);
      out.push(normBook({
        id: 'ghrb_' + p.id,
        title: parsed.title,
        author: parsed.author,
        cover,
        source: 'قهوة 8 غرب',
        sourceId: '8gharb',
        lang: isArabicText(parsed.title) ? 'ar' : 'en',
        year: p.date ? String(p.date).slice(0, 4) : '',
        pages: pgM ? pgM[1] : '',
        format: dlUrl.toLowerCase().includes('.epub') ? 'epub' : 'pdf',
        url: p.link,
        dlUrl,
        referer: p.link,
        summary: stripTags((p.excerpt && p.excerpt.rendered) || bodyHtml).slice(0, 320),
        needsResolve: true,
        resolverType: '8gharb',
        extra: { urls: rawUrls },
      }));
    }
    return out.slice(0, 10);
  }

  async function resolve8gharb(book) {
    const ex = book.extra || {};
    const urlEntries = Array.isArray(ex.urls) ? ex.urls.slice() : [];
    if (book.dlUrl && !urlEntries.some(e => (typeof e === 'string' ? e : e.url) === book.dlUrl)) {
      urlEntries.unshift({ url: book.dlUrl, label: 'تحميل PDF مباشر (قهوة 8 غرب)' });
    }
    let summary = book.summary || '';
    let cover = book.cover || '';
    let pages = cleanPagesCount(book.pages);

    // Resolve wp-json URLs immediately so slow book pages cannot cause 4s timeout losses
    const fastLinks = await resolveCandidateUrls(urlEntries, {
      sourcePrefix: 'قهوة 8 غرب',
      referer: book.url,
      format: book.format || 'pdf',
      title: book.title,
    });
    const needHtml = fastLinks.length < 2 || !summary || summary.length < 40 || !pages;
    if (book.url && needHtml) {
      const r = await withTimeout(KTB.http(book.url, { timeoutMs: fastLinks.length ? 2000 : 4500 }), fastLinks.length ? 2200 : 4800, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        const doc = parseDoc(r.body);
        const extraEntries = [];
        doc.querySelectorAll('.entry-content a[href], article a[href], a[href*="book-shadow.com"], a[href*="bookleaks.com"], a[href*="drive.google"], a[href*="mediafire"]').forEach((a) => {
          const href = absUrl(book.url, a.getAttribute('href') || '');
          if (href) extraEntries.push({ url: href, label: stripTags(a.textContent) });
        });
        if (!cover) {
          const og = doc.querySelector('meta[property="og:image"], img.wp-post-image');
          if (og) cover = absUrl(book.url, og.getAttribute('content') || og.getAttribute('src') || '');
        }
        if (!summary || summary.length < 40) {
          const art = doc.querySelector('.entry-content, article');
          if (art) summary = stripTags(art.textContent).slice(0, 420);
        }
        if (!pages) {
          const pgM = r.body.match(/(?:عدد\s*الصفحات|الصفحات)\s*[:\-]?\s*(?:<[^>]+>\s*)*(\d{2,5})/i);
          if (pgM) pages = cleanPagesCount(pgM[1]);
        }
        if (extraEntries.length) {
          const more = await resolveCandidateUrls(extraEntries, {
            sourcePrefix: 'قهوة 8 غرب',
            referer: book.url,
            format: book.format || 'pdf',
            title: book.title,
          });
          more.forEach((m) => { if (!fastLinks.some(x => x.url === m.url)) fastLinks.push(m); });
        }
      }
    }

    const links = fastLinks;
    if (!links.length && book.url) {
      links.push({
        label: 'فتح صفحة الكتاب على قهوة 8 غرب',
        format: book.format || 'pdf',
        kind: 'external',
        source: 'قهوة 8 غرب',
        url: book.url,
      });
    }
    return { links, summary, cover, pages };
  }

  // ------------------------------------------------------------------ 4c. Scribd (https://www.scribd.com)
  async function searchScribd(q) {
    const cleanQ = cleanSearchTitle(q) || q;
    if (!cleanQ) return [];
    const u = 'https://www.scribd.com/search/query?query=' + encodeURIComponent(cleanQ) + '&content_type=documents';
    const r = await withTimeout(KTB.http(u, {
      headers: {
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        Referer: 'https://www.scribd.com/search?query=' + encodeURIComponent(cleanQ),
      },
    }), 6000, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];

    let data = null;
    try { data = JSON.parse(r.body); } catch (_) { return []; }
    const docs = (data && data.results && data.results.documents && data.results.documents.content && data.results.documents.content.documents)
      || (data && data.documents)
      || [];
    if (!Array.isArray(docs)) return [];

    return docs.slice(0, 14).map((d) => {
      const readerUrl = absUrl('https://www.scribd.com', d.reader_url || d.url || d.doc_url || ('/document/' + d.id));
      const rawDl = d.downloadUrl || d.download_url || '';
      const dlPath = rawDl ? absUrl('https://www.scribd.com', rawDl) : '';
      const isUnlocked = Boolean(d.isUnlocked || d.is_unlocked || d.free_download);
      return normBook({
        id: 'scribd_' + (d.id || Math.random().toString(36).slice(2, 9)),
        title: d.title || '',
        author: (d.author && d.author.name) || '',
        cover: d.retina_image_url || d.image_url || '',
        source: 'Scribd',
        sourceId: 'scribd',
        lang: isArabicText((d.title || '') + ' ' + (d.description || '')) ? 'ar' : 'en',
        pages: d.pageCount ? String(d.pageCount) : '',
        format: 'pdf',
        url: readerUrl,
        dlUrl: isUnlocked ? dlPath : '',
        referer: readerUrl,
        summary: d.description || '',
        needsResolve: true,
        resolverType: 'scribd',
        extra: {
          scribdId: d.id,
          downloadUrl: dlPath,
          isUnlocked,
          isPremiumDownloadable: Boolean(d.isPremiumDownloadable),
        },
      });
    }).filter(isGenuineBookItem);
  }

  function extractScribdDocId(input) {
    const s = String(input || '').trim();
    const m = s.match(/(?:scribd\.com\/(?:document|doc|read|presentation|embeds)\/|scribd:\/\/|^)(\d{6,12})/i);
    return m ? m[1] : '';
  }

  async function resolveScribd(book) {
    const ex = book.extra || {};
    const docId = extractScribdDocId(ex.scribdId || book.url || '');
    const links = [];
    if (ex.isUnlocked && ex.downloadUrl) {
      links.push({
        label: 'تحميل مستند مفتوح من Scribd (PDF)',
        format: 'pdf',
        source: 'Scribd',
        url: ex.downloadUrl,
        referer: book.url,
        scribdId: docId,
      });
    }
    if (docId && book.url) {
      links.push({
        label: 'Scribd — قراءة فورية في مداد + حفظ في المكتبة',
        format: 'pdf',
        kind: 'scribd_reader',
        source: 'Scribd',
        scribdId: docId,
        requiresAccount: !ex.isUnlocked,
        url: book.url,
      });
    }
    if (typeof KTB !== 'undefined' && KTB.isAndroid && KTB.isAndroid() && book.url) {
      links.push({
        label: 'تحميل كامل النسخة من Scribd في الخلفية',
        format: 'pdf',
        kind: 'webview_dl',
        source: 'Scribd',
        scribdId: docId,
        requiresAccount: !ex.isUnlocked,
        url: book.url,
        dlScript: WEB_ENGINES && WEB_ENGINES.scribd ? WEB_ENGINES.scribd.dlScript : '',
      });
    }
    if (book.url && !docId) {
      links.push({
        label: 'قراءة عبر Scribd وحفظ في المكتبة',
        format: 'pdf',
        kind: 'external',
        source: 'Scribd',
        requiresAccount: !ex.isUnlocked,
        url: book.url,
      });
    }
    return { links, summary: book.summary, cover: book.cover, pages: book.pages };
  }

  // ------------------------------------------------------------------ 5. LibGen Multi-Mirror (No CF — Parallel Race)
  async function searchLibgen(q, opts) {
    const o = opts || {};
    function parseLibgenHtml(host, html) {
      const doc = parseDoc(html);
      const out = [];
      doc.querySelectorAll('table tr').forEach((tr) => {
        const adsA = tr.querySelector('a[href*="ads.php?md5="], a[href*="get.php?md5="]');
        if (!adsA) return;
        const tds = tr.querySelectorAll('td');
        if (tds.length < 7) return;
        const md5M = adsA.getAttribute('href').match(/md5=([0-9a-f]{32})/i);
        if (!md5M) return;
        const md5 = md5M[1].toLowerCase();
        const titleA = tds[0].querySelector('a[href*="edition.php"], a[title], a');
        const lBadge = tr.textContent.match(/\b[lc]\s+(\d{4,9})\b/);
        const cover = lBadge
          ? host + '/covers/' + (Math.floor(Number(lBadge[1]) / 1000) * 1000) + '/' + md5 + '.jpg'
          : '';
        const rawTitle = (titleA ? titleA.textContent : tds[0].textContent).replace(/\b[0-9X]{10,13}(?:;\s*)?/g, '').trim();
        const seriesA = tds[0].querySelector('a[href*="series.php"]');
        const fullTitle = (seriesA && !rawTitle.toLowerCase().includes(seriesA.textContent.trim().toLowerCase().slice(0, 10)))
          ? (seriesA.textContent.trim() + ' — ' + rawTitle)
          : rawTitle;
        const author = tds[1] ? tds[1].textContent.trim() : (tds[2] ? tds[2].textContent.trim() : '');
        const year = tds[3] ? tds[3].textContent.trim() : '';
        const lang = tds[4] ? tds[4].textContent.trim() : '';
        const pages = tds[5] ? tds[5].textContent.trim() : '';
        const size = tds[6] ? tds[6].textContent.trim() : '';
        const ext = (tds[7] ? tds[7].textContent.trim().toLowerCase() : 'pdf') || 'pdf';
        if (!['pdf', 'epub', 'mobi', 'djvu', 'azw3', 'cbz'].includes(ext)) return;

        const comicItem = ext === 'cbz' || o.topic === 'comics';
        const directHref = adsA.getAttribute('href') || '';
        const directGetUrl = /get\.php\?md5=/i.test(directHref) ? absUrl(host, directHref) : '';
        out.push(normBook({
          id: 'lg_' + md5 + '_' + ext,
          title: fullTitle,
          author,
          cover,
          source: comicItem ? 'LibGen Comics' : 'LibGen',
          sourceId: 'libgen',
          lang: lang.toLowerCase().includes('arab') || isArabicText(fullTitle) ? 'ar' : 'en',
          year,
          pages,
          size,
          format: ext,
          url: host + '/ads.php?md5=' + md5,
          dlUrl: directGetUrl,
          cat: comicItem ? 'comics_manga' : '',
          isComic: comicItem,
          needsResolve: true,
          resolverType: 'libgen',
          extra: { host, md5 },
        }));
      });
      return out.slice(0, 22);
    }

    const topicQ = o.topic === 'comics' ? '&topics%5B%5D=c' : '';
    const res = await firstNonEmpty(
      MIRRORS.libgen.slice(0, 3).map(host =>
        withTimeout(KTB.http(host + '/index.php?req=' + encodeURIComponent(q) + topicQ + '&res=25', { timeoutMs: 3500, signal: o.signal, tag: o.tag || '' }), 6000, { code: 0 })
          .then(r => (r.code === 200 && r.body && (r.body.includes('ads.php?md5=') || r.body.includes('get.php?md5='))) ? parseLibgenHtml(host, r.body) : [])
      )
    );
    return Array.isArray(res) ? res : [];
  }

  async function searchLibgenComics(q, opts) {
    return searchLibgen(q, Object.assign({}, opts || {}, { topic: 'comics' }));
  }

  async function resolveLibgen(book) {
    const hosts = Array.from(new Set([book.extra && book.extra.host, ...MIRRORS.libgen].filter(Boolean))).slice(0, 3);
    const md5 = book.extra && book.extra.md5;
    if (!md5) return { links: [] };
    const found = await firstNonEmpty(
      hosts.map(host =>
        withTimeout(KTB.http(host + '/ads.php?md5=' + md5), 5000, { code: 0 }).then((r) => {
          if (r.code !== 200 || !r.body) return null;
          const m = r.body.match(/href="([^"]*get\.php\?md5=[^"]+)"/i);
          if (!m) return null;
          const imgM = r.body.match(/src="([^"]*\/covers\/[^"]+)"/i);
          return {
            cover: imgM ? absUrl(host, imgM[1]) : book.cover,
            links: [{
              label: 'تحميل مباشر (' + (book.format || 'PDF').toUpperCase() + (book.size ? ' • ' + book.size : '') + ')',
              format: book.format || 'pdf',
              size: book.size || '',
              url: absUrl(host, m[1]),
              referer: host + '/ads.php?md5=' + md5,
            }],
          };
        })
      )
    );
    return found || { links: [] };
  }

  // ------------------------------------------------------------------ 6. Open Library (Search, Subjects, Trending)
  async function searchOpenLibrary(q) {
    const u = 'https://openlibrary.org/search.json?q=' + encodeURIComponent(q)
      + '&limit=18&fields=key,title,author_name,cover_i,first_publish_year,ia,ratings_average,number_of_pages_median,language';
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    let docs = [];
    try { docs = JSON.parse(r.body).docs || []; } catch (_) { return []; }
    return docs.map((d) => {
      const ia = Array.isArray(d.ia) && d.ia.length ? d.ia[0] : '';
      return normBook({
        id: 'ol_' + String(d.key || '').replace(/\W+/g, '_'),
        title: d.title,
        author: Array.isArray(d.author_name) ? d.author_name.slice(0, 2).join(', ') : '',
        cover: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : '',
        source: ia ? 'Open Library + IA' : 'Open Library',
        sourceId: 'openlibrary',
        lang: (Array.isArray(d.language) && d.language.includes('ara')) || isArabicText(d.title) ? 'ar' : 'en',
        year: d.first_publish_year || '',
        rating: d.ratings_average ? Number(d.ratings_average).toFixed(1) : '',
        pages: d.number_of_pages_median || '',
        format: ia ? 'pdf' : 'epub',
        url: 'https://openlibrary.org' + d.key,
        needsResolve: true,
        resolverType: 'openlibrary',
        extra: { olKey: d.key, iaId: ia },
      });
    });
  }

  async function subjectOpenLibrary(subject) {
    const r = await KTB.http('https://openlibrary.org/subjects/' + encodeURIComponent(subject) + '.json?limit=16');
    if (r.code !== 200) return [];
    let works = [];
    try { works = JSON.parse(r.body).works || []; } catch (_) { return []; }
    return works.map((w) => normBook({
      id: 'ol_' + String(w.key || '').replace(/\W+/g, '_'),
      title: w.title,
      author: Array.isArray(w.authors) ? w.authors.map(a => a.name).slice(0, 2).join(', ') : '',
      cover: w.cover_id ? 'https://covers.openlibrary.org/b/id/' + w.cover_id + '-L.jpg' : '',
      source: w.ia ? 'Open Library + IA' : 'Open Library',
      sourceId: 'openlibrary',
      lang: isArabicText(w.title) ? 'ar' : 'en',
      year: w.first_publish_year || '',
      format: 'epub',
      url: 'https://openlibrary.org' + w.key,
      needsResolve: true,
      resolverType: 'openlibrary',
      extra: { olKey: w.key, iaId: w.ia || '' },
    }));
  }

  async function resolveOpenLibrary(book) {
    const links = [];
    let summary = book.summary;
    const key = book.extra && book.extra.olKey;
    if (key) {
      const r = await KTB.http('https://openlibrary.org' + key + '.json');
      if (r.code === 200) {
        try {
          const j = JSON.parse(r.body);
          summary = typeof j.description === 'string' ? j.description : (j.description && j.description.value) || summary;
        } catch (_) { }
      }
    }
    if (book.extra && book.extra.iaId) {
      links.push(...await resolveArchive(book.extra.iaId));
    }
    return { links, summary };
  }

  // ------------------------------------------------------------------ 7. Project Gutenberg + Standard Ebooks + arXiv
  async function searchGutenberg(q) {
    const url = q
      ? 'https://www.gutenberg.org/ebooks/search/?query=' + encodeURIComponent(q)
      : 'https://www.gutenberg.org/browse/scores/top';
    const r = await KTB.http(url);
    if (r.code !== 200) return [];
    const doc = parseDoc(r.body);
    const out = [];
    doc.querySelectorAll('li.booklink').forEach((li) => {
      const a = li.querySelector('a.link[href*="/ebooks/"]');
      if (!a) return;
      const m = a.getAttribute('href').match(/\/ebooks\/(\d+)/);
      if (!m) return;
      const gid = m[1];
      const title = li.querySelector('.title') ? li.querySelector('.title').textContent.trim() : '';
      const sub = li.querySelector('.subtitle') ? li.querySelector('.subtitle').textContent.trim() : '';
      const img = li.querySelector('img');
      if (!title) return;
      out.push(normBook({
        id: 'pg_' + gid,
        title,
        author: sub,
        cover: img ? 'https://www.gutenberg.org/cache/epub/' + gid + '/pg' + gid + '.cover.medium.jpg' : '',
        source: 'Gutenberg',
        sourceId: 'gutenberg',
        lang: 'en',
        format: 'epub',
        url: 'https://www.gutenberg.org/ebooks/' + gid,
        dlUrl: 'https://www.gutenberg.org/ebooks/' + gid + '.epub3.images',
        needsResolve: false,
      }));
    });
    return out.slice(0, 14);
  }

  async function resolveYandexDiskDirect(publicUrl) {
    const api = 'https://cloud-api.yandex.net/v1/disk/public/resources/download?public_key=' + encodeURIComponent(publicUrl);
    const r = await KTB.http(api).catch(() => ({ code: 0, body: '' }));
    if (r.code !== 200 || !r.body) return '';
    try {
      const d = JSON.parse(r.body);
      return (d && d.href) ? String(d.href) : '';
    } catch (_) {
      return '';
    }
  }

  function parseOaiBitstreamBooks(jsonStr, hostBase, srcName, srcId) {
    try {
      const list = JSON.parse(jsonStr);
      if (!Array.isArray(list)) return [];
      const out = [];
      for (const item of list) {
        const meta = Array.isArray(item.metadata) ? item.metadata : [];
        const getMeta = (k) => {
          const hit = meta.find(m => m && m.key === k && m.value);
          return hit ? String(hit.value) : '';
        };
        const title = getMeta('dc.title') || item.name || '';
        if (!title) continue;
        const author = getMeta('dc.contributor.author') || getMeta('dc.creator') || '';
        const langRaw = (getMeta('dc.language.iso') || getMeta('dc.language') || 'en').toLowerCase();
        const summary = getMeta('dc.description.abstract') || getMeta('dc.description') || '';
        const handle = item.handle ? (hostBase + '/handle/' + item.handle) : '';
        const bitstreams = Array.isArray(item.bitstreams) ? item.bitstreams : [];
        const fileBs = bitstreams.find(bs => bs && /\.(pdf|epub)$/i.test(bs.name || ''))
          || bitstreams.find(bs => bs && /pdf|epub/i.test(bs.mimeType || ''));
        const dlUrl = fileBs && fileBs.retrieveLink ? (hostBase + fileBs.retrieveLink) : '';
        if (!dlUrl) continue;
        const fmt = /\.epub$/i.test((fileBs && fileBs.name) || '') || /epub/i.test((fileBs && fileBs.mimeType) || '') ? 'epub' : 'pdf';
        out.push(normBook({
          id: srcId + '_' + (item.uuid || item.id || Math.random().toString(36).slice(2, 8)),
          title,
          author,
          source: srcName,
          sourceId: srcId,
          lang: langRaw.startsWith('ar') || isArabicText(title) ? 'ar' : 'en',
          format: fmt,
          size: fileBs && fileBs.sizeBytes ? (fileBs.sizeBytes > 1048576 ? (fileBs.sizeBytes / 1048576).toFixed(1) + ' MB' : Math.round(fileBs.sizeBytes / 1024) + ' KB') : '',
          url: handle || dlUrl,
          dlUrl,
          summary,
        }));
      }
      return out.slice(0, 12);
    } catch (_) {
      return [];
    }
  }

  async function searchDoab(q) {
    const clean = cleanSearchTitle(q);
    if (!clean) return [];
    const u = 'https://directory.doabooks.org/rest/search?query=' + encodeURIComponent(clean) + '&limit=12&expand=metadata,bitstreams';
    const r = await withTimeout(KTB.http(u), 5500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    return parseOaiBitstreamBooks(r.body, 'https://directory.doabooks.org', 'DOAB مفتوح المصدر', 'doab');
  }

  async function searchOapen(q) {
    const clean = cleanSearchTitle(q);
    if (!clean) return [];
    const u = 'https://library.oapen.org/rest/search?query=' + encodeURIComponent(clean) + '&limit=10&expand=metadata,bitstreams';
    const r = await withTimeout(KTB.http(u), 5500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    return parseOaiBitstreamBooks(r.body, 'https://library.oapen.org', 'OAPEN الأكاديمية', 'oapen');
  }

  async function searchGutendex(q) {
    const clean = cleanSearchTitle(q);
    if (!clean) return [];
    const u = 'https://gutendex.com/books/?search=' + encodeURIComponent(clean);
    const r = await withTimeout(KTB.http(u), 5500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    try {
      const data = JSON.parse(r.body);
      const list = Array.isArray(data && data.results) ? data.results : [];
      const out = [];
      for (const b of list.slice(0, 12)) {
        const fmts = b.formats || {};
        const epubUrl = fmts['application/epub+zip'] || '';
        const pdfUrl = fmts['application/pdf'] || '';
        const dlUrl = pdfUrl || epubUrl;
        if (!dlUrl) continue;
        const auth = Array.isArray(b.authors) && b.authors[0] ? b.authors[0].name : '';
        const langs = Array.isArray(b.languages) ? b.languages : [];
        out.push(normBook({
          id: 'gdx_' + b.id,
          title: b.title || '',
          author: auth,
          cover: fmts['image/jpeg'] || '',
          source: 'Gutendex / Gutenberg',
          sourceId: 'gutendex',
          lang: langs.includes('ar') || isArabicText(b.title) ? 'ar' : 'en',
          format: pdfUrl ? 'pdf' : 'epub',
          url: 'https://www.gutenberg.org/ebooks/' + b.id,
          dlUrl,
        }));
      }
      return out;
    } catch (_) {
      return [];
    }
  }

  async function searchStandardEbooks(q) {
    const u = 'https://standardebooks.org/ebooks' + (q ? '?query=' + encodeURIComponent(q) : '');
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    const doc = parseDoc(r.body);
    const out = [];
    doc.querySelectorAll('ol.ebooks-list li[typeof="schema:Book"], li[about^="/ebooks/"]').forEach((li) => {
      const about = li.getAttribute('about') || '';
      const a = li.querySelector('a[href^="/ebooks/"]');
      const path = about || (a && a.getAttribute('href')) || '';
      if (!path) return;
      const parts = path.split('/').filter(Boolean);
      const slug = parts.slice(1).join('_');
      const img = li.querySelector('img');
      const titleEl = li.querySelector('[property="schema:name"], p a, .title');
      const authorEl = li.querySelector('[typeof="schema:Person"], .author');
      out.push(normBook({
        id: 'se_' + slug,
        title: titleEl ? titleEl.textContent : slug.replace(/-/g, ' '),
        author: authorEl ? authorEl.textContent : (parts[1] || '').replace(/-/g, ' '),
        cover: img ? absUrl('https://standardebooks.org', img.getAttribute('src')) : '',
        source: 'Standard Ebooks',
        sourceId: 'standard',
        lang: 'en',
        format: 'epub',
        url: 'https://standardebooks.org' + path,
        dlUrl: 'https://standardebooks.org' + path + '/downloads/' + slug + '.epub',
      }));
    });
    return out.slice(0, 12);
  }

  async function searchArxiv(q) {
    const u = 'https://export.arxiv.org/api/query?search_query=all:' + encodeURIComponent(q || 'artificial intelligence') + '&start=0&max_results=14';
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    const xml = new DOMParser().parseFromString(r.body, 'text/xml');
    const out = [];
    xml.querySelectorAll('entry').forEach((entry) => {
      const idText = (entry.querySelector('id') && entry.querySelector('id').textContent) || '';
      const arxId = idText.split('/abs/')[1] || '';
      if (!arxId) return;
      const authors = Array.from(entry.querySelectorAll('author name')).map(n => n.textContent.trim()).slice(0, 3).join(', ');
      const year = ((entry.querySelector('published') && entry.querySelector('published').textContent) || '').slice(0, 4);
      out.push(normBook({
        id: 'arx_' + arxId.replace(/\W+/g, '_'),
        title: entry.querySelector('title') ? entry.querySelector('title').textContent : arxId,
        author: authors,
        source: 'arXiv أبحاث',
        sourceId: 'arxiv',
        lang: 'en',
        year,
        format: 'pdf',
        url: idText,
        dlUrl: 'https://arxiv.org/pdf/' + arxId + '.pdf',
        summary: entry.querySelector('summary') ? entry.querySelector('summary').textContent : '',
      }));
    });
    return out;
  }

  // ------------------------------------------------------------------ 8. Apple Books Charts (Live Recommendations)
  async function getAppleCharts(country) {
    const cc = country || 'eg';
    const r = await KTB.http('https://rss.marketingtools.apple.com/api/v2/' + cc + '/books/top-free/20/books.json');
    if (r.code !== 200) return [];
    try {
      const list = JSON.parse(r.body).feed.results || [];
      return list.map((b) => normBook({
        id: 'ap_' + b.id,
        title: b.name,
        author: b.artistName,
        cover: String(b.artworkUrl100 || '').replace('100x100', '512x512'),
        source: cc === 'eg' ? 'الأفضل بمصر' : 'Apple Top',
        sourceId: 'apple',
        lang: isArabicText(b.name) ? 'ar' : 'en',
        year: String(b.releaseDate || '').slice(0, 4),
        format: 'epub',
        url: b.url,
        extra: { catalogOnly: true },
      }));
    } catch (_) {
      return [];
    }
  }

  // ------------------------------------------------------------------ 9. WebView Cloudflare-Bypass Sources (Android APK)
  const WEB_ENGINES = {
    hindawi: {
      name: 'مؤسسة هنداوي',
      searchUrl: (q) => 'https://www.hindawi.org/search/keyword/' + encodeURIComponent(q) + '/',
      extractJs: `(function(){
        var items=[]; document.querySelectorAll('article, .bookCover, li.book').forEach(function(el){
          var a=el.querySelector('a[href*="/books/"]'); if(!a) return;
          var img=el.querySelector('img'); var title=(el.querySelector('h2,h3,.title')||a).innerText.trim()||(img?img.alt:'');
          var auth=el.querySelector('.author, a[href*="/contributors/"]');
          if(title) items.push({title:title, author:auth?auth.innerText.trim():'', cover:img?img.src:'', url:a.href});
        }); return JSON.stringify(items.slice(0,16));
      })()`,
      dlScript: `document.querySelector('a[href$=".pdf"], a[href*="/pdf/"], a[href$=".epub"], a.downloadBtn')?.click();`,
    },
    noorbook: {
      name: 'مكتبة نور',
      searchUrl: (q) => 'https://www.noor-book.com/?search_for=' + encodeURIComponent(extractArabicSearchQuery(q) || q),
      extractJs: `(function(){
        var items=[], seen={};
        var pushA=function(a, card){
          if(!a||!a.href||seen[a.href]) return;
          var du=''; try{ du=decodeURIComponent(a.href||''); }catch(_){ du=a.href||''; }
          if(!du || /book_download|\\/(book\\/review|كتب-|tag|author|subscriptions|premium|upgrade|pubup|user\\/)/i.test(du)) return;
          if(!(/\\/(?:كتاب-|book\\/|(?:en\\/)?ebook-)/i.test(du))) return;
          var tEl=card?card.querySelector('h3,h2,.book-title,.title'):null;
          var img=card?card.querySelector('img'):null;
          var title=((tEl?tEl.innerText:'')||(a.innerText||'')||a.getAttribute('title')||(img?img.alt:'')||'').trim();
          if(!title || title.length<2 || /غير متاح|رابط الكتاب بالمكتبة|تحميل المباشر/i.test(title)) return;
          seen[a.href]=1;
          var auth=card?card.querySelector('a[href*="/كتب-"], a[href*="/%D9%83%D8%AA%D8%A8-"], .author'):null;
          var cov=img ? (img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('src')||'') : '';
          if(cov && cov.charAt(0)==='/') cov='https://www.noor-book.com'+cov;
          items.push({title:title, author:auth?auth.innerText.trim():'', cover:cov, url:a.href});
        };
        document.querySelectorAll('.book-restult, .book-rest, .product-item, .the_book, .book_box, article').forEach(function(card){
          var anchors=Array.from(card.querySelectorAll('a[href]'));
          var picked=null, rawTitle='';
          for(var i=0;i<anchors.length;i++){
            var a=anchors[i], du=''; try{ du=decodeURIComponent(a.href||''); }catch(_){ du=a.href||''; }
            if(!du || /book_download|\\/(book\\/review|كتب-|tag|author|pubup|subscriptions)/i.test(du)) continue;
            if(!(/\\/(كتاب-|book\\/|(?:en\\/)?ebook-)/i.test(du))) continue;
            var txt=(a.innerText||'').trim();
            if(/غير متاح|رابط الكتاب بالمكتبة/i.test(txt)) continue;
            if(!picked) picked=a;
            if(txt && txt.length>1){ picked=a; rawTitle=txt; break; }
            if(!rawTitle && a.getAttribute('title')) rawTitle=a.getAttribute('title').trim();
          }
          if(picked) pushA(picked, card);
        });
        if(items.length===0){
          document.querySelectorAll('a[href]').forEach(function(a){
            pushA(a, a.closest('div,li,article')||null);
          });
        }
        return JSON.stringify(items.slice(0,16));
      })()`,
      dlScript: '(' + (function () {
        var isAuthOpen = function () {
          return !!(
            document.querySelector('#sign_up.in, #sign_up.show, #sign_up[style*="block"], .modal.in .login_panel, .modal.show .login_panel') ||
            /\/(?:user\/(?:login|signup)|login|register)(?:[\/?#]|$)/i.test(location.pathname || '')
          );
        };
        if (isAuthOpen()) { window.__ktbNoorClickedUrl = ''; return; }
        if (window.__ktbDoneUrl === location.href && window.__ktbNoorIvRunning) return;
        if (window.__ktbNoorIv) { try { clearInterval(window.__ktbNoorIv); } catch (_) {} }
        window.__ktbDoneUrl = location.href;
        window.__ktbNoorNoMatch = 0;

        var badUrl = /\/(subscriptions|premium|upgrade|vip|pubup|user|login|register|signup|share|tag|author|report|contact|book\/review\/|quote\/download_quote_img)|twitter\.com|t\.me|telegram\.me|linkedin\.com|facebook\.com|whatsapp|pinterest/i;
        var isBad = function (el, h) {
          if (!el || !h || h === '#' || h.indexOf('javascript:') === 0) return true;
          if (el.closest && el.closest('#go_sub, .donation_panel')) return true;
          if (el.disabled || (el.classList && (el.classList.contains('disabled') || el.classList.contains('donate_now_btn') || el.classList.contains('close_download') || el.classList.contains('noor-btn-b4')))) return true;
          if (badUrl.test(h) || badUrl.test(el.href || '')) return true;
          return false;
        };

        var normAr = function (s) {
          return String(s || '')
            .toLowerCase()
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآ]/g, 'ا')
            .replace(/ى/g, 'ي')
            .replace(/ة/g, 'ه')
            .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        };

        var tryPickSearch = function () {
          if (location.href.indexOf('search_for=') < 0 || window.__ktbNoorSearchPicked) return false;
          var qNorm = normAr(window.__ktbTargetTitle || '');
          var stopRe = /^(?:كتاب|روايه|ديوان|مجموعه|قصه|في|من|عن|علي|الي|مع|او|the|and|of|in)$/;
          var rawToks = qNorm.split(' ').filter(function (w) { return w.length >= 2; });
          var qToks = rawToks.filter(function (w) { return !stopRe.test(w); });
          if (!qToks.length) qToks = rawToks;
          var aToks = normAr(window.__ktbTargetAuthor || '').split(' ').filter(function (w) { return w.length >= 3; });
          var cands = [], seenU = {};
          document.querySelectorAll('a[href]').forEach(function (a) {
            if (!a.href || seenU[a.href]) return;
            var du = '';
            try { du = decodeURIComponent(a.href || ''); } catch (_) { du = a.href || ''; }
            if (!du || /book_download|\/(book\/review|كتب-|tag|author|pubup|subscriptions)/i.test(du)) return;
            if (!(/\/(كتاب-|book\/|(?:en\/)?ebook-)/i.test(du))) return;
            var card = a.closest('.book-restult, .book-rest, .product-item, .the_book, .book_box, article');
            var hEl = card ? card.querySelector('h3,h2,.book-title,.title') : null;
            var img = a.querySelector('img') || (card ? card.querySelector('img') : null);
            var rawTitle = ((hEl ? hEl.innerText : '') || (a.innerText || '') || a.getAttribute('title') || (img ? img.alt : '') || '').trim();
            var cardTxt = card ? (card.innerText || '') : '';
            var fullTxt = (rawTitle + ' ' + cardTxt).trim();
            if (!rawTitle || /غير متاح|رابط الكتاب بالمكتبة/i.test(fullTxt)) return;
            seenU[a.href] = 1;
            cands.push({ a: a, nt: normAr(rawTitle), nd: normAr(du), nc: normAr(cardTxt) });
          });
          if (!cands.length) return false;
          var chosen = null;
          if (qToks.length) {
            var bestScore = -1;
            for (var k = 0; k < cands.length; k++) {
              var nt = cands[k].nt, nd = cands[k].nd, nc = cands[k].nc;
              var toks = nt.split(' ').filter(Boolean);
              var hitAll = qToks.every(function (w) {
                var st = w.replace(/^ال(?=[\u0600-\u06FFa-z0-9]{2,})/, '');
                return toks.some(function (tt) {
                  return tt === w || tt.replace(/^ال(?=[\u0600-\u06FFa-z0-9]{2,})/, '') === st;
                }) || nd.indexOf(w) >= 0 || (st.length >= 3 && nd.indexOf(st) >= 0);
              });
              if (!hitAll) continue;
              var sc = 10;
              if (nt === qNorm) sc += 100;
              else if (nt.indexOf(qNorm) === 0) sc += 60;
              if (qToks.length === 1 && toks.length > 1 && toks[0] !== qToks[0] && toks[0].replace(/^ال/, '') !== qToks[0].replace(/^ال/, '')) sc -= 30;
              if (toks.length <= qToks.length + 2) sc += 20;
              if (aToks.length && nc) {
                var aHits = 0;
                for (var ai = 0; ai < aToks.length; ai++) { if (nc.indexOf(aToks[ai]) >= 0) aHits++; }
                if (aHits > 0) sc += 25;
              }
              if (sc > bestScore) { bestScore = sc; chosen = cands[k].a; }
            }
          } else {
            chosen = cands[0].a;
          }
          if (!chosen) {
            window.__ktbNoorNoMatch = 1;
            return false;
          }
          window.__ktbNoorSearchPicked = 1;
          try { chosen.removeAttribute('target'); } catch (_) {}
          chosen.click();
          return true;
        };

        var tryClick = function () {
          if (window.__ktbNoorDone) return true;
          var list = [];
          var sel = 'a[href*="/book/internal_download/"], a[href*="/book/internal_download"], a[href*="/downloading/"], a[href*="/download_file"], a[href*="book_download"], a[href$=".pdf"], a[href$=".epub"]';
          if (!document.getElementById('go_sub')) {
            sel += ', #downloadModal a.btn[href], .download-body a.btn[href], #downloadModal a.btn-primary[href*="download"], #downloadModal a.btn-success[href*="download"], .download-body a[href], #downloadModal a[href], .download-box a[href], button[onclick*="internal_download"], button[onclick*="download"]';
          }
          document.querySelectorAll(sel).forEach(function (a) { list.push(a); });
          for (var i = 0; i < list.length; i++) {
            var dl = list[i];
            if (!dl || dl.disabled || (dl.classList && dl.classList.contains('disabled'))) continue;
            var dh = (dl.getAttribute('href') || '').trim();
            if (dl.tagName !== 'BUTTON' && isBad(dl, dh)) continue;
            var absDh = dl.href || dh || (dl.getAttribute('onclick') || '');
            if (!absDh || window.__ktbNoorClickedHref === absDh) continue;
            window.__ktbNoorClickedHref = absDh;
            window.__ktbNoorDone = 1;
            try { dl.removeAttribute('target'); } catch (_) {}
            dl.click();
            return true;
          }
          return false;
        };

        var skipNoorTimer = function () {
          if (typeof window.the_time === 'number' && window.the_time > 0) {
            window.the_time = 0;
          }
          var modalEl = document.querySelector('#downloadModal.in, #downloadModal.show, #downloadModal[style*="block"], .download-body');
          if (modalEl && typeof window.go_gownload === 'function') {
            var now = Date.now();
            if (now - (window.__ktbLastGoAt || 0) > 850) {
              window.__ktbLastGoAt = now;
              try { window.go_gownload(); } catch (_) {}
            }
          }
        };

        var triggerTimer = function () {
          var u = location.href || '';
          if (/\/(subscriptions|premium|upgrade|vip|pubup|book\/review\/)|search_for=/i.test(u)) return;
          if (isAuthOpen()) { window.__ktbNoorClickedUrl = ''; return; }
          var modalOpen = !!document.querySelector('#downloadModal.in, #downloadModal.show, #downloadModal[style*="block"]');
          if (!modalOpen && !(window.__ktbNoorClickedUrl === u && (window.clicked === true || (Date.now() - (window.__ktbNoorClickedAt || 0) < 7000)))) {
            if (typeof is_logged_replied !== 'undefined' && !is_logged_replied) return;
            var b = document.querySelector('a[onclick*="set_download_timer"], button[onclick*="set_download_timer"], a.download-btn.noor-btn-b2, a[href*="book_download"], a#download_btn, #download_btn, a.download_book, #download_circle, a[href*="#downloadModal"]');
            if (b && !b.disabled && !(b.classList && (b.classList.contains('disabled') || b.classList.contains('noor-btn-b4')))) {
              if (!(b.closest && b.closest('#go_sub, .donation_panel'))) {
                var bh = (b.getAttribute('href') || '').trim();
                var bhOk = !(bh && bh !== '#' && bh.indexOf('#downloadModal') < 0 && badUrl.test(bh)) &&
                           !(bh && bh !== '#' && bh.indexOf('javascript:') === 0 && !b.getAttribute('onclick'));
                if (bhOk) {
                  window.__ktbNoorClickedUrl = u;
                  window.__ktbNoorClickedAt = Date.now();
                  b.click();
                }
              }
            }
          }
          skipNoorTimer();
        };

        if (tryPickSearch()) return;
        if (tryClick()) return;
        triggerTimer();
        if (tryClick()) return;

        window.__ktbNoorIvRunning = true;
        var tries = 0;
        window.__ktbNoorIv = setInterval(function () {
          tries++;
          if (tryPickSearch() || tryClick()) {
            clearInterval(window.__ktbNoorIv);
            window.__ktbNoorIvRunning = false;
            return;
          }
          triggerTimer();
          if (tryClick() || tries > 1100) {
            clearInterval(window.__ktbNoorIv);
            window.__ktbNoorIvRunning = false;
          }
        }, 110);
      }).toString() + ')()',
    },
    kotobati: {
      name: 'كتبي',
      searchUrl: (q) => 'https://www.kotobati.com/search/result?s=' + encodeURIComponent(q),
      extractJs: `(function(){
        var items=[], seen={}; document.querySelectorAll('.book-teaser, article, .book-card').forEach(function(el){
          var a=el.querySelector('a[href*="/book/"]'); if(!a||seen[a.href]) return; seen[a.href]=1;
          var img=el.querySelector('img'); var title=(el.querySelector('h3,h2,.title')||a).innerText.trim();
          var auth=el.querySelector('a[href*="/author/"]');
          if(title) items.push({title:title, author:auth?auth.innerText.trim():'', cover:img?(img.getAttribute('data-src')||img.src):'', url:a.href});
        }); return JSON.stringify(items.slice(0,16));
      })()`,
      dlScript: `(function(){ var b=document.querySelector('a[href*="/download/"], a.download, a[href$=".pdf"], a[href*="/dl/"]'); if(b) b.click(); })()`,
    },
    oceanofpdf: {
      name: 'OceanofPDF',
      searchUrl: (q) => 'https://oceanofpdf.com/?s=' + encodeURIComponent(q),
      extractJs: `(function(){
        var items=[]; document.querySelectorAll('article.post').forEach(function(el){
          var a=el.querySelector('h2.entry-title a, a'); if(!a) return;
          var img=el.querySelector('img');
          items.push({title:a.innerText.trim(), cover:img?(img.getAttribute('data-src')||img.src):'', url:a.href});
        }); return JSON.stringify(items.slice(0,16));
      })()`,
      dlScript: `(function(){ var f=document.querySelector('form[action*="Fetching_Resource"], input[src*="pdf"], input[src*="epub"]'); if(f&&f.tagName==='INPUT') f.click(); else if(f&&f.submit) f.submit(); })()`,
    },
    annas: {
      name: "Anna's Archive",
      searchUrl: (q) => MIRRORS.annas[0] + '/search?q=' + encodeURIComponent(q),
      extractJs: `(function(){
        var items=[], seen={}; document.querySelectorAll('a[href^="/md5/"]').forEach(function(a){
          if(seen[a.href]) return; seen[a.href]=1;
          var box=a.closest('div'); var img=box?box.querySelector('img'):null;
          var h3=a.querySelector('h3')||a; var title=h3.innerText.trim();
          if(title) items.push({title:title, author:'', cover:img?img.src:'', url:a.href});
        }); return JSON.stringify(items.slice(0,18));
      })()`,
      dlScript: `(function(){ var a=document.querySelector('a[href*="/slow_download/"], a[href*="libgen"]'); if(a) a.click(); })()`,
    },
    scribd: {
      name: 'Scribd',
      searchUrl: (q) => 'https://www.scribd.com/search?query=' + encodeURIComponent(q) + '&content_type=documents',
      extractJs: `(function(){
        var items=[], seen={}; document.querySelectorAll('a[href*="/document/"], a[href*="/book/"]').forEach(function(a){
          if(!a.href||seen[a.href]) return;
          var box=a.closest('li, article, div'); var img=box?box.querySelector('img'):null;
          var title=(a.getAttribute('aria-label')||a.innerText||'').trim();
          if(title && title.length>2){ seen[a.href]=1; items.push({title:title, author:'', cover:img?img.src:'', url:a.href}); }
        }); return JSON.stringify(items.slice(0,16));
      })()`,
      dlScript: `(function(){
        if(window.__ktbDoneUrl===location.href) return;
        window.__ktbDoneUrl=location.href;
        var step=function(){
          if(location.pathname.indexOf('/search')===0 && !window.__ktbScribdSearchPicked){
            var s=document.querySelector('a[href*="/document/"], a[href*="/doc/"], a[href*="/book/"]');
            if(s && s.href){ window.__ktbScribdSearchPicked=1; try{s.removeAttribute('target');}catch(_){} s.click(); return true; }
          }
          var m=document.querySelector('[data-e2e="modal-download-button"], [data-e2e="download-dialog-download-button"], [role="dialog"] [data-e2e*="download"], .download_modal button.download_btn, a[href*="/document_downloads/"]');
          if(m && !m.disabled && !window.__ktbScribdM){ window.__ktbScribdM=1; try{m.removeAttribute('target');}catch(_){} m.click(); return true; }
          var b=document.querySelector('[data-e2e="mobile-toolbar-download-button"], [data-e2e="download-button"], [data-e2e="document-download-button"], button[data-e2e="document-actions-download"], button[aria-label*="Download"], button[aria-label*="تنزيل"], button[aria-label*="تحميل"], button.download_btn');
          if(b && !b.disabled && !window.__ktbScribdB){ window.__ktbScribdB=1; try{b.removeAttribute('target');}catch(_){} b.click(); }
          return false;
        };
        if(step()) return;
        var tries=0, iv=setInterval(function(){
          tries++;
          if(step() || tries>28) clearInterval(iv);
        }, 400);
      })()`,
    },
    tg_bot: {
      name: 'بوت تيليجرام المباشر',
      searchUrl: (q, botHandle) => 'https://web.telegram.org/k/#@' + sanitizeTelegramHandle(botHandle || 'GedoLibrary_bot'),
      dlScript: '(' + (function () {
        if (window.__ktbTgUrl === location.href && window.__ktbTgIvRunning) return;
        if (window.__ktbTgIv) { try { clearInterval(window.__ktbTgIv); } catch (_) {} }
        window.__ktbTgUrl = location.href;
        window.__ktbTgIvRunning = true;
        window.__ktbTgSent = 0;
        window.__ktbTgBaseBubbles = 0;
        window.__ktbTgClickedBtns = window.__ktbTgClickedBtns || {};
        window.__ktbTgDocClicked = 0;

        var normAr = function (s) {
          return String(s || '').toLowerCase()
            .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
            .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
            .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
        };

        var query = String(window.__ktbTargetTitle || '').trim();
        var prefFmt = String(window.__ktbPrefFmt || 'pdf').toLowerCase();
        var qToks = normAr(query).split(' ').filter(function (w) { return w.length >= 2; });
        var skipBtnRe = /اشترك|انضم|قناة|القناة|subscribe|join|channel|support|دعم|رجوع|السابق|back|close|إغلاق/i;

        var sendQuery = function () {
          if (window.__ktbTgSent || !query) return false;
          var inp = document.querySelector('.input-message-input[contenteditable="true"], div.input-message-input');
          if (!inp) return false;
          window.__ktbTgBaseBubbles = document.querySelectorAll('.bubble').length;
          inp.focus();
          inp.textContent = query;
          try {
            inp.dispatchEvent(new InputEvent('input', { bubbles: true, data: query, inputType: 'insertText' }));
          } catch (_) {
            inp.dispatchEvent(new Event('input', { bubbles: true }));
          }
          setTimeout(function () {
            var sendBtn = document.querySelector('.btn-send, button.send, .btn-circle.btn-send');
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
            } else {
              inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
            }
          }, 160);
          window.__ktbTgSent = 1;
          return true;
        };

        var processReplies = function () {
          if (!window.__ktbTgSent || window.__ktbTgDocClicked) return true;
          var bubbles = Array.from(document.querySelectorAll('.bubble'));
          if (bubbles.length <= window.__ktbTgBaseBubbles) return false;
          var fresh = bubbles.slice(window.__ktbTgBaseBubbles);

          for (var i = fresh.length - 1; i >= 0; i--) {
            var b = fresh[i];
            if (b.classList.contains('is-out')) continue;
            var docBox = b.querySelector('.document, .message-document, .document-container');
            if (docBox) {
              var docBtn = docBox.querySelector('.document-ico, .document-download, button, a') || docBox;
              if (docBtn) {
                try { if (query) document.title = query; } catch (_) {}
                window.__ktbTgDocClicked = 1;
                docBtn.click();
                return true;
              }
            }
          }

          var best = null;
          var bestScore = -1;
          for (var j = fresh.length - 1; j >= 0; j--) {
            var mb = fresh[j];
            if (mb.classList.contains('is-out')) continue;
            mb.querySelectorAll('.reply-markup-button, button.reply-markup-button').forEach(function (btn, idx) {
              if (btn.tagName === 'A' && btn.href && !btn.href.startsWith('javascript:')) return;
              var txt = (btn.innerText || '').trim();
              if (!txt || skipBtnRe.test(txt)) return;
              var sig = j + '|' + idx + '|' + txt;
              if (window.__ktbTgClickedBtns[sig]) return;
              var nt = normAr(txt);
              var sc = 0;
              for (var k = 0; k < qToks.length; k++) {
                if (nt.indexOf(qToks[k]) >= 0) sc += 30;
              }
              if (nt.indexOf(prefFmt) >= 0) sc += 25;
              else if (nt.indexOf('pdf') >= 0) sc += 18;
              else if (nt.indexOf('epub') >= 0) sc += 14;
              if (/تحميل|كتاب|نسخة|download/i.test(txt)) sc += 12;
              if (/^[1-5](?:\s|$|[.)\-])/.test(txt)) sc += 8;
              if (sc > bestScore) { bestScore = sc; best = { btn: btn, sig: sig }; }
            });
            if (best) break;
          }
          if (best) {
            window.__ktbTgClickedBtns[best.sig] = 1;
            best.btn.click();
          }
          return false;
        };

        var tries = 0;
        window.__ktbTgIv = setInterval(function () {
          tries++;
          if (!window.__ktbTgSent) sendQuery();
          else if (processReplies() || tries > 220) {
            clearInterval(window.__ktbTgIv);
            window.__ktbTgIvRunning = false;
          }
        }, 420);
      }).toString() + ')()',
    },
  };

  function pickBestCandidate(items, q, seedAuthor, altEngTitle) {
    if (!Array.isArray(items) || !items.length) return null;
    const sAuth = seedAuthor || '';
    const altEng = altEngTitle || '';
    const matched = items
      .filter(c => c && isStrictSameBook(q, c.title, sAuth, c.author, altEng) && scoreSearchRelevance(q, c, sAuth, altEng) >= 55)
      .sort((a, b) => scoreSearchRelevance(q, b, sAuth, altEng) - scoreSearchRelevance(q, a, sAuth, altEng));
    return matched[0] || null;
  }

  const fastNoorSearchCache = new Map();

  async function tryFastNoorSearchHttp(title, author, altEngTitle) {
    const q = extractArabicSearchQuery(title, author) || cleanSearchTitle(title, author) || String(title || '').trim();
    if (!q || q.length < 2) return null;
    const ck = normalizeText(q);
    const hit = fastNoorSearchCache.get(ck);
    if (hit && (Date.now() - hit.at) < 1000 * 60 * 15) return hit.val;

    const searchUrl = WEB_ENGINES.noorbook.searchUrl(q);
    const r = await withTimeout(
      KTB.http(searchUrl, { timeoutMs: 2500, priority: 'high', tag: 'modal' }),
      2800,
      { code: 0, body: '' }
    );
    if (!r || r.code !== 200 || !r.body || r.body.length < 800 || /cf-turnstile|just a moment/i.test(r.body)) {
      return null;
    }
    try {
      const doc = parseDoc(r.body);
      const items = [];
      const seen = new Set();
      doc.querySelectorAll('.book-restult, .book-rest, .product-item, .the_book, .book_box, article').forEach((card) => {
        const anchors = Array.from(card.querySelectorAll('a[href]'));
        for (const a of anchors) {
          const href = absUrl(searchUrl, a.getAttribute('href') || '');
          let du = href;
          try { du = decodeURIComponent(href); } catch (_) { }
          if (!du || seen.has(href) || /book_download|\/(book\/review|كتب-|tag|author|pubup|subscriptions)/i.test(du)) continue;
          if (!/\/(?:كتاب-|book\/|(?:en\/)?ebook-)/i.test(du)) continue;
          const tEl = card.querySelector('h3,h2,.book-title,.title');
          const rawT = stripTags((tEl && tEl.textContent) || a.textContent || a.getAttribute('title') || '');
          if (!rawT || rawT.length < 2 || /غير متاح|رابط الكتاب بالمكتبة/i.test(rawT)) continue;
          seen.add(href);
          const authEl = card.querySelector('a[href*="/كتب-"], .author');
          const img = card.querySelector('img');
          const cov = img ? absUrl(searchUrl, img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('src') || '') : '';
          items.push(normBook({
            title: rawT,
            author: authEl ? stripTags(authEl.textContent) : '',
            cover: cov,
            url: href,
            source: 'مكتبة نور',
            sourceId: 'noorbook',
            lang: 'ar',
            format: 'pdf',
            resolverType: 'web_noorbook',
          }));
          break;
        }
      });
      const picked = pickBestCandidate(items, title || q, author, altEngTitle || '');
      if (picked && picked.url) {
        fastNoorSearchCache.set(ck, { at: Date.now(), val: picked });
        return picked;
      }
    } catch (_) { }
    return null;
  }

  async function webSearchAndDownload(engineId, title, opts) {
    const o = opts || {};
    const eng = WEB_ENGINES[engineId];
    if (!eng || !KTB.isAndroid()) return { ok: false, error: 'android_only', links: [] };
    const q = engineId === 'noorbook'
      ? (extractArabicSearchQuery(title, o.author) || cleanSearchTitle(title, o.author) || title || '')
      : (cleanSearchTitle(title, o.author) || title || '');
    const engPart = String(title || '').includes('—') ? String(title).split('—').slice(1).join(' ').trim() : '';
    const altEngTitle = o.altEngTitle || o.altTitle || (engPart && !isArabicText(engPart) ? engPart : '');
    const tryMirrorFallback = async (errCode, extra) => {
      if (o.skipMirrorFallback || errCode === 'cancelled') {
        return Object.assign({ ok: false, error: errCode || 'no_direct_dl', links: [] }, extra || {});
      }
      const mirrorTitle = engineId === 'noorbook' ? q : (title || q);
      const mirrorLang = engineId === 'noorbook' ? 'ar' : o.lang;
      let mirrorLinks = await withTimeout(findDirectMirrorsForTelegramDoc(mirrorTitle, '', mirrorLang, o.author), 5500, []);
      if (engineId === 'noorbook' && Array.isArray(mirrorLinks)) {
        mirrorLinks = mirrorLinks.filter(l => {
          if (!l || !l.url) return false;
          if (/gutenberg|standardebooks/i.test(l.url)) return false;
          const metaTxt = (l.label || '') + ' ' + (l.source || '') + ' ' + (function (u) { try { return decodeURIComponent(u); } catch (_) { return u; } })(l.url);
          return isArabicText(metaTxt);
        });
      }
      if (mirrorLinks && mirrorLinks.length) {
        return Object.assign({
          ok: true,
          picked: (extra && extra.picked) || { title: q, url: (extra && extra.pageUrl) || o.bookUrl || '' },
          links: mirrorLinks,
          fromMirrorFallback: true,
        }, extra || {});
      }
      return Object.assign({ ok: false, error: errCode || 'no_direct_dl', links: [] }, extra || {});
    };

    const resolveMs = engineId === 'noorbook' ? 210000 : 24000;
    if (o.bookUrl) {
      const directRes = await withTimeout(resolveWebEngine(engineId, { url: o.bookUrl, format: o.format || 'pdf', title: q, author: o.author || '' }, { interactive: true }), resolveMs, { links: [], error: 'timeout' });
      if (directRes && directRes.links && directRes.links.length) {
        return { ok: true, picked: { title: q, url: o.bookUrl }, links: directRes.links };
      }
      return await tryMirrorFallback((directRes && directRes.error) || 'no_direct_dl', { pageUrl: o.bookUrl });
    }
    let picked = null;

    if (engineId === 'scribd') {
      const sItems = await withTimeout(searchScribd(q), 6500, []);
      picked = pickBestCandidate(sItems, title || q, o.author, altEngTitle);
      if (!picked && altEngTitle) {
        const sAlt = await withTimeout(searchScribd(altEngTitle), 5500, []);
        picked = pickBestCandidate(sAlt, altEngTitle, o.author, '');
      }
      if (picked && picked.extra && picked.extra.isUnlocked && picked.extra.downloadUrl) {
        return {
          ok: true,
          picked,
          links: [{
            label: 'رابط مباشر عبر محرك Scribd',
            format: 'pdf',
            url: picked.extra.downloadUrl,
            referer: picked.url || 'https://www.scribd.com/',
          }],
        };
      }
      if (picked && picked.url) {
        const res = await withTimeout(resolveWebEngine('scribd', picked, { interactive: true }), resolveMs, { links: [], error: 'timeout' });
        if (res && res.links && res.links.length) {
          return { ok: true, picked, links: res.links };
        }
        return await tryMirrorFallback((res && res.error) || 'no_direct_dl', { picked, pageUrl: picked.url });
      }
      return await tryMirrorFallback('not_found');
    }

    if (engineId === 'noorbook') {
      const fastPicked = await tryFastNoorSearchHttp(title || q, o.author, altEngTitle);
      const targetNoorUrl = (fastPicked && fastPicked.url) ? fastPicked.url : eng.searchUrl(q);
      const searchPageRes = await withTimeout(
        resolveWebEngine('noorbook', { url: targetNoorUrl, format: o.format || 'pdf', title: (fastPicked && fastPicked.title) || q, author: (fastPicked && fastPicked.author) || o.author || '' }, { interactive: true }),
        resolveMs,
        { links: [], error: 'timeout' }
      );
      if (searchPageRes && searchPageRes.links && searchPageRes.links.length) {
        return {
          ok: true,
          picked: fastPicked || { title: q, url: searchPageRes.links[0].referer || targetNoorUrl },
          links: searchPageRes.links,
        };
      }
      if (searchPageRes && searchPageRes.error === 'cancelled') {
        return { ok: false, error: 'cancelled', links: [] };
      }
      return await tryMirrorFallback((searchPageRes && searchPageRes.error) || 'not_found', { pageUrl: targetNoorUrl });
    }

    const searchMs = 16000;
    const sr = await withTimeout(searchWebEngine(engineId, q), searchMs, { error: 'timeout', items: [] });
    if (sr && sr.error === 'cancelled') {
      return { ok: false, error: 'cancelled', links: [] };
    }
    if (sr && Array.isArray(sr.items) && sr.items.length) {
      picked = pickBestCandidate(sr.items, title || q, o.author, altEngTitle);
      if (picked && picked.url) {
        const res = await withTimeout(resolveWebEngine(engineId, picked, { interactive: true }), resolveMs, { links: [], error: 'timeout' });
        if (res && res.links && res.links.length) {
          return { ok: true, picked, links: res.links };
        }
        return await tryMirrorFallback((res && res.error) || 'no_direct_dl', { picked, pageUrl: picked.url });
      }
    }

    return await tryMirrorFallback((sr && sr.error) || 'not_found');
  }

  async function searchWebEngine(engineId, q) {
    const eng = WEB_ENGINES[engineId];
    if (!eng) return { error: 'unknown', items: [] };
    if (!KTB.isAndroid()) return { error: 'android_only', items: [] };
    const r = await KTB.solveWeb(eng.searchUrl(q), 'eval', eng.extractJs);
    if (!r || !r.ok) return { error: (r && r.error) || 'blocked', items: [] };
    let arr = [];
    try { arr = JSON.parse(r.result || '[]'); } catch (_) { }
    const items = arr.map((x) => normBook({
      title: x.title,
      author: x.author,
      cover: x.cover,
      source: eng.name,
      sourceId: engineId,
      lang: ['hindawi', 'noorbook', 'kotobati'].includes(engineId) ? 'ar' : (isArabicText(x.title) ? 'ar' : 'en'),
      format: engineId === 'oceanofpdf' ? 'epub' : 'pdf',
      url: x.url,
      needsResolve: true,
      resolverType: 'web_' + engineId,
    }));
    return { error: null, items };
  }

  async function resolveWebEngine(engineId, book, opts) {
    const eng = WEB_ENGINES[engineId];
    if (!eng || !KTB.isAndroid()) return { links: [], error: 'android_only' };
    const mode = (opts && opts.interactive) ? 'sniff_dl_ui' : 'sniff_dl';
    let dlJs = eng.dlScript || '';
    if ((engineId === 'noorbook' || engineId === 'tg_bot') && book && book.title) {
      const tq = extractArabicSearchQuery(book.title, book.author) || cleanSearchTitle(book.title, book.author) || book.title;
      const ta = book.author ? cleanAuthorName(book.author) : '';
      dlJs = 'window.__ktbTargetTitle=' + JSON.stringify(tq)
        + ';window.__ktbTargetAuthor=' + JSON.stringify(ta === 'مؤلف غير محدد' ? '' : ta)
        + ';window.__ktbPrefFmt=' + JSON.stringify(book.format || 'pdf') + ';\n' + dlJs;
    }
    const r = await KTB.solveWeb(book.url, mode, dlJs);
    if (r && r.ok && r.savedLocal && r.uri) {
      const fn = String(r.fileName || '');
      const fmt = fn.toLowerCase().endsWith('.epub') ? 'epub' : (book.format || 'pdf');
      return {
        links: [{
          label: 'تم الحفظ مباشرة عبر ' + eng.name,
          format: fmt,
          savedLocal: true,
          uri: r.uri,
          fileName: fn,
          bytes: Number(r.bytes || 0),
          url: r.dlUrl || book.url,
          referer: r.referer || book.url,
        }],
      };
    }
    if (r && r.ok && r.dlUrl) {
      const hint = ((r.dlUrl || '') + ' ' + (r.disposition || '') + ' ' + (r.mime || '')).toLowerCase();
      return {
        links: [{
          label: 'رابط مباشر عبر محرك ' + eng.name,
          format: hint.includes('.epub') || hint.includes('epub+zip') ? 'epub' : (book.format || 'pdf'),
          url: r.dlUrl,
          referer: r.referer || book.url,
          cookie: r.cookie || '',
          mime: r.mime || '',
          disposition: r.disposition || '',
        }],
      };
    }
    return { links: [], error: (r && r.error) || 'no_direct_dl' };
  }

  // ------------------------------------------------------------------ 10. Arabic Wikisource, Hindawi HTTP/Archive, Telegram Public Channels & Ketabpedia
  function sanitizeTelegramHandle(raw) {
    return String(raw || '')
      .trim()
      .replace(/^https?:\/\/(t\.me|telegram\.me)\/(s\/)?/i, '')
      .replace(/^@+/, '')
      .split(/[/?#\s]/)[0]
      .replace(/[^a-zA-Z0-9_]/g, '');
  }

  const MTPROTO_CFG_KEY = 'wq_tg_mtproto_v1';

  function getMtprotoConfig() {
    try {
      const raw = JSON.parse(localStorage.getItem(MTPROTO_CFG_KEY) || '{}') || {};
      return {
        url: String(raw.url || '').trim().replace(/\/+$/, ''),
        token: String(raw.token || '').trim(),
        bot: sanitizeTelegramHandle(raw.bot || 'GedoLibrary_bot') || 'GedoLibrary_bot',
      };
    } catch (_) {
      return { url: '', token: '', bot: 'GedoLibrary_bot' };
    }
  }

  function setMtprotoConfig(cfg) {
    const clean = {
      url: String((cfg && cfg.url) || '').trim().replace(/\/+$/, ''),
      token: String((cfg && cfg.token) || '').trim(),
      bot: sanitizeTelegramHandle((cfg && cfg.bot) || 'GedoLibrary_bot') || 'GedoLibrary_bot',
    };
    try { localStorage.setItem(MTPROTO_CFG_KEY, JSON.stringify(clean)); } catch (_) { }
    return clean;
  }

  async function testMtprotoRelay(cfgOverride) {
    const cfg = cfgOverride ? Object.assign(getMtprotoConfig(), cfgOverride) : getMtprotoConfig();
    if (!cfg.url) return { ok: false, error: 'أدخل عنوان خادم MTProto أولاً' };
    const headers = cfg.token ? { 'X-Midad-Token': cfg.token } : {};
    const r = await withTimeout(KTB.http(cfg.url.replace(/\/+$/, '') + '/health', { headers }), 5500, { code: 0, body: '' });
    if (!r || r.code !== 200 || !r.body) {
      return { ok: false, error: 'تعذر الوصول إلى الخادم (' + ((r && r.code) || 'timeout') + ')' };
    }
    try {
      const d = JSON.parse(r.body);
      return { ok: !!d.ok, authorized: !!d.authorized, user: d.user || '', error: d.error || '' };
    } catch (_) {
      return { ok: false, error: 'استجابة غير صالحة من الخادم' };
    }
  }

  async function searchTelegramMtproto(q, opts) {
    const cfg = getMtprotoConfig();
    if (!cfg.url) return [];
    const cleanQ = cleanSearchTitle(q) || String(q || '').trim();
    if (!cleanQ) return [];
    const o = opts || {};
    const bot = sanitizeTelegramHandle(o.bot || cfg.bot || 'GedoLibrary_bot') || 'GedoLibrary_bot';
    const fmt = (o.format || 'pdf').toLowerCase() === 'epub' ? 'epub' : 'pdf';
    const u = cfg.url + '/search?q=' + encodeURIComponent(cleanQ) + '&bot=' + encodeURIComponent(bot) + '&fmt=' + encodeURIComponent(fmt);
    const headers = cfg.token ? { 'X-Midad-Token': cfg.token } : {};
    const r = await withTimeout(KTB.http(u, { headers, tag: o.tag || '' }), 18000, { code: 0, body: '' });
    if (!r || r.code !== 200 || !r.body) return [];
    try {
      const data = JSON.parse(r.body);
      const items = Array.isArray(data && data.items) ? data.items : [];
      return items.map((it) => {
        const rawUrl = String(it.url || '');
        const streamUrl = rawUrl.startsWith('http') ? rawUrl : (cfg.url + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl));
        const finalUrl = cfg.token && !streamUrl.includes('token=')
          ? (streamUrl + (streamUrl.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(cfg.token))
          : streamUrl;
        return normBook({
          id: it.id || ('tgmt_' + Math.random().toString(36).slice(2, 9)),
          title: it.title || cleanQ,
          author: '',
          source: it.source || ('تيليجرام @' + bot + ' (MTProto)'),
          sourceId: 'telegram',
          lang: isArabicText(it.title || cleanQ) ? 'ar' : 'en',
          format: it.format || fmt,
          size: it.size || '',
          url: finalUrl,
          dlUrl: finalUrl,
          needsResolve: false,
        });
      }).filter(isGenuineBookItem);
    } catch (_) {
      return [];
    }
  }

  async function fetchViaTelegramBot(book, opts) {
    const cfg = getMtprotoConfig();
    const o = opts || {};
    const cleanQ = extractArabicSearchQuery(book && book.title, book && book.author)
      || cleanSearchTitle((book && book.title) || '', book && book.author)
      || String((book && book.title) || '');
    const botHandle = sanitizeTelegramHandle(o.bot || cfg.bot || 'GedoLibrary_bot') || 'GedoLibrary_bot';

    if (cfg.url) {
      const mtHits = await searchTelegramMtproto(cleanQ, { bot: botHandle, format: o.format || (book && book.format) || 'pdf' });
      if (mtHits.length) {
        return {
          ok: true,
          mode: 'mtproto',
          links: mtHits.map((m) => ({
            label: (m.title || cleanQ) + ' — تيليجرام @' + botHandle + ' (MTProto)',
            format: m.format || 'pdf',
            size: m.size || '',
            source: m.source,
            url: m.dlUrl,
          })),
        };
      }
    }

    if (KTB.isAndroid()) {
      const botUrl = WEB_ENGINES.tg_bot.searchUrl(cleanQ, botHandle);
      const webRes = await withTimeout(
        resolveWebEngine('tg_bot', { title: cleanQ, author: (book && book.author) || '', format: o.format || (book && book.format) || 'pdf', url: botUrl }, { interactive: true }),
        210000,
        { links: [], error: 'timeout' }
      );
      if (webRes && webRes.links && webRes.links.length) {
        return { ok: true, mode: 'telegram_web', links: webRes.links };
      }
      return { ok: false, error: (webRes && webRes.error) || 'no_direct_dl', links: [] };
    }
    return { ok: false, error: 'mtproto_not_configured', links: [] };
  }

  function getSearchableTelegramChannels() {
    const base = [
      'lenaqra', 'idont3forgetyou',
      'arabicbooks', 'ketab_n', 'ahgeelpdf', 'kutub', 'Arabic_Books_PDF', 'ahgeel',
      'Gedo_Library', 'hindawi_books', 'psycho_mh', 'EncyclopediaofSDB', 'Arabic_audiobooks',
    ];
    try {
      const custom = JSON.parse(localStorage.getItem('wq_tg_custom') || '[]');
      if (Array.isArray(custom)) {
        custom.forEach((c) => {
          const h = sanitizeTelegramHandle(c && c.handle ? c.handle : c);
          if (h && !base.includes(h)) base.unshift(h);
        });
      }
    } catch (_) { }
    return base;
  }

  async function searchWikisource(q) {
    const query = cleanSearchTitle(q);
    if (!query) return [];
    const u = 'https://ar.wikisource.org/w/api.php?action=query&list=search&srsearch='
      + encodeURIComponent(query) + '&srnamespace=0&srlimit=10&format=json';
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    let hits = [];
    try { hits = JSON.parse(r.body).query.search || []; } catch (_) { return []; }
    const seen = new Set();
    const out = [];
    for (const h of hits) {
      const rawTitle = String(h.title || '').trim();
      const rootTitle = rawTitle.split('/')[0].trim();
      if (!rootTitle || seen.has(rootTitle)) continue;
      seen.add(rootTitle);
      const enc = encodeURIComponent(rootTitle.replace(/ /g, '_'));
      out.push(normBook({
        id: 'ws_' + enc.slice(0, 28),
        title: rootTitle,
        author: 'ويكي مصدر (تراث وأدب)',
        cover: '',
        source: 'ويكي مصدر',
        sourceId: 'wikisource',
        lang: 'ar',
        format: 'pdf',
        url: 'https://ar.wikisource.org/wiki/' + enc,
        dlUrl: 'https://ar.wikisource.org/api/rest_v1/page/pdf/' + enc,
        summary: stripTags(h.snippet || ''),
        needsResolve: true,
        resolverType: 'wikisource',
        extra: { wsTitle: rootTitle },
      }));
    }
    return out;
  }

  async function resolveWikisource(book) {
    const t = (book.extra && book.extra.wsTitle) || cleanSearchTitle(book.title);
    if (!t) return { links: [] };
    const enc = encodeURIComponent(t.replace(/ /g, '_'));
    return {
      links: [
        {
          label: 'تحميل PDF مباشر — ويكي مصدر (' + t + ')',
          format: 'pdf',
          source: 'ويكي مصدر العربية',
          url: 'https://ar.wikisource.org/api/rest_v1/page/pdf/' + enc,
          referer: 'https://ar.wikisource.org/wiki/' + enc,
        },
        {
          label: 'قراءة النص الكامل على ويكي مصدر',
          format: 'html',
          kind: 'external',
          source: 'ويكي مصدر العربية',
          url: 'https://ar.wikisource.org/wiki/' + enc,
        },
      ],
    };
  }

  async function searchHindawiHttp(q) {
    const query = cleanSearchTitle(q);
    if (!query) return [];
    const directUrl = 'https://www.hindawi.org/search/keyword/' + encodeURIComponent(query) + '/';
    const [httpRes, archHindawi] = await Promise.all([
      KTB.http(directUrl).catch(() => ({ code: 0, body: '' })),
      searchArchive(query, { collection: 'hindawi', label: 'مؤسسة هنداوي (الأرشيف)', rows: 8 }).catch(() => []),
    ]);

    const items = [];
    if (httpRes && httpRes.code === 200 && /\/books\/\d+/i.test(httpRes.body || '')) {
      const doc = parseDoc(httpRes.body);
      const seen = new Set();
      doc.querySelectorAll('a[href*="/books/"]').forEach((a) => {
        const href = a.getAttribute('href') || '';
        const m = href.match(/\/books\/(\d+)/);
        if (!m || seen.has(m[1])) return;
        seen.add(m[1]);
        const card = a.closest('li, article, .bookCover, div') || a;
        const img = card.querySelector('img');
        const titleEl = card.querySelector('h2, h3, .title');
        const authEl = card.querySelector('.author, a[href*="/contributors/"]');
        const t = stripTags((titleEl && titleEl.textContent) || a.textContent || (img && img.alt) || '');
        if (!t || t.length < 2) return;
        const abs = absUrl('https://www.hindawi.org/', href);
        items.push(normBook({
          id: 'hindawi_' + m[1],
          title: t,
          author: authEl ? stripTags(authEl.textContent) : '',
          cover: img ? absUrl('https://www.hindawi.org/', img.getAttribute('data-src') || img.getAttribute('src') || '') : '',
          source: 'مؤسسة هنداوي',
          sourceId: 'hindawi',
          lang: 'ar',
          format: 'pdf / epub',
          url: abs,
          needsResolve: true,
          resolverType: 'hindawi',
          extra: { bookId: m[1] },
        }));
      });
    }
    return [...items, ...archHindawi];
  }

  async function resolveHindawi(book) {
    if (!book.url) return { links: [] };
    const r = await KTB.http(book.url).catch(() => ({ code: 0, body: '' }));
    if (r.code !== 200) return { links: [] };
    const doc = parseDoc(r.body);
    const links = [];
    const seen = new Set();
    doc.querySelectorAll('a[href*=".pdf"], a[href*=".epub"], a[href*=".kfx"], a[href*="downloads.hindawi.org"]').forEach((a) => {
      const u = absUrl(book.url, a.getAttribute('href') || '');
      if (!u || seen.has(u)) return;
      seen.add(u);
      const low = u.toLowerCase();
      const fmt = low.includes('.epub') ? 'epub' : (low.includes('.kfx') ? 'azw3' : 'pdf');
      links.push({
        label: 'تنزيل طبعة هنداوي (' + fmt.toUpperCase() + ')',
        format: fmt,
        source: 'مؤسسة هنداوي',
        url: u,
        referer: book.url,
      });
    });
    const covEl = doc.querySelector('.bookCover img, img[src*="/books/"]');
    const cover = covEl ? absUrl(book.url, covEl.getAttribute('src') || '') : '';
    const sumEl = doc.querySelector('.summary, #book_synopsis, p');
    const summary = sumEl ? stripTags(sumEl.textContent) : '';
    return { links, cover, summary };
  }

  function extractDriveDirectUrl(url) {
    const m = String(url || '').match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([a-zA-Z0-9_-]{15,})/);
    if (!m) return '';
    return 'https://drive.usercontent.google.com/download?id=' + m[1] + '&export=download&confirm=t';
  }

  function extractDropboxDirectUrl(url) {
    const u = String(url || '').trim();
    if (!/dropbox\.com\/(s|scl\/fi)\//i.test(u)) return '';
    if (/[?&]dl=1\b/i.test(u)) return u;
    if (/[?&]dl=0\b/i.test(u)) return u.replace(/([?&])dl=0\b/i, '$1dl=1');
    return u + (u.includes('?') ? '&' : '?') + 'dl=1';
  }

  async function resolveMediaFireDirect(url) {
    const r = await KTB.http(url).catch(() => ({ code: 0, body: '' }));
    if (r.code !== 200 || !r.body) return '';
    const m = r.body.match(/id=["']downloadButton["'][^>]*href=["'](https?:\/\/[^"']+)["']/i)
      || r.body.match(/href=["'](https?:\/\/download\d*\.mediafire\.com\/[^"']+)["']/i);
    return m ? m[1].replace(/&amp;/g, '&') : '';
  }

  async function fetchTelegramPostEmbed(postUrl) {
    if (!/^https?:\/\/t\.me\/[^/]+\/\d+/i.test(String(postUrl || ''))) {
      return { links: [], cover: '', docName: '' };
    }
    const embedUrl = postUrl.split('?')[0] + '?embed=1&mode=tme';
    const r = await KTB.http(embedUrl).catch(() => ({ code: 0, body: '' }));
    if (r.code !== 200 || !r.body) return { links: [], cover: '', docName: '' };
    const doc = parseDoc(r.body);
    const links = [];
    doc.querySelectorAll('.tgme_widget_message_text a[href], .tgme_widget_message_inline_keyboard a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      if (href && !href.startsWith('?q=') && !/t\.me\/(s\/)?[^/]+$/i.test(href)) {
        links.push(href);
      }
    });
    let cover = '';
    const photoEl = doc.querySelector('.tgme_widget_message_photo_wrap');
    if (photoEl) {
      const pm = (photoEl.getAttribute('style') || '').match(/url\(['"]?([^'")]+)['"]?\)/i);
      if (pm && pm[1] && !pm[1].includes('telegram.org/img/emoji')) {
        cover = pm[1].startsWith('//') ? ('https:' + pm[1]) : pm[1];
      }
    }
    const dt = doc.querySelector('.tgme_widget_message_document_title');
    const docName = dt ? stripTags(dt.textContent) : '';
    return { links, cover, docName };
  }

  async function findDirectMirrorsForTelegramDoc(title, docName, lang, authorHint) {
    const cleanFromDoc = String(docName || '')
      .replace(/\.(pdf|epub|azw3|mobi|fb2|cbz|txt)$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();
    const rawTarget = cleanFromDoc || title || '';
    const q = cleanSearchTitle(rawTarget, authorHint);
    if (!q || q.length < 2) return [];
    const engPart = rawTarget.includes('—') ? rawTarget.split('—').slice(1).join(' ').trim() : '';
    const altEng = engPart && !isArabicText(engPart) ? engPart : '';
    const strictFilter = (c) => c && isStrictSameBook(rawTarget, c.title, authorHint || '', c.author, altEng);
    const isAr = lang === 'ar' || isArabicText(q);
    const jobs = [];
    if (isAr) {
      jobs.push(
        withTimeout(search8gharb(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolve8gharb(c).then(r => (r.links || []).map(l => Object.assign({ source: 'قهوة 8 غرب (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
        withTimeout(searchFoulabook(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolveFoulabook(c).then(r => (r.links || []).map(l => Object.assign({ source: 'فولة بوك (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
        withTimeout(searchAlarabimag(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolveAlarabimag(c).then(r => (r.links || []).map(l => Object.assign({ source: 'مجلة العرب (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
        withTimeout(searchHindawiHttp(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => (c.resolverType === 'archive' ? resolveArchive(c.extra.iaId, q) : resolveHindawi(c)).then(r => (Array.isArray(r) ? r : (r.links || [])).map(l => Object.assign({ source: 'مؤسسة هنداوي (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
        withTimeout(searchWaqfeya(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolveWaqfeya(c).then(r => (r.links || []).map(l => Object.assign({ source: 'الوقفية (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
      );
    }
    jobs.push(
      withTimeout(searchArchive(q, { arabicOnly: false, rows: 5 }).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolveArchive(c.extra && c.extra.iaId, rawTarget).then(r => r.map(l => Object.assign({ source: 'الأرشيف (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
      withTimeout(searchLibgen(q).then(list => Promise.all(list.filter(strictFilter).slice(0, 1).map(c => resolveLibgen(c).then(r => (r.links || []).map(l => Object.assign({ source: 'LibGen (بديل مباشر)' }, l)))))), 3600, []).catch(() => []),
    );
    const settled = await Promise.all(jobs);
    return settled.flat(2).filter(l => l && l.url && l.kind !== 'external');
  }

  async function resolveKetabpedia(pageUrl) {
    const r = await KTB.http(pageUrl).catch(() => ({ code: 0, body: '' }));
    if (r.code !== 200) return [];
    const doc = parseDoc(r.body);
    const out = [];
    const seen = new Set();
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href') || '';
      const low = href.toLowerCase();
      let direct = extractDriveDirectUrl(href);
      let fmt = low.includes('.epub') ? 'epub' : (low.includes('.azw3') ? 'azw3' : 'pdf');
      let label = stripTags(a.textContent) || 'رابط تحميل من Ketabpedia';
      if (direct) {
        if (seen.has(direct)) return;
        seen.add(direct);
        out.push({ label: label + ' (Google Drive مباشر)', format: fmt, source: 'Ketabpedia / Drive', url: direct, referer: pageUrl });
      } else if (/\.(pdf|epub|azw3|mobi)(\?|$)/i.test(low)) {
        const abs = absUrl(pageUrl, href);
        if (seen.has(abs)) return;
        seen.add(abs);
        out.push({ label, format: fmt, source: 'Ketabpedia', url: abs, referer: pageUrl });
      }
    });
    return out.slice(0, 4);
  }

  async function searchTelegramChannels(q, opts) {
    const query = cleanSearchTitle(q);
    if (!query) return [];
    const o = opts || {};
    const channels = Array.isArray(o.channels) && o.channels.length
      ? o.channels
      : getSearchableTelegramChannels().slice(0, o.maxChannels || 10);
    const limitPerCh = o.limitPerCh || 4;

    const jobs = channels.map(async (ch) => {
      const u = 'https://t.me/s/' + encodeURIComponent(ch) + '?q=' + encodeURIComponent(query);
      const r = await withTimeout(KTB.http(u, { timeoutMs: o.timeoutMs || 4200, signal: o.signal, tag: o.tag || '', priority: o.priority || 'normal' }), 4800, { code: 0, body: '' });
      if (!r || r.code !== 200 || !r.body) return [];
      const doc = parseDoc(r.body);
      const wraps = Array.from(doc.querySelectorAll('.tgme_widget_message_wrap'));
      const found = [];

      for (const w of wraps) {
        if (found.length >= limitPerCh) break;
        const msgEl = w.querySelector('.tgme_widget_message');
        const postAttr = (msgEl && msgEl.getAttribute('data-post')) || '';
        const postUrl = postAttr ? ('https://t.me/' + postAttr) : ('https://t.me/s/' + ch);

        const docTitleEl = w.querySelector('.tgme_widget_message_document_title');
        const docExtraEl = w.querySelector('.tgme_widget_message_document_extra');
        const textEl = w.querySelector('.tgme_widget_message_text');
        const docName = docTitleEl ? stripTags(docTitleEl.textContent) : '';
        const docSize = docExtraEl ? stripTags(docExtraEl.textContent) : '';
        const rawText = textEl ? stripTags(textEl.textContent) : '';

        // Skip empty / unrelated noise posts unless docName or rawText mentions anything substantial
        if (!docName && rawText.length < 6) continue;

        let cover = '';
        const photoEl = w.querySelector('.tgme_widget_message_photo_wrap');
        if (photoEl) {
          const st = photoEl.getAttribute('style') || '';
          const pm = st.match(/url\(['"]?([^'")]+)['"]?\)/i);
          if (pm && pm[1] && !pm[1].includes('telegram.org/img/emoji')) {
            cover = pm[1].startsWith('//') ? ('https:' + pm[1]) : pm[1];
          }
        }

        // Extract outbound links (Google Drive, direct files, Ketabpedia, Archive)
        const extLinks = [];
        if (textEl) {
          textEl.querySelectorAll('a[href]').forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (!href || href.startsWith('?q=') || href.includes('t.me/')) return;
            extLinks.push(href);
          });
        }

        // Clean title from docName or first line of post
        let title = docName.replace(/\.(pdf|epub|azw3|mobi|fb2|cbz|txt)$/i, '').replace(/[_-]+/g, ' ').trim();
        if (!title) {
          const lines = (textEl ? textEl.innerText || textEl.textContent : '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          title = (lines[0] || rawText).replace(/^(رواية|كتاب|تحميل)\s*[:\-]?\s*/i, '').slice(0, 90);
        }
        if (!title || title.length < 2) continue;

        let author = '';
        const am = rawText.match(/(?:للكاتب|لـ|تأليف|بقلم|المؤلف)\s*[:\-]?\s*([^\n،.]{3,35})/);
        if (am && am[1]) author = stripTags(am[1]);

        const extMatch = docName.match(/\.(pdf|epub|azw3|mobi|fb2|cbz|txt)$/i);
        const fmt = extMatch ? extMatch[1].toLowerCase() : 'pdf';

        found.push(normBook({
          id: 'tg_' + postAttr.replace(/[^a-z0-9]/gi, '_'),
          title,
          author,
          cover,
          source: 'تيليجرام @' + ch,
          sourceId: 'telegram',
          lang: isArabicText(title + ' ' + rawText) ? 'ar' : 'en',
          format: fmt,
          size: docSize,
          url: postUrl,
          summary: rawText.slice(0, 260),
          needsResolve: true,
          resolverType: 'telegram',
          extra: { postUrl, channel: ch, docName, docSize, extLinks },
        }));
      }
      return found;
    });

    const nested = await Promise.all(jobs);
    return nested.flat().filter(isGenuineBookItem);
  }

  async function resolveTelegramPost(book, opts) {
    const ex = book.extra || {};
    let cover = book.cover || '';
    const rawExtLinks = Array.isArray(ex.extLinks) ? ex.extLinks.slice() : [];
    let docName = ex.docName || '';

    if (ex.postUrl) {
      const emb = await withTimeout(fetchTelegramPostEmbed(ex.postUrl), 4500, { links: [], cover: '', docName: '' });
      if (emb.cover && !cover) cover = emb.cover;
      if (emb.docName && !docName) docName = emb.docName;
      (emb.links || []).forEach((u) => { if (!rawExtLinks.includes(u)) rawExtLinks.push(u); });
    }

    const links = await resolveCandidateUrls(rawExtLinks, {
      sourcePrefix: 'تيليجرام @' + (ex.channel || 'Telegram'),
      referer: ex.postUrl || book.url,
      format: book.format || 'pdf',
      title: book.title,
    });
    const seenUrls = new Set(links.map(l => l.url));

    // Only query fallback mirrors when opened standalone (aggregateBookLinks already runs all mirrors in parallel)
    if (!links.length && !(opts && opts.skipFallbackMirrors)) {
      const mirrors = await withTimeout(findDirectMirrorsForTelegramDoc(book.title, docName, book.lang), 5000, []);
      mirrors.forEach((m) => {
        if (!m || !m.url || seenUrls.has(m.url)) return;
        seenUrls.add(m.url);
        links.push(m);
      });
    }

    // Never emit external t.me redirects; always provide in-app direct download or stream
    const ch = sanitizeTelegramHandle(ex.channel || '');
    const postIdM = String(ex.postUrl || '').match(/\/(\d+)(?:[?#]|$)/);
    const postId = postIdM ? postIdM[1] : '';
    const mtCfg = getMtprotoConfig();
    if (!links.length && ch && postId) {
      if (mtCfg.url) {
        const tok = mtCfg.token ? ('&token=' + encodeURIComponent(mtCfg.token)) : '';
        links.push({
          label: docName
            ? ('تحميل مباشر: ' + docName + (ex.docSize ? ' (' + ex.docSize + ')' : ''))
            : ('تحميل مباشر من قناة @' + ch),
          format: book.format || 'pdf',
          size: ex.docSize || '',
          source: 'تيليجرام @' + ch,
          url: mtCfg.url + '/stream?peer=' + encodeURIComponent(ch) + '&msg_id=' + encodeURIComponent(postId) + tok,
        });
      } else if (KTB.isAndroid()) {
        links.push({
          label: docName
            ? ('تحميل مباشر: ' + docName + (ex.docSize ? ' (' + ex.docSize + ')' : ''))
            : ('تحميل مباشر من تيليجرام @' + ch),
          format: book.format || 'pdf',
          size: ex.docSize || '',
          kind: 'tg_direct',
          channel: ch,
          postId,
          docName,
          postUrl: ex.postUrl,
          source: 'تيليجرام @' + ch,
          url: ex.postUrl || ('tg://direct/' + ch + '/' + postId),
        });
      }
    }
    return { links, cover };
  }

  function cleanPagesCount(val) {
    const n = parseInt(String(val || '').replace(/[^\d]/g, ''), 10);
    return n >= 8 && n <= 12000 ? String(n) : '';
  }

  async function resolveBookPageCount(book) {
    const existing = cleanPagesCount(book && book.pages);
    if (existing) return existing;
    const title = cleanSearchTitle((book && book.title) || '');
    if (!title || title.length < 2) return '';
    const cleanAuth = cleanAuthorName((book && book.author) || '');
    const gbQ = encodeURIComponent(title + (cleanAuth && cleanAuth !== 'مؤلف غير محدد' ? ' ' + cleanAuth : ''));
    const [gbRes, olRes] = await Promise.all([
      KTB.http('https://www.googleapis.com/books/v1/volumes?q=' + gbQ + '&maxResults=4&fields=items(volumeInfo(title,pageCount))').catch(() => ({ code: 0 })),
      KTB.http('https://openlibrary.org/search.json?q=' + encodeURIComponent(title) + '&limit=3&fields=title,number_of_pages_median').catch(() => ({ code: 0 })),
    ]);
    if (gbRes && gbRes.code === 200 && gbRes.body) {
      try {
        const items = JSON.parse(gbRes.body).items || [];
        for (const it of items) {
          const vi = it && it.volumeInfo;
          const pg = cleanPagesCount(vi && vi.pageCount);
          if (pg && (!vi.title || titleMatchesCandidate(title, vi.title))) return pg;
        }
        for (const it of items) {
          const pg = cleanPagesCount(it && it.volumeInfo && it.volumeInfo.pageCount);
          if (pg) return pg;
        }
      } catch (_) { }
    }
    if (olRes && olRes.code === 200 && olRes.body) {
      try {
        const docs = JSON.parse(olRes.body).docs || [];
        for (const d of docs) {
          const pg = cleanPagesCount(d && d.number_of_pages_median);
          if (pg && (!d.title || titleMatchesCandidate(title, d.title))) return pg;
        }
      } catch (_) { }
    }
    return '';
  }

  // ------------------------------------------------------------------ Comics Libraries (Arabic & Foreign: YSK Comics, GetComics, Archive Comics, LibGen Comics, Telegram)
  const COMIC_QUERY_RE = /(?:كوميكس|كوميك|قصص\s*مصورة|مجلة\s*(?:ميكي|ماجد|سمير|باسم|تان|لولو)|ميكي|بطوط|تان\s*تان|سمير|أستريكس|لاكي\s*لوك|باتمان|سوبرمان|سبايدر\s*مان|أيرون\s*مان|الرجل\s*الحديدي|ثور|هالك|كابتن\s*أمريكا|وندر\s*وومان|أكوامان|فلاش|جرين\s*لانترن|نايت\s*وينج|روبن|جوكر|هارلي\s*كوين|ديدبول|فينوم|وولفرين|فارس\s*القمر|دكتور\s*سترينج|أفنجرز|المنتقمون|فرقة\s*العدالة|بلاك\s*بانثر|إكس\s*من|مارفل|دي\s*سي|هيل\s*بوي|واتشمن|ساندمان|انفنسبل|مانجا|ون\s*بيس|ناروتو|هجوم\s*العمالقة|دراغون\s*بول|ديث\s*نوت|بليتش|قاتل\s*الشياطين|جوجوتسو|بيرسيرك|مونستر|كونان|سولو\s*ليفيلينج|ويبتون|تاباس|عرب\s*كوميكس|بوابة\s*الكوميكس|كوميكس\s*فيرس|comics?|comic\s*book|graphic\s*novel|webtoons?|tapas|globalcomix|comicsgate|arabcomics|comicverse|azcomics|batman|spider[-\s]*man|superman|iron\s*man|captain\s*america|wonder\s*woman|aquaman|flash|green\s*lantern|nightwing|harley\s*quinn|venom|moon\s*knight|doctor\s*strange|black\s*panther|marvel|dc\s*comics|x-?men|avengers|joker|daredevil|deadpool|justice\s*league|tintin|asterix|lucky\s*luke|mickey\s*mouse|donald\s*duck|scrooge|hellboy|watchmen|sandman|invincible|spawn|wolverine|one\s*piece|naruto|attack\s*on\s*titan|dragon\s*ball|death\s*note|bleach|demon\s*slayer|jujutsu|berserk|solo\s*leveling|manga|cbz|cbr)/i;

  const GENERIC_COMIC_RE = /^(?:كوميكس|كوميك|قصص\s*مصورة|مجلات\s*مصورة|مانجا|كتب\s*مصورة|الكوميكس|comics?|comic\s*books?|graphic\s*novels?|manga|cbz|cbr)$/i;

  const COMIC_AR_TO_EN = [
    [/كوميكس|قصص\s*مصورة|كوميك/i, 'comics'],
    [/مانجا/i, 'manga'],
    [/باتمان|الرجل\s*الوطواط/i, 'batman'],
    [/سبايدر\s*مان|سبايدرمان|الرجل\s*العنكبوت/i, 'spider-man'],
    [/سوبر\s*مان|سوبرمان/i, 'superman'],
    [/أيرون\s*مان|ايرون\s*مان|الرجل\s*الحديدي/i, 'iron man'],
    [/كابتن\s*أمريكا/i, 'captain america'],
    [/وندر\s*وومان|المرأة\s*الخارقة/i, 'wonder woman'],
    [/أكوامان|اكوامان/i, 'aquaman'],
    [/فلاش|البرق/i, 'flash'],
    [/نايت\s*وينج|نايتوينج/i, 'nightwing'],
    [/جوكر|الجوكر/i, 'joker'],
    [/هارلي\s*كوين/i, 'harley quinn'],
    [/فينوم/i, 'venom'],
    [/ديد\s*بول|ديدبول/i, 'deadpool'],
    [/وولفرين|ولفرين/i, 'wolverine'],
    [/دير\s*ديفيل|ديرديفيل/i, 'daredevil'],
    [/فارس\s*القمر|مون\s*نايت/i, 'moon knight'],
    [/دكتور\s*سترينج/i, 'doctor strange'],
    [/ثور/i, 'thor'],
    [/هالك|الرجل\s*الأخضر/i, 'hulk'],
    [/بلاك\s*بانثر|النمر\s*الأسود/i, 'black panther'],
    [/جرين\s*لانترن|الفانوس\s*الأخضر/i, 'green lantern'],
    [/أفنجرز|المنتقمون/i, 'avengers'],
    [/فرقة\s*العدالة|جاستس\s*ليج/i, 'justice league'],
    [/إكس\s*من|اكس\s*من|رجال\s*اكس/i, 'x-men'],
    [/مارفل/i, 'marvel'],
    [/دي\s*سي/i, 'dc comics'],
    [/تان\s*تان/i, 'tintin'],
    [/أستريكس|استريكس/i, 'asterix'],
    [/ميكي\s*ماوس|مجلة\s*ميكي|ميكي/i, 'mickey mouse'],
    [/بطوط|عم\s*دهب|العم\s*دهب/i, 'donald duck'],
    [/هيل\s*بوي/i, 'hellboy'],
    [/واتشمن|المراقبون/i, 'watchmen'],
    [/ساندمان/i, 'sandman'],
    [/انفنسبل|إنفينسيبل/i, 'invincible'],
    [/سباون/i, 'spawn'],
    [/ون\s*بيس/i, 'one piece'],
    [/ناروتو/i, 'naruto'],
    [/هجوم\s*العمالقة/i, 'attack on titan'],
    [/دراغون\s*بول|دراجون\s*بول/i, 'dragon ball'],
    [/ديث\s*نوت|مذكرة\s*الموت/i, 'death note'],
    [/بليتش/i, 'bleach'],
    [/قاتل\s*الشياطين/i, 'demon slayer'],
    [/جوجوتسو\s*كايسن|جوجوتسو/i, 'jujutsu kaisen'],
    [/بيرسيرك/i, 'berserk'],
    [/المحقق\s*كونان|كونان/i, 'detective conan'],
  ];

  const COMIC_EN_TO_AR = [
    [/\bcomics?\b|\bcomic\s*books?\b|\bgraphic\s*novels?\b/i, 'كوميكس'],
    [/\bmanga\b/i, 'مانجا'],
    [/\bbatman\b/i, 'باتمان'],
    [/\bspider[-\s]*man\b/i, 'سبايدرمان'],
    [/\bsuperman\b/i, 'سوبرمان'],
    [/\biron[-\s]*man\b/i, 'أيرون مان'],
    [/\bcaptain\s*america\b/i, 'كابتن أمريكا'],
    [/\bwonder\s*woman\b/i, 'وندر وومان'],
    [/\baquaman\b/i, 'أكوامان'],
    [/\b(?:the\s+)?flash\b/i, 'فلاش'],
    [/\bnightwing\b/i, 'نايت وينج'],
    [/\bjoker\b/i, 'جوكر'],
    [/\bharley\s*quinn\b/i, 'هارلي كوين'],
    [/\bvenom\b/i, 'فينوم'],
    [/\bdeadpool\b/i, 'ديدبول'],
    [/\bwolverine\b/i, 'وولفرين'],
    [/\bdaredevil\b/i, 'ديرديفيل'],
    [/\bmoon\s*knight\b/i, 'فارس القمر'],
    [/\bdoctor\s*strange\b/i, 'دكتور سترينج'],
    [/\bthor\b/i, 'ثور'],
    [/\bhulk\b/i, 'هالك'],
    [/\bblack\s*panther\b/i, 'بلاك بانثر'],
    [/\bgreen\s*lantern\b/i, 'جرين لانترن'],
    [/\bavengers\b/i, 'المنتقمون'],
    [/\bjustice\s*league\b/i, 'فرقة العدالة'],
    [/\bx-?men\b/i, 'اكس من'],
    [/\bmarvel\b/i, 'مارفل'],
    [/\bdc\s*comics?\b/i, 'دي سي'],
    [/\btintin\b/i, 'تان تان'],
    [/\basterix\b/i, 'أستريكس'],
    [/\bmickey(\s*mouse)?\b/i, 'ميكي'],
    [/\bdonald\s*duck\b|\buncle\s*scrooge\b/i, 'بطوط'],
    [/\bhellboy\b/i, 'هيل بوي'],
    [/\bwatchmen\b/i, 'واتشمن'],
    [/\bsandman\b/i, 'ساندمان'],
    [/\binvincible\b/i, 'انفنسبل'],
    [/\bspawn\b/i, 'سباون'],
    [/\bone\s*piece\b/i, 'ون بيس'],
    [/\bnaruto\b/i, 'ناروتو'],
    [/\battack\s*on\s*titan\b/i, 'هجوم العمالقة'],
    [/\bdragon\s*ball\b/i, 'دراغون بول'],
    [/\bdeath\s*note\b/i, 'ديث نوت'],
    [/\bbleach\b/i, 'بليتش'],
    [/\bdemon\s*slayer\b/i, 'قاتل الشياطين'],
    [/\bjujutsu\s*kaisen\b/i, 'جوجوتسو'],
    [/\bberserk\b/i, 'بيرسيرك'],
    [/\bconan\b/i, 'كونان'],
  ];

  function isComicQuery(q) {
    return COMIC_QUERY_RE.test(String(q || '').trim());
  }

  function isGenericComicQuery(q) {
    return GENERIC_COMIC_RE.test(String(q || '').trim());
  }

  async function resolveComicSearchTerms(q) {
    const raw = String(q || '').trim();
    if (!raw) return { arQuery: '', enQuery: '', isGeneric: false };
    const isGeneric = isGenericComicQuery(raw);
    if (isGeneric) {
      return { arQuery: 'كوميكس', enQuery: 'comics', isGeneric: true };
    }
    const qIsAr = isArabicText(raw);
    let arQuery = qIsAr ? raw : '';
    let enQuery = qIsAr ? '' : raw;
    if (qIsAr) {
      for (const [re, en] of COMIC_AR_TO_EN) {
        if (re.test(raw)) { enQuery = en; break; }
      }
      if (!enQuery) {
        try {
          const tr = await translateTextQuick(raw, 'en');
          if (tr && !isArabicText(tr)) enQuery = tr.trim();
        } catch (_) { }
      }
    } else {
      for (const [re, ar] of COMIC_EN_TO_AR) {
        if (re.test(raw)) { arQuery = ar; break; }
      }
      if (!arQuery) {
        try {
          const tr = await translateTextQuick(raw, 'ar');
          if (tr && isArabicText(tr)) arQuery = tr.trim();
        } catch (_) { }
      }
    }
    return { arQuery: arQuery || raw, enQuery: enQuery || raw, isGeneric: false };
  }

  async function searchYskComics(q, opts) {
    const o = opts || {};
    const rawInput = String(q || '').trim();
    const query = cleanSearchTitle(rawInput) || rawInput;
    const arQuery = String(o.arQuery || (isArabicText(query) ? query : '')).trim() || query;
    const enQuery = String(o.enQuery || (!isArabicText(query) ? query : '')).trim() || query;
    const wantAr = o.lang === 'ar' || (!o.lang && isArabicText(query)) || o.lang === 'both';
    const wantEn = o.lang === 'en' || (!o.lang && !isArabicText(query)) || o.lang === 'both';

    async function fetchLocale(loc) {
      const locQ = loc === 'ar' ? arQuery : enQuery;
      const generic = isGenericComicQuery(rawInput) || isGenericComicQuery(locQ) || !!o.browseHome;
      const searchUrl = generic
        ? ('https://www.ysk-comics.com/' + loc)
        : ('https://www.ysk-comics.com/' + loc + '/search?q=' + encodeURIComponent(locQ));
      const r = await withTimeout(KTB.http(searchUrl, {
        headers: { Referer: 'https://www.ysk-comics.com/' + loc },
        signal: o.signal,
        tag: o.tag || '',
      }), 6500, { code: 0, body: '' });
      if (r.code !== 200 || !r.body) return [];
      const ldCovers = new Map();
      const ldMeta = new Map();
      const ldRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let ldMatch;
      while ((ldMatch = ldRe.exec(r.body)) !== null) {
        try {
          const parsed = JSON.parse(ldMatch[1]);
          const items = Array.isArray(parsed && parsed.itemListElement)
            ? parsed.itemListElement
            : (Array.isArray(parsed && parsed.mainEntity && parsed.mainEntity.itemListElement) ? parsed.mainEntity.itemListElement : []);
          items.forEach((it) => {
            const u = String(it && it.url || '');
            const sm = u.match(/\/comic\/([^/?#]+)/i);
            if (!sm) return;
            const sk = decodeURIComponent(sm[1]);
            if (it.image) ldCovers.set(sk, it.image);
            ldMeta.set(sk, it);
          });
        } catch (_) { }
      }

      const bodyIdx = r.body.indexOf('<body');
      const doc = parseDoc(bodyIdx !== -1 ? r.body.slice(bodyIdx) : r.body);
      const seen = new Set();
      const out = [];
      const prefix = '/' + loc + '/comic/';
      doc.querySelectorAll('a[href*="' + prefix + '"]').forEach((a) => {
        const href = String(a.getAttribute('href') || '').trim();
        const slugM = href.match(new RegExp('/' + loc + '/comic/([^/?#]+)'));
        if (!slugM) return;
        const slug = decodeURIComponent(slugM[1]);
        if (!slug || seen.has(slug)) return;
        const card = a.closest('div.group, article, li, div[data-v-]') || a.parentElement;
        const ld = ldMeta.get(slug);
        const rawTitle = stripTags(a.textContent || (a.getAttribute('title') || '')).trim();
        const altTitleEl = card ? card.querySelector('h2, h3, a[id="' + slug + '"], a[href="' + href + '"]') : null;
        const title = (ld && ld.name) || ((rawTitle && rawTitle.length >= 2) ? rawTitle : stripTags(altTitleEl ? altTitleEl.textContent : '').trim());
        if (!title || title.length < 2) return;
        seen.add(slug);

        const imgEl = (card && card.querySelector('img')) || a.querySelector('img');
        let cover = ldCovers.get(slug) || (imgEl ? (imgEl.getAttribute('data-src') || imgEl.getAttribute('src') || '') : '');
        if (/^data:/i.test(cover)) cover = ldCovers.get(slug) || '';
        if (cover && cover.startsWith('/')) cover = 'https://www.ysk-comics.com' + cover;
        const subP = card ? card.querySelector('p') : null;
        const rawDesc = (ld && ld.description) || (subP ? stripTags(subP.textContent).trim() : '');
        const byMatch = rawDesc.match(/(?:بواسطة|by)\s+([^•|\n]+)/i);
        const author = byMatch ? byMatch[1].trim() : (loc === 'ar' ? 'YSK Comics بالعربية' : 'YSK Comics');

        out.push(normBook({
          id: 'ysk_' + loc + '_' + slug.replace(/[^a-z0-9_-]/gi, '').slice(0, 32),
          title,
          author,
          cover,
          source: loc === 'ar' ? 'YSK Comics عربي' : 'YSK Comics',
          sourceId: 'yskcomics',
          lang: loc,
          format: 'cbz',
          url: 'https://www.ysk-comics.com' + href,
          summary: (ld && ld.genre ? (ld.genre + ' • ') : '') + (rawDesc || (loc === 'ar' ? 'سلسلة كوميكس عربية متاحة لتحميل الفصول بصيغة CBZ للقراءة أوفلاين.' : 'Comic series ready for CBZ chapter download.')),
          cat: 'comics_manga',
          isComic: true,
          needsResolve: true,
          resolverType: 'yskcomics',
          extra: { slug, comicLang: loc },
        }));
      });
      return out.slice(0, generic ? 18 : 14);
    }

    const jobs = [];
    if (wantAr) jobs.push(fetchLocale('ar'));
    if (wantEn) jobs.push(fetchLocale('en'));
    const chunks = await Promise.all(jobs);
    return [].concat(...chunks).slice(0, 28);
  }

  async function resolveYskComic(book) {
    const slug = (book && book.extra && book.extra.slug)
      || (String((book && book.url) || '').match(/\/comic\/([^/?#]+)/i) || [])[1]
      || '';
    if (!slug) return { links: [] };
    const loc = (book && book.extra && book.extra.comicLang) || (book && book.lang === 'ar' ? 'ar' : 'en');
    const hdrs = {
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://www.ysk-comics.com/',
      'X-Localization': loc,
      lang: loc,
    };
    const [detailR, chapR] = await Promise.all([
      withTimeout(KTB.http('https://api.ysk-comics.com/api/v1/comics/' + encodeURIComponent(slug), { headers: hdrs }), 5500, { code: 0 }),
      withTimeout(KTB.http('https://api.ysk-comics.com/api/v1/comics/' + encodeURIComponent(slug) + '/chapters?page=1', { headers: hdrs }), 5500, { code: 0 }),
    ]);

    let summary = '';
    let cover = '';
    try {
      if (detailR.code === 200 && detailR.body) {
        const d = JSON.parse(detailR.body).data;
        if (d) {
          if (d.description) summary = stripTags(d.description);
          if (d.image) cover = d.image;
        }
      }
    } catch (_) { }

    const links = [];
    try {
      if (chapR.code === 200 && chapR.body) {
        const parsed = JSON.parse(chapR.body);
        const list = (parsed && parsed.data && (parsed.data.data_messages || parsed.data.data || parsed.data)) || [];
        if (Array.isArray(list)) {
          list.slice(0, 30).forEach((ch, idx) => {
            if (!ch || !ch.slug) return;
            const chTitle = stripTags(ch.name || ((book.title || 'Comic') + ' #' + (ch.rank || (idx + 1)))).trim();
            links.push({
              label: chTitle + ' — تحميل أوفلاين (CBZ)',
              dlTitle: chTitle,
              chapterSlug: ch.slug,
              format: 'cbz',
              kind: 'cbz_images',
              source: loc === 'ar' ? 'YSK Comics عربي' : 'YSK Comics',
              imagesApiUrl: 'https://api.ysk-comics.com/api/v1/chapters/' + encodeURIComponent(ch.slug) + '/images',
              url: 'https://www.ysk-comics.com/' + loc + '/chapter/' + encodeURIComponent(ch.slug),
              referer: 'https://www.ysk-comics.com/',
            });
          });
        }
      }
    } catch (_) { }

    if (book && book.url) {
      links.push({
        label: 'قراءة أونلاين داخل مداد — YSK Comics',
        format: 'web',
        kind: 'web_reader',
        source: loc === 'ar' ? 'YSK Comics عربي' : 'YSK Comics',
        url: book.url,
        referer: 'https://www.ysk-comics.com/',
      });
    }

    return { links, summary, cover };
  }

  async function searchGetComics(q, opts) {
    const o = opts || {};
    const rawQ = String(o.enQuery || q || '').trim();
    const query = cleanSearchTitle(rawQ) || rawQ;
    const generic = isGenericComicQuery(q) || isGenericComicQuery(query) || !!o.browseHome;
    if (!generic && (!query || isArabicText(query))) return [];
    const u = generic
      ? 'https://getcomics.org/'
      : ('https://getcomics.org/?s=' + encodeURIComponent(query));
    const r = await withTimeout(KTB.http(u, {
      headers: { Referer: 'https://getcomics.org/' },
      signal: o.signal,
      tag: o.tag || '',
    }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];

    const doc = parseDoc(r.body);
    const out = [];
    const seen = new Set();
    doc.querySelectorAll('article').forEach((art) => {
      const a = art.querySelector('h1.post-title a, h2.post-title a');
      if (!a) return;
      const href = absUrl('https://getcomics.org', a.getAttribute('href'));
      const title = stripTags(a.textContent).trim();
      if (!href || !title || seen.has(href)) return;
      if (/^(?:discord\s*channel|how\s*to\s*download|announcement)/i.test(title) || /\/discord-channel/i.test(href)) return;
      seen.add(href);

      const img = art.querySelector('img');
      const cover = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
      const exc = art.querySelector('p.post-excerpt');
      const excText = exc ? stripTags(exc.textContent).trim() : '';
      const yrM = title.match(/\b(19\d{2}|20[0-2]\d)\b/);
      const szM = excText.match(/Size\s*:\s*([0-9.]+\s*(?:MB|GB|KB))/i);

      out.push(normBook({
        id: 'gc_' + btoa(unescape(encodeURIComponent(href.slice(-48)))).replace(/[^a-z0-9]/gi, '').slice(0, 18),
        title,
        author: 'GetComics',
        cover,
        source: 'GetComics',
        sourceId: 'getcomics',
        lang: 'en',
        year: yrM ? yrM[1] : '',
        size: szM ? szM[1] : '',
        format: 'cbz',
        url: href,
        summary: excText,
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'getcomics',
      }));
    });
    return out.slice(0, 14);
  }

  async function resolveGetComics(book) {
    if (!book || !book.url) return { links: [] };
    const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://getcomics.org/' } }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return { links: [] };
    const doc = parseDoc(r.body);
    const links = [];
    const mediafireUrls = [];
    const seen = new Set();

    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = String(a.getAttribute('href') || '').trim();
      const txt = stripTags(a.textContent || a.getAttribute('title') || '').trim();
      if (!href || seen.has(href)) return;
      if (/how-to-download|yacreader|7-zip/i.test(href)) return;

      if (/getcomics\.org\/dls\//i.test(href) || a.classList.contains('aio-red')) {
        seen.add(href);
        links.push({
          label: (txt || 'DOWNLOAD NOW') + ' — تحميل مباشر (CBZ)',
          format: 'cbz',
          size: book.size || '',
          source: 'GetComics',
          url: href,
          referer: book.url,
        });
      } else if (/mediafire\.com\/file/i.test(href)) {
        seen.add(href);
        mediafireUrls.push(href);
      } else if (/pixeldrain\.com\/|mega\.nz\/|terabox|vikingfile/i.test(href)) {
        seen.add(href);
        links.push({
          label: (txt || 'Mirror') + ' — رابط خارجي',
          format: 'cbz',
          kind: 'external',
          source: 'GetComics Mirror',
          url: href,
        });
      }
    });

    if (mediafireUrls.length) {
      const mfRes = await Promise.allSettled(
        mediafireUrls.slice(0, 2).map(u => withTimeout(resolveMediaFireDirect(u), 4000, ''))
      );
      mfRes.forEach((s, idx) => {
        if (s.status === 'fulfilled' && s.value) {
          links.push({
            label: 'MediaFire — تحميل مباشر (CBZ)',
            format: 'cbz',
            source: 'GetComics / MediaFire',
            url: s.value,
            referer: mediafireUrls[idx],
          });
        }
      });
    }
    return { links };
  }

  async function searchArchiveComicsAr(q, opts) {
    const o = opts || {};
    const query = cleanSearchTitle(q) || String(q || '').trim();
    const arTerms = '(subject:(comics OR "comic books" OR "كوميكس" OR "قصص مصورة") OR title:(ميكي OR "تان تان" OR ماجد OR سمير OR باسم OR سوبرمان OR باتمان OR لولو OR كوميكس OR مجلة))';
    const rawQ = query && !isGenericComicQuery(query)
      ? ('mediatype:texts AND ' + arTerms + ' AND (' + query + ')')
      : ('mediatype:texts AND ' + arTerms + ' AND (ميكي OR تان OR ماجد OR كوميكس)');
    const list = await searchArchive(query || 'كوميكس', Object.assign({}, o, {
      rawQuery: rawQ,
      label: 'أرشيف الكوميكس عربي',
      rows: o.rows || 14,
    }));
    return list.map(b => Object.assign({}, b, {
      cat: 'comics_manga',
      isComic: true,
      lang: b.lang || 'ar',
      extra: Object.assign({}, b.extra || {}, { preferCbz: true }),
    }));
  }

  async function searchArchiveComicsEn(q, opts) {
    const o = opts || {};
    const rawQueryStr = cleanSearchTitle(q) || String(q || '').trim();
    const effectiveQ = (!rawQueryStr || isGenericComicQuery(rawQueryStr)) ? '(batman OR spider OR marvel OR comics)' : rawQueryStr;
    const rawQ = 'mediatype:texts AND (collection:comics OR collection:comic_books OR subject:comics) AND (' + effectiveQ + ')';
    const list = await searchArchive(rawQueryStr || 'comics', Object.assign({}, o, {
      rawQuery: rawQ,
      label: 'Archive Comics',
      rows: o.rows || 14,
    }));
    return list.map(b => Object.assign({}, b, {
      cat: 'comics_manga',
      isComic: true,
      format: 'cbz',
      lang: b.lang || 'en',
      extra: Object.assign({}, b.extra || {}, { preferCbz: true }),
    }));
  }

  async function searchComicsTelegram(q, opts) {
    const comicChannels = ['Comics_AR', 'arab_comics', 'Arab_Comics', 'koomiks'];
    const raw = await searchTelegramChannels(q, Object.assign({}, opts || {}, { channels: comicChannels, maxChannels: 4, limitPerCh: 5 }));
    return (Array.isArray(raw) ? raw : []).filter((b) => {
      const ex = b && b.extra;
      if (!ex) return false;
      if (ex.docName) return true;
      return Array.isArray(ex.extLinks) && ex.extLinks.some(u => /(?:drive\.google|mediafire|mega\.nz|archive\.org|disk\.yandex|dropbox|pixeldrain|\.(?:pdf|cbz|cbr|epub)(?:\?|#|$))/i.test(String(u || '')));
    }).map(b => Object.assign({}, b, { cat: 'comics_manga', isComic: true }));
  }

  function extractComicExternalLinks(html, baseUrl, sourceLabel) {
    const out = [];
    const seen = new Set();
    const doc = parseDoc(html);
    doc.querySelectorAll('a[href]').forEach((a) => {
      const href = absUrl(baseUrl, a.getAttribute('href'));
      if (!href || seen.has(href)) return;
      const lbl = stripTags(a.textContent || a.getAttribute('title') || '').trim();
      if (/\.(?:pdf|cbz|cbr)(?:\?|#|$)/i.test(href)) {
        seen.add(href);
        const fmt = /\.cbz/i.test(href) ? 'cbz' : (/\.cbr/i.test(href) ? 'cbr' : 'pdf');
        out.push({
          label: (lbl && lbl.length > 2 ? lbl : 'تحميل مباشر') + ' (' + fmt.toUpperCase() + ')',
          format: fmt,
          source: sourceLabel,
          url: href,
          referer: baseUrl,
        });
      } else if (/(?:mediafire\.com\/file|drive\.google\.com\/(?:file|uc|open)|mega\.nz\/|archive\.org\/download\/)/i.test(href)) {
        seen.add(href);
        out.push({
          label: lbl && lbl.length > 2 ? lbl : ('رابط تحميل — ' + sourceLabel),
          format: 'cbr',
          kind: /mediafire\.com\/file/i.test(href) ? 'mediafire_page' : 'external',
          source: sourceLabel,
          url: href,
          referer: baseUrl,
        });
      }
    });
    return out;
  }

  // 1) ComicsGate (بوابة الكوميكس - Arabic)
  async function searchComicsGate(q, opts) {
    const o = opts || {};
    const rawQ = String(o.arQuery || q || '').trim();
    const generic = isGenericComicQuery(q) || isGenericComicQuery(rawQ) || !!o.browseHome;
    const u = 'https://www.comicsgate.net/home/wp-json/wp/v2/posts?_embed=1&per_page=14'
      + (!generic && rawQ ? ('&search=' + encodeURIComponent(cleanSearchTitle(rawQ) || rawQ)) : '');
    const r = await withTimeout(KTB.http(u, { headers: { Referer: 'https://www.comicsgate.net/home/' }, signal: o.signal, tag: o.tag || '' }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    let arr = [];
    try { arr = JSON.parse(r.body); } catch (_) { arr = []; }
    if (!Array.isArray(arr)) return [];
    return arr.map((p) => {
      const title = stripTags((p && p.title && p.title.rendered) || '').trim();
      const link = String((p && p.link) || '').trim();
      if (!title || !link) return null;
      const media = p._embedded && Array.isArray(p._embedded['wp:featuredmedia']) ? p._embedded['wp:featuredmedia'][0] : null;
      const cover = (media && (media.source_url || (media.media_details && media.media_details.sizes && media.media_details.sizes.medium && media.media_details.sizes.medium.source_url))) || '';
      const summary = stripTags((p && p.excerpt && p.excerpt.rendered) || '').trim();
      const dateY = String(p.date || '').slice(0, 4);
      return normBook({
        id: 'cg_' + (p.id || Math.random().toString(36).slice(2, 8)),
        title,
        author: 'بوابة الكوميكس ComicsGate',
        cover,
        year: /^\d{4}$/.test(dateY) ? dateY : '',
        source: 'ComicsGate',
        sourceId: 'comicsgate',
        lang: 'ar',
        format: 'web',
        url: link,
        summary: summary || 'منصة بوابة الكوميكس العربية — قراءة داخل مداد وأرشيف الكوميكس والمقالات.',
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'comicsgate',
      });
    }).filter(Boolean).slice(0, 14);
  }

  async function resolveComicsGate(book) {
    const links = [];
    if (book && book.url) {
      const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://www.comicsgate.net/home/' } }), 6500, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        const ext = extractComicExternalLinks(r.body, book.url, 'ComicsGate');
        for (const l of ext) {
          if (l.kind === 'mediafire_page') {
            const mf = await resolveMediaFireDirect(l.url);
            if (mf) links.push({ label: l.label, format: l.format, source: 'ComicsGate', url: mf, referer: l.url });
          } else {
            links.push(l);
          }
        }
        const doc = parseDoc(r.body);
        doc.querySelectorAll('a[href*="phpbbx/viewtopic.php"]').forEach((a) => {
          const tu = absUrl('https://www.comicsgate.net', a.getAttribute('href'));
          if (tu) {
            links.push({
              label: 'موضوع التحميل في منتدى بوابة الكوميكس (قراءة داخل مداد)',
              format: 'web',
              kind: 'web_reader',
              source: 'ComicsGate',
              url: tu,
              referer: book.url,
            });
          }
        });
      }
      links.unshift({
        label: 'قراءة داخل مداد — بوابة الكوميكس',
        format: 'web',
        kind: 'web_reader',
        source: 'ComicsGate',
        url: book.url,
        referer: 'https://www.comicsgate.net/home/',
      });
    }
    return { links };
  }

  // 2) Arab Comics (منتدى وموقع عرب كوميكس - Arabic)
  async function searchArabComics(q, opts) {
    const o = opts || {};
    const rawQ = String(o.arQuery || q || '').trim();
    const enFallback = String(o.enQuery || '').trim();
    const generic = isGenericComicQuery(q) || isGenericComicQuery(rawQ) || !!o.browseHome;
    const queries = generic ? [''] : Array.from(new Set([cleanSearchTitle(rawQ) || rawQ, cleanSearchTitle(enFallback) || enFallback].filter(Boolean)));
    const out = [];
    const seen = new Set();

    for (const term of queries.slice(0, 2)) {
      const apiU = 'https://arabcomics.net/wp-json/wp/v2/story?_embed=1&per_page=12'
        + (term ? ('&search=' + encodeURIComponent(term)) : '');
      const r = await withTimeout(KTB.http(apiU, { headers: { Referer: 'https://arabcomics.net/' }, signal: o.signal, tag: o.tag || '' }), 6500, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        try {
          const arr = JSON.parse(r.body);
          if (Array.isArray(arr)) {
            arr.forEach((p) => {
              const title = stripTags((p && p.title && p.title.rendered) || '').trim();
              const link = String((p && p.link) || '').replace(/^http:\/\//i, 'https://').trim();
              if (!title || !link || seen.has(link)) return;
              seen.add(link);
              const media = p._embedded && Array.isArray(p._embedded['wp:featuredmedia']) ? p._embedded['wp:featuredmedia'][0] : null;
              const cover = (media && media.source_url) || '';
              out.push(normBook({
                id: 'ac_' + (p.id || Math.random().toString(36).slice(2, 8)),
                title,
                author: 'عرب كوميكس Arab Comics',
                cover,
                year: String(p.date || '').slice(0, 4),
                source: 'عرب كوميكس',
                sourceId: 'arabcomics',
                lang: 'ar',
                format: 'web',
                url: link,
                summary: stripTags((p && p.excerpt && p.excerpt.rendered) || '').trim() || 'من أضخم الأرشيفات العربية للكوميكس الأوروبية والأمريكية والمجلات الكلاسيكية.',
                cat: 'comics_manga',
                isComic: true,
                needsResolve: true,
                resolverType: 'arabcomics',
              }));
            });
          }
        } catch (_) { }
      }
      if (out.length >= 10) break;
    }

    if (!out.length && queries[0]) {
      const htmlU = 'https://arabcomics.net/%d8%a7%d9%84%d9%82%d8%b5%d8%b5-%d9%88-%d8%a7%d9%84%d9%85%d8%ac%d9%84%d8%a7%d8%aa/?search=' + encodeURIComponent(queries[0]);
      const r2 = await withTimeout(KTB.http(htmlU, { headers: { Referer: 'https://arabcomics.net/' }, signal: o.signal, tag: o.tag || '' }), 6500, { code: 0, body: '' });
      if (r2.code === 200 && r2.body) {
        const doc = parseDoc(r2.body);
        doc.querySelectorAll('a[href*="/story/"]').forEach((a) => {
          const href = absUrl('https://arabcomics.net', a.getAttribute('href'));
          if (!href || seen.has(href)) return;
          const card = a.closest('.item, article, div') || a.parentElement;
          const img = (card && card.querySelector('img')) || a.querySelector('img');
          const tEl = (card && card.querySelector('h4, h3, .down-content a')) || a;
          const title = stripTags(tEl.textContent || a.getAttribute('title') || '').trim();
          if (!title || title.length < 2) return;
          seen.add(href);
          out.push(normBook({
            id: 'ac_' + btoa(unescape(encodeURIComponent(href.slice(-36)))).replace(/[^a-z0-9]/gi, '').slice(0, 16),
            title,
            author: 'عرب كوميكس Arab Comics',
            cover: img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '',
            source: 'عرب كوميكس',
            sourceId: 'arabcomics',
            lang: 'ar',
            format: 'web',
            url: href,
            summary: 'أرشيف منتدى عرب كوميكس للقراءة والتحميل داخل مداد.',
            cat: 'comics_manga',
            isComic: true,
            needsResolve: true,
            resolverType: 'arabcomics',
          }));
        });
      }
    }
    return out.slice(0, 14);
  }

  async function resolveArabComics(book) {
    const links = [];
    if (book && book.url) {
      const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://arabcomics.net/' } }), 6500, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        const ext = extractComicExternalLinks(r.body, book.url, 'عرب كوميكس');
        links.push(...ext);
        const doc = parseDoc(r.body);
        doc.querySelectorAll('a[href*="phpbb3/viewtopic.php"]').forEach((a) => {
          const tu = absUrl('https://arabcomics.net', a.getAttribute('href'));
          if (tu) {
            links.push({
              label: 'فتح موضوع العدد بالمنتدى للتحميل (مع حفظ دخولك في مداد)',
              format: 'web',
              kind: 'web_reader',
              source: 'عرب كوميكس',
              url: tu,
              referer: book.url,
            });
          }
        });
      }
      links.unshift({
        label: 'قراءة وتصفح العدد داخل مداد — عرب كوميكس',
        format: 'web',
        kind: 'web_reader',
        source: 'عرب كوميكس',
        url: book.url,
        referer: 'https://arabcomics.net/',
      });
    }
    return { links };
  }

  // 3) Comicverse (كوميكس فيرس العربي - arcomixverse.blogspot.com)
  async function searchComicverse(q, opts) {
    const o = opts || {};
    const rawQ = String(o.enQuery || o.arQuery || q || '').trim();
    const generic = isGenericComicQuery(q) || isGenericComicQuery(rawQ) || !!o.browseHome;
    const u = 'https://arcomixverse.blogspot.com/feeds/posts/default?alt=json&max-results=14'
      + (!generic && rawQ ? ('&q=' + encodeURIComponent(cleanSearchTitle(rawQ) || rawQ)) : '');
    const r = await withTimeout(KTB.http(u, { headers: { Referer: 'https://arcomixverse.blogspot.com/' }, signal: o.signal, tag: o.tag || '' }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    let entries = [];
    try { entries = (JSON.parse(r.body).feed || {}).entry || []; } catch (_) { entries = []; }
    return entries.map((e, idx) => {
      const title = stripTags((e && e.title && e.title.$t) || '').trim();
      const alt = Array.isArray(e.link) ? e.link.find(l => l && l.rel === 'alternate') : null;
      const postUrl = alt ? alt.href : '';
      if (!title || !postUrl) return null;
      let cover = (e['media$thumbnail'] && e['media$thumbnail'].url) || '';
      if (cover) cover = cover.replace(/\/s\d+(-c)?\//i, '/s640/');
      const rawHtml = (e.content && e.content.$t) || '';
      return normBook({
        id: 'cv_' + idx + '_' + btoa(unescape(encodeURIComponent(postUrl.slice(-30)))).replace(/[^a-z0-9]/gi, '').slice(0, 12),
        title,
        author: 'كوميكس فيرس Comicverse',
        cover,
        year: String(e.published && e.published.$t || '').slice(0, 4),
        source: 'Comicverse عربي',
        sourceId: 'comicverse',
        lang: 'ar',
        format: 'web',
        url: postUrl,
        summary: stripTags(rawHtml).slice(0, 220) || 'كوميكس فيرس — أحدث سلاسل مارفل ودي سي مترجمة للعربية للقراءة أونلاين.',
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'comicverse',
        extra: { contentHtml: rawHtml.slice(0, 25000) },
      });
    }).filter(Boolean).slice(0, 14);
  }

  async function resolveComicverse(book) {
    const links = [];
    let bodyHtml = (book && book.extra && book.extra.contentHtml) || '';
    if ((!bodyHtml || bodyHtml.length < 80) && book && book.url) {
      const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://arcomixverse.blogspot.com/' } }), 6000, { code: 0, body: '' });
      if (r.code === 200 && r.body) bodyHtml = r.body;
    }
    if (bodyHtml) {
      const ext = extractComicExternalLinks(bodyHtml, (book && book.url) || 'https://arcomixverse.blogspot.com/', 'Comicverse');
      for (const l of ext) {
        if (l.kind === 'mediafire_page') {
          const mf = await resolveMediaFireDirect(l.url);
          if (mf) links.push({ label: l.label, format: l.format, source: 'Comicverse عربي', url: mf, referer: l.url });
        } else {
          links.push(l);
        }
      }
      const doc = parseDoc(bodyHtml);
      const seenSub = new Set();
      doc.querySelectorAll('a[href*="arcomixverse.blogspot.com/"]').forEach((a) => {
        const hu = a.getAttribute('href') || '';
        const txt = stripTags(a.textContent || '').trim();
        if (!hu || seenSub.has(hu) || hu === (book && book.url) || /\/search\/label/i.test(hu)) return;
        if (txt && txt.length >= 2) {
          seenSub.add(hu);
          links.push({
            label: txt + ' — قراءة داخل مداد',
            format: 'web',
            kind: 'web_reader',
            source: 'Comicverse عربي',
            url: hu,
            referer: (book && book.url) || 'https://arcomixverse.blogspot.com/',
          });
        }
      });
    }
    if (book && book.url) {
      links.unshift({
        label: 'قراءة أونلاين داخل مداد — Comicverse',
        format: 'web',
        kind: 'web_reader',
        source: 'Comicverse عربي',
        url: book.url,
        referer: 'https://arcomixverse.blogspot.com/',
      });
    }
    return { links: links.slice(0, 24) };
  }

  // 4) AZComics (https://infoazcomics.wixsite.com/azcomics - Arabic DC & Indies with MediaFire CBR/CBZ + In-App View)
  let _azSitemapCache = { at: 0, items: [] };
  async function searchAzComics(q, opts) {
    const o = opts || {};
    const now = Date.now();
    if (!_azSitemapCache.items.length || (now - _azSitemapCache.at) > 15 * 60 * 1000) {
      const r = await withTimeout(KTB.http('https://infoazcomics.wixsite.com/azcomics/pages-sitemap.xml', { signal: o.signal, tag: o.tag || '' }), 6000, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        const locs = [];
        const re = /<loc>([^<]+)<\/loc>/gi;
        let m;
        while ((m = re.exec(r.body)) !== null) {
          const u = m[1].trim();
          if (!u || /\/(?:about|contact|privacy|home|azcomics\/?$)/i.test(u)) continue;
          const slug = u.split('/').filter(Boolean).pop() || '';
          if (slug) locs.push({ url: u, slug, title: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) });
        }
        if (locs.length) _azSitemapCache = { at: now, items: locs };
      }
    }
    const items = _azSitemapCache.items;
    if (!items.length) return [];
    const generic = isGenericComicQuery(q) || !!o.browseHome;
    const enTerm = String(o.enQuery || q || '').toLowerCase();
    const toks = enTerm.split(/[^a-z0-9]+/).filter(w => w.length >= 2);
    const matched = generic
      ? items.slice(0, 12)
      : items.filter(it => {
          const s = it.slug.toLowerCase();
          return toks.some(t => s.includes(t));
        }).slice(0, 12);

    return matched.map((it) => normBook({
      id: 'az_' + it.slug.replace(/[^a-z0-9_-]/gi, '').slice(0, 26),
      title: it.title + ' (مترجم بالعربية — AZComics)',
      author: 'AZComics بالعربية',
      cover: '',
      source: 'AZComics',
      sourceId: 'azcomics',
      lang: 'ar',
      format: 'cbr',
      url: it.url,
      summary: 'أرشيف AZComics للكوميكس المترجمة للعربية (DC & Indies) — تحميل مباشر من MediaFire أو قراءة داخل مداد.',
      cat: 'comics_manga',
      isComic: true,
      needsResolve: true,
      resolverType: 'azcomics',
    }));
  }

  async function resolveAzComics(book) {
    const links = [];
    if (book && book.url) {
      const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://infoazcomics.wixsite.com/azcomics' } }), 7000, { code: 0, body: '' });
      if (r.code === 200 && r.body) {
        const mfRe = /https?:\/\/(?:www\.)?mediafire\.com\/file\/[^"'\s<>\\]+/gi;
        const foundMf = Array.from(new Set(r.body.match(mfRe) || [])).slice(0, 12);
        const mfRes = await Promise.allSettled(foundMf.slice(0, 6).map(u => withTimeout(resolveMediaFireDirect(u), 3000, '')));
        foundMf.forEach((origU, idx) => {
          const rawName = decodeURIComponent(origU.split('/').slice(-2, -1)[0] || '').replace(/_/g, ' ');
          const cleanName = rawName.replace(/\s*%[0-9a-f]{2}/gi, ' ').trim() || ('العدد #' + (idx + 1));
          const direct = (idx < mfRes.length && mfRes[idx].status === 'fulfilled') ? mfRes[idx].value : '';
          if (direct) {
            links.push({
              label: cleanName + ' — تحميل مباشر',
              dlTitle: cleanName,
              format: /\.cbz/i.test(origU) ? 'cbz' : (/\.pdf/i.test(origU) ? 'pdf' : 'cbr'),
              source: 'AZComics',
              url: direct,
              referer: origU,
            });
          } else {
            links.push({
              label: cleanName + ' — فتح MediaFire داخل مداد',
              format: 'web',
              kind: 'web_reader',
              source: 'AZComics',
              url: origU,
              referer: book.url,
            });
          }
        });
      }
      links.push({
        label: 'عرض جميع أعداد السلسلة داخل مداد — AZComics',
        format: 'web',
        kind: 'web_reader',
        source: 'AZComics',
        url: book.url,
        referer: 'https://infoazcomics.wixsite.com/azcomics',
      });
    }
    return { links };
  }

  // 5) WEBTOON (https://www.webtoons.com - Read Inside Midad + Full Episode Discovery + Offline CBZ)
  const WEBTOON_HDR = {
    Referer: 'https://www.webtoons.com/',
    Cookie: 'needGDPR=false; needCCPA=false; needCOPPA=false; pagGDPR=true;',
  };

  function normWebtoonCoverUrl(raw) {
    let u = String(raw || '').trim();
    if (!u) return '';
    if (u.startsWith('//')) u = 'https:' + u;
    else if (u.startsWith('/')) u = 'https://webtoon-phinf.pstatic.net' + u;
    return u;
  }

  function isValidWebtoonPanelUrl(u) {
    if (!u || !/^https?:\/\//i.test(u)) return false;
    const lo = u.toLowerCase();
    if (lo.includes('bg_transparency') || lo.includes('blank.gif') || lo.includes('/static/')) return false;
    return true;
  }

  async function extractWebtoonEpisodeImages(viewerUrl) {
    if (!viewerUrl) return [];
    const r = await withTimeout(KTB.http(viewerUrl, { headers: WEBTOON_HDR }), 9000, { code: 0, body: '' });
    if (r.code < 200 || r.code >= 400 || !r.body) return [];
    const urls = [];
    const seen = new Set();
    const doc = parseDoc(r.body);
    let nodes = doc.querySelectorAll('#_imageList img._images[data-url], #_imageList img._images[src], #_imageList img[data-url]');
    if (!nodes || !nodes.length) {
      nodes = doc.querySelectorAll('img._images[data-url], img._images[src]');
    }
    nodes.forEach((img) => {
      const u = normWebtoonCoverUrl(img.getAttribute('data-url') || img.getAttribute('src') || '');
      if (isValidWebtoonPanelUrl(u) && !seen.has(u)) {
        seen.add(u);
        urls.push(u);
      }
    });
    return urls;
  }

  async function searchWebtoon(q, opts) {
    const o = opts || {};
    const rawQ = String(o.enQuery || q || '').trim();
    const cleanQ = cleanSearchTitle(rawQ) || rawQ;
    const generic = isGenericComicQuery(q) || isGenericComicQuery(rawQ) || !!o.browseHome || !cleanQ;
    const isAr = o.lang === 'ar';
    const htmlUrl = generic
      ? (isAr ? 'https://www.webtoons.com/ar/' : 'https://www.webtoons.com/en/originals')
      : ('https://www.webtoons.com/en/search?keyword=' + encodeURIComponent(cleanQ));
    const immUrl = (!generic && !isAr && cleanQ)
      ? ('https://www.webtoons.com/en/search/immediate?keyword=' + encodeURIComponent(cleanQ))
      : '';

    const reqHtml = withTimeout(
      KTB.http(htmlUrl, { headers: WEBTOON_HDR, signal: o.signal, tag: o.tag || '' }),
      7000,
      { code: 0, body: '' }
    );
    const reqImm = immUrl
      ? withTimeout(KTB.http(immUrl, { headers: WEBTOON_HDR, signal: o.signal, tag: o.tag || '' }), 5500, { code: 0, body: '' })
      : Promise.resolve({ code: 0, body: '' });

    const [rHtml, rImm] = await Promise.all([reqHtml, reqImm]);
    const byNo = new Map();
    const order = [];

    if (rHtml.code === 200 && rHtml.body) {
      let htmlSrc = rHtml.body;
      if (String(rHtml.body).trim().startsWith('{')) {
        try {
          const j = JSON.parse(rHtml.body);
          if (j && j.data && typeof j.data.body === 'string') htmlSrc = j.data.body;
        } catch (_) { }
      }
      const doc = parseDoc(htmlSrc);
      doc.querySelectorAll('a[href*="title_no="]').forEach((a) => {
        const href = absUrl('https://www.webtoons.com', a.getAttribute('href'));
        const m = href.match(/title_no=(\d+)/i);
        if (!m) return;
        const titleNo = m[1];
        const card = a.closest('li') || a;
        const tEl = card.querySelector('.title, .subj, strong');
        const title = stripTags((tEl && tEl.textContent) || a.textContent || '').trim();
        if (!title || title.length < 2) return;
        const authEl = card.querySelector('.author');
        const genreEl = card.querySelector('.genre');
        const img = card.querySelector('img');
        const cover = normWebtoonCoverUrl(img ? (img.getAttribute('data-url') || img.getAttribute('data-src') || img.getAttribute('src') || '') : '');
        const cleanHref = href.replace(/&amp;/g, '&');
        if (!byNo.has(titleNo)) {
          byNo.set(titleNo, {
            titleNo,
            title,
            author: authEl ? stripTags(authEl.textContent).trim() : '',
            genre: genreEl ? stripTags(genreEl.textContent).trim() : '',
            cover,
            url: cleanHref,
          });
          order.push(titleNo);
        } else {
          const prev = byNo.get(titleNo);
          if (!prev.cover && cover) prev.cover = cover;
          if (!prev.author && authEl) prev.author = stripTags(authEl.textContent).trim();
          if (cleanHref.includes('/list?') && !prev.url.includes('/list?')) prev.url = cleanHref;
        }
      });
    }

    if (rImm.code === 200 && rImm.body) {
      try {
        const j = JSON.parse(rImm.body);
        const list = (j && j.result && Array.isArray(j.result.searchedList)) ? j.result.searchedList : [];
        list.forEach((it) => {
          const titleNo = String(it && it.titleNo ? it.titleNo : '').trim();
          const title = String(it && it.title ? it.title : '').trim();
          if (!titleNo || !title) return;
          const author = Array.isArray(it.authorNameList) ? it.authorNameList.filter(Boolean).join(' / ') : '';
          const genre = String(it.representGenre || '').trim();
          const cover = normWebtoonCoverUrl(it.thumbnailMobile || '');
          const gSlug = (genre || 'fantasy').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'fantasy';
          const tSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('series-' + titleNo);
          const isCanvas = String(it.webtoonType || '').toUpperCase() === 'CHALLENGE';
          const fallbackUrl = isCanvas
            ? ('https://www.webtoons.com/en/canvas/' + tSlug + '/list?title_no=' + titleNo)
            : ('https://www.webtoons.com/en/' + gSlug + '/' + tSlug + '/list?title_no=' + titleNo);

          if (byNo.has(titleNo)) {
            const cur = byNo.get(titleNo);
            if (!cur.author && author) cur.author = author;
            if (!cur.genre && genre) cur.genre = genre;
            if (!cur.cover && cover) cur.cover = cover;
          } else {
            byNo.set(titleNo, {
              titleNo,
              title,
              author,
              genre,
              cover,
              url: fallbackUrl,
            });
            order.push(titleNo);
          }
        });
      } catch (_) { }
    }

    const out = [];
    order.slice(0, 16).forEach((titleNo) => {
      const it = byNo.get(titleNo);
      if (!it) return;
      out.push(normBook({
        id: 'wt_' + titleNo,
        title: it.title,
        author: it.author || 'WEBTOON',
        cover: it.cover,
        source: 'WEBTOON',
        sourceId: 'webtoon',
        lang: isAr ? 'ar' : 'en',
        format: 'cbz',
        url: it.url,
        summary: (it.genre ? (it.genre + ' • ') : '') + 'قصة ويبتون متسلسلة بنظام التمرير العمودي — قراءة داخل مداد أو تحميل الحلقات بصيغة CBZ.',
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'webtoon',
        extra: { titleNo, genre: it.genre || '' },
      }));
    });
    return out;
  }

  function collectWebtoonEpisodes(doc, epMap) {
    if (!doc || !epMap) return;
    let nodes = doc.querySelectorAll('#_bottomEpisodeList a[href*="viewer?"], #_listUl a[href*="viewer?"]');
    if (!nodes || !nodes.length) {
      nodes = doc.querySelectorAll('a[href*="viewer?title_no="]');
    }
    nodes.forEach((a) => {
      const epHref = absUrl('https://www.webtoons.com', (a.getAttribute('href') || '').replace(/&amp;/g, '&'));
      const m = epHref.match(/episode_no=(\d+)/i);
      if (!epHref || !m) return;
      const no = parseInt(m[1], 10);
      if (!no || no < 1) return;
      if (epMap.has(no)) return;
      const sub = a.querySelector('.subj span, .subj') || a;
      let lbl = stripTags(sub.textContent || '').trim();
      if (!lbl || lbl.length > 90) lbl = 'Episode ' + no;
      epMap.set(no, {
        no,
        url: epHref,
        label: lbl,
        slug: 'wt_ep_' + no,
      });
    });
  }

  async function resolveWebtoon(book) {
    const links = [];
    let summary = '';
    if (book && book.url) {
      const r = await withTimeout(KTB.http(book.url, { headers: WEBTOON_HDR }), 7500, { code: 0, body: '' });
      const epMap = new Map();
      let seedViewer = '';
      if (r.code >= 200 && r.code < 400 && r.body) {
        const doc = parseDoc(r.body);
        const sumEl = doc.querySelector('.summary');
        if (sumEl) summary = stripTags(sumEl.textContent || '').trim();
        collectWebtoonEpisodes(doc, epMap);
        const firstBtn = doc.querySelector('#_btnEpisode, a[href*="episode_no=1"]');
        if (firstBtn) {
          seedViewer = absUrl('https://www.webtoons.com', (firstBtn.getAttribute('href') || '').replace(/&amp;/g, '&'));
        }
        if (!seedViewer && epMap.size) {
          const minNo = Math.min.apply(null, Array.from(epMap.keys()));
          seedViewer = epMap.get(minNo).url;
        }
        // Fetch Episode 1 viewer page whose #_bottomEpisodeList holds ALL episodes 1..N
        if (seedViewer && !String(book.url).includes('viewer?')) {
          const rv = await withTimeout(KTB.http(seedViewer, { headers: WEBTOON_HDR }), 7500, { code: 0, body: '' });
          if (rv.code >= 200 && rv.code < 400 && rv.body) {
            const vDoc = parseDoc(rv.body);
            collectWebtoonEpisodes(vDoc, epMap);
          }
        }
      }
      const eps = Array.from(epMap.values()).sort((a, b) => a.no - b.no);
      const epCountText = eps.length ? (' (' + eps.length + ' حلقة)') : '';
      links.push({
        label: 'قراءة متواصلة داخل مداد — WEBTOON' + epCountText,
        format: 'web',
        kind: 'web_reader',
        source: 'WEBTOON',
        url: book.url,
        episodeCount: eps.length,
        referer: 'https://www.webtoons.com/',
      });
      eps.slice(0, 120).forEach((ep) => {
        links.push({
          label: ep.label,
          dlTitle: (book.title || 'WEBTOON') + ' - ' + ep.label,
          chapterSlug: ep.slug,
          episodeNo: ep.no,
          format: 'cbz',
          kind: 'cbz_images',
          episodeResolver: 'webtoon',
          episodeViewerUrl: ep.url,
          readUrl: ep.url,
          source: 'WEBTOON',
          url: ep.url,
          referer: 'https://www.webtoons.com/',
        });
      });
    }
    return { links, summary };
  }

  // 6) GlobalComix (https://globalcomix.com - Rich Search JSON API + In-App Reader)
  async function searchGlobalComix(q, opts) {
    const o = opts || {};
    const rawQ = String(o.enQuery || q || '').trim();
    const effectiveQ = (!rawQ || isGenericComicQuery(rawQ)) ? 'batman' : (cleanSearchTitle(rawQ) || rawQ);
    const u = 'https://api.globalcomix.com/v1/search/query?q=' + encodeURIComponent(effectiveQ) + '&store_catalog=1&context=series&p=1&perpage=16&enrich=1';
    const r = await withTimeout(KTB.http(u, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://globalcomix.com/',
        'x-gc-web-next': '1',
        'x-gc-client': 'gck_b4d492261ec541eda44ce41de79da424',
        'x-gc-identmode': 'cookie',
      },
      signal: o.signal,
      tag: o.tag || '',
    }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    let items = [];
    try {
      const parsed = JSON.parse(r.body);
      items = (parsed && parsed.payload && parsed.payload.results && parsed.payload.results.series && parsed.payload.results.series.items) || [];
    } catch (_) { items = []; }
    return items.slice(0, 14).map((it) => {
      const title = String(it && it.name || '').trim();
      const seriesUrl = it && it.url ? absUrl('https://globalcomix.com', it.url) : '';
      if (!title || !seriesUrl) return null;
      const cover = String(it.cover_image_url || '').replace(/_small\.webp/i, '_large.webp');
      const relCount = it.total_published_releases || it.total_releases || '';
      return normBook({
        id: 'gcx_' + (it.id || Math.random().toString(36).slice(2, 8)),
        title,
        author: 'GlobalComix' + (relCount ? (' • ' + relCount + ' إصدارات') : ''),
        cover,
        source: 'GlobalComix',
        sourceId: 'globalcomix',
        lang: 'en',
        format: 'web',
        url: seriesUrl,
        summary: (it.is_free ? 'متاح مجاناً • ' : '') + 'منصة GlobalComix العالمية للكوميكس والروايات المصورة — قراءة مباشرة داخل مداد.',
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'globalcomix',
      });
    }).filter(Boolean);
  }

  async function resolveGlobalComix(book) {
    const links = [];
    if (book && book.url) {
      links.push({
        label: 'قراءة أونلاين داخل مداد — GlobalComix',
        format: 'web',
        kind: 'web_reader',
        source: 'GlobalComix',
        url: book.url,
        referer: 'https://globalcomix.com/',
      });
    }
    return { links };
  }

  // 7) Tapas (https://tapas.io - Read Inside Midad + Offline Episode CBZ Packager!)
  async function extractTapasEpisodeImages(episodeUrl) {
    if (!episodeUrl) return [];
    const r = await withTimeout(KTB.http(episodeUrl, { headers: { Referer: 'https://tapas.io/' } }), 7000, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    const urls = [];
    const doc = parseDoc(r.body);
    doc.querySelectorAll('img.content__img[data-src], article img[data-src], .viewer__body img[data-src]').forEach((img) => {
      const u = img.getAttribute('data-src') || img.getAttribute('src') || '';
      if (u && u.startsWith('http') && !urls.includes(u)) urls.push(u);
    });
    return urls;
  }

  async function searchTapas(q, opts) {
    const o = opts || {};
    const rawQ = String(o.enQuery || q || '').trim();
    const effectiveQ = (!rawQ || isGenericComicQuery(rawQ)) ? 'action' : (cleanSearchTitle(rawQ) || rawQ);
    const u = 'https://tapas.io/search?q=' + encodeURIComponent(effectiveQ);
    const r = await withTimeout(KTB.http(u, { headers: { Referer: 'https://tapas.io/' }, signal: o.signal, tag: o.tag || '' }), 6500, { code: 0, body: '' });
    if (r.code !== 200 || !r.body) return [];
    let htmlSrc = r.body;
    if (String(r.body).trim().startsWith('{')) {
      try {
        const j = JSON.parse(r.body);
        if (j && j.data && typeof j.data.body === 'string') htmlSrc = j.data.body;
      } catch (_) { }
    }
    const doc = parseDoc(htmlSrc);
    const out = [];
    const seen = new Set();
    doc.querySelectorAll('[data-href*="/series/"], a[href*="/series/"]').forEach((a) => {
      const href = String(a.getAttribute('data-href') || a.getAttribute('href') || '').trim();
      const sm = href.match(/(\/series\/[^/?#]+)/i);
      if (!sm) return;
      const cleanHref = sm[1].replace(/\/info$/, '');
      if (seen.has(cleanHref)) return;
      const slugPart = cleanHref.split('/').pop() || '';
      if (!slugPart) return;
      const card = a.matches('li, .search-item-wrap, .item-wrap, .content__item, article')
        ? a
        : (a.closest('li, .search-item-wrap, .item-wrap, .content__item, article') || a.parentElement);
      const seriesId = (card && card.getAttribute('data-series-id')) || a.getAttribute('data-series-id') || '';
      const img = (card && card.querySelector('img')) || a.querySelector('img');
      const altRaw = img ? (img.getAttribute('alt') || '') : '';
      const tNode = card && card.querySelector('.title-section a, .item__title, .title, .thumb-title, h3, h4, .info .name');
      const rawTitle = (tNode && tNode.textContent) || altRaw || a.textContent || slugPart.replace(/-/g, ' ');
      const title = stripTags(String(rawTitle || '').replace(/#_h_i_g_h_L_i_g_h_t_#|#\/_h_i_g_h_L_i_g_h_t_#/g, '')).trim();
      if (!title || title.length < 2) return;
      seen.add(cleanHref);
      const cover = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
      out.push(normBook({
        id: 'tp_' + cleanHref.replace(/[^a-z0-9_-]/gi, '').slice(0, 26),
        title,
        author: 'Tapas Comics',
        cover,
        source: 'Tapas',
        sourceId: 'tapas',
        lang: 'en',
        format: 'cbz',
        url: 'https://tapas.io' + cleanHref,
        summary: 'منصة Tapas للويب كوميكس — قراءة أونلاين داخل مداد أو تحميل الحلقات بصيغة CBZ.',
        cat: 'comics_manga',
        isComic: true,
        needsResolve: true,
        resolverType: 'tapas',
        extra: seriesId ? { seriesId } : null,
      }));
    });
    return out.slice(0, 14);
  }

  async function resolveTapas(book) {
    const links = [];
    if (book && book.url) {
      links.push({
        label: 'قراءة أونلاين داخل مداد — Tapas',
        format: 'web',
        kind: 'web_reader',
        source: 'Tapas',
        url: book.url,
        referer: 'https://tapas.io/',
      });
      let sid = (book.extra && book.extra.seriesId) || '';
      if (!sid) {
        const r = await withTimeout(KTB.http(book.url, { headers: { Referer: 'https://tapas.io/' } }), 6500, { code: 0, body: '' });
        if (r.code === 200 && r.body) {
          const sidM = r.body.match(/data-series-id=["'](\d+)["']/i);
          if (sidM) sid = sidM[1];
        }
      }
      if (sid) {
        const epR = await withTimeout(KTB.http('https://tapas.io/series/' + sid + '/episodes?page=1&sort=OLDEST&max_limit=15', {
          headers: { Referer: book.url, Accept: 'application/json' },
        }), 6500, { code: 0, body: '' });
        if (epR.code === 200 && epR.body) {
          try {
            const epBody = (JSON.parse(epR.body).data || {}).body || '';
            const epDoc = parseDoc(epBody);
            const seenEp = new Set();
            epDoc.querySelectorAll('[data-id], a[href*="/episode/"]').forEach((el) => {
              const eid = el.getAttribute('data-id') || ((el.getAttribute('href') || '').match(/\/episode\/(\d+)/) || [])[1];
              if (!eid || seenEp.has(eid)) return;
              seenEp.add(eid);
              const tEl = el.querySelector('.title, .episode__title, p') || el;
              const epTitle = stripTags(tEl.textContent || '').trim() || ('Episode #' + seenEp.size);
              const epUrl = 'https://tapas.io/episode/' + eid;
              links.push({
                label: epTitle.slice(0, 60) + ' — تحميل أوفلاين (CBZ)',
                dlTitle: (book.title || 'Tapas') + ' - ' + epTitle.slice(0, 40),
                chapterSlug: 'tp_' + eid,
                format: 'cbz',
                kind: 'cbz_images',
                episodeResolver: 'tapas',
                episodeViewerUrl: epUrl,
                source: 'Tapas',
                url: epUrl,
                referer: book.url,
              });
            });
          } catch (_) { }
        }
      }
    }
    return { links: links.slice(0, 20) };
  }

  async function searchAllComics(q, opts) {
    const o = opts || {};
    const query = String(q || '').trim();
    const langPref = o.lang || '';
    const terms = await resolveComicSearchTerms(query);
    const arQ = terms.arQuery || query;
    const enQ = terms.enQuery || o.altEng || query;
    const jobs = [];
    if (langPref !== 'en') {
      jobs.push(withTimeout(searchYskComics(arQ, { lang: 'ar', arQuery: arQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchArabComics(arQ, { arQuery: arQ, enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchComicsGate(arQ, { arQuery: arQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchComicverse(arQ, { arQuery: arQ, enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchAzComics(arQ, { enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchArchiveComicsAr(arQ, { signal: o.signal, tag: o.tag }), 6500, []));
      jobs.push(withTimeout(searchComicsTelegram(arQ, { signal: o.signal, tag: o.tag }), 6000, []));
    }
    if (langPref !== 'ar') {
      if (enQ) {
        jobs.push(withTimeout(searchYskComics(enQ, { lang: 'en', enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchGetComics(enQ, { enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchWebtoon(enQ, { enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchGlobalComix(enQ, { enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchTapas(enQ, { enQuery: enQ, browseHome: terms.isGeneric, signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchArchiveComicsEn(enQ, { signal: o.signal, tag: o.tag }), 6500, []));
        jobs.push(withTimeout(searchLibgenComics(terms.isGeneric ? 'batman' : enQ, { signal: o.signal, tag: o.tag }), 6500, []));
      }
    }
    const chunks = await Promise.all(jobs);
    return [].concat(...chunks);
  }

  // ------------------------------------------------------------------ Unified Resolver for Book Detail
  async function resolveBookDownloads(book) {
    const links = [];
    let summary = book.summary;
    let cover = book.cover;
    let pages = cleanPagesCount(book.pages);

    if (book.dlUrl) {
      const bookFmt = String(book.format || 'pdf').trim() || 'pdf';
      links.push({
        label: 'تحميل مباشر (' + bookFmt.toUpperCase() + ')',
        format: bookFmt,
        size: book.size || '',
        source: book.source || 'رابط مباشر',
        url: book.dlUrl,
        referer: book.referer || book.url,
      });
    }

    const rt = book.resolverType || '';
    if (rt === 'foulabook') {
      const res = await resolveFoulabook(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'فولة بوك' }, l)));
      if (res.summary) summary = res.summary;
      if (res.cover) cover = res.cover;
      if (res.pages && !pages) pages = cleanPagesCount(res.pages);
    } else if (rt === 'alarabimag') {
      const res = await resolveAlarabimag(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'مجلة العرب' }, l)));
    } else if (rt === '8gharb') {
      const res = await resolve8gharb(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'قهوة 8 غرب' }, l)));
      if (res.summary) summary = res.summary;
      if (res.cover && !cover) cover = res.cover;
      if (res.pages && !pages) pages = cleanPagesCount(res.pages);
    } else if (rt === 'scribd') {
      const res = await resolveScribd(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'Scribd' }, l)));
      if (res.summary) summary = res.summary;
      if (res.cover && !cover) cover = res.cover;
      if (res.pages && !pages) pages = cleanPagesCount(res.pages);
    } else if (rt === 'hindawi') {
      const res = await resolveHindawi(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'مؤسسة هنداوي' }, l)));
      if (res.summary) summary = res.summary;
      if (res.cover) cover = res.cover;
    } else if (rt === 'wikisource') {
      const res = await resolveWikisource(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'ويكي مصدر العربية' }, l)));
    } else if (rt === 'telegram') {
      const res = await resolveTelegramPost(book, book.opts);
      links.push(...res.links);
      if (res.cover && !cover) cover = res.cover;
    } else if (rt === 'yskcomics') {
      const res = await resolveYskComic(book);
      res.links.forEach(l => links.push(Object.assign({ source: book.source || 'YSK Comics' }, l)));
      if (res.summary) summary = res.summary;
      if (res.cover && !cover) cover = res.cover;
    } else if (rt === 'getcomics') {
      const res = await resolveGetComics(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'GetComics' }, l)));
    } else if (rt === 'comicsgate') {
      const res = await resolveComicsGate(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'ComicsGate' }, l)));
    } else if (rt === 'arabcomics') {
      const res = await resolveArabComics(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'عرب كوميكس' }, l)));
    } else if (rt === 'comicverse') {
      const res = await resolveComicverse(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'Comicverse عربي' }, l)));
    } else if (rt === 'azcomics') {
      const res = await resolveAzComics(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'AZComics' }, l)));
    } else if (rt === 'webtoon') {
      const res = await resolveWebtoon(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'WEBTOON' }, l)));
    } else if (rt === 'globalcomix') {
      const res = await resolveGlobalComix(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'GlobalComix' }, l)));
    } else if (rt === 'tapas') {
      const res = await resolveTapas(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'Tapas' }, l)));
    } else if (rt === 'archive' && book.extra && book.extra.iaId) {
      const preferCbz = Boolean(book.isComic || book.cat === 'comics_manga' || book.format === 'cbz' || book.extra.preferCbz);
      links.push(...await resolveArchive(book.extra.iaId, book.title, { preferCbz }));
    } else if (rt === 'waqfeya') {
      const res = await resolveWaqfeya(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'المكتبة الوقفية' }, l)));
      if (res.pages && !pages) pages = cleanPagesCount(res.pages);
    } else if (rt === 'libgen') {
      const res = await resolveLibgen(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'Library Genesis' }, l)));
      if (res.cover) cover = res.cover;
    } else if (rt === 'openlibrary') {
      const res = await resolveOpenLibrary(book);
      res.links.forEach(l => links.push(Object.assign({ source: 'OpenLibrary / Archive' }, l)));
      if (res.summary) summary = res.summary;
    } else if (rt.startsWith('web_')) {
      const engId = rt.slice(4);
      const res = await resolveWebEngine(engId, book);
      res.links.forEach(l => links.push(Object.assign({ source: book.source || engId }, l)));
    }

    const seen = new Set();
    const deduped = links.filter((l) => {
      if (!l.url || seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

    return { links: deduped, summary, cover, pages };
  }

  const linksCache = new Map();
  const LINKS_CACHE_TTL = 10 * 60 * 1000;

  const AR_CAT_LABELS = {
    mystery_classics: 'الغموض والكلاسيكيات الأدبية',
    psychology_habits: 'علم النفس وبناء العادات وتطوير الذات',
    medicine_neuro: 'الطب وعلوم الأعصاب والصحة',
    marketing_strategy: 'التسويق والإدارة والاستراتيجية',
    arabic_novels: 'الأدب والرواية العربية',
    languages_skills: 'اللغات وتطوير المهارات',
    history_thought: 'التاريخ والفكر والحضارة',
    tech_ai: 'التقنية والبرمجة والذكاء الاصطناعي',
    comics_manga: 'الكوميكس والقصص المصورة',
    islamic_heritage: 'التراث والفكر الإسلامي',
    scifi_fantasy: 'الخيال العلمي والفانتازيا',
    science_cosmos: 'العلوم والفضاء والمعرفة',
    philosophy_wisdom: 'الفلسفة والمنطق والاجتماع',
    poetry_arts: 'الشعر والبلاغة والأدب',
  };

  function isArabicBookObj(book) {
    if (!book) return false;
    return book.lang === 'ar'
      || isArabicText(book.title || '')
      || (Array.isArray(book.langs) && book.langs.includes('ar'));
  }

  function findCuratedArabicDesc(book) {
    const cur = (typeof window !== 'undefined' && window.KOTOB_CATALOG && Array.isArray(window.KOTOB_CATALOG.CURATED))
      ? window.KOTOB_CATALOG.CURATED : null;
    if (!cur || !book || !book.title) return '';
    const key = normalizeText(cleanSearchTitle(book.title, book.author));
    if (!key) return '';
    for (const c of cur) {
      if (!c || !c.desc || !isArabicText(c.desc)) continue;
      const ck = normalizeText(cleanSearchTitle(c.title || ''));
      if (ck && (ck === key || ck.includes(key) || key.includes(ck))) return c.desc;
    }
    return '';
  }

  function buildArabicFallbackSummary(book) {
    const cleanT = cleanSearchTitle((book && book.title) || '', book && book.author) || (book && book.title) || 'هذا الكتاب';
    const cleanA = cleanAuthorName((book && book.author) || '');
    const catTxt = (book && (book.subCat || AR_CAT_LABELS[book.cat])) || '';
    const parts = ['«' + cleanT + '» كتاب'];
    if (cleanA && cleanA !== 'مؤلف غير محدد') parts[0] += ' من تأليف ' + cleanA;
    if (catTxt) parts.push('في مجال ' + catTxt);
    const meta = [];
    const pg = cleanPagesCount(book && book.pages);
    if (pg) meta.push(pg + ' صفحة');
    if (book && book.year) meta.push('سنة ' + book.year);
    if (book && book.source && isArabicText(book.source)) meta.push('مصدر ' + book.source);
    let out = parts.join(' ') + (meta.length ? ' (' + meta.join(' • ') + ')' : '') + '.';
    if (Array.isArray(book && book.microTags) && book.microTags.length) {
      const arTags = book.microTags.filter(isArabicText).slice(0, 4);
      if (arTags.length) out += ' يتناول محاور: ' + arTags.join('، ') + '.';
    }
    out += ' متوفر للتصفح والتحميل المباشر داخل مكتبة مداد.';
    return out;
  }

  /**
   * Ensures Arabic books always display an Arabic description and are never overwritten
   * by English synopses fetched from international APIs (OpenLibrary, Archive, Scribd).
   */
  function ensureArabicSummary(book, candidateSummary) {
    const isAr = isArabicBookObj(book);
    const candidates = [candidateSummary, book && book.desc, book && book.summary]
      .map(s => stripTags(s || '').trim())
      .filter(s => s && s !== 'جاري جلب الوصف وروابط التحميل...');
    if (!isAr) return candidates[0] || '';
    const arList = candidates.filter(isArabicText).sort((a, b) => b.length - a.length);
    if (arList.length) return arList[0];
    const curatedDesc = findCuratedArabicDesc(book);
    if (curatedDesc) return curatedDesc;
    return buildArabicFallbackSummary(book);
  }

  /**
   * True Multi-Source Mirror Aggregator (Concurrent & Timeout-Bounded):
   * Launches primary book resolution AND all mirror sweeps in parallel with per-source timeouts
   * so the fastest links appear in <1s without stalling behind slow/unreachable hosts.
   */
  async function aggregateBookLinks(book, onUpdate) {
    const cleanTitle = cleanSearchTitle(book.title, book.author);
    const engPart = book.title.includes('—') ? book.title.split('—').slice(1).join(' ').trim() : '';
    const isAr = isArabicBookObj(book);
    const rt = book.resolverType || '';

    const cacheKey = rt + '|' + (book.url || '') + '|' + normalizeText(cleanTitle);
    const cached = linksCache.get(cacheKey);
    if (cached && (Date.now() - cached.at) < LINKS_CACHE_TTL) {
      const snap = {
        links: cached.links.slice(),
        cover: cached.cover || book.cover || '',
        summary: ensureArabicSummary(book, cached.summary || book.summary || book.desc || ''),
        pages: cached.pages || cleanPagesCount(book.pages),
      };
      if (onUpdate) onUpdate(Object.assign({}, snap, { done: true, phase: 'cache' }));
      return snap;
    }

    const allLinks = [];
    const seenUrls = new Set();
    let hasRealArSummary = isAr && (isArabicText(stripTags(book.desc || '')) || isArabicText(stripTags(book.summary || '')) || !!findCuratedArabicDesc(book));
    let bestSummary = ensureArabicSummary(book, book.desc || book.summary || '');
    let bestCover = book.cover || '';
    let bestPages = cleanPagesCount(book.pages);
    const sourcesTried = new Set();

    function pushLinks(newLinks, newCover, newSummary, newPages) {
      let changed = false;
      if (newCover && !bestCover) { bestCover = newCover; changed = true; }
      if (newPages && !bestPages) { bestPages = cleanPagesCount(newPages); if (bestPages) changed = true; }
      if (newSummary) {
        const cleanedSum = stripTags(newSummary).trim();
        if (cleanedSum) {
          if (isAr) {
            if (isArabicText(cleanedSum) && (!hasRealArSummary || cleanedSum.length > bestSummary.length + 20)) {
              bestSummary = cleanedSum;
              hasRealArSummary = true;
              changed = true;
            }
          } else if (cleanedSum.length > (bestSummary || '').length + 20) {
            bestSummary = cleanedSum;
            changed = true;
          }
        }
      }
      if (Array.isArray(newLinks)) {
        for (const l of newLinks) {
          if (!l || !l.url || seenUrls.has(l.url)) continue;
          seenUrls.add(l.url);
          allLinks.push(l);
          changed = true;
        }
      }
      return changed;
    }

    const searchQuery = cleanTitle || book.query || book.title;
    const altEngQuery = engPart && !isArabicText(engPart) ? engPart : '';
    const SOURCE_MS = 7200;

    // Seed merged alternate editions from grouped search results immediately (only real verified editions, no generic search placeholders)
    if (Array.isArray(book._mergedVariants) && book._mergedVariants.length) {
      for (const mv of book._mergedVariants) {
        if (!mv) continue;
        const mSrc = mv.source || 'نسخة بديلة';
        const mvDirect = mv.directUrl || mv.dlUrl || '';
        if (mvDirect) {
          pushLinks([{
            label: mSrc + ' — تحميل مباشر (' + String(mv.format || 'PDF').toUpperCase() + ')',
            format: mv.format || 'pdf',
            source: mSrc,
            url: mvDirect,
            referer: mv.url || '',
          }], mv.cover, mv.summary, mv.pages);
        }
        if (mv.extra && mv.extra.formats) {
          Object.entries(mv.extra.formats).forEach(([fmt, u]) => {
            if (u) pushLinks([{
              label: mSrc + ' — ' + fmt.toUpperCase(),
              format: fmt,
              source: mSrc,
              url: u,
            }], mv.cover, mv.summary, mv.pages);
          });
        }
        const mvScribd = extractScribdDocId((mv.extra && mv.extra.scribdId) || mv.url || '');
        if (mvScribd) {
          pushLinks([{
            label: 'Scribd — قراءة فورية في مداد + حفظ في المكتبة',
            format: 'pdf',
            kind: 'scribd_reader',
            source: 'Scribd',
            scribdId: mvScribd,
            url: mv.url || ('https://www.scribd.com/document/' + mvScribd),
          }], mv.cover, mv.summary, mv.pages);
        }
        if (mv.resolverType && String(mv.resolverType).startsWith('web_') && mv.url && WEB_ENGINES[String(mv.resolverType).slice(4)]) {
          const mEngId = String(mv.resolverType).slice(4);
          pushLinks([{
            label: 'تحميل سريع عبر ' + mSrc,
            format: mv.format || 'pdf',
            kind: 'webview_dl',
            engId: mEngId,
            source: mSrc,
            url: mv.url,
            dlScript: WEB_ENGINES[mEngId].dlScript,
          }], mv.cover, mv.summary, mv.pages);
        }
      }
      if (allLinks.length && onUpdate) {
        onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'merged' });
      }
    }

    async function matchAndResolve(promiseList, sourceLabel, resolveFn, maxItems) {
      sourcesTried.add(sourceLabel);
      const list = await withTimeout(promiseList, SOURCE_MS, []);
      if (!Array.isArray(list) || !list.length) return;
      const strict = list
        .filter(c => c && isStrictSameBook(book.title || cleanTitle, c.title, book.author, c.author, altEngQuery))
        .sort((a, b) => scoreSearchRelevance(book.title || cleanTitle, b, book.author || '', altEngQuery) - scoreSearchRelevance(book.title || cleanTitle, a, book.author || '', altEngQuery));
      if (!strict.length) return;
      const picked = strict.slice(0, maxItems || 2);
      const settled = await Promise.allSettled(picked.map(c => withTimeout(resolveFn(c), 3400, { links: [] })));
      let dirty = false;
      settled.forEach((s, idx) => {
        if (s.status !== 'fulfilled' || !s.value) return;
        const cand = picked[idx];
        const v = s.value;
        const resolvedArr = Array.isArray(v) ? v : (v.links || []);
        const labeled = resolvedArr.map(l => Object.assign({ source: l.source || sourceLabel }, l));
        const usableCover = (cand && cand.lang === 'ar' && !/covers\.openlibrary/i.test(cand.cover || ''))
          ? (v.cover || cand.cover || '')
          : '';
        const candPages = (v && v.pages) || (cand && cand.pages) || '';
        if (pushLinks(labeled, isAr ? usableCover : (v.cover || ''), v.summary, candPages)) dirty = true;
      });
      if (dirty && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: sourceLabel });
    }

    const primaryInput = rt === 'telegram' ? Object.assign({ opts: { skipFallbackMirrors: true } }, book) : book;
    const sweep = [];

    // 1. Primary resolution runs in parallel with mirror sweep (avoid passive background WebView stalls on web_* books)
    if (rt.startsWith('web_') && book.url && WEB_ENGINES[rt.slice(4)]) {
      const engId = rt.slice(4);
      const eng = WEB_ENGINES[engId];
      if (pushLinks([{
        label: 'تحميل مباشر عبر ' + (book.source || eng.name),
        format: book.format || 'pdf',
        kind: 'webview_dl',
        source: book.source || eng.name,
        url: book.url,
        dlScript: eng.dlScript,
      }], '', book.summary, book.pages)) {
        if (onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'primary' });
      }
    } else {
      sweep.push(withTimeout(resolveBookDownloads(primaryInput), 5500, { links: [] }).then((primary) => {
        if (pushLinks(primary.links, isAr ? primary.cover : (primary.cover || ''), primary.summary, primary.pages)) {
          if (onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'primary' });
        }
      }));
    }

    // 1b. Scribd runs right away in parallel (~300ms JSON search + 0ms resolveScribd; appears ONLY if actually matched)
    if (rt !== 'scribd') {
      const scribdTasks = [matchAndResolve(searchScribd(searchQuery), 'Scribd', resolveScribd, 1)];
      if (altEngQuery && isAr) {
        scribdTasks.push(matchAndResolve(searchScribd(altEngQuery), 'Scribd', resolveScribd, 1));
      }
      sweep.push(Promise.allSettled(scribdTasks));
    }

    // 1c. Telegram MTProto Bot Relay (if configured in Midad Settings — works for both Arabic & Foreign books)
    const mtCfgTop = getMtprotoConfig();
    if (mtCfgTop.url && !isAr) {
      sweep.push(withTimeout((async () => {
        const mtHits = await withTimeout(searchTelegramMtproto(altEngQuery || searchQuery, { format: book.format || 'pdf', tag: 'modal' }), 9000, []);
        const dirtyMt = mtHits.length && pushLinks(mtHits.map(m => ({
          label: 'تحميل مباشر عبر تيليجرام MTProto (' + String(m.format || 'PDF').toUpperCase() + (m.size ? ' • ' + m.size : '') + ')',
          format: m.format || 'pdf',
          size: m.size || '',
          source: m.source || ('تيليجرام @' + mtCfgTop.bot),
          url: m.dlUrl,
        })));
        if (dirtyMt && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'تيليجرام MTProto' });
      })(), 9500, null));
    }

    if (!bestPages) {
      sweep.push(withTimeout(resolveBookPageCount(book), 4500, '').then((pg) => {
        if (pg && !bestPages) {
          bestPages = pg;
          if (onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'pages' });
        }
      }));
    }

    // 2. Internet Archive (1 broad query for Arabic or English + alt English edition if bilingual)
    if (rt !== 'archive') {
      sweep.push(matchAndResolve(
        searchArchive(searchQuery, isAr ? { arabicOnly: false, rows: 10, label: 'الأرشيف (Archive)' } : { rows: 8 }),
        'الأرشيف (Archive)',
        (c) => resolveArchive(c.extra && c.extra.iaId, cleanTitle),
        2
      ));
      if (altEngQuery && isAr) {
        sweep.push(matchAndResolve(
          searchArchive(altEngQuery, { rows: 5 }),
          'Archive (النسخة الأصلية)',
          (c) => resolveArchive(c.extra && c.extra.iaId, altEngQuery),
          1
        ));
      }
    }

    // 3. LibGen
    if (rt !== 'libgen') {
      const lgQuery = altEngQuery || searchQuery;
      sweep.push(matchAndResolve(
        searchLibgen(lgQuery, { tag: 'modal' }),
        'Library Genesis',
        (c) => resolveLibgen(c),
        2
      ));
    }

    // 4. Arabic Libraries (Foulabook, 8gharb, Alarabimag, Hindawi, Wikisource, Waqfeya, parallel Telegram)
    if (isAr) {
      if (rt !== 'foulabook') {
        sweep.push(matchAndResolve(searchFoulabook(searchQuery), 'فولة بوك', resolveFoulabook, 1));
      }
      if (rt !== '8gharb') {
        sweep.push(matchAndResolve(search8gharb(searchQuery, { tag: 'modal' }), 'قهوة 8 غرب', resolve8gharb, 2));
      }
      if (rt !== 'alarabimag') {
        sweep.push(matchAndResolve(searchAlarabimag(searchQuery), 'مجلة العرب', resolveAlarabimag, 1));
      }
      if (rt !== 'hindawi') {
        sweep.push(matchAndResolve(
          searchHindawiHttp(searchQuery),
          'مؤسسة هنداوي',
          async (c) => (c.resolverType === 'archive' ? resolveArchive(c.extra.iaId) : resolveHindawi(c)),
          1
        ));
      }
      if (rt !== 'wikisource') {
        sweep.push(matchAndResolve(searchWikisource(searchQuery), 'ويكي مصدر العربية', resolveWikisource, 1));
      }
      if (rt !== 'waqfeya') {
        sweep.push(matchAndResolve(searchWaqfeya(searchQuery), 'المكتبة الوقفية', resolveWaqfeya, 1));
      }
      if (KTB.isAndroid() && rt !== 'web_noorbook') {
        sweep.push(withTimeout(tryFastNoorSearchHttp(book.title || searchQuery, book.author, altEngQuery).then((pickedNoor) => {
          const noorQ = extractArabicSearchQuery(book.title || searchQuery, book.author) || cleanTitle || searchQuery;
          const linkObj = (pickedNoor && pickedNoor.url)
            ? {
                label: 'تحميل سريع عبر مكتبة نور (' + String(pickedNoor.format || 'PDF').toUpperCase() + ')',
                format: pickedNoor.format || 'pdf',
                kind: 'webview_dl',
                engId: 'noorbook',
                source: 'مكتبة نور',
                url: pickedNoor.url,
                dlScript: WEB_ENGINES.noorbook.dlScript,
              }
            : {
                label: 'البحث والتحميل المباشر عبر مكتبة نور (' + String(book.format || 'PDF').toUpperCase() + ')',
                format: book.format || 'pdf',
                kind: 'web_search_dl',
                engId: 'noorbook',
                source: 'مكتبة نور',
                url: WEB_ENGINES.noorbook.searchUrl(noorQ),
              };
          const changed = pushLinks([linkObj], (pickedNoor && pickedNoor.cover) || '', '', '');
          if (changed && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'مكتبة نور' });
        }), 3000, null).then((res) => {
          if (res === null && !allLinks.some(l => l && l.engId === 'noorbook')) {
            const noorQ = extractArabicSearchQuery(book.title || searchQuery, book.author) || cleanTitle || searchQuery;
            const changed = pushLinks([{
              label: 'البحث والتحميل المباشر عبر مكتبة نور (' + String(book.format || 'PDF').toUpperCase() + ')',
              format: book.format || 'pdf',
              kind: 'web_search_dl',
              engId: 'noorbook',
              source: 'مكتبة نور',
              url: WEB_ENGINES.noorbook.searchUrl(noorQ),
            }], '', '', '');
            if (changed && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'مكتبة نور' });
          }
        }));
      }
      if (rt !== 'telegram') {
        sweep.push(withTimeout((async () => {
          const mtCfg = getMtprotoConfig();
          const [tgHits, mtHits] = await Promise.all([
            withTimeout(searchTelegramChannels(searchQuery, { maxChannels: 8, limitPerCh: 3, tag: 'modal', priority: 'low' }), 5500, []),
            mtCfg.url ? withTimeout(searchTelegramMtproto(searchQuery, { format: book.format || 'pdf', tag: 'modal' }), 7500, []) : Promise.resolve([]),
          ]);
          const dirtyMt = mtHits.length && pushLinks(mtHits.map(m => ({
            label: 'تحميل مباشر عبر تيليجرام MTProto (' + String(m.format || 'PDF').toUpperCase() + (m.size ? ' • ' + m.size : '') + ')',
            format: m.format || 'pdf',
            size: m.size || '',
            source: m.source || ('تيليجرام @' + mtCfg.bot),
            url: m.dlUrl,
          })));
          if (dirtyMt && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'تيليجرام MTProto' });

          const strict = tgHits.filter(c => isStrictSameBook(book.title || cleanTitle, c.title, book.author, c.author, altEngQuery));
          const chosen = strict.slice(0, 3);
          if (!chosen.length) return;
          const resList = await Promise.allSettled(
            chosen.map(th => withTimeout(resolveTelegramPost(th, { skipFallbackMirrors: true }), 4000, { links: [] }))
          );
          let dirty = false;
          resList.forEach((s, idx) => {
            if (s.status !== 'fulfilled' || !s.value) return;
            const th = chosen[idx];
            if (pushLinks(s.value.links, th.cover || s.value.cover || '', th.summary)) dirty = true;
          });
          if (dirty && onUpdate) onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'تيليجرام' });
        })(), 9500, null));
      }
    }

    if (book.isComic || book.cat === 'comics_manga') {
      const enAltComic = altEngQuery || '';
      const arAltComic = isAr ? searchQuery : '';
      if (isAr) {
        if (rt !== 'yskcomics') sweep.push(matchAndResolve(searchYskComics(searchQuery, { lang: 'ar', arQuery: searchQuery }), 'YSK Comics عربي', resolveYskComic, 1));
        if (rt !== 'arabcomics') sweep.push(matchAndResolve(searchArabComics(searchQuery, { arQuery: searchQuery, enQuery: enAltComic }), 'عرب كوميكس', resolveArabComics, 1));
        if (rt !== 'comicverse') sweep.push(matchAndResolve(searchComicverse(enAltComic || searchQuery, { arQuery: searchQuery, enQuery: enAltComic }), 'Comicverse عربي', resolveComicverse, 1));
        if (rt !== 'azcomics') sweep.push(matchAndResolve(searchAzComics(searchQuery, { enQuery: enAltComic || searchQuery }), 'AZComics', resolveAzComics, 1));
        if (rt !== 'comicsgate') sweep.push(matchAndResolve(searchComicsGate(searchQuery, { arQuery: searchQuery }), 'ComicsGate', resolveComicsGate, 1));
      } else {
        if (rt !== 'yskcomics') sweep.push(matchAndResolve(searchYskComics(searchQuery, { lang: 'en', enQuery: searchQuery }), 'YSK Comics', resolveYskComic, 1));
        if (rt !== 'getcomics') sweep.push(matchAndResolve(searchGetComics(searchQuery), 'GetComics', resolveGetComics, 1));
        if (rt !== 'webtoon') sweep.push(matchAndResolve(searchWebtoon(searchQuery), 'WEBTOON', resolveWebtoon, 1));
        if (rt !== 'tapas') sweep.push(matchAndResolve(searchTapas(searchQuery), 'Tapas', resolveTapas, 1));
        if (rt !== 'globalcomix') sweep.push(matchAndResolve(searchGlobalComix(searchQuery), 'GlobalComix', resolveGlobalComix, 1));
      }
    }

    // 5. Global English & Open Access Academic Libraries (DOAB, OAPEN, Gutendex, Gutenberg, StandardEbooks, OpenLibrary)
    if (!isAr || altEngQuery) {
      const enQ = altEngQuery || searchQuery;
      sweep.push(withTimeout((async () => {
        const gList = await withTimeout(searchGutenberg(enQ), 5000, []);
        const strictG = gList.filter(g => titleMatchesCandidate(enQ, g.title));
        const gLinks = [];
        strictG.slice(0, 2).forEach(g => {
          if (g.dlUrl) gLinks.push({ label: g.title + ' — Gutenberg (' + String(g.format || 'epub').toUpperCase() + ')', format: g.format || 'epub', source: 'Project Gutenberg', url: g.dlUrl, referer: g.url });
        });
        if (pushLinks(gLinks)) onUpdate && onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'Gutenberg' });
      })(), 5500, null));

      sweep.push(withTimeout((async () => {
        const seList = await withTimeout(searchStandardEbooks(enQ), 5000, []);
        const strictSe = seList.filter(s => titleMatchesCandidate(enQ, s.title));
        const seLinks = [];
        strictSe.slice(0, 2).forEach(s => {
          if (s.dlUrl) seLinks.push({ label: s.title + ' — Standard Ebooks', format: s.format || 'epub', source: 'Standard Ebooks', url: s.dlUrl, referer: s.url });
        });
        if (pushLinks(seLinks)) onUpdate && onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'StandardEbooks' });
      })(), 5500, null));

      sweep.push(withTimeout((async () => {
        const [doabList, oapenList, gdxList] = await Promise.all([
          withTimeout(searchDoab(enQ), 4500, []),
          withTimeout(searchOapen(enQ), 4500, []),
          withTimeout(searchGutendex(enQ), 4500, []),
        ]);
        const oaLinks = [];
        [...doabList, ...oapenList, ...gdxList]
          .filter(x => x && x.dlUrl && isStrictSameBook(enQ, x.title, book.author, x.author, ''))
          .slice(0, 4)
          .forEach(x => {
            oaLinks.push({ label: x.title + ' (' + String(x.format || 'PDF').toUpperCase() + ')', format: x.format || 'pdf', size: x.size || '', source: x.source, url: x.dlUrl, referer: x.url });
          });
        if (pushLinks(oaLinks)) onUpdate && onUpdate({ links: allLinks.slice(), cover: bestCover, summary: bestSummary, pages: bestPages, done: false, phase: 'DOAB / OAPEN' });
      })(), 5500, null));

      if (rt !== 'openlibrary') {
        sweep.push(matchAndResolve(searchOpenLibrary(enQ), 'OpenLibrary', resolveOpenLibrary, 1));
      }
    }

    // 6. Arabic & Foreign Comics Mirror Sweep (YSK Comics AR/EN, GetComics, Archive Comics, LibGen Comics)
    const isComicItem = Boolean(book.isComic || book.cat === 'comics_manga' || String(book.format || '').toLowerCase() === 'cbz' || isComicQuery(searchQuery));
    if (isComicItem) {
      const comicEnQ = altEngQuery || (!isAr ? searchQuery : '');
      if (rt !== 'yskcomics') {
        if (isAr) {
          sweep.push(matchAndResolve(searchYskComics(searchQuery, { lang: 'ar', tag: 'modal' }), 'YSK Comics عربي', resolveYskComic, 1));
        }
        if (comicEnQ) {
          sweep.push(matchAndResolve(searchYskComics(comicEnQ, { lang: 'en', tag: 'modal' }), 'YSK Comics', resolveYskComic, 1));
        }
      }
      if (rt !== 'getcomics' && comicEnQ) {
        sweep.push(matchAndResolve(searchGetComics(comicEnQ, { tag: 'modal' }), 'GetComics', resolveGetComics, 1));
      }
      if (rt !== 'archive') {
        if (isAr) {
          sweep.push(matchAndResolve(searchArchiveComicsAr(searchQuery, { rows: 6 }), 'أرشيف الكوميكس عربي', (c) => resolveArchive(c.extra && c.extra.iaId, cleanTitle, { preferCbz: true }), 1));
        }
        if (comicEnQ) {
          sweep.push(matchAndResolve(searchArchiveComicsEn(comicEnQ, { rows: 6 }), 'Archive Comics', (c) => resolveArchive(c.extra && c.extra.iaId, comicEnQ, { preferCbz: true }), 1));
        }
      }
      if (rt !== 'libgen' && comicEnQ) {
        sweep.push(matchAndResolve(searchLibgenComics(comicEnQ, { tag: 'modal' }), 'LibGen Comics', resolveLibgen, 1));
      }
    }

    await Promise.allSettled(sweep);
    bestSummary = ensureArabicSummary(book, bestSummary);
    if (allLinks.length) {
      if (linksCache.size >= 40) linksCache.delete(linksCache.keys().next().value);
      linksCache.set(cacheKey, {
        at: Date.now(),
        links: allLinks.slice(),
        cover: bestCover,
        summary: bestSummary,
        pages: bestPages,
      });
    }
    if (onUpdate) {
      onUpdate({
        links: allLinks.slice(),
        cover: bestCover,
        summary: bestSummary,
        pages: bestPages,
        done: true,
        sourcesTried: Array.from(sourcesTried),
      });
    }
    return { links: allLinks, cover: bestCover, summary: bestSummary, pages: bestPages };
  }

  // ------------------------------------------------------------------ Author Hub & Bio + Similar Books
  const authorBioCache = {};

  function cleanAuthorName(raw) {
    return String(raw || '')
      .split(/[,،/&|;]/)[0]
      .replace(/^(?:د\.|أ\.|الدكتور|الكاتب|المؤلف|By)\s+/i, '')
      .replace(/\s*\([^)]*\)/g, '')
      .trim();
  }

  async function fetchAuthorBio(authorName) {
    const clean = cleanAuthorName(authorName);
    if (!clean || clean === 'مؤلف غير محدد') return null;
    if (authorBioCache[clean]) return authorBioCache[clean];

    const isAr = isArabicText(clean);
    const langs = isAr ? ['ar', 'en'] : ['en', 'ar'];
    let bio = { name: clean, extract: '', image: '', birthDate: '', topWork: '', workCount: 0 };

    // Parallel Wikipedia + OpenLibrary Author Metadata
    const [wikiRes, olRes] = await Promise.all([
      (async () => {
        for (const lg of langs) {
          const url = 'https://' + lg + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(clean.replace(/\s+/g, '_'));
          const r = await KTB.http(url);
          if (r.code === 200 && r.body) {
            try {
              const d = JSON.parse(r.body);
              if (d.extract && d.type !== 'disambiguation') {
                return {
                  name: d.title || clean,
                  extract: d.extract,
                  image: (d.thumbnail && d.thumbnail.source) || '',
                };
              }
            } catch (_) { }
          }
        }
        return null;
      })(),
      (async () => {
        const u = 'https://openlibrary.org/search/authors.json?q=' + encodeURIComponent(clean) + '&limit=3';
        const r = await KTB.http(u);
        if (r.code === 200 && r.body) {
          try {
            const d = JSON.parse(r.body);
            const doc = d.docs && d.docs[0];
            if (doc) {
              return {
                olKey: doc.key,
                birthDate: doc.birth_date || '',
                topWork: doc.top_work || '',
                workCount: doc.work_count || 0,
              };
            }
          } catch (_) { }
        }
        return null;
      })(),
    ]);

    if (wikiRes) {
      bio.name = wikiRes.name || clean;
      bio.extract = wikiRes.extract || '';
      bio.image = wikiRes.image || '';
    }
    if (olRes) {
      bio.birthDate = olRes.birthDate || '';
      bio.topWork = olRes.topWork || '';
      bio.workCount = olRes.workCount || 0;
      if (!bio.image && olRes.olKey) {
        bio.image = 'https://covers.openlibrary.org/a/olid/' + olRes.olKey + '-M.jpg';
      }
    }
    authorBioCache[clean] = bio;
    return bio;
  }

  async function searchOpenLibraryAuthor(authorClean) {
    const u = 'https://openlibrary.org/search.json?author=' + encodeURIComponent(authorClean)
      + '&fields=key,title,author_name,first_publish_year,cover_i,ia,language,ebook_access&limit=20';
    const r = await KTB.http(u);
    if (r.code !== 200) return [];
    try {
      const docs = JSON.parse(r.body).docs || [];
      return docs.map((d) => {
        const iaId = Array.isArray(d.ia) && d.ia.length ? d.ia[0] : '';
        return normBook({
          id: 'ol_' + String(d.key || '').replace(/\W+/g, '_'),
          title: d.title,
          author: Array.isArray(d.author_name) ? d.author_name.slice(0, 2).join('، ') : authorClean,
          cover: d.cover_i ? 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg' : '',
          source: iaId ? 'OpenLibrary (قابل للتحميل)' : 'OpenLibrary',
          sourceId: 'openlibrary',
          lang: Array.isArray(d.language) && d.language.includes('ara') ? 'ar' : 'en',
          year: d.first_publish_year,
          format: iaId ? 'pdf / epub' : 'epub',
          url: 'https://openlibrary.org' + (d.key || ''),
          needsResolve: !!iaId,
          resolverType: iaId ? 'archive' : 'openlibrary',
          extra: { iaId, olKey: d.key },
        });
      });
    } catch (_) {
      return [];
    }
  }

  async function searchAuthorBooks(authorName, onChunk) {
    const clean = cleanAuthorName(authorName);
    if (!clean) return [];
    const jobs = [
      searchFoulabook(clean),
      searchAlarabimag(clean),
      searchArchive(clean, isArabicText(clean) ? 'ar' : 'all'),
      searchOpenLibraryAuthor(clean),
      searchGutenberg(clean),
      searchLibgen(clean),
    ];
    const all = [];
    const seen = new Set();
    await Promise.all(jobs.map(async (p) => {
      try {
        const list = await p;
        const fresh = [];
        const needle = clean.toLowerCase();
        for (const item of (list || [])) {
          const k = normTitleKey(item.title) || item.id;
          if (seen.has(k)) continue;
          seen.add(k);
          const a = String(item.author || '').toLowerCase();
          const t = String(item.title || '').toLowerCase();
          if (!a || a.includes(needle) || needle.split(/\s+/).some(w => w.length > 2 && (a.includes(w) || t.includes(w)))) {
            fresh.push(item);
            all.push(item);
          }
        }
        if (fresh.length && onChunk) onChunk(fresh);
      } catch (_) { }
    }));
    return all;
  }

  function normTitleKey(t) {
    return String(t || '').toLowerCase().replace(/[^\u0600-\u06FFa-z0-9]+/g, '');
  }

  function scoreSimilar(seed, cand) {
    if (!seed || !cand) return -1;
    if (seed.id === cand.id || normTitleKey(seed.title) === normTitleKey(cand.title)) return -1;
    let s = 0;
    const sa = cleanAuthorName(seed.author).toLowerCase();
    const ca = cleanAuthorName(cand.author).toLowerCase();
    if (sa && ca && sa === ca) s += 5;
    if (seed.cat && cand.cat && seed.cat === cand.cat) s += 3.2;
    const seedTags = new Set((seed.tags || []).map(x => String(x).toLowerCase()));
    const candTags = (cand.tags || []).map(x => String(x).toLowerCase());
    for (const tg of candTags) {
      if (seedTags.has(tg)) s += 2.6;
    }
    const sw = String(seed.title + ' ' + (seed.desc || seed.summary || '')).toLowerCase().split(/\s+/).filter(w => w.length >= 4);
    const ct = String(cand.title + ' ' + (cand.desc || cand.summary || '')).toLowerCase();
    let hits = 0;
    for (const w of sw) {
      if (hits >= 4) break;
      if (ct.includes(w)) { s += 1.2; hits++; }
    }
    return s;
  }

  async function fetchSimilarOnline(seedBook) {
    if (!seedBook) return [];
    const tags = Array.isArray(seedBook.tags) && seedBook.tags.length
      ? seedBook.tags.slice(0, 2).join(' ')
      : '';
    const cleanAuth = cleanAuthorName(seedBook.author);
    const q = tags || (cleanAuth && cleanAuth !== 'مؤلف غير محدد' ? cleanAuth : cleanSearchTitle(seedBook.title));
    if (!q) return [];
    const isAr = isArabicText(seedBook.title) || seedBook.lang === 'ar';
    const [arch, ol, fb, ws, tg] = await Promise.all([
      searchArchive(q, isAr ? { arabicOnly: true, rows: 8 } : { rows: 8 }).catch(() => []),
      searchOpenLibrary(q).catch(() => []),
      isAr ? searchFoulabook(q).catch(() => []) : Promise.resolve([]),
      isAr ? searchWikisource(q).catch(() => []) : Promise.resolve([]),
      isAr ? searchTelegramChannels(cleanSearchTitle(seedBook.title) || q, { maxChannels: 3, limitPerCh: 2 }).catch(() => []) : Promise.resolve([]),
    ]);
    const merged = isAr ? [...fb, ...tg, ...ws, ...arch, ...ol] : [...arch, ...ol];
    const seedKey = normTitleKey(seedBook.title);
    return merged.filter(b => normTitleKey(b.title) !== seedKey).slice(0, 14);
  }

  const coverResolveCache = {};

  function normalizeCoverUrl(u) {
    let s = String(u || '').trim();
    if (!s || /nophoto|no_cover|placeholder/i.test(s)) return '';
    if (s.startsWith('http://books.google.')) s = 'https://' + s.slice(7);
    s = s.replace(/&edge=curl/gi, '');
    if (/mzstatic\.com/i.test(s)) {
      s = s.replace(/\/\d+x\d+bb\./i, '/600x600bb.');
    }
    if (/gr-assets\.com|goodreads\.com/i.test(s)) {
      s = s.replace(/\._S[XY]\d+_/i, '');
    }
    if (/covers\.openlibrary\.org\/b\/id\/\d+-[SM]\.jpg/i.test(s)) {
      s = s.replace(/-[SM]\.jpg$/i, '-L.jpg');
    }
    return s;
  }

  function isSummaryNoiseCover(origTitle, candTitle) {
    if (/ملخص|خلاص|summary|instaread|workbook/i.test(String(origTitle || ''))) return false;
    return /^ملخص\b|ملخص كتاب|\bsummary of\b|\bsummary:\b|\binstaread\b|\bworkbook\b|\bstudy guide\b/i.test(String(candTitle || ''));
  }

  function pickBestItunesCover(bodyStr, matchTitle, origTitle, authorHint) {
    try {
      const list = JSON.parse(bodyStr).results || [];
      const na = normalizeText(cleanAuthorName(authorHint || ''));
      let bestUrl = '';
      let bestScore = -1;
      for (const it of list) {
        const art = it && (it.artworkUrl100 || it.artworkUrl60);
        const name = it && (it.trackName || it.collectionName || '');
        if (!art || !name) continue;
        if (isSummaryNoiseCover(origTitle, name)) continue;
        if (!titleMatchesCandidate(matchTitle, name)) continue;
        let sc = 10;
        const nArtist = normalizeText(it.artistName || '');
        if (na && nArtist && na.split(' ').some(w => w.length >= 3 && nArtist.includes(w))) sc += 8;
        if (it.releaseDate && String(it.releaseDate) >= '2016') sc += 3;
        if (sc > bestScore) {
          bestScore = sc;
          bestUrl = normalizeCoverUrl(String(art).replace(/\/\d+x\d+bb\./i, '/600x600bb.'));
        }
      }
      return bestUrl;
    } catch (_) {
      return '';
    }
  }

  function pickBestGoodreadsCover(bodyStr, matchTitle, origTitle, authorHint) {
    try {
      const arr = JSON.parse(bodyStr);
      if (!Array.isArray(arr)) return '';
      const na = normalizeText(cleanAuthorName(authorHint || ''));
      const shortQ = String(matchTitle || '').split(/\s+/).slice(0, 5).join(' ');
      let bestUrl = '';
      let bestScore = -1;
      for (const x of arr) {
        const img = x && x.imageUrl;
        const candT = (x && (x.bookTitleBare || x.title)) || '';
        if (!img || /nophoto/i.test(img) || !candT) continue;
        if (isSummaryNoiseCover(origTitle, candT)) continue;
        if (!titleMatchesCandidate(shortQ, candT)) continue;
        let sc = 10;
        const nAuth = normalizeText((x.author && x.author.name) || '');
        if (na && nAuth && na.split(' ').some(w => w.length >= 3 && nAuth.includes(w))) sc += 8;
        if (Number(x.ratingsCount || 0) >= 100) sc += 4;
        if (sc > bestScore) {
          bestScore = sc;
          bestUrl = normalizeCoverUrl(img);
        }
      }
      return bestUrl;
    } catch (_) {
      return '';
    }
  }

  async function resolveBookCover(book, opts) {
    if (!book || !book.title) return '';
    if (book.sourceId === 'yskcomics' && book.extra && book.extra.slug) {
      try {
        const res = await resolveYskComic(book);
        if (res && res.cover) return res.cover;
      } catch (_) { }
    }
    const cleanQ = cleanSearchTitle(book.title, book.author) || cleanDisplayBookTitle(book.title, book.author);
    if (!cleanQ) return '';
    const isAr = book.lang === 'ar' || isArabicText(cleanQ);
    const cacheKey = (isAr ? 'ar:' : 'en:') + normalizeText(cleanQ);
    const force = Boolean(opts && opts.force);
    if (!force && Object.prototype.hasOwnProperty.call(coverResolveCache, cacheKey) && coverResolveCache[cacheKey]) {
      return coverResolveCache[cacheKey];
    }

    const prio = (opts && opts.priority) || 'low';
    const covHttpOpts = { tag: 'cover', priority: prio, timeoutMs: prio === 'high' ? 4500 : 3200 };
    const engRaw = String(book.title || '').includes('—')
      ? String(book.title).split('—').slice(1).join(' ').replace(/\(.*?\)/g, '').trim()
      : '';
    const cleanAuth = cleanAuthorName(book.author || '');
    const grQuery = cleanQ + (cleanAuth ? (' ' + cleanAuth) : '');

    let found = '';
    if (isAr) {
      const tasks = [
        KTB.http('https://www.goodreads.com/book/auto_complete?format=json&q=' + encodeURIComponent(grQuery), covHttpOpts).catch(() => null),
        KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(cleanQ) + '&entity=ebook&limit=6', covHttpOpts).catch(() => null),
        KTB.http('https://www.abjjad.com/search?q=' + encodeURIComponent(cleanQ), covHttpOpts).catch(() => null),
        KTB.http('https://openlibrary.org/search.json?q=' + encodeURIComponent(cleanQ) + '&language=ara&fields=title,cover_i&limit=5', covHttpOpts).catch(() => null),
      ];
      if (engRaw && /[A-Za-z]{3,}/.test(engRaw)) {
        tasks.push(KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(engRaw) + '&entity=ebook&limit=6', covHttpOpts).catch(() => null));
      }
      const [grRes, itRes, abjRes, olRes, itEnPrimary] = await Promise.all(tasks);

      if (itEnPrimary && itEnPrimary.code === 200 && itEnPrimary.body) {
        found = pickBestItunesCover(itEnPrimary.body, engRaw, book.title, book.author);
      }
      if (!found && abjRes && abjRes.code === 200 && abjRes.body) {
        try {
          const doc = parseDoc(abjRes.body);
          const imgs = doc.querySelectorAll('img[src*="cdn.abjjad.com/pub/"]');
          for (const img of imgs) {
            const alt = img.getAttribute('alt') || '';
            const src = normalizeCoverUrl(img.getAttribute('src') || '');
            if (src && isArabicText(alt) && titleMatchesCandidate(cleanQ, alt)) {
              found = src;
              break;
            }
          }
        } catch (_) { }
      }
      if (!found && itRes && itRes.code === 200 && itRes.body) {
        found = pickBestItunesCover(itRes.body, cleanQ, book.title, book.author);
      }
      if (!found && grRes && grRes.code === 200 && grRes.body) {
        found = pickBestGoodreadsCover(grRes.body, cleanQ, book.title, book.author);
      }
      if (!found && olRes && olRes.code === 200 && olRes.body) {
        try {
          for (const d of (JSON.parse(olRes.body).docs || [])) {
            if (d.cover_i && !isSummaryNoiseCover(book.title, d.title) && titleMatchesCandidate(cleanQ, d.title)) {
              found = 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg';
              break;
            }
          }
        } catch (_) { }
      }
      if (!found) {
        const altEn = engRaw || (force ? await translateTextQuick(cleanQ, 'en') : '');
        const fbTasks = [
          searchFoulabook(cleanQ).catch(() => []),
          searchArchive(cleanQ, { arabicOnly: true, rows: 4 }).catch(() => []),
        ];
        if (altEn && /[A-Za-z]{3,}/.test(altEn)) {
          fbTasks.push(KTB.http('https://www.goodreads.com/book/auto_complete?format=json&q=' + encodeURIComponent(altEn), covHttpOpts).catch(() => null));
          fbTasks.push(KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(altEn) + '&entity=ebook&limit=5', covHttpOpts).catch(() => null));
        }
        const [fbHits, iaHits, grEnRes, itEnRes] = await Promise.all(fbTasks);
        if (!found && itEnRes && itEnRes.code === 200 && itEnRes.body) {
          found = pickBestItunesCover(itEnRes.body, altEn, book.title, book.author);
        }
        if (!found && grEnRes && grEnRes.code === 200 && grEnRes.body) {
          found = pickBestGoodreadsCover(grEnRes.body, altEn, book.title, book.author);
        }
        if (!found) {
          for (const h of [...(fbHits || []), ...(iaHits || [])]) {
            if (h && h.cover && isArabicText(h.title) && titleMatchesCandidate(cleanQ, h.title + ' ' + (h.summary || ''))) {
              found = normalizeCoverUrl(h.cover);
              if (found) break;
            }
          }
        }
      }
    } else {
      const engQ = engRaw || cleanQ;
      const [itRes, grRes, olRes] = await Promise.all([
        KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(engQ + (cleanAuth ? (' ' + cleanAuth) : '')) + '&entity=ebook&limit=6', covHttpOpts).catch(() => null),
        KTB.http('https://www.goodreads.com/book/auto_complete?format=json&q=' + encodeURIComponent(engQ + (cleanAuth ? (' ' + cleanAuth) : '')), covHttpOpts).catch(() => null),
        KTB.http('https://openlibrary.org/search.json?q=' + encodeURIComponent(engQ) + '&fields=title,cover_i&limit=5', covHttpOpts).catch(() => null),
      ]);
      if (itRes && itRes.code === 200 && itRes.body) {
        found = pickBestItunesCover(itRes.body, engQ, book.title, book.author);
      }
      if (!found && grRes && grRes.code === 200 && grRes.body) {
        found = pickBestGoodreadsCover(grRes.body, engQ, book.title, book.author);
      }
      if (!found && olRes && olRes.code === 200 && olRes.body) {
        try {
          for (const d of (JSON.parse(olRes.body).docs || [])) {
            if (d.cover_i && !isSummaryNoiseCover(book.title, d.title) && titleMatchesCandidate(engQ, d.title)) {
              found = 'https://covers.openlibrary.org/b/id/' + d.cover_i + '-L.jpg';
              break;
            }
          }
        } catch (_) { }
      }
    }

    if (found) coverResolveCache[cacheKey] = found;
    return found || '';
  }

  // ------------------------------------------------------------------ Real Online Reader Reviews (+ Arabic Auto-Translation)
  const onlineReviewsCache = new Map();
  const ONLINE_REVIEWS_TTL = 1000 * 60 * 30;

  function looksPrimarilyArabic(text) {
    const s = String(text || '').trim();
    if (!s) return false;
    const ar = (s.match(/[\u0600-\u06FF]/g) || []).length;
    const lat = (s.match(/[A-Za-z]/g) || []).length;
    return ar > 0 && ar >= lat;
  }

  async function translateTextQuick(text, targetLang) {
    const raw = stripTags(String(text || '')).replace(/\s+/g, ' ').trim();
    if (!raw || raw.length < 4) return '';
    const tl = targetLang || 'ar';
    if (tl === 'ar' && looksPrimarilyArabic(raw)) return raw;
    if (tl === 'en' && !/[\u0600-\u06FF]/.test(raw)) return raw;
    const clipped = raw.slice(0, 650);
    try {
      const u = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl='
        + encodeURIComponent(tl) + '&dt=t&q=' + encodeURIComponent(clipped);
      const r = await withTimeout(KTB.http(u), 3200, null);
      if (!r || r.code !== 200 || !r.body) return '';
      const arr = JSON.parse(r.body);
      const chunks = Array.isArray(arr && arr[0]) ? arr[0] : [];
      const joined = chunks.map(seg => (Array.isArray(seg) && seg[0]) ? String(seg[0]) : '').join('').trim();
      return joined || '';
    } catch (_) {
      return '';
    }
  }

  async function fetchArchiveReviewsForId(iaId) {
    if (!iaId) return [];
    try {
      const r = await withTimeout(KTB.http('https://archive.org/metadata/' + encodeURIComponent(iaId) + '/reviews'), 3500, null);
      if (!r || r.code !== 200 || !r.body) return [];
      const data = JSON.parse(r.body);
      const rows = Array.isArray(data && data.result) ? data.result : [];
      return rows.map((rv, idx) => {
        const body = stripTags((rv && rv.reviewbody) || '').replace(/\s+/g, ' ').trim();
        const heading = stripTags((rv && rv.reviewtitle) || '').replace(/\s+/g, ' ').trim();
        const combined = heading && body && !body.toLowerCase().includes(heading.toLowerCase())
          ? (heading + ' — ' + body)
          : (body || heading);
        const stars = Math.max(1, Math.min(5, Math.round(Number(rv && rv.stars) || 5)));
        const ts = rv && rv.createdate ? (Date.parse(String(rv.createdate).replace(' ', 'T')) || Date.now()) : Date.now();
        return {
          id: 'ext_ia_' + iaId + '_' + idx,
          authorName: String((rv && rv.reviewer) || 'قارئ أرشيف الكتب').trim().slice(0, 42),
          rating: stars,
          text: combined.slice(0, 520),
          rawHeading: heading,
          ts,
          sourceName: 'أرشيف الكتب العالمي',
        };
      }).filter(x => {
        if (x.text.length < 12) return false;
        const tLow = x.text.toLowerCase();
        if (/optical character recognition|\bocr\b|\bscanner\b|barcode|checksum|\btried\s*-\s*\d{6,}/.test(tLow)) return false;
        if (/^\s*[\w\s.\-]{0,16}\d{7,}\s*$/.test(x.text)) return false;
        return true;
      });
    } catch (_) {
      return [];
    }
  }

  async function fetchRealOnlineReviews(book) {
    if (!book || !book.title) return { reviews: [], externalStats: null };
    const cleanTitle = cleanDisplayBookTitle(book.title, book.author) || cleanSearchTitle(book.title, book.author);
    if (!cleanTitle || cleanTitle.length < 2) return { reviews: [], externalStats: null };
    const iaDirect = book.extra && book.extra.iaId ? String(book.extra.iaId) : '';
    const cacheKey = normalizeText(cleanTitle) + '|' + normalizeText(book.author || '') + '|' + iaDirect;
    const hit = onlineReviewsCache.get(cacheKey);
    if (hit && (Date.now() - hit.at) < ONLINE_REVIEWS_TTL) return hit.data;

    const engPart = String(book.title || '').includes('—')
      ? String(book.title).split('—').slice(1).join(' ').replace(/\(.*?\)/g, '').trim()
      : '';
    const altEnQuery = engPart && /[A-Za-z]{3,}/.test(engPart)
      ? engPart
      : (looksPrimarilyArabic(cleanTitle) ? await translateTextQuick(cleanTitle, 'en') : '');
    const primaryQuery = altEnQuery && /[A-Za-z]{3,}/.test(altEnQuery) ? altEnQuery : cleanTitle;
    const gbQuery = encodeURIComponent(primaryQuery + (book.author ? (' ' + cleanAuthorName(book.author)) : ''));

    const [directIaRevs, iaSearchRes, olRes, gbRes] = await Promise.all([
      iaDirect ? fetchArchiveReviewsForId(iaDirect) : Promise.resolve([]),
      !iaDirect
        ? withTimeout(
            KTB.http('https://archive.org/advancedsearch.php?q=' + encodeURIComponent('title:("' + primaryQuery + '") AND mediatype:(texts)') + '&fl[]=identifier,title&rows=3&page=1&output=json'),
            3800,
            null
          )
        : Promise.resolve(null),
      withTimeout(
        KTB.http('https://openlibrary.org/search.json?q=' + encodeURIComponent(primaryQuery) + '&limit=3&fields=key,title,author_name,ratings_average,ratings_count,ia'),
        3800,
        null
      ),
      withTimeout(
        KTB.http('https://www.googleapis.com/books/v1/volumes?q=' + gbQuery + '&maxResults=4&fields=items(volumeInfo(title,authors,averageRating,ratingsCount))'),
        3800,
        null
      ),
    ]);

    const extraIaIds = new Set();
    if (iaSearchRes && iaSearchRes.code === 200 && iaSearchRes.body) {
      try {
        for (const doc of ((JSON.parse(iaSearchRes.body).response || {}).docs || [])) {
          if (doc && doc.identifier && (titleMatchesCandidate(primaryQuery, doc.title) || titleMatchesCandidate(cleanTitle, doc.title))) {
            extraIaIds.add(doc.identifier);
          }
        }
      } catch (_) { }
    }

    let externalStats = null;
    if (olRes && olRes.code === 200 && olRes.body) {
      try {
        for (const doc of (JSON.parse(olRes.body).docs || [])) {
          if (!titleMatchesCandidate(primaryQuery, doc.title) && !titleMatchesCandidate(cleanTitle, doc.title)) continue;
          if (Array.isArray(doc.ia) && doc.ia[0] && extraIaIds.size < 2) {
            extraIaIds.add(String(doc.ia[0]));
          }
          const avg = Number(doc.ratings_average || 0);
          const cnt = Number(doc.ratings_count || 0);
          if (avg > 0 && cnt > 0 && (!externalStats || cnt > externalStats.count)) {
            externalStats = { average: avg, count: cnt, source: 'OpenLibrary' };
          }
        }
      } catch (_) { }
    }

    if (gbRes && gbRes.code === 200 && gbRes.body) {
      try {
        for (const it of (JSON.parse(gbRes.body).items || [])) {
          const vi = it && it.volumeInfo;
          if (!vi || (!titleMatchesCandidate(primaryQuery, vi.title) && !titleMatchesCandidate(cleanTitle, vi.title))) continue;
          const avg = Number(vi.averageRating || 0);
          const cnt = Number(vi.ratingsCount || 0);
          if (avg > 0 && cnt > 0 && (!externalStats || cnt > externalStats.count)) {
            externalStats = { average: avg, count: cnt, source: 'Google Books' };
          }
        }
      } catch (_) { }
    }

    const extraRevsList = await Promise.all(
      Array.from(extraIaIds).slice(0, 2).map(id => fetchArchiveReviewsForId(id))
    );

    const rawCollected = [...directIaRevs, ...extraRevsList.flat()];
    const dedupRevs = [];
    const seenTexts = new Set();
    for (const rv of rawCollected) {
      const sig = normalizeText(rv.text).slice(0, 80);
      if (!sig || seenTexts.has(sig)) continue;
      seenTexts.add(sig);
      dedupRevs.push(rv);
      if (dedupRevs.length >= 6) break;
    }

    const translatedRevs = await Promise.all(dedupRevs.map(async (rv) => {
      const isAr = looksPrimarilyArabic(rv.text);
      let finalText = rv.text;
      let wasTranslated = false;
      if (!isAr) {
        const tr = await translateTextQuick(rv.text, 'ar');
        if (tr && looksPrimarilyArabic(tr)) {
          finalText = tr;
          wasTranslated = true;
        }
      }
      return {
        id: rv.id,
        authorName: rv.authorName,
        rating: rv.rating,
        tag: wasTranslated ? 'مترجم من مراجعة عالمية' : 'مراجعة قارئ حقيقية',
        text: finalText,
        helpfulCount: 0,
        ts: rv.ts,
        isUser: false,
        isExternal: true,
        translated: wasTranslated,
        sourceName: rv.sourceName,
      };
    }));

    const out = { reviews: translatedRevs, externalStats };
    onlineReviewsCache.set(cacheKey, { at: Date.now(), data: out });
    return out;
  }

  // ------------------------------------------------------------------ Audiobooks Discovery & Track Resolver
  const audioTracksCache = new Map();
  const audioRssParsedCache = new Map();

  const AR_AUDIO_RSS_FEEDS = [
    { url: 'https://feeds.simplecast.com/0KaqgeVz', name: 'مُلخص كتاب', audioKind: 'summary' },
    { url: 'https://anchor.fm/s/44e9a6e4/podcast/rss', name: 'مُلخص كتاب (الأرشيف)', audioKind: 'summary' },
    { url: 'https://anchor.fm/s/5f9f1744/podcast/rss', name: 'عبدالبارئ الطشاني • كتب مسموعة', audioKind: 'book' },
    { url: 'https://feeds.redcircle.com/bdbe7d99-ae2e-47f1-9701-fa06933f735e', name: 'عمرو البساطي • كتب مسموعة', audioKind: 'book' },
    { url: 'https://anchor.fm/s/555072b0/podcast/rss', name: 'كتب قيّمة مسموعة', audioKind: 'book' },
    { url: 'https://media.podeo.co/rss/MzA5ODg', name: 'هدوتة كتاب', audioKind: 'summary' },
    { url: 'https://mmm-91523080.podomatic.com/rss2.xml', name: 'المكتبة التراثية الصوتية', audioKind: 'book' },
  ];

  const AR_ORDINALS_MAP = {
    'اول': 1, 'اولى': 1, 'واحد': 1,
    'ثاني': 2, 'ثانية': 2, 'ثان': 2, 'اثنين': 2,
    'ثالث': 3, 'ثالثة': 3, 'ثلاثة': 3,
    'رابع': 4, 'رابعة': 4, 'اربعة': 4,
    'خامس': 5, 'خامسة': 5, 'خمسة': 5,
    'سادس': 6, 'سادسة': 6, 'ستة': 6,
    'سابع': 7, 'سابعة': 7, 'سبعة': 7,
    'ثامن': 8, 'ثامنة': 8, 'ثمانية': 8,
    'تاسع': 9, 'تاسعة': 9, 'تسعة': 9,
    'عاشر': 10, 'عاشرة': 10, 'عشرة': 10,
    'حادي عشر': 11, 'حادية عشر': 11, 'حاديه عشره': 11,
    'ثاني عشر': 12, 'ثانية عشر': 12, 'ثانيه عشره': 12,
    'ثالث عشر': 13, 'ثالثة عشر': 13,
    'رابع عشر': 14, 'رابعة عشر': 14,
    'خامس عشر': 15, 'خامسة عشر': 15,
    'سادس عشر': 16, 'سادسة عشر': 16,
    'سابع عشر': 17, 'سابعة عشر': 17,
    'ثامن عشر': 18, 'ثامنة عشر': 18,
    'تاسع عشر': 19, 'تاسعة عشر': 19,
    'عشرين': 20, 'عشرون': 20,
  };

  function normAudioMatchText(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function extractAudioBookPart(rawTitle, collectionName) {
    const raw = stripTags(rawTitle || '').replace(/\s+/g, ' ').trim();
    const isSummary = /ملخص|تلخيص|خلاصه|خلاصة|مراجعه|مراجعة|مختصر|summary|blinkist/i.test(raw + ' ' + (collectionName || ''));
    let partNum = null;

    const numMatch = raw.match(/(?:الجزء|جزء|ج|الحلقة|حلقة|الفصل|فصل|الليلة|ليلة|القسم|قسم|شريط|مجلد|المجلد|part|pt|ep|episode|ch|chapter|night|vol|disc)\s*[:#\-]?\s*(\d{1,3})/i)
      || raw.match(/[\[(]\s*(\d{1,3})\s*(?:\/\s*\d+)?\s*[\])]\s*$/)
      || raw.match(/(?:\s[-–—|]\s*|\s+)(\d{1,3})\s*$/);
    if (numMatch) {
      partNum = parseInt(numMatch[1], 10);
    } else {
      const nRaw = normAudioMatchText(raw);
      const ordMatch = nRaw.match(/(?:الجزء|جزء|الحلقه|حلقه|الفصل|فصل|الليله|ليله|القسم|الشريط)\s+ال([ا-ي]+(?:\s+عشر[ه]?)?)/);
      if (ordMatch) {
        const w = ordMatch[1].replace(/^ال/, '').trim();
        if (AR_ORDINALS_MAP[w] != null) partNum = AR_ORDINALS_MAP[w];
      }
    }

    let base = raw
      .replace(/[\[(]\s*\d+\s*(?:\/\s*\d+)?\s*[\])]\s*$/g, '')
      .replace(/(?:[-–—|•:]\s*|\s+)(?:الجزء|جزء|ج|الحلقة|حلقة|الفصل|فصل|الليلة|ليلة|القسم|قسم|شريط|المجلد|part|pt|ep|episode|ch|chapter|vol|disc)\s*[:#\-]?\s*(?:\d+|ال[\u0621-\u064A]+(?:\s+عشر[ة]?)?).*$/i, '')
      .replace(/\s*[-–—|]\s*\d{1,3}\s*$/, '')
      .replace(/^(?:بودكاست\s+[^:|\-–—]+[:|\-–—]\s*)/i, '')
      .replace(/^(?:الحلقة|حلقة|ح)\s*\d+\s*[:\-–—]?\s*/i, '')
      .replace(/^(?:ملخص\s+كتاب|تلخيص\s+كتاب|مناقشة\s+كتاب|مراجعة\s+كتاب|قراءة\s+في\s+كتاب|كتاب\s+صوتي|كتاب\s+مسموع|رواية\s+صوتية|رواية\s+مسموعة|ملخص|تلخيص)\s*[:\-–—]?\s*/i, '')
      .replace(/\s*\|\s*[^|]{2,40}$/g, '')
      .replace(/\s*\((?:ملخص|تلخيص|كامل|صوتي)\)\s*$/i, '')
      .trim();

    if (base.length < 3) base = raw;
    const baseKey = normAudioMatchText(base).replace(/^(كتاب|روايه|ملخص)\s+/, '').trim() || normAudioMatchText(raw);
    return { baseTitle: base, baseKey, partNum, isSummary };
  }

  function formatDurationLabel(sec) {
    const s = Math.max(0, Math.round(Number(sec) || 0));
    if (!s) return '';
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    const pad = (n) => (n < 10 ? '0' + n : String(n));
    return h > 0 ? (h + ':' + pad(m) + ':' + pad(rem)) : (pad(m) + ':' + pad(rem));
  }

  function parseDurationToSec(raw) {
    if (raw == null) return 0;
    if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, Math.round(raw));
    const s = String(raw).trim();
    if (!s) return 0;
    if (/^\d+(?:\.\d+)?$/.test(s)) return Math.round(parseFloat(s));
    const parts = s.split(':').map(x => parseInt(x, 10));
    if (parts.some(Number.isNaN)) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  }

  async function fetchParsedAudioRssFeed(feedUrl, signal) {
    const hit = audioRssParsedCache.get(feedUrl);
    if (hit && (Date.now() - hit.at) < 1000 * 60 * 30) return hit;
    const r = await withTimeout(KTB.http(feedUrl, { timeoutMs: 4800, priority: 'high', signal }), 5400, null);
    if (!r || r.code !== 200 || !r.body) return null;
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(r.body, 'text/xml');
      const chTitleEl = xml.querySelector('channel > title');
      const chImgEl = xml.querySelector('channel > image > url, channel > itunes\\:image, image');
      const feedCover = chImgEl ? (chImgEl.getAttribute('href') || stripTags(chImgEl.textContent) || '') : '';
      const feedTitle = stripTags(chTitleEl ? chTitleEl.textContent : '');
      const tracks = [];
      Array.from(xml.querySelectorAll('item')).forEach((it, idx) => {
        const enc = it.querySelector('enclosure[url]');
        const audioUrl = unwrapPodcastAudioUrl(enc ? enc.getAttribute('url') : '');
        if (!audioUrl) return;
        const titleEl = it.querySelector('title');
        const durEl = it.querySelector('itunes\\:duration, duration');
        const imgEl = it.querySelector('itunes\\:image');
        const durSec = parseDurationToSec(durEl ? durEl.textContent : '');
        const extM = String(audioUrl).match(/\.(mp3|m4a|m4b|ogg|opus|aac)(?:[?#]|$)/i);
        const trTitle = stripTags(titleEl ? titleEl.textContent : ('الحلقة ' + (idx + 1)));
        tracks.push({
          idx,
          title: trTitle,
          url: audioUrl,
          cover: (imgEl && imgEl.getAttribute('href')) || feedCover,
          durationSec: durSec,
          durationLabel: formatDurationLabel(durSec),
          format: extM ? extM[1].toLowerCase() : 'mp3',
          sizeBytes: Number((enc && enc.getAttribute('length')) || 0),
          parsed: extractAudioBookPart(trTitle, feedTitle),
        });
      });
      const entry = { at: Date.now(), feedCover, feedTitle, tracks };
      if (tracks.length) audioRssParsedCache.set(feedUrl, entry);
      return entry;
    } catch (_) {
      return null;
    }
  }

  function audioTitleMatchesQuery(candidateTitle, query) {
    const qStop = /^(?:كتاب|روايه|ملخص|تلخيص|صوتي|مسموع|في|من|عن|علي|الي|the|a|an|of|book|summary|audiobook)$/;
    const rawToks = normAudioMatchText(query).split(' ').filter(w => w.length >= 2);
    const qToks = rawToks.filter(w => !qStop.test(w));
    const toks = qToks.length ? qToks : rawToks;
    if (!toks.length) return true;
    const nt = normAudioMatchText(candidateTitle);
    const needed = toks.length >= 3 ? Math.ceil(toks.length * 0.65) : toks.length;
    let hits = 0;
    for (const w of toks) {
      const st = w.replace(/^ال(?=[\u0600-\u06FFa-z0-9]{2,})/, '');
      if (nt.includes(w) || (st.length >= 3 && nt.includes(st))) hits++;
    }
    return hits >= needed;
  }

  function compareTracksSequential(a, b) {
    const pa = extractAudioBookPart(a.title, '');
    const pb = extractAudioBookPart(b.title, '');
    if (pa.partNum != null && pb.partNum != null && pa.partNum !== pb.partNum) {
      return pa.partNum - pb.partNum;
    }
    if (pa.partNum != null && pb.partNum == null) return -1;
    if (pa.partNum == null && pb.partNum != null) return 1;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ar', { numeric: true });
  }

  function unwrapPodcastAudioUrl(rawUrl) {
    const s = String(rawUrl || '').trim();
    if (!s) return '';
    try {
      const m = s.match(/anchor\.fm\/.*?\/podcast\/play\/[^/]+\/(https?%3A%2F%2F.+)$/i);
      if (m && m[1]) {
        const decoded = decodeURIComponent(m[1]);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      }
    } catch (_) { }
    return s;
  }

  const ytAudioUrlCache = new Map();
  const ytAudioInflight = new Map();
  let ytSummaryHighlightsCache = null;
  let ytVisitorDataCache = null;
  let ytVisitorDataInflight = null;

  async function getYouTubeVisitorData(signal) {
    if (ytVisitorDataCache && ytVisitorDataCache.val && (Date.now() - ytVisitorDataCache.at) < 1000 * 60 * 30) {
      return ytVisitorDataCache.val;
    }
    if (ytVisitorDataInflight) return ytVisitorDataInflight;
    ytVisitorDataInflight = (async () => {
      try {
        const r2 = await withTimeout(
          KTB.http('https://www.youtube.com/youtubei/v1/visitor_id?prettyPrint=false', {
            method: 'POST',
            payload: JSON.stringify({ context: { client: { clientName: 'WEB_REMIX', clientVersion: '1.20250219.01.00', hl: 'ar', gl: 'EG' } } }),
            headers: { 'Content-Type': 'application/json' },
            timeoutMs: 2200,
            priority: 'high',
            signal,
          }),
          2500,
          null
        );
        if (r2 && r2.code === 200 && r2.body) {
          const j = JSON.parse(r2.body);
          const vd = j && j.responseContext && j.responseContext.visitorData;
          if (vd) {
            ytVisitorDataCache = { val: String(vd), at: Date.now() };
            return String(vd);
          }
        }
      } catch (_) { }
      try {
        const r = await withTimeout(
          KTB.http('https://music.youtube.com/', { timeoutMs: 3200, priority: 'high', signal }),
          3600,
          null
        );
        if (r && r.code === 200 && r.body) {
          const m = r.body.match(/"VISITOR_DATA":"([^"]+)"/) || r.body.match(/"visitorData":"([^"]+)"/);
          if (m && m[1]) {
            ytVisitorDataCache = { val: m[1], at: Date.now() };
            return m[1];
          }
        }
      } catch (_) { }
      return '';
    })().finally(() => { ytVisitorDataInflight = null; });
    return ytVisitorDataInflight;
  }

  function extractYouTubeSearchItems(data) {
    const out = [];
    const seen = new Set();
    function walk(node) {
      if (!node || typeof node !== 'object' || out.length >= 24) return;
      if (node.videoRenderer && node.videoRenderer.videoId) {
        const v = node.videoRenderer;
        const vid = String(v.videoId);
        if (!seen.has(vid)) {
          seen.add(vid);
          const title = stripTags(
            (v.title && Array.isArray(v.title.runs) ? v.title.runs.map(r => r.text).join('') : (v.title && v.title.simpleText)) || ''
          );
          const author = stripTags(
            (v.ownerText && Array.isArray(v.ownerText.runs) ? v.ownerText.runs.map(r => r.text).join('') : (v.ownerText && v.ownerText.simpleText)) || ''
          );
          const durStr = (v.lengthText && (v.lengthText.simpleText || (Array.isArray(v.lengthText.runs) ? v.lengthText.runs.map(r => r.text).join('') : ''))) || '';
          const durSec = parseDurationToSec(durStr);
          if (title && durStr && (!durSec || durSec >= 75)) {
            out.push({
              videoId: vid,
              title,
              author: author || 'YouTube',
              durSec,
              durationLabel: durStr || formatDurationLabel(durSec),
              cover: 'https://i.ytimg.com/vi/' + encodeURIComponent(vid) + '/mqdefault.jpg',
            });
          }
        }
        return;
      }
      if (Array.isArray(node)) {
        for (let i = 0; i < node.length; i++) walk(node[i]);
      } else {
        const vals = Object.values(node);
        for (let i = 0; i < vals.length; i++) walk(vals[i]);
      }
    }
    walk(data);
    return out;
  }

  async function resolveYouTubeAudioStream(videoId, signal) {
    const vid = String(videoId || '').trim();
    if (!vid) return null;
    const hit = ytAudioUrlCache.get(vid);
    if (hit && hit.url && (Date.now() - hit.at) < 1000 * 60 * 15) return hit;
    if (ytAudioInflight.has(vid)) return ytAudioInflight.get(vid);

    const p = (async () => {
    const vis = await getYouTubeVisitorData(signal).catch(() => '');
    const attempts = [
      {
        client: {
          clientName: 'VISIONOS',
          clientVersion: '0.1',
          osName: 'VISION_OS',
          osVersion: '1.3',
          deviceMake: 'Apple',
          deviceModel: 'RealityDevice14,1',
          platform: 'MOBILE',
          visitorData: vis || undefined,
          hl: 'ar',
          gl: 'EG',
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
          'X-YouTube-Client-Name': '101',
          'X-YouTube-Client-Version': '0.1',
        },
      },
      {
        client: {
          clientName: 'VISIONOS',
          clientVersion: '1.02',
          osName: 'visionOS',
          osVersion: '26.5.23O471',
          deviceMake: 'Apple',
          deviceModel: 'RealityDevice17,1',
          visitorData: vis || undefined,
          hl: 'ar',
          gl: 'EG',
        },
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
          'X-YouTube-Client-Name': '101',
          'X-YouTube-Client-Version': '1.02',
        },
      },
      {
        client: { clientName: 'IOS', clientVersion: '20.10.4', deviceMake: 'Apple', deviceModel: 'iPhone16,2', hl: 'ar', gl: 'EG', osName: 'iPhone', osVersion: '18.3.2.22D82' },
        headers: { 'Content-Type': 'application/json' },
      },
      {
        client: { clientName: 'ANDROID_VR', clientVersion: '1.65.10', deviceMake: 'Oculus', deviceModel: 'Quest 3', androidSdkVersion: 32, visitorData: vis || undefined, hl: 'en', gl: 'US', osName: 'Android', osVersion: '12L' },
        headers: { 'Content-Type': 'application/json' },
      },
    ];
    for (const cfg of attempts) {
      try {
        const hdrs = Object.assign({}, cfg.headers);
        if (vis) hdrs['X-Goog-Visitor-Id'] = vis;
        const body = JSON.stringify({
          videoId: vid,
          contentCheckOk: true,
          racyCheckOk: true,
          context: { client: cfg.client },
        });
        const r = await withTimeout(
          KTB.http('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
            method: 'POST',
            payload: body,
            headers: hdrs,
            timeoutMs: 4800,
            priority: 'high',
            signal,
          }),
          5200,
          null
        );
        if (!r || r.code !== 200 || !r.body) continue;
        const pj = JSON.parse(r.body);
        if (!pj || !pj.streamingData) continue;
        const adaptive = Array.isArray(pj.streamingData.adaptiveFormats) ? pj.streamingData.adaptiveFormats : [];
        const audioOnly = adaptive.filter(f => f && f.url && String(f.mimeType || '').toLowerCase().startsWith('audio/'));
        const isDefTrack = (f) => (f && f.audioTrack && f.audioTrack.audioIsDefault === false) ? 0 : 1;
        const sortAudio = (a, b) => (isDefTrack(b) - isDefTrack(a)) || ((b.itag === 140 ? 1 : 0) - (a.itag === 140 ? 1 : 0)) || (Number(b.bitrate || 0) - Number(a.bitrate || 0));
        const mp4List = audioOnly.filter(f => String(f.mimeType || '').toLowerCase().includes('audio/mp4')).sort(sortAudio);
        const pick = mp4List[0]
          || audioOnly.slice().sort(sortAudio)[0]
          || (Array.isArray(pj.streamingData.formats) ? pj.streamingData.formats.find(f => f && f.url) : null);
        const pickedUrl = (pick && pick.url) ? String(pick.url) : String(pj.streamingData.hlsManifestUrl || '');
        if (pickedUrl) {
          const mime = String((pick && pick.mimeType) || '').toLowerCase();
          const fmt = !pick ? 'm3u8' : (mime.includes('webm') || mime.includes('opus') ? 'webm' : 'm4a');
          const durSec = Math.round(Number((pick && pick.approxDurationMs) || 0) / 1000) || Number(pj.videoDetails && pj.videoDetails.lengthSeconds || 0) || 0;
          const res = {
            at: Date.now(),
            url: pickedUrl,
            format: fmt,
            durationSec: durSec,
            sizeBytes: Number((pick && pick.contentLength) || 0) || 0,
          };
          ytAudioUrlCache.set(vid, res);
          return res;
        }
      } catch (_) { }
    }
    return null;
    })().finally(() => { ytAudioInflight.delete(vid); });
    ytAudioInflight.set(vid, p);
    return p;
  }

  function prewarmAudiobooksEngine() {
    getYouTubeVisitorData().catch(() => {});
  }

  async function prefetchYouTubeAudioStreams(books, maxCount) {
    const cap = Math.max(1, Math.min(10, Number(maxCount) || 6));
    const vids = [];
    const seen = new Set();
    for (const b of (Array.isArray(books) ? books : [])) {
      if (!b) continue;
      const vid = b.ytVideoId || (Array.isArray(b.preloadedTracks) && b.preloadedTracks[0] && b.preloadedTracks[0].ytVideoId) || '';
      if (vid && !seen.has(vid)) {
        seen.add(vid);
        vids.push(vid);
        if (vids.length >= cap) break;
      }
    }
    if (!vids.length) return;
    await getYouTubeVisitorData().catch(() => '');
    for (let i = 0; i < vids.length; i += 3) {
      await Promise.allSettled(vids.slice(i, i + 3).map(v => resolveYouTubeAudioStream(v)));
    }
  }

  async function searchYouTubeAudio(query, opts) {
    const o = opts || {};
    const qStr = String(query || '').trim();
    const hasRaw = Array.isArray(o.rawQueries) && o.rawQueries.length > 0;
    if (qStr.length < 2 && !hasRaw) return [];
    const isAr = isArabicText(qStr || (hasRaw ? o.rawQueries[0] : ''));
    const queries = hasRaw ? o.rawQueries : (isAr
      ? [qStr + ' كتاب مسموع بودكاست', qStr + ' ملخص كتاب']
      : [qStr + ' audiobook podcast', qStr + ' book summary']);
    const collected = [];
    const seen = new Set();

    await Promise.allSettled(queries.map(async (qItem) => {
      const payload = JSON.stringify({
        context: { client: { clientName: 'WEB', clientVersion: '2.20241113.00.00', hl: isAr ? 'ar' : 'en', gl: isAr ? 'EG' : 'US' } },
        query: qItem,
      });
      const r = await withTimeout(
        KTB.http('https://www.youtube.com/youtubei/v1/search?prettyPrint=false', {
          method: 'POST',
          payload,
          headers: { 'Content-Type': 'application/json' },
          timeoutMs: 4600,
          priority: 'high',
          signal: o.signal,
        }),
        5200,
        null
      );
      if (!r || r.code !== 200 || !r.body) return;
      try {
        const items = extractYouTubeSearchItems(JSON.parse(r.body));
        for (const it of items) {
          if (!seen.has(it.videoId)) {
            seen.add(it.videoId);
            collected.push(it);
          }
        }
      } catch (_) { }
    }));
    return collected;
  }

  async function searchAudiobooks(q, opts) {
    const query = String(q || '').trim();
    if (query.length < 2) return [];
    const o = opts || {};
    const freeOnly = !!o.freeOnly;
    const isAr = isArabicText(query);
    const standaloneBooks = [];
    const groupedBuckets = new Map();
    const seenIds = new Set();
    const scannedRssUrls = new Set(AR_AUDIO_RSS_FEEDS.map(f => f.url));

    function addToGroupOrList(entry) {
      if (!entry || !entry.title || !entry.id) return;
      if (entry.audioType === 'archive' || entry.audioType === 'librivox') {
        if (seenIds.has(entry.id)) return;
        seenIds.add(entry.id);
        if (!entry.licenseType) entry.licenseType = 'free_open';
        standaloneBooks.push(entry);
        return;
      }
      // Single tracks / multi-part episodes get grouped by (audioKind + baseKey) cleanly
      const parsed = extractAudioBookPart(entry.rawEpisodeTitle || entry.title, entry.source || '');
      const kind = entry.audioKind || (parsed.isSummary ? 'summary' : 'book');
      const ytSingle = entry.audioType === 'youtube' && parsed.partNum == null;
      const gKey = ytSingle
        ? ('yt|' + (entry.ytVideoId || entry.id))
        : (entry.audioType === 'youtube'
          ? (kind + '|yt|' + normAudioMatchText(entry.author || '') + '|' + parsed.baseKey)
          : (kind + '|' + parsed.baseKey));
      let grp = groupedBuckets.get(gKey);
      if (!grp) {
        grp = {
          id: ytSingle ? ('ab_yt_' + (entry.ytVideoId || entry.id)) : ('ab_grp_' + kind + '_' + parsed.baseKey.replace(/\s+/g, '_').slice(0, 32)),
          title: (kind === 'summary' && !/^ملخص/.test(parsed.baseTitle) ? 'ملخص: ' : '') + parsed.baseTitle,
          baseTitle: parsed.baseTitle,
          author: entry.author || entry.source || 'مكتبة الصوت',
          lang: entry.lang || (isArabicText(parsed.baseTitle) ? 'ar' : 'en'),
          cat: 'audiobooks',
          audioKind: kind,
          licenseType: 'free_open',
          source: entry.source || 'البث الصوتي المباشر',
          audioType: entry.audioType === 'youtube' ? 'youtube' : 'tracks',
          cover: entry.cover || '',
          summary: entry.summary || (kind === 'summary' ? 'ملخص كتاب مسموع جاهز للبث أو التحميل بدون إنترنت.' : 'كتاب مسموع متسلسل الأجزاء جاهز للاستماع أو التحميل.'),
          preloadedTracks: [],
          _seenTrackUrls: new Set(),
        };
        groupedBuckets.set(gKey, grp);
      }
      if (!grp.cover && entry.cover) grp.cover = entry.cover;
      for (const tr of (entry.preloadedTracks || [])) {
        const tKey = tr && (tr.url || (tr.ytVideoId ? ('yt:' + tr.ytVideoId) : ''));
        if (!tKey || grp._seenTrackUrls.has(tKey)) continue;
        grp._seenTrackUrls.add(tKey);
        grp.preloadedTracks.push(tr);
      }
    }

    const tasks = [];

    // 1. Apple Podcasts & Open Podcast RSS Shows (book readings & summaries shared across Spotify/Apple/RSS)
    const epQueries = isAr ? [query, 'ملخص كتاب ' + query] : [query + ' audiobook'];
    epQueries.forEach((eq) => {
      tasks.push(withTimeout(
        KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(eq)
          + '&media=podcast&entity=podcastEpisode&limit=14', { timeoutMs: 4200, signal: o.signal, priority: 'high' }),
        4600,
        null
      ).then((r) => {
        if (!r || r.code !== 200 || !r.body) return;
        try {
          for (const it of (JSON.parse(r.body).results || [])) {
            if (!it || !it.episodeUrl || !it.trackName) continue;
            const trTitle = stripTags(it.trackName);
            const colName = stripTags(it.collectionName || '');
            if (!audioTitleMatchesQuery(trTitle + ' ' + stripTags(it.description || '').slice(0, 120), query)) continue;
            const parsed = extractAudioBookPart(trTitle, colName);
            const durSec = Math.round(Number(it.trackTimeMillis || 0) / 1000);
            const extM = String(it.episodeUrl).match(/\.(mp3|m4a|m4b|ogg|opus|aac)(?:[?#]|$)/i);
            addToGroupOrList({
              id: 'ab_ep_' + String(it.trackId || Math.random()),
              title: parsed.baseTitle,
              rawEpisodeTitle: trTitle,
              author: colName || stripTags(it.artistName || 'مكتبة الصوت'),
              lang: isArabicText(trTitle + ' ' + colName) ? 'ar' : 'en',
              audioKind: parsed.isSummary ? 'summary' : 'book',
              source: colName || 'بودكاست الكتب',
              cover: it.artworkUrl600 || it.artworkUrl160 || '',
              summary: stripTags(it.description || '').slice(0, 220),
              preloadedTracks: [{
                idx: 0,
                title: trTitle,
                url: unwrapPodcastAudioUrl(it.episodeUrl),
                durationSec: durSec,
                durationLabel: formatDurationLabel(durSec),
                format: (extM ? extM[1].toLowerCase() : String(it.episodeFileExtension || 'mp3')).toLowerCase(),
                sizeBytes: 0,
              }],
            });
          }
        } catch (_) { }
      }));
    });

    // 1b. Open Podcast Shows RSS Feeds matching book/show query (same open feeds powering Spotify & podcast apps)
    tasks.push(withTimeout(
      KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(query)
        + '&media=podcast&entity=podcast&limit=4', { timeoutMs: 3800, signal: o.signal }),
      4200,
      null
    ).then(async (r) => {
      if (!r || r.code !== 200 || !r.body) return;
      try {
        const shows = (JSON.parse(r.body).results || []).filter(s => s && s.feedUrl && !scannedRssUrls.has(s.feedUrl)).slice(0, 2);
        await Promise.allSettled(shows.map(async (sh) => {
          scannedRssUrls.add(sh.feedUrl);
          const parsedFeed = await fetchParsedAudioRssFeed(sh.feedUrl, o.signal);
          if (!parsedFeed || !Array.isArray(parsedFeed.tracks)) return;
          const showName = stripTags(sh.collectionName || parsedFeed.feedTitle || 'بودكاست');
          let feedHits = 0;
          for (const tr of parsedFeed.tracks) {
            if (!audioTitleMatchesQuery(parsedFeed.tracks.length > 15 ? tr.title : (tr.title + ' ' + showName), query)) continue;
            const kind = (tr.parsed && tr.parsed.isSummary) || /ملخص|تلخيص|خلاصة|summary/i.test(showName) ? 'summary' : 'book';
            addToGroupOrList({
              id: 'ab_pod_' + showName,
              title: (tr.parsed && tr.parsed.baseTitle) || tr.title,
              rawEpisodeTitle: tr.title,
              author: showName,
              lang: isArabicText(tr.title + ' ' + showName) ? 'ar' : 'en',
              audioKind: kind,
              source: showName + ' (بودكاست)',
              cover: tr.cover || sh.artworkUrl600 || parsedFeed.feedCover || '',
              preloadedTracks: [{
                idx: 0,
                title: tr.title,
                url: tr.url,
                durationSec: tr.durationSec || 0,
                durationLabel: tr.durationLabel || '',
                format: tr.format || 'mp3',
                sizeBytes: tr.sizeBytes || 0,
              }],
            });
            if (++feedHits >= 12) break;
          }
        }));
      } catch (_) { }
    }));

    // 1c. YouTube InnerTube Audiobooks, Podcasts & Book Summaries (MetroList-style direct m4a resolution)
    tasks.push(searchYouTubeAudio(query, { signal: o.signal }).then((ytItems) => {
      for (const yt of ytItems) {
        if (!audioTitleMatchesQuery(yt.title, query)) continue;
        const parsed = extractAudioBookPart(yt.title, yt.author);
        const kind = parsed.isSummary ? 'summary' : 'book';
        addToGroupOrList({
          id: 'ab_yt_' + yt.videoId,
          ytVideoId: yt.videoId,
          title: parsed.baseTitle,
          rawEpisodeTitle: yt.title,
          author: yt.author,
          lang: isArabicText(yt.title + ' ' + yt.author) ? 'ar' : 'en',
          audioKind: kind,
          source: 'YouTube الصوتية • ' + yt.author,
          audioType: 'youtube',
          cover: yt.cover,
          summary: 'بث صوتي مباشر وملخصات عبر YouTube Audio.',
          preloadedTracks: [{
            idx: 0,
            title: yt.title,
            ytVideoId: yt.videoId,
            url: '',
            durationSec: yt.durSec || 0,
            durationLabel: yt.durationLabel || '',
            format: 'm4a',
            sizeBytes: 0,
          }],
        });
      }
    }).catch(() => {}));

    // 2. Direct Scan Inside Curated Arabic Audiobook & Summary RSS Channels (extracts ONLY matching book/parts)
    if (isAr || o.lang !== 'en') {
      AR_AUDIO_RSS_FEEDS.forEach((fInfo) => {
        tasks.push(fetchParsedAudioRssFeed(fInfo.url, o.signal).then((parsedFeed) => {
          if (!parsedFeed || !Array.isArray(parsedFeed.tracks)) return;
          let rssHits = 0;
          for (const tr of parsedFeed.tracks) {
            if (!audioTitleMatchesQuery(tr.title, query)) continue;
            const kind = fInfo.audioKind === 'summary' || (tr.parsed && tr.parsed.isSummary) ? 'summary' : 'book';
            addToGroupOrList({
              id: 'ab_feed_' + fInfo.name,
              title: (tr.parsed && tr.parsed.baseTitle) || tr.title,
              rawEpisodeTitle: tr.title,
              author: fInfo.name,
              lang: 'ar',
              audioKind: kind,
              source: fInfo.name,
              cover: tr.cover || parsedFeed.feedCover || '',
              preloadedTracks: [{
                idx: 0,
                title: tr.title,
                url: tr.url,
                durationSec: tr.durationSec || 0,
                durationLabel: tr.durationLabel || '',
                format: tr.format || 'mp3',
                sizeBytes: tr.sizeBytes || 0,
              }],
            });
            if (++rssHits >= 12) break;
          }
        }).catch(() => {}));
      });
    }

    // 3. Internet Archive Audio Collections (Full Arabic Audiobooks & Global LibriVox)
    const iaToks = normAudioMatchText(query).split(/\s+/).filter(w => w.length >= 2).slice(0, 4);
    const iaExpr = isAr
      ? 'mediatype:(audio) AND (' + iaToks.map(w => '"' + w + '"').join(' AND ') + ') AND -subject:(quran OR tafsir)'
      : 'mediatype:(audio) AND (collection:(librivoxaudio OR audio_bookspoetry OR opensource_audio) OR subject:(audiobooks OR audiobook)) AND title:("' + query.replace(/"/g, '') + '")';
    tasks.push(withTimeout(
      KTB.http('https://archive.org/advancedsearch.php?q=' + encodeURIComponent(iaExpr)
        + '&fl[]=identifier,title,creator,downloads,description&sort[]=downloads+desc&rows=10&output=json', { timeoutMs: 4200, signal: o.signal }),
      4600,
      null
    ).then((r) => {
      if (!r || r.code !== 200 || !r.body) return;
      try {
        for (const d of ((JSON.parse(r.body).response || {}).docs || [])) {
          if (!d || !d.identifier || !d.title) continue;
          const title = stripTags(Array.isArray(d.title) ? d.title[0] : d.title);
          if (!title || /تكبيرات|مصحف|تلاوة|قرآن|أذان|quran/i.test(title)) continue;
          const creator = stripTags(Array.isArray(d.creator) ? d.creator[0] : (d.creator || ''));
          const parsed = extractAudioBookPart(title, '');
          addToGroupOrList({
            id: 'ab_ia_' + String(d.identifier),
            title,
            author: creator || 'الأرشيف الصوتي',
            lang: isArabicText(title) ? 'ar' : 'en',
            cat: 'audiobooks',
            audioKind: parsed.isSummary ? 'summary' : 'book',
            licenseType: 'free_open',
            source: 'الأرشيف المسموع',
            audioType: 'archive',
            iaId: String(d.identifier),
            cover: 'https://archive.org/services/img/' + encodeURIComponent(String(d.identifier)),
            tracksHint: 'كتاب مسموع كامل',
            summary: stripTags(Array.isArray(d.description) ? d.description[0] : (d.description || '')).slice(0, 240),
          });
        }
      } catch (_) { }
    }));

    // 4. LibriVox Open Audiobook JSON API (Full multi-chapter books)
    const lvQuery = !isAr ? query : (o.altTitle ? cleanSearchTitle(o.altTitle, '') : '');
    if (lvQuery && lvQuery.length >= 2) {
      tasks.push(withTimeout(
        KTB.http('https://librivox.org/api/feed/audiobooks/?format=json&extended=1&limit=8&title=' + encodeURIComponent(lvQuery), { timeoutMs: 4200, signal: o.signal }),
        4600,
        null
      ).then((r) => {
        if (!r || r.code !== 200 || !r.body) return;
        try {
          for (const bk of (JSON.parse(r.body).books || [])) {
            if (!bk || !bk.id || !bk.title) continue;
            const authors = Array.isArray(bk.authors) ? bk.authors.map(a => ((a.first_name || '') + ' ' + (a.last_name || '')).trim()).filter(Boolean).join(', ') : '';
            const iaM = String(bk.url_iarchive || '').match(/archive\.org\/details\/([^/?#]+)/i);
            addToGroupOrList({
              id: 'ab_lv_' + String(bk.id),
              title: stripTags(bk.title),
              author: authors || 'LibriVox',
              lang: String(bk.language || '').toLowerCase().includes('arab') ? 'ar' : 'en',
              cat: 'audiobooks',
              audioKind: 'book',
              licenseType: 'free_open',
              source: 'LibriVox العالمية',
              audioType: iaM ? 'archive' : (bk.url_rss ? 'rss' : 'librivox'),
              iaId: iaM ? iaM[1] : '',
              feedUrl: bk.url_rss || '',
              librivoxId: String(bk.id),
              cover: iaM ? ('https://archive.org/services/img/' + encodeURIComponent(iaM[1])) : '',
              tracksHint: Array.isArray(bk.sections) && bk.sections.length ? (bk.sections.length + ' فصول مرتبة') : (bk.totaltime || ''),
              summary: stripTags(bk.description || '').slice(0, 240),
              preloadedTracks: Array.isArray(bk.sections) && bk.sections.length
                ? bk.sections.map((sec, idx) => ({
                    idx,
                    title: stripTags(sec.title || ('Chapter ' + (idx + 1))),
                    url: String(sec.listen_url || ''),
                    durationSec: parseDurationToSec(sec.playtime),
                    durationLabel: sec.playtime || formatDurationLabel(parseDurationToSec(sec.playtime)),
                    format: 'mp3',
                  })).filter(t => t.url)
                : null,
            });
          }
        } catch (_) { }
      }));
    }

    // 5. Official Apple Books Audiobooks Discovery API (Licensed Store — returns preview + official store link cleanly separated)
    if (!freeOnly) {
      tasks.push(withTimeout(
        KTB.http('https://itunes.apple.com/search?term=' + encodeURIComponent(query)
          + '&media=audiobook&limit=6', { timeoutMs: 3800, signal: o.signal }),
        4200,
        null
      ).then((r) => {
        if (!r || r.code !== 200 || !r.body) return;
        try {
          for (const it of (JSON.parse(r.body).results || [])) {
            if (!it || !it.collectionName) continue;
            const title = stripTags(it.collectionName);
            const author = stripTags(it.artistName || 'Apple Books');
            const id = 'ab_store_' + String(it.collectionId || normalizeText(title).slice(0, 16));
            if (seenIds.has(id)) continue;
            seenIds.add(id);
            standaloneBooks.push({
              id,
              title,
              author,
              lang: isArabicText(title + ' ' + author) ? 'ar' : 'en',
              cat: 'audiobooks',
              audioKind: 'licensed',
              licenseType: 'licensed_store',
              isDownloadable: false,
              source: 'Apple Books (مصدر رسمي)',
              audioType: 'store_preview',
              previewUrl: it.previewUrl || '',
              externalUrl: it.collectionViewUrl || 'https://books.apple.com/',
              cover: String(it.artworkUrl100 || '').replace('100x100', '600x600'),
              tracksHint: it.previewUrl ? 'معاينة رسمية + رابط المتجر' : 'رابط المنصة الرسمية',
              summary: stripTags(it.description || 'كتاب صوتي رسمي يتطلب شراءً أو اشتراكاً على المنصة الأصلية.').slice(0, 220),
              preloadedTracks: it.previewUrl ? [{
                idx: 0,
                title: 'عينة صوتية رسمية — ' + title,
                url: String(it.previewUrl),
                durationSec: 90,
                durationLabel: '01:30',
                format: 'm4a',
                isPreview: true,
              }] : [],
            });
          }
        } catch (_) { }
      }));
    }

    await Promise.allSettled(tasks);

    // Finalize grouped tracks sorted strictly sequentially (1 -> 2 -> 3...)
    const groupedResults = [];
    for (const grp of groupedBuckets.values()) {
      delete grp._seenTrackUrls;
      grp.preloadedTracks.sort(compareTracksSequential);
      grp.preloadedTracks.forEach((tr, i) => { tr.idx = i; });
      const n = grp.preloadedTracks.length;
      if (n > 1) {
        grp.tracksHint = n + ' أجزاء مرتبة';
      } else if (grp.audioKind === 'summary') {
        const dur = grp.preloadedTracks[0] && grp.preloadedTracks[0].durationLabel;
        grp.tracksHint = dur ? ('ملخص كتاب • ' + dur) : 'ملخص كتاب';
      } else {
        const dur = grp.preloadedTracks[0] && grp.preloadedTracks[0].durationLabel;
        grp.tracksHint = dur ? ('حلقة كاملة • ' + dur) : 'كتاب مسموع';
      }
      groupedResults.push(grp);
    }

    const combined = [...standaloneBooks, ...groupedResults];
    const nq = normAudioMatchText(query);
    combined.sort((a, b) => {
      const aFree = a.licenseType === 'licensed_store' ? 0 : 10;
      const bFree = b.licenseType === 'licensed_store' ? 0 : 10;
      const aFull = a.audioKind === 'book' ? 2 : 0;
      const bFull = b.audioKind === 'book' ? 2 : 0;
      const aMulti = (a.audioType === 'archive' || (a.preloadedTracks && a.preloadedTracks.length > 1)) ? 3 : 0;
      const bMulti = (b.audioType === 'archive' || (b.preloadedTracks && b.preloadedTracks.length > 1)) ? 3 : 0;
      const aExact = normAudioMatchText(a.baseTitle || a.title).includes(nq) ? 4 : 0;
      const bExact = normAudioMatchText(b.baseTitle || b.title).includes(nq) ? 4 : 0;
      return (bFree + bExact + bMulti + bFull) - (aFree + aExact + aMulti + aFull);
    });
    return combined.slice(0, 60);
  }

  let latestLibriVoxCache = null;
  async function fetchLibriVoxLatest(opts) {
    if (latestLibriVoxCache && (Date.now() - latestLibriVoxCache.at) < 1000 * 60 * 30) {
      return latestLibriVoxCache.items;
    }
    const o = opts || {};
    const r = await withTimeout(
      KTB.http('https://librivox.org/api/feed/audiobooks/?format=json&extended=1&limit=8', { timeoutMs: 4200, signal: o.signal }),
      4600,
      null
    );
    if (!r || r.code !== 200 || !r.body) return [];
    const items = [];
    try {
      for (const bk of (JSON.parse(r.body).books || [])) {
        if (!bk || !bk.id || !bk.title) continue;
        const authors = Array.isArray(bk.authors) ? bk.authors.map(a => ((a.first_name || '') + ' ' + (a.last_name || '')).trim()).filter(Boolean).join(', ') : '';
        const iaM = String(bk.url_iarchive || '').match(/archive\.org\/details\/([^/?#]+)/i);
        items.push({
          id: 'ab_lv_' + String(bk.id),
          title: stripTags(bk.title),
          author: authors || 'LibriVox',
          lang: String(bk.language || '').toLowerCase().includes('arab') ? 'ar' : 'en',
          cat: 'mystery_classics',
          audioKind: 'book',
          licenseType: 'free_open',
          isLatest: true,
          source: 'LibriVox (أحدث الإصدارات)',
          audioType: iaM ? 'archive' : (bk.url_rss ? 'rss' : 'librivox'),
          iaId: iaM ? iaM[1] : '',
          feedUrl: bk.url_rss || '',
          librivoxId: String(bk.id),
          cover: iaM ? ('https://archive.org/services/img/' + encodeURIComponent(iaM[1])) : '',
          tracksHint: Array.isArray(bk.sections) && bk.sections.length ? (bk.sections.length + ' فصول مرتبة') : (bk.totaltime || 'كتاب مجاني'),
          summary: stripTags(bk.description || '').slice(0, 220),
        });
      }
      if (items.length) latestLibriVoxCache = { at: Date.now(), items };
    } catch (_) { }
    return items;
  }

  async function fetchYouTubeSummaryHighlights(opts) {
    if (ytSummaryHighlightsCache && (Date.now() - ytSummaryHighlightsCache.at) < 1000 * 60 * 30) {
      return ytSummaryHighlightsCache.items;
    }
    const o = opts || {};
    const raw = await searchYouTubeAudio('', {
      rawQueries: ['ملخص كتاب صوتي بودكاست', 'أفضل ملخصات الكتب الصوتية'],
      signal: o.signal,
    }).catch(() => []);
    const items = [];
    for (const yt of raw.slice(0, 10)) {
      const parsed = extractAudioBookPart(yt.title, yt.author);
      items.push({
        id: 'ab_yt_' + yt.videoId,
        ytVideoId: yt.videoId,
        title: parsed.baseTitle,
        author: yt.author,
        lang: isArabicText(yt.title + ' ' + yt.author) ? 'ar' : 'en',
        cat: 'psychology_habits',
        audioKind: parsed.isSummary ? 'summary' : 'book',
        licenseType: 'free_open',
        isHighlight: true,
        source: 'YouTube الصوتية • ' + yt.author,
        audioType: 'youtube',
        cover: yt.cover,
        tracksHint: (parsed.isSummary ? 'ملخص كتاب' : 'بودكاست كتاب') + (yt.durationLabel ? (' • ' + yt.durationLabel) : ''),
        summary: 'بث صوتي مباشر عبر YouTube Audio.',
        preloadedTracks: [{
          idx: 0,
          title: yt.title,
          ytVideoId: yt.videoId,
          url: '',
          durationSec: yt.durSec || 0,
          durationLabel: yt.durationLabel || '',
          format: 'm4a',
          sizeBytes: 0,
        }],
      });
    }
    if (items.length) ytSummaryHighlightsCache = { at: Date.now(), items };
    return items;
  }

  async function resolveSingleAudioTrackUrl(tr, signal) {
    if (!tr) return '';
    if (tr.ytVideoId) {
      const info = await resolveYouTubeAudioStream(tr.ytVideoId, signal);
      if (info && info.url) {
        tr.url = info.url;
        tr.format = info.format || tr.format || 'm4a';
        if (!tr.durationSec && info.durationSec) {
          tr.durationSec = info.durationSec;
          tr.durationLabel = formatDurationLabel(info.durationSec);
        }
        if (info.sizeBytes && !tr.sizeBytes) tr.sizeBytes = info.sizeBytes;
        return info.url;
      }
    }
    return tr.url || '';
  }

  async function resolveAudiobookTracks(ab) {
    if (!ab) return [];
    if (Array.isArray(ab.preloadedTracks) && ab.preloadedTracks.length) {
      const ytTracks = ab.preloadedTracks.filter(t => t && t.ytVideoId);
      if (ytTracks.length) {
        for (let i = 0; i < ytTracks.length; i += 4) {
          await Promise.allSettled(ytTracks.slice(i, i + 4).map(t => resolveSingleAudioTrackUrl(t)));
        }
        return ab.preloadedTracks.filter(t => t && t.url);
      }
      return ab.preloadedTracks;
    }
    const ck = String(ab.id || ab.iaId || ab.feedUrl || ab.ytVideoId || ab.title || '');
    const hit = audioTracksCache.get(ck);
    const maxAge = ab.ytVideoId ? (1000 * 60 * 15) : (1000 * 60 * 30);
    if (hit && (Date.now() - hit.at) < maxAge) return hit.tracks;

    let tracks = [];
    if (ab.ytVideoId) {
      const info = await resolveYouTubeAudioStream(ab.ytVideoId);
      if (info && info.url) {
        tracks = [{
          idx: 0,
          title: ab.title || 'استماع مباشر',
          ytVideoId: ab.ytVideoId,
          url: info.url,
          durationSec: info.durationSec || 0,
          durationLabel: formatDurationLabel(info.durationSec || 0),
          format: info.format || 'm4a',
          sizeBytes: info.sizeBytes || 0,
        }];
      }
    }
    if (!tracks.length && ab.audioType === 'rss' && ab.feedUrl) {
      const parsedFeed = await fetchParsedAudioRssFeed(ab.feedUrl);
      if (parsedFeed) {
        if (parsedFeed.feedCover && !ab.cover) ab.cover = parsedFeed.feedCover;
        tracks = parsedFeed.tracks.slice();
        // Keep numbered series sorted in ascending sequential order (1 -> 2 -> ... -> N)
        const numbered = tracks.filter(t => t.parsed && t.parsed.partNum != null);
        if (numbered.length >= Math.max(2, Math.floor(tracks.length * 0.4))) {
          tracks.sort(compareTracksSequential);
          tracks.forEach((tr, i) => { tr.idx = i; });
        }
      }
    }
    if (!tracks.length && ab.iaId) {
      const r = await withTimeout(KTB.http('https://archive.org/metadata/' + encodeURIComponent(ab.iaId) + '/files', { timeoutMs: 5000, priority: 'high' }), 5500, null);
      if (r && r.code === 200 && r.body) {
        try {
          const rawFiles = JSON.parse(r.body).result || [];
          const mp3s = rawFiles.filter(f => f && /\.(mp3|m4b|m4a)$/i.test(f.name || '') && !/_64kb\.mp3$/i.test(f.name || ''));
          const chosen = mp3s.length ? mp3s : rawFiles.filter(f => f && /\.(mp3|m4b|m4a|ogg)$/i.test(f.name || ''));
          const singleMp3 = chosen.filter(f => /\.mp3$/i.test(f.name || '') && !/_vbr\.mp3$/i.test(f.name || ''));
          const finalFiles = (singleMp3.length >= 2 ? singleMp3 : chosen)
            .sort((a, b) => String(a.track || a.name || '').localeCompare(String(b.track || b.name || ''), 'en', { numeric: true }));
          tracks = finalFiles.map((f, idx) => {
            const dSec = parseDurationToSec(f.length);
            const cleanName = stripTags(f.title || String(f.name || '').replace(/\.[^.]+$/, '').replace(/[_]+/g, ' '));
            const extM = String(f.name || '').match(/\.(mp3|m4b|m4a|ogg)$/i);
            return {
              idx,
              title: cleanName || ('الفصل ' + (idx + 1)),
              url: 'https://archive.org/download/' + encodeURIComponent(ab.iaId) + '/' + encodeURIComponent(f.name),
              durationSec: dSec,
              durationLabel: formatDurationLabel(dSec),
              format: extM ? extM[1].toLowerCase() : 'mp3',
              sizeBytes: Number(f.size || 0),
            };
          });
        } catch (_) { }
      }
    }
    if (!tracks.length && ab.librivoxId) {
      const r = await withTimeout(KTB.http('https://librivox.org/api/feed/audiobooks/id/' + encodeURIComponent(ab.librivoxId) + '?format=json&extended=1', { timeoutMs: 5000 }), 5500, null);
      if (r && r.code === 200 && r.body) {
        try {
          const bk = (JSON.parse(r.body).books || [])[0];
          if (bk && Array.isArray(bk.sections)) {
            tracks = bk.sections.map((sec, idx) => {
              const dSec = parseDurationToSec(sec.playtime);
              return {
                idx,
                title: stripTags(sec.title || ('Chapter ' + (idx + 1))),
                url: String(sec.listen_url || ''),
                durationSec: dSec,
                durationLabel: formatDurationLabel(dSec),
                format: 'mp3',
                sizeBytes: 0,
              };
            }).filter(t => t.url);
          }
        } catch (_) { }
      }
    }
    if (!tracks.length && ab.feedUrl && ab.audioType !== 'rss') {
      const parsedFeed = await fetchParsedAudioRssFeed(ab.feedUrl);
      if (parsedFeed && parsedFeed.tracks.length) {
        tracks = parsedFeed.tracks.slice();
      }
    }

    if (tracks.length) {
      audioTracksCache.set(ck, { at: Date.now(), tracks });
    }
    return tracks;
  }

  async function findFreeOpenAudiobookAlternatives(title, author, opts) {
    const o = opts || {};
    const raw = stripTags(title || '').replace(/\((?:unabridged|abridged|audiobook)\)|\[(?:unabridged|abridged|audiobook)\]/gi, ' ').replace(/\s+/g, ' ').trim();
    const parts = raw.split(/[—–|]/).map(s => s.trim()).filter(Boolean);
    const engPart = parts.find(p => !isArabicText(p) && /[a-z]{3,}/i.test(p)) || '';
    const qClean = cleanSearchTitle(parts[0] || raw, author) || cleanSearchTitle(raw, author) || raw;
    if (!qClean || qClean.length < 2) return [];

    const hits = await searchAudiobooks(qClean, {
      freeOnly: true,
      lang: o.lang,
      altTitle: engPart,
      signal: o.signal,
    }).catch(() => []);

    return (Array.isArray(hits) ? hits : [])
      .filter(it => it && it.licenseType !== 'licensed_store' && (
        audioTitleMatchesQuery(it.baseTitle || it.title, qClean) ||
        (engPart && audioTitleMatchesQuery(it.baseTitle || it.title, engPart))
      ))
      .slice(0, 5);
  }

  return {
    MIRRORS,
    WEB_ENGINES,
    refreshMirrors,
    normBook,
    cleanDisplayBookTitle,
    isGenuineBookItem,
    cleanAuthorName,
    cleanSearchTitle,
    extractArabicSearchQuery,
    withTimeout,
    titleMatchesCandidate,
    isStrictSameBook,
    scoreSearchRelevance,
    sanitizeTelegramHandle,
    searchFoulabook,
    browseFoulabook,
    searchAlarabimag,
    search8gharb,
    searchScribd,
    searchHindawiHttp,
    searchWikisource,
    searchArchive,
    resolveArchive,
    searchWaqfeya,
    searchLibgen,
    searchLibgenComics,
    isComicQuery,
    isGenericComicQuery,
    resolveComicSearchTerms,
    searchYskComics,
    resolveYskComic,
    searchGetComics,
    resolveGetComics,
    searchComicsGate,
    resolveComicsGate,
    searchArabComics,
    resolveArabComics,
    searchComicverse,
    resolveComicverse,
    searchAzComics,
    resolveAzComics,
    searchWebtoon,
    resolveWebtoon,
    extractWebtoonEpisodeImages,
    searchGlobalComix,
    resolveGlobalComix,
    searchTapas,
    resolveTapas,
    extractTapasEpisodeImages,
    searchArchiveComicsAr,
    searchArchiveComicsEn,
    searchComicsTelegram,
    searchAllComics,
    searchOpenLibrary,
    subjectOpenLibrary,
    searchGutenberg,
    searchGutendex,
    searchStandardEbooks,
    searchDoab,
    searchOapen,
    searchArxiv,
    getAppleCharts,
    getSearchableTelegramChannels,
    searchTelegramChannels,
    searchTelegramMtproto,
    getMtprotoConfig,
    setMtprotoConfig,
    testMtprotoRelay,
    fetchViaTelegramBot,
    resolveTelegramPost,
    searchWebEngine,
    webSearchAndDownload,
    findDirectMirrorsForBook: (title, author, lang) => findDirectMirrorsForTelegramDoc(title || cleanSearchTitle(title, author), '', lang, author),
    resolveBookDownloads,
    aggregateBookLinks,
    ensureArabicSummary,
    normalizeCoverUrl,
    resolveBookCover,
    resolveBookPageCount,
    extractScribdDocId,
    fetchAuthorBio,
    searchAuthorBooks,
    scoreSimilar,
    fetchSimilarOnline,
    translateTextQuick,
    fetchRealOnlineReviews,
    tryFastNoorSearchHttp,
    searchAudiobooks,
    findFreeOpenAudiobookAlternatives,
    audioTitleMatchesQuery,
    fetchLibriVoxLatest,
    fetchYouTubeSummaryHighlights,
    resolveYouTubeAudioStream,
    resolveSingleAudioTrackUrl,
    resolveAudiobookTracks,
    prewarmAudiobooksEngine,
    prefetchYouTubeAudioStreams,
    formatDurationLabel,
  };
})();
