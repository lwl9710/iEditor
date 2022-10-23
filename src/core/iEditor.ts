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
      let startCol, endCol;
      if(this.isRow(startContainer)) {
        startCol = startContainer.childNodes[startOffset];
      } else {
        startCol = this.getCol(startContainer)
      }

      if(this.isRow(endContainer)) {
        endCol = endContainer.childNodes[endOffset - 1];
      } else {
        endCol = this.getCol(endContainer);
      }
      if(startRow === endRow) {
        // 单行处理
        info.rows.push(startRow);
        if(startCol === endCol) {
          //单节点处理
          if(startOffset === endOffset)return;
          if(startCol.nodeType === 3) {
            const content = startCol.textContent??"";
            if((endOffset - startOffset) === content.length) {
              const { el, node } = this.createColSpan(content);
              info.cols.push(el);
              this.replaceCol(startCol, el);
              range.selectNodeContents(node);
            } else {
              const { fragment, el, node } = this.splitTextNode(startCol as Text, startOffset, endOffset);
              info.cols.push(el);
              this.replaceCol(startCol, fragment);
              range.selectNodeContents(node);
            }
          } else if(this.isColSpan(startCol)) {
            const content = startCol.textContent??"";
            if(content.length === (endOffset - startOffset)) {
              info.cols.push(startCol as HTMLSpanElement);
            } else {
              const { fragment, el, node } = this.splitColSpan(startCol as HTMLSpanElement, startOffset, endOffset);
              info.cols.push(el);
              this.replaceCol(startCol, fragment);
              range.selectNodeContents(node);
            }
          }
        } else {
          //多节点处理
          this.firstColHandler(info, range, startCol, startOffset);
          let nextCol = startCol.nextSibling;
          while(nextCol && nextCol !== endCol) {
            const temp = nextCol.nextSibling;
            this.fullNodeHandler(info, nextCol);
            nextCol = temp;
          }
          this.lastColHandler(info, range, endCol, endOffset);
        }
      } else {
        // 多行处理
        //开始行操作
        info.rows.push(startRow);
        this.startRowHandler(info, range, startCol, startOffset);
        let nextRow = startRow.nextSibling;
        while(nextRow && nextRow !== endRow) {
          info.rows.push(nextRow as HTMLElement);
          // 中间行
          const temp = nextRow.nextSibling;
          const childNodes = nextRow.childNodes;
          for (let i = 0; i < childNodes.length; i++) {
            this.fullNodeHandler(info, childNodes[i]);
          }
          nextRow = temp;
        }
        //结束操作
        info.rows.push(endRow);
        this.lastRowHandler(info, range, endCol, endOffset);
      }
      return info;
    }
  }

  private fullNodeHandler(info: SelectedInfo, node: Node) {
    if(node.nodeType === 3) {
      const el = this.createColSpan(node.nodeValue??"").el;
      this.replaceCol(node, el);
      info.cols.push(el);
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
      this.fullNodeHandler(info, nextCol);
      nextCol = temp;
    };
  }

  private lastRowHandler(info: SelectedInfo, range: Range, endCol: Node, endOffset: number) {
    let previousCol = endCol.previousSibling;
    this.lastColHandler(info, range, endCol, endOffset);
    while (previousCol) {
      const temp = previousCol.previousSibling;
      this.fullNodeHandler(info, previousCol);
      previousCol = temp;
    }

  }

  private firstColHandler(info: SelectedInfo, range: Range, startCol: Node, startOffset: number) {
    let result;
    if(startCol.nodeType === 3) {
      result = this.colTextHandler(info, startCol as Text, startOffset, (startCol.nodeValue??"").length);
    } else if(this.isColSpan(startCol)) {
      result = this.colSpanHandler(info, startCol as HTMLSpanElement, startOffset, (startCol.textContent??"").length);
    }
    if(result) {
      range.setStart(result, 0);
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