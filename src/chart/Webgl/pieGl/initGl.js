
import barVertexShaderSource from './vertexShader.glsl';
import fragmentShaderSource from './fragmentShader.glsl';
import pieVertexShaderSource from './pieVertexShader.glsl';


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

const initShaderProgram = (gl, vertexShaderSource) => {
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

const prepareBarGl = (gl, shaderProgram, positionAttributeLocation) => {
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
    const size = 2; // 4 компоненты на итерацию
    const type = gl.FLOAT; // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    const stride = 0; // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const offset = 0; // начинать с начала буфера
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.SCISSOR_TEST);
};

const preparePieGl = (gl, shaderProgram, positionAttributeLocation) => {
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
    const size = 2; // 4 компоненты на итерацию
    const type = gl.FLOAT; // наши данные - 32-битные числа с плавающей точкой
    const normalize = false; // не нормализовать данные
    const stride = 0; // 0 = перемещаться на size * sizeof(type) каждую итерацию для получения следующего положения
    const offset = 0; // начинать с начала буфера
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.SCISSOR_TEST);
};

const initBarProgram = (gl) => {
    const shaderProgram = initShaderProgram(gl, barVertexShaderSource);

    // gl.useProgram(barProgram);

    gl.bindAttribLocation(shaderProgram, 2, 'a_position');

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const scaleStartUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleStart');
    const bottomPaddingUniformLocation = gl.getUniformLocation(shaderProgram, 'u_bottomPadding');
    const scaleFactorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleFactor');
    const colorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_color');

    prepareBarGl(gl, shaderProgram, positionAttributeLocation);
    // preparePieGl(gl, shaderProgram, positionAttributeLocation);

    return {
        shaderProgram,
        positionAttributeLocation,
        colorUniformLocation,
        resolutionUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        scaleFactorUniformLocation,
    };
};

const initPieProgram = (gl) => {
    const shaderProgram = initShaderProgram(gl, pieVertexShaderSource);

    // gl.useProgram(barProgram);

    gl.bindAttribLocation(shaderProgram, 2, 'a_position');

    const positionAttributeLocation = gl.getAttribLocation(shaderProgram, 'a_position');
    const resolutionUniformLocation = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const scaleStartUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleStart');
    const bottomPaddingUniformLocation = gl.getUniformLocation(shaderProgram, 'u_bottomPadding');
    const scaleFactorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_scaleFactor');
    const colorUniformLocation = gl.getUniformLocation(shaderProgram, 'u_color');

    // prepareBarGl(gl, shaderProgram, positionAttributeLocation);
    preparePieGl(gl, shaderProgram, positionAttributeLocation);

    return {
        shaderProgram,
        positionAttributeLocation,
        colorUniformLocation,
        resolutionUniformLocation,
        scaleStartUniformLocation,
        bottomPaddingUniformLocation,
        scaleFactorUniformLocation,
    };
};

const initialize = (gl) => {
    // const barProgram = initShaderProgram(gl, barVertexShaderSource);
    // const pieProgram = initShaderProgram(gl, pieVertexShaderSource);

    const barOptions = initBarProgram(gl);
    const pieOptions = initPieProgram(gl);

    return {barOptions, pieOptions};

    // gl.useProgram(barProgram);

    // gl.bindAttribLocation(barProgram, 2, 'a_position');

    // const positionAttributeLocation = gl.getAttribLocation(barProgram, 'a_position');
    // const resolutionUniformLocation = gl.getUniformLocation(barProgram, 'u_resolution');
    // const scaleStartUniformLocation = gl.getUniformLocation(barProgram, 'u_scaleStart');
    // const bottomPaddingUniformLocation = gl.getUniformLocation(barProgram, 'u_bottomPadding');
    // const scaleFactorUniformLocation = gl.getUniformLocation(barProgram, 'u_scaleFactor');
    // const colorUniformLocation = gl.getUniformLocation(barProgram, 'u_color');

    // prepareBarGl(gl, barProgram, positionAttributeLocation);
    // preparePieGl(gl, pieProgram, positionAttributeLocation);

    // return {
    //     barProgram,
    //     pieProgram,
    //     positionAttributeLocation,
    //     colorUniformLocation,
    //     resolutionUniformLocation,
    //     scaleStartUniformLocation,
    //     bottomPaddingUniformLocation,
    //     scaleFactorUniformLocation,
    // };
};


export default initialize;
