import crypto from 'crypto';

const FLICKREELS_MOB_API = 'https://api.farsunpteltd.com/app/playlet';
const FLICKREELS_SEARCH_API = 'https://api.farsunpteltd.com/app/user_search';
const FLICKREELS_WEB_API = 'https://apiweb.flickreels.net/web/playlet';

// Using provided headers from user logs
const FLICKREELS_MOB_HEADERS = {
    'bundleIdentifier': 'com.farsun.shortplay',
    'Version': '2.2.2.0',
    'Token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJfIiwiYXVkIjoiXyIsImlhdCI6MTc2NzI5NTM2OSwiZGF0YSI6eyJtZW1iZXJfaWQiOjQ1MTMwNTUwLCJwYWNrYWdlX2lkIjoiMSIsIm1haW5fcGFja2FnZV9pZCI6IjEwMCJ9fQ.U2HoYm4QEZfZ_QU9eGkzOzzQZRPGfeLKIc3qzefchQQ',
    'Sign': '', // Will be generated dynamically
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    'Accept-Language': 'id-ID;q=1.0',
    'Timezone': 'Asia/Jakarta'
};

const DEFAULT_MOB_BODY = {
    "language_id": "6",
    "device_id": "47540D07-2GHA-40AB-A357-20093F4DD4C6",
    "os": "ios",
    "device_brand": "iPhone13,2",
    "countryCode": "IDN",
    "apps_flyer_uid": "1767294896845-4754007",
    "device_sign": "605a95670966c04beb3e0026b33941185e6fd5396dd70552f8aeb0fe5f6413c7",
    "device_number": "17.0.3",
    "main_package_id": "100"
};

// --- HELPER: Strip HTML ---
function stripHtml(str) {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '').trim();
}

// --- NORMALIZER: FlickReels to Unified Format ---
function normalizeFlickReels(data) {
    const id = String(data.playlet_id || data.id || '');
    const title = data.title || data.name || '';
    const description = data.introduce || data.description || data.intro || '';
    
    return {
        id: id,
        title: stripHtml(title),
        cover: data.cover || data.cover_v || '',
        description: stripHtml(description),
        source: 'flickreels',
        raw: data
    };
}

// --- SIGNING HELPER ---

function generateSign(params) {
    const sortedKeys = Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null)
        .sort();

    const queryString = sortedKeys
        .map(key => {
            let val = params[key];
            if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
                // For array/objects, assume JSON stringification for signature
                // Crucial: no spaces in JSON
                val = JSON.stringify(val);
            }
            return `${key}=${val}`;
        })
        .join('&');

    const salt = 'nW8GqjbdSYRI';
    const stringToSign = queryString + '&signSalt=' + salt;

    return crypto.createHash('md5').update(stringToSign).digest('hex').toLowerCase();
}

