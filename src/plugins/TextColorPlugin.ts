import IEditorPlugin from "../interfaces/IEditorPlugin";
import IEditor, { PointInfo } from "../core/iEditor";


export default class TextColorPlugin implements IEditorPlugin {
  private readonly element: HTMLElement;
  private iEditorIncetance: IEditor | undefined;

  constructor() {
    this.element = document.createElement("div");
    this.element.className = "i-editor-tool";
    this.element.setAttribute("text-color", "");
    let input = document.createElement("input");
    input.type = "color";
    this.element.appendChild(input);
    input.addEventListener("change", event => {
      let newColor = (event.target as HTMLInputElement).value;
      let info = this.iEditorIncetance?.getSelectedElements();
      if(info) {
        info.cols.forEach(el => {
          el.style.color = newColor;
        })
      }
    });
    this.element.appendChild(input);
  }


  public install(iEditorInstance: IEditor): HTMLElement {
    this.iEditorIncetance = iEditorInstance;
    return this.element;
  }

  public update(pointInfo: PointInfo) {
    if(pointInfo !== null) {
      if(pointInfo.col instanceof HTMLElement) {

        // (this.element.firstElementChild as HTMLInputElement).value = pointInfo.col.style.color;
      }
    }
  }
}