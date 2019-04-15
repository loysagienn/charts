
import {createElement, appendChild, withTheme, addEvent, getDateString, getTimeString} from '../helpers';
import {CHANGE_SIZE, LINE_ON, LINE_OFF, CHANGE_SCALE, PADDING, SHOW_SUB_STORE, TIMEZONE_OFFSET} from '../constants';
// import nextFrame from '../nextFrame';
import {getClientX, getClientY, startMove, getIndex, isVerticalMove, preventDefault} from './helpers';
import css from './DetailsPopup.styl';

const setSize = (node, store) => {
    const {size: [, [width, height]]} = store;

    node.style.width = `${width - (PADDING * 2)}px`;
    node.style.height = `${height}px`;
};

const updatePopup = (
    [popup, xValue, yValues],
    {x, lines},
    {lineIds, lineColors, lineNames, weekDetailed},
    width, lineLeft, lineWidth,
) => {
    const date = new Date(x + TIMEZONE_OFFSET);
    // const dateText = date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
    const dateText = weekDetailed
        ? `${getDateString(date)}, ${getTimeString(date)}`
        : getDateString(date);

    xValue.innerHTML = '';
    appendChild(xValue, document.createTextNode(dateText));

    yValues.innerHTML = '';

    lineIds.forEach((lineId) => {
        const item = createElement(css.yItemValueLine);
        item.style.color = lineColors[lineId];

        const name = createElement(css.yItemName);
        const value = createElement(css.yItemValue);
        appendChild(name, document.createTextNode(`${lineNames[lineId]}:`));
        appendChild(value, document.createTextNode(lines[lineId]));

        appendChild(item, name);
        appendChild(item, value);

        appendChild(yValues, item);
    });

    const popupWidth = popup.offsetWidth;

    if (lineLeft - popupWidth - 10 < 0) {
        popup.style.transform = `translate(${lineWidth + 7}px, 0)`;
    } else {
        popup.style.transform = `translate(-${popupWidth + 7}px, 0)`;
    }

    // if (lineLeft - (popupWidth / 2) - 10 < 0) {
    //     popup.style.transform = `translate(${10 - lineLeft - PADDING}px, 0)`;
    // } else if (lineLeft + (popupWidth / 2) - 10 > width - (PADDING * 2)) {
    //     popup.style.transform = `translate(${width - lineLeft - popupWidth - (PADDING * 2) + 10}px, 0)`;
    // } else {
    //     popup.style.transform = 'translate(0, 0)';
    // }
};

const updateShadows = (shadows, width, lineLeft, lineWidth) => {
    if (!shadows) {
        return;
    }

    const [leftShadow, rightShadow] = shadows;

    leftShadow.style.transform = `translate(${lineLeft + PADDING}px, 0)`;

    rightShadow.style.transform = `translate(-${width - lineLeft - lineWidth - PADDING}px, 0)`;
};

const updateMarksPosition = (store, point, marks) => {
    const {lineIds, size: [, [, height]]} = store;

    const setLineBottom = (viewBox, lineId) => {
        const {maxY, minY} = viewBox;

        const valueHeight = maxY - minY;

        const y = point.lines[lineId];
        const bottom = height * (y - minY) / valueHeight;

        marks[lineId].style.transform = `translate(0, ${-bottom}px) scale(1, 1)`;
    };

    if (store.yScaled) {
        const [firstLineId, secondLineId] = store.allLineIds;
        if (lineIds.includes(firstLineId)) {
            setLineBottom(store.viewBox.box, firstLineId);
        }

        if (lineIds.includes(secondLineId)) {
            setLineBottom(store.secondaryViewBox.box, secondLineId);
        }
    } else {
        lineIds.forEach(id => setLineBottom(store.viewBox.box, id));
    }
};

const createPopup = (root) => {
    const popup = createElement(css.popup);
    appendChild(root, popup);

    const xValue = createElement(css.popupXValue);
    const yValues = createElement(css.popupYValues);

    appendChild(popup, xValue);
    appendChild(popup, yValues);

    return [popup, xValue, yValues];
};

