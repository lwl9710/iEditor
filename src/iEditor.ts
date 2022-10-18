interface IEditorOptions {
  width?: number;
  height?: number;
  HTMLText?: string;
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

  initContainer() {
    this.container.className = "i-editor-container";
    this.initHeader();
    this.initMain();
    this.initPlaceholder();
    this.container.appendChild(this.header);
    this.container.appendChild(this.main);
    this.container.appendChild(this.placeholder);
  }

  initHeader() {
    this.header.style.height = "50px";
    this.header.style.backgroundColor = "yellowgreen";
    this.header.className = "i-editor-header";
  }

  initMain() {
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

  hasContent(): boolean {
    return this.main.childElementCount > 1 || (this.main.childElementCount === 1 && this.main.firstElementChild?.firstChild?.nodeName !== "BR");
  }

  initPlaceholder() {
    this.placeholder.className = "i-editor-placeholder";
    this.placeholder.innerText = "请输入内容...";
  }

  showPlaceholder(isShow: boolean) {
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
}