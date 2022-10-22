import IEditorPlugin from "../interfaces/IEditorPlugin";
import IEditor from "../iEditor";


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


    })
  }


  public install(iEditorInstance: IEditor): HTMLElement {
    this.iEditorIncetance = iEditorInstance;
    return this.element;
  }
}