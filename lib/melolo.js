import axios from "axios";

const meloloForyou = async (offset) => {
    try {
        const url = `https://api.tmtreader.com/i18n_novel/bookmall/cell/change/v1/?max_abstract_len=0&selected_tag_id=-1&selected_tag_type=2&offset=${offset}&is_preload=false&recommend_enable_write_client_session_cache_only=false&preference_strategy=0&session_id=202602080139170E88047C6763DB9510C5&change_type=0&enable_new_show_mechanism=false&time_zone=Asia%2FMakassar&is_preference_force_insert=false&is_landing_page=0&tab_scene=3&tab_type=0&limit=10&preference_list&start_offset=0&cell_id=7450059162446200848&iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770485967553&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12`;

const headers = {
  "User-Agent": "com.worldance.drama/49819 (Linux; U; Android 13; in; SM-A042F; Build/TP1A.220624.014; Cronet/TTNetVersion:8f366453 2024-12-24 QuicVersion:ef6c341e 2024-11-14)",
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const res = await axios.get(url, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const meloloLatest = async () => {
    try {
      const url =
      "https://api.tmtreader.com/i18n_novel/search/front_page/v1/?feature_switch=%7B%22enable_drama_infinite_filter%22%3Afalse%2C%22enable_filter_page%22%3Atrue%7D&last_query=cinta&time_zone=Asia%2FMakassar&iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770487572288&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12"
    const headers = {
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const response = await axios.get(url, { headers });
return response.data.data[2];
    // console.log(response.data.data[2]);
    } catch (error) {
        throw error;
    }
  }

const meloloTrending = async () => {  
    try {
    const url =
      "https://api.tmtreader.com/i18n_novel/search/front_page/v1/?feature_switch=%7B%22enable_drama_infinite_filter%22%3Afalse%2C%22enable_filter_page%22%3Atrue%7D&last_query=cinta&time_zone=Asia%2FMakassar&iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770487572288&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12"
    const headers = {
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const response = await axios.get(url, { headers });

    // console.log(response.data.data[0]);
    return response.data.data[0];
    } catch (error) {
        throw error;
    }
}

const meloloSearch = async (query, limit, offset) => {
    try {
        const url = `https://api.tmtreader.com/i18n_novel/search/page/v1/?search_source_id=clks%23%23%23&IsFetchDebug=false&offset=${offset}&cancel_search_category_enhance=false&query=${query}&limit=${limit}&time_zone=Asia%2FMakassar&search_id&iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770487297418&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12`;

const headers = {
  "User-Agent": "com.worldance.drama/49819 (Linux; U; Android 13; in; SM-A042F; Build/TP1A.220624.014; Cronet/TTNetVersion:8f366453 2024-12-24 QuicVersion:ef6c341e 2024-11-14)",
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const res = await axios.get(url, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

const meloloDetail = async (seriesId) => {
    try {
        const url = "https://api.tmtreader.com/novel/player/video_detail/v1/?iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770486349961&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&time_zone=Asia%2FMakassar&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12"

    const headers = {
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const data = {
      biz_param: {
        detail_page_version: 0,
        from_video_id: "",
        need_all_video_definition: false,
        need_mp4_align: false,
        source: 4,
        use_os_player: false,
        video_id_type: 1,
      },
      series_id: seriesId, // series_id didapat dari search.js property search_source_book_id
    };

    const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
}

const meloloLinkStream = async (videoId) => {
    try {
        const url =
      "https://api.tmtreader.com/novel/player/video_model/v1/?iid=7604173033750415125&device_id=7554232785717380664&ac=mobile&channel=gp&aid=645713&app_name=Melolo&version_code=51617&version_name=5.1.6&device_platform=android&os=android&ssmix=a&device_type=SM-A042F&device_brand=samsung&language=in&os_api=33&os_version=13&openudid=d7ad3f25422073a0&manifest_version_code=51617&resolution=720*1465&dpi=300&update_version_code=51617&_rticket=1770486350973&current_region=ID&carrier_region=id&app_language=id&sys_language=in&app_region=ID&prefer_gd=0&sys_region=ID&mcc_mnc=51001&carrier_region_v2=510&user_language=id&time_zone=Asia%2FMakassar&ui_language=in&cdid=245817c0-0db2-4417-9483-e535ug421t12"
    const headers = {
  "Accept": "application/json; charset=utf-8,application/x-protobuf",
  "Accept-Encoding": "gzip, deflate",
  "x-xs-from-web": "false",
  "age-range": "8"
};

    const data = {
      biz_param: {
        "detail_page_version": 0,
        "device_level": 3,
        "from_video_id": "",
        "need_all_video_definition": true,
        "need_mp4_align": false,
        "source": 4,
        "use_os_player": false,
        "use_server_dns": false,
        "video_id_type": 0,
        "video_platform": 3
      },
      video_id: videoId // video_id untuk episode didapat dari detail.js property vid
    };

    const response = await axios.post(url, data, { headers });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export { meloloSearch, meloloDetail, meloloLinkStream, meloloLatest, meloloTrending, meloloForyou };
export default { meloloSearch, meloloDetail, meloloLinkStream, meloloLatest, meloloTrending, meloloForyou };