// main.js

// ===== Sparkle trail =====
(() => {
  const HONOR_REDUCED_MOTION = false;
  if (document.documentElement.dataset.sparkles === "off") return;
  if (
    HONOR_REDUCED_MOTION &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;

  const canvas = document.getElementById("sparkle-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: true });
  Object.assign(canvas.style, {
    mixBlendMode: "screen",
    willChange: "transform",
    pointerEvents: "none",
    position: "fixed",
    inset: "0",
    zIndex: "50",
    width: "100%",
    height: "100%",
  });

  const state = {
    w: 0,
    h: 0,
    dpr: Math.min(2, Math.max(1, window.devicePixelRatio || 1)),
  };

  function resize() {
    state.w = canvas.clientWidth | 0;
    state.h = canvas.clientHeight | 0;
    canvas.width = Math.max(1, state.w * state.dpr);
    canvas.height = Math.max(1, state.h * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  const COLORS = ["#3b82f6", "#22c55e", "#facc15", "#fb923c"];
  const SILVER = "#e5e7eb";

  const STEP = 4;
  const PER_STEP = 4;
  const POS_JIT = 12;
  const POS_JIT_PCT = 0.4;

  const LIFE_MIN = 900;
  const LIFE_VAR = 600;
  const FRICTION = 0.992;
  const GRAVITY = 0.007;
  const SPEED_JIT = 1.0;
  const NOISE = 0.035;

  const STAR_CHANCE = 0.08;
  const STAR_SCALES = [0.9, 1.15, 1.4, 1.8, 2.3];

  const IDLE_DELAY_MS = 120;
  const IDLE_EVERY_MS = 55;
  const IDLE_COUNT = 2;
  const IDLE_SPREAD = 18;
  const IDLE_SPEED = 0.5;

  const MAX = 620;

  const P = new Array(MAX).fill(null);
  let head = 0;

  function addParticle(x, y, vx, vy, color, type = "dot", extra = {}) {
    const life = LIFE_MIN + Math.random() * LIFE_VAR;
    const base =
      type === "dot" ? 1.2 + Math.random() * 2.6 : 1.0 + Math.random() * 1.5;
    const rot = Math.random() * Math.PI * 2;
    const starScale =
      type === "star"
        ? STAR_SCALES[(Math.random() * STAR_SCALES.length) | 0]
        : 1;
    P[head] = {
      x,
      y,
      vx,
      vy,
      life,
      ttl: life,
      base,
      color,
      type,
      rot,
      starScale,
      ...extra,
    };
    head = (head + 1) % MAX;
  }

  const hexA = (hex, a) => {
    const n = hex.replace("#", "");
    const v = parseInt(
      n.length === 3 ? n.split("").map((c) => c + c).join("") : n,
      16
    );
    const r = (v >> 16) & 255,
      g = (v >> 8) & 255,
      b = v & 255;
    return `rgba(${r},${g},${b},${a})`;
  };

  function drawBubble(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0.0, hexA(color, Math.min(1, alpha * 0.85)));
    g.addColorStop(0.5, hexA(color, Math.min(1, alpha * 0.35)));
    g.addColorStop(1.0, hexA(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStar5(x, y, outerR, alpha) {
    const innerR = outerR * 0.5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a0 = (i * 2 * Math.PI) / 5;
      const a1 = a0 + Math.PI / 5;
      ctx.lineTo(Math.cos(a0) * outerR, Math.sin(a0) * outerR);
      ctx.lineTo(Math.cos(a1) * innerR, Math.sin(a1) * innerR);
    }
    ctx.closePath();
    ctx.fillStyle = hexA(SILVER, alpha);
    ctx.shadowColor = SILVER;
    ctx.shadowBlur = 14;
    ctx.fill();
    ctx.restore();
  }

  function spawnAt(x, y, segLen, pressed) {
    const now = performance.now();
    const baseIndex = Math.floor(now / 140) % COLORS.length;
    const count = PER_STEP + (pressed ? 1 : 0);
    const jitterR = POS_JIT + segLen * POS_JIT_PCT;

    for (let i = 0; i < count; i++) {
      const angPos = Math.random() * Math.PI * 2;
      const jx = Math.cos(angPos) * (Math.random() * jitterR);
      const jy = Math.sin(angPos) * (Math.random() * jitterR);

      const angVel = Math.random() * Math.PI * 2;
      const pow = Math.random() * SPEED_JIT;
      const vx = Math.cos(angVel) * pow;
      const vy = Math.sin(angVel) * pow - 0.02;

      const color = COLORS[(baseIndex + i) % COLORS.length];
      addParticle(x + jx, y + jy, vx, vy, color, "dot");
    }

    if (Math.random() < STAR_CHANCE) {
      const angVel = Math.random() * Math.PI * 2;
      const vx = Math.cos(angVel) * 0.28;
      const vy = Math.sin(angVel) * 0.28 - 0.05;
      addParticle(x, y, vx, vy, SILVER, "star");
    }
  }

  function sampleSpawns(x0, y0, x1, y1, pressed) {
    if (x0 == null || y0 == null) {
      spawnAt(x1, y1, STEP, pressed);
      return;
    }
    const dx = x1 - x0,
      dy = y1 - y0;
    const dist = Math.hypot(dx, dy);
    const steps = Math.max(1, Math.floor(dist / STEP));
    const segLen = dist / steps;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      spawnAt(x0 + dx * t, y0 + dy * t, segLen, pressed);
    }
  }

  let last = null,
    down = false;
  let lastMoveAt = performance.now();
  let idleAcc = 0;

  addEventListener(
    "pointerdown",
    (e) => {
      down = true;
      last = { x: e.clientX, y: e.clientY };
      lastMoveAt = performance.now();
      spawnAt(e.clientX, e.clientY, STEP, true);
    },
    { passive: true }
  );

  addEventListener(
    "pointerup",
    () => {
      down = false;
      last = null;
    },
    { passive: true }
  );

  addEventListener(
    "pointermove",
    (e) => {
      const list =
        typeof e.getCoalescedEvents === "function"
          ? e.getCoalescedEvents()
          : null;
      if (list && list.length) {
        for (const ev of list) {
          if (last) sampleSpawns(last.x, last.y, ev.clientX, ev.clientY, down);
          else spawnAt(ev.clientX, ev.clientY, STEP, down);
          last = { x: ev.clientX, y: ev.clientY };
        }
      } else {
        const x = e.clientX,
          y = e.clientY;
        if (last) sampleSpawns(last.x, last.y, x, y, down);
        else spawnAt(x, y, STEP, down);
        last = { x, y };
      }
      lastMoveAt = performance.now();
    },
    { passive: true }
  );

  function idleEmit(dt) {
    if (!last) return;
    const since = performance.now() - lastMoveAt;
    if (since < IDLE_DELAY_MS) {
      idleAcc = 0;
      return;
    }
    idleAcc += dt;
    while (idleAcc >= IDLE_EVERY_MS) {
      idleAcc -= IDLE_EVERY_MS;
      for (let i = 0; i < IDLE_COUNT; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.random() * IDLE_SPREAD;
        const x = last.x + Math.cos(ang) * r;
        const y = last.y + Math.sin(ang) * r;
        const vang = Math.random() * Math.PI * 2;
        const vpow = Math.random() * IDLE_SPEED;
        const vx = Math.cos(vang) * vpow;
        const vy = Math.sin(vang) * vpow - 0.02;
        const color =
          COLORS[Math.floor(performance.now() / 180) % COLORS.length];
        addParticle(x, y, vx, vy, color, "dot");
      }
      if (Math.random() < 0.12) {
        const vx = (Math.random() - 0.5) * 0.3;
        const vy = (Math.random() - 0.8) * 0.3;
        addParticle(last.x, last.y, vx, vy, SILVER, "star");
      }
    }
  }

  let lastFrame = performance.now();
  function tick(now) {
    const dt = now - lastFrame;
    lastFrame = now;

    ctx.clearRect(0, 0, state.w, state.h);
    idleEmit(dt);

    for (let i = 0; i < MAX; i++) {
      const p = P[i];
      if (!p || p.ttl <= 0) continue;

      p.vx += (Math.random() - 0.5) * NOISE;
      p.vy += (Math.random() - 0.5) * NOISE;

      p.vx *= FRICTION;
      p.vy = p.vy * FRICTION + GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      p.ttl -= dt;
      const t = Math.max(0, p.ttl / p.life);
      const alpha = t;
      const r = p.base * (0.7 + 1.8 * (1 - t));

      if (p.type === "dot") {
        drawBubble(p.x, p.y, r, p.color, alpha);
      } else {
        drawStar5(p.x, p.y, r * p.starScale, Math.min(1, alpha * 0.9));
      }
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.addEventListener("visibilitychange", () => {
    lastFrame = performance.now();
  });
})();

// ===== Nav, reveal, i18n =====
document.addEventListener("DOMContentLoaded", () => {
  // 👇 CHANGED: pick up the global from translations.js
  const translations =
    window.TRANSLATIONS || window.SQ_TRANSLATIONS || {};

  function setLanguage(lang) {
    const dict = translations[lang] || translations.en || {};
    document.documentElement.lang = lang;

    try {
      localStorage.setItem("sq_lang_choice", lang);
    } catch (e) {}

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const text = dict[key];
      if (text !== undefined) {
        el.innerHTML = text;
      }
    });

    if (dict["meta.title"]) {
      document.title = dict["meta.title"];
    }

    document.querySelectorAll(".lang-switch a[data-lang]").forEach((link) => {
      const code = link.getAttribute("data-lang");
      link.classList.toggle("lang-active", code === lang);
    });
  }

  // Initial language detection
  let initialLang = "en";
  try {
    const stored = localStorage.getItem("sq_lang_choice");
    if (stored) {
      initialLang = stored;
    } else {
      const navLang =
        (navigator.languages && navigator.languages[0]) ||
        navigator.language ||
        "";
      if (navLang.toLowerCase().startsWith("de")) {
        initialLang = "de";
      }
    }
  } catch (e) {}

  setLanguage(initialLang);

  // Language switch clicks
  document
    .querySelectorAll(".lang-switch a[data-lang]")
    .forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const code = link.getAttribute("data-lang");
        setLanguage(code);
      });
    });

  // Nav toggle & scroll behavior
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  const navLinks = document.querySelectorAll(".site-nav a");

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      nav.classList.toggle("nav-open");
    });
  }

  navLinks.forEach((link) => {
    const href = link.getAttribute("href") || "";
    if (href.startsWith("#")) {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({ behavior: "smooth" });

        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        if (nav) nav.classList.remove("nav-open");
      });
    } else {
      link.addEventListener("click", () => {
        if (nav) nav.classList.remove("nav-open");
      });
    }
  });

  // Scroll reveal
  const revealElements = document.querySelectorAll(".reveal");
  const onScroll = () => {
    const triggerBottom = window.innerHeight * 0.85;
    revealElements.forEach((el) => {
      const boxTop = el.getBoundingClientRect().top;
      if (boxTop < triggerBottom) el.classList.add("visible");
    });
  };
  window.addEventListener("scroll", onScroll);
  onScroll();
});
