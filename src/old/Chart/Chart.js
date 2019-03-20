
import css from './Chart.styl';
import ChartView from '../ChartView';
import ChartScaler from '../ChartScaler';

class Chart {
    constructor(store) {
        this._store = store;
        this._node = document.createElement('div');
        this._node.classList.add(css.chart);

        this._chartView = new ChartView(store);
        this._chartScaler = new ChartScaler(store);

        this._node.appendChild(this._chartView.node);
        this._node.appendChild(this._chartScaler.node);

        store.on(store.CHANGE_SIZE, size => this._setSize(size));
    }

    _setSize({width, height}) {
        this._node.style.width = `${width}px`;
        this._node.style.height = `${height}px`;
    }

    get node() {
        return this._node;
    }
}

export default Chart;
