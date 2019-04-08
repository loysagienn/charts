
import {appendChild, addEvent, removeEvent} from './helpers';
import createChart from './Chart';
import Store from './Store';

const prepareChartData = ({columns, types, names, colors, y_scaled: yScaled}) => {
    const [xPoints, ...yLines] = columns;

    const lineIds = yLines.map(([id]) => id);

    const points = [];

    for (let i = 1; i < xPoints.length; i++) {
        points.push({
            x: xPoints[i],
            lines: yLines.reduce((acc, line, index) => Object.assign(acc, {[lineIds[index]]: line[i]}), {}),
        });
    }

    return {points, colors, names, lineIds, types, yScaled};
};

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
        changeStartFromZeroMode: startFromZero => store.changeStartFromZeroMode(startFromZero),
        setTheme: theme => store.setTheme(theme),
    };
};
