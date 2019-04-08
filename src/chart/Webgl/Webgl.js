import css from './Webgl.styl';
// import getPolylinePoints from './getPolylinePoints';
import {createElement, appendChild} from '../helpers';
// import Canvas from '../Canvas';
import {LINE_ON, LINE_OFF, VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../constants';
import nextFrame, {markHasBeenPlanned} from '../nextFrame';
import glContext from './glContext';
import {getPixelRatio} from './helpers';


let imagesCount = 0;

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

const getWebgl = (node, store) => {
    const webgl = glContext(store);

    webgl.canvas.classList.add(css.canvas);

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
};

const Webgl = (store, lineWidth = 2, padding = 0) => {
    let webgl;

    const node = createElement(css.root);

    const canvas2d = document.createElement('canvas');
    const canvas2dCtx = canvas2d.getContext('2d');
    canvas2d.style.display = 'none';

    appendChild(node, canvas2d);

    webgl = getWebgl(node, store);


    let currentWidth = 0;
    let currentHeight = 0;
    let currentFullViewBox = null;
    let currentViewBox = null;


    const linesOpacity = store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});
    const reRenderFrameMark = `${store.nextFramePrefix}webglRerender${imagesCount++}`;
    const lineOpacityFrameMark = `${store.nextFramePrefix}webglLineOpacity${imagesCount++}`;

    const reRender = (fullViewBox, viewBox, width, height) => nextFrame(() => {
        const pixelRatio = getPixelRatio();

        if (width !== currentWidth || height !== currentHeight) {
            node.style.width = `${width}px`;
            node.style.height = `${height}px`;
        }

        currentWidth = width;
        currentHeight = height;
        currentViewBox = viewBox;
        currentFullViewBox = fullViewBox;

        if (!webgl || webgl.isLost) {
            webgl = getWebgl(node, store);
        }

        const bottomPadding = VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;

        webgl.render(viewBox, fullViewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio, bottomPadding);
    }, reRenderFrameMark);

    const renderCurrent = () => {
        if (!currentViewBox || markHasBeenPlanned(reRenderFrameMark)) {
            return;
        }

        reRender(currentFullViewBox, currentViewBox, currentWidth, currentHeight);
    };

    const onLineOff = lineId => (
        changeLineOpacity(renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, -0.1)
    );
    const onLineOn = lineId => (
        changeLineOpacity(renderCurrent, linesOpacity, lineOpacityFrameMark, lineId, 0.1)
    );

    store.on(LINE_OFF, onLineOff);
    store.on(LINE_ON, onLineOn);

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
