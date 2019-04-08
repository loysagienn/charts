
import css from './Chart.styl';
import createChartView from '../ChartView';
import createChartScaler from '../ChartScaler';
import crateChartsList from '../ChartsList';
import createThemeSwitcher from '../ThemeSwitcher';
import {CHANGE_SIZE} from '../constants';
import {createElement, appendChild, withTheme} from '../helpers';

const setSize = (viewScaler, width, height) => {
    viewScaler.style.width = `${width}px`;
    viewScaler.style.height = `${height}px`;
};

const throttle = (func, timeout) => {
    let isThrottled = false;
    let needCall = false;

    const wrapper = () => {
        if (isThrottled) {
            needCall = true;

            return;
        }

        func();

        isThrottled = true;

        // const date = Date.now();
        setTimeout(() => {
            // console.log(`date ${Date.now() - date}`);
            isThrottled = false;
            if (needCall) {
                wrapper();
                needCall = false;
            }
        }, timeout);
    };

    return wrapper;
};


const checkVisibility = (store, node) => {
    const scrollHandler = () => {
        const {top, bottom} = node.getBoundingClientRect();
        const {innerHeight: height} = window;
        // console.log(`${top}  ${bottom}  ${height}`);

        const isInvisible = top > height || bottom < 0;

        // console.log(!isInvisible);
        store.changeVisibility(!isInvisible);
    };

    const onScroll = throttle(scrollHandler, 100);

    window.addEventListener('scroll', onScroll, {
        capture: true,
        passive: true,
    });

    store.on(CHANGE_SIZE, () => scrollHandler());
};

const Chart = (store) => {
    const node = createElement(css.chart);
    withTheme(store, node, css);

    const viewScaler = createElement(css.viewScaler);
    appendChild(node, viewScaler);

    const chartView = createChartView(store);
    const chartScaler = createChartScaler(store);
    const chartsList = crateChartsList(store);
    const themeSwitcher = createThemeSwitcher(store);

    appendChild(viewScaler, chartView.node);
    appendChild(viewScaler, chartScaler.node);
    appendChild(node, chartsList.node);
    appendChild(node, themeSwitcher.node);

    store.on(CHANGE_SIZE, ([[width, height]]) => setSize(viewScaler, width, height));

    // checkVisibility(store, node);

    return {node};
};

export default Chart;
