import axios from "axios";
import fs from "fs";
import path from "path";

// Configuration
const MIRROR_HOSTS = [
    "h5.aoneroom.com",
    "movieboxapp.in",
    "moviebox.pk",
    "moviebox.ph",
    "moviebox.id",
    "v.moviebox.ph",
    "netnaija.video"
];

const SELECTED_HOST = "h5.aoneroom.com";
const HOST_URL = `https://${SELECTED_HOST}`;

const DEFAULT_HEADERS = {
    'X-Client-Info': '{"timezone":"Asia/Jakarta"}',
    'Accept-Language': 'id-ID,id;q=0.5',
    'Accept': 'application/json',
    'User-Agent': 'okhttp/4.12.0',
    'Referer': HOST_URL,
    'Host': SELECTED_HOST,
    'Connection': 'keep-alive',
    'X-Forwarded-For': '1.1.1.1',
    'CF-Connecting-IP': '1.1.1.1',
    'X-Real-IP': '1.1.1.1'
};

const SubjectType = {
    ALL: 0,
    MOVIES: 1,
    TV_SERIES: 2,
    MUSIC: 6
};

// Cookie cache
let cookieCache = null;
let cookieCacheTime = 0;
const COOKIE_CACHE_DURATION = 3600000; // 1 hour

// Helper functions
function processApiResponse(data) {
    if (data && data.data) {
        return data.data;
    }
    return data;
}

async function getCookies() {
    const now = Date.now();
    if (cookieCache && (now - cookieCacheTime) < COOKIE_CACHE_DURATION) {
        return cookieCache;
    }

    try {
        const response = await axios.get(`${HOST_URL}/wefeed-h5-bff/app/get-latest-app-pkgs?app_name=moviebox`, {
            headers: DEFAULT_HEADERS
        });

        const setCookieHeaders = response.headers['set-cookie'];
        
        if (setCookieHeaders && setCookieHeaders.length > 0) {
            const cookies = setCookieHeaders.map(cookie => {
                const parts = cookie.split(';');
                return parts[0].trim();
            }).join('; ');
            
            cookieCache = cookies;
            cookieCacheTime = now;
        }
        
        return cookieCache;
    } catch (error) {
        console.error('Failed to get cookies:', error.message);
        return null;
    }
}

async function makeApiRequest(url, options = {}) {
    const cookies = await getCookies();
    
    const headers = { ...DEFAULT_HEADERS, ...options.headers };
    if (cookies) {
        headers['Cookie'] = cookies;
    }
    
    const config = {
        ...options,
        headers,
        url
    };

    if (options.method === 'POST') {
        return axios.post(url, options.body ? JSON.parse(options.body) : {}, { headers });
    }
    
    return axios.get(url, { headers });
}

// API Functions

/**
 * Get homepage content
 */
const movieboxHomepage = async () => {
    try {
        const response = await makeApiRequest(`${HOST_URL}/wefeed-h5-bff/web/home`);
        return processApiResponse(response.data);
    } catch (error) {
        throw error;
    }
};

/**
 * Get trending content
 * @param {number} page - Page number (default: 0)
 * @param {number} perPage - Items per page (default: 18)
 */
const movieboxTrending = async (page = 0, perPage = 18) => {
    try {
        const params = new URLSearchParams({
            page: page,
            perPage: perPage,
            uid: '5591179548772780352'
        });
        
        const response = await makeApiRequest(`${HOST_URL}/wefeed-h5-bff/web/subject/trending?${params}`);
        return processApiResponse(response.data);
    } catch (error) {
        throw error;
    }
};

/**
 * Search for movies/TV series
 * @param {string} query - Search keyword
 * @param {number} page - Page number (default: 1)
 * @param {number} perPage - Items per page (default: 24)
 * @param {number} subjectType - Type filter: 0=ALL, 1=MOVIES, 2=TV_SERIES (default: 0)
 */
const movieboxSearch = async (query, page = 1, perPage = 24, subjectType = SubjectType.ALL) => {
    try {
        const payload = {
            keyword: query,
            page,
            perPage,
            subjectType
        };
        
        const cookies = await getCookies();
        const headers = { ...DEFAULT_HEADERS, 'Content-Type': 'application/json' };
        if (cookies) {
            headers['Cookie'] = cookies;
        }
        
        const response = await axios.post(`${HOST_URL}/wefeed-h5-bff/web/subject/search`, payload, { headers });
        let content = processApiResponse(response.data);
        
        // Filter by subject type if specified
        if (subjectType !== SubjectType.ALL && content.items) {
            content.items = content.items.filter(item => item.subjectType === subjectType);
        }
        
        // Add thumbnail URLs
        if (content.items) {
            content.items.forEach(item => {
                if (item.cover && item.cover.url) {
                    item.thumbnail = item.cover.url;
                }
                if (item.stills && item.stills.url && !item.thumbnail) {
                    item.thumbnail = item.stills.url;
                }
            });
        }
        
        return content;
    } catch (error) {
        throw error;
    }
};

