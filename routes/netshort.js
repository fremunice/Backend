import { Router } from 'express';
import { allepisode, search, foryou, theaters } from '../lib/netshort.js';
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

// --- Netshort Routes ---
// Contoh: GET /api/netshort/theaters
router.get('/netshort/theaters', (req, res) => {
    handleRequest(theaters, req, res);
});

// Contoh: GET /api/netshort/foryou
router.get('/netshort/foryou', (req, res) => {
    let { page } = req.query;
    page = parseInt(page) || 1;
    handleRequest(() => foryou(page), req, res);
});

// Contoh: GET /api/netshort/search?query=pewaris
router.get('/netshort/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Parameter "query" dibutuhkan' });
    handleRequest(() => search(query), req, res);
});

// Contoh: GET /api/netshort/allepisode?shortPlayId=1894598206267256834
router.get('/netshort/allepisode', (req, res) => {
    const { shortPlayId } = req.query;
    if (!shortPlayId) return res.status(400).json({ error: 'Parameter "shortPlayId" dibutuhkan' });
    handleRequest(() => allepisode(shortPlayId), req, res);
});

export default router;
