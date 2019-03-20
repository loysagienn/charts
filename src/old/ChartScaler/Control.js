
import EventEmitter from '../EventEmitter';
import css from './ChartScaler.styl';

const getResizer = (root, className) => {
    const resizer = document.createElement('div');
    resizer.classList.add(css.resizer);
    resizer.classList.add(className);

    root.appendChild(resizer);

    return resizer;
};

const getMover = (root) => {
    const mover = document.createElement('div');
    mover.classList.add(css.mover);

    root.appendChild(mover);

    return mover;
};

class Control extends EventEmitter {
    constructor() {
        super();

        this._node = document.createElement('div');

        this._node.classList.add(css.control);

        this._resizerStart = getResizer(this._node, css.startResizer);
        this._resizerEnd = getResizer(this._node, css.endResizer);
        this._mover = getMover(this._node);

        this._resizerStart.addEventListener('mousedown', event => this.trigger('moveStartPoint', event));
        this._resizerStart.addEventListener('touchstart', event => this.trigger('moveStartPoint', event));
        this._resizerEnd.addEventListener('mousedown', event => this.trigger('moveEndPoint', event));
        this._resizerEnd.addEventListener('touchstart', event => this.trigger('moveEndPoint', event));
        this._mover.addEventListener('mousedown', event => this.trigger('move', event));
        this._mover.addEventListener('touchstart', event => this.trigger('move', event));
    }

    setPosition(left, right) {
        this._node.style.left = `${left * 100}%`;
        this._node.style.right = `${right * 100}%`;
    }

    get node() {
        return this._node;
    }
}

export default Control;
