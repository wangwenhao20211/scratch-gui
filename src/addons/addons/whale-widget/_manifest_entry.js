const manifest = {
  editorOnly: true,
  noTranslations: true,
  dynamicDisable: true,
  name: "鲸鱼挂件",
  description: "编辑器角落里的可拖动鲸鱼，点击互动并可自定义显示、位置、台词和音效。",
  tags: [],
  userscripts: [{url: "userscript.js"}],
  userstyles: [{url: "style.css"}],
  settings: [
    {name: "显示鲸鱼", id: "show", type: "boolean", default: true},
    {name: "初始位置", id: "corner", type: "select", default: "br", potentialValues: [
      {id: "br", name: "右下"}, {id: "bl", name: "左下"}, {id: "tr", name: "右上"}, {id: "tl", name: "左上"}
    ]},
    {name: "点击台词（留空使用随机台词）", id: "text", type: "string", default: ""},
    {name: "点击音效", id: "sound", type: "boolean", default: true}
  ],
  enabledByDefault: false
};
export default manifest;
