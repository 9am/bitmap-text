import css from './index.css?inline';

const template = document.createElement('template');
template.innerHTML = `
    <style>
        ${css}
        .char li:hover {
            order: var(--order);
        }
    </style>
    <div class="wrapper">
        <ol class="char">
            ${Array.from({ length: 5 * 7 })
                .map(
                    (_, i) => `
                    <li data-i="${i}">
                        <input type="checkbox" />
                    </li>
                    `
                )
                .join('')}
        </ol>
    <div>
    <button>reset</button>
    <pre></pre>
`;

class BitmapGenerator extends HTMLElement {
    private _output: HTMLElement;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.append(template.content.cloneNode(true));
        this.shadowRoot.querySelector('button').addEventListener('click', this.reset);
        this.shadowRoot.addEventListener('change', this.onUpdate);
        this._output = this.shadowRoot.querySelector('pre');
    }

    reset = () => {
        this.setClipboard(this._output.textContent);
        [...this.shadowRoot.querySelectorAll('input')].map(
            (input) => (input.checked = false)
        );
    };

    setClipboard(text) {
        const type = 'text/plain';
        const blob = new Blob([text], { type });
        const data = [new ClipboardItem({ [type]: blob })];

        navigator.clipboard.write(data).then(
            () => {
                /* success */
            },
            () => {
                /* failure */
            }
        );
    }

    onUpdate = () => {
        const output = [[], [], [], [], [], [], []];
        [...this.shadowRoot.querySelectorAll('input')].forEach((input, i) => {
            const row = Math.floor(i / 5);
            output[row].push(input.checked ? 1 : 0);
        });
        const result = output.map((arr) => {
            return `0b${arr.join('').toString(2)}`;
        });
        this._output.textContent = result;
    };
}

window.customElements.define('bitmap-generator', BitmapGenerator);
