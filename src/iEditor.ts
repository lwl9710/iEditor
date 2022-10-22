import IEditorPlugin from "./interfaces/IEditorPlugin";

interface IEditorOptions {
  width?: number;
  height?: number;
  HTMLText?: string;
}

interface SelectedInfo {
  rows: Array<HTMLElement>,
  cols: Array<HTMLElement>
}

const enum ClassNameCollection {
  ROW = "i-editor-line",
  COL = "i-editor-col"
}

export default class IEditor {
  public width: number;
  public height: number;
  public isShowPlaceholder: boolean = false;
  public container: HTMLElement = document.createElement("div");
  public header: HTMLElement = document.createElement("div");
  public main: HTMLElement = document.createElement("div");
  public placeholder: HTMLElement = document.createElement("div");

  constructor(options?: IEditorOptions) {
    const { width = 800, height = 500, HTMLText = "" } = options || {};
    this.width = width;
    this.height = height;
    if(HTMLText) {
      this.main.innerHTML = HTMLText;
    } else {
      this.showPlaceholder(true);
    }
    this.initContainer();
    this.initTool();
  }

  public use(iEditorPlugin: IEditorPlugin) {
    this.header.appendChild(iEditorPlugin.install(this));
  }

  private initTool() {
    this.appendTool(this.initColorTool());
  }

  private initColorTool() {

    const element = document.createElement("input");
    element.type = "color";
    element.addEventListener("change", (event) => {
      const newColor = (event.target as HTMLInputElement).value;
      console.log("触发改变颜色: " + newColor);
      this.getSelectedElements();
      // const selection = document.getSelection();
      // if(selection && selection.rangeCount > 0) {
      //   const range = selection.getRangeAt(0);
      //   // 文本节点的选中处理
      //   if(range.startContainer === range.endContainer && range.startContainer.nodeType === 3) {
      //     const targetElement = range.startContainer;
      //     const originText = targetElement.textContent??"";
      //     const selectedText: string = originText.substring(range.startOffset, range.endOffset);
      //     if(targetElement.parentElement?.nodeName === "SPAN") {
      //       if(selectedText === targetElement.textContent) {
      //         targetElement.parentElement.style.color = newColor;
      //       } else {
      //         // 这里可能会出现两段或三段内容
      //         let fragment = document.createDocumentFragment();
      //         let span: HTMLSpanElement, originStyle = targetElement.parentElement.style.cssText;
      //
      //         if(range.startOffset > 0) {
      //           fragment.appendChild(this.createSpanByStyle(originText.substring(0, range.startOffset), originStyle));
      //         }
      //
      //         span = this.createSpanByStyle(selectedText, originStyle);
      //         span.style.color = newColor;
      //         fragment.appendChild(span);
      //
      //         if(range.endOffset < originText.length) {
      //           fragment.appendChild(this.createSpanByStyle(originText.substring(range.endOffset, originText.length), originStyle));
      //         }
      //         targetElement.parentElement?.parentElement?.insertBefore(fragment, targetElement.parentElement);
      //         targetElement.parentElement?.parentElement?.removeChild(targetElement.parentElement);
      //         range.setStart(span.childNodes[0], 0);
      //         range.setEnd(span.childNodes[0], selectedText.length);
      //       }
      //     } else {
      //       range.deleteContents();
      //       range.insertNode(this.createSpanByStyle(selectedText, { color: newColor }));
      //     }
      //   }
      // }
      // event.preventDefault();
    });
    return element;
  }

  private createSpanByStyle(content: string|Node, styles?: object|string): HTMLSpanElement {
    const span = document.createElement("span");
    if(typeof styles === "object") {
      for (const key in styles) {
        // @ts-ignore
        span.style[key] = styles[key];
      }
    } else if(typeof styles === "string") {
      span.style.cssText = styles;
    }
    if(typeof content === "string") {
      span.textContent = content;
    } else {
      span.appendChild(content);
    }
    return span;
  }

  private initContainer() {
    this.container.className = "i-editor-container";
    this.initHeader();
    this.initMain();
    this.initPlaceholder();
    this.container.appendChild(this.header);
    this.container.appendChild(this.main);
    this.container.appendChild(this.placeholder);
  }

  private initHeader() {
    this.header.style.height = "50px";
    this.header.style.backgroundColor = "yellowgreen";
    this.header.className = "i-editor-header";
    this.header.addEventListener("mousedown", event => event.preventDefault());
  }

  private initMain() {
    this.main.className = "i-editor-main";
    this.main.setAttribute("contenteditable", "true");
    if(!this.main.innerHTML) {
      this.main.innerHTML = `<p class="i-editor-line"><br></p>`;
    }
    this.main.addEventListener("keydown", (event) => {
      if(event.keyCode === 8 && !this.hasContent()) {
        event.preventDefault();
      } else {
        setTimeout(() => {
          this.showPlaceholder(!this.hasContent());
        })
      }
    });
  }

  private hasContent(): boolean {
    return this.main.childElementCount > 1 || (this.main.childElementCount === 1 && this.main.firstElementChild?.firstChild?.nodeName !== "BR");
  }

  private initPlaceholder() {
    this.placeholder.className = "i-editor-placeholder";
    this.placeholder.innerText = "请输入内容...";
  }