/**
 * Get movie/TV series detail information
 * @param {string} movieId - Movie/Subject ID
 */
const movieboxInfo = async (movieId) => {
    try {
        const params = new URLSearchParams({ subjectId: movieId });
        const response = await makeApiRequest(`${HOST_URL}/wefeed-h5-bff/web/subject/detail?${params}`);
        const content = processApiResponse(response.data);
        
        // Add thumbnail URL
        if (content.subject) {
            if (content.subject.cover && content.subject.cover.url) {
                content.subject.thumbnail = content.subject.cover.url;
            }
            if (content.subject.stills && content.subject.stills.url && !content.subject.thumbnail) {
                content.subject.thumbnail = content.subject.stills.url;
            }
        }
        
        return content;
    } catch (error) {
        throw error;
    }
};

/**
 * Get download/streaming sources for a movie/episode
 * @param {string} movieId - Movie/Subject ID
 * @param {number} season - Season number (default: 0 for movies)
 * @param {number} episode - Episode number (default: 0 for movies)
 */
const movieboxSources = async (movieId, season = 0, episode = 0) => {
    try {
        // First get movie info to get detailPath
        const infoParams = new URLSearchParams({ subjectId: movieId });
        const infoResponse = await makeApiRequest(`${HOST_URL}/wefeed-h5-bff/web/subject/detail?${infoParams}`);
        const movieInfo = processApiResponse(infoResponse.data);
        
        const detailPath = movieInfo?.subject?.detailPath;
        if (!detailPath) {
            throw new Error('Could not get movie detail path');
        }
        
        const refererUrl = `https://fmoviesunblocked.net/spa/videoPlayPage/movies/${detailPath}?id=${movieId}&type=/movie/detail`;
        
        const params = new URLSearchParams({
            subjectId: movieId,
            se: season,
            ep: episode
        });
        
        const cookies = await getCookies();
        const headers = {
            ...DEFAULT_HEADERS,
            'Referer': refererUrl,
            'Origin': 'https://fmoviesunblocked.net'
        };
        if (cookies) {
            headers['Cookie'] = cookies;
        }
        
        const response = await axios.get(`${HOST_URL}/wefeed-h5-bff/web/subject/download?${params}`, { headers });
        const content = processApiResponse(response.data);
        
        // Process sources
        if (content && content.downloads) {
            const title = movieInfo?.subject?.title || 'video';
            
            content.processedSources = content.downloads.map(file => ({
                id: file.id,
                quality: file.resolution || 'Unknown',
                directUrl: file.url,
                size: file.size,
                format: 'mp4'
            }));
        }
        
        return content;
    } catch (error) {
        throw error;
    }
};

/**
 * Validate if a stream URL is allowed
 * @param {string} streamUrl - URL to validate
 */
const validateStreamUrl = (streamUrl) => {
    const allowedDomains = [
        'https://bcdnxw.hakunaymatata.com/',
        'https://valiw.hakunaymatata.com/',
        'https://bcdnw.hakunaymatata.com/'
    ];
    
    return allowedDomains.some(domain => streamUrl.startsWith(domain));
};

/**
 * Get stream info (file size and content type)
 * @param {string} streamUrl - Stream URL
 */
