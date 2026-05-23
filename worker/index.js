const CORS_HEADERS = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
};

function corsOrigin(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = [env.ALLOWED_ORIGIN, "http://localhost:8080", "http://localhost:3000"];
    return allowed.includes(origin) ? origin : env.ALLOWED_ORIGIN;
}

function corsResponse(body, status, request, env) {
    return new Response(body, {
        status,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": corsOrigin(request, env),
            ...CORS_HEADERS
        }
    });
}

async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateToken(env) {
    const raw = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(raw).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiry = Date.now() + 30 * 60 * 1000;
    await env.CMS_KV.put("session:" + token, JSON.stringify({ expiry }), { expirationTtl: 1800 });
    return token;
}

async function validateToken(token, env) {
    const data = await env.CMS_KV.get("session:" + token, "json");
    if (!data) return false;
    return data.expiry > Date.now();
}

async function handleVerify(request, env) {
    const { password } = await request.json();
    const hash = await sha256(password);
    if (hash !== env.CMS_PASSWORD_HASH) {
        return corsResponse(JSON.stringify({ error: "invalid" }), 401, request, env);
    }
    const token = await generateToken(env);
    return corsResponse(JSON.stringify({ token }), 200, request, env);
}

async function githubGet(path, env) {
    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}?ref=${env.GITHUB_BRANCH}`, {
        headers: {
            Authorization: "Bearer " + env.GITHUB_TOKEN,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "0xgarfield-cms"
        }
    });
    if (!res.ok) throw new Error("GitHub GET failed: " + res.status);
    return res.json();
}

async function githubPut(path, content, sha, env) {
    const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}`, {
        method: "PUT",
        headers: {
            Authorization: "Bearer " + env.GITHUB_TOKEN,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "0xgarfield-cms",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "cms: update content-" + path.split("-").pop().replace(".json", ""),
            content: btoa(unescape(encodeURIComponent(content))),
            sha,
            branch: env.GITHUB_BRANCH
        })
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error("GitHub PUT failed: " + res.status + " " + body);
    }
    return res.json();
}

async function handleSave(request, env) {
    const auth = request.headers.get("Authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!await validateToken(token, env)) {
        return corsResponse(JSON.stringify({ error: "unauthorized" }), 401, request, env);
    }

    const { lang, changes } = await request.json();
    if (!lang || !changes || typeof changes !== "object") {
        return corsResponse(JSON.stringify({ error: "bad request" }), 400, request, env);
    }

    const filePath = `config/content-${lang === "zh" ? "zh" : "en"}.json`;

    const file = await githubGet(filePath, env);
    const existing = JSON.parse(decodeURIComponent(escape(atob(file.content.replace(/\n/g, "")))));

    for (const [key, value] of Object.entries(changes)) {
        if (key in existing) {
            existing[key] = value;
        }
    }

    const updated = JSON.stringify(existing, null, 2) + "\n";
    await githubPut(filePath, updated, file.sha, env);

    return corsResponse(JSON.stringify({ ok: true }), 200, request, env);
}

export default {
    async fetch(request, env) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": corsOrigin(request, env),
                    ...CORS_HEADERS
                }
            });
        }

        const url = new URL(request.url);

        if (url.pathname === "/api/verify" && request.method === "POST") {
            return handleVerify(request, env);
        }

        if (url.pathname === "/api/save" && request.method === "POST") {
            return handleSave(request, env);
        }

        return new Response("Not found", { status: 404 });
    }
};
