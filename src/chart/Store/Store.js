
import EventEmitter from '../EventEmitter';
import {
    CHART_SCALER_HEIGHT,
    PADDING,
    VIEW_SCALER_SPACE,
    CHANGE_SIZE,
    CHANGE_SCALE,
    LINE_OFF,
    LINE_ON,
    CHANGE_THEME,
    SHOW_SUB_STORE,
    TIMEZONE_OFFSET,
    DRAG_STATE_TOGGLE,
} from '../constants';
import {getRgbaColors, prepareChartData} from '../helpers';
import nextFrame from '../nextFrame';
import ViewBox from './ViewBox';

const themes = {
    light: 'light',
    dark: 'dark',
};

let storeFramePrefix = 1;

const weekMiddleDayScale = (() => {
    const weekHours = 24 * 7;

    // данные до 23:00 последнего дня
    const weekScaleSize = weekHours - 1;

    const scaleStartHours = 24 * 3;

    const scaleEndHours = 24 * 3 - 1;

    return [scaleStartHours / weekScaleSize, scaleEndHours / weekScaleSize];
})();

const getDataUrl = (prefix, date) => {
    const year = date.getFullYear();
    let month = date.getMonth() + 1;

    if (month > 9) {
        month = String(month);
    } else {
        month = `0${month}`;
    }

    let day = date.getDate();

    if (day > 9) {
        day = String(day);
    } else {
        day = `0${day}`;
    }

    return `${prefix}/${year}-${month}/${day}.json`;
};

const getSize = (width, chartViewHeight) => {
    const height = chartViewHeight + VIEW_SCALER_SPACE + CHART_SCALER_HEIGHT;

    return ([
        // total size
        [width, height, 0],
        // chart view size
        [
            width,
            chartViewHeight,
        ],
        // scaler size
        [
            width - (PADDING * 2),
            CHART_SCALER_HEIGHT,
            chartViewHeight + VIEW_SCALER_SPACE,
        ],
    ]);
};

