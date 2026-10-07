// Hide portrait when tab is inactive (avoid grayscale browser thumbnail).
const portraitImg = document.querySelector(".about-portrait img");
if (portraitImg) {
    document.addEventListener("visibilitychange", () => {
        portraitImg.style.display = document.hidden ? "none" : "";
    });
}

const header = document.querySelector(".site-header");
const root = document.documentElement;
const navLinks = Array.from(document.querySelectorAll(".nav-link[data-scroll]"));
const scrollTriggers = Array.from(document.querySelectorAll("[data-scroll]"));
const sections = navLinks
    .map((link) => document.getElementById(link.dataset.scroll))
    .filter(Boolean);
const decode = (codes) => String.fromCharCode(...codes);
const emailProtocol = decode([109, 97, 105, 108, 116, 111, 58]);
const emailLocalPart = decode([119, 97, 110, 103, 122, 104, 111, 110, 103]);
const emailDomainPart = [decode([48, 120, 103, 97, 114, 102, 105, 101, 108, 100]), decode([99, 111, 109])].join(".");
const contactEmail = `${emailLocalPart}@${emailDomainPart}`;

function scrollToSection(id) {
    const section = document.getElementById(id);
    if (!section) return;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}

scrollTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
        event.preventDefault();
        scrollToSection(trigger.dataset.scroll);
    });
});

function setActiveNav(id) {
    navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.dataset.scroll === id);
    });
}

function updateScrollState() {
    if (header) {
        header.classList.toggle("is-scrolled", window.scrollY > 20);
    }

    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
    root.style.setProperty("--scroll-progress", scrollProgress.toFixed(4));

    const checkpoint = window.scrollY + 220;
    let currentId = sections[0]?.id;

    sections.forEach((section) => {
        if (checkpoint >= section.offsetTop) {
            currentId = section.id;
        }
    });

    if (currentId) {
        setActiveNav(currentId);
    }
}

window.addEventListener("scroll", updateScrollState, { passive: true });
updateScrollState();

// Content is visible by default; the only entrance motion is the hero settle in CSS.

// Cursor notes: a quiet echo around the pointer on hover-capable devices.
// At most two on screen, none while a modal is open or the pointer is on a control.
const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (hoverCapable && !reducedMotion) {
    const noteLayer = document.createElement("div");
    const noteSymbols = ["\u266a", "\u266b", "\u2669"];
    let lastNoteAt = 0;

    noteLayer.className = "cursor-note-layer";
    noteLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(noteLayer);

    const onControl = (el) => !!(el && el.closest && el.closest("a, button, input, textarea, select, [role='dialog']"));

    const spawnNote = (x, y) => {
        if (document.hidden || document.body.classList.contains("has-modal")) return;
        if (noteLayer.childElementCount >= 2) return;
        const note = document.createElement("span");
        note.className = "cursor-note";
        note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        note.style.left = `${x + (Math.random() * 2 - 1) * 10}px`;
        note.style.top = `${y - 8}px`;
        note.style.setProperty("--note-dx", `${((Math.random() * 2 - 1) * 10).toFixed(1)}px`);
        note.style.setProperty("--note-dy", `${(-16 - Math.random() * 12).toFixed(1)}px`);
        note.style.setProperty("--note-duration", `${(1000 + Math.random() * 400).toFixed(0)}ms`);
        note.style.setProperty("--note-scale", `${(0.9 + Math.random() * 0.2).toFixed(2)}`);
        noteLayer.appendChild(note);
        window.setTimeout(() => note.remove(), 1500);
    };

    document.addEventListener("pointermove", (event) => {
        const now = performance.now();
        if (now - lastNoteAt < 900 || Math.random() > 0.12) return;
        if (onControl(event.target)) return;
        lastNoteAt = now;
        spawnNote(event.clientX, event.clientY);
    }, { passive: true });

    const clearNotes = () => { noteLayer.textContent = ""; };
    document.documentElement.addEventListener("mouseleave", clearNotes);
    window.addEventListener("blur", clearNotes);
}

// Email link / copy-email handlers (functional).
function trackEmailInteraction(action, context) {
    const payload = {
        action,
        context,
        channel: "email",
        email_domain: emailDomainPart
    };

    if (typeof window.plausible === "function") {
        window.plausible("contact_email", { props: payload });
    }

    if (typeof window.gtag === "function") {
        window.gtag("event", "contact_email", payload);
    }

    if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
            event: "contact_email",
            ...payload
        });
    }
}

function copyText(value) {
    if (navigator.clipboard?.writeText) {
        return navigator.clipboard.writeText(value);
    }

    return new Promise((resolve, reject) => {
        const input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "absolute";
        input.style.left = "-9999px";
        document.body.appendChild(input);
        input.select();

        try {
            document.execCommand("copy");
            document.body.removeChild(input);
            resolve();
        } catch (error) {
            document.body.removeChild(input);
            reject(error);
        }
    });
}

