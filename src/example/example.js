

import css from './example.styl';
// import chartList from './chartData.json';
import chart1 from '../../data/1/overview.json';
import chart2 from '../../data/2/overview.json';
import chart3 from '../../data/3/overview.json';
import chart4 from '../../data/4/overview.json';
import chart5 from '../../data/5/overview.json';

const {chart} = window;

const root = document.createElement('div');
root.classList.add(css.root);

document.body.appendChild(root);

const charts = [];

console.log(chart1);
console.log(chart2);
console.log(chart3);
console.log(chart4);
console.log(chart5);

const renderCharts = () => {
    renderChart(chart1, 0, {name: 'Chart #1', dataLink: '/data/1'});
    renderChart(chart2, 1, {name: 'Chart #2', dataLink: '/data/2'});
    renderChart(chart3, 2, {name: 'Chart #3', dataLink: '/data/3', isBar: true});
    renderChart(chart4, 3, {name: 'Chart #4', dataLink: '/data/4', isBar: true, transformToLineChart: true});
    renderChart(chart5, 4, {name: 'Chart #5', isArea: true});
};

const renderChart = (data, index, {isBar = false, isArea = false, name = '', dataLink, transformToLineChart} = {}) => {
    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add(css.chartWrapper);
    root.appendChild(chartWrapper);

    let chartHeight = window.innerWidth < 1020
        ? Math.max(200, window.innerHeight - 310)
        : Math.max(200, window.innerHeight - 350);

    if (chartHeight > 600) {
        chartHeight = 600;
    }

    setTimeout(() => {
        charts.push(chart.createChart(chartWrapper, data, {
            chartHeight,
            isBar,
            isArea,
            name,
            dataLink,
            transformToLineChart,
        }));
    }, 100 * index);
};

renderCharts();
