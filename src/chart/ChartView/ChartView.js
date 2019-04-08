
// import createSvg from '../ScalebleSvg';
import createCanvas from '../Canvas';
import createWebgl from '../Webgl';
import createChartGrid from '../ChartGrid';
import createBottomLabels from '../BottomLabels';
import createDetailsPopup from '../DetailsPopup';
import {createElement, appendChild, withTheme} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX, PADDING, VIEW_SCALER_SPACE} from '../constants';
import css from './ChartView.styl';

const SVG_LINE_WIDTH = 2;

const createSpacer = () => {
    const spacer = createElement(css.spacer);

    spacer.style.height = `${VIEW_SCALER_SPACE}px`;

    return spacer;
};

const setSize = (node, store, chartLine) => {
    const {viewBox: {animationBox: viewBox}, fullViewBox: {animationBox: fullViewBox}, size: [, [width, height]]} = store;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    chartLine.render(fullViewBox, viewBox, width, height);
};

const setScale = (store, chartLine) => {
    const {viewBox: {animationBox: viewBox}, fullViewBox: {animationBox: fullViewBox}, size: [, [width, height]]} = store;

    chartLine.render(fullViewBox, viewBox, width, height);
};

export const ChartView = (store) => {
    const node = createElement(css.chartView);
    withTheme(store, node, css);

    const chartGrid = createChartGrid(store);

    // const chartLine = createSvg(store, SVG_LINE_WIDTH, PADDING);
    const chartLine = createWebgl(store, SVG_LINE_WIDTH, PADDING);
    // const chartLine = createCanvas(store, SVG_LINE_WIDTH, PADDING);

    const bottomLabels = createBottomLabels(store);
    const detailsPopup = createDetailsPopup(store);
    const spacer = createSpacer();

    appendChild(node, chartGrid.node);
    appendChild(node, chartLine.node);
    appendChild(node, spacer);
    appendChild(node, bottomLabels.node);
    appendChild(node, detailsPopup.node);

    store.on(CHANGE_SIZE, () => setSize(node, store, chartLine));
    store.viewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));
    store.fullViewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));

    return {node};
};

export default ChartView;
