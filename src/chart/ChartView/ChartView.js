
import createWebgl from '../Webgl';
import createGrid from '../Grid';
import createBottomLabels from '../BottomLabels';
import createDetailsPopup from '../DetailsPopup';
import {createElement, appendChild, withTheme} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX, PADDING, SHOW_SUB_STORE} from '../constants';
import css from './ChartView.styl';

const SVG_LINE_WIDTH = 2;

const setSize = (node, store, chartLine) => {
    const {size: [, [width, height]]} = store;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    chartLine.render(width, height);
};

const setScale = (store, chartLine) => {
    const {size: [, [width, height]]} = store;

    chartLine.render(width, height);
};

const setAnimationEvents = (store, chartLine) => {
    store.viewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));
    store.fullViewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));

    if (store.yScaled) {
        store.secondaryViewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));
        store.secondaryFullViewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));
    }
};

export const ChartView = (store) => {
    const node = createElement(css.chartView);
    withTheme(store, node, css);

    const grid = createGrid(store);

    const chartLine = createWebgl(store, SVG_LINE_WIDTH, PADDING);

    const bottomLabels = createBottomLabels(store);

    appendChild(node, grid.node);
    appendChild(node, bottomLabels.node);

    // if (!store.isBar) {
    const detailsPopup = createDetailsPopup(store);
    appendChild(node, detailsPopup.node);
    // }

    store.on(CHANGE_SIZE, () => setSize(node, store, chartLine));

    setAnimationEvents(store, chartLine);

    store.on(SHOW_SUB_STORE, () => {
        if (store.subStore) {
            setAnimationEvents(store.subStore, chartLine);
        }
    });

    return {node, image: chartLine.node};
};

export default ChartView;
