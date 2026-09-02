(function () {
  const LOGO_ITEMS = [
    { image: "assets/img/logos/787-parfum.jpg", name: "787 Parfum" },
    { image: "assets/img/logos/april-luxe.jpg", name: "April Luxe Co." },
    { image: "assets/img/logos/costa-sur.jpg", name: "Costa Sur" },
    { image: "assets/img/logos/easy-financial.jpg", name: "Easy Financial Realty" },
    { image: "assets/img/logos/jeks-ac.jpg", name: "Jek's A/C Services" },
    { image: "assets/img/logos/matos-sea.jpg", name: "Matos Sea Voyage" },
    { image: "assets/img/logos/blessed-garage.jpg", name: "Blessed Garage PR" },
    { image: "assets/img/logos/terramar-surveys.jpg", name: "TerraMAR Surveys" },
    { image: "assets/img/logos/lumo-board.jpg", name: "Lumo Board" },
    { image: "assets/img/logos/signature-renovations.jpg", name: "Signature Renovations" },
    { image: "assets/img/logos/lab-lajas.jpg", name: "Laboratorio Clínico Lajas Arriba" },
    { image: "assets/img/logos/jac-abogado.jpg", name: "JAC Abogado Notario" }
  ];

  const ARROW_SVG = {
    prev: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function initLogoLightbox(onNavigate) {
    const box = document.createElement("div");
    box.className = "logo-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Mockup de logo ampliado");
    box.innerHTML = `
      <button type="button" class="logo-lightbox__close" aria-label="Cerrar">×</button>
      <button type="button" class="logo-lightbox__nav logo-lightbox__nav--prev" aria-label="Anterior">←</button>
      <figure class="logo-lightbox__frame">
        <img alt="">
        <figcaption></figcaption>
      </figure>
      <button type="button" class="logo-lightbox__nav logo-lightbox__nav--next" aria-label="Siguiente">→</button>`;
    document.body.appendChild(box);

    const img = box.querySelector("img");
    const caption = box.querySelector("figcaption");
    const closeBtn = box.querySelector(".logo-lightbox__close");
    const prevBtn = box.querySelector(".logo-lightbox__nav--prev");
    const nextBtn = box.querySelector(".logo-lightbox__nav--next");
    let index = 0;

    function show(i) {
      index = (i + LOGO_ITEMS.length) % LOGO_ITEMS.length;
      const item = LOGO_ITEMS[index];
      img.src = item.image;
      img.alt = "Diseño de logotipo — " + item.name;
      caption.textContent = item.name;
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      onNavigate(index);
    }

    function hide() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    closeBtn.addEventListener("click", hide);
    prevBtn.addEventListener("click", () => show(index - 1));
    nextBtn.addEventListener("click", () => show(index + 1));
    box.addEventListener("click", (e) => { if (e.target === box) hide(); });
    document.addEventListener("keydown", (e) => {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });

    return { open: (i) => show(i) };
  }

  function initLogosCarousel(root) {
    if (!root || !LOGO_ITEMS.length) return null;

    root.classList.add("logos-carousel");
    root.setAttribute("role", "region");
    root.setAttribute("aria-roledescription", "carousel");
    root.setAttribute("aria-label", "Mockups de diseño de logotipos");

    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "logos-carousel__arrow logos-carousel__arrow--prev";
    prevBtn.setAttribute("aria-label", "Mockups anteriores");
    prevBtn.innerHTML = ARROW_SVG.prev;

    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "logos-carousel__arrow logos-carousel__arrow--next";
    nextBtn.setAttribute("aria-label", "Siguientes mockups");
    nextBtn.innerHTML = ARROW_SVG.next;

    const viewport = document.createElement("div");
    viewport.className = "logos-carousel__viewport";

    const track = document.createElement("div");
    track.className = "logos-carousel__track";

    LOGO_ITEMS.forEach((item, i) => {
      const slide = document.createElement("button");
      slide.type = "button";
      slide.className = "logos-carousel__slide";
      slide.setAttribute("aria-label", "Ampliar logo " + item.name);
      slide.dataset.index = String(i);

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = "Diseño de logotipo — " + item.name;
      img.loading = i < 4 ? "eager" : "lazy";
      img.draggable = false;

      const caption = document.createElement("span");
      caption.className = "logos-carousel__caption";
      caption.textContent = item.name;

      slide.append(img, caption);
      track.appendChild(slide);
    });

    viewport.appendChild(track);

    const dotsWrap = document.createElement("div");
    dotsWrap.className = "logos-carousel__dots";
    dotsWrap.setAttribute("role", "tablist");
    dotsWrap.setAttribute("aria-label", "Ir a mockup");

    const dots = LOGO_ITEMS.map((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "logos-carousel__dot";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", "Mockup " + (i + 1));
      dotsWrap.appendChild(dot);
      return dot;
    });

    root.append(prevBtn, viewport, nextBtn, dotsWrap);

    let index = 0;
    let offsetX = 0;
    let drag = null;
    let suppressClick = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function getMetrics() {
      const slide = track.querySelector(".logos-carousel__slide");
      if (!slide) return { step: 1, maxIndex: 0, visible: 1 };
      const rect = slide.getBoundingClientRect();
      const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 16;
      const step = rect.width + gap;
      const visible = Math.max(1, viewport.clientWidth / step);
      const maxIndex = Math.max(0, LOGO_ITEMS.length - Math.ceil(visible));
      return { step, maxIndex, visible, gap };
    }

    function applyTransform(animate) {
      const { step } = getMetrics();
      const x = -(index * step) + offsetX;
      track.style.transition = animate && !reduced ? "transform 0.42s var(--ease, ease)" : "none";
      track.style.transform = "translate3d(" + x + "px, 0, 0)";
    }

    function updateUI(animate) {
      const { maxIndex } = getMetrics();
      if (index > maxIndex) index = maxIndex;

      prevBtn.disabled = index <= 0;
      nextBtn.disabled = index >= maxIndex;

      dots.forEach((dot, i) => {
        const active = i === index;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-selected", active ? "true" : "false");
      });

      applyTransform(animate !== false);
    }

    function goTo(i, animate) {
      const { maxIndex } = getMetrics();
      index = Math.max(0, Math.min(i, maxIndex));
      offsetX = 0;
      updateUI(animate);
    }

    prevBtn.addEventListener("click", () => goTo(index - 1));
    nextBtn.addEventListener("click", () => goTo(index + 1));
    dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

    track.querySelectorAll(".logos-carousel__slide").forEach((slide) => {
      slide.addEventListener("click", () => {
        if (suppressClick) return;
        const i = Number(slide.dataset.index);
        root.dispatchEvent(new CustomEvent("logocarousel:open", { detail: { index: i } }));
      });
    });

    viewport.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, startX: offsetX, moved: false };
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        viewport.setPointerCapture(e.pointerId);
      }
      if (!drag.moved) return;
      offsetX = drag.startX + dx;
      applyTransform(false);
    });

    function endDrag(e) {
      if (!drag || (e && drag.id !== e.pointerId)) return;
      if (drag.moved) {
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        const { step } = getMetrics();
        const threshold = Math.min(60, step * 0.22);
        if (offsetX > threshold) goTo(index - 1);
        else if (offsetX < -threshold) goTo(index + 1);
        else {
          offsetX = 0;
          applyTransform(true);
        }
      }
      drag = null;
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(index - 1);
      if (e.key === "ArrowRight") goTo(index + 1);
    });

    const ro = new ResizeObserver(() => {
      offsetX = 0;
      updateUI(false);
    });
    ro.observe(viewport);

    root.tabIndex = 0;
    goTo(0, false);

    return {
      goTo,
      getIndex: () => index,
      destroy: () => ro.disconnect()
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-logos-carousel]");
    if (!root) return;

    const carousel = initLogosCarousel(root);
    const lightbox = initLogoLightbox((i) => carousel.goTo(i));

    root.addEventListener("logocarousel:open", (e) => {
      lightbox.open(e.detail.index);
    });
  });
})();