const movieboxStreamInfo = async (streamUrl) => {
    try {
        if (!streamUrl || !validateStreamUrl(streamUrl)) {
            throw new Error('Invalid stream URL');
        }
        
        const response = await axios.head(streamUrl, {
            headers: {
                'User-Agent': 'okhttp/4.12.0',
                'Referer': 'https://fmoviesunblocked.net/',
                'Origin': 'https://fmoviesunblocked.net'
            }
        });
        
        const fileSize = parseInt(response.headers['content-length']);
        const contentType = response.headers['content-type'] || 'video/mp4';
        
        return {
            fileSize,
            contentType,
            url: streamUrl
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Sanitize filename for download
 * @param {string} filename - Original filename
 */
const sanitizeFilename = (filename) => {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_{2,}/g, '_')
        .trim();
};

/**
 * Generate download filename
 * @param {string} title - Movie/Episode title
 * @param {number} season - Season number (optional)
 * @param {number} episode - Episode number (optional)
 * @param {string} quality - Video quality (optional)
 */
const generateDownloadFilename = (title, season = null, episode = null, quality = '') => {
    let filename = sanitizeFilename(title);
    
    if (season && episode) {
        filename += `_S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
    }
    
    if (quality) {
        filename += `_${quality}`;
    }
    
    filename += '.mp4';
    return filename;
};

// Headers required for CDN download/streaming
const DOWNLOAD_HEADERS = {
    'User-Agent': 'okhttp/4.12.0',
    'Referer': 'https://fmoviesunblocked.net/',
    'Origin': 'https://fmoviesunblocked.net'
};

/**
 * Download video as buffer (for small files) or get stream
 * @param {string} downloadUrl - CDN URL to download
 * @param {object} options - Download options
 * @param {string} options.rangeStart - Start byte for range request (optional)
 * @param {string} options.rangeEnd - End byte for range request (optional)
 * @returns {Promise<{data: Buffer, headers: object, status: number}>}
 */
const movieboxDownload = async (downloadUrl, options = {}) => {
    try {
        if (!downloadUrl || !validateStreamUrl(downloadUrl)) {
            throw new Error('Invalid download URL');
        }
        
        const headers = { ...DOWNLOAD_HEADERS };
        
        // Support range requests for resumable downloads
        if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
            const start = options.rangeStart || 0;
            const end = options.rangeEnd || '';
            headers['Range'] = `bytes=${start}-${end}`;
        }
        
        const response = await axios.get(downloadUrl, {
            headers,
            responseType: 'arraybuffer', // Get as buffer for binary data
            maxRedirects: 5,
            timeout: 30000
        });
        
        return {
            data: response.data,
            headers: response.headers,
            status: response.status,
            contentLength: parseInt(response.headers['content-length']) || response.data.length,
            contentType: response.headers['content-type'] || 'video/mp4'
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get video stream (for streaming/piping to response)
 * @param {string} streamUrl - CDN URL to stream
 * @param {object} options - Stream options
 * @param {string} options.rangeStart - Start byte for range request (optional)
 * @param {string} options.rangeEnd - End byte for range request (optional)
 * @returns {Promise<{stream: ReadableStream, headers: object, status: number}>}
 */
const movieboxGetStream = async (streamUrl, options = {}) => {
    try {
        if (!streamUrl || !validateStreamUrl(streamUrl)) {
            throw new Error('Invalid stream URL');
        }
        
        const headers = { ...DOWNLOAD_HEADERS };
        
        // Support range requests for seeking
        if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
            const start = options.rangeStart || 0;
            const end = options.rangeEnd || '';
            headers['Range'] = `bytes=${start}-${end}`;
        }
        
        const response = await axios.get(streamUrl, {
            headers,
            responseType: 'stream',
            maxRedirects: 5,
            timeout: 30000
        });
        
        return {
            stream: response.data,
            headers: response.headers,
            status: response.status,
            contentLength: parseInt(response.headers['content-length']) || 0,
            contentType: response.headers['content-type'] || 'video/mp4',
            contentRange: response.headers['content-range']
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get download headers for manual usage (e.g., in Express response)
 * @returns {object} Headers object for CDN requests
 */
const getDownloadHeaders = () => {
    return { ...DOWNLOAD_HEADERS };
};

/**
 * Save video directly to file using streams (memory efficient, faster)
 * @param {string} downloadUrl - CDN URL to download
 * @param {string} outputPath - Path to save the file
 * @param {function} onProgress - Progress callback (optional) - receives {downloaded, total, percent}
 * @returns {Promise<{success: boolean, filePath: string, fileSize: number}>}
 */
const movieboxSaveToFile = async (downloadUrl, outputPath, onProgress = null) => {
    try {
        if (!downloadUrl || !validateStreamUrl(downloadUrl)) {
            throw new Error('Invalid download URL');
        }
        
        const response = await axios.get(downloadUrl, {
            headers: DOWNLOAD_HEADERS,
            responseType: 'stream',
            maxRedirects: 5
        });
        
        const totalSize = parseInt(response.headers['content-length']) || 0;
        let downloadedSize = 0;
        
        const writer = fs.createWriteStream(outputPath);
        
        response.data.on('data', (chunk) => {
            downloadedSize += chunk.length;
            if (onProgress && totalSize > 0) {
                onProgress({
                    downloaded: downloadedSize,
                    total: totalSize,
                    percent: Math.round((downloadedSize / totalSize) * 100)
                });
            }
        });
        
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve({
                    success: true,
                    filePath: outputPath,
                    fileSize: downloadedSize
                });
            });
            writer.on('error', reject);
        });
    } catch (error) {
        throw error;
    }
};

// Export all functions
export {
    movieboxHomepage,
    movieboxTrending,
    movieboxSearch,
    movieboxInfo,
    movieboxSources,
    movieboxStreamInfo,
    movieboxDownload,
    movieboxGetStream,
    movieboxSaveToFile,
    getDownloadHeaders,
    validateStreamUrl,
    sanitizeFilename,
    generateDownloadFilename,
    SubjectType,
    MIRROR_HOSTS
};

export default {
    movieboxHomepage,
    movieboxTrending,
    movieboxSearch,
    movieboxInfo,
    movieboxSources,
    movieboxStreamInfo,
    movieboxDownload,
    movieboxGetStream,
    movieboxSaveToFile,
    getDownloadHeaders,
    validateStreamUrl,
    sanitizeFilename,
    generateDownloadFilename,
    SubjectType,
    MIRROR_HOSTS
};