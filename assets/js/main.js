(function () {
  const pageNode = document.querySelector("[data-page]");
  const page = pageNode ? pageNode.getAttribute("data-page") || "" : "";
  const nav = document.querySelector("#site-nav");
  const toggle = document.querySelector("[data-menu-toggle]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const drops = document.querySelectorAll(".nav-drop");

  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.getAttribute("data-nav") === page) el.classList.add("is-active");
  });
  if (["servicios", "diseno-web", "diseno-grafico", "consultoria", "fotografia", "mantenimiento", "google-ads"].includes(page)) {
    const btn = document.querySelector(".nav-drop > button");
    if (btn) btn.style.color = "#fff";
  }

  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("is-open");
    document.body.classList.remove("nav-open");
    if (toggle) {
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
    }
    if (backdrop) {
      backdrop.classList.remove("is-visible");
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function openMenu() {
    if (!nav) return;
    nav.classList.add("is-open");
    document.body.classList.add("nav-open");
    if (toggle) {
      toggle.classList.add("is-active");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Cerrar menú");
    }
    if (backdrop) {
      backdrop.classList.add("is-visible");
      backdrop.setAttribute("aria-hidden", "false");
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) closeMenu();
      else openMenu();
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  function closeMenuFromOutside(e) {
    if (!document.body.classList.contains("nav-open")) return;
    if (nav && e && e.target && nav.contains(e.target)) return;
    closeMenu();
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
    backdrop.addEventListener("wheel", closeMenu, { passive: true });
    backdrop.addEventListener("touchstart", closeMenu, { passive: true });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  drops.forEach((drop) => {
    const btn = drop.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      if (window.matchMedia("(max-width: 1100px)").matches) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = drop.classList.contains("open");
        drops.forEach((d) => d.classList.remove("open"));
        if (!isOpen) drop.classList.add("open");
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        return;
      }
      const open = btn.getAttribute("aria-expanded") === "true";
      drops.forEach((d) => {
        const b = d.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      btn.setAttribute("aria-expanded", open ? "false" : "true");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1100) closeMenu();
  }, { passive: true });

  window.addEventListener("scroll", () => {
    if (document.body.classList.contains("nav-open")) closeMenu();
  }, { passive: true });
  window.addEventListener("wheel", closeMenuFromOutside, { passive: true });
})();

(function () {
  const catTabs = document.querySelectorAll("[data-price-cat]");
  const catPanels = document.querySelectorAll("[data-price-cat-panel]");
  catTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-price-cat");
      catTabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      catPanels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-price-cat-panel") === target));
      document.dispatchEvent(new CustomEvent("jra:prices-change"));
    });
  });

  const catFromHash = (location.hash || "").replace("#", "");
  const hashTab = catFromHash ? document.querySelector('[data-price-cat="' + catFromHash + '"]') : null;
  if (hashTab) hashTab.click();

  const tabs = document.querySelectorAll("[data-price-tab]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-price-tab");
      const scope = tab.closest("[data-price-cat-panel]") || document;
      scope.querySelectorAll("[data-price-tab]").forEach((t) => t.classList.toggle("is-active", t === tab));
      scope.querySelectorAll("[data-price-panel]").forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-price-panel") === target));
      document.dispatchEvent(new CustomEvent("jra:prices-change"));
    });
  });

  document.querySelectorAll("form[data-jra-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const labels = {
        nombre: "Nombre",
        negocio: "Negocio",
        email: "Email",
        propietario: "Propietario",
        telefono: "Teléfono",
        industria: "Industria",
        presupuesto: "Presupuesto",
        necesidad: "Necesidad",
        cita: "Cita presencial",
        comentarios: "Comentarios",
        mensaje: "Mensaje"
      };
      const lines = ["Hola JRA, quiero solicitar un servicio.", ""];
      data.forEach((value, key) => {
        const text = String(value || "").trim();
        if (!text) return;
        lines.push((labels[key] || key) + ": " + text);
      });
      const box = form.querySelector(".form-success");
      form.querySelectorAll("input, textarea, select, button").forEach((el) => {
        if (el.type !== "hidden") el.disabled = true;
      });
      if (box) {
        box.style.display = "block";
        box.textContent = "Recibimos tu mensaje. Te contactamos en horario laboral (Lun–Vie, 9:00 AM – 5:00 PM).";
      }
      const wa = "https://wa.me/17873202552?text=" + encodeURIComponent(lines.filter(Boolean).join("\n"));
      setTimeout(() => { window.location.href = wa; }, 900);
    });
  });

  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.animationDelay = entry.target.dataset.delay || "0s";
            entry.target.classList.add("reveal");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 })
    : null;
  document.querySelectorAll("[data-animate]").forEach((el, i) => {
    el.dataset.delay = (i % 6) * 0.06 + "s";
    if (io) io.observe(el);
    else el.classList.add("reveal");
  });

  const filters = document.querySelectorAll("[data-filter]");
  const cards = document.querySelectorAll(".project-card");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-filter");
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      cards.forEach((card) => {
        const show = target === "all" || card.getAttribute("data-cat") === target;
        card.classList.toggle("is-hidden", !show);
      });
      document.dispatchEvent(new CustomEvent("jra:projects-filter"));
    });
  });

  (function initBoardMobileSliders() {
    const boards = Array.from(
      document.querySelectorAll(".project-board, .piece-board, .price-grid")
    );
    if (!boards.length) return;

    const ARROW = {
      prev: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      next: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    boards.forEach((board) => {
      if (board.closest(".projects-carousel")) return;

      const isPieces = board.classList.contains("piece-board");
      const isPrices = board.classList.contains("price-grid");
      const cardSel = isPieces ? ".piece-card" : isPrices ? ".price-card" : ".project-card";
      if (isPrices && board.querySelectorAll(cardSel).length < 2) return;

      const label = isPieces ? "Galería" : isPrices ? "Paquetes y precios" : "Proyectos web";
      const itemWord = isPieces ? "Imagen" : isPrices ? "Plan" : "Proyecto";

      const wrap = document.createElement("div");
      wrap.className = "projects-carousel" + (isPrices ? " projects-carousel--prices" : "");
      wrap.setAttribute("aria-roledescription", "carousel");
      wrap.setAttribute("aria-label", label);
      board.parentNode.insertBefore(wrap, board);
      wrap.appendChild(board);

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.className = "projects-carousel__arrow projects-carousel__arrow--prev";
      prevBtn.setAttribute("aria-label", itemWord + " anterior");
      prevBtn.innerHTML = ARROW.prev;

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.className = "projects-carousel__arrow projects-carousel__arrow--next";
      nextBtn.setAttribute("aria-label", "Siguiente " + itemWord.toLowerCase());
      nextBtn.innerHTML = ARROW.next;

      const dotsWrap = document.createElement("div");
      dotsWrap.className = "projects-carousel__dots";
      dotsWrap.setAttribute("role", "tablist");
      dotsWrap.setAttribute("aria-label", "Ir a " + itemWord.toLowerCase());

      wrap.append(prevBtn, nextBtn, dotsWrap);

      let index = 0;
      let dots = [];

      function visibleCards() {
        return Array.from(board.querySelectorAll(cardSel)).filter(
          (card) => !card.classList.contains("is-hidden")
        );
      }

      function rebuildDots() {
        const items = visibleCards();
        dotsWrap.innerHTML = "";
        dots = items.map((_, i) => {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "projects-carousel__dot";
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", itemWord + " " + (i + 1));
          dot.addEventListener("click", () => goTo(i));
          dotsWrap.appendChild(dot);
          return dot;
        });
        if (index > items.length - 1) index = Math.max(0, items.length - 1);
        updateUI();
      }

      function goTo(i, smooth) {
        const items = visibleCards();
        if (!items.length) return;
        index = Math.max(0, Math.min(i, items.length - 1));
        const target = items[index];
        const left = target.offsetLeft - (board.clientWidth - target.clientWidth) / 2;
        board.scrollTo({ left: Math.max(0, left), behavior: smooth === false ? "auto" : "smooth" });
        updateUI();
      }

      function updateUI() {
        const items = visibleCards();
        prevBtn.disabled = index <= 0;
        nextBtn.disabled = index >= items.length - 1 || items.length <= 1;
        dots.forEach((dot, i) => {
          const active = i === index;
          dot.classList.toggle("is-active", active);
          dot.setAttribute("aria-selected", active ? "true" : "false");
        });
      }

      function syncFromScroll() {
        const items = visibleCards();
        if (!items.length) return;
        const mid = board.scrollLeft + board.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        items.forEach((card, i) => {
          const center = card.offsetLeft + card.clientWidth / 2;
          const dist = Math.abs(center - mid);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        if (best !== index) {
          index = best;
          updateUI();
        }
      }

      prevBtn.addEventListener("click", () => goTo(index - 1));
      nextBtn.addEventListener("click", () => goTo(index + 1));
      board.addEventListener("scroll", () => {
        window.requestAnimationFrame(syncFromScroll);
      }, { passive: true });

      if (!isPieces && !isPrices) {
        document.addEventListener("jra:projects-filter", () => {
          index = 0;
          rebuildDots();
          goTo(0, false);
        });
      }

      if (isPrices) {
        document.addEventListener("jra:prices-change", () => {
          index = 0;
          window.requestAnimationFrame(() => {
            rebuildDots();
            goTo(0, false);
          });
        });
      }

      window.addEventListener("resize", () => {
        goTo(index, false);
      }, { passive: true });

      rebuildDots();
      goTo(0, false);
    });
  })();

  (function initGalleryLightbox() {
    const triggers = Array.from(document.querySelectorAll("[data-gallery-src]"));
    if (!triggers.length) return;

    const lb = document.createElement("div");
    lb.className = "gallery-lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Vista ampliada");
    lb.innerHTML =
      '<button type="button" class="gallery-lightbox__close" aria-label="Cerrar">×</button>' +
      '<button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--prev" aria-label="Anterior">←</button>' +
      '<button type="button" class="gallery-lightbox__nav gallery-lightbox__nav--next" aria-label="Siguiente">→</button>' +
      '<figure class="gallery-lightbox__frame"><img alt=""><figcaption></figcaption></figure>';
    document.body.appendChild(lb);

    const img = lb.querySelector("img");
    const caption = lb.querySelector("figcaption");
    const closeBtn = lb.querySelector(".gallery-lightbox__close");
    let index = 0;

    function show(i) {
      index = (i + triggers.length) % triggers.length;
      const el = triggers[index];
      const src = el.getAttribute("data-gallery-src");
      const title =
        el.getAttribute("data-gallery-title") ||
        el.querySelector(".piece-label, .piece-quote")?.textContent?.trim() ||
        "";
      const alt = el.querySelector("img")?.alt || title;
      img.src = src;
      img.alt = alt;
      caption.textContent = title;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function hide() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      img.removeAttribute("src");
    }

    triggers.forEach((el, i) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        show(i);
      });
    });
    closeBtn.addEventListener("click", hide);
    lb.querySelector(".gallery-lightbox__nav--prev").addEventListener("click", () => show(index - 1));
    lb.querySelector(".gallery-lightbox__nav--next").addEventListener("click", () => show(index + 1));
    lb.addEventListener("click", (e) => {
      if (e.target === lb) hide();
    });
    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  })();

  const list = Array.from(document.querySelectorAll(".project-card")).filter(
    (el) => el.tagName !== "A" && el.getAttribute("data-src")
  );
  const panes = document.querySelectorAll(".hero-pane");
  if (list.length || panes.length) {
    const viewer = document.createElement("div");
    viewer.className = "project-viewer";
    viewer.setAttribute("role", "dialog");
    viewer.setAttribute("aria-modal", "true");
    viewer.setAttribute("aria-label", "Presentación de proyecto");
    viewer.innerHTML = `
      <div class="project-viewer-frame">
        <div class="project-viewer-top">
          <small>Así presentamos tu web</small>
          <button type="button" class="project-viewer-close" aria-label="Cerrar">×</button>
        </div>
        <div class="project-viewer-stage"><img alt=""></div>
        <div class="project-viewer-bar">
          <div>
            <small class="project-tag" data-viewer-tag></small>
            <h3 data-viewer-title></h3>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <div class="project-viewer-nav">
              <button type="button" data-viewer-prev aria-label="Anterior">←</button>
              <button type="button" data-viewer-next aria-label="Siguiente">→</button>
            </div>
            <a class="btn btn-primary" href="/cotizar.html">Quiero una web así</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(viewer);

    const img = viewer.querySelector("img");
    const titleEl = viewer.querySelector("[data-viewer-title]");
    const tagEl = viewer.querySelector("[data-viewer-tag]");
    const closeBtn = viewer.querySelector(".project-viewer-close");
    let index = 0;
    const cycle = list.length ? list : Array.from(panes);

    function show(i) {
      index = (i + cycle.length) % cycle.length;
      const el = cycle[index];
      const src = el.getAttribute("data-src");
      const title = el.getAttribute("data-title") || "";
      const tag = el.getAttribute("data-tag") || "";
      img.src = src;
      img.alt = title;
      titleEl.textContent = title;
      tagEl.textContent = tag;
      viewer.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    }

    function hide() {
      viewer.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    function openFrom(el) {
      const title = el.getAttribute("data-title");
      const i = cycle.findIndex((c) => c.getAttribute("data-title") === title);
      show(i >= 0 ? i : 0);
    }

    list.forEach((el, i) => el.addEventListener("click", () => show(i)));
    panes.forEach((pane) => pane.addEventListener("click", () => openFrom(pane)));
    closeBtn.addEventListener("click", hide);
    viewer.addEventListener("click", (e) => { if (e.target === viewer) hide(); });
    viewer.querySelector("[data-viewer-prev]").addEventListener("click", () => show(index - 1));
    viewer.querySelector("[data-viewer-next]").addEventListener("click", () => show(index + 1));
    document.addEventListener("keydown", (e) => {
      if (!viewer.classList.contains("is-open")) return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
  }
})();
