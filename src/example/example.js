

import css from './example.styl';
import chartList from './chartData.json';

const {chart} = window;

console.log(chartList);

const root = document.createElement('div');

root.classList.add(css.root);

document.body.appendChild(root);

const chartNode = document.createElement('div');
chartNode.classList.add(css.chart);
root.appendChild(chartNode);

let currentChart = 0;
let startFromZero = true;
let useDarkTheme = true;
let chartItem;

const renderChart = () => (chartItem = chart.createChart(chartNode, chartList[currentChart], {
    startFromZero,
    theme: useDarkTheme ? 'dark' : 'light',
}));

const renderChartSettings = () => {
    const settingsNode = document.createElement('div');
    settingsNode.classList.add(css.settings);
    root.appendChild(settingsNode);


    const chartSelectNode = document.createElement('select');
    settingsNode.appendChild(chartSelectNode);

    chartList.forEach((chartInfo, i) => {
        const option = document.createElement('option');
        option.setAttribute('value', i);

        if (i === currentChart) {
            option.setAttribute('selected', true);
        }

        option.appendChild(document.createTextNode(`Chart ${i + 1}`));


        chartSelectNode.appendChild(option);
    });

    chartSelectNode.addEventListener('change', () => {
        if (chartItem) {
            chartItem.destroy();
        }

        currentChart = chartSelectNode.value;

        renderChart();
    });


    // start from zero checkbox
    const chartModeNode = document.createElement('label');
    settingsNode.appendChild(chartModeNode);

    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    chartModeNode.appendChild(checkbox);
    chartModeNode.appendChild(document.createTextNode(' Start from 0'));
    checkbox.checked = startFromZero;

    checkbox.addEventListener('change', () => {
        startFromZero = checkbox.checked;

        chartItem.changeStartFromZeroMode(startFromZero);
    });

    // theme checkbox
    const darkThemeNode = document.createElement('label');
    settingsNode.appendChild(darkThemeNode);

    const themeCheckbox = document.createElement('input');
    themeCheckbox.setAttribute('type', 'checkbox');
    darkThemeNode.appendChild(themeCheckbox);
    darkThemeNode.appendChild(document.createTextNode(' Dark theme'));
    themeCheckbox.checked = useDarkTheme;

    themeCheckbox.addEventListener('change', () => {
        useDarkTheme = themeCheckbox.checked;

        chartItem.setTheme(useDarkTheme ? 'dark' : 'light');
    });
};


renderChartSettings();
renderChart();
