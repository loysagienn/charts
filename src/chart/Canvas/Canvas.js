import css from './Canvas.styl';
// import getPolylinePoints from './getPolylinePoints';
import {createElement, appendChild} from '../helpers';
import {LINE_ON, LINE_OFF} from '../constants';
import nextFrame, {markHasBeenPlanned} from '../nextFrame';

const getPixelRatio = () => window.devicePixelRatio || 1;

let imagesCount = 0;

const renderLine = (ctx, points, lineId, viewBox, width, height, padding, color, pixelRatio) => {
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

    const paddingIndex = padding / factorX;
    const lineStartIndex = Math.max(Math.floor(scaleStartPoint - paddingIndex), minIndex);
    const lineEndIndex = Math.min(Math.ceil(scaleEndPoint + paddingIndex), maxIndex);

    ctx.beginPath();

    const firstX = ((lineStartIndex - scaleStartPoint) * factorX + padding) * pixelRatio;
    const firstY = (height - ((points[lineStartIndex].lines[lineId] - minY) * factorY)) * pixelRatio;

    ctx.moveTo(Math.round(firstX), Math.round(firstY));

    for (let i = lineStartIndex + 1; i <= lineEndIndex; i++) {
        const y = points[i].lines[lineId];

        const positionX = ((i - scaleStartPoint) * factorX + padding) * pixelRatio;
        const positionY = (height - ((y - minY) * factorY)) * pixelRatio;

        ctx.lineTo(Math.round(positionX), Math.round(positionY));
    }

    ctx.strokeStyle = color;
    ctx.stroke();
};

const render = (store, ctx, viewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio) => {
    const {points, allLineIds, getColor} = store;

    ctx.clearRect(0, 0, width * pixelRatio, height * pixelRatio);
    ctx.lineWidth = lineWidth * pixelRatio;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < allLineIds.length; i++) {
        const lineId = allLineIds[i];

        const opacity = linesOpacity[lineId];
        const color = getColor(lineId, opacity);

        // not render invisible lines
        if (opacity === 0) {
            continue;
        }

        renderLine(ctx, points, lineId, viewBox, width, height, padding, color, pixelRatio);
    }
};

const updateSize = (node, width, height, pixelRatio) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.width = width * pixelRatio;
    node.height = height * pixelRatio;
};

const Canvas = (store, lineWidth = 2, padding = 0) => {
    const node = createElement(css.root);
    const canvas = document.createElement('canvas');
    canvas.classList.add(css.canvas);
    appendChild(node, canvas);

    const ctx = canvas.getContext('2d');

    const linesOpacity = store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});
    const lineOpacityFrameMark = `canvasLineOpacity${imagesCount++}`;
    const reRenderFrameMark = `${store.nextFramePrefix}canvasRerender${imagesCount++}`;

    let currentWidth = 0;
    let currentHeight = 0;
    let currentViewBox = null;
    let currentPixelRatio = 1;

    const reRender = (staticViewBox, viewBox, width, height) => nextFrame(() => {
        const pixelRatio = getPixelRatio();

        // node.removeChild(canvas);

        // pixel ratio can change if drag browser window from one screen to another
        if (currentWidth !== width || currentHeight !== height || currentPixelRatio !== pixelRatio) {
            updateSize(canvas, width, height, pixelRatio);

            currentWidth = width;
            currentHeight = height;
            currentPixelRatio = pixelRatio;
        }

        currentViewBox = viewBox;

        render(store, ctx, viewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio);

        // node.appendChild(canvas);
    }, reRenderFrameMark);

    const renderCurrent = () => {
        if (!currentViewBox || markHasBeenPlanned(reRenderFrameMark)) {
            return;
        }

        reRender(currentViewBox, currentViewBox, currentWidth, currentHeight);
    };

    const changeLineOpacity = (lineId, step, fromTimeout, timeFactor = 1) => {
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

        const mark = `${store.nextFramePrefix}${lineOpacityFrameMark}${lineId}`;

        // eslint-disable-next-line no-shadow
        nextFrame(timeFactor => changeLineOpacity(lineId, step, true, timeFactor), mark);
    };

    const onLineOff = (lineId) => {
        if (store.animationsDisabled) {
            linesOpacity[lineId] = 0;
        } else {
            changeLineOpacity(lineId, -0.12);
        }
    };
    const onLineOn = (lineId) => {
        if (store.animationsDisabled) {
            linesOpacity[lineId] = 1;
        } else {
            changeLineOpacity(lineId, 0.12);
        }
    };

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

export default Canvas;
