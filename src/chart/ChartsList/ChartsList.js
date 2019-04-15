
import {createElement, appendChild, addEvent, withTheme, removeEvent} from '../helpers';
import {LINE_OFF, LINE_ON, SHOW_SUB_STORE} from '../constants';
import css from './ChartsList.styl';


const isChecked = (store, lineId) => (store.lineIds.indexOf(lineId) !== -1);

const createListItem = (node, store, lineId) => {
    const switcher = createElement(css.switcher);
    const name = store.lineNames[lineId];
    const color = store.lineColors[lineId];
    const checkbox = createElement(css.checkbox);
    const title = createElement(css.title);
    // appendChild(title, document.createTextNode(name));

    const coloredTitle = createElement(css.coloredTitle);
    appendChild(coloredTitle, document.createTextNode(name));

    const whiteTitle = createElement(css.whiteTitle);
    appendChild(whiteTitle, document.createTextNode(name));

    const background = createElement(css.background);

    switcher.style.borderColor = color;
    coloredTitle.style.color = color;
    background.style.backgroundColor = color;

    if (isChecked(store, lineId)) {
        lineOn([switcher, title, color]);
    }

    addEvent(switcher, 'mousedown', () => {
        let timeout = null;
        const onMouseUp = () => {
            if (timeout) {
                clearTimeout(timeout);
            }

            removeEvent(switcher, 'mouseup', onMouseUp);

            store.toggleLine(lineId);
        };

        addEvent(switcher, 'mouseup', onMouseUp);

        timeout = setTimeout(() => {
            timeout = null;

            removeEvent(switcher, 'mouseup', onMouseUp);

            store.showLine(lineId);
        }, 500);
    });

    // addEvent(switcher, 'click', () => store.toggleLine(lineId));

    appendChild(title, coloredTitle);
    appendChild(title, whiteTitle);

    appendChild(switcher, background);
    appendChild(switcher, checkbox);
    appendChild(switcher, title);

    appendChild(node, switcher);

    return [switcher, title, color];
};

const lineOn = ([switcher, title, color]) => {
    if (!switcher.classList.contains(css.checked)) {
        switcher.classList.add(css.checked);
    }
};

const lineOff = ([switcher, title, color]) => {
    if (switcher.classList.contains(css.checked)) {
        switcher.classList.remove(css.checked);
    }
};

const createLineItems = (store, root, list) => {
    list.innerHTML = '';

    if (store.allLineIds.length < 2) {
        root.style.display = 'none';

        return;
    }

    root.style.display = 'block';

    const items = store.allLineIds.reduce(
        (acc, lineId) => Object.assign(acc, {[lineId]: createListItem(list, store, lineId)}),
        {},
    );

    store.on(LINE_ON, lineId => lineOn(items[lineId]));
    store.on(LINE_OFF, lineId => lineOff(items[lineId]));
};

const ChartsList = (store) => {
    const root = createElement(css.root);
    withTheme(store, root, css);
    const list = createElement(css.list);

    appendChild(root, list);

    createLineItems(store, root, list);

    store.on(SHOW_SUB_STORE, () => {
        if (store.transformToLineChart) {
            createLineItems(store.subStore || store, root, list);
        }
    });

    return {node: root};
};

export default ChartsList;
