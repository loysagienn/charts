
import Svg from '../Svg';
import ChartGrid from '../ChartGrid';
import {createElement} from '../helpers';
import css from './ChartView.styl';

const setSize = (node, store, chartLine) => {
    const {points, viewBox, size: {chartView: {width, height}}} = store;

    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    chartLine.render(points, viewBox, width, height);
};

const setScale = (store, chartLine) => {
    const {points, currentViewBox, size: {chartView: {width, height}}} = store;
    chartLine.render(points, currentViewBox, width, height);
};

export const View = (store) => {
    const node = createElement('div', css.chartView);

    const chartGrid = new ChartGrid(store);
    const chartLine = new Svg(store.points, store.lineIds, store.lineColors);

    node.appendChild(chartGrid.node);
    node.appendChild(chartLine.node);

    store.on(store.CHANGE_SIZE, () => setSize(node, store, chartLine));
    store.on(store.ANIMATE_VIEW_BOX, () => setScale(store, chartLine));

    return {node};
};

class ChartView {
    constructor(store) {
        this._store = store;

        this._node = document.createElement('div');
        this._node.classList.add(css.chartView);
        this._chartGrid = new ChartGrid(store);
        this._chartLine = new Svg(store.points, store.lineIds, store.lineColors);

        this._node.appendChild(this._chartGrid.node);
        this._node.appendChild(this._chartLine.node);

        store.on(store.CHANGE_SIZE, ({chartView}) => this._setSize(chartView));
        store.on(store.ANIMATE_VIEW_BOX, scale => this._setScale(scale));
    }

    _setSize({width, height}) {
        const {points, viewBox} = this._store;

        this._node.style.width = `${width}px`;
        this._node.style.height = `${height}px`;

        this._chartLine.render(points, viewBox, width, height);
    }

    _setScale() {
        const {points, currentViewBox, size: {chartView: {width, height}}} = this._store;
        this._chartLine.render(points, currentViewBox, width, height);
    }

    get node() {
        return this._node;
    }
}

export default ChartView;
