import css from './Webgl.styl';
// import getPolylinePoints from './getPolylinePoints';
import {createElement, appendChild} from '../helpers';
import Canvas from '../Canvas';
import {LINE_ON, LINE_OFF} from '../constants';
import nextFrame, {markHasBeenPlanned} from '../nextFrame';


let imagesCount = 0;

const getPixelRatio = () => window.devicePixelRatio || 1;

const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.log(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
        gl.deleteShader(shader);
        return null;
    }

    return shader;
};

const initShaderProgram = (gl, vsSource, fsSource) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
        return null;
    }

    return shaderProgram;
};

const initBuffers = (gl) => {
    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);


    return {
        positionBuffer,
    };
};

const initialize = (gl) => {
    // gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // gl.clear(gl.COLOR_BUFFER_BIT);

    // Vertex shader program

    const vsSource = `
    // атрибут, который будет получать данные из буфера
    attribute vec4 a_position;
 
    // все шейдеры имеют функцию main
    void main() {
        // gl_Position - специальная переменная вершинного шейдера,
        // которая отвечает за установку положения
        gl_Position = a_position;
    }`;

    // Fragment shader
    const fsSource = `
    precision mediump float;

    uniform vec4 u_color;

    void main() {
        gl_FragColor = u_color;
    }`;

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const colorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_color');

    const {positionBuffer} = initBuffers(gl);

    // const programInfo = {
    //     program: shaderProgram,
    //     attribLocations: {
    //         vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    //     },
    //     uniformLocations: {
    //         projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
    //         modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    //     },
    // };

    return {shaderProgram, positionAttributeLocation, colorUniformLocation, positionBuffer};
};

const updateSize = (canvas, gl, width, height, pixelRatio) => {
    const renderWidth = width * pixelRatio;
    const renderHeight = height * pixelRatio;

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = renderWidth;
    canvas.height = renderHeight;

    gl.viewport(0, 0, renderWidth, renderHeight);
};

const prepareGl = (gl, {shaderProgram, positionAttributeLocation, colorUniformLocation, positionBuffer}) => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(shaderProgram);

    gl.enableVertexAttribArray(positionAttributeLocation);

    // Привязываем буфер положений
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    gl.lineWidth(5);

    // Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
    const size = 2; // 2 компоненты на итерацию
    const type = gl.FLOAT; // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    const stride = 0; // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const offset = 0; // начинать с начала буфера
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
};

const renderLine = (
    store,
    gl,
    lineId,
    lineStartIndex,
    lineEndIndex,
    scaleStartPoint,
    factorX,
    factorY,
    glFactorX,
    glFactorY,
    colorUniformLocation,
) => {
    const {points} = store;

    let lastX = (lineStartIndex - scaleStartPoint) * factorX;
    let lastY = points[lineStartIndex].lines[lineId] * factorY;

    // lastX = 0;
    // lastY = 0;

    let positions = [];

    for (let i = lineStartIndex + 1; i <= lineEndIndex; i++) {
        const y = points[i].lines[lineId];

        const positionX = (i - scaleStartPoint) * factorX;
        const positionY = y * factorY;

        // const positionX = 500;
        // const positionY = 200;

        const shiftX = positionX - lastX;
        const shiftY = positionY - lastY;
        const lineHalfWidth = 2;

        let triangleShiftY = Math.sqrt(
            ((lineHalfWidth ** 2) * (shiftX ** 2))
            / ((shiftY ** 2) + (shiftX ** 2)),
        );

        if (shiftY < 0) {
            triangleShiftY = -triangleShiftY;
        }

        const triangleShiftX = Math.sqrt(
            ((lineHalfWidth ** 2) * (shiftY ** 2))
            / ((shiftY ** 2) + (shiftX ** 2)),
        );

        positions = positions.concat([
            lastX + triangleShiftX, lastY - triangleShiftY,
            positionX + triangleShiftX, positionY - triangleShiftY,
            lastX - triangleShiftX, lastY + triangleShiftY,
            lastX - triangleShiftX, lastY + triangleShiftY,
            positionX - triangleShiftX, positionY + triangleShiftY,
            positionX + triangleShiftX, positionY - triangleShiftY,
        ]);

        lastX = positionX;
        lastY = positionY;
    }
    positions = positions.map((item, index) => ((index % 2 === 0) ? item * glFactorX - 1 : item * glFactorY - 1));

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW,
    );
    const [red, green, blue] = store.rgbaColorsWebgl[lineId];

    gl.uniform4f(colorUniformLocation, red, green, blue, 1);

    const primitiveType = gl.TRIANGLES;
    const offset = 0;
    const count = (lineEndIndex - lineStartIndex) * 6;
    gl.drawArrays(primitiveType, offset, count);
};

