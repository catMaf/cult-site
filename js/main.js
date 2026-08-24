(() => {
  const lightboxMap = {
    mafia: "assets/images/mafia.jpg",
    mystery: "assets/images/mystery.jpg",
    birthday: "assets/images/birthday.jpg",
    drinks: "assets/images/drinks.jpg",
    tableware: "assets/images/tableware.jpg",
    banquet: "assets/images/banquet.jpg",
    catering: "assets/images/catering.jpg",
    space: "assets/images/gal-01.jpg",
    dj: "assets/images/gal-02.jpg",
  };

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("site-nav");
  const toggle = document.querySelector(".nav-toggle");
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxDesc = document.getElementById("lightbox-desc");
  const filmStrip = document.querySelector(".film-strip");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header scroll state */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile nav */
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  /* Service lightbox */
  let lastFocus = null;
  let lightboxTimer = 0;

  const openLightbox = (key, title, desc, source) => {
    const src = lightboxMap[key];
    if (!src || !lightbox) return;
    window.clearTimeout(lightboxTimer);
    lastFocus = document.activeElement;
    lightboxImage.src = src;
    lightboxImage.alt = title || "Фото услуги Cult Place";
    lightboxTitle.textContent = title || "";
    lightboxDesc.textContent = desc || "";

    /* панель стартует со стороны нажатой карточки, а не из центра */
    if (source) {
      const rect = source.getBoundingClientRect();
      const dx = (rect.left + rect.width / 2 - window.innerWidth / 2) * 0.07;
      const dy = (rect.top + rect.height / 2 - window.innerHeight / 2) * 0.07;
      lightbox.style.setProperty("--from-x", `${dx.toFixed(1)}px`);
      lightbox.style.setProperty("--from-y", `${dy.toFixed(1)}px`);
    }

    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    /* кадр на применение стартовых стилей, иначе переход не запустится */
    requestAnimationFrame(() => lightbox.classList.add("is-open"));
    lightbox.querySelector(".lightbox-close")?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden || !lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");

    const finish = () => {
      lightbox.hidden = true;
      lightboxImage.removeAttribute("src");
      document.body.classList.remove("lightbox-open");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    };

    if (reduceMotion) finish();
    else lightboxTimer = window.setTimeout(finish, 320);
  };

  document.querySelectorAll(".glass-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      openLightbox(btn.dataset.lightbox, btn.dataset.title, btn.dataset.desc, btn);
    });
  });

  lightbox?.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", closeLightbox);
  });

  /* Gallery arrows */
  document.querySelectorAll(".gallery-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!filmStrip) return;
      const dir = Number(btn.dataset.dir) || 1;
      const amount = Math.min(320, filmStrip.clientWidth * 0.75) * dir;
      filmStrip.scrollBy({ left: amount, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* Polaroid lift / put-back */
  const liftLayer = document.createElement("div");
  liftLayer.className = "polaroid-lift-layer";
  liftLayer.innerHTML = '<div class="polaroid-lift-backdrop" data-polaroid-close></div>';
  document.body.appendChild(liftLayer);
  const liftBackdrop = liftLayer.querySelector("[data-polaroid-close]");

  let activeSource = null;
  let activeClone = null;
  let closing = false;

  const targetRectFor = (width) => {
    const maxH = Math.min(window.innerHeight * 0.82, 720);
    const maxW = Math.min(window.innerWidth * 0.9, 420);
    const scaleByW = maxW / width;
    const naturalH = width * (4 / 3) * 1.15;
    const scaleByH = maxH / naturalH;
    const scale = Math.min(scaleByW, scaleByH, 2.2);
    const w = width * scale;
    const h = naturalH * scale;
    return {
      left: (window.innerWidth - w) / 2,
      top: (window.innerHeight - h) / 2,
      width: w,
      scale,
    };
  };

  const closePolaroid = () => {
    if (!activeClone || !activeSource || closing) return;
    closing = true;
    const rect = activeSource.getBoundingClientRect();
    liftLayer.classList.remove("is-open");
    activeClone.classList.remove("is-active");
    activeClone.style.transition = reduceMotion
      ? "none"
      : "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1), width 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
    activeClone.style.left = `${rect.left}px`;
    activeClone.style.top = `${rect.top}px`;
    activeClone.style.width = `${rect.width}px`;
    activeClone.style.transform = getComputedStyle(activeSource).transform || "none";

    const finish = () => {
      activeClone?.remove();
      activeSource?.classList.remove("is-placeholder");
      activeClone = null;
      activeSource = null;
      closing = false;
      document.body.classList.remove("lightbox-open");
    };

    if (reduceMotion) {
      finish();
      return;
    }
    let done = false;
    const once = () => {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      finish();
    };
    const guard = window.setTimeout(once, 600);
    activeClone.addEventListener("transitionend", once, { once: true });
  };

  const openPolaroid = (figure) => {
    if (activeClone || closing) return;
    const rect = figure.getBoundingClientRect();
    const clone = figure.cloneNode(true);
    clone.classList.add("polaroid-lift");
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.transform = getComputedStyle(figure).transform || "none";
    clone.style.transition = "none";

    figure.classList.add("is-placeholder");
    liftLayer.appendChild(clone);
    activeSource = figure;
    activeClone = clone;
    document.body.classList.add("lightbox-open");

    const target = targetRectFor(rect.width);
    requestAnimationFrame(() => {
      liftLayer.classList.add("is-open");
      if (reduceMotion) {
        clone.style.left = `${target.left}px`;
        clone.style.top = `${target.top}px`;
        clone.style.width = `${target.width}px`;
        clone.style.transform = "none";
        clone.classList.add("is-active");
        return;
      }
      clone.style.transition =
        "left 0.45s cubic-bezier(0.22, 1, 0.36, 1), top 0.45s cubic-bezier(0.22, 1, 0.36, 1), width 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)";
      clone.style.left = `${target.left}px`;
      clone.style.top = `${target.top}px`;
      clone.style.width = `${target.width}px`;
      clone.style.transform = "rotate(0deg)";
      clone.classList.add("is-active");
    });

    clone.addEventListener("click", (e) => {
      e.stopPropagation();
      closePolaroid();
    });
  };

  document.querySelectorAll(".film-strip .polaroid").forEach((figure) => {
    figure.setAttribute("tabindex", "0");
    figure.setAttribute("role", "button");
    figure.setAttribute("aria-label", "Открыть фото");
    figure.addEventListener("click", () => openPolaroid(figure));
    figure.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openPolaroid(figure);
      }
    });
  });

  liftBackdrop?.addEventListener("click", closePolaroid);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (activeClone) closePolaroid();
      else closeLightbox();
    }
  });

  /* Embers / sparks */
  const canvas = document.getElementById("embers");
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  let raf = 0;
  let running = true;

  const resize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (w === width && h === height) return;
    width = canvas.width = w;
    height = canvas.height = h;
  };

  /* Спрайты искр: рисуются один раз, дальше только drawImage */
  const SPRITE_R = 16;
  const sprites = [8, 12, 16, 20, 24].map((hue) => {
    const c = document.createElement("canvas");
    c.width = c.height = SPRITE_R * 2;
    const g = c.getContext("2d");
    const grad = g.createRadialGradient(SPRITE_R, SPRITE_R, 0, SPRITE_R, SPRITE_R, SPRITE_R);
    grad.addColorStop(0, `hsla(${hue}, 95%, 62%, 1)`);
    grad.addColorStop(0.15, `hsla(${hue}, 95%, 58%, 0.9)`);
    grad.addColorStop(0.45, `hsla(${hue}, 100%, 52%, 0.22)`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 50%, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  });

  const spawn = () => ({
    x: width * (0.25 + Math.random() * 0.5),
    y: height * (0.55 + Math.random() * 0.4),
    r: 0.6 + Math.random() * 1.8,
    vx: (Math.random() - 0.5) * 0.35,
    vy: -0.25 - Math.random() * 0.55,
    life: 0,
    max: 180 + Math.random() * 220,
    sprite: sprites[(Math.random() * sprites.length) | 0],
  });

  const init = () => {
    resize();
    const count = Math.min(28, Math.floor(width / 40));
    particles = Array.from({ length: count }, spawn);
  };

  const draw = () => {
    if (!running) return;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.life += 1;
      p.x += p.vx + Math.sin((p.life + i) * 0.02) * 0.15;
      p.y += p.vy;

      if (p.life >= p.max || p.y < height * 0.15) {
        particles[i] = spawn();
        continue;
      }

      const t = p.life / p.max;
      const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
      const size = (p.r + 8) * 2;

      ctx.globalAlpha = Math.max(0, alpha) * 0.75;
      ctx.drawImage(p.sprite, p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };

  init();
  draw();

  let resizeTimer = 0;
  window.addEventListener(
    "resize",
    () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 200);
    },
    { passive: true }
  );

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (!running) {
      running = true;
      cancelAnimationFrame(raf);
      draw();
    }
  });
})();
