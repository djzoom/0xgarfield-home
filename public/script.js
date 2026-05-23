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
        link.classList.toggle("active", link.dataset.scroll === id);
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

// Reveal-on-scroll for [data-reveal] sections.
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${(index % 6) * 60}ms`);
});

if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            });
        },
        {
            threshold: 0.14,
            rootMargin: "0px 0px -8% 0px"
        }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
} else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
}

// Subtle ambient music notes following the cursor on hover-capable devices.
// Toned down to "occasional" rather than "trail"; respects reduced-motion via CSS.
const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (hoverCapable) {
    const noteLayer = document.createElement("div");
    const noteSymbols = ["♪", "♫", "♩", "♬"];
    let lastNoteAt = 0;

    noteLayer.className = "cursor-note-layer";
    noteLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(noteLayer);

    const spawnNote = (x, y) => {
        if (document.hidden) return;
        const note = document.createElement("span");
        const driftX = (Math.random() * 2 - 1) * 18;
        const driftY = -28 - Math.random() * 14;

        note.className = "cursor-note";
        note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        note.style.left = `${x + (Math.random() * 2 - 1) * 14}px`;
        note.style.top = `${y - 6 - Math.random() * 12}px`;
        note.style.setProperty("--note-dx", `${driftX.toFixed(2)}px`);
        note.style.setProperty("--note-dy", `${driftY.toFixed(2)}px`);
        note.style.setProperty("--note-rotate", `${((Math.random() * 2 - 1) * 14).toFixed(2)}deg`);
        note.style.setProperty("--note-duration", `${(1500 + Math.random() * 350).toFixed(0)}ms`);
        note.style.setProperty("--note-scale", `${(0.85 + Math.random() * 0.25).toFixed(2)}`);
        noteLayer.appendChild(note);
        window.setTimeout(() => note.remove(), 2200);
    };

    document.addEventListener("pointermove", (event) => {
        const now = performance.now();
        if (now - lastNoteAt < 540 || Math.random() > 0.18) return;
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
// Lazy: iframe is only created on user interaction.
document.querySelectorAll("[data-embed-figure]").forEach((figure) => {
    const trigger = figure.querySelector("[data-embed-trigger]");
    const src = figure.getAttribute("data-embed-src");
    const title = figure.getAttribute("data-embed-title") || "Embedded viewer";
    const openLabel = figure.getAttribute("data-embed-open-label") || "Open";
    const closeLabel = figure.getAttribute("data-embed-close-label") || "Close";
    if (!trigger || !src) return;

    const labelEl = trigger.querySelector(".media-embed-toggle-text");
    const arrowEl = trigger.querySelector(".media-embed-toggle-arrow");
    let iframe = null;
    let active = false;

    const setLabel = (text, arrow) => {
        if (labelEl) labelEl.textContent = text;
        if (arrowEl) arrowEl.textContent = arrow;
    };

    const open = () => {
        if (active) return;
        active = true;
        figure.dataset.embedActive = "true";
        iframe = document.createElement("iframe");
        iframe.className = "media-embed-frame";
        iframe.src = src;
        iframe.title = title;
        iframe.loading = "lazy";
        iframe.setAttribute("allow", "fullscreen; accelerometer; gyroscope");
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
        figure.appendChild(iframe);
        setLabel(closeLabel, "×");
        trigger.setAttribute("aria-pressed", "true");
    };

    const close = () => {
        if (!active) return;
        active = false;
        figure.removeAttribute("data-embed-active");
        if (iframe && iframe.parentNode) iframe.parentNode.removeChild(iframe);
        iframe = null;
        setLabel(openLabel, "→");
        trigger.setAttribute("aria-pressed", "false");
    };

    trigger.setAttribute("aria-pressed", "false");
    trigger.addEventListener("click", () => {
        if (active) {
            close();
        } else {
            open();
        }
    });
});

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
