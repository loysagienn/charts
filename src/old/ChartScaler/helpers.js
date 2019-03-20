
import css from './ChartScaler.styl';

let maxScaleWidth = 0.2;

export const setMaxScaleWidth = width => maxScaleWidth = width;

export const createShadow = (node, className) => {
    const shadow = document.createElement('div');

    shadow.classList.add(css.shadow);
    shadow.classList.add(className);

    node.appendChild(shadow);

    return shadow;
};

export const getClientX = (event) => {
    const {type} = event;

    if (type.startsWith('touch')) {
        return event.touches[0].clientX;
    }

    return event.clientX;
};

const roundScale = scale => Math.round(scale * 1000) / 1000;

const getScale = (pxelScale, width, oppositeScale) => {
    let scale = roundScale(pxelScale / width);

    if (scale < 0) {
        scale = 0;
    }

    const maxScale = roundScale((1 - oppositeScale) - maxScaleWidth);

    if (scale > maxScale) {
        scale = maxScale;
    }

    return scale;
};

export const getScaleStart = (event, node, scaleEnd) => {
    const {left: scalerLeft, width} = node.getBoundingClientRect();
    const mouseLeft = getClientX(event);

    const pixelStart = mouseLeft - scalerLeft - 5;

    return getScale(pixelStart, width, scaleEnd);
};

export const getScaleEnd = (event, node, scaleStart) => {
    const {right: scaleRight, width} = node.getBoundingClientRect();
    const mouseLeft = getClientX(event);

    const pixelEnd = scaleRight - mouseLeft - 5;

    return getScale(pixelEnd, width, scaleStart);
};

export const getScaleMove = (event, node, pixelShift, scaleWidth) => {
    const {left: scaleLeft, width} = node.getBoundingClientRect();

    const pixelLeft = getClientX(event) - scaleLeft;

    const pixelStart = pixelLeft - pixelShift;

    const scaleStart = roundScale(pixelStart / width);

    if (scaleStart < 0) {
        return [0, 1 - scaleWidth];
    }

    const scaleEnd = roundScale(1 - scaleStart - scaleWidth);

    if (scaleEnd < 0) {
        return [1 - scaleWidth, 0];
    }

    return [scaleStart, scaleEnd];
};

export const startMove = (onMove) => {
    const cancelEvents = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('mouseup', cancelEvents);
        window.removeEventListener('touchend', cancelEvents);
        window.removeEventListener('mouseleave', cancelEvents);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('mouseup', cancelEvents);
    window.addEventListener('touchend', cancelEvents);
    window.addEventListener('mouseleave', cancelEvents);

    return cancelEvents;
};