const createShadows = (node) => {
    const shadows = createElement(css.shadows);

    const leftShadow = createElement(css.leftShadow);
    const rightShadow = createElement(css.rightShadow);

    appendChild(shadows, leftShadow);
    appendChild(shadows, rightShadow);
    appendChild(node, shadows);

    return [leftShadow, rightShadow, shadows];
};

const createMarks = (store, line) => {
    const {allLineIds, lineColors} = store;

    const marks = allLineIds.reduce((acc, id) => {
        const mark = createElement(css.mark);

        mark.style.borderColor = lineColors[id];

        if (!store.isLine) {
            mark.style.display = 'none';
        }

        appendChild(line, mark);

        return Object.assign(acc, {[id]: mark});
    }, {});

    store.on(LINE_ON, lineId => (marks[lineId].style.display = 'block'));
    store.on(LINE_OFF, lineId => (marks[lineId].style.display = 'none'));

    return marks;
};

const renderLine = (store, node) => {
    const line = createElement(css.line);

    let marks = null;

    if (store.isLine) {
        marks = createMarks(store, line);
    }


    const popup = createPopup(line);

    const shadows = store.isBar ? createShadows(node) : null;

    appendChild(node, line);

    return [line, marks, popup, shadows];
};

const checkTarget = (ctx, event) => {
    const {node, shadows} = ctx;
    const {target} = event;

    if (node === target) {
        return true;
    }

    if (!shadows) {
        return false;
    }

    return shadows.includes(target);
};

const showMarks = (marks) => {
    Object.entries(marks).forEach(([, mark]) => mark.style.display = 'block');
};
const hideMarks = (marks) => {
    Object.entries(marks).forEach(([, mark]) => mark.style.display = 'none');
};

class Popup {
    constructor(store) {
        this.originalStore = store;
        this.store = store;
        this.node = createElement(css.root);
        if (store.isBar) {
            this.node.classList.add(css.isBar);
        }
        if (store.isLine) {
            this.node.classList.add(css.isLine);
        }

        this.isTouchDevice = false;
        withTheme(store, this.node, css);

        this.isVisible = false;
        this.currentIndex = 0;

        const [lineNode, marks, popup, shadows] = renderLine(store, this.node);

        this.lineNode = lineNode;
        this.marks = marks;
        this.popup = popup;
        this.shadows = shadows;
        this.moving = false;

        store.on(CHANGE_SIZE, () => this.setSize());
        store.on(SHOW_SUB_STORE, () => this.onSubStore());

        addEvent(this.node, 'mousemove', event => this.startMove(event));
        addEvent(this.node, 'mouseenter', event => this.startMove(event));
        addEvent(window, 'touchstart', event => this.startMove(event));

        this.initPopupHide();
        this.initPointShow();
    }

    onSubStore() {
        this.hide();

        const {originalStore} = this;

        if (originalStore.subStore) {
            this.store = originalStore.subStore;

            this.store.on(CHANGE_SCALE, () => this.hide());
        } else {
            this.store = originalStore;
        }

        if (this.store.transformToLineChart) {
            if (this.store.isLine) {
                if (!this.marks) {
                    this.marks = createMarks(this.store, this.lineNode);
                }
                showMarks(this.marks);

                const [leftShadow, rightShadow] = this.shadows;

                leftShadow.style.display = 'none';
                rightShadow.style.display = 'none';
            } else {
                hideMarks(this.marks);

                const [leftShadow, rightShadow] = this.shadows;

                leftShadow.style.display = 'block';
                rightShadow.style.display = 'block';
            }
        }
    }

    initPointShow() {
        const {store, popup} = this;
        const [popupNode] = popup;

        addEvent(this.node, 'click', (event) => {
            event.isChartDetailsPopupClick = true;

            if (!this.isTouchDevice) {
                store.showPoint(this.currentIndex);
            }
        });

        addEvent(popupNode, 'click', () => store.showPoint(this.currentIndex));
    }

