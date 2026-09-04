/* ==========================================================================
   O‘ktam & Dilbar — Digital Wedding Invitation
   Vanilla JS · no dependencies
   ========================================================================== */

/* --------------------------------------------------------------------------
   CONFIG — barcha o‘zgaradigan ma’lumot shu yerda
   -------------------------------------------------------------------------- */
const wedding = {
  groom: "O‘ktam",
  bride: "Dilbar",

  // Nikoh to‘yi sanasi va boshlanish vaqti (Toshkent vaqti, +05:00)
  date: "2026-09-14T19:00:00+05:00",
  displayDate: "14.09.2026",

  venue: "Imperial Wedding Hall",
  landmark: "Gorny universitet ro‘parasida",

  // Xarita: Yandex Maps havolasi. Bo‘sh qoldirilsa koordinatalardan yasaladi.
  mapUrl: "https://yandex.uz/maps/-/CTTLmEMF",
  coords: { lat: 40.095266, lng: 65.386922 },

  // Fayllar
  music: "./assets/music.mp3",
  couplePhoto: "./assets/couple.jpg",
  venuePhoto: "./assets/venue.jpg",

  // To‘y dasturi — istagancha qator qo‘shsa bo‘ladi
  timeline: [
    { time: "18:00", title: "Mehmonlarni kutib olish", icon: "glass" },
    { time: "19:00", title: "To‘y oqshomi", icon: "rings" },
  ],

  // RSVP javoblari qayerga yuborilsin.
  // Raqam yozilsa WhatsApp'ga, username yozilsa Telegram'ga yuboriladi.
  // Ikkalasi bo‘sh bo‘lsa javob shu qurilmada saqlanadi va tasdiq matni chiqadi.
  rsvpWhatsApp: "",   // masalan: "998901234567"
  rsvpTelegram: "",   // masalan: "username" (@ belgisisiz)
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba",
  "Payshanba", "Juma", "Shanba"];

/** ISO satridan sana qismlarini o‘qiydi — foydalanuvchi vaqt mintaqasiga bog‘liq emas. */
function parseDateParts(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, hh = "00", mm = "00"] = m;
  return {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hours: hh,
    minutes: mm,
    // Kalendar sanasiga mos hafta kuni (UTC orqali — mintaqadan qat’i nazar to‘g‘ri)
    weekday: WEEKDAYS[new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d))).getUTCDay()],
  };
}

/* --------------------------------------------------------------------------
   Config → DOM
   -------------------------------------------------------------------------- */
function applyConfig() {
  const p = parseDateParts(wedding.date);
  const names = `${wedding.groom} & ${wedding.bride}`;
  const pad2 = (n) => String(n).padStart(2, "0");

  const values = {
    groom: wedding.groom,
    bride: wedding.bride,
    namesScript: names,
    venue: wedding.venue,
    landmark: wedding.landmark,
    displayDate: wedding.displayDate,
  };

  if (p) {
    Object.assign(values, {
      day: String(p.day),
      monthUp: MONTHS[p.month - 1],
      year: String(p.year),
      weekday: p.weekday,
      startTime: `${p.hours}:${p.minutes}`,
      dateDots: `${pad2(p.day)} • ${pad2(p.month)} • ${p.year}`,
    });
  }

  $$("[data-bind]").forEach((el) => {
    const v = values[el.dataset.bind];
    if (v !== undefined) el.textContent = v;
  });

  const photos = { "./assets/couple.jpg": wedding.couplePhoto, "./assets/venue.jpg": wedding.venuePhoto };
  $$("[data-photo]").forEach((img) => {
    const attr = img.getAttribute("src");
    if (photos[attr] && photos[attr] !== attr) img.src = photos[attr];
  });

  document.title = `${names} | Taklifnoma`;
}

/* --------------------------------------------------------------------------
   Envelope — ochilish animatsiyasi
   -------------------------------------------------------------------------- */
function initEnvelope(onOpen) {
  const screen = $("#envelope-screen");
  const seal = $("#env-seal");
  const body = document.body;

  const reveal = () => {
    body.classList.remove("is-sealed");
    body.classList.add("is-open");
    window.scrollTo(0, 0);
    document.dispatchEvent(new CustomEvent("invitation:open"));
  };

  if (!screen || !seal) {
    reveal();
    return;
  }

  let opened = false;

  const open = () => {
    if (opened) return;
    opened = true;

    if (typeof onOpen === "function") onOpen(); // musiqa — user gesture ichida

    const fast = reduced();
    const t = fast
      ? { flap: 0, rise: 0, away: 120, done: 400, scroll: 260 }
      : { flap: 280, rise: 950, away: 1780, done: 2600, scroll: 1980 };

    screen.classList.add("env--opening");
    setTimeout(() => screen.classList.add("env--flap"), t.flap);
    setTimeout(() => screen.classList.add("env--rise"), t.rise);
    setTimeout(() => screen.classList.add("env--away"), t.away);
    setTimeout(reveal, t.scroll);
    setTimeout(() => screen.remove(), t.done);
  };

  seal.addEventListener("click", open);
  // Konvertning istalgan joyiga tegish ham ochadi
  screen.addEventListener("click", open);
}

