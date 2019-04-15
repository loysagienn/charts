
import css from './ChartScaler.styl';
// import createSvg from '../ScalebleSvg';
import {CHANGE_SIZE, CHANGE_SCALE, ANIMATE_VIEW_BOX, SHOW_SUB_STORE} from '../constants';
import Control from './Control';
import {createElement, appendChild, withTheme} from '../helpers';
import nextFrame from '../nextFrame';
import {createShadow, getScaleStart, getScaleEnd, getScaleMove, getClientX, getClientY, startMove, setMaxScaleWidth, preventDefault, isScrollMove} from './helpers';

// const RADIUS = 5;

// const h = CHART_SCALER_HEIGHT;

const svgD = 'M20 10 L15 10    A5 5 0 0 0 10 15    L10 45     A5 5 0 0 0 15 50    L20 50 L20 60 L0 60 L0 0 L20 0';

const changeScale = (store, start, end) => {
    store = store.subStore || store;

    store.changeScale(start, end);
};

const moveStartPoint = (event, store, node) => {
    store = store.subStore || store;

    preventDefault(event);
    let moving = false;
    const moveStartCoords = [getClientX(event), getClientY(event)];

    const boundingClientRect = node.getBoundingClientRect();

    let cancelMove = () => {};

    const onMove = (moveEvent) => {
        if (!moving && isScrollMove(moveStartCoords, moveEvent)) {
            cancelMove();

            return;
        }

        moving = true;

        store.dragStart();

        preventDefault(moveEvent);

        const [, end] = store.scale;

        const scaleStart = getScaleStart(moveEvent, boundingClientRect, end);

        changeScale(store, scaleStart, end);
    };

    const clear = () => store.dragEnd();

    cancelMove = startMove(onMove, clear);
};

const moveEndPoint = (event, store, node) => {
    store = store.subStore || store;

    preventDefault(event);
    let moving = false;
    const moveStartCoords = [getClientX(event), getClientY(event)];

    const boundingClientRect = node.getBoundingClientRect();

    let cancelMove = () => {};

    const onMove = (moveEvent) => {
        if (!moving && isScrollMove(moveStartCoords, moveEvent)) {
            cancelMove();

            return;
        }

        moving = true;

        store.dragStart();

        preventDefault(moveEvent);

        const [start] = store.scale;

        const end = getScaleEnd(moveEvent, boundingClientRect, start);

        changeScale(store, start, end);
    };

    const clear = () => store.dragEnd();

    cancelMove = startMove(onMove, clear);
};

const move = (event, store, node) => {
    store = store.subStore || store;

    preventDefault(event);
    let moving = false;
    const moveStartCoords = [getClientX(event), getClientY(event)];
    const boundingClientRect = node.getBoundingClientRect();
    const [start, end] = store.scale;
    const {left: scalerLeft, width} = boundingClientRect;
    const pixelScaleStart = width * start;
    const pixelShift = moveStartCoords[0] - scalerLeft - pixelScaleStart;
    const scaleWidth = 1 - end - start;

    let cancelMove = () => {};

    const onMove = (moveEvent) => {
        if (!moving && isScrollMove(moveStartCoords, moveEvent)) {
            cancelMove();

            return;
        }

        moving = true;

        store.dragStart();

        preventDefault(moveEvent);

        const [scaleStart, scaleEnd] = getScaleMove(
            moveEvent,
            boundingClientRect,
            pixelShift,
            scaleWidth,
        );

        changeScale(store, scaleStart, scaleEnd);
    };

    const clear = () => store.dragEnd();

    cancelMove = startMove(onMove, clear);
};

const renderDampers = (node) => {
    const leftDamper = createElement(css.leftDamper);
    const rightDamper = createElement(css.rightDamper);

    leftDamper.innerHTML = `<svg><path d="${svgD}"></path></svg>`;
    rightDamper.innerHTML = `<svg><path d="${svgD}"></path></svg>`;

    appendChild(node, leftDamper);
    appendChild(node, rightDamper);

    return [leftDamper, rightDamper];
};

const renderControls = (store, node) => {
    const shadows = createElement(css.shadows);
    const leftShadow = createShadow(shadows, css.leftShadow);
    const rightShadow = createShadow(shadows, css.rightShadow);
    const control = Control();

    control.on('moveStartPoint', event => moveStartPoint(event, store, node));
    control.on('moveEndPoint', event => moveEndPoint(event, store, node));
    control.on('move', event => move(event, store, node));

    appendChild(node, shadows);
    appendChild(node, control.node);

    return [control, leftShadow, rightShadow];
};

const setSize = (store, node) => {
    const {size: [,, [width, height, top]]} = store;
    node.style.top = `${top}px`;
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    const maxWidth = Math.min(60, width / 8);

    setMaxScaleWidth(maxWidth / width);
};

const updateControlPosition = (store, control, leftShadow, rightShadow) => {
    store = store.subStore || store;
    const [start, end] = store.scale;

    leftShadow.style.transform = `translate(${start * 100}%, 0)`;
    rightShadow.style.transform = `translate(-${end * 100}%, 0)`;

    control.setPosition(start, end);

    // setDampersZIndex(dampers);
};

const toggleZIndex = (node, mark) => {
    let zIndex = 1;

    return () => nextFrame(() => {
        node.style.zIndex = zIndex;

        zIndex = zIndex === 5 ? 6 : 1;
    }, mark);
};

const ChartScaler = (store) => {
    const node = createElement(css.chartScaler);
    let controlAnimationTimeout = null;
    withTheme(store, node, css);

    renderDampers(node);

    const toggleNodeZIndex = toggleZIndex(node, 'toggle_chart_scaler_z_index');

    const [control, leftShadow, rightShadow] = renderControls(store, node);

    const onChangeScale = () => updateControlPosition(store, control, leftShadow, rightShadow);

    store.on(CHANGE_SIZE, () => setSize(store, node));
    store.on(CHANGE_SCALE, onChangeScale);

    store.on(SHOW_SUB_STORE, () => {
        if (store.subStore) {
            store.subStore.on(CHANGE_SCALE, onChangeScale);
        }

        if (controlAnimationTimeout) {
            clearTimeout(controlAnimationTimeout);
        }

        node.classList.add(css.animation);

        controlAnimationTimeout = setTimeout(() => {
            node.classList.remove(css.animation);
        }, 500);

        onChangeScale();
    });

    nextFrame(() => store.viewBox.on(ANIMATE_VIEW_BOX, toggleNodeZIndex));

    updateControlPosition(store, control, leftShadow, rightShadow);

    return {node};
};

export default ChartScaler;
