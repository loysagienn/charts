
import {createElement, appendChild, addEvent, withTheme} from '../helpers';
import {LINE_OFF, LINE_ON} from '../constants';
import css from './ChartsList.styl';


const isChecked = (store, lineId) => (store.lineIds.indexOf(lineId) !== -1);

const createListItem = (node, store, lineId) => {
    const switcher = createElement(css.switcher);
    const name = store.lineNames[lineId];
    const color = store.lineColors[lineId];
    const checkbox = createElement(css.checkbox);
    const title = createElement(css.title);
    appendChild(title, document.createTextNode(name));

    switcher.style.borderColor = color;

    if (isChecked(store, lineId)) {
        lineOn([switcher, title, color]);
    }

    appendChild(switcher, checkbox);
    appendChild(switcher, title);

    addEvent(switcher, 'click', () => store.toggleLine(lineId));

    appendChild(node, switcher);

    return [switcher, title, color];
};

const lineOn = ([switcher, title, color]) => {
    if (!switcher.classList.contains(css.checked)) {
        switcher.classList.add(css.checked);
    }

    switcher.style.backgroundColor = color;
    title.style.color = '#ffffff';
};

const lineOff = ([switcher, title, color]) => {
    if (switcher.classList.contains(css.checked)) {
        switcher.classList.remove(css.checked);
    }

    switcher.style.backgroundColor = 'rgba(0,0,0,0)';
    title.style.color = color;
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

    store.on(LINE_ON, lineId => lineOn(lineItems[lineId]));
    store.on(LINE_OFF, lineId => lineOff(lineItems[lineId]));

    return {node: root};
};

export default ChartsList;
