import css from './Webgl.styl';
// import getPolylinePoints from './getPolylinePoints';
import {createElement, appendChild} from '../helpers';
// import Canvas from '../Canvas';
import {LINE_ON, LINE_OFF, VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT, SHOW_SUB_STORE} from '../constants';
import nextFrame, {markHasBeenPlanned} from '../nextFrame';
import lineGlContext from './lineGl/glContext';
import barGlContext from './barGl/glContext';
import areaGlContext from './areaGl/glContext';
import pieGlContext from './pieGl/glContext';
import {getPixelRatio} from './helpers';


const toggleZIndex = (node) => {
    let zIndex = 1;

    return () => {
        node.style.zIndex = zIndex;

        zIndex = zIndex === 1 ? 2 : 1;
    };
};

let imagesCount = 0;
const bottomPadding = VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;

const changeLineOpacity = (
    renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, step, fromTimeout, timeFactor = 1,
) => {
    renderCurrent();

    const opacity = linesOpacity[lineId];

    if (fromTimeout && (opacity === 0 || opacity === 1)) {
        return;
    }

    const actualStep = step * (opacity + 0.3) * (1 + timeFactor) / 2;

    linesOpacity[lineId] += actualStep;

    if (linesOpacity[lineId] <= 0) {
        linesOpacity[lineId] = 0;
    } else if (linesOpacity[lineId] >= 1) {
        linesOpacity[lineId] = 1;
    }

    const mark = `${lineOpacityFrameMark}${lineId}`;

    // eslint-disable-next-line no-shadow
    nextFrame(timeFactor => changeLineOpacity(
        renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, step, true, timeFactor,
    ), mark);
};

const getDiffFactor = (store) => {
    const {box, animationBox} = store.viewBox;

    return Math.abs(box.maxY - animationBox.maxY) / (animationBox.maxY - animationBox.minY);
};

const changeBarHeight = (
    renderCurrent, barsHeight, store, lineOpacityFrameMark, lineId, target, step = 0, fromTimeout, timeFactor = 1,
) => {
    renderCurrent(true);

    const height = barsHeight[lineId];

    if (fromTimeout && ((target === 0 && height === 0) || (target === 1 && height === 1))) {
        return;
    }

    const diffFactor = getDiffFactor(store);

    const targetHits = (diffFactor * 9 + 11) / 2;

    const targetStep = ((target - height) / targetHits);

    step = (step + targetStep) / 2;


    const shift = (step + step * timeFactor) / 2;

    barsHeight[lineId] += shift;

    if (barsHeight[lineId] <= 0.0001) {
        barsHeight[lineId] = 0;
    } else if (barsHeight[lineId] >= 0.9999) {
        barsHeight[lineId] = 1;
    }

    const mark = `${lineOpacityFrameMark}${lineId}`;

    // eslint-disable-next-line no-shadow
    nextFrame(timeFactor => changeBarHeight(
        renderCurrent, barsHeight, store, lineOpacityFrameMark, lineId, target, step, true, timeFactor,
    ), mark);
};

const getWebgl = (node, store, barsHeight, canvas) => {
    store = store.subStore || store;

    let glContext = lineGlContext;

    if (store.isBar) {
        glContext = barGlContext;
    } else if (store.isArea) {
        glContext = areaGlContext;
    } else if (store.isPie) {
        glContext = pieGlContext;
    }

    const webgl = glContext(store, barsHeight, canvas);

    if (!canvas) {
        webgl.canvas.classList.add(css.canvas);
    }

    appendChild(node, webgl.canvas);

    webgl.canvas.addEventListener('webglcontextlost', () => {
        webgl.isLost = true;

        destroyWebgl(node, webgl);
    }, true);

    return webgl;
};

const destroyWebgl = (node, webgl) => {
    if (node.contains(webgl.canvas)) {
        node.removeChild(webgl.canvas);
    }

    webgl.destroy();
};

const canvas2dHideEffect = (node, webgl, width, height) => {
    const glCanvas = webgl.gl.canvas;
    const canvas2d = document.createElement('canvas');
    canvas2d.classList.add(css.canvas2d);
    const canvas2dCtx = canvas2d.getContext('2d');

    height += bottomPadding;
    const pixelRatio = getPixelRatio();
    const pixelWidth = width * pixelRatio;
    const pixelHeight = height * pixelRatio;

    canvas2d.style.width = `${width}px`;
    canvas2d.style.height = `${height}px`;
    canvas2d.width = pixelWidth;
    canvas2d.height = pixelHeight;

    canvas2dCtx.drawImage(glCanvas, 0, 0);

    appendChild(node, canvas2d);

    canvas2d.style.opacity = 1;
    glCanvas.style.opacity = 0;

    nextFrame(() => {
        canvas2d.style.opacity = 0;
        glCanvas.classList.add(css.transition);
        nextFrame(() => {
            glCanvas.style.opacity = 1;
        });
    });

    setTimeout(() => {
        node.removeChild(canvas2d);
        glCanvas.classList.remove(css.transition);
    }, 6000);
};

