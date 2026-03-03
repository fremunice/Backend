import axios from "axios";

const headers = {
    'country': 'ID',
    'X-Appsflyer_Id': '1767286674238-964377822658472300',
    'timezone': '+8',
    'device-country': 'ID',
    'language': 'id-ID',
    'device-id': 'af25a4fb-5739-4b3b-bee5-068add56cac3',
    'appsflyer-id': '1767286674238-964377822658472300',
    'Authorization': `oauth_signature=c7937442cddd981c08caaaf99e074ff8,oauth_token=Db4l5q1JqtpnDfqWi2P8LiMdqOnkHX5P,ts=${Date.now()}`,
    'device-language': 'in-ID',
    'app-name': 'com.freereels.app',
    'app-version': '2.1.61',
    'session-id': '1bf35e42-4f79-4ff9-a9de-689316ccf138',
    'User-Agent': 'okhttp/4.12.0'
};

const homepageFF = async () => {
    try {
        const res = await axios.get(`https://apiv2.free-reels.com/frv2-api/homepage/v2/tab/index?tab_key=503&position_index=10000&rec_trigger=1`, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const animepageFF = async () => {
    try {
        const res = await axios.get(`https://apiv2.free-reels.com/frv2-api/homepage/v2/tab/index?tab_key=547&position_index=10001&rec_trigger=1`, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const foryouFF = async () => {
    try {
        const res = await axios.get(`https://apiv2.free-reels.com/frv2-api/foryou/feed?next=`, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const searchFF = async (query) => {
    try {
        const data = {
            "next": "",
            "keyword": query,
            "timestamp": Date.now().toString()
        };
        const res = await axios.post(`https://apiv2.free-reels.com/frv2-api/search/drama`, data, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const detailAndAllEpisodeFF = async (id) => {
    try {
        const res = await axios.get(`https://apiv2.free-reels.com/frv2-api/drama/info_v2?series_id=${id}&clip_content=`, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

export { homepageFF, animepageFF, foryouFF, searchFF, detailAndAllEpisodeFF }
export default {
    homepageFF,
    animepageFF,
    foryouFF,
    searchFF,
    detailAndAllEpisodeFF
}