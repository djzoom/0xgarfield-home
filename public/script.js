// Hide portrait when tab is inactive to prevent browser grayscale thumbnail
const heroPortraitImg = document.querySelector(".hero-portrait img");
if (heroPortraitImg) {
    document.addEventListener("visibilitychange", () => {
        heroPortraitImg.style.display = document.hidden ? "none" : "";
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

const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
revealItems.forEach((item, index) => {
    item.style.setProperty("--reveal-delay", `${(index % 6) * 70}ms`);
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

const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const interactiveTargets = Array.from(
    document.querySelectorAll(".surface, .btn, .hero-portrait, .contact-links a")
);

if (hoverCapable) {
    interactiveTargets.forEach((target) => {
        target.addEventListener("pointermove", (event) => {
            const rect = target.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;

            target.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
            target.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
            target.classList.add("has-pointer");
        });

        target.addEventListener("pointerleave", () => {
            target.classList.remove("has-pointer");
        });
    });

    const magneticTargets = Array.from(document.querySelectorAll(".btn, .nav-link, .lang-switch"));

    magneticTargets.forEach((target) => {
        let currentX = 0;
        let currentY = 0;
        let targetX = 0;
        let targetY = 0;
        let rafId = 0;

        const render = () => {
            currentX += (targetX - currentX) * 0.18;
            currentY += (targetY - currentY) * 0.18;

            target.style.setProperty("--magnetic-x", `${currentX.toFixed(2)}px`);
            target.style.setProperty("--magnetic-y", `${currentY.toFixed(2)}px`);

            if (
                Math.abs(targetX - currentX) > 0.08 ||
                Math.abs(targetY - currentY) > 0.08
            ) {
                rafId = window.requestAnimationFrame(render);
            } else {
                rafId = 0;
            }
        };

        const queueRender = () => {
            if (!rafId) {
                rafId = window.requestAnimationFrame(render);
            }
        };

        target.addEventListener("pointermove", (event) => {
            const rect = target.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            const maxShift = 10;

            targetX = Math.max(-maxShift, Math.min(maxShift, dx * 0.14));
            targetY = Math.max(-maxShift, Math.min(maxShift, dy * 0.14));
            queueRender();
        });

        target.addEventListener("pointerleave", () => {
            targetX = 0;
            targetY = 0;
            queueRender();
        });
    });

    const heroStage = document.querySelector(".hero-stage");
    if (heroStage) {
        const resetStage = () => {
            heroStage.style.setProperty("--stage-shift-x", "0px");
            heroStage.style.setProperty("--stage-shift-y", "0px");
            heroStage.style.setProperty("--stage-rotate-x", "0deg");
            heroStage.style.setProperty("--stage-rotate-y", "0deg");
            heroStage.style.setProperty("--stage-glow-x", "68%");
            heroStage.style.setProperty("--stage-glow-y", "16%");
        };

        heroStage.addEventListener("pointermove", (event) => {
            const rect = heroStage.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;
            const glowX = ((event.clientX - rect.left) / rect.width) * 100;
            const glowY = ((event.clientY - rect.top) / rect.height) * 100;

            heroStage.style.setProperty("--stage-shift-x", `${(x / rect.width * 18).toFixed(2)}px`);
            heroStage.style.setProperty("--stage-shift-y", `${(y / rect.height * 18).toFixed(2)}px`);
            heroStage.style.setProperty("--stage-rotate-x", `${(y / rect.height * 4.2).toFixed(2)}deg`);
            heroStage.style.setProperty("--stage-rotate-y", `${(x / rect.width * -5.6).toFixed(2)}deg`);
            heroStage.style.setProperty("--stage-glow-x", `${glowX.toFixed(2)}%`);
            heroStage.style.setProperty("--stage-glow-y", `${glowY.toFixed(2)}%`);
        });

        heroStage.addEventListener("pointerleave", resetStage);
        resetStage();
    }

    const cursor = document.createElement("div");
    const noteLayer = document.createElement("div");
    const noteSymbols = ["♪", "♫", "♩", "♬"];
    let cursorX = window.innerWidth / 2;
    let cursorY = window.innerHeight / 2;
    let targetCursorX = cursorX;
    let targetCursorY = cursorY;
    let lastNoteAt = 0;

    cursor.className = "site-cursor";
    cursor.setAttribute("aria-hidden", "true");
    noteLayer.className = "cursor-note-layer";
    noteLayer.setAttribute("aria-hidden", "true");
    document.body.appendChild(noteLayer);
    document.body.appendChild(cursor);
    document.documentElement.classList.add("has-custom-cursor");

    const cursorTargets = Array.from(
        document.querySelectorAll("a, button, .surface, .hero-portrait, .project-link")
    );

    const spawnCursorNote = (x, y, burst = false) => {
        if (document.hidden) return;

        const note = document.createElement("span");
        const spread = burst ? 26 : 18;
        const driftX = (Math.random() * 2 - 1) * (burst ? 34 : 22);
        const driftY = -24 - Math.random() * (burst ? 26 : 18);

        note.className = "cursor-note";
        note.textContent = noteSymbols[Math.floor(Math.random() * noteSymbols.length)];
        note.style.left = `${x + (Math.random() * 2 - 1) * spread}px`;
        note.style.top = `${y - 8 - Math.random() * 16}px`;
        note.style.setProperty("--note-dx", `${driftX.toFixed(2)}px`);
        note.style.setProperty("--note-dy", `${driftY.toFixed(2)}px`);
        note.style.setProperty("--note-rotate", `${((Math.random() * 2 - 1) * 18).toFixed(2)}deg`);
        note.style.setProperty("--note-duration", `${(burst ? 1500 + Math.random() * 360 : 1280 + Math.random() * 420).toFixed(0)}ms`);
        note.style.setProperty("--note-scale", `${(0.9 + Math.random() * 0.4).toFixed(2)}`);
        noteLayer.appendChild(note);

        window.setTimeout(() => {
            note.remove();
        }, 2200);
    };

    const maybeSpawnCursorNote = (x, y) => {
        const now = performance.now();
        if (now - lastNoteAt < 180) return;
        if (Math.random() > 0.34) return;

        lastNoteAt = now;
        spawnCursorNote(x, y, false);
    };

    const renderCursor = () => {
        cursorX += (targetCursorX - cursorX) * 0.16;
        cursorY += (targetCursorY - cursorY) * 0.16;
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate3d(var(--cursor-offset-x, -50%), var(--cursor-offset-y, -50%), 0)`;
        window.requestAnimationFrame(renderCursor);
    };

    window.requestAnimationFrame(renderCursor);

    document.addEventListener("pointermove", (event) => {
        targetCursorX = event.clientX;
        targetCursorY = event.clientY;
        cursor.classList.add("is-visible");
        maybeSpawnCursorNote(targetCursorX, targetCursorY);
    }, { passive: true });

    document.addEventListener("pointerdown", () => {
        cursor.classList.add("is-active");
        spawnCursorNote(targetCursorX, targetCursorY, true);
        if (Math.random() > 0.4) {
            window.setTimeout(() => {
                spawnCursorNote(targetCursorX, targetCursorY, true);
            }, 90);
        }
    });

    document.addEventListener("pointerup", () => {
        cursor.classList.remove("is-active");
    });

    document.documentElement.addEventListener("mouseleave", () => {
        cursor.classList.remove("is-visible");
        noteLayer.textContent = "";
    });

    window.addEventListener("blur", () => {
        cursor.classList.remove("is-visible");
        noteLayer.textContent = "";
    });

    cursorTargets.forEach((target) => {
        target.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
        target.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    });
}

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
