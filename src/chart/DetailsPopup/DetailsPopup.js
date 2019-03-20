
import createSvg from '../Svg';
import createChartGrid from '../ChartGrid';
import createBottomLabels from '../BottomLabels';
import {createElement, appendChild, withTheme, addEvent, removeEvent} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX, PADDING} from '../constants';
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
    node.classList.add(css.visible);
    onMove(event);

    const cancelEvents = () => {
        node.classList.remove(css.visible);
        removeEvent(node, 'mousemove', onMove);
        removeEvent(node, 'touchmove', onMove);
        removeEvent(node, 'mouseleave', cancelEvents);
        removeEvent(node, 'touchend', cancelEvents);
    };

    addEvent(node, 'mousemove', onMove);
    addEvent(node, 'touchmove', onMove);
    addEvent(node, 'mouseleave', cancelEvents);
    addEvent(node, 'touchend', cancelEvents);

    return cancelEvents;
};

const onMouseMove = (node, store, [line, marks], event, currentIndex) => {
    const {points, lineIds, size: [, [width]], viewBox: {box}} = store;

    const {startIndex, startIndexPart, endIndexPart, maxY, minY} = box;

    const valueHeight = maxY - minY;
    const indexWidth = endIndexPart - startIndexPart;
    const {left: nodeLeft} = node.getBoundingClientRect();
    const left = getClientX(event) - nodeLeft;

    const index = Math.round(left * indexWidth / (width - (PADDING * 2)) + startIndexPart);
    const point = points[index];

    // console.log(index);

    const lineLeft = Math.round(1000 * (index - startIndexPart) / indexWidth) / 10;

    lineIds.forEach((id) => {
        const y = point.lines[id];

        const bottom = Math.round(1000 * y / valueHeight) / 10;

        marks[id].style.bottom = `${bottom}%`;
    });

    line.style.left = `${lineLeft}%`;
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

    return [line, marks];
};

export const DetailsPopup = (store) => {
    const node = createElement(css.root);
    withTheme(store, node, css);

    let currentIndex = null;

    console.log(store);

    const line = renderLine(store);

    appendChild(node, line[0]);

    store.on(CHANGE_SIZE, () => setSize(node, store));

    const onMove = event => (currentIndex = onMouseMove(node, store, line, event, currentIndex));

    addEvent(node, 'mouseenter', event => startMove(node, onMove, event));
    addEvent(node, 'touchstart', event => startMove(node, onMove, event));

    return {node};
};

export default DetailsPopup;
