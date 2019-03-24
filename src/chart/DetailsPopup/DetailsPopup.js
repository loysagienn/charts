
import createSvg from '../Svg';
import createChartGrid from '../ChartGrid';
import createBottomLabels from '../BottomLabels';
import {createElement, appendChild, withTheme, addEvent, removeEvent} from '../helpers';
import {CHANGE_SIZE, LINE_ON, LINE_OFF, PADDING} from '../constants';
import nextFrame from '../nextFrame';
import css from './DetailsPopup.styl';


const setSize = (node, store) => {
    const {size: [, [width, height]]} = store;

    node.style.width = `${width - (PADDING * 2)}px`;
    node.style.height = `${height}px`;
};

const getClientX = (event) => {
    const {type} = event;

    if (type.startsWith('touch')) {
        return event.touches[0].clientX;
    }

    return event.clientX;
};

const startMove = (node, onMove, event) => {
    if (event.target !== node) {
        return;
    }
    onMove(event);

    node.classList.add(css.visible);

    const cancelEvents = () => {
        node.classList.remove(css.visible);
        removeEvent(node, 'mousemove', onMove);
        removeEvent(window, 'touchmove', onMove);
        removeEvent(node, 'mouseleave', cancelEvents);
        removeEvent(window, 'touchend', cancelEvents);
    };

    addEvent(node, 'mousemove', onMove);
    addEvent(window, 'touchmove', onMove);
    addEvent(node, 'mouseleave', cancelEvents);
    addEvent(window, 'touchend', cancelEvents);
};

const updatePopup = ([popup, xValue, yValues], {x, lines}, {lineIds, lineColors, lineNames}, width, lineLeft) => {
    console.log('update popup');

    const date = new Date(x);
    const dateText = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});

    xValue.innerHTML = '';
    appendChild(xValue, document.createTextNode(dateText));

    yValues.innerHTML = '';

    lineIds.forEach((lineId) => {
        const item = createElement(css.yItemValueLine);
        item.style.color = lineColors[lineId];

        const name = createElement(css.yItemName);
        const value = createElement(css.yItemValue);
        appendChild(name, document.createTextNode(`${lineNames[lineId]}:`));
        appendChild(value, document.createTextNode(lines[lineId]));

        appendChild(item, name);
        appendChild(item, value);

        appendChild(yValues, item);
    });

    const popupWidth = popup.offsetWidth;

    if (lineLeft - (popupWidth / 2) - 10 < 0) {
        popup.style.transform = `translate(${10 - lineLeft - PADDING}px, 0)`;
    } else if (lineLeft + (popupWidth / 2) - 10 > width - (PADDING * 2)) {
        popup.style.transform = `translate(${width - lineLeft - popupWidth - (PADDING * 2) + 10}px, 0)`;
    } else {
        popup.style.transform = 'translate(-50%, 0)';
    }

    console.log(popupWidth);
};

let updatePopupThrottleTimeout = null;

const throttledUpdatePopup = (popup, point, store, width, lineLeft) => {
    const [popupNode] = popup;
    if (updatePopupThrottleTimeout === null) {
        popupNode.style.opacity = 0;
    } else {
        clearTimeout(updatePopupThrottleTimeout);
    }

    updatePopupThrottleTimeout = setTimeout(() => {
        updatePopupThrottleTimeout = null;
        popupNode.style.opacity = 1;

        nextFrame(() => updatePopup(popup, point, store, width, lineLeft));
    }, 300);
};

// const throttledUpdatePopup = throttle(updatePopup, 300);

const onMouseMove = (node, store, [line, marks, popup], event, currentIndex) => {
    const {points, lineIds, size: [, [width, height]], viewBox: {box}} = store;

    const {scaleStartPoint, scaleEndPoint, maxY, minY} = box;

    const valueHeight = maxY - minY;
    const indexWidth = scaleEndPoint - scaleStartPoint;
    const {left: nodeLeft} = node.getBoundingClientRect();
    const left = getClientX(event) - nodeLeft;

    const index = Math.round(left * indexWidth / (width - (PADDING * 2)) + scaleStartPoint);
    const point = points[index];

    if (currentIndex === index) {
        return index;
    }

    const lineLeft = (width - (PADDING * 2)) * (index - scaleStartPoint) / indexWidth;

    lineIds.forEach((id) => {
        const y = point.lines[id];

        const bottom = height * y / valueHeight;

        // marks[id].style.bottom = `${bottom}%`;
        marks[id].style.transform = `translate(0, ${-bottom}px)`;
    });

    line.style.transform = `translate(${lineLeft}px, 0)`;

    // line.style.left = `${lineLeft}%`;

    throttledUpdatePopup(popup, point, store, width, lineLeft);

    return index;
};

const createPopup = (root) => {
    const popup = createElement(css.popup);
    appendChild(root, popup);

    const xValue = createElement(css.popupXValue);
    const yValues = createElement(css.popupYValues);

    appendChild(popup, xValue);
    appendChild(popup, yValues);

    return [popup, xValue, yValues];
};

const renderLine = (store) => {
    const {allLineIds, lineColors} = store;

    const line = createElement(css.line);

    const marks = allLineIds.reduce((acc, id) => {
        const mark = createElement(css.mark);

        mark.style.borderColor = lineColors[id];

        appendChild(line, mark);

        return Object.assign(acc, {[id]: mark});
    }, {});

    const popup = createPopup(line);

    return [line, marks, popup];
};

export const DetailsPopup = (store) => {
    const node = createElement(css.root);
    withTheme(store, node, css);

    console.log(store);

    let currentIndex = null;

    const line = renderLine(store);
    const [, marks] = line;

    appendChild(node, line[0]);

    store.on(CHANGE_SIZE, () => setSize(node, store));
    store.on(LINE_ON, lineId => (marks[lineId].style.display = 'block'));
    store.on(LINE_OFF, lineId => (marks[lineId].style.display = 'none'));

    const onMove = event => (currentIndex = onMouseMove(node, store, line, event, currentIndex));

    addEvent(node, 'mouseenter', event => startMove(node, onMove, event));
    addEvent(window, 'touchstart', event => startMove(node, onMove, event));

    return {node};
};

export default DetailsPopup;
