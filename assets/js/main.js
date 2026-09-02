(function () {
  const catTabs = document.querySelectorAll("[data-price-cat]");
  const catPanels = document.querySelectorAll("[data-price-cat-panel]");
  catTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-price-cat");
      catTabs.forEach((t) => t.classList.toggle("is-active", t === tab));
      catPanels.forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-price-cat-panel") === target));
    });
  });

  const tabs = document.querySelectorAll("[data-price-tab]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-price-tab");
      const scope = tab.closest("[data-price-cat-panel]") || document;
      scope.querySelectorAll("[data-price-tab]").forEach((t) => t.classList.toggle("is-active", t === tab));
      scope.querySelectorAll("[data-price-panel]").forEach((p) => p.classList.toggle("is-active", p.getAttribute("data-price-panel") === target));
    });
  });

  document.querySelectorAll("form[data-jra-form]").forEach((form) => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const lines = [
        "Hola JRA, quiero solicitar un presupuesto.",
        "",
        "Negocio: " + (data.get("negocio") || ""),
        "Email: " + (data.get("email") || ""),
        "Propietario: " + (data.get("propietario") || ""),
        "Teléfono: " + (data.get("telefono") || ""),
        "Industria: " + (data.get("industria") || ""),
        "Presupuesto: " + (data.get("presupuesto") || ""),
        "Necesidad: " + (data.get("necesidad") || ""),
        "Cita presencial: " + (data.get("cita") || ""),
        "Comentarios: " + (data.get("comentarios") || "")
      ];
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
    });
  });

  const list = Array.from(document.querySelectorAll(".project-card"));
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
            <a class="btn btn-primary" href="cotizar.html">Quiero una web así</a>
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
