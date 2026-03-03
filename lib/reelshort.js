/**
 * ReelShort API Library
 * 
 * Clean functions for:
 * - getHallInfo: Get home/hall info
 * - getDetail: Get book/drama detail
 * - getAllEpisodes: Get all episodes with play URLs and resolution options
 * 
 * Auto-generates: sign, requestTime
 * Auto-decrypts: play_url
 */

import crypto from 'crypto';
import axios from 'axios';
import qs from 'qs';
import pako from 'pako';
import CryptoJS from 'crypto-js';
import { Base64 } from 'js-base64';

// ============================================
// CONFIGURATION
// ============================================

const SIGN_SECRET_KEY = 'zj8N6zKEdrK8d1MxwHSvExdgQ868q1yT';
const AES_KEY = 'VvRSNGFynLBW7aCP';
const AES_IV = 'gLn8sxqpzyNjehDP';
const APK_SIGNATURE_HASH = '32A8B9DC48FDD1F64A1C9DFBF07F87F9';

// Premium Account Credentials
const USER_CONFIG = {
    uid: '592831694', // premium
    session: '44d040d1b12b31b5d29337696a994723', // premium
    devId: '1eb06d3de357be4f', // premium
    lang: 'in',
    channelId: 'AVG10003',
    clientVer: '3.5.20',
    apiVersion: '1.4.8'
};

const BASE_URL = 'https://v-api.crazymaplestudios.com';

// ============================================
// INTERNAL CRYPTO FUNCTIONS
// ============================================

function generateSign(params) {
    const sortedKeys = Object.keys(params).sort();
    const signString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    return crypto.createHmac('sha256', SIGN_SECRET_KEY)
        .update(signString)
        .digest('hex');
}

function generateTs() {
    return Math.floor(Date.now() / 1000).toString();
}

function generateClientTraceId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000000);
    return `${timestamp}${random}`;
}

function generateRequestTime() {
    const timestamp = Date.now();
    const plaintext = `${timestamp}_${APK_SIGNATURE_HASH}`;
    
    const cipher = crypto.createCipheriv('aes-128-cbc', AES_KEY, AES_IV);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    return encrypted;
}

/**
 * Decrypt play_info using CryptoJS (same method as tes.js)
 */
function decryptPlayUrl(encryptedData) {
    if (!encryptedData) return null;
    
    try {
        const key = CryptoJS.enc.Utf8.parse(AES_KEY);
        const iv = CryptoJS.enc.Utf8.parse(AES_IV);
        
        // AES decrypt
        const decrypt = CryptoJS.AES.decrypt(encryptedData, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC
        });
        
        // Convert to Base64 string
        const base64Result = decrypt.toString(CryptoJS.enc.Base64);
        
        // Decode base64
        const decoded = Base64.decode(base64Result);
        
        // Convert to binary buffer
        const binaryStr = Buffer.from(decoded, 'base64').toString('binary');
        const charCodes = binaryStr.split('').map(c => c.charCodeAt(0));
        const uint8Array = new Uint8Array(charCodes);
        
        // Ungzip
        const unzipped = pako.ungzip(uint8Array, { to: 'string' });
        
        return unzipped;
    } catch (e) {
        return encryptedData; // Return original on failure
    }
}

// ============================================
// INTERNAL API REQUEST HELPER
// ============================================

async function makeRequest(endpoint, bodyParams = {}) {
    const ts = generateTs();
    const clientTraceId = generateClientTraceId();
    const requestTime = generateRequestTime();
    
    const headerParams = {
        apiVersion: USER_CONFIG.apiVersion,
        channelId: USER_CONFIG.channelId,
        clientTraceId: clientTraceId,
        clientVer: USER_CONFIG.clientVer,
        devId: USER_CONFIG.devId,
        lang: USER_CONFIG.lang,
        requestTime: requestTime,
        session: USER_CONFIG.session,
        ts: ts,
        uid: USER_CONFIG.uid
    };
    
    const allParams = { ...bodyParams, ...headerParams };
    const sign = generateSign(allParams);
    
    const config = {
        method: 'POST',
        url: `${BASE_URL}${endpoint}`,
        headers: {
            'User-Agent': 'okhttp/4.11.0',
            'Accept-Encoding': 'br,gzip',
            'Content-Type': 'application/x-www-form-urlencoded',
            'requesttime': requestTime,
            'uid': USER_CONFIG.uid,
            'channelid': USER_CONFIG.channelId,
            'ts': ts,
            'apiversion': USER_CONFIG.apiVersion,
            'session': USER_CONFIG.session,
            'lang': USER_CONFIG.lang,
            'devid': USER_CONFIG.devId,
            'clientver': USER_CONFIG.clientVer,
            'clienttraceid': clientTraceId,
            'sign': sign
        },
        data: qs.stringify(bodyParams),
        responseType: 'arraybuffer'
    };
    
    const response = await axios.request(config);
    let responseData = response.data;
    
    if (Buffer.isBuffer(responseData)) {
        try {
            responseData = pako.ungzip(responseData, { to: 'string' });
        } catch (e) {
            responseData = responseData.toString('utf8');
        }
    }
    
    return JSON.parse(responseData);
}

