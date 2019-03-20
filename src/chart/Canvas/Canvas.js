import css from './Canvas.styl';
// import getPolylinePoints from './getPolylinePoints';
// import {createElement, appendChild} from '../helpers';
// import {LINE_ON, LINE_OFF} from '../constants';

const pixelRatio = () => window.devicePixelRatio || 1;

const renderLine = (ctx, points, lineId, viewBox, width, height, padding, lineColors) => {
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

    ctx.strokeStyle = lineColors[lineId];
    ctx.stroke();
};

const render = ({points, allLineIds, lineColors}, node, ctx, viewBox, width, height, padding, lineWidth) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
    node.width = width * pixelRatio();
    node.height = height * pixelRatio();

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = lineWidth * pixelRatio();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < allLineIds.length; i++) {
        const lineId = allLineIds[i];

        renderLine(ctx, points, lineId, viewBox, width, height, padding, lineColors);
    }
};

const Canvas = (store, lineWidth = 2, padding = 0) => {
    const node = document.createElement('canvas');
    node.classList.add(css.canvas);

    const ctx = node.getContext('2d');

    // store.on(LINE_OFF, lineId => lineOff(polylines, lineId));
    // store.on(LINE_ON, lineId => lineOn(polylines, lineId));

    return {
        node,
        render: (viewBox, width, height) => render(
            store,
            node,
            ctx,
            viewBox,
            width,
            height,
            padding,
            lineWidth,
        ),
    };
};

export default Canvas;
