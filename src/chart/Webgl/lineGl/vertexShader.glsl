
attribute vec4 a_position;

uniform vec4 u_color;

uniform vec2 u_resolution;

uniform float u_scaleStart;

uniform float u_bottomPadding;

uniform vec2 u_scaleFactor;

uniform float u_lineHalfWidth;

varying vec4 v_color;
 
void main() {
    vec2 position = vec2(a_position);
    vec2 shift = vec2(a_position[2], a_position[3]);

    position.x = position.x - u_scaleStart;

    vec2 pixelPosition = position * u_scaleFactor;
    vec2 pixelShift = shift * u_scaleFactor;

    pixelPosition.y = pixelPosition.y + u_bottomPadding;

    float shiftY = sqrt(
        (pow(u_lineHalfWidth, 2.0) * pow(pixelShift.x, 2.0)) /
        (pow(pixelShift.x, 2.0) + pow(pixelShift.y, 2.0))
    );

    if (pixelShift.y > 0.0) {
        shiftY = -shiftY;
    }

    float shiftX = sqrt(
        (pow(u_lineHalfWidth, 2.0) * pow(pixelShift.y, 2.0)) /
        (pow(pixelShift.x, 2.0) + pow(pixelShift.y, 2.0))
    );

    if (pixelShift.x < 0.0) {
        shiftX = -shiftX;
    }

    if (pixelShift.x < 0.0 && pixelShift.y == 0.0) {
        shiftY = -shiftY;
    }

    vec2 pointPosition = pixelPosition + vec2(shiftX, shiftY);

    vec2 zeroToOne = pointPosition / u_resolution;
    

    vec2 zeroToTwo = zeroToOne * 2.0;

    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace, 0, 1);

    v_color = u_color;
}
