import IEditorPlugin from "../interfaces/IEditorPlugin";

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
      this.main.innerHTML = `<p class="${ ClassNameCollection.ROW }"><br></p>`;
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

  public appendTo(element: HTMLElement): IEditor {
    element.appendChild(this.container);
    this.placeholder.style.top = `${this.main.offsetTop + 8 }px`;
    return this;
  }

  // 添加插件
  public use(iEditorPlugin: IEditorPlugin) {
    this.header.appendChild(iEditorPlugin.install(this));
    return this;
  }

  // 获取选中的节点信息
  public getSelectedElements(): SelectedInfo | undefined{
    const section = document.getSelection();
    if(section && section.rangeCount > 0) {
      const info: SelectedInfo = { rows: [], cols: [] };
      const range = section.getRangeAt(0);
      const { startContainer, endContainer, startOffset, endOffset } = range;
      let startRow = this.getRow(startContainer);
      let endRow = this.getRow(endContainer);
      let startCol = this.getCol(startContainer);
      let endCol = this.getCol(endContainer);

      if(startRow === endRow) {
        // 单行处理
        info.rows.push(startRow);
        if(startContainer === endContainer) {
          //单节点处理
          if(startContainer.nodeType === 3) {
            // 文本节点处理
            const content = startContainer.textContent??"";
            if(this.isColSpan(startCol)) {
              // parent 是一个Col节点
              if(endOffset - startOffset === content.length) {
                // 全文本段
                info.cols.push(startCol as HTMLSpanElement);
              } else {
                const { fragment, el, node } = this.splitColSpan(startCol  as HTMLSpanElement, startOffset, endOffset);
                info.cols.push(el);
                this.replaceCol(startCol, fragment);
                range.setStart(node, 0);
                range.setEnd(node, node.length);
              }
            } else {
              // 这是一个文本节点
              const { el, node } = this.createColSpan(content.substring(startOffset, endOffset));
              info.cols.push(el);
              range.deleteContents();
              range.insertNode(el);
              range.setStart(node, 0);
              range.setEnd(node, node.length);
            }
          } else {
            // 非文本节点处理
            /*  暂不考虑非文本节点处理方式  */
          }
        } else {
          //多节点处理
          if(startContainer.nodeType === 3) {
            const startContent = startContainer.textContent??"";
            if(startOffset === 0) {
              // 全文
              if(this.isColSpan(startCol)) {
                info.cols.push(startCol as HTMLSpanElement);
              } else {
                const { el, node } = this.createColSpan(startContent);
                this.replaceCol(startContainer, el);
                range.setStart(node, 0);
              }
            } else {
              // 非全文
              let result;
              if(this.isColSpan(startCol)) {
                result = this.splitColSpan(startCol as HTMLSpanElement, startOffset, startContent.length);
              } else {
                result = this.splitTextNode(startContainer as Text, startOffset, startContent.length);
              }
              info.cols.push(result.el);
              this.replaceCol(startCol, result.fragment)
              range.setStart(result.node, startOffset);
            }
          }
          let nextCol = startCol.nextSibling;
          while (nextCol && nextCol !== endCol) {
            const temp = nextCol.nextSibling;
            this.fullNodeHandler(info, nextCol);
            nextCol = temp;
          }
          if(endContainer.nodeType === 3) {
            const endContent = endContainer.textContent??"";
            if(endOffset === endContent.length) {
              // 全文
              if(this.isColSpan(endCol)) {
                info.cols.push(endCol as HTMLSpanElement);
              } else {
                const { el, node } = this.createColSpan(endContent);
                this.replaceCol(endContainer, el);
                range.setEnd(node, endContent.length);
              }
            } else {
              // 非全文
              let result;
              if(this.isColSpan(endCol)) {
                result = this.splitColSpan(endCol as HTMLSpanElement, 0, endOffset);
              } else {
                result = this.splitTextNode(endContainer as Text, 0, endOffset);
              }
              info.cols.push(result.el);
              this.replaceCol(endCol, result.fragment);
              range.setEnd(result.node, endOffset);
            }
          }
        }
      } else {
        // 多行处理
        //开始行操作
        this.startRowHandler(info, range, startCol, startOffset);
        let nextRow = startRow.nextSibling;
        while(nextRow && nextRow !== endRow) {
          // 中间行
          const temp = nextRow.nextSibling;
          const childNodes = nextRow.childNodes;
          for (let i = 0; i < childNodes.length; i++) {
            this.fullNodeHandler(info, childNodes[i]);
          }
          nextRow = temp;
        }
        //结束操作
        this.lastRowHandler(info, range, endCol, endOffset);
      }
      return info;
    }
  }

  private fullNodeHandler(info: SelectedInfo, node: Node) {
    if(node.nodeType === 3) {
      const el = this.createColSpan(node.nodeValue??"").el;
      this.replaceCol(node, el);
    } else if(this.isColSpan(node)) {
      info.cols.push(node as HTMLSpanElement);
    }
  }

  private startRowHandler(info: SelectedInfo, range: Range, startCol: Node, startOffset: number) {
    let nextCol = startCol.nextSibling;
    // 起始Col操作
    this.firstColHandler(info, range, startCol, startOffset);
    while(nextCol) {
      const temp = nextCol.nextSibling;
      if(nextCol.nodeType === 3) {
        const el = this.createColSpan(nextCol.nodeValue??"").el;
        info.cols.push(el);
        this.replaceCol(nextCol, el);
      } else if(this.isColSpan(nextCol)) {
        info.cols.push(nextCol as HTMLSpanElement);
      }
      nextCol = temp;
    };
  }

  private lastRowHandler(info: SelectedInfo, range: Range, endCol: Node, endOffset: number) {
    let previousCol = endCol.previousSibling;
    this.lastColHandler(info, range, endCol, endOffset);
    while (previousCol) {
      const temp = previousCol.previousSibling;
      if(previousCol.nodeType === 3) {
        const el = this.createColSpan(previousCol.nodeValue??"").el;
        this.replaceCol(previousCol, el);
      } else if(this.isColSpan(previousCol)) {
        info.cols.push(previousCol as HTMLSpanElement);
      }
      previousCol = temp;
    }

  }

  private firstColHandler(info: SelectedInfo, range: Range, startCol: Node, startOffset: number) {
    let result;
    if(startCol.nodeType === 3) {
      result = this.colTextHandler(info, startCol as Text, 0, startOffset);
    } else if(this.isColSpan(startCol)) {
      result = this.colSpanHandler(info, startCol as HTMLSpanElement, 0, startOffset);
    }
    if(result) {
      range.setStart(result, startOffset);
    }
  }

  private lastColHandler(info: SelectedInfo, range: Range, endCol: Node, endOffset: number) {
    let result;
    if(endCol.nodeType === 3) {
      result = this.colTextHandler(info, endCol as Text, 0, endOffset);
    } else if(this.isColSpan(endCol)) {
      result = this.colSpanHandler(info, endCol as HTMLSpanElement, 0, endOffset);
    }
    if(result) {
      range.setEnd(result, endOffset);
    }
  }

  private colTextHandler(info: SelectedInfo, colText: Text, startOffset: number, endOffset: number) {
    const content = colText.nodeValue??"";
    if((endOffset - startOffset) === content.length) {
      const { el, node } = this.createColSpan(content);
      info.cols.push(el);
      this.replaceCol(colText, el);
      return node;
    } else {
      const { fragment, el, node } = this.splitTextNode(colText, startOffset, endOffset);
      info.cols.push(el);
      this.replaceCol(colText, fragment);
      return node;
    }
  }

  private colSpanHandler(info: SelectedInfo, colSpan: HTMLSpanElement, startOffset: number, endOffset: number) {
    const content = colSpan.textContent??"";
    if((endOffset - startOffset) === content.length) {
      info.cols.push(colSpan);
    } else {
      const { fragment, el, node } = this.splitColSpan(colSpan, startOffset, endOffset);
      info.cols.push(el);
      this.replaceCol(colSpan, fragment);
      return node;
    }
  }

  private getRow(node: Node): HTMLElement {
    if(this.isRow(node)) {
      return node as HTMLElement;
    } else {
      while (true) {
        if(node.parentNode === null) {
          throw new Error("找不到Row元素");
        } else {
          if(this.isRow(node = node.parentNode))  return node as HTMLElement;
        }
      }
    }
  }

  private getCol(node: Node): Node {
    while (true) {
     if(node.parentNode === null) {
       throw new Error("找不到Col元素");
     } else {
       if(this.isRow(node.parentNode)) {
         return node;
       } else {
         node = node.parentNode;
       };
     }
    }
  }

  private createColSpan(content: string, cssText?: string): { el: HTMLSpanElement, node: Text } {
    const span = document.createElement("span");
    const node = document.createTextNode(content);
    span.className = ClassNameCollection.COL;
    span.appendChild(node);
    if(cssText) {
      span.style.cssText = cssText
    }
    return {
      el: span,
      node
    };
  }

  private isColSpan(node: Node): boolean {
    return node instanceof HTMLSpanElement && node.className.includes(ClassNameCollection.COL);
  }

  private isRow(node: Node): boolean {
    return node instanceof HTMLElement && node.className.includes(ClassNameCollection.ROW);
  }

  // 替换Col
  private replaceCol(old: Node, target: Node) {
    old.parentElement?.insertBefore(target, old);
    old.parentElement?.removeChild(old);
  }
  // 分离calSpan
  private splitColSpan(colSpan: HTMLSpanElement, startOffset: number, endOffset: number) {
    const fragment = document.createDocumentFragment();
    const content = colSpan.textContent??"";
    const cssText = colSpan.style.cssText;
    if(startOffset > 0) {
      fragment.appendChild(this.createColSpan(content.substring(0, startOffset), cssText).el);
    }
    const { el, node } = this.createColSpan(content.substring(startOffset, endOffset), cssText);
    fragment.appendChild(el);
    if(endOffset < content.length) {
      fragment.appendChild(this.createColSpan(content.substring(endOffset, content.length), cssText).el);
    }
    return {
      fragment,
      el,
      node
    };
  }
  // 分离文本节点
  private splitTextNode(textNode: Text, startOffset: number, endOffset: number) {
    const fragment = document.createDocumentFragment();
    const content = textNode.nodeValue??"";
    if(startOffset > 0) {
      fragment.appendChild(document.createTextNode(content.substring(0, startOffset)));
    }
    const { el, node } = this.createColSpan(content.substring(startOffset, endOffset));
    fragment.appendChild(el);
    if(endOffset < content.length) {
      fragment.appendChild(document.createTextNode(content.substring(endOffset, content.length)));
    }
    return {
      fragment,
      el,
      node
    }
  }
}