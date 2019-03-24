

import css from './example.styl';
import chartList from './chartData.json';

const {chart} = window;

// console.log(chartList);

const root = document.createElement('div');

root.classList.add(css.root);

document.body.appendChild(root);

const chartNode = document.createElement('div');
chartNode.classList.add(css.chart);
root.appendChild(chartNode);

const currentChart = 0;
let startFromZero = true;
let useDarkTheme = false;
let animationsDisabled = false;
// let chartItem;

const charts = [];

const renderCharts = () => {
    chartList.forEach(renderChart);
    // renderChart(chartList[0]);
};

const renderChart = (data) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add(css.chartWrapper);
    chartNode.appendChild(wrapper);

    charts.push(chart.createChart(wrapper, data, {
        startFromZero,
        animationsDisabled,
        theme: useDarkTheme ? 'dark' : 'light',
    }));
};

const renderThemeSwitcher = (optionsPopup) => {
    const darkThemeNode = document.createElement('label');
    optionsPopup.appendChild(darkThemeNode);

    const themeCheckbox = document.createElement('input');
    themeCheckbox.setAttribute('type', 'checkbox');
    darkThemeNode.appendChild(themeCheckbox);
    darkThemeNode.appendChild(document.createTextNode(' Dark theme'));
    themeCheckbox.checked = useDarkTheme;

    themeCheckbox.addEventListener('change', () => {
        useDarkTheme = themeCheckbox.checked;

        if (useDarkTheme) {
            root.classList.add(css.darkTheme);
        } else {
            root.classList.remove(css.darkTheme);
        }

        charts.forEach(item => item.setTheme(useDarkTheme ? 'dark' : 'light'));

        // chartItem.setTheme(useDarkTheme ? 'dark' : 'light');
    });
};

const renderStartFromZero = (optionsPopup) => {
    const chartModeNode = document.createElement('label');
    optionsPopup.appendChild(chartModeNode);

    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    chartModeNode.appendChild(checkbox);
    chartModeNode.appendChild(document.createTextNode(' Start from 0'));
    checkbox.checked = startFromZero;

    checkbox.addEventListener('change', () => {
        startFromZero = checkbox.checked;

        charts.forEach(item => item.changeStartFromZeroMode(startFromZero));
    });
};

const renderDisableAnimations = (optionsPopup) => {
    const chartModeNode = document.createElement('label');
    optionsPopup.appendChild(chartModeNode);

    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    chartModeNode.appendChild(checkbox);
    chartModeNode.appendChild(document.createTextNode(' Disable animations'));
    checkbox.checked = animationsDisabled;

    checkbox.addEventListener('change', () => {
        animationsDisabled = checkbox.checked;

        charts.forEach(item => item.disableAnimations(animationsDisabled));
    });
};

const setOptionsPopupEvents = (options, popup) => {
    let popupVisible = false;

    const showPopup = (event) => {
        if (!popupVisible) {
            popupVisible = true;
            popup.style.display = 'block';
        }
        event.fromPopupShowEvent = true;
    };

    const hidePopup = (event) => {
        if (!event.fromPopupShowEvent) {
            popupVisible = false;
            popup.style.display = 'none';
        }
    };

    options.addEventListener('click', showPopup);
    document.body.addEventListener('click', hidePopup);
};

const renderChartOptions = (settingsNode) => {
    const options = document.createElement('div');
    options.classList.add(css.options);
    settingsNode.appendChild(options);
    options.addEventListener('click', () => options.focus());
    options.addEventListener('mousedown', () => options.focus());

    const title = document.createElement('div');
    title.classList.add(css.optionsTitle);
    title.appendChild(document.createTextNode('Chart options'));
    options.appendChild(title);

    const optionsPopup = document.createElement('div');
    optionsPopup.classList.add(css.popup);
    options.appendChild(optionsPopup);

    renderThemeSwitcher(optionsPopup);
    renderStartFromZero(optionsPopup);
    renderDisableAnimations(optionsPopup);

    setOptionsPopupEvents(options, optionsPopup);
};

const renderChartSettings = () => {
    const settingsNode = document.createElement('div');
    settingsNode.classList.add(css.settings);
    root.appendChild(settingsNode);


    // const chartSelectNode = document.createElement('select');
    // settingsNode.appendChild(chartSelectNode);

    // chartList.forEach((chartInfo, i) => {
    //     const option = document.createElement('option');
    //     option.setAttribute('value', i);

    //     if (i === currentChart) {
    //         option.setAttribute('selected', true);
    //     }

    //     option.appendChild(document.createTextNode(`Chart ${i + 1}`));


    //     chartSelectNode.appendChild(option);
    // });

    // chartSelectNode.addEventListener('change', () => {
    //     if (chartItem) {
    //         chartItem.destroy();
    //     }

    //     currentChart = chartSelectNode.value;

    //     renderChart();
    // });

    // renderChartOptions(settingsNode);
    renderThemeSwitcher(settingsNode);
    renderStartFromZero(settingsNode);
};


renderCharts();
renderChartSettings();


// const setSvgMode = (val) => {
//     useSvg = val;

//     chartItem.useSvgRendering(useSvg);
// };

// const renderSvgCanvasSwitcher = (optionsPopup) => {
//     const title = document.createElement('div');
//     title.classList.add(css.svgcanvasTitle);
//     title.appendChild(document.createTextNode('render with:'));
//     optionsPopup.appendChild(title);
//     const switcher = document.createElement('div');
//     switcher.classList.add(css.svgcanvas);
//     optionsPopup.appendChild(switcher);

//     // render canvas radio
//     const canvasMode = document.createElement('label');
//     switcher.appendChild(canvasMode);
//     const canvasRadio = document.createElement('input');
//     canvasRadio.setAttribute('type', 'radio');
//     canvasRadio.setAttribute('value', 'canvas');
//     canvasRadio.setAttribute('name', 'svgcanvasswitcher');
//     if (!useSvg) {
//         canvasRadio.checked = true;
//     }
//     canvasMode.appendChild(canvasRadio);
//     canvasMode.appendChild(document.createTextNode(' canvas'));

//     // render svg radio
//     const svgMode = document.createElement('label');
//     switcher.appendChild(svgMode);
//     const svgRadio = document.createElement('input');
//     svgRadio.setAttribute('type', 'radio');
//     svgRadio.setAttribute('value', 'svg');
//     svgRadio.setAttribute('name', 'svgcanvasswitcher');
//     if (useSvg) {
//         svgRadio.checked = true;
//     }
//     svgMode.appendChild(svgRadio);
//     svgMode.appendChild(document.createTextNode(' svg'));

//     svgRadio.addEventListener('change', () => setSvgMode(true));
//     canvasRadio.addEventListener('change', () => setSvgMode(false));
// };
