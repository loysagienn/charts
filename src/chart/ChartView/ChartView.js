
// import createSvg from '../ScalebleSvg';
import createCanvas from '../Canvas';
// import createWebgl from '../Webgl';
import createChartGrid from '../ChartGrid';
import createBottomLabels from '../BottomLabels';
import createDetailsPopup from '../DetailsPopup';
import {createElement, appendChild} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX, PADDING} from '../constants';
import css from './ChartView.styl';

const SVG_LINE_WIDTH = 2;

const setSize = (node, store, chartLine) => {
    const {viewBox: {animationBox}, staticViewBox, size: [, [width, height]]} = store;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    console.log('set size');

    chartLine.render(staticViewBox, animationBox, width, height);
};

const setScale = (store, chartLine) => {
    const {viewBox: {animationBox}, staticViewBox, size: [, [width, height]]} = store;
    chartLine.render(staticViewBox, animationBox, width, height);
};

export const ChartView = (store) => {
    const node = createElement(css.chartView);

    const chartGrid = createChartGrid(store);

    // const chartLine = createSvg(store, SVG_LINE_WIDTH, PADDING);
    const chartLine = createCanvas(store, SVG_LINE_WIDTH, PADDING);
    // const chartLine = createCanvas(store, SVG_LINE_WIDTH, PADDING);

    const bottomLabels = createBottomLabels(store);
    const detailsPopup = createDetailsPopup(store);

    appendChild(node, bottomLabels.node);
    appendChild(node, chartLine.node);
    appendChild(node, chartGrid.node);
    appendChild(node, detailsPopup.node);

    store.on(CHANGE_SIZE, () => setSize(node, store, chartLine));
    store.viewBox.on(ANIMATE_VIEW_BOX, () => setScale(store, chartLine));

    return {node};
};

export default ChartView;