    initPopupHide() {
        const {store} = this;

        const hide = event => this.hide(event);

        addEvent(document.body, 'click', hide);
        store.on(LINE_ON, hide);
        store.on(LINE_OFF, hide);
        store.on(CHANGE_SCALE, hide);
    }

    startMove(event) {
        if (this.store.isPie) {
            return;
        }
        if (this.moving) {
            return;
        }

        if (event.type === 'touchstart') {
            this.isTouchDevice = true;
        }

        if (this.isTouchDevice && event.type === 'mouseenter') {
            return;
        }

        // touchstart триггерим на window
        if (!checkTarget(this, event)) {
            return;
        }

        this.moving = true;

        preventDefault(event);

        const startCoords = [getClientX(event), getClientY(event)];

        let checkingMoveDirection = true;
        let triggerMoveTimeout = null;
        let cancelMove = () => {};

        const onMouseMove = (moveEvent) => {
            if (triggerMoveTimeout) {
                clearTimeout(triggerMoveTimeout);
            }

            if (checkingMoveDirection && isVerticalMove(startCoords, [getClientX(moveEvent), getClientY(moveEvent)])) {
                cancelMove(moveEvent);

                return;
            }

            // если мы поняли что это не вертикальное движение - прекращаем проверять
            if (checkingMoveDirection) {
                checkingMoveDirection = false;
                this.show();
            }

            // если кто-то по какой-то причине выключил попап - прекращаем отслеживать движение
            if (!this.visible) {
                cancelMove(moveEvent);

                return;
            }

            preventDefault(moveEvent);

            this.updatePosition(moveEvent);
        };

        const clear = (clearEvent) => {
            // если на таче просто убрали палец с экрана - не скрываем попап
            if (clearEvent.type !== 'touchend') {
                if (triggerMoveTimeout) {
                    clearTimeout(triggerMoveTimeout);
                }

                this.hide();
            }

            this.moving = false;
        };

        // если это скролл движение или еще какое-то другое, этот таймаут отменится
        triggerMoveTimeout = setTimeout(() => onMouseMove(event), 100);

        cancelMove = startMove(this.node, onMouseMove, clear, event);
    }

    updatePosition(event) {
        const {store, node, lineNode, marks, popup} = this;
        const {points, size: [, [width]], viewBox: {box}} = store;
        let {scaleStartPoint, scaleEndPoint} = box;

        if (store.isBar) {
            scaleStartPoint -= 0.5;
            scaleEndPoint += 0.5;
        }

        const indexWidth = scaleEndPoint - scaleStartPoint;

        const index = getIndex(node, store, event);

        if (this.currentIndex === index) {
            return;
        }

        const point = points[index];

        let lineLeft = (width - (PADDING * 2)) * (index - scaleStartPoint) / indexWidth;
        let lineWidth = 1;

        if (store.isBar) {
            lineWidth = width / indexWidth;

            lineNode.style.width = `${lineWidth}px`;

            lineLeft -= (lineWidth / 2);

            updateShadows(this.shadows, width, lineLeft, lineWidth);
        }

        lineNode.style.transform = `translate(${lineLeft}px, 0)`;

        if (store.isLine) {
            updateMarksPosition(store, point, marks);
        }

        updatePopup(popup, point, store, width, lineLeft, lineWidth);

        this.currentIndex = index;
    }

    setSize() {
        setSize(this.node, this.store);
    }

    show() {
        if (this.visible) {
            return;
        }

        this.visible = true;
        this.node.classList.add(css.visible);
    }

    hide(event) {
        if (!this.visible || (event && (event.isChangeThemeClick || event.isChartDetailsPopupClick))) {
            return;
        }

        this.visible = false;
        this.node.classList.remove(css.visible);
    }
}


export default store => new Popup(store);
