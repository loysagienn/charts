// атрибут, который будет получать данные из буфера
attribute vec2 a_position;

uniform vec4 u_color;

uniform float u_opacity;

uniform vec2 u_resolution;

uniform float u_scaleStart;

uniform float u_bottomPadding;

uniform vec2 u_scaleFactor;

uniform float u_lineHalfWidth;

uniform float u_height;

varying vec4 v_color;

void main() {
    vec2 position = vec2(a_position);

    position.x = position.x - u_scaleStart;

    vec2 pixelPosition = position * u_scaleFactor;

    pixelPosition.y = pixelPosition.y + u_bottomPadding;

    vec2 zeroToOne = pixelPosition / u_resolution;

    vec2 zeroToTwo = zeroToOne * 2.0;

    vec2 clipSpace = zeroToTwo - 1.0;
=
    gl_Position = vec4(clipSpace, 0, 1);

    if (pixelPosition.y > u_height) {
        v_color = vec4(0, 0, 0, 0);
    } else {
        v_color = u_color;
    }
}
