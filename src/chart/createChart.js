
import {appendChild, addEvent, removeEvent, prepareChartData} from './helpers';
import createChart from './Chart';
import Store from './Store';

export default (root, chartData, options) => {
    const {clientWidth: width, clientHeight: height} = root;

    root.innerHTML = '';

    const store = new Store(prepareChartData(chartData), options);

    // store.on('*', (data, event) => console.log(event, data));

    const chart = createChart(store);

    store.changeSize(width, height);

    appendChild(root, chart.node);

    const updateSize = () => {
        const {clientWidth, clientHeight} = root;

        store.changeSize(clientWidth, clientHeight);
    };

    addEvent(window, 'resize', updateSize);

    const destroy = () => {
        removeEvent(window, 'resize', updateSize);
    };

    return {
        destroy,
        setTheme: theme => store.setTheme(theme),
    };
};
