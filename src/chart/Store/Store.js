
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
    CHANGE_VISIBILITY,
} from '../constants';
import {getRgbaColors} from '../helpers';
import nextFrame from '../nextFrame';
import ViewBox from './ViewBox';
import getViewBox from './getViewBox';

const themes = {
    light: 'light',
    dark: 'dark',
};

let storeFramePrefix = 1;

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
        // [
        //     width - (PADDING * 2),
        //     CHART_LIST_HEIGHT,
        // ],
    ]);
};

class Store extends EventEmitter {
    constructor(
        {points, lineIds, names, colors, yScaled},
        {
            startFromZero = false,
            theme = themes.light,
            chartHeight = 500,
        } = {},
    ) {
        super();

        this.nextFramePrefix = `${storeFramePrefix++}`;
        const scale = [0, 0];
        this.points = points;
        this.lineIds = lineIds;
        this.allLineIds = lineIds;
        this.lineNames = names;
        this.lineColors = colors;
        this.isVisible = false;
        this.chartHeight = chartHeight;
        this.yScaled = yScaled;

        this.rgbaColors = Object.entries(colors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: getRgbaColors(value)}),
            {},
        );
        this.rgbaColorsWebgl = Object.entries(this.rgbaColors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: value.split(',').map(val => Number(val) / 255)}),
            {},
        );
        this.startFromZero = startFromZero;
        this.themes = themes;
        this.theme = themes[theme] || themes.light;

        this.size = getSize(300, chartHeight);

        this.scale = scale;

        this.viewBox = new ViewBox(this, scale, lineIds, true);
        this.fullViewBox = new ViewBox(this, scale, lineIds);
        this.staticViewBox = getViewBox(this, scale, this.allLineIds);

        this.getColor = (lineId, opacity) => this._getColor(lineId, opacity);
    }

    _getColor(lineId, opacity = 1) {
        return `rgba(${this.rgbaColors[lineId]},${opacity})`;
    }

    changeVisibility(isVisible) {
        if (this.isVisible === isVisible) {
            return;
        }

        this.isVisible = isVisible;

        this.trigger(CHANGE_VISIBILITY, isVisible);
    }

    setTheme(newTheme) {
        const oldTheme = this.theme;

        this.theme = themes[newTheme] || themes.light;

        if (oldTheme === this.theme) {
            return;
        }

        nextFrame(() => this.trigger(CHANGE_THEME, this.theme));
    }

    changeSize(width) {
        this.size = getSize(width, this.chartHeight);

        nextFrame(() => this.trigger(CHANGE_SIZE, this.size));
    }

    changeScale(start, end) {
        this.scale = [start, end];

        this.viewBox.update(this.scale);

        nextFrame(() => this.trigger(CHANGE_SCALE, this.scale));
    }

    changeStartFromZeroMode(val) {
        if (this.startFromZero === val) {
            return;
        }

        this.startFromZero = val;

        this.viewBox.update(this.scale);
        this.fullViewBox.update([0, 0]);
    }

    toggleLine(lineId) {
        const indexOfLine = this.lineIds.indexOf(lineId);
        this.lineIds = this.lineIds.slice();

        if (indexOfLine === -1) {
            this.lineIds.push(lineId);
            this.trigger(LINE_ON, lineId);
        } else {
            if (this.lineIds.length < 2) {
                return;
            }
            this.lineIds.splice(indexOfLine, 1);
            this.trigger(LINE_OFF, lineId);
        }

        this.viewBox.update(this.scale);
        this.fullViewBox.update([0, 0]);
    }
}

export default Store;