  private showPlaceholder(isShow: boolean) {
    if(this.isShowPlaceholder !== isShow) {
      this.isShowPlaceholder = isShow;
      this.placeholder.style.visibility = isShow ? "visible" : "hidden";
    }
  }

  private createTool(content: HTMLElement | string) {
    const toolElement = document.createElement("div");
    toolElement.className = "i-editor-tool";
    if(content instanceof HTMLElement) {
      toolElement.appendChild(content);
    } else {
      toolElement.innerHTML = content;
    }
    return toolElement;
  }

  public appendTo(element: HTMLElement): IEditor {
    element.appendChild(this.container);
    this.placeholder.style.top = `${this.main.offsetTop + 8 }px`;
    return this;
  }

  public appendTool(content: HTMLElement | string) {
    this.header.appendChild(this.createTool(content));
  }

  public getSelectedElements(): SelectedInfo {
    const info: SelectedInfo = { rows: [], cols: [] };
    const section = document.getSelection();
    if(section && section.rangeCount > 0) {
      const range = section.getRangeAt(0);
      const { startContainer, endContainer, startOffset, endOffset } = range;
      const satrtRow = this.getIEditorLineElement(startContainer);

      if(satrtRow === this.getIEditorLineElement(endContainer)) {
        // 单行处理
        info.rows.push(satrtRow);
        if(startContainer.nodeType === 3 && endContainer.nodeType === 3 && startContainer === endContainer) {
          let fullText: string = startContainer.textContent??"";
          //文本节点处理
          if(startContainer.parentElement?.className === ClassNameCollection.COL) {
            const textLength = endOffset - startOffset;
            if(textLength === fullText.length) {
              info.cols.push(startContainer.parentElement);
            } else {
              const fragment = document.createDocumentFragment();
              const cssText = startContainer.parentElement.style.cssText;
              if(startOffset > 0) {
                fragment.appendChild(this.createColSpan(fullText.substring(0, startOffset), cssText));
              }
              const span = this.createColSpan(fullText.substring(startOffset, endOffset), cssText);
              fragment.appendChild(span);
              info.cols.push(span);
              if(endOffset < fullText.length) {
                fragment.appendChild(this.createColSpan(fullText.substring(endOffset, fullText.length), cssText));
              }
              startContainer.parentElement.parentElement?.insertBefore(fragment, startContainer.parentElement)
              startContainer.parentElement.parentElement?.removeChild(startContainer.parentElement);
              this.setNodeRange(range, span.childNodes[0]);
            }
          } else {
            const node = document.createTextNode(fullText.substring(startOffset, endOffset));
            const span = this.createColSpan(node);
            info.cols.push(span);
            range.deleteContents();
            range.insertNode(span);
            this.setNodeRange(range, node);
          }
        } else {
          let startNodeIndex: number, endNodeIndex: number;
          // 寻找起始节点索引
          if(this.isLineElement(startContainer)) {
            startNodeIndex = startOffset;
          } else {
            startNodeIndex = this.findTextNodeIndex(startContainer, satrtRow.childNodes);
          }
          // 寻找结束节点索引
          if(this.isLineElement(endContainer)) {
            endNodeIndex = endOffset;
          } else {
            endNodeIndex = this.findTextNodeIndex(endContainer, satrtRow.childNodes);
          }

          satrtRow.childNodes.forEach((node, index) => {
            if(index === startNodeIndex) {
              // 可能分三段
              if(startOffset === 0) {
                if(node instanceof HTMLElement && node.className === ClassNameCollection.COL) {
                  info.cols.push(node);
                } else {
                  info.cols.push(this.createColSpan(node.textContent??""));
                }
              }



            } else if(index === endNodeIndex) {

            } else {
              // 全改
              if(node.nodeType === 3) {
                const span = this.createColSpan(node.textContent??"");
                node.parentElement?.insertBefore(span, node);
                node.parentElement?.removeChild(node);
                info.cols.push(span);
              } else if(node instanceof HTMLElement && node.className === ClassNameCollection.COL){
                info.cols.push(node);
              }
            }
          })
        }


      } else {
        // 多行处理




      }


    }
    return info;
  }

  private setNodeRange(range: Range , node: Node) {
    range.setStart(node, 0);
    range.setEnd(node, node.length);
  }

  private getIEditorLineElement(node: Node): HTMLElement {
    let count = 0;
    if(node instanceof HTMLElement && this.isLineElement(node)) {
      return node;
    }
    while(true) {
      if(count > 50) {
        throw new Error("找不到行元素");
      }
      if(node.parentElement) {
        if(this.isLineElement(node.parentElement)) {
          return node.parentElement;
        } else {
          node = node.parentElement;
        }
      } else {
        throw new Error("找不到行元素");
      }
    }
  }

  private isLineElement(element: Node) {
    return element instanceof HTMLElement && element.className.includes("i-editor-line");
  }

  private createColSpan(content: string|Node, styles?: object|string): HTMLElement {
    const span = this.createSpanByStyle(content, styles);
    span.className = ClassNameCollection.COL;
    return span;
  }

  private findTextNodeIndex(textNode: Node, nodes: NodeListOf<ChildNode>): number {
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if(node.nodeType === 3) {
        if(node === textNode) {
          return i;
        }
      } else if(node.childNodes[0] === textNode){
        return i;
      }
    }
    return -1;
  }

  private createSpanToMulti() {




  }
}