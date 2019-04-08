import initGl from './initGl';
import {VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../constants';

const fillLinesData = (store, gl) => {
    const {points, allLineIds} = store;

    const pointsCount = points.length - 1;

    let positions = [];

    for (let j = 0; j < allLineIds.length; j++) {
        const lineId = allLineIds[j];

        let lastX = 0;
        let lastY = points[0].lines[lineId];

        for (let i = 1; i <= pointsCount; i++) {
            const y = points[i].lines[lineId];

            const positionX = i;
            const positionY = y;

            const shiftX = positionX - lastX;
            const shiftY = positionY - lastY;

            positions = positions.concat([
                lastX, lastY, shiftX, shiftY,
                lastX, lastY, -shiftX, -shiftY,
                positionX, positionY, shiftX, shiftY,
                positionX, positionY, -shiftX, -shiftY,
            ]);

            lastX = positionX;
            lastY = positionY;
        }
    }

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW,
    );
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

const renderLines = (store, gl, glOptions, linesOpacity) => {
    const {points, allLineIds} = store;

    const pointsCount = points.length - 1;

    for (let j = 0; j < allLineIds.length; j++) {
        const lineId = allLineIds[j];

        const [red, green, blue] = store.rgbaColorsWebgl[lineId];

        const {colorUniformLocation} = glOptions;

        const opacity = linesOpacity[lineId];

        gl.uniform4f(colorUniformLocation, red * opacity, green * opacity, blue * opacity, opacity);

        const primitiveType = gl.TRIANGLE_STRIP;
        const count = pointsCount * 4;
        const offset = count * j;
        gl.drawArrays(primitiveType, offset, count);
    }
};

const render = (
    store, gl, glOptions, viewBox,
    width, height, padding, lineWidth,
    linesOpacity, pixelRatio, bottomPadding,
) => {
    const {
        scaleFactorUniformLocation,
        lineHalfWidthUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        heightUniformLocation,
    } = glOptions;
    const {scaleStartPoint, scaleEndPoint, minY, maxY} = viewBox;

    const pixelWidth = (width - (padding * 2)) * pixelRatio;
    const pixelHeight = height * pixelRatio;

    // чтобы нижняя точка графика не обрезалась
    // height -= 1;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = pixelWidth / indexWidth;
    const factorY = pixelHeight / originalHeight;

    const pixelMinY = minY * factorY;

    const pixelBottomPadding = (bottomPadding * pixelRatio) - pixelMinY;

    gl.uniform2f(scaleFactorUniformLocation, factorX, factorY);
    gl.uniform1f(lineHalfWidthUniformLocation, lineWidth * pixelRatio / 2);
    gl.uniform1f(scaleStartUniformLocation, scaleStartPoint - (pixelRatio * padding / factorX));
    gl.uniform1f(bottomPaddingUniformLocation, pixelBottomPadding);
    gl.uniform1f(heightUniformLocation, pixelHeight + pixelBottomPadding + pixelHeight / 2 + pixelMinY);

    renderLines(store, gl, glOptions, linesOpacity);
};

const glContext = (store) => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {
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

    fillLinesData(store, gl);

    const reRender = (viewBox, fullViewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio) => {
        const bottomPadding = VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;
        const scalerBottomPadding = 2;
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
        // currentViewBox = viewBox;

        render(
            store, gl, glOptions, viewBox,
            width, height, padding, mainLineWidth,
            linesOpacity, pixelRatio, bottomPadding,
        );

        render(
            store, gl, glOptions, fullViewBox,
            width, scalerHeight, padding, scalerLineWidth,
            linesOpacity, pixelRatio, scalerBottomPadding,
        );

        return canvas;
    };

    return {
        canvas,
        gl,
        render: reRender,
    };
};

export default glContext;
