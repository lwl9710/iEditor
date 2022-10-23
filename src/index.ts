import IEditor from "./core/iEditor";
import TextColorPlugin from "./plugins/TextColorPlugin";
const src = "https://img0.baidu.com/it/u=2488617358,239395824&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=889";

console.log(new IEditor({
  HTMLText: "<p class='i-editor-line'>这是一段用<img style='width: 50px; height: 50px' src='" + src + "'/>于测试的内容！！！</p><p class='i-editor-line'>这是一段<img style='width: 50px; height: 50px' src='" + src + "'/>用于测试的内容！！！</p><p class='i-editor-line'>这是一段用于测试的内容！！！</p>"
}).appendTo(document.body).use(new TextColorPlugin()));