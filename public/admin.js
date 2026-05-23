(function () {
    "use strict";

    const WORKER_URL = "https://0xgarfield-cms.dark-dawn-567b.workers.dev";
    let sessionToken = null;

    const lang = document.documentElement.lang === "zh-Hans" ? "zh" : "en";
    const editables = Array.from(document.querySelectorAll("[data-editable]"));
    if (!editables.length) return;

    async function authenticate() {
        const pw = prompt("Password:");
        if (!pw) return false;
        try {
            const res = await fetch(WORKER_URL + "/api/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: pw })
            });
            if (!res.ok) { alert("Auth failed."); return false; }
            const data = await res.json();
            sessionToken = data.token;
            return true;
        } catch (e) {
            alert("Cannot reach CMS worker.");
            return false;
        }
    }

    function enterEditMode() {
        document.body.classList.add("cms-active");

        editables.forEach((el) => {
            el.setAttribute("contenteditable", "true");
            el.classList.add("cms-editable");
        });

        const bar = document.createElement("div");
        bar.className = "cms-bar";
        bar.innerHTML =
            '<span class="cms-bar-label">Editing</span>' +
            '<button class="cms-btn cms-btn-save" type="button">Save</button>' +
            '<button class="cms-btn cms-btn-cancel" type="button">Cancel</button>';
        document.body.appendChild(bar);

        bar.querySelector(".cms-btn-save").addEventListener("click", save);
        bar.querySelector(".cms-btn-cancel").addEventListener("click", exitEditMode);
    }

    function exitEditMode() {
        document.body.classList.remove("cms-active");
        editables.forEach((el) => {
            el.removeAttribute("contenteditable");
            el.classList.remove("cms-editable");
        });
        const bar = document.querySelector(".cms-bar");
        if (bar) bar.remove();
    }

    function collectChanges() {
        const changes = {};
        editables.forEach((el) => {
            const key = el.dataset.editable;
            const text = el.textContent.trim();
            changes[key] = text;
        });
        return changes;
    }

    async function save() {
        const changes = collectChanges();
        const btn = document.querySelector(".cms-btn-save");
        btn.textContent = "Saving...";
        btn.disabled = true;

        try {
            const res = await fetch(WORKER_URL + "/api/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + sessionToken
                },
                body: JSON.stringify({ lang, changes })
            });
            if (!res.ok) {
                const err = await res.text();
                alert("Save failed: " + err);
                btn.textContent = "Save";
                btn.disabled = false;
                return;
            }
            localStorage.setItem("cms_pending_" + lang, JSON.stringify(changes));
            btn.textContent = "Saved";
            setTimeout(() => exitEditMode(), 1200);
        } catch (e) {
            alert("Network error.");
            btn.textContent = "Save";
            btn.disabled = false;
        }
    }

    // Inject minimal styles for edit mode.
    const style = document.createElement("style");
    style.textContent = [
        ".cms-editable { outline: 2px dashed rgba(0,120,255,0.4); outline-offset: 4px; min-height: 1em; }",
        ".cms-editable:focus { outline-color: rgba(0,120,255,0.8); background: rgba(0,120,255,0.04); }",
        ".cms-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;",
        "  display: flex; align-items: center; gap: 12px; padding: 10px 20px;",
        "  background: #1a1a1a; color: #fff; font: 14px/1 system-ui, sans-serif; }",
        ".cms-bar-label { flex: 1; opacity: 0.7; }",
        ".cms-btn { border: none; border-radius: 6px; padding: 8px 18px; font: inherit; cursor: pointer; }",
        ".cms-btn-save { background: #0078ff; color: #fff; }",
        ".cms-btn-save:disabled { opacity: 0.5; }",
        ".cms-btn-cancel { background: #333; color: #ccc; }"
    ].join("\n");
    document.head.appendChild(style);

    // Entry point.
    authenticate().then((ok) => {
        if (ok) enterEditMode();
    });
})();
