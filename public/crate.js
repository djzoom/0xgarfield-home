/* Record crate, turntable player, needle-drop opening and page-change transition.
   Data lives in <script type="application/json" id="cr-data"> on the home pages.
   Everything degrades: without JS the sleeves are plain links-free cards, with reduced
   motion nothing moves, and audio only starts from a click. */
(function () {
    "use strict";
    var root = document.documentElement;
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    root.classList.add("cr-js");

    /* ---------- page change: remember where the click happened, open the next page from there ---------- */
    document.addEventListener("pointerdown", function (e) {
        var a = e.target.closest && e.target.closest("a[href]");
        if (!a || a.target === "_blank" || a.origin !== location.origin) return;
        try { sessionStorage.setItem("cr-vt", e.clientX + "," + e.clientY); } catch (err) {}
    }, { passive: true });
    window.addEventListener("pagereveal", function (e) {
        if (!e.viewTransition) return;
        var v = null; try { v = sessionStorage.getItem("cr-vt"); sessionStorage.removeItem("cr-vt"); } catch (err) {}
        if (v) { var p = v.split(","); root.style.setProperty("--vx", p[0] + "px"); root.style.setProperty("--vy", p[1] + "px"); }
    });

    var dataEl = document.getElementById("cr-data");
    if (!dataEl) return;
    var DATA = JSON.parse(dataEl.textContent), UI = DATA.ui;
    var zh = root.lang.indexOf("zh") === 0;

    /* ---------- paper grain, once ---------- */
    try {
        var gc = document.createElement("canvas"); gc.width = gc.height = 90;
        var gx = gc.getContext("2d"), gd = gx.createImageData(90, 90);
        for (var gi = 0; gi < gd.data.length; gi += 4) { var gv = 128 + (Math.random() - .5) * 90; gd.data[gi] = gd.data[gi + 1] = gd.data[gi + 2] = gv; gd.data[gi + 3] = 255; }
        gx.putImageData(gd, 0, 0); root.style.setProperty("--cr-grain", "url(" + gc.toDataURL() + ")");
    } catch (err) {}

    /* ---------- opening: the needle drops on the headline (once per visit) ---------- */
    var h1 = document.querySelector(".hero h1");
    if (root.classList.contains("cr-intro") && h1) {
        var text = h1.textContent.trim(), parts = zh ? Array.from(text) : text.split(/\s+/);
        h1.textContent = "";
        parts.forEach(function (p, i) {
            var w = document.createElement("span"); w.className = "cr-w";
            var s = document.createElement("span"); s.textContent = p; s.style.setProperty("--k", i);
            w.appendChild(s); h1.appendChild(w);
            if (!zh && i < parts.length - 1) h1.appendChild(document.createTextNode(" "));
        });
        h1.setAttribute("aria-label", text);
        h1.classList.add("cr-split");
        var host = h1.parentElement, gv2 = document.createElement("div"), nd = document.createElement("div");
        gv2.className = "cr-groove"; nd.className = "cr-needle"; gv2.setAttribute("aria-hidden", "true"); nd.setAttribute("aria-hidden", "true");
        host.appendChild(gv2); host.appendChild(nd);
        var hr = host.getBoundingClientRect(), r1 = h1.getBoundingClientRect();
        var lineY = r1.top - hr.top + h1.querySelector(".cr-w").getBoundingClientRect().height + 2;
        gv2.style.top = lineY + "px"; gv2.style.left = (r1.left - hr.left) + "px"; gv2.style.width = r1.width + "px";
        nd.style.setProperty("--nx", (r1.left - hr.left) + "px"); nd.style.setProperty("--ny", (lineY - 120) + "px"); nd.style.setProperty("--nw", r1.width + "px");
        var endIntro = function () {
            root.classList.remove("cr-intro", "cr-play");
            try { sessionStorage.setItem("cr-intro", "1"); } catch (err) {}
            ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (t) { removeEventListener(t, endIntro); });
        };
        requestAnimationFrame(function () { root.classList.add("cr-play"); });
        setTimeout(endIntro, 2300);
        ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function (t) { addEventListener(t, endIntro, { passive: true }); });
    } else {
        root.classList.remove("cr-intro");
    }

    /* ---------- vinyl, drawn once per record ---------- */
    function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function arcText(x, t, r, mid, inside, size, font, color) {
        x.save(); x.font = font; x.fillStyle = color; x.textAlign = "center"; x.textBaseline = "middle";
        var chars = Array.from(t), w = chars.map(function (c) { return x.measureText(c).width + size * .12; });
        var total = w.reduce(function (a, b) { return a + b; }, 0), dir = inside ? -1 : 1, ang = mid - dir * total / 2 / r;
        chars.forEach(function (c, i) {
            var a = ang + dir * (w[i] / 2) / r;
            x.save(); x.rotate(a); x.translate(0, inside ? r : -r); if (inside) x.rotate(Math.PI); x.fillText(c, 0, 0); x.restore();
            ang += dir * w[i] / r;
        });
        x.restore();
    }
    var VC = {};
    function vinylFor(k) {
        if (VC[k]) return VC[k];
        var d = DATA.records[k], v = d.vinyl, S = 1100, R = S / 2, c = document.createElement("canvas"); c.width = c.height = S;
        var x = c.getContext("2d"), rand = rng(d.seed), i;
        x.translate(R, R);
        x.save(); x.beginPath(); x.arc(0, 0, R - 1, 0, Math.PI * 2); x.clip();
        var g = x.createRadialGradient(0, 0, R * .3, 0, 0, R); g.addColorStop(0, v.c1); g.addColorStop(.85, v.c1); g.addColorStop(1, v.c2);
        x.fillStyle = g; x.fillRect(-R, -R, S, S);
        if (v.splatter) v.splatter.forEach(function (col) {
            for (var j = 0; j < 26; j++) {
                var a = rand() * Math.PI * 2, rr = R * (.38 + rand() * .58), s = R * (.006 + rand() * .03);
                x.fillStyle = col; x.globalAlpha = .55 + rand() * .4; x.beginPath(); x.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, s * (1 + rand()), s, a, 0, Math.PI * 2); x.fill();
            }
            x.globalAlpha = 1;
        });
        if (v.smoke) {
            for (i = 0; i < 46; i++) {
                var a0 = rand() * Math.PI * 2, rr2 = R * (.4 + rand() * .55);
                x.strokeStyle = v.smoke; x.globalAlpha = .04 + rand() * .07; x.lineWidth = R * (.01 + rand() * .05);
                x.beginPath(); x.arc(0, 0, rr2, a0, a0 + .6 + rand() * 1.6); x.stroke();
            }
            x.globalAlpha = 1;
        }
        var gaps = [.5, .62, .74, .86], dens = v.dark ? 1 : .7;
        for (var r = R * .36; r < R * .955; r += 1.15) {
            var inGap = gaps.some(function (q) { return Math.abs(r / R - q) < .006; });
            x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2);
            if (inGap) { x.strokeStyle = "rgba(255,255,255," + (.05 * dens) + ")"; x.lineWidth = 1.2; }
            else { x.strokeStyle = rand() < .5 ? "rgba(0,0,0," + (.10 + .12 * rand()) * dens + ")" : "rgba(255,255,255," + (.018 + .04 * rand()) * dens + ")"; x.lineWidth = .8; }
            x.stroke();
        }
        x.beginPath(); x.arc(0, 0, R * .355, 0, Math.PI * 2); x.lineWidth = R * .02; x.strokeStyle = "rgba(255,255,255," + (.03 * dens) + ")"; x.stroke();
        x.beginPath(); x.arc(0, 0, R * .975, 0, Math.PI * 2); x.lineWidth = R * .04; x.strokeStyle = "rgba(255,255,255,.07)"; x.stroke();
        x.beginPath(); x.arc(0, 0, R * .995, 0, Math.PI * 2); x.lineWidth = R * .01; x.strokeStyle = "rgba(0,0,0,.35)"; x.stroke();
        x.restore();
        var L = d.label, lr = R * .33;
        x.save(); x.beginPath(); x.arc(0, 0, lr, 0, Math.PI * 2); x.fillStyle = L.bg; x.fill(); x.clip();
        var lg = x.createRadialGradient(-lr * .3, -lr * .4, lr * .1, 0, 0, lr); lg.addColorStop(0, "rgba(255,255,255,.10)"); lg.addColorStop(1, "rgba(0,0,0,.10)");
        x.fillStyle = lg; x.fillRect(-lr, -lr, lr * 2, lr * 2); x.restore();
        x.beginPath(); x.arc(0, 0, lr * .93, 0, Math.PI * 2); x.strokeStyle = L.fg; x.globalAlpha = .35; x.lineWidth = 1.5; x.stroke(); x.globalAlpha = 1;
        var fs = lr * .105, sans = "600 " + fs + "px system-ui,-apple-system,Helvetica,Arial,sans-serif", mono = (fs * .78) + "px ui-monospace,Menlo,monospace";
        arcText(x, L.top, lr * .8, 0, false, fs, sans, L.fg);
        arcText(x, "33⅓ RPM  ·  STEREO  ·  SIDE A", lr * .8, Math.PI, true, fs * .78, mono, L.fg);
        x.fillStyle = L.fg; x.textAlign = "center"; x.textBaseline = "middle";
        if (L.logo) {
            x.save(); var sc = lr * .95 / 414; x.translate(-207 * sc, -lr * .42); x.scale(sc, sc);
            L.logo.forEach(function (p) { x.fill(new Path2D(p), "evenodd"); }); x.restore();
        } else {
            x.font = "700 " + (lr * .2) + "px " + (L.monoMid ? "ui-monospace,Menlo,monospace" : "system-ui,-apple-system,Helvetica,Arial,sans-serif");
            x.fillText(L.mid, 0, -lr * .28);
        }
        x.font = mono; x.fillText(L.cat, -lr * .46, lr * .2); x.fillText(L.year, lr * .46, lr * .2);
        x.font = (fs * .7) + "px ui-monospace,Menlo,monospace"; x.globalAlpha = .75; x.fillText(L.foot, 0, lr * .55); x.globalAlpha = 1;
        x.globalCompositeOperation = "destination-out"; x.beginPath(); x.arc(0, 0, R * .022, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = "source-over";
        x.beginPath(); x.arc(0, 0, R * .024, 0, Math.PI * 2); x.strokeStyle = "rgba(0,0,0,.4)"; x.lineWidth = 2; x.stroke();
        return (VC[k] = c);
    }
    function paint(canvas, k) {
        var r = canvas.getBoundingClientRect(), px = Math.min(1100, Math.round(Math.max(r.width, 120) * Math.min(window.devicePixelRatio || 1, 2)));
        if (canvas.width === px && canvas.dataset.k === k) return;
        canvas.width = canvas.height = px; canvas.dataset.k = k;
        canvas.getContext("2d").drawImage(vinylFor(k), 0, 0, px, px);
    }

    /* ---------- crate ---------- */
    var crate = document.querySelector(".cr-crate");
    if (!crate) return;
    var recs = [].slice.call(crate.querySelectorAll(".cr-rec"));
    recs.forEach(function (r, i) { r.style.setProperty("--i", i); });
    function paintCrate() { recs.forEach(function (r) { paint(r.querySelector(".cr-disc canvas"), r.dataset.k); }); }
    (window.requestIdleCallback || function (f) { setTimeout(f, 60); })(paintCrate);
    var rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(paintCrate, 200); });
    if ("IntersectionObserver" in window && !calm.matches) {
        var io = new IntersectionObserver(function (es) {
            es.forEach(function (e) {
                if (!e.isIntersecting) return;
                crate.classList.add("cr-in"); io.disconnect();
                setTimeout(function () { crate.classList.add("cr-settled"); }, 2200);
            });
        }, { threshold: .15 });
        io.observe(crate);
    } else crate.classList.add("cr-in", "cr-settled");
    var mq = window.matchMedia("(max-width: 860px)"), fio = null;
    function focusSetup() {
        if (fio) { fio.disconnect(); fio = null; }
        if (!mq.matches) { recs.forEach(function (r) { r.classList.remove("cr-active"); }); return; }
        fio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("cr-active", e.isIntersecting); }); },
            { rootMargin: "-38% 0px -38% 0px", threshold: 0 });
        recs.forEach(function (r) { fio.observe(r); });
    }
    /* ---------- mobile: each record's pull is computed, not toggled ----------
       pull = rest + scroll + side * bias
         rest   0.093  -> exactly 1/6 of the rim shows above the sleeve
         scroll 0.41   -> added while the page moves and the record crosses the middle band
         bias  [-1, 1] -> weighted mix of phone tilt (0.6) and sideways finger movement (0.4);
                          right column gets +bias, left column -bias, so a row never moves in lockstep */
    var REST = .093, SCROLL = .41, SIDE = .2, moving = false, moveT = 0, bias = 0, tilt = 0, finger = 0,
        hasTilt = false, base = null, fx0 = null, loop = 0, pulls = recs.map(function () { return REST; });
    function sideOf(r) { var c = r.getBoundingClientRect(); return (c.left + c.width / 2) < innerWidth / 2 ? -1 : 1; }
    function kick() { if (!loop && mq.matches && !calm.matches) loop = requestAnimationFrame(frame); }
    function frame() {
        loop = 0;
        if (fx0 === null) finger *= .9;                     // the finger's influence fades once it lifts
        var wT = hasTilt ? .6 : 0, wF = hasTilt ? .4 : 1, target = Math.max(-1, Math.min(1, wT * tilt + wF * finger));
        bias += (target - bias) * .18;
        var busy = Math.abs(target - bias) > .002 || Math.abs(finger) > .002;
        recs.forEach(function (r, i) {
            var want = REST + (moving && r.classList.contains("cr-active") ? SCROLL : 0) + sideOf(r) * bias * SIDE;
            want = Math.max(.02, Math.min(.62, want));
            pulls[i] += (want - pulls[i]) * .14;            // spring toward the target: no CSS transition fighting the sensors
            if (Math.abs(want - pulls[i]) > .001) busy = true;
            r.style.setProperty("--pull", pulls[i].toFixed(4));
        });
        if (busy) kick();
    }
    addEventListener("scroll", function () {
        if (!mq.matches) return;
        moving = true; crate.classList.add("cr-moving"); kick();
        clearTimeout(moveT); moveT = setTimeout(function () { moving = false; crate.classList.remove("cr-moving"); kick(); }, 450);
    }, { passive: true });
    /* tilt: left/right (gamma), relative to a slowly drifting baseline so holding the phone at an angle settles back to neutral */
    function onTilt(e) {
        if (e.gamma == null) return;
        hasTilt = true;
        if (base === null) base = e.gamma;
        base += (e.gamma - base) * .006;   // ~3 s at 60 Hz: holding a tilt slowly becomes the new neutral
        tilt = Math.max(-1, Math.min(1, (e.gamma - base) / 18));
        kick();
    }
    function listenTilt() { addEventListener("deviceorientation", onTilt, { passive: true }); }
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
        // iOS asks once, from a tap
        var askTilt = function () {
            removeEventListener("touchend", askTilt);
            DeviceOrientationEvent.requestPermission().then(function (r) { if (r === "granted") listenTilt(); }).catch(function () {});
        };
        addEventListener("touchend", askTilt, { passive: true });
    } else if (window.DeviceOrientationEvent) listenTilt();
    /* finger: sideways travel since the touch began, as a share of the screen width */
    addEventListener("touchstart", function (e) { if (!mq.matches) return; fx0 = e.touches[0].clientX; }, { passive: true });
    addEventListener("touchmove", function (e) {
        if (fx0 === null) return;
        finger = Math.max(-1, Math.min(1, (e.touches[0].clientX - fx0) / (innerWidth * .35))); kick();
    }, { passive: true });
    addEventListener("touchend", function () { fx0 = null; kick(); }, { passive: true });
    kick();
    if (mq.addEventListener) mq.addEventListener("change", focusSetup); else mq.addListener(focusSetup);
    focusSetup();
    if (window.matchMedia("(hover: hover)").matches && !calm.matches) {
        var lq = 0;
        addEventListener("pointermove", function (e) {
            if (lq) return;
            lq = requestAnimationFrame(function () { lq = 0; root.style.setProperty("--cr-la", ((e.clientX / innerWidth - .5) * 70 + (e.clientY / innerHeight - .5) * 30).toFixed(1)); });
        }, { passive: true });
    }

    /* ---------- player DOM ---------- */
    /* Deck geometry, in units of the deck's width (deck is 100 × 86):
       platter and record share the centre (43, 43.16); record radius 35.
       Tonearm pivot (88, 12), length 48, drawn pointing straight down at rest.
       Rotations below put the stylus on the outer groove (r ≈ 32.5) and walk it inward to r ≈ 26. */
    var ARM_REST = 0, ARM_OUTER = 19.2, ARM_END = 26.9;
    var P = document.createElement("div");
    P.className = "pl"; P.setAttribute("role", "dialog"); P.setAttribute("aria-modal", "true"); P.setAttribute("aria-labelledby", "pl-title");
    P.innerHTML =
        '<div class="pl-bg"></div><div class="pl-scroll"><div class="pl-wrap">' +
        '<div class="pl-deckcol"><div class="pl-deck">' +
        '<div class="pl-platter"><div class="pl-dots"></div><div class="pl-mat"></div></div>' +
        '<div class="pl-disc"><div class="cr-rot"><canvas></canvas></div><div class="cr-sheen"></div></div>' +
        '<svg class="pl-armsvg" viewBox="0 0 100 86" aria-hidden="true"><defs><linearGradient id="pl-chrome" x1="0" x2="1"><stop offset="0" stop-color="#c9ccd0"/><stop offset=".5" stop-color="#fbfbfb"/><stop offset="1" stop-color="#868a90"/></linearGradient></defs>' +
        '<circle cx="88" cy="12" r="5.2" fill="#1b1d1f" stroke="#5b6066" stroke-width=".4"/><circle cx="88" cy="12" r="2.2" fill="url(#pl-chrome)"/>' +
        '<g class="pl-arm"><rect x="85.6" y="2.2" width="4.8" height="5.6" rx=".8" fill="#2a2d30" stroke="#6a6e73" stroke-width=".3"/>' +
        '<path d="M88 12 L88 54.5 L86.2 57.4" fill="none" stroke="url(#pl-chrome)" stroke-width="1.15" stroke-linecap="round"/>' +
        '<g transform="rotate(28 87 58.6)"><rect x="84.6" y="56.4" width="4.8" height="4.6" rx=".5" fill="#1b1d1f" stroke="#8a8e93" stroke-width=".3"/><rect x="86.6" y="60.6" width=".8" height=".9" fill="#c9ccd0"/></g></g></svg>' +
        '</div>' +
        '<div class="pl-transport"><button type="button" class="pl-play" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path class="pl-ic" d="M7 4l13 8-13 8z"/></svg><span class="pl-play-t"></span></button>' +
        '<div class="pl-track"><p class="pl-title"></p><div class="pl-bar"><div class="pl-fill"></div></div><p class="pl-time"><span class="pl-cur">0:00</span><span class="pl-dur">0:00</span></p></div></div>' +
        '<div class="pl-scope"><canvas></canvas></div><p class="pl-gen"></p></div>' +
        '<div class="pl-info"><div class="pl-sleeve" style="--k:0"></div><p class="pl-no" style="--k:1"></p><h3 id="pl-title" style="--k:2"></h3>' +
        '<p class="pl-lead" style="--k:3"></p>' +
        '<div class="pl-body" style="--k:4"></div><dl class="pl-facts" style="--k:5"></dl><a class="pl-go" style="--k:6" target="_blank" rel="noopener noreferrer"></a></div>' +
        '</div></div><button type="button" class="pl-close"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>';
    document.body.appendChild(P);
    var $ = function (s) { return P.querySelector(s); };
    var pDisc = $(".pl-disc"), pCanvas = pDisc.querySelector("canvas"), pRot = pDisc.querySelector(".cr-rot"), pSleeve = $(".pl-sleeve"), bgd = $(".pl-bg"),
        closeBtn = $(".pl-close"), playBtn = $(".pl-play"), dots = $(".pl-dots"), deck = $(".pl-deck"), arm = $(".pl-arm"),
        fillEl = $(".pl-fill"), curEl = $(".pl-cur"), durEl = $(".pl-dur"), bar = $(".pl-bar");
    var page = document.querySelector("main"), header = document.querySelector(".site-header");
    closeBtn.setAttribute("aria-label", UI.close); $(".pl-gen").textContent = UI.note;

    /* ---------- audio: a short excerpt from the record's own library, through a tiny vinyl chain ---------- */
    var el = new Audio(); el.preload = "none"; el.crossOrigin = "anonymous";
    if ("preservesPitch" in el) el.preservesPitch = false; if ("webkitPreservesPitch" in el) el.webkitPreservesPitch = false;
    var A = null, playing = false, armTimer = 0, rateRaf = 0;
    function graph() {
        if (A) return A;
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        var ctx = new AC(), src = ctx.createMediaElementSource(el), gain = ctx.createGain(), an = ctx.createAnalyser(), cg = ctx.createGain();
        gain.gain.value = .9; an.fftSize = 2048; cg.gain.value = 0;
        src.connect(gain); gain.connect(an); an.connect(ctx.destination);
        var buf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), d = buf.getChannelData(0), i, j;
        for (i = 0; i < d.length; i++) {
            d[i] = (Math.random() * 2 - 1) * .006;
            if (Math.random() < .0003) { var amp = (Math.random() * .5 + .15) * (Math.random() < .5 ? -1 : 1), len = 20 + Math.random() * 50 | 0; for (j = 0; j < len && i + j < d.length; j++) d[i + j] += amp * Math.exp(-j / 8); }
        }
        var crk = ctx.createBufferSource(); crk.buffer = buf; crk.loop = true; crk.connect(cg); cg.connect(an); crk.start();
        A = { ctx: ctx, gain: gain, an: an, crackle: cg };
        return A;
    }
    function fmt(s) { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ":" + ("0" + s % 60).slice(-2); }
    el.addEventListener("loadedmetadata", function () { durEl.textContent = fmt(el.duration); });
    el.addEventListener("timeupdate", function () {
        var p = el.duration ? el.currentTime / el.duration : 0;
        fillEl.style.transform = "scaleX(" + p + ")"; curEl.textContent = fmt(el.currentTime);
        if (playing) arm.style.transform = "rotate(" + (ARM_OUTER + (ARM_END - ARM_OUTER) * p).toFixed(2) + "deg)";
    });
    el.addEventListener("ended", function () { stop(false, true); });
    bar.addEventListener("click", function (e) {
        if (!el.duration) return; var r = bar.getBoundingClientRect(); el.currentTime = el.duration * Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    });
    function setBtn(on) {
        playBtn.setAttribute("aria-pressed", on); $(".pl-play-t").textContent = on ? UI.pause : UI.play;
        playBtn.querySelector(".pl-ic").setAttribute("d", on ? "M6 4h4v16H6zM14 4h4v16h-4z" : "M7 4l13 8-13 8z");
    }

    /* ---------- motor: spin-up and wind-down, record and strobe dots together; the audio follows the platter ---------- */
    var spinA = null, dotsA = null;
    function motor(on, done) {
        if (!spinA) {
            spinA = pRot.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 1800, iterations: Infinity });
            dotsA = dots.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 1800, iterations: Infinity });
            spinA.playbackRate = dotsA.playbackRate = 0;
        }
        cancelAnimationFrame(rateRaf);
        var from = spinA.playbackRate, to = on ? 1 : 0, dur = calm.matches ? 1 : (on ? 800 : 1400), st = performance.now();
        (function step(now) {
            var p = Math.min(1, (now - st) / dur);
            var v = on ? from + (to - from) * (1 - Math.pow(1 - p, 3)) : from * (1 - p * p * (3 - 2 * p));
            if (!spinA) return;
            spinA.playbackRate = dotsA.playbackRate = v;
            if (!on && !el.paused) { try { el.playbackRate = Math.max(.07, v); } catch (err) {} }
            if (p < 1) rateRaf = requestAnimationFrame(step); else if (done) done();
        })(st);
    }
    function setArm(deg, ms, lifted) {
        arm.style.transition = "transform " + (calm.matches ? 0 : ms) + "ms cubic-bezier(.45,.05,.25,1), filter .3s";
        arm.style.transform = "rotate(" + deg + "deg)";
        P.classList.toggle("pl-lifted", !!lifted);
    }
    function play() {
        if (playing || !current) return;
        var a = graph(); var d = DATA.records[current.dataset.k];
        if (el.dataset.k !== current.dataset.k) { el.src = d.audio.src; el.dataset.k = current.dataset.k; el.load(); }
        if (a) a.ctx.resume();
        playing = true; setBtn(true);
        // cue: lift, swing over the lead-in, lower; the platter is already turning when the stylus lands
        setArm(ARM_REST, 0, true); motor(true);
        requestAnimationFrame(function () { setArm(ARM_OUTER, 900, true); });
        clearTimeout(armTimer);
        armTimer = setTimeout(function () {
            if (!playing) return;
            setArm(ARM_OUTER, 250, false);
            armTimer = setTimeout(function () {
                if (!playing) return;
                try { el.playbackRate = 1; } catch (err) {}
                arm.style.transition = "transform .5s linear";
                if (a) { var t = a.ctx.currentTime; a.crackle.gain.cancelScheduledValues(t); a.crackle.gain.setTargetAtTime(1, t, .05); }
                var pr = el.play(); if (pr && pr.catch) pr.catch(function () { stop(true); });
            }, calm.matches ? 0 : 260);
        }, calm.matches ? 0 : 950);
    }
    function stop(hard, ended) {
        if (!playing) return;
        playing = false; setBtn(false); clearTimeout(armTimer);
        if (A) { var t = A.ctx.currentTime; A.crackle.gain.setTargetAtTime(0, t, .2); }
        var finish = function () { el.pause(); try { el.playbackRate = 1; } catch (err) {} if (ended) el.currentTime = 0; };
        if (hard || calm.matches) { finish(); if (spinA) { spinA.playbackRate = dotsA.playbackRate = 0; } setArm(ARM_REST, 600, false); return; }
        // vinyl stop: the platter winds down and the pitch sinks with it, then the arm returns
        motor(false, finish);
        setArm(parseFloat((arm.style.transform.match(/-?[\d.]+/) || [ARM_OUTER])[0]), 0, true);
        setTimeout(function () { if (!playing) setArm(ARM_REST, 900, true); }, 250);
        setTimeout(function () { if (!playing) P.classList.remove("pl-lifted"); }, 1250);
    }
    playBtn.addEventListener("click", function () { if (playing) stop(); else play(); });
    pDisc.addEventListener("click", function () { playBtn.click(); });

    /* ---------- player motion ---------- */
    var current = null, busy = false, scopeRaf = 0;
    function delta(f, t) { return "translate(" + (f.left - t.left) + "px," + (f.top - t.top) + "px) scale(" + (f.width / t.width) + "," + (f.height / t.height) + ")"; }
    function scope() {
        var sc = $(".pl-scope canvas"), cx = sc.getContext("2d"), r = sc.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        sc.width = Math.max(1, r.width * dpr); sc.height = Math.max(1, r.height * dpr);
        var col = getComputedStyle(P).color, buf = new Uint8Array(1024);
        (function draw() {
            scopeRaf = requestAnimationFrame(draw);
            var w = sc.width, h = sc.height; cx.clearRect(0, 0, w, h); cx.strokeStyle = col; cx.lineWidth = 1.5 * dpr; cx.beginPath();
            if (A && !el.paused) { A.an.getByteTimeDomainData(buf); for (var i = 0; i < buf.length; i++) { var X = i / (buf.length - 1) * w, Y = (buf[i] / 255) * h; if (i) cx.lineTo(X, Y); else cx.moveTo(X, Y); } }
            else { cx.moveTo(0, h / 2); cx.lineTo(w, h / 2); }
            cx.stroke();
        })();
    }
    function fill(k) {
        var d = DATA.records[k];
        $(".pl-no").textContent = d.no + " / 04  ·  " + d.cat;
        $("#pl-title").textContent = d.name; $(".pl-lead").textContent = d.lead;
        $(".pl-body").innerHTML = ""; d.body.forEach(function (t) { var p = document.createElement("p"); p.textContent = t; $(".pl-body").appendChild(p); });
        var dl = $(".pl-facts"); dl.innerHTML = "";
        d.facts.forEach(function (f) { var dt = document.createElement("dt"), dd = document.createElement("dd"); dt.textContent = f[0]; dd.textContent = f[1]; dl.appendChild(dt); dl.appendChild(dd); });
        var go = $(".pl-go"); go.textContent = d.cta; go.href = d.url; go.target = d.url.charAt(0) === "/" ? "_self" : "_blank";
        $(".pl-title").textContent = d.audio.title + "  ·  " + d.audio.credit;
        fillEl.style.transform = "scaleX(0)"; curEl.textContent = "0:00"; durEl.textContent = d.audio.len;
        setBtn(false); setArm(ARM_REST, 0, false);
    }
    function lockPage(on) {
        [page, header].forEach(function (n) { if (n) n.inert = on; });
        document.documentElement.style.overflow = on ? "hidden" : "";
    }
    function open(rec, push) {
        if (busy || current) return;
        busy = true; current = rec; var k = rec.dataset.k;
        P.className = "pl pl-open cr-" + k; fill(k);
        pSleeve.innerHTML = rec.querySelector(".cr-sleeve").innerHTML;
        lockPage(true);
        if (push !== false) { try { history.pushState({ crPlayer: k }, "", "#" + k); } catch (err) {} }
        paint(pCanvas, k);
        var sd = rec.querySelector(".cr-disc").getBoundingClientRect(), ss = rec.querySelector(".cr-sleeve").getBoundingClientRect(),
            dd = pDisc.getBoundingClientRect(), ds = pSleeve.getBoundingClientRect();
        rec.style.visibility = "hidden";
        var q = calm.matches, t = q ? 1 : 950, o = { duration: t, easing: "cubic-bezier(.45,.05,.2,1)", fill: "both" };
        bgd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: q ? 1 : 500, easing: "ease-out", fill: "both" });
        deck.animate([{ opacity: 0, transform: "translateY(24px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: q ? 1 : 650, delay: q ? 0 : 120, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
        // lifted off the sleeve, carried over, set down on the spindle
        pDisc.animate([
            { transform: delta(sd, dd), filter: "drop-shadow(0 6px 8px rgba(0,0,0,.25))" },
            { transform: "translateY(-5%) scale(1.04)", filter: "drop-shadow(0 26px 22px rgba(0,0,0,.35))", offset: .72 },
            { transform: "none", filter: "drop-shadow(0 4px 4px rgba(0,0,0,.3))" }], o);
        if (ds.width) pSleeve.animate([{ transform: delta(ss, ds) }, { transform: "none" }], o);
        requestAnimationFrame(function () { P.classList.add("pl-shown"); });
        scope();
        setTimeout(function () { busy = false; closeBtn.focus({ preventScroll: true }); if (push !== false) play(); }, t);
    }
    function close(fromPop) {
        if (busy || !current) return;
        if (!fromPop && history.state && history.state.crPlayer) { history.back(); return; }
        busy = true; var rec = current;
        stop(true); el.removeAttribute("src"); el.dataset.k = ""; el.load();
        P.classList.remove("pl-shown"); cancelAnimationFrame(rateRaf);
        if (spinA) { spinA.cancel(); dotsA.cancel(); spinA = dotsA = null; }
        var dd = pDisc.getBoundingClientRect(), ds = pSleeve.getBoundingClientRect(),
            sd = rec.querySelector(".cr-disc").getBoundingClientRect(), ss = rec.querySelector(".cr-sleeve").getBoundingClientRect();
        var q = calm.matches, t = q ? 1 : 750, o = { duration: t, easing: "cubic-bezier(.45,.05,.2,1)", fill: "both" };
        var a = pDisc.animate([{ transform: "none" }, { transform: "translateY(-5%) scale(1.04)", offset: .3 }, { transform: delta(sd, dd) }], o);
        if (ds.width) pSleeve.animate([{ transform: "none" }, { transform: delta(ss, ds) }], o);
        deck.animate([{ opacity: 1 }, { opacity: 0 }], { duration: q ? 1 : 400, easing: "ease-in", fill: "both" });
        bgd.animate([{ opacity: 1 }, { opacity: 0 }], { duration: q ? 1 : 600, delay: q ? 0 : 150, easing: "ease-in", fill: "both" });
        a.onfinish = function () {
            rec.style.visibility = ""; P.className = "pl"; lockPage(false); cancelAnimationFrame(scopeRaf);
            P.getAnimations({ subtree: true }).forEach(function (x) { x.cancel(); });
            current = null; busy = false; rec.focus({ preventScroll: true });
            if (A) A.ctx.suspend();
        };
    }
    recs.forEach(function (r) {
        r.addEventListener("click", function () { open(r); });
        r.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(r); } });
    });
    closeBtn.addEventListener("click", function () { close(); });
    P.addEventListener("click", function (e) { if (e.target === $(".pl-wrap") || e.target === $(".pl-scroll")) close(); });
    addEventListener("keydown", function (e) {
        if (!current) return;
        if (e.key === "Escape") close();
        else if (e.key === " " && document.activeElement === document.body) { e.preventDefault(); playBtn.click(); }
    });
    addEventListener("popstate", function () { if (current) close(true); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && playing) stop(true); });
    var hk = location.hash.slice(1);
    if (DATA.records[hk]) { var target = recs.filter(function (r) { return r.dataset.k === hk; })[0]; if (target) setTimeout(function () { open(target, false); }, 400); }
})();
