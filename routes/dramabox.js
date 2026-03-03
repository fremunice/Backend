import { Router } from 'express';
import { latest, search, linkStream, trendings, foryou, populersearch, randomdrama, vip, detail, dubindo } from '../lib/dramabox.js';
const router = Router();

// --- Helper Function untuk Error Handling ---
const handleRequest = async (handler, req, res) => {
    try {
        const result = await handler(req);
        res.json(result);
    } catch (error) {
        console.error("API Error:", error.message);
        res.status(500).json({ error: 'IP terkena limit, silakan tunggu beberapa menit dan coba lagi', message: error.message });
    }
};

// --- Dramabox Routes ---
// Contoh: GET /api/dramabox/latest
router.get('/dramabox/latest', (req, res) => {
    handleRequest(latest, req, res);
});

// // Contoh: GET /api/dramabox/trending
// router.get('/dramabox/trending', (req, res) => {
//     handleRequest(trending, req, res);
// });

// Contoh: GET /api/dramabox/search?query=namadrama
router.get('/dramabox/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Parameter "query" dibutuhkan' });
    handleRequest(() => search(query), req, res);
});

// // Contoh: GET /api/melolo/detail/12345
// router.get('/melolo/detail/:seriesId', (req, res) => {
//     const { seriesId } = req.params;
//     handleRequest(() => meloloDetail(seriesId), req, res);
// });

// Contoh: GET /api/dramabox/allepisode?bookId=12345
router.get('/dramabox/allepisode', (req, res) => {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'Parameter "bookId" dibutuhkan' });
    handleRequest(() => linkStream(bookId), req, res);
});

router.get('/dramabox/trending', (req, res) => {
    handleRequest(trendings, req, res);
});

router.get('/dramabox/foryou', (req, res) => {
    handleRequest(foryou, req, res);
});

router.get('/dramabox/populersearch', (req, res) => {
    handleRequest(populersearch, req, res);
});

router.get('/dramabox/randomdrama', (req, res) => {
    handleRequest(randomdrama, req, res);
});

router.get('/dramabox/vip', (req, res) => {
    handleRequest(vip, req, res);
});

router.get('/dramabox/detail', (req, res) => {
    const { bookId } = req.query;
    if (!bookId) return res.status(400).json({ error: 'Parameter "bookId" dibutuhkan' });
    handleRequest(() => detail(bookId), req, res);
});

router.get('/dramabox/dubindo', (req, res) => {
  let { classify, page } = req.query;

  if (!classify) {
    return res.status(400).json({
      error: 'Parameter classify dibutuhkan terpopuler atau terbaru'
    });
  }

  // normalize
  classify = classify.toLowerCase();

  // mapping classify ke angka
  let classifyCode;
  if (classify === 'terpopuler') {
    classifyCode = 1;
  } else if (classify === 'terbaru') {
    classifyCode = 2;
  } else {
    return res.status(400).json({
      error: 'Parameter classify harus terpopuler atau terbaru'
    });
  }

  // page default 1 dan pastikan integer
  page = parseInt(page) || 1;

  handleRequest(() => dubindo(classifyCode, page), req, res);
});

export default router;
