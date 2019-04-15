
import {createElement, appendChild, addEvent, removeEvent} from '../helpers';
import css from './ChartScaler.styl';

let maxScaleWidth = 0.2;


export const preventDefault = event => event && event.type.startsWith('mouse') && event.preventDefault();

export const setMaxScaleWidth = width => maxScaleWidth = width;

export const createShadow = (node, className) => {
    const shadow = createElement();

    shadow.classList.add(css.shadow);
    shadow.classList.add(className);

    appendChild(node, shadow);

    return shadow;
};

export const getClientX = (event) => {
    const {type} = event;

    if (type.startsWith('touch')) {
        return event.touches[0].clientX;
    }

    return event.clientX;
};

export const getClientY = (event) => {
    const {type} = event;

    if (type.startsWith('touch')) {
        return event.touches[0].clientY;
    }

    return event.clientY;
};

export const isScrollMove = ([startClientX, startClientY], event) => {
    const clientX = getClientX(event);
    const clientY = getClientY(event);

    return Math.abs(startClientX - clientX) < Math.abs(startClientY - clientY);
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

export const getScaleStart = (event, boundingClientRect, scaleEnd) => {
    const {left: scalerLeft, width} = boundingClientRect;
    const mouseLeft = getClientX(event);

    const pixelStart = mouseLeft - scalerLeft - 5;

    return getScale(pixelStart, width, scaleEnd);
};

export const getScaleEnd = (event, boundingClientRect, scaleStart) => {
    const {right: scaleRight, width} = boundingClientRect;
    const mouseLeft = getClientX(event);

    const pixelEnd = scaleRight - mouseLeft - 5;

    return getScale(pixelEnd, width, scaleStart);
};

export const getScaleMove = (event, boundingClientRect, pixelShift, scaleWidth) => {
    const {left: scaleLeft, width} = boundingClientRect;

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

export const startMove = (onMove, clear) => {
    const cancelEvents = () => {
        removeEvent(window, 'mousemove', onMove);
        removeEvent(window, 'touchmove', onMove);
        removeEvent(window, 'mouseup', cancelEvents);
        removeEvent(window, 'touchend', cancelEvents);
        removeEvent(window, 'mouseleave', cancelEvents);
        if (clear) {
            clear();
        }
    };

    addEvent(window, 'mousemove', onMove);
    addEvent(window, 'touchmove', onMove, {passive: false});
    addEvent(window, 'mouseup', cancelEvents);
    addEvent(window, 'touchend', cancelEvents);
    addEvent(window, 'mouseleave', cancelEvents);

    return cancelEvents;
};
