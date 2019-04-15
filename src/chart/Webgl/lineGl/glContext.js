import initGl from './initGl';
import {VIEW_SCALER_SPACE, CHART_SCALER_HEIGHT} from '../../constants';

const fillLinesData = (store, gl) => {
    const {points, allLineIds} = store;

    const pointsCount = points.length - 1;

    const positions = [];

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

            positions.push(
                lastX, lastY, shiftX, shiftY,
                lastX, lastY, -shiftX, -shiftY,
                positionX, positionY, shiftX, shiftY,
                positionX, positionY, -shiftX, -shiftY,
            );

            lastX = positionX;
            lastY = positionY;
        }
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

const renderLines = (store, lineIds, gl, glOptions, linesOpacity, skipLines) => {
    const {points} = store;

    const pointsCount = points.length - 1;

    for (let j = 0; j < lineIds.length; j++) {
        const lineId = lineIds[j];

        const [red, green, blue] = store.rgbaColorsWebgl[lineId];

        const {colorUniformLocation} = glOptions;

        const opacity = linesOpacity[lineId];

        gl.uniform4f(colorUniformLocation, red * opacity, green * opacity, blue * opacity, opacity);

        const primitiveType = gl.TRIANGLE_STRIP;
        const count = pointsCount * 4;
        const offset = count * (j + skipLines);
        gl.drawArrays(primitiveType, offset, count);
    }
};

const render = (
    store, lineIds, gl, glOptions, viewBox,
    width, height, padding, lineWidth,
    linesOpacity, pixelRatio, bottomPadding, skipLines,
) => {
    const {
        scaleFactorUniformLocation,
        lineHalfWidthUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
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

    renderLines(store, lineIds, gl, glOptions, linesOpacity, skipLines);
};

const glContext = (store, linesOpacity, canvas) => {
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

    fillLinesData(store, gl);

    let reRender = (width, height, padding, linesOpacity, pixelRatio) => {
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

        const mainLineIds = store.yScaled ? [store.allLineIds[0]] : store.allLineIds;
        const skipLines = 0;
        const pixelWidth = width * pixelRatio;
        const pixelHeight = height * pixelRatio;

        gl.scissor(0, bottomPadding * pixelRatio - 5, pixelWidth, pixelHeight);
        render(
            store, mainLineIds, gl, glOptions, store.viewBox.animationBox,
            width, height, padding, mainLineWidth,
            linesOpacity, pixelRatio, bottomPadding, skipLines,
        );

        gl.scissor(0, 0, pixelWidth, CHART_SCALER_HEIGHT * pixelRatio);
        render(
            store, mainLineIds, gl, glOptions, store.fullViewBox.animationBox,
            width, scalerHeight, padding, scalerLineWidth,
            linesOpacity, pixelRatio, scalerBottomPadding, skipLines,
        );

        if (store.yScaled) {
            const secondaryLineIds = [store.allLineIds[1] || store.allLineIds[0]];
            const secondarySkipLines = 1;

            gl.scissor(0, bottomPadding * pixelRatio - 5, pixelWidth, pixelHeight);
            render(
                store, secondaryLineIds, gl, glOptions, store.secondaryViewBox.animationBox,
                width, height, padding, mainLineWidth,
                linesOpacity, pixelRatio, bottomPadding, secondarySkipLines,
            );

            gl.scissor(0, 0, pixelWidth, CHART_SCALER_HEIGHT * pixelRatio);
            render(
                store, secondaryLineIds, gl, glOptions, store.secondaryFullViewBox.animationBox,
                width, scalerHeight, padding, scalerLineWidth,
                linesOpacity, pixelRatio, scalerBottomPadding, secondarySkipLines,
            );
        }

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
        render: reRender,
    };
};

export default glContext;
