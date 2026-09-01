(function (global) {
  const REVIEW_ITEMS = Array.from({ length: 15 }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      image: "assets/img/reviews/review-" + n + ".jpg",
      alt: "Testimonio de cliente JRA Web Design " + (i + 1)
    };
  });

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  function initDepthCarousel(root, items, options) {
    if (!root || !items.length || typeof gsap === "undefined") return null;

    const cfg = Object.assign({
      cardWidth: 300,
      cardHeight: 380,
      radius: 18,
      tint: "#05060a",
      depth: 220,
      spread: 90,
      tilt: 22,
      tiltDirection: "right",
      perspective: 1400,
      visibleCards: 4,
      falloff: 0.2,
      blur: 6,
      duration: 700,
      ease: "power3.out",
      loop: true,
      showControls: false,
      showIndicators: true,
      autoplay: false,
      autoplayDelay: 9000,
      enableWheel: true,
      enableDrag: true
    }, options || {});

    root.style.setProperty("--dc-perspective", cfg.perspective + "px");
    root.setAttribute("role", "group");
    root.setAttribute("aria-roledescription", "carousel");
    root.setAttribute("aria-label", "Testimonios de clientes");
    root.tabIndex = 0;

    const stage = document.createElement("div");
    stage.className = "depth-carousel__stage";
    root.appendChild(stage);

    const cardRefs = [];
    const overlayRefs = [];
    items.forEach((item, i) => {
      const card = document.createElement("div");
      card.className = "depth-carousel__card";
      card.style.width = cfg.cardWidth + "px";
      card.style.height = cfg.cardHeight + "px";
      card.style.borderRadius = cfg.radius + "px";
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", (i + 1) + " de " + items.length);
      card.dataset.index = String(i);

      const img = document.createElement("img");
      img.className = "depth-carousel__img";
      img.src = item.image;
      img.alt = item.alt || "";
      img.draggable = false;
      img.loading = i < 5 ? "eager" : "lazy";

      const tint = document.createElement("span");
      tint.className = "depth-carousel__tint";
      tint.style.background = cfg.tint;

      card.appendChild(img);
      card.appendChild(tint);
      stage.appendChild(card);
      cardRefs.push(card);
      overlayRefs.push(tint);
    });

    let prevBtn;
    let nextBtn;
    let dotsWrap;

    if (cfg.showControls && items.length > 1) {
      prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "depth-carousel__arrow depth-carousel__arrow--prev";
      prevBtn.setAttribute("aria-label", "Testimonio anterior");
      prevBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "depth-carousel__arrow depth-carousel__arrow--next";
      nextBtn.setAttribute("aria-label", "Siguiente testimonio");
      nextBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      root.appendChild(prevBtn);
      root.appendChild(nextBtn);
    }

    if (cfg.showIndicators && items.length > 1) {
      dotsWrap = document.createElement("div");
      dotsWrap.className = "depth-carousel__dots";
      dotsWrap.setAttribute("role", "tablist");
      dotsWrap.setAttribute("aria-label", "Testimonios");
      items.forEach((_, i) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "depth-carousel__dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Ir al testimonio " + (i + 1));
        dot.addEventListener("click", () => {
          setFocus(i, true);
          startAutoplay();
        });
        dotsWrap.appendChild(dot);
      });
      root.appendChild(dotsWrap);
    }

    const count = items.length;
    let pos = 0;
    let focus = 0;
    let scale = 1;
    let tween = null;
    let drag = null;
    let wheelTimer = null;
    let autoTimer = null;
    let autoplayPaused = false;
    let suppressClick = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function layout(position) {
      const dir = cfg.tiltDirection === "left" ? -1 : 1;
      let activeIdx = Math.round(position);
      if (cfg.loop && count > 1) activeIdx = ((activeIdx % count) + count) % count;
      else activeIdx = clamp(activeIdx, 0, count - 1);

      for (let i = 0; i < count; i++) {
        const el = cardRefs[i];
        if (!el) continue;

        let d = i - position;
        if (cfg.loop && count > 1) {
          d = ((d % count) + count) % count;
          if (d > count / 2) d -= count;
        }

        const back = Math.max(0, d);
        const az = Math.abs(d);
        const shown = az <= cfg.visibleCards + 0.5;
        const tz = -cfg.depth * d;
        const tx = dir * cfg.spread * d;
        const ry = dir * cfg.tilt * clamp(d, 0, 1);

        let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
        if (!shown) opacity = 0;

        const brightness = Math.max(0.15, 1 - back * cfg.falloff);
        const blurPx = cfg.blur > 0 ? Math.min(cfg.blur, (back / Math.max(1, cfg.visibleCards)) * cfg.blur) : 0;
        const zi = Math.round(2000 - d * 20);

        el.style.transform = "translate(-50%, -50%) scale(" + scale + ") translateX(" + tx.toFixed(2) + "px) translateZ(" + tz.toFixed(2) + "px) rotateY(" + ry.toFixed(3) + "deg)";
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = "brightness(" + brightness.toFixed(3) + ") blur(" + blurPx.toFixed(2) + "px)";
        el.style.zIndex = String(zi);
        el.style.pointerEvents = shown && opacity > 0.05 ? "auto" : "none";
        el.setAttribute("aria-hidden", activeIdx !== i ? "true" : "false");
        el.classList.toggle("is-focused", activeIdx === i);

        const ov = overlayRefs[i];
        if (ov) ov.style.opacity = clamp(back * cfg.falloff * 1.25, 0, 0.86).toFixed(3);
      }

      if (dotsWrap) {
        dotsWrap.querySelectorAll(".depth-carousel__dot").forEach((dot, idx) => {
          dot.classList.toggle("is-active", idx === activeIdx);
          dot.setAttribute("aria-selected", idx === activeIdx ? "true" : "false");
        });
      }
    }

    function tweenTo(target, animate) {
      if (tween) tween.kill();
      const proxy = { p: pos };
      const dur = animate && !reduced ? cfg.duration / 1000 : 0;
      tween = gsap.to(proxy, {
        p: target,
        duration: dur,
        ease: cfg.ease,
        onUpdate: () => {
          pos = proxy.p;
          layout(pos);
        },
        onComplete: () => {
          if (count > 0) pos = ((pos % count) + count) % count;
          focus = Math.round(pos);
          layout(pos);
        }
      });
    }

    function setFocus(rawIndex, animate) {
      const idx = cfg.loop ? ((rawIndex % count) + count) % count : clamp(rawIndex, 0, count - 1);
      let delta = idx - pos;
      if (cfg.loop && count > 1) {
        delta = ((delta % count) + count) % count;
        if (delta > count / 2) delta -= count;
      }
      tweenTo(pos + delta, animate);
      focus = idx;
    }

    function navigateBy(step) {
      setFocus(focus + step, true);
    }

    function stopAutoplay() {
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = null;
    }

    function startAutoplay() {
      stopAutoplay();
      if (!cfg.autoplay || reduced || count < 2 || autoplayPaused) return;
      autoTimer = window.setInterval(() => {
        if (!autoplayPaused) navigateBy(1);
      }, Math.max(cfg.autoplayDelay, 600));
    }

    function pauseAutoplay() {
      autoplayPaused = true;
      stopAutoplay();
    }

    function resumeAutoplay() {
      autoplayPaused = false;
      startAutoplay();
    }

    function onResize() {
      const w = root.clientWidth;
      const needed = cfg.cardWidth + Math.abs(cfg.spread) * 2 + 120;
      scale = clamp(w / needed, 0.4, 1);
      layout(pos);
    }

    cardRefs.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (suppressClick) return;
        const activeIdx = cfg.loop ? ((Math.round(pos) % count) + count) % count : clamp(Math.round(pos), 0, count - 1);
        if (activeIdx === index) {
          root.dispatchEvent(new CustomEvent("depthcarousel:open", { detail: { index, item: items[index] } }));
        }
      });
    });

    if (cfg.enableWheel) {
      root.addEventListener("wheel", (e) => {
        if (count < 2) return;
        e.preventDefault();
        if (tween) tween.kill();
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        const delta = e.deltaMode === 1 ? raw * 24 : raw;
        const step = clamp(delta / (cfg.cardWidth * 0.9), -0.6, 0.6);
        pos += step;
        layout(pos);
        if (wheelTimer) clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => setFocus(Math.round(pos), true), 130);
      }, { passive: false });
    }

    if (cfg.enableDrag) {
      root.addEventListener("pointerdown", (e) => {
        if (count < 2 || e.target.closest(".depth-carousel__dot")) return;
        if (tween) tween.kill();
        drag = {
          x: e.clientX,
          startPos: pos,
          lastX: e.clientX,
          lastT: performance.now(),
          v: 0,
          moved: false,
          id: e.pointerId
        };
      });

      root.addEventListener("pointermove", (e) => {
        if (!drag) return;
        const dx = e.clientX - drag.x;
        if (!drag.moved && Math.abs(dx) > 4) {
          drag.moved = true;
          root.setPointerCapture(drag.id);
        }
        if (!drag.moved) return;
        const stepPx = Math.max(cfg.cardWidth * 0.55 * scale, 40);
        const now = performance.now();
        const dt = Math.max(now - drag.lastT, 1);
        drag.v = (e.clientX - drag.lastX) / dt;
        drag.lastX = e.clientX;
        drag.lastT = now;
        pos = drag.startPos - dx / stepPx;
        layout(pos);
      });

      root.addEventListener("pointerup", () => {
        if (!drag) return;
        const d = drag;
        drag = null;
        if (!d.moved) return;
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        const stepPx = Math.max(cfg.cardWidth * 0.55 * scale, 40);
        const projected = pos - (d.v * 180) / stepPx;
        setFocus(Math.round(projected), true);
        startAutoplay();
      });

      root.addEventListener("pointercancel", () => { drag = null; });
    } else {
      root.style.touchAction = "auto";
    }

    root.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && document.activeElement === root) {
        root.dispatchEvent(new CustomEvent("depthcarousel:open", { detail: { index: focus, item: items[focus] } }));
      }
    });

    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    onResize();
    setFocus(0, false);
    startAutoplay();

    return {
      navigateBy,
      setFocus,
      getFocus: () => focus,
      pauseAutoplay,
      resumeAutoplay,
      destroy: () => {
        stopAutoplay();
        ro.disconnect();
      }
    };
  }

  function initReviewLightbox() {
    const box = document.createElement("div");
    box.className = "review-lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Testimonio ampliado");
    box.innerHTML = `
      <button type="button" class="review-lightbox__close" aria-label="Cerrar">×</button>
      <button type="button" class="review-lightbox__nav review-lightbox__nav--prev" aria-label="Anterior">←</button>
      <figure class="review-lightbox__frame"><img alt=""></figure>
      <button type="button" class="review-lightbox__nav review-lightbox__nav--next" aria-label="Siguiente">→</button>`;
    document.body.appendChild(box);

    const img = box.querySelector("img");
    const closeBtn = box.querySelector(".review-lightbox__close");
    const prevBtn = box.querySelector(".review-lightbox__nav--prev");
    const nextBtn = box.querySelector(".review-lightbox__nav--next");
    let index = 0;
    let carousel = null;

    function show(i) {
      index = (i + REVIEW_ITEMS.length) % REVIEW_ITEMS.length;
      const item = REVIEW_ITEMS[index];
      img.src = item.image;
      img.alt = item.alt;
      box.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
      carousel?.setFocus(index, true);
      carousel?.pauseAutoplay();
    }

    function hide() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      carousel?.resumeAutoplay();
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

    return {
      bind(root, api) {
        carousel = api;
        root.addEventListener("depthcarousel:open", (e) => show(e.detail.index));
      }
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector("[data-depth-carousel]");
    if (!root) return;
    const lightbox = initReviewLightbox();
    const api = initDepthCarousel(root, REVIEW_ITEMS, {
      depth: 220,
      spread: 90,
      tilt: 22,
      tiltDirection: "right",
      perspective: 1400,
      visibleCards: 4,
      falloff: 0.2,
      blur: 6,
      loop: true,
      cardWidth: 300,
      cardHeight: 380,
      radius: 18,
      tint: "#05060a",
      duration: 700,
      ease: "power3.out",
      showControls: false,
      showIndicators: true,
      autoplay: true,
      autoplayDelay: 9000,
      enableWheel: false,
      enableDrag: true
    });
    if (api) lightbox.bind(root, api);
  });
})(window);
