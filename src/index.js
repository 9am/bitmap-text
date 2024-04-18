import css from './index.css?inline';
import { font as defaultFont } from './font';

const baseCSS = new CSSStyleSheet();
baseCSS.replaceSync(css);

class BitmapText extends HTMLElement {
    #observer;
    #fontCSS = new CSSStyleSheet();
    #charset = new Map();
    #size = [0, 0];

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.adoptedStyleSheets = [baseCSS, this.#fontCSS];
        this.attachFont(defaultFont);
    }

    attachFont(font = {}) {
        const { charset = new Map(), size = [0, 0] } = font;
        const needForceRender = size[0] * size[1] !== this.#size[0] * this.#size[1];
        this.#charset = charset;
        this.#size = size;

        this.#fontCSS.replaceSync(this.#generateFontCSS());

        this.style.setProperty('--column', `${size[0]}`);
        this.style.setProperty('--row', `${size[1]}`);
        this.update(needForceRender);
    }

    update(force = false) {
        if (force) {
            this.shadowRoot.innerHTML = '';
        }
        const [w, h] = this.#size;
        const dotNum = w * h;
        const text = this.textContent.trim().replace(/\s{2,}/g, ' ');

        const chars = text.split('');
        let children = [...this.shadowRoot.children];
        chars.forEach((key, i) => {
            const curr = children[i];
            const keyName = this.#charset.has(key) ? key : '⍰';
            const cls = `char c-${keyName.charCodeAt(0)}`;
            if (curr) {
                curr.className = cls;
            } else {
                this.shadowRoot.appendChild(this.#createChar(cls, dotNum));
            }
        });
        while (this.shadowRoot.children.length !== chars.length) {
            this.shadowRoot.removeChild(this.shadowRoot.lastElementChild);
        }
    }

    connectedCallback() {
        this.#observer = new MutationObserver(() => {
            this.update();
        });
        this.#observer.observe(this, {
            childList: true,
        });
    }
    disconnectedCallback() {
        this.#observer?.disconnect();
    }

    #createChar(cls, dotNum) {
        const ol = document.createElement('ol');
        ol.className = cls;
        ol.setAttribute('part', 'char');
        ol.appendChild(
            Array.from({ length: dotNum }).reduce((memo, _, i) => {
                const li = document.createElement('li');
                li.setAttribute('part', 'cell');
                memo.appendChild(li);
                return memo;
            }, document.createDocumentFragment())
        );
        return ol;
    }

    #generateFontCSS() {
        const [w, h] = this.#size;
        let css = '';
        for (const [key, value] of this.#charset.entries()) {
            css +=
                value
                    .map((num, row) =>
                        this.#getBitIs1(num)
                            .map(
                                (index) =>
                                    `.c-${key.charCodeAt(0)} li:nth-child(${
                                        row * w + w - index
                                    })`
                            )
                            .join(',')
                    )
                    .filter((x) => x.length) + '{--bg-none: var(--bg-fill)}';
        }
        return css;
    }

    #getBitIs1(num) {
        let input = num;
        let count = 0;
        const output = [];
        while (input !== 0) {
            if (input & 1) {
                output.push(count);
            }
            input >>= 1;
            count++;
        }
        return output;
    }
}

if (window && !window.customElements.get('bitmap-text')) {
    window.customElements.define('bitmap-text', BitmapText);
}

export { BitmapText };
export default null;
