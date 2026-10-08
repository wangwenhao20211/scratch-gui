const manifest = {
    "name": "网络请求管理",
    "description": "控制系统内的网络请求。支持全部允许、白名单、黑名单、全部禁止模式，可开启每次请求询问。",
    "credits": [
        {
            "name": "wangwenhao20211",
            "link": "https://space.bilibili.com/1512219051"
        }
    ],
    "tags": [],
    "enabledByDefault": false,
    "settings": [
        {
            "dynamic": false,
            "name": "模式",
            "id": "mode",
            "type": "select",
            "potentialValues": [
                { "id": "allow", "name": "全部允许" },
                { "id": "whitelist", "name": "白名单（仅放行列内域名）" },
                { "id": "blacklist", "name": "黑名单（仅拦截列内域名）" },
                { "id": "block", "name": "全部禁止" }
            ],
            "default": "allow"
        },
        {
            "dynamic": false,
            "name": "白名单（域名列表，逗号分隔）",
            "id": "whitelist",
            "type": "string",
            "default": ""
        },
        {
            "dynamic": false,
            "name": "黑名单（域名列表，逗号分隔）",
            "id": "blacklist",
            "type": "string",
            "default": ""
        },
        {
            "dynamic": false,
            "name": "每次请求询问（全部禁止模式下不生效）",
            "id": "ask",
            "type": "boolean",
            "default": false
        }
    ],
    "userscripts": [
        {
            "url": "userscript.js"
        }
    ],
    "dynamicDisable": false
};
export default manifest;