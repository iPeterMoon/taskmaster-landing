/**
 * TaskMaster — main.js
 * Handles: mobile nav, scroll effects, fade-in animations,
 * hero phone mockup interactivity, contact/waitlist form,
 * 404 auto-tracking, waitlist form (404 page).
 */

(function () {
  "use strict";

  /* ─── Config ──────────────────────────────────────────────── */

  // Pega aquí la URL de tu Google Apps Script Web App después de desplegarla
  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyTHW0F43QsR9t_576YXi4UC8lqNV0sFLTS-DluoXK2JG6Q7I5q6DJMILKQT-Y4n37u/exec";

  /* ─── API helper ──────────────────────────────────────────── */

  function postToScript(payload) {
    if (APPS_SCRIPT_URL.startsWith("REEMPLAZA")) return Promise.resolve(); // dev mode
    return fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      // no-cors because Apps Script doesn't return CORS headers on redirects
      mode: "no-cors",
    }).catch(() => {}); // silently ignore network errors
  }

  /* ─── Helpers ─────────────────────────────────────────────── */

  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /* ─── Year in footer ──────────────────────────────────────── */

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ─── Navbar scroll effect ────────────────────────────────── */

  const navbar = $("#navbar");
  if (navbar) {
    const onScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add(
          "bg-slate-900/90",
          "backdrop-blur-md",
          "border-b",
          "border-slate-800/60",
          "shadow-xl"
        );
      } else {
        navbar.classList.remove(
          "bg-slate-900/90",
          "backdrop-blur-md",
          "border-b",
          "border-slate-800/60",
          "shadow-xl"
        );
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ─── Mobile menu (hamburger) ─────────────────────────────── */

  const menuBtn = $("#menu-btn");
  const mobileMenu = $("#mobile-menu");
  const hamburgerLines = $$(".hamburger-line");

  if (menuBtn && mobileMenu) {
    let isOpen = false;

    const openMenu = () => {
      isOpen = true;
      mobileMenu.classList.add("open");
      menuBtn.setAttribute("aria-expanded", "true");
      // Animate to X
      if (hamburgerLines[0]) hamburgerLines[0].style.transform = "rotate(45deg) translate(4px, 4px)";
      if (hamburgerLines[1]) hamburgerLines[1].style.opacity = "0";
      if (hamburgerLines[2]) hamburgerLines[2].style.transform = "rotate(-45deg) translate(4px, -4px)";
    };

    const closeMenu = () => {
      isOpen = false;
      mobileMenu.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      // Reset to hamburger
      if (hamburgerLines[0]) hamburgerLines[0].style.transform = "";
      if (hamburgerLines[1]) hamburgerLines[1].style.opacity = "";
      if (hamburgerLines[2]) hamburgerLines[2].style.transform = "";
    };

    menuBtn.addEventListener("click", () => (isOpen ? closeMenu() : openMenu()));

    // Close menu on mobile link click
    $$(".mobile-nav-link").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // Close menu on outside click
    document.addEventListener("click", (e) => {
      if (isOpen && !menuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMenu();
      }
    });
  }

  /* ─── Scroll-triggered fade-in animations ────────────────── */

  const fadeEls = $$(".fade-in");

  if (fadeEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    fadeEls.forEach((el, i) => {
      el.style.transitionDelay = `${(i % 4) * 80}ms`;
      observer.observe(el);
    });
  } else {
    // Fallback: show all without animation
    fadeEls.forEach((el) => el.classList.add("visible"));
  }

  /* ─── Hero phone mockup: task interactivity ──────────────── */

  const heroTasks = $$(".hero-task");
  const heroProgressBar = $("#hero-progress-bar");
  const heroProgressText = $("#hero-progress-text");
  const heroGuardianBadge = $("#hero-guardian-badge");
  const heroGuardianText = $("#hero-guardian-text");
  const heroLockIcon = $("#hero-lock-icon");
  const heroAppsSection = $("#hero-apps-section");
  const appIcons = heroAppsSection ? $$(".app-icon-locked", heroAppsSection) : [];

  let doneTasks = 0;
  const totalTasks = heroTasks.length;

  const UNLOCK_SVG_PATH = `<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>`;
  const LOCK_SVG_PATH = `<path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>`;

  const updateHeroState = () => {
    const pct = totalTasks > 0 ? (doneTasks / totalTasks) * 100 : 0;
    const allDone = doneTasks === totalTasks && totalTasks > 0;

    if (heroProgressBar) heroProgressBar.style.width = pct + "%";
    if (heroProgressText) heroProgressText.textContent = `${doneTasks} / ${totalTasks}`;

    // Unlock apps using data-unlock-at threshold
    appIcons.forEach((icon) => {
      const threshold = parseInt(icon.dataset.unlockAt, 10);
      if (doneTasks >= threshold) {
        icon.style.filter = "none";
        icon.style.opacity = "1";
      } else {
        icon.style.filter = "grayscale(1) brightness(0.4)";
        icon.style.opacity = "0.6";
      }
    });

    // Guardian badge
    if (heroGuardianBadge && heroGuardianText && heroLockIcon) {
      if (allDone) {
        heroGuardianBadge.className = "unlock-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full";
        heroGuardianText.textContent = "¡Todo desbloqueado!";
        heroGuardianText.className = "text-xs font-medium text-emerald-400";
        heroLockIcon.setAttribute("fill", "none");
        heroLockIcon.setAttribute("stroke", "currentColor");
        heroLockIcon.setAttribute("stroke-width", "2");
        heroLockIcon.className = "w-3 h-3 text-emerald-400";
        heroLockIcon.innerHTML = UNLOCK_SVG_PATH;
      } else {
        heroGuardianBadge.className = "lock-badge flex items-center gap-1.5 px-2.5 py-1 rounded-full";
        heroGuardianText.textContent = "Guardián activo";
        heroGuardianText.className = "text-xs font-medium text-rose-400";
        heroLockIcon.setAttribute("fill", "currentColor");
        heroLockIcon.removeAttribute("stroke");
        heroLockIcon.removeAttribute("stroke-width");
        heroLockIcon.className = "w-3 h-3 text-rose-400";
        heroLockIcon.innerHTML = LOCK_SVG_PATH;
      }
    }
  };

  heroTasks.forEach((task) => {
    task.addEventListener("click", () => {
      const isDone = task.dataset.done === "true";
      const check = task.querySelector(".task-check");
      const label = task.querySelector(".task-label");
      const CHECK_SVG = `<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`;

      if (!isDone) {
        task.dataset.done = "true";
        doneTasks = Math.min(doneTasks + 1, totalTasks);
        if (check) { check.classList.add("done"); check.innerHTML = CHECK_SVG; }
        if (label) { label.style.textDecoration = "line-through"; label.style.color = "#64748b"; }
        task.style.opacity = "0.55";
        task.style.borderColor = "rgba(99,102,241,0.15)";
      } else {
        task.dataset.done = "false";
        doneTasks = Math.max(doneTasks - 1, 0);
        if (check) { check.classList.remove("done"); check.innerHTML = ""; }
        if (label) { label.style.textDecoration = ""; label.style.color = ""; }
        task.style.opacity = "";
        task.style.borderColor = "";
      }
      updateHeroState();
    });
  });

  /* ─── Download button click tracking (404 experiment) ────── */

  $$(".download-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const platform = btn.dataset.platform || "unknown";
      // Log intent to console (replace with your analytics call)
      console.info(`[TaskMaster] Download intent tracked: ${platform}`);
      // Example: window._analytics?.track('download_click', { platform });
    });
  });

  /* ─── Contact / waitlist form (index.html) ───────────────── */

  const contactForm = $("#contact-form");

  if (contactForm) {
    const nombreEl = $("#nombre");
    const emailEl  = $("#email");
    const btnText  = $("#btn-send-text");
    const btnIcon  = $("#btn-send-icon");
    const successEl = $("#form-success");
    const submitBtn = contactForm.querySelector("button[type=submit]");
    const countEl  = $("#contact-waitlist-count");

    // Sync counter with localStorage
    let signupCount = parseInt(localStorage.getItem("ff_waitlist_count") || "340", 10);
    if (countEl) countEl.textContent = `+${signupCount} personas`;

    const getErrorEl = (input) => input?.nextElementSibling;

    const showError = (input, msg) => {
      const err = getErrorEl(input);
      if (!err) return;
      err.textContent = msg;
      err.classList.remove("hidden");
      input.classList.add("border-rose-500");
      input.classList.remove("border-slate-700");
    };

    const clearError = (input) => {
      const err = getErrorEl(input);
      if (!err) return;
      err.textContent = "";
      err.classList.add("hidden");
      input.classList.remove("border-rose-500");
      input.classList.add("border-slate-700");
    };

    [nombreEl, emailEl].forEach((el) => {
      if (!el) return;
      el.addEventListener("blur", () => {
        if (el === emailEl && !isValidEmail(el.value)) showError(el, "Ingresa un correo válido.");
        else if (el === nombreEl && el.value.trim().length < 2) showError(el, "Ingresa tu nombre.");
        else clearError(el);
      });
      el.addEventListener("input", () => {
        if (el.classList.contains("border-rose-500")) clearError(el);
      });
    });

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;

      if (!nombreEl || nombreEl.value.trim().length < 2) {
        showError(nombreEl, "Por favor ingresa tu nombre.");
        valid = false;
      } else { clearError(nombreEl); }

      if (!emailEl || !isValidEmail(emailEl.value)) {
        showError(emailEl, "Ingresa un correo electrónico válido.");
        valid = false;
      } else { clearError(emailEl); }

      if (!valid) return;

      submitBtn.disabled = true;
      if (btnText) btnText.textContent = "Guardando…";

      const email = emailEl?.value?.trim() || "";
      const name  = nombreEl?.value?.trim() || "";
      const distraction = ($("#mensaje")?.value || "").trim();

      postToScript({
        type: "waitlist",
        name,
        email,
        distraction,
        source: "index",
        timestamp: new Date().toISOString(),
      }).then(() => {
        signupCount += 1;
        localStorage.setItem("ff_waitlist_count", String(signupCount));
        if (countEl) countEl.textContent = `+${signupCount} personas`;

        contactForm.reset();
        submitBtn.disabled = false;
        if (btnText) btnText.textContent = "Apuntarme a la lista";
        if (successEl) {
          successEl.classList.remove("hidden");
          setTimeout(() => successEl.classList.add("hidden"), 6000);
        }
      });
    });
  }

  /* ─── Waitlist form (404.html) ────────────────────────────── */

  const waitlistForm = $("#waitlist-form");

  if (waitlistForm) {
    const emailInput = $("#waitlist-email");
    const errorEl    = $("#waitlist-error");
    const successEl  = $("#waitlist-success");
    const btnText    = $("#waitlist-btn-text");
    const countEl    = $("#waitlist-count");
    const btn        = $("#waitlist-btn");

    // Retrieve stored count from localStorage for demo persistence
    let signupCount = parseInt(localStorage.getItem("ff_waitlist_count") || "340", 10);
    if (countEl) countEl.textContent = `+${signupCount} personas`;

    waitlistForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = emailInput ? emailInput.value.trim() : "";

      // Clear previous errors
      if (errorEl) { errorEl.textContent = ""; errorEl.classList.add("hidden"); }

      if (!isValidEmail(email)) {
        if (errorEl) {
          errorEl.textContent = "Por favor ingresa un correo electrónico válido.";
          errorEl.classList.remove("hidden");
        }
        if (emailInput) emailInput.focus();
        return;
      }

      if (btn) btn.disabled = true;
      if (btnText) btnText.textContent = "Guardando…";

      postToScript({
        type: "waitlist",
        name: "",
        email,
        distraction: ($("#waitlist-distraction")?.value || "").trim(),
        comments:    ($("#waitlist-comments")?.value    || "").trim(),
        source: "404",
        timestamp: new Date().toISOString(),
      }).then(() => {
        signupCount += 1;
        localStorage.setItem("ff_waitlist_count", String(signupCount));
        if (countEl) countEl.textContent = `+${signupCount} personas`;

        if (successEl) successEl.classList.remove("hidden");
        if (waitlistForm) waitlistForm.classList.add("hidden");
      });
    });

    // Clear error on input
    if (emailInput) {
      emailInput.addEventListener("input", () => {
        if (errorEl) { errorEl.textContent = ""; errorEl.classList.add("hidden"); }
      });
    }
  }

  /* ─── Auto-track 404 hits ─────────────────────────────────── */
  // Runs only on 404.html (detects by page title or body class)

  if (document.title.includes("404") || document.body.dataset.page === "404") {
    postToScript({
      type: "404",
      url: window.location.href,
      referrer: document.referrer || "(directo)",
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

})();