const getLinesOpacity = store => store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});

const renderPieNumbers = (store, node) => {
    const {allLineIds} = store;
    const pieNode = createElement(css.pieNumbers);
    const pieItems = {};

    allLineIds.forEach((lineId) => {
        const elem = createElement(css.pieNumber);
        const inner = createElement(css.pieNumberInner);
        const text = document.createTextNode('10');

        appendChild(inner, text);
        appendChild(elem, inner);
        appendChild(pieNode, elem);

        pieItems[lineId] = {
            node: elem,
            textNode: inner,
            text,
        };
    });

    appendChild(node, pieNode);

    return {node: pieNode, items: pieItems};
};

const Webgl = (store, lineWidth = 2, padding = 0) => {
    let webgl;

    const node = createElement(css.image);

    const pieNumbers = renderPieNumbers(store, node);

    let linesOpacity = getLinesOpacity(store);
    const barsHeight = store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});

    webgl = getWebgl(node, store, barsHeight);


    let currentWidth = 0;
    let currentHeight = 0;
    let needUpdateChartData = false;

    const reRenderFrameMark = `${store.nextFramePrefix}webglRerender${imagesCount++}`;
    const lineOpacityFrameMark = `${store.nextFramePrefix}webglLineOpacity${imagesCount++}`;

    const reRender = (width, height) => nextFrame(() => {
        const pixelRatio = getPixelRatio();

        if (width !== currentWidth || height !== currentHeight) {
            // node.style.width = `${width}px`;
            // node.style.height = `${height + bottomPadding}px`;
        }

        currentWidth = width;
        currentHeight = height;

        if (!webgl || webgl.isLost) {
            webgl = getWebgl(node, store, barsHeight);
        }

        if (needUpdateChartData) {
            webgl.updateChartData();

            needUpdateChartData = false;
        }

        webgl.render(width, height, padding, linesOpacity, pixelRatio, bottomPadding, pieNumbers);

        // toggleNodeZIndex();
    }, reRenderFrameMark);

    const renderCurrent = (updateChartData) => {
        needUpdateChartData = updateChartData;

        if (markHasBeenPlanned(reRenderFrameMark)) {
            return;
        }

        reRender(currentWidth, currentHeight);
    };

    const onLineOff = (lineId) => {
        const activeStore = store.subStore || store;

        if (activeStore.isBar || activeStore.isArea || activeStore.isPie) {
            changeBarHeight(renderCurrent, barsHeight, activeStore, lineOpacityFrameMark, lineId, 0);
        } else {
            changeLineOpacity(renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, -0.1);
        }
    };
    const onLineOn = (lineId) => {
        const activeStore = store.subStore || store;

        if (activeStore.isBar || activeStore.isArea || activeStore.isPie) {
            changeBarHeight(renderCurrent, barsHeight, activeStore, lineOpacityFrameMark, lineId, 1);
        } else {
            changeLineOpacity(renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, 0.1);
        }
    };

    store.on(LINE_OFF, onLineOff);
    store.on(LINE_ON, onLineOn);
    store.on(SHOW_SUB_STORE, () => {
        webgl.render(currentWidth, currentHeight, padding, linesOpacity, getPixelRatio(), bottomPadding);

        canvas2dHideEffect(node, webgl, currentWidth, currentHeight);

        destroyWebgl(node, webgl);

        if (store.transformToLineChart) {
            const activeStore = store.subStore || store;

            linesOpacity = getLinesOpacity(activeStore);
            activeStore.on(LINE_OFF, onLineOff);
            activeStore.on(LINE_ON, onLineOn);
        }

        if (store.subStore && store.subStore.isPie) {
            pieNumbers.node.style.opacity = 1;
        } else {
            pieNumbers.node.style.opacity = 0;
        }

        webgl = getWebgl(node, store, barsHeight, webgl.gl.canvas);

        renderCurrent();
    });

    const destroy = () => {
        store.off(LINE_OFF, onLineOff);
        store.off(LINE_ON, onLineOn);
    };

    return {
        node,
        render: reRender,
        destroy,
    };
};

export default Webgl;