// ============================================
// PUBLIC API FUNCTIONS
// ============================================

/**
 * Get Hall/Home Info
 * @param {Object} options - Optional parameters
 * @returns {Object} Hall info data
 */
async function getHallInfo(options = {}) {
    const bodyParams = {
        abtest_group: options.abtest_group || 'newHall_4000453',
        action_type: options.action_type || '100',
        is_no_first_req: options.is_no_first_req || '1',
        no_continue_watch: options.no_continue_watch || '1',
        source_switch: options.source_switch || '0',
        tab_id: options.tab_id || '0',
        widescreen: options.widescreen || '0'
    };
    
    const result = await makeRequest('/api/ms/hall/infoV4', bodyParams);
    
    if (result.code === 0 && result.data) {
        return {
            success: true,
            data: result.data
        };
    }
    
    return { success: false, error: result.msg };
}

/**
 * Get Book/Drama Detail
 * @param {string} bookId - Book ID
 * @returns {Object} Book detail with chapter list
 */
async function getDetail(bookId) {
    const bodyParams = {
        book_id: bookId,
        from: '0',
        play_details: '0'
    };
    
    const result = await makeRequest('/api/video/book/getBookDetailV2', bodyParams);
    
    if (result.code === 0 && result.data) {
        const book = result.data.retBook || {};
        const chapters = result.data.chapterList?.chapter_lists || [];
        
        return {
            success: true,
            bookId: book.book_id || book.t_book_id,
            title: book.book_title,
            cover: book.book_pic,
            description: book.special_desc,
            totalEpisodes: chapters.length,
            chapters: chapters.map((ch, idx) => ({
                index: idx + 1,
                chapterId: ch.chapter_id,
                title: ch.chapter_title || `Episode ${idx + 1}`,
                isLocked: ch.is_lock === 1
            }))
        };
    }
    
    return { success: false, error: result.msg };
}

/**
 * Get Chapter Content (single episode)
 * @param {string} bookId - Book ID
 * @param {string|number} episodeOrChapterId - Episode number (1-based) or Chapter ID string
 * @returns {Object} Chapter content with play URL
 */
