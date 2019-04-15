import initGl from './initGl';
import {VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../../constants';

const VERTEX_PER_POINT = 2;
const VALUES_PER_VERTEX = 2;

const fillLinesData = (store, gl, positions = null, barsHeight = {}) => {
    const {points, lineIds, allLineIds} = store;

    const pointsCount = points.length - 1;

    const heights = [];

    const linesLength = allLineIds.length;

    // console.log(Object.entries(barsHeight).map(([key, val]) => `${key}: ${val}`).join(', '));

    for (let i = 0; i <= pointsCount; i++) {
        const vals = [];
        let total = 0;

        for (let j = 0; j < linesLength; j++) {
            const lineId = allLineIds[j];
            // console.log(barsHeight[lineId]);
            vals[j] = (total += points[i].lines[lineId] * (barsHeight[lineId]));

            // total += (vals[j] = points[i].lines[lineId] * (barsHeight[lineId] || 1));
        }

        vals[linesLength] = total;

        heights[i] = vals;
    }

    if (!positions) {
        positions = [];

        for (let j = 0; j < linesLength; j++) {
        // const lineId = allLineIds[j];

            for (let i = 0; i <= pointsCount; i++) {
                positions.push(
                    i, (j ? heights[i][j - 1] : 0) / heights[i][linesLength],
                    i, heights[i][j] / heights[i][linesLength],
                );
            }
        }
    } else {
        for (let j = 0; j < linesLength; j++) {
        // const lineId = allLineIds[j];

            const offset = j * VERTEX_PER_POINT * VALUES_PER_VERTEX * (pointsCount + 1);

            for (let i = 0; i <= pointsCount; i++) {
                const start = offset + (VERTEX_PER_POINT * VALUES_PER_VERTEX * i) - 1;

                positions[start + (VALUES_PER_VERTEX * 1)] = (j ? heights[i][j - 1] : 0) / heights[i][linesLength];
                positions[start + (VALUES_PER_VERTEX * 2)] = heights[i][j] / heights[i][linesLength];
            }
        }
    }


    // const buildArray = performance.now();

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

const renderLines = (store, lineIds, gl, glOptions, linesOpacity, skipLines) => {
    const {points} = store;

    const pointsCount = points.length;

    for (let j = 0; j < lineIds.length; j++) {
        const lineId = lineIds[j];

        // if (!store.lineIds.includes(lineId)) {
        //     continue;
        // }

        const [red, green, blue] = store.rgbaColorsWebgl[lineId];

        const {colorUniformLocation, opacityUniformLocation} = glOptions;

        const opacity = linesOpacity[lineId];

        // gl.uniform4f(colorUniformLocation, red * opacity, green * opacity, blue * opacity, opacity);
        gl.uniform4f(colorUniformLocation, red, green, blue, 1);
        gl.uniform1f(opacityUniformLocation, opacity);

        const primitiveType = gl.TRIANGLE_STRIP;
        const count = pointsCount * VERTEX_PER_POINT;
        const offset = count * (j + skipLines);
        gl.drawArrays(primitiveType, offset, count);
    }
};

const render = (
    store, lineIds, gl, glOptions, viewBox,
    width, height, padding, lineWidth,
    linesOpacity, pixelRatio, bottomPadding, skipLines, ignoreOpacity,
) => {
    const {
        scaleFactorUniformLocation,
        lineHalfWidthUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        heightUniformLocation,
    } = glOptions;
    const {scaleStartPoint, scaleEndPoint} = viewBox;
    const {minY, maxY} = viewBox;

    // scaleStartPoint -= 0.5;
    // scaleEndPoint += 0.5;

    const pixelWidth = (width - (padding * 2)) * pixelRatio;
    const pixelHeight = height * pixelRatio;

    // чтобы нижняя точка графика не обрезалась
    // height -= 1;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // потому что проценты
    const originalHeight = maxY / 100;

    const factorX = pixelWidth / indexWidth;
    const factorY = pixelHeight / originalHeight;

    const pixelMinY = minY * factorY;

    const pixelBottomPadding = (bottomPadding * pixelRatio) - pixelMinY;

    const heightUniform = ignoreOpacity
        ? pixelHeight * 1000
        : pixelHeight + pixelBottomPadding + pixelHeight / 2 + pixelMinY;

    gl.uniform2f(scaleFactorUniformLocation, factorX, factorY);
    gl.uniform1f(lineHalfWidthUniformLocation, lineWidth * pixelRatio / 2);
    gl.uniform1f(scaleStartUniformLocation, scaleStartPoint - (pixelRatio * padding / factorX));
    gl.uniform1f(bottomPaddingUniformLocation, pixelBottomPadding);
    gl.uniform1f(heightUniformLocation, heightUniform);

    renderLines(store, lineIds, gl, glOptions, linesOpacity, skipLines);
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
    // let currentViewBox = null;
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

        // gl.clear(gl.COLOR_BUFFER_BIT);

        const mainLineWidth = 2;
        const scalerLineWidth = 1;

        const skipLines = 0;

        render(
            store, store.allLineIds, gl, glOptions, store.fullViewBox.animationBox,
            width, scalerHeight, padding, scalerLineWidth,
            linesOpacity, pixelRatio, scalerBottomPadding, skipLines, true,
        );

        render(
            store, store.allLineIds, gl, glOptions, store.viewBox.animationBox,
            width, height, padding, mainLineWidth,
            linesOpacity, pixelRatio, bottomPadding, skipLines, true,
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
