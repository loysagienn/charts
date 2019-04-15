
import {createElement, appendChild, withTheme, getTimeString, getWeekDayString, getDateString} from '../helpers';
import {CHANGE_SIZE, CHANGE_SCALE, PADDING, SHOW_SUB_STORE, TIMEZONE_OFFSET} from '../constants';
import css from './BottomLabels.styl';
import nextFrame from '../nextFrame';

// const LABEL_WIDTH = 45;
const LABEL_SPACE = 20;
const LABEL_CHANGE_STEP = 1.5;
const MAX_LABEL_COUNT = 10;

const getLabelWidth = store => (store.weekDetailed ? 60 : 40);

const getLabelText = (store, timestamp) => {
    const date = new Date(timestamp + TIMEZONE_OFFSET);

    if (store.weekDetailed) {
        return `${getWeekDayString(date)} ${getTimeString(date)}`;
    }

    if (store.dayDetailed) {
        return getTimeString(date);
    }

    return getDateString(date);
};

const createLabel = (store, indexSize, labelIndex, point) => {
    const node = createElement(css.label);
    const labelInner = createElement(css.labelInner);

    node.style.opacity = '0';

    // date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})
    const dateText = getLabelText(store, point);

    const text = document.createTextNode(dateText);

    appendChild(labelInner, text);
    appendChild(node, labelInner);

    return {
        node,
        showTimeout: null,
        hideTimeout: null,
        index: labelIndex,
    };
};

const showLabel = (container, label, visibleLabels) => {
    if (label.hideTimeout) {
        clearTimeout(label.hideTimeout);

        label.hideTimeout = null;

        nextFrame(() => label.node.style.opacity = '1');
    } else if (!visibleLabels.has(label.index)) {
        appendChild(container, label.node);

        label.showTimeout = setTimeout(() => {
            label.showTimeout = null;

            nextFrame(() => label.node.style.opacity = '1');
        }, 30);

        visibleLabels.add(label.index);
    }
};

const hideLabel = (container, label, visibleLabels) => {
    if (label.showTimeout) {
        clearTimeout(label.showTimeout);

        label.showTimeout = null;
    }

    if (label.hideTimeout) {
        return;
    }

    nextFrame(() => label.node.style.opacity = '0');

    label.hideTimeout = setTimeout(() => {
        label.hideTimeout = null;

        nextFrame(() => container.contains(label.node) && container.removeChild(label.node));

        visibleLabels.delete(label.index);
    }, 200);
};

const setLabelPosition = (store, label, {node}) => {
    const [[width]] = store.size;
    const {scaleStartPoint, scaleEndPoint} = store.viewBox.box;
    const chartWidth = width - (PADDING * 2);
    const indexWidth = scaleEndPoint - scaleStartPoint;

    const left = chartWidth * (label - scaleStartPoint) / indexWidth;

    node.style.transform = `translate(${left}px, 0)`;
};

const updateAll = (store, container, labelsCollection, activeLabels, visibleLabels) => {
    const [[width]] = store.size;
    const {points} = store;
    const {scaleStartPoint, scaleEndPoint} = store.viewBox.box;
    // const {scaleStartPoint: firstIndex, scaleEndPoint: lastIndex} = store.fullViewBox.box;

    const indexSize = scaleEndPoint - scaleStartPoint;
    const fullIndexSize = points.length - 1;

    const labelWidth = getLabelWidth(store);

    const chartWidth = width - (PADDING * 2);
    const maxLabelCount = Math.min(Math.floor(chartWidth / (labelWidth + LABEL_SPACE)), MAX_LABEL_COUNT);

    let labelsStep = 1;

    while (indexSize / labelsStep > maxLabelCount) {
        labelsStep *= LABEL_CHANGE_STEP;
    }

    labelsStep = Math.round(labelsStep);

    const halfStep = Math.round(labelsStep / 2);

    const indexPadding = PADDING * indexSize / chartWidth;

    const indexLabelHalfWidth = labelWidth * indexSize / chartWidth / 2;

    let labelIndex = Math.ceil(
        (scaleStartPoint - halfStep + (indexLabelHalfWidth) - indexPadding) / labelsStep,
    ) * labelsStep + halfStep;

    const nextActiveLabels = new Set();

    while (labelIndex < scaleEndPoint + indexPadding - indexLabelHalfWidth) {
        nextActiveLabels.add(labelIndex);

        if (activeLabels.has(labelIndex)) {
            activeLabels.delete(labelIndex);

            labelIndex += labelsStep;

            continue;
        }

        const label = labelsCollection[labelIndex] || (
            labelsCollection[labelIndex] = createLabel(store, fullIndexSize, labelIndex, points[labelIndex].x)
        );

        showLabel(container, label, visibleLabels);

        labelIndex += labelsStep;
    }

    activeLabels.forEach(index => hideLabel(container, labelsCollection[index], visibleLabels));

    visibleLabels.forEach(label => setLabelPosition(store, label, labelsCollection[label]));

    return nextActiveLabels;
};

const getLabelData = () => ({
    container: createElement(css.container),
    labelsCollection: {},
    visibleLabels: new Set(),
    activeLabels: new Set(),
});

const hideSubLabels = (data, wrapper) => {
    data.container.style.opacity = 0;

    setTimeout(() => nextFrame(() => {
        if (wrapper.contains(data.container)) {
            wrapper.removeChild(data.container);
        }
    }), 300);
};

const createLabels = (wrapper) => {
    const labelsData = getLabelData();

    labelsData.container.style.opacity = 0;
    appendChild(wrapper, labelsData.container);

    nextFrame(() => {
        labelsData.container.style.opacity = 1;
    });

    return labelsData;
};

const BottomLabels = (store) => {
    const node = createElement(css.labels);
    withTheme(store, node, css);
    const wrapper = createElement(css.wrapper);

    const mainLabels = getLabelData();
    let labelsData = mainLabels;

    appendChild(node, wrapper);
    appendChild(wrapper, labelsData.container);

    const update = () => {
        labelsData.activeLabels = updateAll(
            store.subStore || store,
            labelsData.container,
            labelsData.labelsCollection,
            labelsData.activeLabels,
            labelsData.visibleLabels,
        );
    };

    store.on(CHANGE_SCALE, update);
    store.on(CHANGE_SIZE, update);
    store.on(SHOW_SUB_STORE, () => {
        if (store.subStore) {
            labelsData = createLabels(wrapper);

            mainLabels.container.style.opacity = 0;

            store.subStore.on(CHANGE_SCALE, update);

            if (store.subStore.isPie) {
                wrapper.style.opacity = 0;
            } else {
                wrapper.style.opacity = 1;
            }
        } else {
            mainLabels.container.style.opacity = 1;

            hideSubLabels(labelsData, wrapper);

            labelsData = mainLabels;

            wrapper.style.opacity = 1;
        }

        update();
    });

    return {node};
};

export default BottomLabels;
