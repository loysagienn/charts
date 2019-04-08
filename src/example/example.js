

import css from './example.styl';
// import chartList from './chartData.json';
import chart1 from '../../data/1/overview.json';
import chart2 from '../../data/2/overview.json';
import chart3 from '../../data/3/overview.json';
import chart4 from '../../data/4/overview.json';
import chart5 from '../../data/5/overview.json';

const {chart} = window;

// console.log(chartList);
// const wrapper = document.createElement('div');
// wrapper.classList.add(css.wrapper);

// document.body.appendChild(wrapper);

const root = document.createElement('div');
root.classList.add(css.root);

// wrapper.appendChild(root);
document.body.appendChild(root);

// const startFromZero = false;
// let useDarkTheme = false;

const charts = [];

console.log(chart1);
console.log(chart2);
console.log(chart3);
console.log(chart4);
console.log(chart5);

const renderCharts = () => {
    renderChart(chart1, 0);
    renderChart(chart2, 1);
    renderChart(chart3, 2);
    renderChart(chart4, 3);
    renderChart(chart5, 4);
};

const renderChart = (data, index) => {
    const chartWrapper = document.createElement('div');
    chartWrapper.classList.add(css.chartWrapper);
    root.appendChild(chartWrapper);

    const chartHeight = window.innerWidth < 1020
        ? Math.max(200, window.innerHeight - 240)
        : Math.max(200, window.innerHeight - 280);

    setTimeout(() => {
        charts.push(chart.createChart(chartWrapper, data, {
            // startFromZero: false,
            chartHeight,
            // theme: useDarkTheme ? 'dark' : 'light',
        }));
    }, 200 * index);
};

// const renderThemeSwitcher = (optionsPopup) => {
//     const darkThemeNode = document.createElement('label');
//     optionsPopup.appendChild(darkThemeNode);

//     const themeCheckbox = document.createElement('input');
//     themeCheckbox.setAttribute('type', 'checkbox');
//     darkThemeNode.appendChild(themeCheckbox);
//     darkThemeNode.appendChild(document.createTextNode(' Dark theme'));
//     themeCheckbox.checked = useDarkTheme;

//     themeCheckbox.addEventListener('change', () => {
//         useDarkTheme = themeCheckbox.checked;

//         charts.forEach(item => item.setTheme(useDarkTheme ? 'dark' : 'light'));
//     });
// };

// const renderStartFromZero = (optionsPopup) => {
//     const chartModeNode = document.createElement('label');
//     optionsPopup.appendChild(chartModeNode);

//     const checkbox = document.createElement('input');
//     checkbox.setAttribute('type', 'checkbox');
//     chartModeNode.appendChild(checkbox);
//     chartModeNode.appendChild(document.createTextNode(' Start from 0'));
//     checkbox.checked = startFromZero;

//     checkbox.addEventListener('change', () => {
//         startFromZero = checkbox.checked;

//         charts.forEach(item => item.changeStartFromZeroMode(startFromZero));
//     });
// };


// const renderChartSettings = () => {
//     const settingsNode = document.createElement('div');
//     settingsNode.classList.add(css.settings);
//     root.appendChild(settingsNode);

//     renderThemeSwitcher(settingsNode);
//     renderStartFromZero(settingsNode);
// };


// renderChartSettings();
renderCharts();
