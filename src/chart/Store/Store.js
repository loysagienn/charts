
import EventEmitter from '../EventEmitter';
import {
    CHART_SCALER_HEIGHT,
    PADDING,
    CHART_LIST_HEIGHT,
    CHANGE_SIZE,
    CHANGE_SCALE,
    LINE_OFF,
    LINE_ON,
    CHANGE_THEME,
    CHANGE_ANIMATION_STATUS,
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

const getSize = (width, height) => {
    const viewScalerSpace = 40;
    const scalerListSpace = 20;
    const bottomPadding = 20;

    const chartViewHeight = height
        - CHART_SCALER_HEIGHT - CHART_LIST_HEIGHT - viewScalerSpace - scalerListSpace - bottomPadding;

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
            chartViewHeight + viewScalerSpace,
        ],
        [
            width - (PADDING * 2),
            CHART_LIST_HEIGHT,
        ],
    ]);
};

class Store extends EventEmitter {
    constructor(
        {points, lineIds, names, colors},
        {
            startFromZero = false,
            theme = themes.light,
            animationsDisabled = false,
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
        this.rgbaColors = Object.entries(colors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: getRgbaColors(value)}),
            {},
        );
        this.rgbaColorsWebgl = Object.entries(this.rgbaColors).reduce(
            (acc, [key, value]) => Object.assign(acc, {[key]: value.split(',').map(val => Number(val) / 255)}),
            {},
        );
        this.startFromZero = startFromZero;
        this.animationsDisabled = animationsDisabled;
        this.theme = themes[theme] || themes.light;

        this.size = getSize(300, 300);

        this.scale = scale;

        this.viewBox = new ViewBox(this, scale);
        this.fullViewBox = new ViewBox(this, scale);
        this.staticViewBox = getViewBox(this, scale, this.allLineIds);

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

    changeSize(width, height) {
        this.size = getSize(width, height);

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

    disableAnimations(animationsDisabled = false) {
        if (this.animationsDisabled === animationsDisabled) {
            return;
        }

        this.animationsDisabled = animationsDisabled;
        this.trigger(CHANGE_ANIMATION_STATUS, animationsDisabled);
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
