import initGl from './initGl';
import {VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../../constants';
import {getPixelRatio} from '../helpers';

const VERTEX_PER_POINT = 4;
const VALUES_PER_VERTEX = 2;
const PIE_POINT_COUNT = 3000;

const addPiePositions = (store, positions) => {
    const pixelRatio = getPixelRatio();

    const [[width, height]] = store.size;
    const radius = Math.min(width, height) * pixelRatio / 1.5;
    const pi = Math.PI;


    positions.push(0, 0);

    for (let i = 0; i < PIE_POINT_COUNT; i++) {
        const rad = pi * i * 2 / PIE_POINT_COUNT;

        const x = radius * Math.sin(rad);
        const y = radius * Math.cos(rad);

        positions.push(x, y, 0, 0);
    }

    positions.push(0, radius, 0, 0);
};

const getDefaultPositions = (store, points, allLineIds, barsHeight) => {
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

    addPiePositions(store, positions);

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
        positions = getDefaultPositions(store, points, allLineIds, barsHeight);
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

const updateSize = (canvas, gl, width, height, pixelRatio, {barOptions, pieOptions}) => {
    const renderWidth = width * pixelRatio;
    const renderHeight = height * pixelRatio;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    gl.viewport(0, 0, renderWidth, renderHeight);

    // установка разрешения
    gl.useProgram(barOptions.shaderProgram);
    gl.uniform2f(barOptions.resolutionUniformLocation, renderWidth, renderHeight);
    gl.useProgram(pieOptions.shaderProgram);
    gl.uniform2f(pieOptions.resolutionUniformLocation, renderWidth, renderHeight);
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

const renderBar = (
    store, gl, glOptions, viewBox,
    width, height, padding,
    pixelRatio, bottomPadding,
) => {
    const {
        scaleFactorUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        shaderProgram,
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

    gl.useProgram(shaderProgram);

    gl.uniform2f(scaleFactorUniformLocation, factorX, factorY);
    gl.uniform1f(scaleStartUniformLocation, scaleStartPoint - (pixelRatio * padding / factorX));
    gl.uniform1f(bottomPaddingUniformLocation, pixelBottomPadding);

    renderLines(store, gl, glOptions);
};


const updatePieNumbers = (store, pieNumbers, width, height, totalValue, linesValues) => {
    if (!pieNumbers) {
        return;
    }
    const {allLineIds, lineIds} = store;
    const {node, items} = pieNumbers;

    node.style.transform = `translate(${width / 2}px, ${height / 2}px)`;
    const radius = Math.min(width, height) / 3.3;
    const pi = Math.PI;

    let parts = 0;

    allLineIds.forEach((lineId) => {
        const lineValue = linesValues[lineId];
        const item = items[lineId];

        if (lineIds.includes(lineId)) {
            item.node.style.opacity = 1;
        } else {
            item.node.style.opacity = 0;
        }

        // console.log(parts);
        const part = lineValue / totalValue;
        const halfPart = part / 2;
        const itemPart = parts + halfPart;
        const deg = pi * 2 * itemPart;
        const left = radius * Math.sin(deg);
        const top = -radius * Math.cos(deg);
        const scale = (part + 1) * 1.6;

        item.node.style.transform = `translate(${left}px, ${top}px)`;
        item.textNode.style.transform = `scale(${scale}, ${scale})`;

        const percent = Math.round(part * 100);

        item.text.textContent = `${percent}%`;

        parts += part;
    });
};

const renderPie = (
    store, gl, glOptions, viewBox,
    width, height, padding,
    pixelRatio, bottomPadding, barsHeight, pieNumbers,
) => {
    const {scaleStartPoint, scaleEndPoint} = viewBox;
    const {minY, maxY} = viewBox;


    const pixelWidth = (width - (padding * 2)) * pixelRatio;
    const pixelHeight = height * pixelRatio;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    // const factorX = pixelWidth / indexWidth;
    const factorY = pixelHeight / originalHeight;

    const pixelMinY = minY * factorY;

    const pixelBottomPadding = (bottomPadding * pixelRatio) - pixelMinY;

    const {points, allLineIds} = store;
    const startIndex = Math.max(0, Math.round(scaleStartPoint));
    const endIndex = Math.min(points.length - 1, Math.round(scaleEndPoint));

    let totalValue = 0;
    const linesValues = allLineIds.reduce((acc, lineId) => Object.assign(acc, {[lineId]: 0}), {});

    const allBarsHidden = allLineIds.every(lineId => barsHeight[lineId] <= 0);

    if (allBarsHidden) {
        return;
    }

    allLineIds.forEach((lineId) => {
        const lineFactor = barsHeight[lineId];
        for (let i = startIndex; i <= endIndex; i++) {
            const point = points[i];
            const val = point.lines[lineId] * lineFactor;

            totalValue += val;
            linesValues[lineId] += val;
        }
    });

    updatePieNumbers(store, pieNumbers, width, height, totalValue, linesValues);

    const {
        bottomPaddingUniformLocation,
        shaderProgram,
    } = glOptions;

    const pointsCount = store.points.length;
    const {colorUniformLocation} = glOptions;

    gl.useProgram(shaderProgram);

    gl.uniform1f(bottomPaddingUniformLocation, pixelBottomPadding);

    const totalPointsCount = PIE_POINT_COUNT * 2 + 2;
    // const count = PIE_POINT_COUNT * 2 + 2;
    const offset = pointsCount * VERTEX_PER_POINT * store.allLineIds.length;
    const primitiveType = gl.TRIANGLE_STRIP;

    let partOffset = offset;

    for (let i = 0; i < allLineIds.length; i++) {
        const lineId = allLineIds[i];

        let count = Math.round(totalPointsCount * linesValues[lineId] / totalValue);

        if (count === 0) {
            continue;
        }

        count += 2;

        if (partOffset + count > totalPointsCount + offset) {
            count = totalPointsCount + offset - partOffset;
        }

        const [red, green, blue] = store.rgbaColorsWebgl[lineId];

        gl.uniform4f(colorUniformLocation, red, green, blue, 1);

        gl.drawArrays(primitiveType, partOffset, count);

        partOffset += count - 2;
    }

    if (partOffset < totalPointsCount + offset) {
        for (let i = allLineIds.length - 1; i >= 0; i--) {
            const lineId = allLineIds[i];

            if (linesValues[lineId] > 0) {
                const [red, green, blue] = store.rgbaColorsWebgl[lineId];
                gl.uniform4f(colorUniformLocation, red, green, blue, 1);
                const count = totalPointsCount + offset - partOffset;

                gl.drawArrays(primitiveType, partOffset, count);

                break;
            }
        }
    }

    // gl.drawArrays(primitiveType, offset, count);
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

    const {barOptions, pieOptions} = initGl(gl);

    let currentWidth = 0;
    let currentHeight = 0;
    let currentPixelRatio = 1;

    const positions = fillLinesData(store, gl, null, barsHeight);

    const updateChartData = () => {
        fillLinesData(store, gl, positions, barsHeight);
    };

    let reRender = (width, height, padding, linesOpacity, pixelRatio, someparam, pieNumbers) => {
        const bottomPadding = VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;
        const scalerBottomPadding = 0;
        const scalerHeight = CHART_SCALER_HEIGHT - scalerBottomPadding;

        // pixel ratio can change if drag browser window from one screen to another
        if (currentWidth !== width || currentHeight !== height || currentPixelRatio !== pixelRatio) {
            updateSize(canvas, gl, width, height + bottomPadding, pixelRatio, {barOptions, pieOptions});

            currentWidth = width;
            currentHeight = height;
            currentPixelRatio = pixelRatio;
        }

        const pixelWidth = width * pixelRatio;
        const pixelHeight = height * pixelRatio;

        gl.scissor(0, 0, pixelWidth, CHART_SCALER_HEIGHT * pixelRatio);
        renderBar(
            store, gl, barOptions, store.fullViewBox.animationBox,
            width, scalerHeight, padding,
            pixelRatio, scalerBottomPadding,
        );

        gl.scissor(0, bottomPadding * pixelRatio, pixelWidth, pixelHeight);
        renderPie(
            store, gl, pieOptions, store.viewBox.animationBox,
            width, height, padding,
            pixelRatio, bottomPadding, barsHeight, pieNumbers,
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
