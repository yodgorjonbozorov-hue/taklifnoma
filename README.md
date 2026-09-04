# O‘ktam & Dilbar — Taklifnoma

Premium digital wedding invitation. Sof HTML5 + CSS3 + Vanilla JS — framework yo‘q, build yo‘q.

## Struktura

```
├── index.html
├── style.css
├── script.js
└── assets/
    ├── music.mp3          fon musiqasi
    ├── fonts.css          self-hosted shriftlar
    ├── fonts/             .woff2 fayllar
    ├── couple.jpg         kelin-kuyov surati   (o‘zingiz qo‘shasiz)
    ├── venue.jpg          to‘yxona surati      (o‘zingiz qo‘shasiz)
    └── preview.jpg        Telegram/WhatsApp preview, 1200×630 (ixtiyoriy)
```

`couple.jpg`, `venue.jpg`, `preview.jpg` bo‘lmasa ham sayt xatosiz ishlaydi —
suratlar o‘rnida nafis ornamental placeholder ko‘rinadi.

## Sozlash

Barcha ma’lumot `script.js` boshidagi `wedding` obyektida:
ismlar, sana, to‘yxona, mo‘ljal, xarita havolasi, to‘y dasturi, RSVP manzili.

## Bo‘limlar

Konvert intro → Hero → Taklif matni → Surat → Sana → Countdown →
To‘y dasturi → Manzil → RSVP → Yakuniy bo‘lim.

## Ishga tushirish

`index.html` ni brauzerda oching yoki papkada:

```
python3 -m http.server 8080
```

## Deploy

Har push’da GitHub Actions saytni `gh-pages` branchiga chiqaradi.
Netlify / Vercel uchun ham papkani shundayligicha yuklash kifoya — build kerak emas.
