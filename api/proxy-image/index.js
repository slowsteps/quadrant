// Known non-existent domain to get the default "globe" icon
const DEFAULT_FAVICON_URL = 'https://www.google.com/s2/favicons?domain=non-existent-domain-12345.com&sz=128';

export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        // Parallel fetch: Target URL and Default URL (for comparison)
        // Note: In a real prod env, we'd cache the default buffer.
        const [targetRes, defaultRes] = await Promise.all([
            fetch(decodeURIComponent(url)),
            fetch(DEFAULT_FAVICON_URL)
        ]);

        if (!targetRes.ok) {
            return res.status(targetRes.status).json({ error: `Failed to fetch image: ${targetRes.statusText}` });
        }

        const targetBuffer = await targetRes.arrayBuffer();
        const defaultBuffer = await defaultRes.arrayBuffer();

        // Compare buffers
        if (targetBuffer.byteLength === defaultBuffer.byteLength) {
            if (Buffer.from(targetBuffer).equals(Buffer.from(defaultBuffer))) {
                // It matches the default globe -> Treat as Not Found
                return res.status(404).json({ error: 'Image is default Google favicon' });
            }
        }

        const contentType = targetRes.headers.get('content-type') || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow usage from PPT export
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        res.send(Buffer.from(targetBuffer));
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