/* --------------------------------------------------------------------------
   Scroll reveal — [data-reveal] va timeline
   -------------------------------------------------------------------------- */
function initReveals() {
  const targets = $$("[data-reveal]");

  targets.forEach((el) => {
    if (el.dataset.delay) el.style.setProperty("--d", `${parseInt(el.dataset.delay, 10) || 0}ms`);
  });

  $$("[data-reveal='stagger']").forEach((parent) => {
    Array.from(parent.children).forEach((child, i) => child.style.setProperty("--i", i));
  });

  const extra = $$(".tl-item, .timeline");
  const all = targets.concat(extra);

  if (!("IntersectionObserver" in window)) {
    all.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
  );

  all.forEach((el) => io.observe(el));
}

/* --------------------------------------------------------------------------
   Countdown — har sekundda faqat textContent yangilanadi
   -------------------------------------------------------------------------- */
function initCountdown() {
  const grid = $("#cd");
  const today = $("#cd-today");
  const cells = { d: $("#cd-d"), h: $("#cd-h"), m: $("#cd-m"), s: $("#cd-s") };
  if (!grid || !today || Object.values(cells).some((c) => !c)) return;

  const target = new Date(wedding.date).getTime();
  if (Number.isNaN(target)) return;

  const prev = {};
  const pad = (n) => String(n).padStart(2, "0");
  let timer = null;

  const set = (key, value) => {
    if (prev[key] === value) return;
    prev[key] = value;
    const el = cells[key];
    el.textContent = value;
    el.classList.add("tick");
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("tick")));
  };

  const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  const tick = () => {
    const diff = target - Date.now();

    if (diff <= 0) {
      grid.hidden = true;
      today.hidden = false;
      today.setAttribute("data-reveal", "fade");
      requestAnimationFrame(() => today.classList.add("in"));
      stop();
      return;
    }

    const s = Math.floor(diff / 1000);
    set("d", pad(Math.floor(s / 86400)));
    set("h", pad(Math.floor((s % 86400) / 3600)));
    set("m", pad(Math.floor((s % 3600) / 60)));
    set("s", pad(s % 60));
  };

  const start = () => { if (!timer) { tick(); timer = setInterval(tick, 1000); } };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (target - Date.now() > 0) start();
  });

  start();
}

/* --------------------------------------------------------------------------
   Timeline — config'dan quriladi
   -------------------------------------------------------------------------- */
const TL_ICONS = {
  rings:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="9.5" cy="15" r="5.6"/><circle cx="16" cy="12" r="5.6"/>' +
    '<path d="M14 2.6 12.4 5.4h3.2L14 2.6Z"/></svg>',
  glass:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6.5 3h5l-1 7a1.6 1.6 0 0 1-3 0l-1-7Z"/><path d="M9 13v7M6.6 20.6h4.8"/>' +
    '<path d="M13 3h5l-1 7a1.6 1.6 0 0 1-3 0l-1-7Z"/><path d="M15.5 13v7M13.1 20.6h4.8"/></svg>',
  flower:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 21V9"/><path d="M12 15c-4.2 0-6.8-2.6-6.8-6.8C9.4 8.2 12 10.8 12 15Z"/>' +
    '<path d="M12 12.5c4.2 0 6.8-2.6 6.8-6.8-4.2 0-6.8 2.6-6.8 6.8Z"/><circle cx="12" cy="4.6" r="1.8"/></svg>',
  music:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M9 18V5.5l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/></svg>',
};

function initTimeline() {
  const list = $("#timeline");
  if (!list) return;

  const items = Array.isArray(wedding.timeline) ? wedding.timeline : [];
  if (!items.length) {
    const section = list.closest("section");
    if (section) section.hidden = true;
    return;
  }

  list.innerHTML = items
    .map((item, i) => {
      const icon = TL_ICONS[item.icon] || TL_ICONS.flower;
      return (
        `<li class="tl-item" style="--d:${i * 120}ms">` +
        `<span class="tl-item__icon" aria-hidden="true">${icon}</span>` +
        `<p class="tl-item__time">${item.time}</p>` +
        `<p class="tl-item__title">${item.title}</p>` +
        `</li>`
      );
    })
    .join("");
}

/* --------------------------------------------------------------------------
   Music — autoplay majburlanmaydi, konvert ochilganda user gesture bilan boshlanadi
   -------------------------------------------------------------------------- */
