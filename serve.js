import { serve } from "bun";
import path from "path";
import { readFile } from "fs/promises";

const distDir = path.join(import.meta.dir, "dist");
console.log("✅ Server running on http://dono-03.danbot.host:4493");

serve({
    hostname: "0.0.0.0",
    port: 4493,
    async fetch(req) {
        const url = new URL(req.url);
        let pathname = url.pathname;

        // Default to index.html for root or unknown paths (for SPA routing)
        if (pathname === "/" || !pathname.includes(".")) {
            pathname = "/index.html";
        }

        const filePath = path.join(distDir, pathname);

        try {
            const file = await readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();

            const mimeTypes = {
                ".html": "text/html",
                ".js": "application/javascript",
                ".css": "text/css",
                ".json": "application/json",
                ".png": "image/png",
                ".jpg": "image/jpeg",
                ".svg": "image/svg+xml",
                ".ico": "image/x-icon",
                ".woff2": "font/woff2",
                ".woff": "font/woff",
                ".ttf": "font/ttf",
            };

            return new Response(file, {
                headers: {
                "Content-Type": mimeTypes[ext] || "application/octet-stream",
                },
            });
        } catch {
            return new Response("404 Not Found", { status: 404 });
        }
    },
});