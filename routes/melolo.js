import { Router } from 'express';
import { meloloSearch, meloloDetail, meloloLinkStream, meloloLatest, meloloTrending, meloloForyou } from '../lib/melolo.js';

const router = Router();

// --- Helper Function untuk Error Handling ---
const handleRequest = async (handler, req, res) => {
    try {
        const result = await handler(req);
        res.json(result);
    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: 'Terjadi kesalahan pada server', message: error.message });
    }
};

// --- Melolo Routes ---
// Contoh: GET /api/melolo/foryou
router.get('/melolo/foryou', (req, res) => {
    let { offset = 20 } = req.query;
    offset = parseInt(offset) || 20;
    if (offset > 100) return res.status(400).json({ error: 'Parameter offset tidak boleh lebih dari 100' });
    handleRequest(() => meloloForyou(offset), req, res);
});

// Contoh: GET /api/melolo/latest
router.get('/melolo/latest', (req, res) => {
    handleRequest(meloloLatest, req, res);
});

// Contoh: GET /api/melolo/trending
router.get('/melolo/trending', (req, res) => {
    handleRequest(meloloTrending, req, res);
});

// Contoh: GET /api/melolo/search?query=namafilm&limit=10&offset=0
router.get('/melolo/search', (req, res) => {
    const { query, limit = 10, offset = 0 } = req.query;
    if (!query) return res.status(400).json({ error: 'Parameter "query" dibutuhkan' });
    handleRequest(() => meloloSearch(query, limit, offset), req, res);
});

// Contoh: GET /api/melolo/detail/12345
router.get('/melolo/detail', (req, res) => {
    const { bookId } = req.query;
    handleRequest(() => meloloDetail(bookId), req, res);
});

// Contoh: GET /api/melolo/stream/67890
router.get('/melolo/stream', (req, res) => {
    const { videoId } = req.query;
    handleRequest(() => meloloLinkStream(videoId), req, res);
});

export default router;
