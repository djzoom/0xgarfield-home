/* A small FM radio above the records.
   Stations are broadcast "live": every station plays on one shared clock that started at EPOCH,
   so tuning in joins the programme where it is now, and coming back later finds it further on.
   Between stations there is static; near a station the programme fades in as the static fades out.
   A station's audio is fetched only after the needle has rested near it, so sweeping the dial costs nothing. */
(function () {
    "use strict";
    var box = document.querySelector("[data-radio]"), dataEl = document.getElementById("rd-data");
    if (!box || !dataEl) return;
    var D = JSON.parse(dataEl.textContent), S = D.stations, UI = D.ui;
    var MIN = 87.5, MAX = 108, CAPTURE = .35, EPOCH = Date.UTC(2026, 0, 1);
    var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dial = box.querySelector(".rd-dial"), needle = box.querySelector(".rd-needle"), knob = box.querySelector(".rd-knob"),
        power = box.querySelector(".rd-power"), freqEl = box.querySelector(".rd-freq"), nameEl = box.querySelector(".rd-name"),
        lamp = box.querySelector(".rd-lamp"), marks = box.querySelector(".rd-marks"), keysEl = box.querySelector(".rd-keys");

    // station marks on the scale
    S.forEach(function (s) {
        var m = document.createElement("span"); m.className = "rd-mark";
        m.style.left = ((s.f - MIN) / (MAX - MIN) * 100) + "%"; m.textContent = s.short;
        marks.appendChild(m);
    });

    // preset keys, like a car radio: press one and the needle travels there; the key stays down while on that station
    var keys = S.map(function (s, i) {
        var k = document.createElement("button"); k.type = "button"; k.className = "rd-key"; k.textContent = i + 1;
        k.setAttribute("aria-label", UI.preset + " " + (i + 1) + ": " + s.f.toFixed(1) + " MHz, " + s.title); k.title = s.f.toFixed(1) + " · " + s.title;
        k.addEventListener("click", function () { setF(s.f, true); });
        keysEl.appendChild(k); return k;
    });

    var f = S[0].f, target = f, on = false, knobDeg = 0, raf = 0, last = 0, settleT = 0;
    function nearest(x) { var b = S[0]; S.forEach(function (s) { if (Math.abs(s.f - x) < Math.abs(b.f - x)) b = s; }); return b; }
    function signal(x) { var s = nearest(x), d = Math.abs(s.f - x) / CAPTURE; if (d >= 1) return 0; d = 1 - d; return d * d * (3 - 2 * d); }

    /* ---------- audio: one element for the programme, generated static, one small graph ---------- */
    var A = null, el = new Audio(); el.preload = "none"; el.loop = true; el.crossOrigin = "anonymous";
    function graph() {
        if (A) return A;
        var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        var ctx = new AC(), master = ctx.createGain(), prog = ctx.createGain(), hiss = ctx.createGain(), bp = ctx.createBiquadFilter();
        master.gain.value = .9; prog.gain.value = 0; hiss.gain.value = 0;
        ctx.createMediaElementSource(el).connect(prog); prog.connect(master);
        var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = buf.getChannelData(0);
        for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        var n = ctx.createBufferSource(); n.buffer = buf; n.loop = true;
        bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = .5;
        n.connect(bp); bp.connect(hiss); hiss.connect(master); master.connect(ctx.destination); n.start();
        A = { ctx: ctx, prog: prog, hiss: hiss };
        return A;
    }
    function liveTime(s) { return ((Date.now() - EPOCH) / 1000 + (s.offset || 0)) % s.dur; }
    function mix() {
        if (!A) return;
        var sig = on ? signal(f) : 0, t = A.ctx.currentTime;
        A.prog.gain.setTargetAtTime(on ? Math.pow(sig, 1.5) : 0, t, .04);
        A.hiss.gain.setTargetAtTime(on ? .015 + (1 - sig) * .11 : 0, t, .04);
    }
    // load / join the station the needle rests near, after a short pause so a sweep does not fetch anything
    function tuneAudio() {
        clearTimeout(settleT);
        settleT = setTimeout(function () {
            if (!on) return;
            var s = nearest(f);
            if (Math.abs(s.f - f) > CAPTURE) { if (!el.paused) el.pause(); return; }
            var join = function () {
                try { el.currentTime = liveTime(s); } catch (e) {}
                el.addEventListener("playing", function fix() { el.removeEventListener("playing", fix); if (Math.abs(el.currentTime - liveTime(s)) > 2) try { el.currentTime = liveTime(s); } catch (e) {} });
                var p = el.play(); if (p && p.catch) p.catch(function () {});
            };
            if (el.dataset.id !== s.id) {
                el.dataset.id = s.id; el.src = s.src;
                el.addEventListener("loadedmetadata", function once() { el.removeEventListener("loadedmetadata", once); join(); });
                el.load();
            } else if (el.paused) join();
        }, 150);
    }
    function setPower(v) {
        on = v; power.setAttribute("aria-checked", v);
        box.classList.toggle("rd-on", v);
        if (v) { var a = graph(); if (a) a.ctx.resume(); document.dispatchEvent(new CustomEvent("gw:audio", { detail: "radio" })); tuneAudio(); }
        else { el.pause(); clearTimeout(settleT); if (A) setTimeout(function () { if (!on) A.ctx.suspend(); }, 300); }
        mix(); render();
    }
    document.addEventListener("gw:audio", function (e) { if (e.detail !== "radio" && on) setPower(false); });
    document.addEventListener("visibilitychange", function () { if (document.hidden && on) setPower(false); });

    /* ---------- dial ---------- */
    function render() {
        var w = dial.clientWidth, x = (f - MIN) / (MAX - MIN) * w;
        needle.style.transform = "translateX(" + x.toFixed(1) + "px)";
        knob.style.setProperty("--deg", knobDeg.toFixed(1) + "deg");
        var s = nearest(f), sig = signal(f);
        freqEl.textContent = f.toFixed(1);
        nameEl.textContent = !on ? UI.hint : sig > .35 ? s.title : UI.static;
        lamp.style.opacity = on ? (.15 + .85 * sig).toFixed(2) : 0;
        keys.forEach(function (k, i) { k.setAttribute("aria-pressed", Math.abs(S[i].f - f) < .01); });
        dial.setAttribute("aria-valuenow", f.toFixed(1));
        dial.setAttribute("aria-valuetext", f.toFixed(1) + " MHz" + (sig > .35 ? ", " + s.title : ""));
    }
    function setF(x, glide) {
        x = Math.max(MIN, Math.min(MAX, x));
        target = x;
        if (!glide || calm) { knobDeg += (x - f) * 72; f = x; render(); mix(); tuneAudio(); return; }
        if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
    }
    function step(now) {   // glide the needle (clicks, keys, the automatic fine-tune)
        raf = 0;
        var k = 1 - Math.exp(-(now - last) / 120); last = now;
        var nf = Math.abs(target - f) < .005 ? target : f + (target - f) * k;
        knobDeg += (nf - f) * 72; f = nf;
        render(); mix();
        if (f !== target) raf = requestAnimationFrame(step); else if (!sliding && !drag) settle(); else tuneAudio();
    }
    // automatic fine tuning: released close to a station, the needle settles onto it
    function settle() { var s = nearest(f); if (Math.abs(s.f - f) < .25 && s.f !== f) setF(s.f, true); else tuneAudio(); }

    // knob: drag around its centre; 360° turns 5 MHz
    var drag = null;
    function angle(e) { var r = knob.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; }
    knob.addEventListener("pointerdown", function (e) { e.preventDefault(); knob.setPointerCapture(e.pointerId); drag = { a: angle(e) }; });
    knob.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var a = angle(e), d = a - drag.a; if (d > 180) d -= 360; if (d < -180) d += 360; drag.a = a;
        setF(f + d / 72, false);
    });
    ["pointerup", "pointercancel"].forEach(function (t) { knob.addEventListener(t, function () { if (drag) { drag = null; settle(); } }); });
    knob.addEventListener("wheel", function (e) { e.preventDefault(); setF(f - e.deltaY * .004, false); clearTimeout(knob._w); knob._w = setTimeout(settle, 220); }, { passive: false });
    knob.addEventListener("keydown", function (e) { dialKeys(e); });
    // dial: click or drag along the scale
    var sliding = false;
    function fromX(e) { var r = dial.getBoundingClientRect(); return MIN + (e.clientX - r.left) / r.width * (MAX - MIN); }
    dial.addEventListener("pointerdown", function (e) { dial.setPointerCapture(e.pointerId); sliding = true; setF(fromX(e), true); });
    dial.addEventListener("pointermove", function (e) { if (sliding) setF(fromX(e), false); });
    ["pointerup", "pointercancel"].forEach(function (t) { dial.addEventListener(t, function () { if (sliding) { sliding = false; settle(); } }); });
    function dialKeys(e) {
        var i = S.indexOf(nearest(f)), x = null;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") x = f + .1;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") x = f - .1;
        else if (e.key === "PageUp") x = (S[i].f > f + .05 ? S[i] : S[Math.min(S.length - 1, i + 1)]).f;
        else if (e.key === "PageDown") x = (S[i].f < f - .05 ? S[i] : S[Math.max(0, i - 1)]).f;
        else if (e.key === "Home") x = MIN; else if (e.key === "End") x = MAX;
        if (x === null) return;
        e.preventDefault(); setF(x, true);
    }
    dial.addEventListener("keydown", dialKeys);
    power.addEventListener("click", function () { setPower(!on); });
    addEventListener("resize", render);
    render();
})();
