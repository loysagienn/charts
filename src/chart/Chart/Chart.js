
import css from './Chart.styl';
import createChartView from '../ChartView';
import createChartScaler from '../ChartScaler';
import crateChartsList from '../ChartsList';
import createThemeSwitcher from '../ThemeSwitcher';
import createHeader from '../Header';
import {CHANGE_SIZE, DRAG_STATE_TOGGLE} from '../constants';
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

const onDragToggle = (store, node) => {
    if (store.dragging) {
        node.classList.add(css.noTouchActions);
    } else {
        node.classList.remove(css.noTouchActions);
    }
};

const Chart = (store) => {
    const node = createElement(css.chart);
    withTheme(store, node, css);

    const header = createHeader(store);

    const viewScaler = createElement(css.viewScaler);

    const chartView = createChartView(store);
    const chartScaler = createChartScaler(store);
    const themeSwitcher = createThemeSwitcher(store);

    appendChild(viewScaler, chartView.image);
    appendChild(viewScaler, chartView.node);
    appendChild(viewScaler, chartScaler.node);

    appendChild(node, header.node);
    appendChild(node, viewScaler);

    const chartsList = crateChartsList(store);

    appendChild(node, chartsList.node);

    appendChild(node, themeSwitcher.node);

    store.on(CHANGE_SIZE, ([[width, height]]) => setSize(viewScaler, width, height));
    store.on(DRAG_STATE_TOGGLE, () => onDragToggle(store, node));


    return {node};
};

export default Chart;