document.querySelectorAll("[data-email-link]").forEach((link) => {
    const mode = link.dataset.emailMode || "cta";
    const context = link.dataset.emailContext || "unknown";

    link.href = "#contact-email";
    link.setAttribute(
        "aria-label",
        mode === "address" ? `Email ${contactEmail}` : `${link.textContent.trim()} (${contactEmail})`
    );

    if (mode === "address") {
        link.textContent = contactEmail;
    }

    link.addEventListener("click", (event) => {
        event.preventDefault();
        trackEmailInteraction("click", context);
        window.location.href = `${emailProtocol}${contactEmail}`;
    });
});

document.querySelectorAll("[data-copy-email]").forEach((button) => {
    const defaultLabel = button.dataset.copyLabel || button.textContent.trim();
    const copiedLabel = button.dataset.copiedLabel || defaultLabel;
    const context = button.dataset.emailContext || "unknown";

    button.addEventListener("click", async () => {
        try {
            await copyText(contactEmail);
            trackEmailInteraction("copy", context);
            button.textContent = copiedLabel;
            window.setTimeout(() => {
                button.textContent = defaultLabel;
            }, 1800);
        } catch (error) {
            button.textContent = defaultLabel;
        }
    });
});

// Click-to-reveal media embed (e.g. PILO interactive 3D viewer).
// Opens as a full-viewport modal so the 3D model has real room to move.
document.querySelectorAll("[data-embed-figure]").forEach((figure) => {
    const trigger = figure.querySelector("[data-embed-trigger]");
    const src = figure.getAttribute("data-embed-src");
    const title = figure.getAttribute("data-embed-title") || "Embedded viewer";
    if (!trigger || !src) return;

    let modal = null;

    const isZh = (document.documentElement.lang || "").toLowerCase().startsWith("zh");
    let inerted = [];

    const escHandler = (e) => {
        if (e.key === "Escape") { close(); return; }
        if (e.key === "Tab" && modal) {
            const focusables = modal.querySelectorAll("button, iframe, [tabindex]:not([tabindex='-1'])");
            if (!focusables.length) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            else if (!modal.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        }
    };

    const close = () => {
        if (!modal) return;
        document.removeEventListener("keydown", escHandler);
        document.body.style.overflow = "";
        document.body.classList.remove("has-modal");
        inerted.forEach((el) => el.removeAttribute("inert"));
        inerted = [];
        modal.remove();
        modal = null;
        trigger.setAttribute("aria-pressed", "false");
        try { trigger.focus({ preventScroll: true }); } catch (_) {}
    };

    const open = () => {
        if (modal) return;
        modal = document.createElement("div");
        modal.className = "media-embed-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-label", title);

        const stage = document.createElement("div");
        stage.className = "media-embed-modal-stage";

        const iframe = document.createElement("iframe");
        iframe.className = "media-embed-frame";
        iframe.src = src;
        iframe.title = title;
        iframe.loading = "lazy";
        iframe.setAttribute("allow", "fullscreen; accelerometer; gyroscope");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        stage.appendChild(iframe);

        const closeBtn = document.createElement("button");
        closeBtn.type = "button";
        closeBtn.className = "media-embed-modal-close";
        closeBtn.setAttribute("aria-label", isZh ? "关闭 3D 预览" : "Close 3D viewer");
        closeBtn.textContent = "\u00d7";
        closeBtn.addEventListener("click", close);

        modal.appendChild(stage);
        modal.appendChild(closeBtn);
        modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

        inerted = Array.from(document.body.children).filter((el) => el !== modal && el.tagName !== "SCRIPT");
        inerted.forEach((el) => el.setAttribute("inert", ""));
        document.body.appendChild(modal);
        document.body.classList.add("has-modal");
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", escHandler);
        trigger.setAttribute("aria-pressed", "true");
        setTimeout(() => { try { closeBtn.focus({ preventScroll: true }); } catch (_) {} }, 30);
    };

    trigger.setAttribute("aria-pressed", "false");
    trigger.addEventListener("click", open);
});

// Apply pending CMS edits from localStorage (instant, no build wait).
(function () {
    var lang = document.documentElement.lang === "zh-Hans" ? "zh" : "en";
    var raw = localStorage.getItem("cms_pending_" + lang);
    if (!raw) return;
    try {
        var changes = JSON.parse(raw);
        var applied = 0;
        document.querySelectorAll("[data-editable]").forEach(function (el) {
            var key = el.dataset.editable;
            if (key in changes && el.textContent.trim() !== changes[key]) {
                el.textContent = changes[key];
                applied++;
            }
        });
        if (applied === 0) localStorage.removeItem("cms_pending_" + lang);
    } catch (e) { localStorage.removeItem("cms_pending_" + lang); }
})();

// Secret admin activation: 5 clicks on brand area within 5 seconds.
(function () {
    const brand = document.querySelector(".brand");
    if (!brand) return;
    const CLICKS = 5;
    const WINDOW = 5000;
    let clicks = [];
    let loaded = false;

    brand.addEventListener("click", (e) => {
        if (loaded) return;
        const now = Date.now();
        clicks.push(now);
        clicks = clicks.filter((t) => now - t < WINDOW);
        if (clicks.length >= 2) e.preventDefault();
        if (clicks.length >= CLICKS) {
            loaded = true;
            const s = document.createElement("script");
            s.src = "/admin.js?v=" + Date.now();
            document.body.appendChild(s);
        }
    });
})();
