const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (toggle && nav) {
  const backdrop = document.createElement("div");
  backdrop.className = "nav-backdrop";
  document.body.appendChild(backdrop);

  const setNav = (open) => {
    nav.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  backdrop.addEventListener("click", () => setNav(false));

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setNav(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) setNav(false);
  });
}

const zoomButtons = document.querySelectorAll("[data-lightbox-src]");

if (zoomButtons.length) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "画像を拡大表示");
  lightbox.innerHTML = '<button type="button" aria-label="閉じる">×</button><img alt="">';
  document.body.appendChild(lightbox);

  const closeButton = lightbox.querySelector("button");
  const image = lightbox.querySelector("img");
  let lastFocus = null;

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    document.body.classList.remove("lightbox-open");
    if (lastFocus) lastFocus.focus();
  };

  zoomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      lastFocus = button;
      image.src = button.dataset.lightboxSrc;
      image.alt = button.dataset.lightboxAlt || "";
      lightbox.classList.add("is-open");
      document.body.classList.add("lightbox-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

// PC限定: photo-ribbon の3枚をゆっくり左へ送り、左端の1枚を大きく表示（クローンなし・3枚のみ）
const ribbon = document.querySelector("[data-ribbon]");
if (ribbon) {
  const track = ribbon.querySelector(".photo-ribbon-track");
  const desktop = window.matchMedia("(min-width: 760px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let timer = null;
  let animating = false;
  let paused = false;

  const advance = () => {
    if (animating || paused) return;
    const cards = Array.from(track.children);
    if (cards.length < 2) return;
    animating = true;
    const first = cards[0];
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
    const slot = first.getBoundingClientRect().width + gap;
    first.style.opacity = "0";
    track.style.transition = "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    track.style.transform = "translateX(" + -slot + "px)";
    const done = () => {
      track.style.transition = "none";
      track.style.transform = "";
      track.appendChild(first); // 先頭を末尾へ回す（左端が次の1枚に＝自動で拡大）
      first.style.opacity = "";
      void track.offsetWidth; // reflow
      animating = false;
    };
    track.addEventListener("transitionend", done, { once: true });
  };

  const enable = () => {
    clearInterval(timer);
    timer = setInterval(advance, 3600);
  };
  const disable = () => {
    clearInterval(timer);
    timer = null;
    track.style.transition = "";
    track.style.transform = "";
    Array.from(track.children).forEach((el) => { el.style.opacity = ""; });
  };
  const apply = () => {
    if (desktop.matches && !reduce.matches) enable();
    else disable();
  };

  ribbon.addEventListener("mouseenter", () => { paused = true; });
  ribbon.addEventListener("mouseleave", () => { paused = false; });
  document.addEventListener("visibilitychange", () => { paused = document.hidden; });
  desktop.addEventListener("change", apply);
  reduce.addEventListener("change", apply);
  apply();
}

// 設計アップグレード: ヘッダー影（スクロール時）／スクロール表示
(function () {
  const header = document.querySelector(".site-header");
  if (header) {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      header.classList.toggle("is-scrolled", y > 8);
      if (Math.abs(y - lastY) > 4) {
        if (y > lastY && y > 120) {
          header.classList.add("is-hidden");    // 下スクロール → 隠す
        } else if (y < lastY) {
          header.classList.remove("is-hidden");  // 上スクロール → 表示
        }
        lastY = y;
      }
      if (y < 10) header.classList.remove("is-hidden"); // 最上部は常に表示
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const sel = ".section-head, .feature-row, .large-panel, .split > div, .process li, .compare-item, .article-list > li, .lineup-block, .contact-layout > *, .product-strip > figure, .company-profile, .info-band, .faq-list details, .stat";
  const targets = document.querySelectorAll(sel);
  if (targets.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.04 });
    const vh = window.innerHeight;
    targets.forEach((el) => {
      el.classList.add("reveal");
      if (el.getBoundingClientRect().top < vh * 0.92) {
        el.classList.add("is-visible"); // 初期表示域は即表示（チラつき防止）
      } else {
        io.observe(el);
      }
    });
  }
})();

// #contact: 同一ページ内ならスムーズスクロール（他ページからは通常遷移→着地時にスクロール）
(function () {
  const target = document.getElementById("contact");
  if (!target) return;
  document.querySelectorAll('a[href$="#contact"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#contact");
    });
  });
})();
