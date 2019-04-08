
import vertexShaderSource from './vertexShader.glsl';
import fragmentShaderSource from './fragmentShader.glsl';


const loadShader = (gl, type, source) => {
    const shader = gl.createShader(type);

    // Send the source to the shader object
    gl.shaderSource(shader, source);

    // Compile the shader program
    gl.compileShader(shader);

    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);

        throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
};

const initShaderProgram = (gl) => {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        throw new Error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    return shaderProgram;
};

const prepareGl = (gl, shaderProgram, positionAttributeLocation, shiftAttributeLocation) => {
    // Create a buffer for the positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    // Привязываем буфер положений
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.clearColor(0, 0, 0, 0);

    gl.useProgram(shaderProgram);

    // включаем аттрибут
    gl.enableVertexAttribArray(positionAttributeLocation);
    // gl.enableVertexAttribArray(shiftAttributeLocation);


    // Указываем атрибуту, как получать данные от positionBuffer (ARRAY_BUFFER)
    const size = 4; // 4 компоненты на итерацию
    const type = gl.FLOAT; // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    const stride = 0; // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const offset = 0; // начинать с начала буфера
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    // gl.vertexAttribPointer(shiftAttributeLocation, size, type, normalize, stride, 2);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // gl.enable(gl.SAMPLE_COVERAGE);
    // gl.sampleCoverage(1.0, false);
};

const initialize = (gl) => {
    const shaderProgram = initShaderProgram(gl);
    gl.bindAttribLocation(shaderProgram, 2, 'a_position');

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const scaleStartUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleStart');
    const bottomPaddingUniformLocation = gl.getUniformLocation(shaderProgram, 'u_bottomPadding');
    const scaleFactorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleFactor');
    const lineHalfWidthUniformLocation = gl.getUniformLocation(shaderProgram, 'u_lineHalfWidth');
    const heightUniformLocation = gl.getUniformLocation(shaderProgram, 'u_height');
    const colorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_color');

    prepareGl(gl, shaderProgram, positionAttributeLocation);

    return {
        shaderProgram,
        positionAttributeLocation,
        colorUniformLocation,
        resolutionUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        scaleFactorUniformLocation,
        heightUniformLocation,
        lineHalfWidthUniformLocation,
    };
};


export default initialize;