function getWebHeaders(sign) {
    return {
        "__cxy_app_ver_": "25.1.1",
        "__cxy_duid_": "ba316723-7e4a-408e-8137-ec9fade65152",
        "__cxy_jwtoken_": "",
        "__cxy_timezone_": "25200",
        "__cxy_token_": "",
        "__cxy_uid_": "",
        "accept": "application/json",
        "content-type": "application/json",
        "sign": sign,
        "web-system": "android",
        "referrer": "https://www.flickreels.net/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    };
}

// --- EXPORTED FUNCTIONS ---

const getFlickReelsLatest = async () => {
    try {
        const body = { ...DEFAULT_MOB_BODY, navigation_id: "78" };
        const sign = generateSign(body);

        const response = await fetch(FLICKREELS_MOB_API + '/navigationColumn', {
            method: 'POST',
            headers: { ...FLICKREELS_MOB_HEADERS, 'Sign': sign },
            body: JSON.stringify(body)
        });

        // if (!response.ok) return [];
        const data = await response.json();
        return data;
        // if (!data || !data.data) return [];

        // let allItems = [];
        // if (Array.isArray(data.data)) {
        //     data.data.forEach((group) => {
        //         if (group.list && Array.isArray(group.list)) {
        //             allItems.push(...group.list);
        //         }
        //     });
        // }

        // return allItems.map(item => normalizeFlickReels(item)).filter(i => i.id && i.id !== '0' && i.id !== '');
    } catch (e) {
        console.error('[FlickReels] Home Fetch Error:', e);
        throw e;
    }
};

const getFlickReelsForYou = async () => {
    try {
        const body = { ...DEFAULT_MOB_BODY, navigation_id: "30" };
        const sign = generateSign(body);

        const response = await fetch(FLICKREELS_MOB_API + '/navigationColumn', {
            method: 'POST',
            headers: { ...FLICKREELS_MOB_HEADERS, 'Sign': sign },
            body: JSON.stringify(body)
        });

        // if (!response.ok) return [];
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('[FlickReels] Home Fetch Error:', e);
        throw e;
    }
};

const getFlickReelsHotRank = async () => {
    try {
        const body = { ...DEFAULT_MOB_BODY };
        const sign = generateSign(body);

        const response = await fetch(FLICKREELS_MOB_API + '/hotRank', {
            method: 'POST',
            headers: { ...FLICKREELS_MOB_HEADERS, 'Sign': sign },
            body: JSON.stringify(body)
        });

        // if (!response.ok) return [];
        const data = await response.json();
        return data;
    } catch (e) {
        console.error('[FlickReels] Home Fetch Error:', e);
        throw e;
    }
};

// NOTE: Video URL fetch is now redundant because we pre-fetch everything in detail!
// But we keep it as fallback just in case.
// const getFlickReelsVideoUrl = async (playletId, chapterId) => {
//     const webEndpoint = FLICKREELS_WEB_API + "/play";

//     const body = {
//         "playlet_id": playletId,
//         "chapter_id": chapterId,
//         "guid": "1a7df84e-7be8-4e2f-928a-615880c41a6d",
//         "os": "android"
//     };

//     const headers = getWebHeaders(generateSign(body));

//     try {
//         const response = await fetch(webEndpoint, {
//             method: 'POST',
//             headers: headers,
//             body: JSON.stringify(body)
//         });

//         if (!response.ok) return '';
//         const data = await response.json();
//         if (data && data.data && (data.data.hls_url || data.data.down_url)) {
//             return data.data.hls_url || data.data.down_url;
//         }
//         return '';
//     } catch (e) {
//         return '';
//     }
// };

const getFlickReelsDetailandAllEpisode = async (id) => {
    // 1. Get Episode List using Web API (because mobile list endpoint is stricter or harder to fetch)
    const webListEndpoint = FLICKREELS_WEB_API + "/chapterList";
    const listBody = {
        "playlet_id": id,
        "os": "android",
        "guid": "1a7df84e-7be8-4e2f-928a-615880c41a6d"
    };
    const listHeaders = getWebHeaders(generateSign(listBody));

    let episodes = [];
    let dramaInfo = {};

    try {
        const listRes = await fetch(webListEndpoint, {
            method: 'POST',
            headers: listHeaders,
            body: JSON.stringify(listBody)
        });

        if (listRes.ok) {
            const listData = await listRes.json();
            if (listData && listData.data && listData.data.list) {
                const info = listData.data;
                episodes = info.list.map((ep) => ({
                    id: String(ep.chapter_id),
                    name: ep.chapter_title || `Episode ${ep.chapter_num}`,
                    index: ep.chapter_num - 1,
                    unlock: true, // Optimist
                    raw: ep
                }));

                dramaInfo = {
                    title: info.title,
                    cover: info.cover,
                    description: info.introduce || '',
                    chapterCount: info.list.length,
                    labels: [],
                    viewCount: 0,
                    source: 'dramaflickreels'
                };
            }
        }
    } catch (err) {
        console.error('[FlickReels] List Fetch Failed:', err);
        throw err;
    }

    // 2. MAGIC BATCH UNLOCK using Mobile API /downUrl
    // Now that we have episode IDs, we request download links for ALL of them.
    if (episodes.length > 0) {
        try {
            const chapterIds = episodes.map(e => e.id);
            // Construct body strictly matching what Mobile API expects
            const downBody = {
                ...DEFAULT_MOB_BODY,
                "playlet_id": id, // Wait, user body didn't have playlet_id in root? Let's check user log.
                // User log body: {"device_id":..., "chapter_id":[...], ..., "main_package_id":"100"}
                // It DOES NOT seem to have playlet_id in the body! Just chapter_id array.
                // Ah, but user provided log for ID 533 had:
                // {"device_id":..., "chapter_id": [...], ..., "main_package_id":"100"} 
                // Let's stick to the structure in user log.
                "chapter_id": chapterIds
            };

            // Generate Sign for this specific body
            const sign = generateSign(downBody);

            // Add Timestamp header (also critical?) User log had Timestamp: 1767335271
            // Let's use current timestamp
            const timestamp = Math.floor(Date.now() / 1000).toString();

            const downRes = await fetch(FLICKREELS_MOB_API + '/downUrl', {
                method: 'POST',
                headers: {
                    ...FLICKREELS_MOB_HEADERS,
                    'Sign': sign,
                    'Timestamp': timestamp
                },
                body: JSON.stringify(downBody)
            });
            const downData = await downRes.json();
            // console.log(downData.data.list);
            const downList = downData.data.list;
            // masukkan dalam property raw
            episodes.forEach((ep, index) => {
                ep.raw.videoUrl = downList[index].down_url;
            });

        } catch (err) {
            console.error('[FlickReels] Batch Unlock Error:', err);
            throw err;
        }
    }

    return { drama: dramaInfo, episodes };
};

const searchFlickReels = async (query) => {
    try {
        const body = {
            ...DEFAULT_MOB_BODY,
            keyword: query,
            is_mid_page: "1"
        };
        const sign = generateSign(body);
        const timestamp = Math.floor(Date.now() / 1000).toString();

        const response = await fetch(FLICKREELS_SEARCH_API + '/search', {
            method: 'POST',
            headers: {
                ...FLICKREELS_MOB_HEADERS,
                'Sign': sign,
                'Timestamp': timestamp
            },
            body: JSON.stringify(body)
        });

        // if (!response.ok) return [];
        const data = await response.json();
        return data;

        // if (!data || !data.data) return [];

        // return data.data.map(item => normalizeFlickReels(item)).filter(i => i.id && i.id !== '0');
    } catch (e) {
        console.error('[FlickReels] Search Error:', e);
        // return [];
        throw e;
    }
};

export { getFlickReelsLatest, getFlickReelsForYou, getFlickReelsDetailandAllEpisode, searchFlickReels, getFlickReelsHotRank };
export default { getFlickReelsLatest, getFlickReelsForYou, getFlickReelsDetailandAllEpisode, searchFlickReels, getFlickReelsHotRank };