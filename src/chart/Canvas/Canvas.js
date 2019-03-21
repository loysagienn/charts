import css from './Canvas.styl';
// import getPolylinePoints from './getPolylinePoints';
// import {createElement, appendChild} from '../helpers';
import {LINE_ON, LINE_OFF} from '../constants';

const pixelRatio = () => window.devicePixelRatio || 1;

const animationTimeout = 20;

const renderLine = (ctx, points, lineId, viewBox, width, height, padding, color) => {
    const {minY, maxY, scaleStartPoint, scaleEndPoint} = viewBox;

    // чтобы нижняя точка графика не обрезалась
    height -= 1;

    const minIndex = 0;
    const maxIndex = points.length - 1;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = (width - (padding * 2)) / indexWidth;
    const factorY = height / originalHeight;
    const pixelRatioFactor = pixelRatio();

    const paddingIndex = padding / factorX;
    const lineStartIndex = Math.max(Math.floor(scaleStartPoint - paddingIndex), minIndex);
    const lineEndIndex = Math.min(Math.ceil(scaleEndPoint + paddingIndex), maxIndex);

    // const polylinePoints = lineIds.reduce((acc, id) => Object.assign(acc, {[id]: []}), {});
    ctx.beginPath();

    const firstX = ((lineStartIndex - scaleStartPoint) * factorX + padding) * pixelRatioFactor;
    const firstY = (height - ((points[lineStartIndex].lines[lineId] - minY) * factorY)) * pixelRatioFactor;

    ctx.moveTo(firstX, firstY);

    for (let i = lineStartIndex + 1; i <= lineEndIndex; i++) {
        const y = points[i].lines[lineId];

        const positionX = ((i - scaleStartPoint) * factorX + padding) * pixelRatioFactor;
        const positionY = (height - ((y - minY) * factorY)) * pixelRatioFactor;

        ctx.lineTo(positionX, positionY);
    }

    ctx.strokeStyle = color;
    ctx.stroke();
};

const render = (store, ctx, viewBox, width, height, padding, lineWidth, linesOpacity) => {
    const {points, allLineIds, getColor} = store;

    const ratio = pixelRatio();

    ctx.clearRect(0, 0, width * ratio, height * ratio);
    ctx.lineWidth = lineWidth * ratio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < allLineIds.length; i++) {
        const lineId = allLineIds[i];

        const opacity = linesOpacity[lineId];
        const color = getColor(lineId, opacity);

        renderLine(ctx, points, lineId, viewBox, width, height, padding, color, opacity);
    }
};

const updateSize = (node, width, height) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.width = width * pixelRatio();
    node.height = height * pixelRatio();
};

const Canvas = (store, lineWidth = 2, padding = 0) => {
    const node = document.createElement('canvas');
    node.classList.add(css.canvas);

    const ctx = node.getContext('2d');

    const linesOpacity = store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});
    const opacityTimeouts = {};

    let currentWidth = 0;
    let currentHeight = 0;
    let currentViewBox = null;
    let renderMark = false;

    const reRender = (viewBox, width, height) => {
        if (currentWidth !== width || currentHeight !== height) {
            updateSize(node, width, height);

            currentWidth = width;
            currentHeight = height;
        }

        currentViewBox = viewBox;

        render(store, ctx, viewBox, width, height, padding, lineWidth, linesOpacity);

        renderMark = true;
    };

    const renderCurrent = () => currentViewBox && reRender(currentViewBox, currentWidth, currentHeight);

    const changeLineOpacity = (lineId, step, fromTimeout) => requestAnimationFrame(() => {
        if (!fromTimeout && opacityTimeouts[lineId]) {
            clearTimeout(opacityTimeouts[lineId]);
        }

        const opacity = linesOpacity[lineId];

        if (!renderMark) {
            renderCurrent();
        }

        renderMark = false;

        if (fromTimeout && (opacity === 0 || opacity === 1)) {
            opacityTimeouts[lineId] = null;

            return;
        }

        const actualStep = (opacity + 0.2) * step;

        linesOpacity[lineId] += actualStep;

        if (linesOpacity[lineId] <= 0) {
            linesOpacity[lineId] = 0;
        } else if (linesOpacity[lineId] >= 1) {
            linesOpacity[lineId] = 1;
        }

        opacityTimeouts[lineId] = setTimeout(() => changeLineOpacity(lineId, step, true), animationTimeout);
    });

    store.on(LINE_OFF, lineId => changeLineOpacity(lineId, -0.15));
    store.on(LINE_ON, lineId => changeLineOpacity(lineId, 0.15));

    return {
        node,
        render: reRender,
    };
};

export default Canvas;
