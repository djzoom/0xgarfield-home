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
            { root: crate, rootMargin: "0px -40% 0px -40%", threshold: 0 });
        recs.forEach(function (r) { fio.observe(r); });
    }
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
    var P = document.createElement("div");
    P.className = "pl"; P.setAttribute("role", "dialog"); P.setAttribute("aria-modal", "true"); P.setAttribute("aria-labelledby", "pl-title");
    P.innerHTML =
        '<div class="pl-bg"></div><div class="pl-scroll"><div class="pl-wrap">' +
        '<div class="pl-deckcol"><div class="pl-deck">' +
        '<div class="pl-platter"><div class="pl-dots"></div><div class="pl-mat"></div></div>' +
        '<div class="pl-disc" aria-hidden="true"><div class="cr-rot"><canvas></canvas></div><div class="cr-sheen"></div></div>' +
        '<div class="pl-arm" aria-hidden="true"><div class="pl-lift"><svg viewBox="0 0 100 300"><defs><linearGradient id="pl-chrome" x1="0" x2="1"><stop offset="0" stop-color="#d9dcdf"/><stop offset=".5" stop-color="#fafafa"/><stop offset="1" stop-color="#8d9196"/></linearGradient></defs>' +
        '<circle cx="66" cy="40" r="22" fill="#1b1d1f" stroke="#55595e" stroke-width="2"/><circle cx="66" cy="40" r="10" fill="url(#pl-chrome)"/>' +
        '<rect x="58" y="2" width="16" height="22" rx="3" fill="#2a2d30" stroke="#666" stroke-width="1"/>' +
        '<path d="M66 40 L62 230 L40 268" fill="none" stroke="url(#pl-chrome)" stroke-width="6" stroke-linecap="round"/>' +
        '<g transform="rotate(34 38 272)"><rect x="26" y="258" width="26" height="30" rx="3" fill="#1b1d1f" stroke="#888" stroke-width="1.5"/><rect x="34" y="286" width="8" height="5" fill="#bbb"/></g></svg></div></div>' +
        '<button type="button" class="pl-knob" aria-pressed="false"><svg viewBox="0 0 24 24"><path class="pl-ic" d="M7 4l13 8-13 8z"/></svg></button>' +
        '</div><div class="pl-scope"><canvas></canvas></div><p class="pl-gen"></p></div>' +
        '<div class="pl-info"><div class="pl-sleeve" style="--k:0"></div><p class="pl-no" style="--k:1"></p><h3 id="pl-title" style="--k:2"></h3>' +
        '<p class="pl-lead" style="--k:3"></p><div class="pl-prompter" style="--k:4" hidden></div><p class="pl-cap" style="--k:4" aria-live="polite"></p>' +
        '<div class="pl-body" style="--k:5"></div><dl class="pl-facts" style="--k:6"></dl><a class="pl-go" style="--k:7" target="_blank" rel="noopener noreferrer"></a></div>' +
        '</div></div><button type="button" class="pl-close"><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19"/></svg></button>';
    document.body.appendChild(P);
    var $ = function (s) { return P.querySelector(s); };
    var pDisc = $(".pl-disc"), pCanvas = pDisc.querySelector("canvas"), pRot = pDisc.querySelector(".cr-rot"), pSleeve = $(".pl-sleeve"), bgd = $(".pl-bg"),
        closeBtn = $(".pl-close"), knob = $(".pl-knob"), dots = $(".pl-dots"), cap = $(".pl-cap"), prompter = $(".pl-prompter"), deck = $(".pl-deck");
    var page = document.querySelector("main"), header = document.querySelector(".site-header");
    closeBtn.setAttribute("aria-label", UI.close); $(".pl-gen").textContent = UI.generated;

    /* ---------- audio: each record is a small live synth ---------- */
    var A = null, playing = false, sched = null, crk = null, schedTimer = null;
    function audio() {
        if (A) return A;
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        var ctx = new AC(), master = ctx.createGain(), tone = ctx.createBiquadFilter(), comp = ctx.createDynamicsCompressor(), an = ctx.createAnalyser();
        tone.type = "lowpass"; tone.frequency.value = 18000; master.gain.value = .8; an.fftSize = 2048;
        master.connect(tone); tone.connect(comp); comp.connect(an); an.connect(ctx.destination);
        var nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd2 = nb.getChannelData(0), i, j;
        for (i = 0; i < nd2.length; i++) nd2[i] = Math.random() * 2 - 1;
        var crb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), cd = crb.getChannelData(0);
        for (i = 0; i < cd.length; i++) {
            cd[i] = (Math.random() * 2 - 1) * .012;
            if (Math.random() < .00035) { var amp = (Math.random() * .6 + .2) * (Math.random() < .5 ? -1 : 1), len = 20 + Math.random() * 60 | 0; for (j = 0; j < len && i + j < cd.length; j++) cd[i + j] += amp * Math.exp(-j / 8); }
        }
        A = { ctx: ctx, master: master, tone: tone, an: an, noise: nb, crackle: crb, voices: new Set() };
        return A;
    }
    function osc(type, f, t, dur, g, dest, o) {
        o = o || {}; var c = A.ctx, n = c.createOscillator(), v = c.createGain(); n.type = type; n.frequency.setValueAtTime(f, t);
        if (o.glide) n.frequency.exponentialRampToValueAtTime(o.glide, t + (o.gt || .1));
        v.gain.setValueAtTime(0, t); v.gain.linearRampToValueAtTime(g, t + (o.a || .005)); v.gain.exponentialRampToValueAtTime(.0001, t + dur);
        n.connect(v); v.connect(dest || A.bus); n.start(t); n.stop(t + dur + .05); var set = A.voices; set.add(n); n.onended = function () { set.delete(n); };
        return n;
    }
    function hit(t, dur, g, hp, dest) {
        var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain(); s.buffer = A.noise; f.type = "highpass"; f.frequency.value = hp;
        v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.0001, t + dur); s.connect(f); f.connect(v); v.connect(dest || A.bus); s.start(t, Math.random()); s.stop(t + dur + .02);
    }
    var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var TRACKS = {
        rbr: function (t0) {
            var spb = 60 / 165, s16 = spb / 4, bars = [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 60], [55, 59, 62, 65]], bass = [45, 41, 36, 43], step = 0, next = t0;
            A.tone.frequency.setTargetAtTime(5200, A.ctx.currentTime, .3); cap.textContent = UI.cap.rbr[0];
            return function (now) {
                while (next < now + .15) {
                    var st = step % 16, bar = Math.floor(step / 16) % 4, t = next + ((st % 2) ? s16 * .12 : 0);
                    if (st % 4 === 0) osc("sine", 150, t, .32, .9, null, { glide: 45, gt: .12 });
                    if (st === 4 || st === 12) { hit(t, .18, .35, 1500); osc("triangle", 190, t, .12, .25); }
                    if (st % 2 === 0) hit(t, .05, st % 4 === 2 ? .16 : .08, 7000);
                    if (st === 0 || st === 7 || st === 10) osc("sawtooth", mtof(bass[bar]), t, .28, .16, A.lp);
                    if (st === 0 || st === 8) bars[bar].forEach(function (m) { osc("triangle", mtof(m), t, spb * 1.9, .035, A.lp, { a: .03 }); });
                    next += s16; step++;
                }
            };
        },
        pilo: function (t0) {
            var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), v = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), lf2 = c.createGain();
            s.buffer = A.noise; s.loop = true; f.type = "lowpass"; f.frequency.value = 700; v.gain.value = .22; lfo.frequency.value = 1 / 9; lg.gain.value = .2; lf2.gain.value = 500;
            lfo.connect(lg); lg.connect(v.gain); lfo.connect(lf2); lf2.connect(f.frequency); s.connect(f); f.connect(v); v.connect(A.bus);
            s.start(t0); lfo.start(t0); A.voices.add(s); A.voices.add(lfo);
            var chords = [[62, 66, 69, 73, 76], [59, 62, 66, 69, 74], [57, 61, 64, 69, 71], [55, 59, 62, 66, 71]], i = 0, next = t0 + .5;
            cap.textContent = UI.cap.pilo[0];
            return function (now) {
                while (next < now + .2) { chords[i % 4].forEach(function (m, j) { osc("sine", mtof(m), next + j * .35, 7.5, .03, null, { a: 2.2 }); }); next += 7; i++; }
            };
        },
        talktalk: function (t0) {
            var lines = DATA.records.talktalk.script, words = zh ? Array.from(lines.join("")) : lines.join(" ").split(" ");
            prompter.hidden = false;
            prompter.innerHTML = words.map(function (w) { return "<span>" + w + "</span>"; }).join(zh ? "" : " ");
            var spans = prompter.querySelectorAll("span"), spoke = false, idx = 0;
            cap.textContent = UI.cap.talktalk[0];
            function mark(n) { spans.forEach(function (s, j) { s.classList.toggle("on", j <= n); }); }
            if ("speechSynthesis" in window) {
                try {
                    speechSynthesis.cancel();
                    var full = zh ? lines.join("") : lines.join(" "), u = new SpeechSynthesisUtterance(full);
                    u.rate = .92; u.lang = zh ? "zh-CN" : "en-US";
                    u.onboundary = function (e) {
                        if (zh) { idx = e.charIndex; mark(idx); spoke = true; return; }
                        var pos = 0; for (var j = 0; j < words.length; j++) { if (pos >= e.charIndex) { idx = j; break; } pos += words[j].length + 1; }
                        mark(idx); spoke = true;
                    };
                    u.onend = function () { mark(words.length); };
                    speechSynthesis.speak(u);
                } catch (err) {}
            }
            var start = performance.now(), per = zh ? 230 : 360;
            A.tt = setInterval(function () { if (!spoke) mark(Math.min(words.length, Math.floor((performance.now() - start) / per))); }, 120);
            var ch = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]], i = 0, next = t0 + .2;
            return function (now) {
                while (next < now + .2) { ch[i % 4].forEach(function (m) { osc("sine", mtof(m), next, 2.8, .04, null, { a: .01 }); osc("sine", mtof(m) * 2, next, 1.2, .01); }); next += 3; i++; }
            };
        },
        aurora: function (t0) {
            var c = A.ctx, base = c.createOscillator(), bg = c.createGain();
            base.frequency.value = 440; bg.gain.setValueAtTime(0, t0); bg.gain.linearRampToValueAtTime(.18, t0 + .3); bg.gain.setValueAtTime(.18, t0 + 7.5); bg.gain.linearRampToValueAtTime(0, t0 + 8.2);
            base.connect(bg); bg.connect(A.bus); base.start(t0); base.stop(t0 + 8.4); A.voices.add(base);
            for (var h = 2; h <= 8; h++) (function (h) {
                var o = c.createOscillator(), g = c.createGain(); o.frequency.value = 440 * h;
                g.gain.setValueAtTime(0, t0); g.gain.setValueAtTime(0, t0 + 2.5 + h * .45); g.gain.linearRampToValueAtTime(.16 / h, t0 + 2.7 + h * .45);
                g.gain.setValueAtTime(.16 / h, t0 + 7.5); g.gain.linearRampToValueAtTime(0, t0 + 8.2);
                o.connect(g); g.connect(A.bus); o.start(t0); o.stop(t0 + 8.4); A.voices.add(o);
            })(h);
            var caps = [[0, UI.cap.aurora[0]], [3, UI.cap.aurora[1]], [8.2, UI.cap.aurora[2]]], ci = 0;
            var arp = [69, 72, 76, 81, 69, 72, 76, 79, 65, 69, 72, 77, 67, 71, 74, 79], step = 0, next = t0 + 8.2, s16 = 60 / 140 / 4;
            return function (now) {
                var e = now - t0; while (ci < caps.length && e >= caps[ci][0]) { cap.textContent = caps[ci][1]; ci++; }
                while (next < now + .15) {
                    var m = arp[step % 16] + (Math.floor(step / 16) % 2 ? -2 : 0);
                    osc("square", mtof(m), next, s16 * .9, .05);
                    if (step % 4 === 0) osc("square", mtof(m - 24), next, s16 * 3.6, .06);
                    if (step % 8 === 4) hit(next, .06, .18, 3000);
                    next += s16; step++;
                }
            };
        }
    };
    function startPlay(k) {
        var a = audio(); if (!a) return; a.ctx.resume();
        var now = a.ctx.currentTime;
        A.bus = a.ctx.createGain(); A.bus.connect(A.master);
        A.lp = a.ctx.createBiquadFilter(); A.lp.type = "lowpass"; A.lp.frequency.value = 1800; A.lp.connect(A.bus);
        A.master.gain.cancelScheduledValues(now); A.master.gain.setValueAtTime(.8, now);
        A.tone.frequency.cancelScheduledValues(now); A.tone.frequency.setValueAtTime(18000, now);
        crk = a.ctx.createBufferSource(); crk.buffer = A.crackle; crk.loop = true;
        var cg = a.ctx.createGain(); cg.gain.value = k === "pilo" ? .5 : 1; crk.connect(cg); cg.connect(A.master); crk.start();
        osc("sine", 70, now, .25, .5, A.master, { glide: 40, gt: .2 }); hit(now, .12, .25, 800, A.master);
        sched = TRACKS[k](now + .35);
        schedTimer = setInterval(function () { sched(A.ctx.currentTime); }, 50);
        playing = true; setKnob(true);
    }
    function stopPlay(hard) {
        if (!A || !playing) return;
        playing = false; setKnob(false); clearInterval(schedTimer); clearInterval(A.tt);
        try { speechSynthesis.cancel(); } catch (err) {}
        var t = A.ctx.currentTime, d = hard ? .15 : 1.3;
        A.voices.forEach(function (o) { try { if (o.detune) o.detune.setTargetAtTime(-1200, t, d / 3); if (o.playbackRate) o.playbackRate.setTargetAtTime(.3, t, d / 3); } catch (err) {} });
        A.tone.frequency.setTargetAtTime(400, t, d / 3); A.master.gain.setTargetAtTime(0, t + d * .4, d / 4);
        var bus = A.bus, cr = crk, old = A.voices; A.voices = new Set();
        setTimeout(function () { old.forEach(function (o) { try { o.stop(); } catch (err) {} }); old.clear(); try { cr.stop(); } catch (err) {} bus.disconnect(); }, d * 1000 + 200);
    }
    function setKnob(on) {
        knob.setAttribute("aria-pressed", on); knob.setAttribute("aria-label", on ? UI.pause : UI.play);
        knob.querySelector(".pl-ic").setAttribute("d", on ? "M6 4h4v16H6zM14 4h4v16h-4z" : "M7 4l13 8-13 8z");
    }
    setKnob(false);

    /* ---------- player motion ---------- */
    var current = null, busy = false, spinA = null, dotsA = null, ramp = 0, scopeRaf = 0;
    function delta(f, t) { return "translate(" + (f.left - t.left) + "px," + (f.top - t.top) + "px) scale(" + (f.width / t.width) + "," + (f.height / t.height) + ")"; }
    function motor(on) {
        if (!spinA) {
            spinA = pRot.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 1800, iterations: Infinity });
            dotsA = dots.animate([{ transform: "rotate(0)" }, { transform: "rotate(360deg)" }], { duration: 1800, iterations: Infinity });
            spinA.playbackRate = dotsA.playbackRate = 0;
        }
        cancelAnimationFrame(ramp);
        var from = spinA.playbackRate, to = on ? 1 : 0, dur = calm.matches ? 1 : (on ? 900 : 1300), st = performance.now();
        (function step(now) {
            var p = Math.min(1, (now - st) / dur), e = on ? 1 - Math.pow(1 - p, 3) : p * p * (3 - 2 * p);
            if (!spinA) return;
            spinA.playbackRate = dotsA.playbackRate = from + (to - from) * e;
            if (p < 1) ramp = requestAnimationFrame(step);
        })(st);
    }
    function scope() {
        var sc = $(".pl-scope canvas"), cx = sc.getContext("2d"), r = sc.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
        sc.width = r.width * dpr; sc.height = r.height * dpr;
        var col = getComputedStyle(P).color, buf = new Uint8Array(1024);
        (function draw() {
            scopeRaf = requestAnimationFrame(draw);
            var w = sc.width, h = sc.height; cx.clearRect(0, 0, w, h); cx.strokeStyle = col; cx.lineWidth = 1.5 * dpr; cx.beginPath();
            if (A && playing) { A.an.getByteTimeDomainData(buf); for (var i = 0; i < buf.length; i++) { var X = i / (buf.length - 1) * w, Y = (buf[i] / 255) * h; if (i) cx.lineTo(X, Y); else cx.moveTo(X, Y); } }
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
        prompter.hidden = true; cap.textContent = "";
    }
    function lockPage(on) {
        [page, header].forEach(function (el) { if (el) el.inert = on; });
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
        var q = calm.matches, t = q ? 1 : 900, o = { duration: t, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" };
        bgd.animate([{ opacity: 0 }, { opacity: 1 }], { duration: q ? 1 : 500, easing: "ease-out", fill: "both" });
        deck.animate([{ opacity: 0, transform: "translateY(24px) scale(.97)" }, { opacity: 1, transform: "none" }], { duration: q ? 1 : 650, delay: q ? 0 : 120, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
        pDisc.animate([{ transform: delta(sd, dd) + " rotate(24deg)" }, { transform: "translateY(-6%) scale(1.02)", offset: .7 }, { transform: "none" }], o);
        if (ds.width) pSleeve.animate([{ transform: delta(ss, ds) }, { transform: "none" }], o);
        requestAnimationFrame(function () { P.classList.add("pl-shown"); });
        scope();
        setTimeout(function () { busy = false; closeBtn.focus({ preventScroll: true }); if (push !== false) play(k); }, t);
    }
    function play(k) {
        if (playing) return;
        P.classList.add("pl-cue"); motor(true);
        setTimeout(function () { if (!current) return; P.classList.remove("pl-cue"); P.classList.add("pl-playing"); startPlay(k); }, calm.matches ? 0 : 1000);
    }
    function pause() { stopPlay(); P.classList.remove("pl-playing", "pl-cue"); motor(false); }
    function close(fromPop) {
        if (busy || !current) return;
        if (!fromPop && history.state && history.state.crPlayer) { history.back(); return; }
        busy = true; var rec = current;
        stopPlay(true); P.classList.remove("pl-playing", "pl-cue", "pl-shown"); cancelAnimationFrame(ramp);
        if (spinA) { spinA.cancel(); dotsA.cancel(); spinA = dotsA = null; }
        var dd = pDisc.getBoundingClientRect(), ds = pSleeve.getBoundingClientRect(),
            sd = rec.querySelector(".cr-disc").getBoundingClientRect(), ss = rec.querySelector(".cr-sleeve").getBoundingClientRect();
        var q = calm.matches, t = q ? 1 : 700, o = { duration: t, easing: "cubic-bezier(.4,0,.2,1)", fill: "both" };
        var a = pDisc.animate([{ transform: "none" }, { transform: delta(sd, dd) + " rotate(24deg)" }], o);
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
    knob.addEventListener("click", function () { if (!current) return; if (playing) pause(); else play(current.dataset.k); });
    pDisc.addEventListener("click", function () { knob.click(); });
    closeBtn.addEventListener("click", function () { close(); });
    P.addEventListener("click", function (e) { if (e.target === $(".pl-wrap") || e.target === $(".pl-scroll")) close(); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && current) close(); });
    addEventListener("popstate", function () { if (current) close(true); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && playing) pause(); });
    /* deep link: /#pilo opens that record */
    var hk = location.hash.slice(1);
    if (DATA.records[hk]) { var target = recs.filter(function (r) { return r.dataset.k === hk; })[0]; if (target) setTimeout(function () { open(target, false); }, 400); }
})();