async function getChapterContent(bookId, episodeOrChapterId) {
    let chapterId = episodeOrChapterId;
    
    // If number is passed, get chapterId from episode number
    if (typeof episodeOrChapterId === 'number') {
        const detail = await getDetail(bookId);
        if (!detail.success) {
            return { success: false, error: detail.error };
        }
        
        const episodeIndex = episodeOrChapterId - 1; // Convert to 0-based
        if (episodeIndex < 0 || episodeIndex >= detail.chapters.length) {
            return { success: false, error: `Episode ${episodeOrChapterId} not found. Total: ${detail.chapters.length}` };
        }
        
        chapterId = detail.chapters[episodeIndex].chapterId;
    }
    
    const bodyParams = {
        book_id: bookId,
        chapter_id: chapterId,
        is_hand_pay: '0',
        is_wait_free_unlock: '0',
        set_auto: '0'
    };
    
    const result = await makeRequest('/api/video/book/getChapterContent', bodyParams);
    
    if (result.code === 0 && result.data) {
        const data = result.data;
        const encryptedUrl = data.play_info;
        const decryptedData = decryptPlayUrl(encryptedUrl);
        
        // Parse decrypted JSON to get URLs
        let playUrls = [];
        let primaryUrl = null;
        
        if (decryptedData) {
            try {
                const parsed = JSON.parse(decryptedData);
                if (Array.isArray(parsed)) {
                    playUrls = parsed.map(item => ({
                        url: item.PlayURL?.replace(/\\\//g, '/'),
                        encode: item.Encode,
                        quality: item.Dpi,
                        bitrate: item.Bitrate
                    }));
                    // Get highest quality as primary
                    if (playUrls.length > 0) {
                        const sorted = [...playUrls].sort((a, b) => (b.quality || 0) - (a.quality || 0));
                        primaryUrl = sorted[0]?.url;
                    }
                }
            } catch (e) {
                // If not JSON, use as-is
                primaryUrl = decryptedData;
            }
        }
        
        return {
            success: true,
            isLocked: data.is_lock === 1,
            videoList: playUrls
        };
    }
    
    return { success: false, error: result.msg };
}

/**
 * Get All Episodes with Play URLs and Resolution Options
 * @param {string} bookId - Book ID
 * @returns {Object} All episodes with decrypted play URLs
 */
async function getAllEpisodes(bookId) {
    // First get book detail
    const detail = await getDetail(bookId);
    
    if (!detail.success) {
        return { success: false, error: detail.error };
    }
    
    const episodes = [];
    
    // Fetch each episode content
    for (const chapter of detail.chapters) {
        const content = await getChapterContent(bookId, chapter.chapterId);
        
        if (content.success) {
            episodes.push({
                episode: chapter.index,
                chapterId: chapter.chapterId,
                title: chapter.title,
                isLocked: content.isLocked,
                videoList: content.videoList
            });
        } else {
            episodes.push({
                episode: chapter.index,
                chapterId: chapter.chapterId,
                title: chapter.title,
                isLocked: true,
                videoList: [],
                error: content.error
            });
        }
    }
    
    return {
        success: true,
        bookId: detail.bookId,
        title: detail.title,
        totalEpisodes: detail.totalEpisodes,
        episodes: episodes
    };
}

/**
 * Search for dramas by keyword
 * @param {string} keyword - Search keyword
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 10)
 * @returns {Object} Search results
 */
async function searchRS(keyword, page = 1, limit = 10) {
    const bodyParams = {
        word: keyword,
        page: page.toString(),
        limit: limit.toString()
    };
    
    const result = await makeRequest('/api/video/search/search', bodyParams);
    
    if (result.code === 0 && result.data) {
        const items = result.data.lists || result.data.list || [];
        
        return {
            success: true,
            keyword: keyword,
            page: page,
            total: result.data.total || items.length,
            results: items.map(item => ({
                bookId: item.book_id || item.t_book_id,
                title: item.book_title,
                cover: item.book_pic,
                description: item.special_desc,
                chapterCount: item.chapter_count,
                tag: item.tag
            }))
        };
    }
    
    return { success: false, error: result.msg };
}

/**
 * Get Indonesian Dubbed dramas
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Results per page (default: 24)
 * @returns {Object} List of dubbed dramas
 */
async function getDubIndo(page = 1, pageSize = 24) {
    // Conditions for dub indo filter (base64 encoded with newlines as in original request)
    const conditions = `W3siY2F0ZWdvcnlfdHlwZSI6NCwiaXNfc2hvd19hbGwiOnRydWUsInNvcnRfbnVtIjoxfSx7ImNh
dGVnb3J5X3R5cGUiOjMsImlzX3Nob3dfYWxsIjp0cnVlLCJzb3J0X251bSI6Mn0seyJjYXRlZ29y
eV90eXBlIjoxLCJpc19zaG93X2FsbCI6ZmFsc2UsImxpc3QiOlt7ImlkIjoiMSJ9XSwic29ydF9u
dW0iOjN9LHsiY2F0ZWdvcnlfdHlwZSI6MiwiaXNfc2hvd19hbGwiOnRydWUsInNvcnRfbnVtIjo0
fSx7ImNhdGVnb3J5X3R5cGUiOjQsImlzX3Nob3dfYWxsIjp0cnVlLCJzb3J0X251bSI6NX1d
`;
    
    // Generate random show_session_id
    const showSessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    
    const bodyParams = {
        sort_type: '0',
        page_no: page.toString(),
        page_size: pageSize.toString(),
        last_book_id: '',
        show_session_id: showSessionId,
        tab_id: '0',
        bs_id: '41005334',
        conditions: 'W3siY2F0ZWdvcnlfdHlwZSI6NCwiaXNfc2hvd19hbGwiOnRydWUsInNvcnRfbnVtIjoxfSx7ImNh\ndGVnb3J5X3R5cGUiOjMsImlzX3Nob3dfYWxsIjp0cnVlLCJzb3J0X251bSI6Mn0seyJjYXRlZ29y\neV90eXBlIjoxLCJpc19zaG93X2FsbCI6ZmFsc2UsImxpc3QiOlt7ImlkIjoiMSJ9XSwic29ydF9u\ndW0iOjN9LHsiY2F0ZWdvcnlfdHlwZSI6MiwiaXNfc2hvd19hbGwiOnRydWUsInNvcnRfbnVtIjo0\nfSx7ImNhdGVnb3J5X3R5cGUiOjQsImlzX3Nob3dfYWxsIjp0cnVlLCJzb3J0X251bSI6NX1d\n',
        action_type: '100'
    };
    
    const result = await makeRequest('/api/ms/hall/getBooksByTagV4', bodyParams);
    
    if (result.code === 0 && result.data) {
        const items = result.data.lists || result.data.list || [];
        
        return {
            success: true,
            page: page,
            pageSize: pageSize,
            hasMore: result.data.has_more || false,
            total: items.length,
            results: items.map(item => ({
                bookId: item.book_id || item.t_book_id,
                title: item.book_title,
                cover: item.book_pic,
                description: item.special_desc,
                chapterCount: item.chapter_count,
                tag: item.tag
            }))
        };
    }
    
    return { success: false, error: result.msg };
}

// ============================================
// EXPORTS
// ============================================

export {
    getHallInfo,
    getDetail,
    getChapterContent,
    getAllEpisodes,
    searchRS,
    decryptPlayUrl,
    USER_CONFIG
};
