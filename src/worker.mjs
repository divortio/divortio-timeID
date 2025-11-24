export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        // Serve the index.html for the root path
        if (url.pathname === "/") {
            return env.ASSETS.fetch(new Request(new URL("/index.html", request.url), request));
        }
        // Try to serve other static assets (like docs if needed) or 404
        try {
            return await env.ASSETS.fetch(request);
        } catch (e) {
            return new Response("Not Found", { status: 404 });
        }
    },
};