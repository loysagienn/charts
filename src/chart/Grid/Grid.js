
import {createElement, appendChild, withTheme} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX, LINE_ON, LINE_OFF, SHOW_SUB_STORE} from '../constants';
import nextFrame from '../nextFrame';
import css from './Grid.styl';

const setSize = (node, [, [width, height]]) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
};

const createNode = (store) => {
    const node = createElement(css.grid);
    withTheme(store, node, css);

    if (store.isArea) {
        node.classList.add(css.isArea);
    }

    if (store.yScaled) {
        node.classList.add(css.yScaled);
    }

    return node;
};

const roundLabels = (labels, step) => {
    const [, digit] = step.toExponential().split('e');

    let roundCount = Math.round((1 / Number(`1e${digit}`)) * 10);

    if (roundCount < 1) {
        roundCount = 1;
    }

    return labels.map(label => Math.round(label * roundCount) / roundCount);
};

const getLabels = (store) => {
    const {minY, maxY, gridStep} = store.viewBox.box;
    const [, [, height]] = store.size;

    let max = maxY;

    if (store.isArea) {
        max += (maxY - minY) * (22 / height);
    } else {
        // на 22 пикселя меньше, чтобы линии не вылезали за границы
        max -= (maxY - minY) * (22 / height);
    }

    const gridLabels = [];
    let item = minY;

    while (item < max) {
        gridLabels.push(item);

        item += gridStep;
    }

    return roundLabels(gridLabels, gridStep);
};

const formatLabel = label => label;

const createItem = (store, root, label) => {
    const node = createElement(css.gridLine);
    const textNode = createElement(css.lineText);

    const text = document.createTextNode(formatLabel(label));

    appendChild(textNode, text);
    appendChild(node, textNode);

    // node.style.display = 'none';
    // node.style.opacity = 0;

    // appendChild(root, node);

    if (store.yScaled) {
        const secondaryTextNode = createElement(css.lineText);
        const secondaryText = document.createTextNode('');

        appendChild(secondaryTextNode, secondaryText);
        appendChild(node, secondaryTextNode);

        const [mainLineId, secondaryLineId] = store.allLineIds;

        textNode.style.color = store.lineColors[mainLineId];
        secondaryTextNode.style.color = store.lineColors[secondaryLineId];

        return {label, node, secondaryText};
    }

    return {label, node};
};

const removeLabel = (store, node, activeLabels, labelCache, label) => {
    const item = labelCache[label];

    if (!item) {
        return;
    }

    if (item.removeTimeout) {
        return;
    }

    item.node.style.opacity = 0;

    item.removeTimeout = setTimeout(() => nextFrame(() => {
        // если за время от тика таймаута до nextFrame кто-то решил показать элемент - не убираем его
        if (!item.removeTimeout) {
            return;
        }

        const indexOfLabel = activeLabels.indexOf(label);

        if (indexOfLabel !== -1) {
            activeLabels.splice(indexOfLabel, 1);
        }

        if (node.contains(item.node)) {
            node.removeChild(item.node);
        }

        // item.node.style.display = 'none';

        item.removeTimeout = null;
    }), 300);
};

const addLabel = (store, node, activeLabels, labelCache, label) => {
    const item = labelCache[label] || (labelCache[label] = createItem(store, node, label));

    if (item.removeTimeout) {
        clearTimeout(item.removeTimeout);

        item.node.style.opacity = 1;

        item.removeTimeout = null;
    }

    if (activeLabels.includes(label)) {
        return;
    }

    activeLabels.push(label);

    node.appendChild(item.node);
    // item.node.style.display = store.yScaled ? 'flex' : 'block';

    nextFrame(() => {
        if (!item.removeTimeout) {
            item.node.style.opacity = 1;
        }
    });
};

const updatePositions = (store, activeLabels, labelCache) => {
    const [, [, height]] = store.size;
    const {minY, maxY} = store.viewBox.animationBox;
    const scaleHeight = maxY - minY;
    const factor = height / scaleHeight;

    for (let i = 0; i < activeLabels.length; i++) {
        const item = labelCache[activeLabels[i]];

        if (!item) {
            continue;
        }

        const position = factor * (item.label - minY);

        item.node.style.transform = `translate(0, ${-position}px)`;
    }
};

const updateSecondaryLineValues = (store, activeLabels, labelCache) => {
    const {minY, maxY} = store.viewBox.box;
    const {minY: secondaryMinY, maxY: secondaryMaxY} = store.secondaryViewBox.box;
    const factor = (secondaryMaxY - secondaryMinY) / (maxY - minY);

    for (let i = 0; i < activeLabels.length; i++) {
        const {label, secondaryText} = labelCache[activeLabels[i]];

        secondaryText.nodeValue = formatLabel(Math.round((label - minY) * factor + secondaryMinY));
    }
};

const updateGrid = (store, node, labelCache, activeLabels) => {
    const newLabels = getLabels(store);

    const labelsToRemove = [];

    for (let i = 0; i < activeLabels.length; i++) {
        const label = activeLabels[i];

        if (!newLabels.includes(label)) {
            labelsToRemove.push(label);
        }
    }

    for (let i = 0; i < labelsToRemove.length; i++) {
        removeLabel(store, node, activeLabels, labelCache, labelsToRemove[i]);
    }

    for (let i = 0; i < newLabels.length; i++) {
        addLabel(store, node, activeLabels, labelCache, newLabels[i]);
    }

    updatePositions(store, activeLabels, labelCache);

    if (store.yScaled) {
        updateSecondaryLineValues(store, activeLabels, labelCache);
    }

    // console.log(Object.keys(labelCache).length);
};

const toggleLines = (store, node, lineId) => {
    if (store.yScaled) {
        const [mainLineId, secondaryLineId] = store.allLineIds;

        if (lineId === mainLineId) {
            node.classList.toggle(css.mainLineOff);
        }
        if (lineId === secondaryLineId) {
            node.classList.toggle(css.secondaryLineOff);
        }
    }
};

const Grid = (store) => {
    const node = createNode(store);

    const labelCache = {};
    const activeLabels = [];

    const update = () => updateGrid(store.subStore || store, node, labelCache, activeLabels);

    const toggleLine = (lineId) => {
        toggleLines(store, node, lineId);

        update();
    };

    store.on(CHANGE_SIZE, (size) => { setSize(node, size); update(); });
    store.on(LINE_ON, toggleLine);
    store.on(LINE_OFF, toggleLine);
    store.viewBox.on(ANIMATE_VIEW_BOX, update);
    store.on(SHOW_SUB_STORE, () => {
        if (store.subStore) {
            store.subStore.viewBox.on(ANIMATE_VIEW_BOX, update);

            if (store.subStore.isPie) {
                node.style.opacity = 0;
            } else {
                node.style.opacity = 1;
            }
        } else {
            node.style.opacity = 1;
        }
    });

    return {node};
};

export default Grid;
