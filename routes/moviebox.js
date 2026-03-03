import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { movieboxHomepage, movieboxTrending, movieboxSearch, movieboxInfo, movieboxSources, movieboxStreamInfo, validateStreamUrl, sanitizeFilename, generateDownloadFilename, movieboxDownload, movieboxGetStream, getDownloadHeaders, movieboxSaveToFile, SubjectType, MIRROR_HOSTS } from "../lib/moviebox.js";

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
const WHITELISTED_IPS = [
    '104.36.20.178' 
];

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

// --- Router MovieBox ---
// Contoh: GET /api/moviebox/homepage
router.get('/moviebox/homepage', (req, res) => {
    console.log('[MovieBox] SUCCESS GET LATEST');
    handleRequest(movieboxHomepage, req, res);
});

// Contoh: GET /api/moviebox/trending
router.get('/moviebox/trending', (req, res) => {
    let { page } = req.query;
    page = parseInt(page) || 0;
    console.log('[MovieBox] SUCCESS GET TRENDING');
    handleRequest(() => movieboxTrending(page, 10), req, res);
});

// Contoh: GET /api/moviebox/search?query=
router.get('/moviebox/search', (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Parameter query dibutuhkan' });
    console.log('[MovieBox] SUCCESS GET SEARCH');
    handleRequest(() => movieboxSearch(query), req, res);
});

// Contoh: GET /api/moviebox/detail?subjectId=
router.get('/moviebox/detail', (req, res) => {
    const { subjectId } = req.query;
    if (!subjectId) return res.status(400).json({ error: 'Parameter subjectId dibutuhkan' });
    console.log('[MovieBox] SUCCESS GET DETAIL');
    handleRequest(() => movieboxInfo(subjectId), req, res);
});

// Contoh: GET /api/moviebox/sources?subjectId=&season=0&episode=0
router.get('/moviebox/sources', (req, res) => {
    let { subjectId, season, episode } = req.query;
    if (!subjectId) return res.status(400).json({ error: 'Parameter subjectId dibutuhkan' });
    season = parseInt(season) || 0;
    episode = parseInt(episode) || 0;
    console.log('[MovieBox] SUCCESS GET SOURCES');
    handleRequest(() => movieboxSources(subjectId, season, episode), req, res);
});

// GET - User langsung paste URL di browser (tidak bisa via Swagger)
// Contoh: GET /api/moviebox/auto-download?url=https://...mp4?sign=xxx&t=xxx
router.get('/moviebox/auto-download', async (req, res) => {
    try {
        let { url, sign, t } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'Parameter url dibutuhkan' });
        }
        
        // Smart URL reconstruction
        let fullUrl = url;
        
        if (url.includes('sign=') && t && !url.includes('&t=')) {
            fullUrl = `${url}&t=${t}`;
        }
        else if (sign && t && !url.includes('sign=')) {
            fullUrl = url.includes('?') 
                ? `${url}&sign=${sign}&t=${t}`
                : `${url}?sign=${sign}&t=${t}`;
        }
        
        if (!validateStreamUrl(fullUrl)) {
            return res.status(400).json({ error: 'URL tidak valid atau tidak diizinkan' });
        }
        
        console.log('[MovieBox] STARTING DOWNLOAD STREAM');
        console.log('[MovieBox] Full URL:', fullUrl);
        
        const streamInfo = await movieboxStreamInfo(fullUrl);
        const filename = generateDownloadFilename(url);
        const { stream, contentType, contentLength } = await movieboxGetStream(fullUrl);
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Accept-Ranges', 'bytes');
        
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        
        console.log(`[MovieBox] Streaming: ${filename} (${contentLength} bytes)`);
        stream.pipe(res);
        
        stream.on('error', (err) => {
            console.error('[MovieBox] Stream error:', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Gagal streaming video' });
            }
        });
        
    } catch (error) {
        console.error('[MovieBox] Download error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Gagal mengunduh video', message: error.message });
        }
    }
});

// GET /api/moviebox/auto-download - Return instructions and download URL
// router.get('/moviebox/auto-download', async (req, res) => {
//     try {
//         let { url, sign, t } = req.query;
        
//         if (!url) {
//             return res.status(400).json({ error: 'Parameter url dibutuhkan' });
//         }
        
//         // Smart URL reconstruction
//         let fullUrl = url;
        
//         if (url.includes('sign=') && t && !url.includes('&t=')) {
//             fullUrl = `${url}&t=${t}`;
//         }
//         else if (sign && t && !url.includes('sign=')) {
//             fullUrl = url.includes('?') 
//                 ? `${url}&sign=${sign}&t=${t}`
//                 : `${url}?sign=${sign}&t=${t}`;
//         }
        
//         if (!validateStreamUrl(fullUrl)) {
//             return res.status(400).json({ error: 'URL tidak valid atau tidak diizinkan' });
//         }
        