function createMusicPlayer() {
  const audio = $("#bgm");
  const btn = $("#music-btn");
  if (!audio || !btn) return { start() {} };

  let state = "paused";
  let attached = false;

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

  const attach = () => {
    if (attached) return;
    attached = true;
    audio.src = wedding.music;
    audio.load();
  };

  const play = () => {
    if (state === "unavailable") return;
    attach();
    let p;
    try { p = audio.play(); } catch (_) { markUnavailable(); return; }
    if (!p || typeof p.then !== "function") { setState("playing"); return; }
    p.then(() => setState("playing")).catch((err) => {
      // NotAllowedError → brauzer ruxsat bermadi, tugma orqali yoqiladi
      if (!err || err.name !== "NotAllowedError") markUnavailable();
    });
  };

  const pause = () => { audio.pause(); setState("paused"); };

  audio.addEventListener("error", markUnavailable);
  audio.addEventListener("play", () => { if (state !== "unavailable") setState("playing"); });
  audio.addEventListener("pause", () => { if (state === "playing") setState("paused"); });

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (state === "playing") pause(); else play();
  });

  return { start: play };
}

/* --------------------------------------------------------------------------
   Map button
   -------------------------------------------------------------------------- */
function initMapButton() {
  const btn = $("#map-btn");
  if (!btn) return;

  const url = () => {
    if (wedding.mapUrl && wedding.mapUrl !== "#") return wedding.mapUrl;
    const c = wedding.coords;
    if (c && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
      return `https://yandex.uz/maps/?pt=${c.lng},${c.lat}&z=17&l=map`;
    }
    return "";
  };

  btn.addEventListener("click", () => {
    const href = url();
    if (href) window.open(href, "_blank", "noopener");
  });
}

/* --------------------------------------------------------------------------
   RSVP
   -------------------------------------------------------------------------- */
function initRsvp() {
  const form = $("#rsvp-form");
  const note = $("#rsvp-note");
  const nameInput = $("#rsvp-name");
  if (!form || !note || !nameInput) return;

  const say = (text, isError) => {
    note.textContent = text;
    note.classList.toggle("err", Boolean(isError));
    note.classList.add("show");
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    if (!name) {
      say("Iltimos, ismingizni yozing.", true);
      nameInput.focus();
      return;
    }

    const answer = (form.querySelector("input[name='answer']:checked") || {}).value || "";
    const message = `Taklifnoma javobi\nIsm: ${name}\nJavob: ${answer}`;

    if (wedding.rsvpWhatsApp) {
      const phone = String(wedding.rsvpWhatsApp).replace(/\D/g, "");
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      say("Rahmat! Javobingiz yuborilmoqda.");
      return;
    }

    if (wedding.rsvpTelegram) {
      const user = String(wedding.rsvpTelegram).replace(/^@/, "");
      window.open(`https://t.me/${user}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
      say("Rahmat! Javobingiz yuborilmoqda.");
      return;
    }

    // Backend yo‘q — javob shu qurilmada saqlanadi
    try {
      localStorage.setItem("rsvp", JSON.stringify({ name, answer, at: new Date().toISOString() }));
    } catch (_) { /* private rejimda localStorage ishlamasligi mumkin */ }

    say(answer.startsWith("Albatta")
      ? `Rahmat, ${name}! Sizni kutib qolamiz.`
      : `Rahmat, ${name}. Javobingiz qabul qilindi.`);
    form.querySelector("button[type='submit']").disabled = true;
  });
}

/* --------------------------------------------------------------------------
   Photos — fayl bo‘lmasa nafis placeholder ko‘rsatiladi
   -------------------------------------------------------------------------- */
function initPhotos() {
  $$("[data-photo]").forEach((img) => {
    const figure = img.closest(".photo");
    if (!figure) return;
    const miss = () => figure.classList.add("is-missing");
    img.addEventListener("error", miss);
    if (img.complete && img.naturalWidth === 0) miss();
  });
}

/* --------------------------------------------------------------------------
   Parallax — juda yengil, faqat [data-parallax]
   -------------------------------------------------------------------------- */
function initParallax() {
  if (reduced()) return;
  if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
      (navigator.deviceMemory && navigator.deviceMemory < 2)) return;

  const items = $$("[data-parallax]").map((el) => ({
    el,
    factor: parseFloat(el.dataset.parallax) || 0,
    visible: false,
  }));
  if (!items.length || !("IntersectionObserver" in window)) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const it of items) {
      if (!it.visible) continue;
      const rect = it.el.getBoundingClientRect();
      const fromCenter = rect.top + rect.height / 2 - vh / 2;
      it.el.style.transform = `translate3d(0, ${(fromCenter * it.factor).toFixed(2)}px, 0)`;
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
  initTimeline();
  initPhotos();
  initCountdown();
  initMapButton();
  initRsvp();

  const music = createMusicPlayer();

  document.addEventListener("invitation:open", () => {
    initReveals();
    initParallax();
  }, { once: true });

  initEnvelope(() => music.start());
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
