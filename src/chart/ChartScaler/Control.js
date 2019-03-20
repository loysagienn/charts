
import EventEmitter from '../EventEmitter';
import {createElement, appendChild, addEvent} from '../helpers';
import css from './ChartScaler.styl';

const getResizer = (root, className) => {
    const resizer = createElement();
    resizer.classList.add(css.resizer);
    resizer.classList.add(className);

    appendChild(root, resizer);

    return resizer;
};

const getMover = (root) => {
    const mover = createElement(css.mover);

    appendChild(root, mover);

    return mover;
};

const setPosition = (node, left, right) => {
    node.style.left = `${left * 100}%`;
    node.style.right = `${right * 100}%`;
};

const Control = () => {
    const eventEmitter = new EventEmitter();

    const node = createElement(css.control);

    const resizerStart = getResizer(node, css.startResizer);
    const resizerEnd = getResizer(node, css.endResizer);
    const mover = getMover(node);

    addEvent(resizerStart, 'mousedown', event => eventEmitter.trigger('moveStartPoint', event));
    addEvent(resizerStart, 'touchstart', event => eventEmitter.trigger('moveStartPoint', event));
    addEvent(resizerEnd, 'mousedown', event => eventEmitter.trigger('moveEndPoint', event));
    addEvent(resizerEnd, 'touchstart', event => eventEmitter.trigger('moveEndPoint', event));
    addEvent(mover, 'mousedown', event => eventEmitter.trigger('move', event));
    addEvent(mover, 'touchstart', event => eventEmitter.trigger('move', event));

    return {
        node,
        on: (event, callback) => eventEmitter.on(event, callback),
        off: (event, callback) => eventEmitter.off(event, callback),
        setPosition: (left, right) => setPosition(node, left, right),
    };
};

export default Control;
