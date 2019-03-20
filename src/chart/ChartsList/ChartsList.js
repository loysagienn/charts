
import {createElement, appendChild, addEvent, withTheme} from '../helpers';
import {CHANGE_SIZE, LINE_OFF, LINE_ON} from '../constants';
import css from './ChartsList.styl';

const setSize = (node, store) => {
    const {size: [,,, [width, height]]} = store;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
};

const isChecked = (store, lineId) => (store.lineIds.indexOf(lineId) !== -1);

const createListItem = (node, store, lineId) => {
    const item = createElement(css.item);
    const name = store.lineNames[lineId];
    const color = store.lineColors[lineId];
    const switcher = createElement(css.switcher);
    const switcherCheck = createElement(css.switcherCheck);
    const switcherInner = createElement(css.switcherInner);

    if (isChecked(store, lineId)) {
        lineOn([switcher]);
    }

    switcher.style.backgroundColor = color;

    appendChild(switcher, switcherCheck);
    appendChild(switcher, switcherInner);
    appendChild(item, switcher);
    appendChild(item, document.createTextNode(name));

    addEvent(item, 'click', () => store.toggleLine(lineId));

    appendChild(node, item);

    return [switcher];
};

const lineOn = ([switcher]) => {
    if (!switcher.classList.contains(css.checked)) {
        switcher.classList.add(css.checked);
    }
};

const lineOff = ([switcher]) => {
    if (switcher.classList.contains(css.checked)) {
        switcher.classList.remove(css.checked);
    }
};

const ChartsList = (store) => {
    const root = createElement(css.root);
    withTheme(store, root, css);
    const list = createElement(css.list);

    appendChild(root, list);

    const lineItems = store.allLineIds.reduce(
        (acc, lineId) => Object.assign(acc, {[lineId]: createListItem(list, store, lineId)}),
        {},
    );

    store.on(CHANGE_SIZE, () => setSize(root, store));
    store.on(LINE_ON, lineId => lineOn(lineItems[lineId]));
    store.on(LINE_OFF, lineId => lineOff(lineItems[lineId]));

    return {node: root};
};

export default ChartsList;
