
import {addEvent, removeEvent} from '../helpers';
import {PADDING} from '../constants';
import css from './DetailsPopup.styl';

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

export const isVerticalMove = ([startClientX, startClientY], [clientX, clientY]) => (
    Math.abs(startClientX - clientX) < Math.abs(startClientY - clientY)
);

export const startMove = (node, onMove, clear, event) => {
    const cancelEvents = (cancelEvent) => {
        removeEvent(node, 'mousemove', onMove);
        removeEvent(window, 'touchmove', onMove);
        removeEvent(node, 'mouseleave', cancelEvents);
        removeEvent(window, 'touchend', cancelEvents);
        removeEvent(window, 'scroll', cancelEvents, true);
        clear(cancelEvent);
    };

    addEvent(node, 'mousemove', onMove);
    addEvent(window, 'touchmove', onMove);
    addEvent(node, 'mouseleave', cancelEvents);
    addEvent(window, 'touchend', cancelEvents);
    addEvent(window, 'scroll', cancelEvents, true);

    return cancelEvents;
};

export const getIndex = (node, store, event) => {
    const {points, size: [, [width]], viewBox: {box}} = store;

    const {scaleStartPoint, scaleEndPoint} = box;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    const {left: nodeLeft} = node.getBoundingClientRect();
    const left = getClientX(event) - nodeLeft;

    let index = Math.round(left * indexWidth / (width - (PADDING * 2)) + scaleStartPoint);
    index = Math.min(index, points.length - 1);
    index = Math.max(index, 0);

    return index;
};

export const preventDefault = event => event && event.type.startsWith('mouse') && event.preventDefault();

// const SHOP_POPUP_TIMEOUT = 200;

// const updatePopupThrottleTimeout = null;

// const throttledUpdatePopup = (popup, point, store, width, lineLeft) => {
//     const [popupNode] = popup;
//     if (updatePopupThrottleTimeout === null) {
//         popupNode.style.opacity = 0;
//     } else {
//         clearTimeout(updatePopupThrottleTimeout);
//     }

//     updatePopupThrottleTimeout = setTimeout(() => {
//         updatePopupThrottleTimeout = null;
//         popupNode.style.opacity = 1;

//         nextFrame(() => updatePopup(popup, point, store, width, lineLeft));
//     }, SHOP_POPUP_TIMEOUT);
// };
