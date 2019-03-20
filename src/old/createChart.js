
import Chart from './Chart';
import Store from './Store';

const prepareChartData = ({columns, types, names, colors}) => {
    const [xPoints, ...yLines] = columns;

    const lineIds = yLines.map(([id]) => id);

    const points = [];

    for (let i = 1; i < xPoints.length; i++) {
        points.push({
            x: xPoints[i],
            lines: yLines.reduce((acc, line, index) => Object.assign(acc, {[lineIds[index]]: line[i]}), {}),
        });
    }

    return {points, colors, names, lineIds};
};

export default (root, chartData, options) => {
    const {clientWidth: width, clientHeight: height} = root;

    root.innerHTML = '';

    const store = new Store(prepareChartData(chartData), options);
    const chart = new Chart(store);

    // store.on('*', (data, event) => console.log(event, data));

    store.changeSize(width, height);

    root.appendChild(chart.node);

    const updateSize = () => {
        const {clientWidth, clientHeight} = root;

        store.changeSize(clientWidth, clientHeight);
    };

    window.addEventListener('resize', updateSize);
};
