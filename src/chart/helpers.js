import {CHANGE_THEME} from './constants';

export const createElement = (className, tag = 'div') => {
    const element = document.createElement(tag);

    if (className) {
        element.classList.add(className);
    }

    return element;
};

export const appendChild = (parent, child) => parent.appendChild(child);

export const addEvent = (elem, event, listener) => elem.addEventListener(event, listener);

export const removeEvent = (elem, event, listener) => elem.removeEventListener(event, listener);

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
