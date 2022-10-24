import IEditor, { PointInfo } from "../core/iEditor";

/**
 * 作者：A.C
 * 日期：2022年10月22日
 * IEditor插件接口，实现这个接口可实现自定义工具
 * 注：元素宽度最好不要超过富文本编辑器宽度
 */
export default interface IEditorPlugin {
  // 这个方法用于返回最终显示在工具栏上的元素
  install(iEditorInstance: IEditor): HTMLElement
  // 这个方法用于跟踪指针变化 以实现实时显示状态信息
  update(pointInfo: PointInfo): void;
}