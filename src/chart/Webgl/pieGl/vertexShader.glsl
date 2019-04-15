
attribute vec2 a_position;

uniform vec4 u_color;

uniform vec2 u_resolution;

uniform float u_scaleStart;

uniform float u_bottomPadding;

uniform vec2 u_scaleFactor;

varying vec4 v_color;

void main() {
    vec2 position = vec2(a_position);

    position.x = position.x - u_scaleStart;

    vec2 pixelPosition = position * u_scaleFactor;

    pixelPosition.y = pixelPosition.y + u_bottomPadding;

    vec2 clipSpace = 2.0 * pixelPosition / u_resolution - 1.0;

    gl_Position = vec4(clipSpace, 0, 1);

    v_color = u_color;
}
