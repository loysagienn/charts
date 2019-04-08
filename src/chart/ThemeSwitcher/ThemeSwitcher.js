
import {createElement, appendChild, addEvent, withTheme} from '../helpers';
import {CHANGE_THEME} from '../constants';
import css from './ThemeSwitcher.styl';


const renderText = (store, textNode) => {
    const {theme, themes} = store;

    textNode.textContent = theme === themes.light ? 'Switch to Night Mode' : 'Switch to Day Mode';
};

const changeTheme = (store) => {
    const {theme, themes} = store;

    const newTheme = theme === themes.light ? themes.dark : themes.light;

    store.setTheme(newTheme);
};

const ThemeSwitcher = (store) => {
    const node = createElement(css.themeSwitcher);

    const switcher = createElement(css.switcher);
    const textNode = document.createTextNode('');

    renderText(store, textNode);

    appendChild(switcher, textNode);
    appendChild(node, switcher);

    switcher.addEventListener('click', () => changeTheme(store));

    store.on(CHANGE_THEME, () => renderText(store, textNode));

    return {node};
};

export default ThemeSwitcher;
