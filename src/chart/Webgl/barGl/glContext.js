import initGl from './initGl';
import {VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../../constants';

const VERTEX_PER_POINT = 4;
const VALUES_PER_VERTEX = 2;

const getDefaultPositions = (points, allLineIds, barsHeight) => {
    const positions = [];
    const previousBarY = [];
    const pointsLength = points.length;

    for (let j = 0; j < allLineIds.length; j++) {
        const lineId = allLineIds[j];

        const barHeight = barsHeight[lineId];

        for (let i = 0; i < pointsLength; i++) {
            const previousY = previousBarY[i] || 0;
            const pointY = points[i].lines[lineId];
            const currentY = previousY + (pointY * barHeight);

            const positionX = i;

            positions.push(
                positionX - 0.5, currentY,
                positionX - 0.5, previousY,
                positionX + 0.5, currentY,
                positionX + 0.5, previousY,
            );

            previousBarY[i] = currentY;
        }
    }

    return positions;
};

const updatePositions = (positions, points, allLineIds, barsHeight) => {
    const previousBarY = [];
    const pointsLength = points.length;

    for (let j = 0; j < allLineIds.length; j++) {
        const lineId = allLineIds[j];

        const barHeight = barsHeight[lineId];

        const offset = j * VERTEX_PER_POINT * VALUES_PER_VERTEX * pointsLength;

        for (let i = 0; i < pointsLength; i++) {
            const previousY = previousBarY[i] || 0;

            const pointY = points[i].lines[lineId];
            const currentY = previousY + (pointY * barHeight);

            const start = offset + (VERTEX_PER_POINT * VALUES_PER_VERTEX * i) - 1;

            positions[start + (VALUES_PER_VERTEX * 1)] = currentY;
            positions[start + (VALUES_PER_VERTEX * 2)] = previousY;
            positions[start + (VALUES_PER_VERTEX * 3)] = currentY;
            positions[start + (VALUES_PER_VERTEX * 4)] = previousY;

            previousBarY[i] = currentY;
        }
    }

    return positions;
};

const fillLinesData = (store, gl, positions = null, barsHeight) => {
    const {points, allLineIds} = store;

    if (!positions) {
        positions = getDefaultPositions(points, allLineIds, barsHeight);
    } else {
        positions = updatePositions(positions, points, allLineIds, barsHeight);
    }

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW,
    );

    return positions;
};

const updateSize = (canvas, gl, width, height, pixelRatio, {resolutionUniformLocation}) => {
    const renderWidth = width * pixelRatio;
    const renderHeight = height * pixelRatio;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    gl.viewport(0, 0, renderWidth, renderHeight);

    // установка разрешения
    gl.uniform2f(resolutionUniformLocation, renderWidth, renderHeight);
};

const renderLines = (store, gl, glOptions) => {
    const {points, allLineIds} = store;

    const pointsCount = points.length;

    for (let j = 0; j < allLineIds.length; j++) {
        const lineId = allLineIds[j];


        const [red, green, blue] = store.rgbaColorsWebgl[lineId];

        const {colorUniformLocation} = glOptions;

        gl.uniform4f(colorUniformLocation, red, green, blue, 1);

        const primitiveType = gl.TRIANGLE_STRIP;
        const count = pointsCount * VERTEX_PER_POINT;
        const offset = count * j;
        gl.drawArrays(primitiveType, offset, count);
    }
};

const render = (
    store, gl, glOptions, viewBox,
    width, height, padding,
    pixelRatio, bottomPadding,
) => {
    const {
        scaleFactorUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
    } = glOptions;
    let {scaleStartPoint, scaleEndPoint} = viewBox;
    const {minY, maxY} = viewBox;

    scaleStartPoint -= 0.5;
    scaleEndPoint += 0.5;

    const pixelWidth = (width - (padding * 2)) * pixelRatio;
    const pixelHeight = height * pixelRatio;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = pixelWidth / indexWidth;
    const factorY = pixelHeight / originalHeight;

    const pixelMinY = minY * factorY;

    const pixelBottomPadding = (bottomPadding * pixelRatio) - pixelMinY;

    gl.uniform2f(scaleFactorUniformLocation, factorX, factorY);
    gl.uniform1f(scaleStartUniformLocation, scaleStartPoint - (pixelRatio * padding / factorX));
    gl.uniform1f(bottomPaddingUniformLocation, pixelBottomPadding);

    renderLines(store, gl, glOptions);
};

const glContext = (store, barsHeight, canvas) => {
    if (!canvas) {
        canvas = document.createElement('canvas');
    }
    let gl = canvas.getContext('webgl', {
        antialias: true,
        powerPreference: 'high-performance',
    });

    if (!gl) {
        throw new Error('not support webgl');
    }

    const glOptions = initGl(gl);

    let currentWidth = 0;
    let currentHeight = 0;
    let currentPixelRatio = 1;

    const positions = fillLinesData(store, gl, null, barsHeight);

    const updateChartData = () => {
        fillLinesData(store, gl, positions, barsHeight);
    };

    let reRender = (width, height, padding, linesOpacity, pixelRatio) => {
        const bottomPadding = VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;
        const scalerBottomPadding = 0;
        const scalerHeight = CHART_SCALER_HEIGHT - scalerBottomPadding;

        // pixel ratio can change if drag browser window from one screen to another
        if (currentWidth !== width || currentHeight !== height || currentPixelRatio !== pixelRatio) {
            updateSize(canvas, gl, width, height + bottomPadding, pixelRatio, glOptions);

            currentWidth = width;
            currentHeight = height;
            currentPixelRatio = pixelRatio;
        }

        const pixelWidth = width * pixelRatio;
        const pixelHeight = height * pixelRatio;

        gl.scissor(0, 0, pixelWidth, CHART_SCALER_HEIGHT * pixelRatio);
        render(
            store, gl, glOptions, store.fullViewBox.animationBox,
            width, scalerHeight, padding,
            pixelRatio, scalerBottomPadding,
        );

        gl.scissor(0, bottomPadding * pixelRatio, pixelWidth, pixelHeight);
        render(
            store, gl, glOptions, store.viewBox.animationBox,
            width, height, padding,
            pixelRatio, bottomPadding,
        );

        return canvas;
    };

    let destroy = () => {
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        canvas.width = 1;
        canvas.height = 1;
        store = null;
        reRender = null;
        canvas = null;
        gl = null;
        destroy = null;
    };

    return {
        canvas,
        gl,
        destroy,
        updateChartData,
        render: reRender,
    };
};

export default glContext;