const render = (store, gl, glOptions, viewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio) => {
    const {points} = store;
    const {colorUniformLocation} = glOptions;
    const {scaleStartPoint, scaleEndPoint, minY, maxY} = viewBox;

    gl.clear(gl.COLOR_BUFFER_BIT);

    const pixelWidth = width * pixelRatio;
    const pixelHeight = height * pixelRatio;

    // чтобы нижняя точка графика не обрезалась
    height -= 1;

    const minIndex = 0;
    const maxIndex = points.length - 1;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    // const factorX = (width - (padding * 2)) / indexWidth;
    const factorX = pixelWidth / indexWidth;
    const factorY = pixelHeight / originalHeight;

    const glFactorX = 2 / pixelWidth;
    const glFactorY = 2 / pixelHeight;

    const paddingIndex = padding / factorX;
    const lineStartIndex = Math.max(Math.floor(scaleStartPoint - paddingIndex), minIndex);
    const lineEndIndex = Math.min(Math.ceil(scaleEndPoint + paddingIndex), maxIndex);

    // const lineId = store.allLineIds[0];

    store.lineIds.forEach(lineId => renderLine(
        store,
        gl,
        lineId,
        lineStartIndex,
        lineEndIndex,
        scaleStartPoint,
        factorX,
        factorY,
        glFactorX,
        glFactorY,
        colorUniformLocation,
    ));
};

const Webgl = (store, lineWidth = 2, padding = 0) => {
    const node = document.createElement('canvas');
    node.classList.add(css.canvas);

    console.log(store);

    const gl = node.getContext('webgl');

    if (!gl) {
        console.log('fallback to canvas');

        return Canvas(store, lineWidth, padding);
    }

    const linesOpacity = store.allLineIds.reduce((acc, id) => Object.assign(acc, {[id]: 1}), {});
    const lineOpacityFrameMark = `webglLineOpacity${imagesCount++}`;
    const reRenderFrameMark = `${store.nextFramePrefix}webglRerender${imagesCount++}`;

    let currentWidth = 0;
    let currentHeight = 0;
    let currentViewBox = null;
    let currentPixelRatio = 1;

    const glOptions = initialize(gl);

    prepareGl(gl, glOptions);

    const reRender = (staticViewBox, viewBox, width, height) => nextFrame(() => {
        const pixelRatio = getPixelRatio();

        // node.removeChild(canvas);

        // pixel ratio can change if drag browser window from one screen to another
        if (currentWidth !== width || currentHeight !== height || currentPixelRatio !== pixelRatio) {
            updateSize(node, gl, width, height, pixelRatio);

            currentWidth = width;
            currentHeight = height;
            currentPixelRatio = pixelRatio;
        }

        currentViewBox = viewBox;

        render(store, gl, glOptions, viewBox, width, height, padding, lineWidth, linesOpacity, pixelRatio);

        // node.appendChild(canvas);
    }, reRenderFrameMark);

    return {
        node,
        render: reRender,
        destroy: () => console.log('destroy webgl'),
    };
};

export default Webgl;
