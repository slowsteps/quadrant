export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'Missing URL parameter' });
    }

    try {
        const response = await fetch(decodeURIComponent(url));
        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch image: ${response.statusText}` });
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Allow usage from PPT export
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        res.send(Buffer.from(buffer));
    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
