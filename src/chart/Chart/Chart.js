
import css from './Chart.styl';
import createChartView from '../ChartView';
import createChartScaler from '../ChartScaler';
import crateChartsList from '../ChartsList';
import {CHANGE_SIZE} from '../constants';
import {createElement, appendChild, withTheme} from '../helpers';

const setSize = (node, width, height) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
};

const Chart = (store) => {
    const node = createElement(css.chart);
    withTheme(store, node, css);

    const chartView = createChartView(store);
    const chartScaler = createChartScaler(store);
    const chartsList = crateChartsList(store);

    appendChild(node, chartView.node);
    appendChild(node, chartScaler.node);
    appendChild(node, chartsList.node);

    store.on(CHANGE_SIZE, ([[width, height]]) => setSize(node, width, height));

    return {node};
};

export default Chart;
