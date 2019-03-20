
import css from './ChartScaler.styl';
import createSvg from '../Svg';
import {CHANGE_SIZE, CHANGE_SCALE, ANIMATE_VIEW_BOX} from '../constants';
import Control from './Control';
import {createElement, appendChild, withTheme} from '../helpers';
import {createShadow, getScaleStart, getScaleEnd, getScaleMove, getClientX, startMove, setMaxScaleWidth, preventDefault} from './helpers';


const SVG_LINE_WIDTH = 1.5;

const moveStartPoint = (event, store, node) => {
    preventDefault(event);

    const boundingClientRect = node.getBoundingClientRect();

    const onMove = (moveEvent) => {
        preventDefault(moveEvent);

        const [, end] = store.scale;

        const scaleStart = getScaleStart(moveEvent, boundingClientRect, end);

        store.changeScale(scaleStart, end);
    };

    startMove(onMove);
};

const moveEndPoint = (event, store, node) => {
    preventDefault(event);

    const boundingClientRect = node.getBoundingClientRect();

    const onMove = (moveEvent) => {
        preventDefault(moveEvent);

        const [start] = store.scale;

        const end = getScaleEnd(moveEvent, boundingClientRect, start);

        store.changeScale(start, end);
    };

    startMove(onMove);
};

const move = (event, store, node) => {
    preventDefault(event);
    const boundingClientRect = node.getBoundingClientRect();
    const [start, end] = store.scale;
    const {left: scalerLeft, width} = boundingClientRect;
    const pixelScaleStart = width * start;
    const pixelShift = getClientX(event) - scalerLeft - pixelScaleStart;
    const scaleWidth = 1 - end - start;

    const onMove = (moveEvent) => {
        preventDefault(moveEvent);

        const [scaleStart, scaleEnd] = getScaleMove(
            moveEvent,
            boundingClientRect,
            pixelShift,
            scaleWidth,
        );

        store.changeScale(scaleStart, scaleEnd);
    };

    startMove(onMove);
};

const renderControls = (store, node) => {
    const leftShadow = createShadow(node, css.leftShadow);
    const rightShadow = createShadow(node, css.rightShadow);
    const control = Control();

    control.on('moveStartPoint', event => moveStartPoint(event, store, node));
    control.on('moveEndPoint', event => moveEndPoint(event, store, node));
    control.on('move', event => move(event, store, node));

    appendChild(node, control.node);

    return [control, leftShadow, rightShadow];
};

const setSize = (store, node, chartLine) => {
    const {fullViewBox: {animationBox}, size: [,, [width, height, top]]} = store;
    node.style.top = `${top}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    chartLine.render(animationBox, width, height);

    setMaxScaleWidth(60 / width);
};

const updateControlPosition = ([start, end], control, leftShadow, rightShadow) => {
    leftShadow.style.width = `${start * 100}%`;
    rightShadow.style.width = `${end * 100}%`;

    control.setPosition(start, end);
};

const setScale = (store, chartLine) => {
    const {fullViewBox: {animationBox}, size: [,, [width, height]]} = store;
    chartLine.render(animationBox, width, height);
};

const ChartScaler = (store) => {
    const node = createElement(css.chartScaler);
    withTheme(store, node, css);
    const chartLine = createSvg(store, SVG_LINE_WIDTH);

    appendChild(node, chartLine.node);

    const [control, leftShadow, rightShadow] = renderControls(store, node);

    store.on(CHANGE_SIZE, () => setSize(store, node, chartLine));
    store.on(CHANGE_SCALE, scale => updateControlPosition(scale, control, leftShadow, rightShadow));
    store.fullViewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));

    updateControlPosition(store.scale, control, leftShadow, rightShadow);

    return {node};
};

export default ChartScaler;
