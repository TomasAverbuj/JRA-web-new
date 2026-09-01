(function () {
  const page = document.body.getAttribute("data-page") || "";

  function siteRoot() {
    const script = document.querySelector('script[src*="includes.js"]');
    if (!script) return "./";
    return script.src.replace(/assets\/js\/includes\.js(\?.*)?$/, "");
  }

  function partialCandidates(files) {
    const root = siteRoot();
    const list = Array.isArray(files) ? files : [files];
    const urls = [];
    list.forEach((file) => {
      urls.push(root + "partials/" + file);
      urls.push("partials/" + file);
      urls.push("./partials/" + file);
      urls.push("/partials/" + file);
    });
    return urls;
  }

  function loadPartialSync(files) {
    for (const url of partialCandidates(files)) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send(null);
        if (xhr.status === 200 || (xhr.status === 0 && xhr.responseText)) {
          return xhr.responseText;
        }
      } catch (err) { /* siguiente ruta */ }
    }
    return null;
  }

  async function loadPartial(files) {
    let lastError;
    for (const url of partialCandidates(files)) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.text();
      } catch (err) {
        lastError = err;
      }
    }
    const sync = loadPartialSync(files);
    if (sync) return sync;
    throw lastError || new Error("No se pudo cargar partial");
  }

  function setActive(root) {
    root.querySelectorAll("[data-nav]").forEach((el) => {
      if (el.getAttribute("data-nav") === page) el.classList.add("is-active");
    });
    if (["servicios", "diseno-web", "diseno-grafico", "consultoria", "fotografia", "mantenimiento", "google-ads"].includes(page)) {
      const btn = root.querySelector(".nav-drop > button");
      if (btn) btn.style.color = "#fff";
    }
  }

  function bindHeader(root) {
    const header = root.querySelector(".site-header");
    const nav = root.querySelector("#site-nav");
    const toggle = root.querySelector("[data-menu-toggle]");
    const closeBtn = root.querySelector("[data-menu-close]");
    const backdrop = root.querySelector("[data-nav-backdrop]");
    const drops = root.querySelectorAll(".nav-drop");

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
    if (backdrop) backdrop.addEventListener("click", closeMenu);

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
      if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    }, { passive: true });

    setActive(root);
  }

  function bindFooter(root) {
    root.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  async function inject(id, files, binder) {
    const mount = document.getElementById(id);
    if (!mount) return;
    let html = null;
    try {
      html = await loadPartial(files);
    } catch (err) {
      html = loadPartialSync(files);
      if (!html) console.error("[JRA includes]", files, err);
    }
    if (html) {
      mount.innerHTML = html;
      binder(mount);
    }
  }

  inject("site-header", ["navbar.html", "header.html"], bindHeader);
  inject("site-footer", ["footer.html"], bindFooter);
})();
