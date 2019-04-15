
import {createElement, appendChild, addEvent, withTheme, getDate, getMonthDay, getMonth, getYear, getWeekDayString} from '../helpers';
import {CHANGE_THEME, CHANGE_SCALE, SHOW_SUB_STORE} from '../constants';
import css from './Header.styl';

const zoomSvg = `<svg style="width:24px;height:24px" viewBox="0 0 24 24">
    <path fill="#000000" d="M15.5,14H14.71L14.43,13.73C15.41,12.59 16,11.11 16,9.5A6.5,6.5 0 0,0 9.5,3A6.5,6.5 0 0,0 3,9.5A6.5,6.5 0 0,0 9.5,16C11.11,16 12.59,15.41 13.73,14.43L14,14.71V15.5L19,20.5L20.5,19L15.5,14M9.5,14C7,14 5,12 5,9.5C5,7 7,5 9.5,5C12,5 14,7 14,9.5C14,12 12,14 9.5,14M7,9H12V10H7V9Z" />
</svg>`;

const toggleState = (store, node) => {
    if (store.subStore && !node.classList.contains(css.subChart)) {
        node.classList.add(css.subChart);
    }

    if (!store.subStore && node.classList.contains(css.subChart)) {
        node.classList.remove(css.subChart);
    }
};

const getDateString = (timestamp) => {
    const date = getDate(timestamp);

    return `${getMonthDay(date)} ${getMonth(date, true)} ${getYear(date)}`;
};

const getDateRange = (store) => {
    store = store.subStore || store;

    const {viewBox, points} = store;

    const {scaleStartPoint, scaleEndPoint} = viewBox.box;

    const startIndex = Math.max(Math.round(scaleStartPoint), 0);
    const endIndex = Math.min(Math.round(scaleEndPoint), points.length - 1);

    if (startIndex >= endIndex) {
        return getDateString(points[startIndex].x);
    }

    const startStr = getDateString(points[startIndex].x);
    const endStr = getDateString(points[endIndex].x - 1);

    if (startStr === endStr) {
        const weekDay = getWeekDayString(getDate(points[startIndex].x), true);
        return `${weekDay}, ${startStr}`;
    }

    return `${startStr} - ${endStr}`;
};

const renderDateRange = (store, node) => {
    const dateNode = createElement(css.dateRange);
    const textNode = document.createTextNode(getDateRange(store));

    const updateText = () => textNode.textContent = getDateRange(store);

    appendChild(dateNode, textNode);
    appendChild(node, dateNode);

    store.on(CHANGE_SCALE, updateText);
    store.on(SHOW_SUB_STORE, () => {
        if (store.subStore) {
            store.subStore.on(CHANGE_SCALE, updateText);
        }

        updateText();
    });
};

const ThemeSwitcher = (store) => {
    const node = createElement(css.header);
    withTheme(store, node, css);

    const title = createElement(css.title);

    const zoomOutBtn = createElement(css.zoomOut);
    const zoomIcon = createElement(css.zoomIcon);
    zoomIcon.innerHTML = zoomSvg;

    appendChild(zoomOutBtn, zoomIcon);
    appendChild(zoomOutBtn, document.createTextNode('Zoom Out'));

    renderDateRange(store, node);

    const toggle = () => toggleState(store, node);

    store.on(SHOW_SUB_STORE, toggle);
    toggle();

    addEvent(zoomOutBtn, 'click', () => store.showFull());

    appendChild(title, document.createTextNode(store.name));
    appendChild(node, title);
    appendChild(node, zoomOutBtn);

    return {node};
};

export default ThemeSwitcher;
