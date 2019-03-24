
import {createElement, appendChild, withTheme} from '../helpers';
import {CHANGE_SIZE, CHANGE_SCALE, PADDING} from '../constants';
import css from './BottomLabels.styl';
import nextFrame from '../nextFrame';

const LABEL_WIDTH = 45;
const LABEL_SPACE = 30;
const LABEL_CHANGE_STEP = 1.5;


const createLabel = (indexSize, labelIndex, point) => {
    const node = createElement(css.label);
    const left = Math.round(1000 * labelIndex / indexSize) / 10;

    node.style.left = `${left}%`;
    node.style.opacity = '0';
    const date = new Date(point);

    const text = document.createTextNode(date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}));

    appendChild(node, text);

    return {
        node,
        showTimeout: null,
        hideTimeout: null,
    };
};

const showLabel = (container, label) => {
    if (label.hideTimeout) {
        clearTimeout(label.hideTimeout);

        nextFrame(() => label.node.style.opacity = '1');
    } else {
        appendChild(container, label.node);

        label.showTimeout = setTimeout(() => {
            label.showTimeout = null;

            nextFrame(() => label.node.style.opacity = '1');
        }, 30);
    }
};

const hideLabel = (container, label) => {
    if (label.showTimeout) {
        clearTimeout(label.showTimeout);
    }

    nextFrame(() => label.node.style.opacity = '0');

    label.hideTimeout = setTimeout(() => {
        label.hideTimeout = null;

        nextFrame(() => container.removeChild(label.node));
    }, 200);
};

const updateAll = (store, container, labelsCollection, activeLabels) => {
    const [[width]] = store.size;
    const {points} = store;
    const {scaleStartPoint, scaleEndPoint} = store.viewBox.box;
    const {scaleStartPoint: firstIndex, scaleEndPoint: lastIndex} = store.fullViewBox.box;

    const [scaleStart, scaleEnd] = store.scale;
    const scaleWidth = 1 - scaleStart - scaleEnd;

    const left = -Math.round(1000 * scaleStart) / 10;
    const containerWidth = Math.round(1000 * 1 / scaleWidth) / 10;

    container.style.transform = `translate(${left}%, 0)`;
    container.style.width = `${containerWidth}%`;

    const indexSize = scaleEndPoint - scaleStartPoint;
    const fullIndexSize = lastIndex - firstIndex;

    const chartWidth = width - (PADDING * 2);
    const maxLabelCount = Math.floor(chartWidth / (LABEL_WIDTH + LABEL_SPACE));

    let labelsStep = 1;

    while (indexSize / labelsStep > maxLabelCount) {
        labelsStep *= LABEL_CHANGE_STEP;
    }

    labelsStep = Math.round(labelsStep);

    const halfStep = Math.round(labelsStep / 2);

    const indexLabelHalfWidth = LABEL_WIDTH * indexSize / chartWidth / 2;

    let labelIndex = Math.ceil(
        (scaleStartPoint - halfStep + (indexLabelHalfWidth)) / labelsStep,
    ) * labelsStep + halfStep;

    const nextActiveLabels = new Set();

    while (labelIndex < scaleEndPoint - indexLabelHalfWidth) {
        nextActiveLabels.add(labelIndex);

        if (activeLabels.has(labelIndex)) {
            activeLabels.delete(labelIndex);

            labelIndex += labelsStep;

            continue;
        }

        const label = labelsCollection[labelIndex] || (
            labelsCollection[labelIndex] = createLabel(fullIndexSize, labelIndex, points[labelIndex].x)
        );

        showLabel(container, label);

        labelIndex += labelsStep;
    }

    activeLabels.forEach(index => hideLabel(container, labelsCollection[index]));

    return nextActiveLabels;
};

const BottomLabels = (store) => {
    const labelsCollection = {};
    let activeLabels = new Set();

    const node = createElement(css.labels);
    withTheme(store, node, css);
    const wrapper = createElement(css.wrapper);
    const container = createElement(css.container);

    appendChild(node, wrapper);
    appendChild(wrapper, container);

    const update = () => (activeLabels = updateAll(store, container, labelsCollection, activeLabels));

    store.on(CHANGE_SCALE, update);
    store.on(CHANGE_SIZE, update);

    return {node};
};

export default BottomLabels;