//         // Get file info
//         const streamInfo = await movieboxStreamInfo(fullUrl);
        
//         // Build the direct download URL
//         const baseUrl = req.protocol + '://' + req.get('host');
//         const downloadUrl = `${baseUrl}/api/moviebox/direct-download?url=${encodeURIComponent(fullUrl)}`;
        
//         res.json({
//             success: true,
//             message: "URL berhasil divalidasi! Buka link di bawah ini di tab/jendela browser baru untuk download video.",
//             instruction: "Copy URL downloadUrl, lalu buka di jendela browser baru",
//             downloadUrl: downloadUrl,
//             fileInfo: {
//                 size: streamInfo.fileSize,
//                 sizeFormatted: `${(streamInfo.fileSize / 1024 / 1024).toFixed(2)} MB`,
//                 contentType: streamInfo.contentType
//             }
//         });
        
//     } catch (error) {
//         console.error('[MovieBox] Download error:', error.message);
//         res.status(500).json({ error: 'Gagal memvalidasi URL', message: error.message });
//     }
// });

// GET /api/moviebox/generate-link-stream-video - Return instructions and download URL
router.get('/moviebox/generate-link-stream-video', async (req, res) => {
    try {
        let { url, sign, t } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'Parameter url dibutuhkan' });
        }
        
        // Smart URL reconstruction
        let fullUrl = url;
        
        if (url.includes('sign=') && t && !url.includes('&t=')) {
            fullUrl = `${url}&t=${t}`;
        }
        else if (sign && t && !url.includes('sign=')) {
            fullUrl = url.includes('?') 
                ? `${url}&sign=${sign}&t=${t}`
                : `${url}?sign=${sign}&t=${t}`;
        }
        
        if (!validateStreamUrl(fullUrl)) {
            return res.status(400).json({ error: 'URL tidak valid atau tidak diizinkan' });
        }
        
        // Get file info
        const streamInfo = await movieboxStreamInfo(fullUrl);
        
        // Build the direct stream URL
        // ganti req.protocol jadi string 'https' bang kalau deploy di production.
        const baseUrl = req.protocol + '://' + req.get('host');
        const streamUrl = `${baseUrl}/api/moviebox/direct-stream?url=${encodeURIComponent(fullUrl)}`;
        
        res.json({
            success: true,
            message: "URL berhasil divalidasi! Buka link di bawah ini di tab/jendela browser baru untuk streaming video.",
            instruction: "Copy URL streamUrl, lalu buka di jendela browser baru",
            streamUrl: streamUrl,
            fileInfo: {
                size: streamInfo.fileSize,
                sizeFormatted: `${(streamInfo.fileSize / 1024 / 1024).toFixed(2)} MB`,
                contentType: streamInfo.contentType
            }
        });
        
    } catch (error) {
        console.error('[MovieBox] Stream error:', error.message);
        res.status(500).json({ error: 'Gagal memvalidasi URL', message: error.message });
    }
});

// GET /api/moviebox/direct-download - Actual download (untuk dibuka langsung di browser)
// router.get('/moviebox/direct-download', async (req, res) => {
//     try {
//         const { url } = req.query;
        
//         if (!url || !validateStreamUrl(url)) {
//             return res.status(400).json({ error: 'URL tidak valid' });
//         }
        
//         const filename = generateDownloadFilename(url);
//         const { stream, contentType, contentLength } = await movieboxGetStream(url);
        
//         res.setHeader('Content-Type', contentType);
//         res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
//         res.setHeader('Accept-Ranges', 'bytes');
        
//         if (contentLength) {
//             res.setHeader('Content-Length', contentLength);
//         }
        
//         stream.pipe(res);
        
//     } catch (error) {
//         console.error('[MovieBox] Direct download error:', error.message);
//         if (!res.headersSent) {
//             res.status(500).json({ error: 'Gagal download video', message: error.message });
//         }
//     }
// });

// GET /api/moviebox/direct-stream - Actual streaming (untuk dibuka langsung di browser)
router.get('/moviebox/direct-stream', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url || !validateStreamUrl(url)) {
            return res.status(400).json({ error: 'URL tidak valid' });
        }
        
        const streamInfo = await movieboxStreamInfo(url);
        const fileSize = streamInfo.fileSize;
        const range = req.headers.range;
        
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunkSize = (end - start) + 1;
            
            const { stream, contentType } = await movieboxGetStream(url, {
                rangeStart: start,
                rangeEnd: end
            });
            
            res.status(206);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', chunkSize);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            res.setHeader('Accept-Ranges', 'bytes');
            
            stream.pipe(res);
            
        } else {
            const { stream, contentType } = await movieboxGetStream(url);
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', fileSize);
            res.setHeader('Accept-Ranges', 'bytes');
            
            stream.pipe(res);
        }
        
    } catch (error) {
        console.error('[MovieBox] Direct stream error:', error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Gagal streaming video', message: error.message });
        }
    }
});

export default router;
