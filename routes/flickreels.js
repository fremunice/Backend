import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { getFlickReelsLatest, getFlickReelsForYou, getFlickReelsDetailandAllEpisode, searchFlickReels, getFlickReelsHotRank } from '../lib/flickreels.js';

const router = Router();

// allow cors
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    
    next();
});

// --- Konfigurasi File Blacklist ---
const BLACKLIST_FILE = path.join(process.cwd(), 'blacklist.json');

// --- DAFTAR IP YANG DIKECUALIKAN (WHITELIST) ---
// Masukkan IP servermu atau IP admin di sini agar tidak kena limit
const WHITELISTED_IPS = process.env.WHITELIST_IPS
  ? process.env.WHITELIST_IPS.split(',')
  : [];

// Pastikan file blacklist.json ada
if (!fs.existsSync(BLACKLIST_FILE)) {
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify([]));
}

// Helper: Baca Blacklist
const getBlacklist = () => {
    try {
        const data = fs.readFileSync(BLACKLIST_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};

// Helper: Tambah ke Blacklist
const addToBlacklist = (ip) => {
    // Double check: Jangan blacklist jika IP ada di whitelist
    if (WHITELISTED_IPS.includes(ip)) return;

    const list = getBlacklist();
    if (!list.includes(ip)) {
        list.push(ip);
        fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(list, null, 2));
        console.log(`[BLACKLIST] IP ${ip} telah diblacklist permanen.`);
    }
};

// --- Helper untuk Mendapatkan Real IP (VPS NAT / Cloudflare Fix) ---
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    if (req.headers['cf-connecting-ip']) return req.headers['cf-connecting-ip'];
    return req.connection.remoteAddress || req.socket.remoteAddress || req.ip;
};

// --- Middleware 1: Cek Apakah IP Sudah Ada di Blacklist ---
const checkBlacklist = (req, res, next) => {
    const ip = getClientIp(req);

    // [WHITELIST CHECK] Jika IP ada di whitelist, langsung lolos!
    if (WHITELISTED_IPS.includes(ip)) {
        return next();
    }

    const blacklist = getBlacklist();
    if (blacklist.includes(ip)) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'IP Anda telah diblacklist karena aktivitas mencurigakan. Jika ingin bebas menggunakan API silakan beli salah satu source code dari API ini: https://lynk.id/sansekai'
        });
    }
    next();
};

// --- Middleware 2: Trigger Blacklist (60 hit / 1 menit) ---
const blacklistTrigger = rateLimit({
    windowMs: 1 * 60 * 1000, 
    limit: 60,
    standardHeaders: false,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    
    // [WHITELIST SKIP] Jangan hitung limit jika IP Whitelist
    skip: (req, res) => WHITELISTED_IPS.includes(getClientIp(req)),

    handler: (req, res) => {
        const ip = getClientIp(req);
        addToBlacklist(ip);
        res.status(403).json({
            error: 'Banned',
            message: 'Anda terdeteksi melakukan spamming. IP Anda telah diblacklist permanen. Jika ingin bebas menggunakan API silakan beli salah satu source code dari API ini: https://lynk.id/sansekai'
        });
    }
});

// --- Middleware 3: Rate Limit Normal (15 hit / 1 menit) ---
const standardLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),

    // [WHITELIST SKIP] Jangan hitung limit jika IP Whitelist
    skip: (req, res) => WHITELISTED_IPS.includes(getClientIp(req)),

    message: {
        error: 'Terlalu Banyak Permintaan',
        message: 'Batas request tercapai (15 hit/menit). Tunggu sebentar. Jika ingin bebas menggunakan API silakan beli salah satu source code dari API ini: https://lynk.id/sansekai'
    },
    handler: (req, res, next, options) => {
        const ip = getClientIp(req);
        console.log(`[LIMIT] Rate limit exceeded for IP: ${ip}`);
        res.status(options.statusCode).json(options.message);
    }
});

// --- Urutan Eksekusi Middleware ---
router.use(checkBlacklist);
router.use(blacklistTrigger);
router.use(standardLimiter);

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

// --- Router FlickReels ---
// Contoh: GET /api/flickreels/latest
router.get('/flickreels/latest', (req, res) => {
    console.log('[FlickReels] SUCCESS GET LATEST');
    handleRequest(getFlickReelsLatest, req, res);
});

// Contoh: GET /api/flickreels/foryou
router.get('/flickreels/foryou', (req, res) => {
    console.log('[FlickReels] SUCCESS GET FORYOU');
    handleRequest(getFlickReelsForYou, req, res);
});

// Contoh: GET /api/flickreels/detailandallepisode?id=
router.get('/flickreels/detailandallepisode', (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Parameter id dibutuhkan' });
    console.log('[FlickReels] SUCCESS GET DETAIL AND ALLEPISODE');
    handleRequest(() => getFlickReelsDetailandAllEpisode(id), req, res);
});

// Contoh: GET /api/flickreels/search?query=
router.get('/flickreels/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Parameter query dibutuhkan' });
    console.log('[FlickReels] SUCCESS GET SEARCH');
    handleRequest(() => searchFlickReels(query), req, res);
});

// Contoh: GET /api/flickreels/hotrank
router.get('/flickreels/hotrank', (req, res) => {
    console.log('[FlickReels] SUCCESS GET HOTRANK');
    handleRequest(getFlickReelsHotRank, req, res);
});

export default router;
