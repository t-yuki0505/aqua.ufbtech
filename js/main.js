const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
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
