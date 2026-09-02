/* ==========================================================================
   O‘ktam & Dilbar — Taklifnoma
   Vanilla JS · no dependencies
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIG — boshqa to‘y uchun faqat shu qismni o‘zgartiring
   -------------------------------------------------------------------------- */
const MAP_URL = "https://yandex.uz/maps/-/CTTLmEMF"; // Yandex Maps havolasi

const weddingConfig = {
  groom: "O‘ktam",
  bride: "Dilbar",
  date: "2026-09-14T18:00:00",       // Countdown uchun (mahalliy vaqt)
  dateText: "14 sentyabr",           // Ekranda ko‘rinadigan sana
  venue: "Imperial Wedding Hall",
  landmark: "Gorni universitet ro‘parasida",
  coords: { lat: 40.095266, lng: 65.386922 }, // mapUrl bo‘sh bo‘lsa shu koordinatalardan Yandex havola yasaladi
  mapUrl: MAP_URL,
  music: "music.mp3",
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/* --------------------------------------------------------------------------
   Config → DOM
   -------------------------------------------------------------------------- */
function applyConfig() {
  const [day = "", ...rest] = weddingConfig.dateText.trim().split(/\s+/);
  const month = capitalize(rest.join(" "));

  const values = {
    groom: weddingConfig.groom,
    bride: weddingConfig.bride,
    venue: weddingConfig.venue,
    landmark: weddingConfig.landmark,
    day,
    monthUpper: month,
    dateUpper: `${day} ${month}`,
    dateDot: `${day} · ${month}`,
  };

  $$("[data-bind]").forEach((el) => {
    const value = values[el.dataset.bind];
    if (value !== undefined && el.textContent !== value) el.textContent = value;
  });

  document.title = `${weddingConfig.groom} & ${weddingConfig.bride} | Taklifnoma`;
}

/* --------------------------------------------------------------------------
   Intro
   -------------------------------------------------------------------------- */
function initIntro() {
  const intro = $("#intro");
  const body = document.body;
  if (!intro) {
    body.classList.remove("is-intro");
    body.classList.add("is-ready");
    document.dispatchEvent(new CustomEvent("intro:done"));
    return;
  }

  const reduced = prefersReducedMotion();
  const HOLD = reduced ? 400 : 2400; // intro ko‘rinish vaqti (ms)

  const finish = () => {
    intro.classList.add("intro--out");
    body.classList.remove("is-intro");
    body.classList.add("is-ready");
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("intro:done"));
    setTimeout(() => intro.remove(), 1500);
  };

  // Font yuklanishini kutamiz (max 700ms) — shunda serif intro sakramaydi
  const start = () => {
    body.classList.add("intro-play");
    setTimeout(finish, HOLD);
  };

  if (document.fonts && document.fonts.ready) {
    let started = false;
    const once = () => {
      if (started) return;
      started = true;
      start();
    };
    document.fonts.ready.then(once);
    setTimeout(once, 700);
  } else {
    start();
  }
}

/* --------------------------------------------------------------------------
   Scroll reveal system  ([data-reveal] → .is-visible)
   -------------------------------------------------------------------------- */
function initRevealAnimations() {
  const targets = $$("[data-reveal]");

  targets.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--d", `${parseInt(el.dataset.delay, 10) || 0}ms`);
  });

  $$("[data-stagger]").forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
  );

  targets.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Countdown — faqat textContent yangilanadi
   -------------------------------------------------------------------------- */
function initCountdown() {
  const grid = $("#countdown-grid");
  const today = $("#countdown-today");
  const cells = {
    days: $("#cd-days"),
    hours: $("#cd-hours"),
    minutes: $("#cd-minutes"),
    seconds: $("#cd-seconds"),
  };
  if (!grid || !today || Object.values(cells).some((c) => !c)) return;

  const target = new Date(weddingConfig.date).getTime();
  if (Number.isNaN(target)) return;

  const previous = {};
  const pad = (n) => String(n).padStart(2, "0");

  const setValue = (key, value) => {
    if (previous[key] === value) return;
    previous[key] = value;
    const el = cells[key];
    el.textContent = value;
    el.classList.add("is-ticking");
    // next frame → remove class → CSS eases back (transform/opacity only)
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("is-ticking")));
  };

  let timer = null;

  const tick = () => {
    const diff = target - Date.now();

    if (diff <= 0) {
      grid.hidden = true;
      today.hidden = false;
      today.setAttribute("data-reveal", "blur-in");
      requestAnimationFrame(() => today.classList.add("is-visible"));
      stop();
      return;
    }

    const s = Math.floor(diff / 1000);
    setValue("days", pad(Math.floor(s / 86400)));
    setValue("hours", pad(Math.floor((s % 86400) / 3600)));
    setValue("minutes", pad(Math.floor((s % 3600) / 60)));
    setValue("seconds", pad(s % 60));
  };

  const start = () => {
    if (timer) return;
    tick();
    timer = setInterval(tick, 1000);
  };

  const stop = () => {
    if (!timer) return;
    clearInterval(timer);
    timer = null;
  };

  // Tab yashirin bo‘lsa batareyani tejaymiz
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (target - Date.now() > 0) start();
  });

  start();
}

/* --------------------------------------------------------------------------
   Music player — autoplay majburlanmaydi, birinchi interactionda ishga tushadi
   -------------------------------------------------------------------------- */
