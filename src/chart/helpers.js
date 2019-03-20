import {CHANGE_THEME} from './constants';

export const createElement = (className) => {
    const element = document.createElement('div');

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