class Store extends EventEmitter {
    constructor(
        {points, lineIds: allLineIds, names, colors, yScaled},
        {
            startFromZero = false,
            theme = themes.light,
            chartHeight = 500,
            isBar = false,
            isArea = false,
            isPie = false,
            name,
            dataLink = null,
            defaultYScale = null,
            secondaryDefaultYScale = null,
            weekDetailed = false,
            dayDetailed = false,
            defaultScale = [0, 0],
            visibleLineIds = null,
            transformToLineChart = false,
        } = {},
    ) {
        super();

        if (isBar || isArea || isPie) {
            startFromZero = true;
        }

        const lineIds = visibleLineIds || allLineIds;

        this.nextFramePrefix = `${storeFramePrefix++}`;
        this.points = points;
        this.lineIds = lineIds;
        this.allLineIds = allLineIds;
        this.lineNames = names;
        this.lineColors = colors;
        this.isVisible = false;
        this.chartHeight = chartHeight;
        this.yScaled = yScaled;
        this.isBar = isBar;
        this.isArea = isArea;
        this.isPie = isPie;
        this.isLine = !isBar && !isArea && !isPie;
        this.startFromZero = startFromZero;
        this.themes = themes;
        this.theme = themes[theme] || themes.light;
        this.name = name;
        this.dataLink = dataLink;
        this.weekDetailed = weekDetailed;
        this.dayDetailed = dayDetailed;
        this.transformToLineChart = transformToLineChart;
        this.canShowPoint = Boolean(dataLink);
        this.dragging = false;
        this.rgbaColors = Object.entries(colors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: getRgbaColors(value)}),
            {},
        );
        this.rgbaColorsWebgl = Object.entries(this.rgbaColors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: value.split(',').map(val => Number(val) / 255)}),
            {},
        );

        this.size = getSize(300, chartHeight);

        this.scale = defaultScale;
        const fullScale = [0, 0];

        const mainLineIds = yScaled ? [allLineIds[0]] : lineIds;
        this.viewBox = new ViewBox(
            this, defaultScale, mainLineIds, {calcGridStep: true, defaultYScale},
        );
        this.fullViewBox = new ViewBox(this, fullScale, mainLineIds);

        if (yScaled) {
            const secondaryLineIds = [allLineIds[1]];
            this.secondaryViewBox = new ViewBox(this, defaultScale, secondaryLineIds, {
                calcGridStep: true,
                mainViewBox: this.viewBox,
                defaultYScale: secondaryDefaultYScale,
            });
            this.secondaryFullViewBox = new ViewBox(this, fullScale, secondaryLineIds, {
                calcGridStep: false,
                mainViewBox: this.fullViewBox,
            });
        }

        if (defaultYScale) {
            this.updateViewBox();
        }

        this.getColor = (lineId, opacity) => this._getColor(lineId, opacity);
    }

    _getColor(lineId, opacity = 1) {
        return `rgba(${this.rgbaColors[lineId]},${opacity})`;
    }

    setTheme(newTheme) {
        const oldTheme = this.theme;

        this.theme = themes[newTheme] || themes.light;

        if (oldTheme === this.theme) {
            return;
        }

        nextFrame(() => this.trigger(CHANGE_THEME, this.theme));
    }

    // высота пока никак не используется, рассчитывается по контенту
    // eslint-disable-next-line no-unused-vars
    changeSize(width, height) {
        this.size = getSize(width, this.chartHeight);

        if (this.subStore) {
            this.subStore.changeSize(width, height);
        }

        nextFrame(() => this.trigger(CHANGE_SIZE, this.size));
    }

    updateViewBox(withFullViewBox) {
        const {lineIds, allLineIds} = this;

        const mainLineIds = this.yScaled ? [allLineIds[0]] : lineIds;

        this.viewBox.update(this.scale, mainLineIds, this.isPie);

        if (withFullViewBox) {
            this.fullViewBox.update([0, 0], mainLineIds);
        }

        if (this.yScaled) {
            const secondaryLineIds = [allLineIds[1]];

            this.secondaryViewBox.update(this.scale, secondaryLineIds);

            if (withFullViewBox) {
                this.secondaryFullViewBox.update([0, 0], secondaryLineIds);
            }
        }
    }

    dragStart() {
        if (this.dragging) {
            return;
        }
        this.dragging = true;

        nextFrame(() => this.trigger(DRAG_STATE_TOGGLE, this.dragging));
    }

    dragEnd() {
        if (!this.dragging) {
            return;
        }
        this.dragging = false;

        nextFrame(() => this.trigger(DRAG_STATE_TOGGLE, this.dragging));
    }

    changeScale(start, end) {
        if (this.subStore) {
            this.subStore.changeScale(start, end);
        } else {
            this.scale = [start, end];

            this.updateViewBox();

            nextFrame(() => this.trigger(CHANGE_SCALE, this.scale));
        }
    }

    toggleLine(lineId) {
        const {lineIds, allLineIds} = this;
        const action = lineIds.includes(lineId) ? LINE_OFF : LINE_ON;

        const newLineIds = [];

        for (let i = 0; i < allLineIds.length; i++) {
            if (allLineIds[i] === lineId) {
                if (action === LINE_ON) {
                    newLineIds.push(lineId);
                }

                continue;
            }

            if (lineIds.includes(allLineIds[i])) {
                newLineIds.push(allLineIds[i]);
            }
        }

        this.lineIds = newLineIds;

        if (this.subStore) {
            this.subStore.toggleLine(lineId);
        } else {
            this.updateViewBox(true);
        }

        nextFrame(() => this.trigger(action, lineId));
    }

    showLine(lineId) {
        const {lineIds, allLineIds} = this;

        allLineIds.forEach((id) => {
            if (id === lineId && !lineIds.includes(id)) {
                this.toggleLine(id);
            }

            if (id !== lineId && lineIds.includes(id)) {
                this.toggleLine(id);
            }
        });
    }

    showFull() {
        this.subStore.clearEventListeners();
        const {maxY, minY} = this.subStore.viewBox.animationBox;

        this.viewBox.animationBox = Object.assign(this.viewBox.animationBox, {maxY, minY});

        if (this.yScaled && this.subStore.yScaled) {
            const {maxY: secMaxY, minY: secMinY} = this.subStore.secondaryViewBox.animationBox;
            this.secondaryViewBox.animationBox = Object.assign(
                this.secondaryViewBox.animationBox,
                {maxY: secMaxY, minY: secMinY},
            );
        }

        this.subStore = null;

        this.updateViewBox(true);

        this.trigger(SHOW_SUB_STORE, this.subStore);
    }

    _showPoint(point, data) {
        const {size: [[width]], chartHeight, transformToLineChart} = this;
        const {maxY, minY} = this.viewBox.box;
        console.log(data);

        this.subStore = new Store(data, {
            chartHeight,
            defaultYScale: {maxY, minY},
            secondaryDefaultYScale: this.yScaled
                ? {maxY: this.secondaryViewBox.box.maxY, minY: this.secondaryViewBox.box.minY}
                : null,
            weekDetailed: !transformToLineChart,
            dayDetailed: transformToLineChart,
            defaultScale: transformToLineChart ? [0, 0] : weekMiddleDayScale,
            isBar: transformToLineChart ? false : this.isBar,
            isPie: this.isArea,
            isArea: false,
            visibleLineIds: transformToLineChart ? null : this.lineIds,
            transformToLineChart,
        });

        this.subStore.changeSize(width, chartHeight);

        nextFrame(() => this.trigger(SHOW_SUB_STORE, this.subStore));
    }

    showPoint(index) {
        if (this.subStore) {
            return;
        }

        if (this.isArea) {
            const {points, lineColors, lineNames, allLineIds} = this;
            const point = points[index];
            const startPoint = Math.max(index - 3, 0);
            const endPoint = Math.min(index + 4, points.length);

            const scalePoints = points.slice(startPoint, endPoint);

            this._showPoint(point, {
                points: scalePoints,
                colors: lineColors,
                lineIds: allLineIds,
                names: lineNames,
            });
        }
        if (!this.canShowPoint) {
            return;
        }

        const {points, dataLink} = this;
        const point = points[index];
        const date = new Date(point.x + TIMEZONE_OFFSET);

        const dataUrl = getDataUrl(dataLink, date);

        fetch(dataUrl)
            .then((result) => {
                if (result.ok) {
                    return result.json();
                }

                return Promise.reject(result.text());
            })
            .then(data => this._showPoint(point, prepareChartData(data)))
            .catch(error => console.error(`Point data load failed, url: ${dataUrl}`, error));
    }
}

export default Store;
