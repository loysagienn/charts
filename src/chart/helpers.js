import {CHANGE_THEME, TIMEZONE_OFFSET} from './constants';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const createElement = (className, tag = 'div') => {
    const element = document.createElement(tag);

    if (className) {
        element.classList.add(className);
    }

    return element;
};

export const appendChild = (parent, child) => parent.appendChild(child);

export const addEvent = (elem, event, listener, options) => elem.addEventListener(event, listener, options);

export const removeEvent = (elem, event, listener, options) => elem.removeEventListener(event, listener, options);

export const withTheme = (store, node, css) => {
    let currentTheme = store.theme;
    let currentThemeClassName = css[`theme_${currentTheme}`];

    const add = className => (className && node.classList.add(className));

    add(currentThemeClassName);

    store.on(CHANGE_THEME, (theme) => {
        if (currentThemeClassName) {
            node.classList.remove(currentThemeClassName);
        }

        currentTheme = theme;
        currentThemeClassName = css[`theme_${currentTheme}`];

        add(currentThemeClassName);
    });
};

export const getRgbaColors = (hex) => {
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    c = `0x${c.join('')}`;

    // eslint-disable-next-line no-bitwise
    return [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',');
};

export const prepareChartData = ({columns, types, names, colors, y_scaled: yScaled}) => {
    const [xPoints, ...yLines] = columns;

    const lineIds = yLines.map(([id]) => id);

    const points = [];

    for (let i = 1; i < xPoints.length; i++) {
        points.push({
            x: xPoints[i],
            lines: yLines.reduce((acc, line, index) => Object.assign(acc, {[lineIds[index]]: line[i]}), {}),
        });
    }

    return {points, colors, names, lineIds, types, yScaled};
};


const formatTimeComponent = num => (num > 9 ? String(num) : `0${num}`);

export const getTimeString = (date) => {
    const hours = formatTimeComponent(date.getHours());
    const minutes = formatTimeComponent(date.getMinutes());

    return `${hours}:${minutes}`;
};

export const getWeekDayString = (date, full) => (full ? WEEKDAYS_FULL : WEEKDAYS)[date.getDay()];

export const getDateString = date => `${MONTHS[date.getMonth()]} ${date.getDate()}`;

export const getMonth = (date, full) => (full ? MONTHS_FULL : MONTHS)[date.getMonth()];

export const getMonthDay = date => date.getDate();

export const getYear = date => date.getFullYear();

export const getDate = timestamp => new Date(timestamp + TIMEZONE_OFFSET);