function initMusicPlayer() {
  const audio = $("#bgm");
  const btn = $("#music-btn");
  if (!audio || !btn) return;

  let state = "paused"; // paused | playing | unavailable
  let sourceAttached = false;

  const setState = (next) => {
    state = next;
    btn.dataset.state = next;
    btn.setAttribute("aria-pressed", next === "playing" ? "true" : "false");
    btn.setAttribute("aria-label", next === "playing" ? "Musiqani to‘xtatish" : "Musiqani yoqish");
  };

  const markUnavailable = () => {
    if (state === "unavailable") return;
    setState("unavailable");
    btn.setAttribute("aria-hidden", "true");
    btn.tabIndex = -1;
  };

  const attachSource = () => {
    if (sourceAttached) return;
    sourceAttached = true;
    audio.src = weddingConfig.music;
    audio.load();
  };

  const play = () => {
    if (state === "unavailable") return Promise.resolve(false);
    attachSource();
    let promise;
    try {
      promise = audio.play();
    } catch (_) {
      markUnavailable();
      return Promise.resolve(false);
    }
    if (!promise || typeof promise.then !== "function") {
      setState("playing");
      return Promise.resolve(true);
    }
    return promise
      .then(() => {
        setState("playing");
        return true;
      })
      .catch((err) => {
        // NotAllowedError → browser autoplay policy: jim qolamiz, keyingi bosishda ishlaydi
        // Boshqa xatolar (fayl yo‘q / format) → tugmani yashiramiz
        if (!err || err.name !== "NotAllowedError") markUnavailable();
        return false;
      });
  };

  const pause = () => {
    audio.pause();
    setState("paused");
  };

  audio.addEventListener("error", markUnavailable);
  audio.addEventListener("play", () => { if (state !== "unavailable") setState("playing"); });
  audio.addEventListener("pause", () => { if (state === "playing") setState("paused"); });

  btn.addEventListener("click", () => {
    if (state === "playing") pause();
    else play();
  });

  // Intro tugagach: foydalanuvchining birinchi tap/click/keydown → musiqa
  document.addEventListener(
    "intro:done",
    () => {
      const events = ["touchend", "click", "keydown"];
      const onFirstInteraction = (e) => {
        if (e.target && e.target.closest && e.target.closest("#music-btn")) return; // tugmaning o‘zi boshqaradi
        if (e.type === "keydown" && e.key === "Tab") return;
        events.forEach((t) => document.removeEventListener(t, onFirstInteraction));
        if (state === "paused") play();
      };
      events.forEach((t) => document.addEventListener(t, onFirstInteraction, { passive: true }));
    },
    { once: true }
  );
}

/* --------------------------------------------------------------------------
   Map button
   -------------------------------------------------------------------------- */
function initMapButton() {
  const btn = $("#map-btn");
  if (!btn) return;

  const buildUrl = () => {
    const url = weddingConfig.mapUrl || MAP_URL;
    if (url && url !== "#") return url;
    const c = weddingConfig.coords;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      // Yandex: pt=lng,lat
      return `https://yandex.uz/maps/?pt=${c.lng},${c.lat}&z=17&l=map`;
    }
    return "";
  };

  btn.addEventListener("click", () => {
    const url = buildUrl();
    if (!url) return; // havola ham, koordinata ham yo‘q
    window.open(url, "_blank", "noopener");
  });
}

/* --------------------------------------------------------------------------
   Parallax — faqat [data-parallax] elementlar, rAF bilan, passiv scroll
   -------------------------------------------------------------------------- */
function initParallax() {
  if (prefersReducedMotion()) return;

  // Juda kuchsiz qurilmalarda umuman yoqmaymiz
  const lowEnd =
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
    (navigator.deviceMemory && navigator.deviceMemory < 2);
  if (lowEnd) return;

  const items = $$("[data-parallax]").map((el) => ({
    el,
    factor: parseFloat(el.dataset.parallax) || 0,
    axis: el.dataset.parallaxAxis === "y" ? "y" : "x",
    visible: false,
  }));
  if (!items.length || !("IntersectionObserver" in window)) return;

  let ticking = false;
  let active = true;

  // Performance monitor: ketma-ket sekin frame'lar ko‘p bo‘lsa parallax o‘chadi
  let lastFrame = 0;
  let frames = 0;
  let slowFrames = 0;

  const disable = () => {
    active = false;
    window.removeEventListener("scroll", onScroll);
    items.forEach((it) => (it.el.style.transform = ""));
  };

  const update = () => {
    ticking = false;
    if (!active) return;

    const now = performance.now();
    if (lastFrame && now - lastFrame < 120) {
      frames += 1;
      if (now - lastFrame > 40) slowFrames += 1;
      if (frames >= 40 && slowFrames / frames > 0.35) {
        disable();
        return;
      }
    }
    lastFrame = now;

    const vh = window.innerHeight;
    for (const it of items) {
      if (!it.visible) continue;
      const rect = it.el.getBoundingClientRect();
      const fromCenter = rect.top + rect.height / 2 - vh / 2; // px
      const offset = (fromCenter * it.factor).toFixed(2);
      it.el.style.transform =
        it.axis === "x" ? `translate3d(${offset}px, 0, 0)` : `translate3d(0, ${offset}px, 0)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const it = items.find((x) => x.el === entry.target);
        if (it) it.visible = entry.isIntersecting;
      });
      onScroll();
    },
    { rootMargin: "25% 0px" }
  );
  items.forEach((it) => io.observe(it.el));

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
function init() {
  applyConfig();
  initCountdown();
  initMusicPlayer();
  initMapButton();

  // Reveal + parallax intro tugagach yoqiladi (intro ostida hech narsa ishlamasin)
  document.addEventListener(
    "intro:done",
    () => {
      initRevealAnimations();
      initParallax();
    },
    { once: true }
  );

  initIntro();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
