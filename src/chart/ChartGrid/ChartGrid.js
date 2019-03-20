
import {createElement, appendChild, withTheme} from '../helpers';
import {CHANGE_SIZE, ANIMATE_VIEW_BOX} from '../constants';
import css from './ChartGrid.styl';

const GRID_LINE_COUNT = 6;
const GRID_MIN_HEIGHT = 50;

const getStep = (exactStep) => {
    const [fraction, digit] = Number(exactStep.toPrecision(2)).toExponential().split('e');

    const [intStr, partStr] = fraction.split('.');

    let int = Number(intStr);
    let part = partStr ? Number(partStr) : 0;

    if (int > 7 && part > 0) {
        int = 10;
        part = 0;
    } else if (int > 2) {
        if (part >= 5) {
            int++;
        }

        part = 0;
    } else if (part < 3) {
        part = 0;
    } else if (part > 7) {
        int++;
        part = 0;
    } else {
        part = 5;
    }

    return Number(`${int}.${part}e${digit}`);
};

const formatLines = (lines, step) => {
    const [, digit] = step.toExponential().split('e');

    let roundCount = Math.round((1 / Number(`1e${digit}`)) * 10);

    if (roundCount < 1) {
        roundCount = 1;
    }

    return lines.map(line => Math.round(line * roundCount) / roundCount);
};

const getGridLines = (minY, maxY, step, height) => {
    let item = Math.ceil(minY / step) * step;

    // на 22 пикселя меньше, чтобы линии не вылезали за границы
    maxY -= (maxY - minY) * (22 / height);

    const gridLines = [];

    while (item < maxY) {
        gridLines.push(item);

        item += step;
    }

    return formatLines(gridLines, step);
};

const renderGrid = (minY, maxY, gridLines) => {
    const grid = createElement(css.gridLines);

    const lineNodes = gridLines.map((line) => {
        const lineNode = createElement(css.gridLine);
        const lineText = createElement(css.lineText);

        const text = document.createTextNode(line);

        appendChild(lineText, text);
        appendChild(lineNode, lineText);
        appendChild(grid, lineNode);

        return lineNode;
    });

    return [grid, lineNodes];
};

const sameGridLines = (curr, next) => {
    if (curr.length !== next.length) {
        return false;
    }

    for (let i = 0; i < curr.length; i++) {
        if (curr[i] !== next[i]) {
            return false;
        }
    }

    return true;
};

const updateGridPosition = (gridLines, lineNodes, maxY, minY) => {
    const height = maxY - minY;

    for (let i = 0; i < gridLines.length; i++) {
        const position = Math.round((gridLines[i] - minY) / height * 1000) / 10;

        lineNodes[i].style.bottom = `${position}%`;
    }
};

const updateGridsPosition = (gridsCollection, maxY, minY) => {
    gridsCollection.forEach(
        ([gridLines, lineNodes]) => updateGridPosition(gridLines, lineNodes, maxY, minY),
    );
};

const removeGrid = (node, grid, gridsCollection) => {
    grid.style.opacity = '0';
    grid.willBeDeleted = true;

    setTimeout(() => {
        node.removeChild(grid);

        gridsCollection.delete(grid);
    }, 500);
};

const updateGrid = (node, store, currentGrid, currentGridLines, gridsCollection) => {
    const {minY, maxY} = store.viewBox.box;
    const {minY: currMinY, maxY: currMaxY} = store.viewBox.animationBox;
    const [, [, height]] = store.size;

    const exactStep = (maxY - minY) / Math.min(Math.floor(height / GRID_MIN_HEIGHT), GRID_LINE_COUNT);

    const step = getStep(exactStep);

    const gridLines = getGridLines(minY, maxY, step, height);

    if (currentGrid && sameGridLines(currentGridLines, gridLines)) {
        updateGridsPosition(gridsCollection, currMaxY, currMinY);

        return [currentGrid, currentGridLines];
    }

    const [grid, lineNodes] = renderGrid(minY, maxY, gridLines);

    if (currentGrid) {
        removeGrid(node, currentGrid, gridsCollection);
    }

    appendChild(node, grid);
    gridsCollection.set(grid, [gridLines, lineNodes]);

    updateGridsPosition(gridsCollection, currMaxY, currMinY);

    setTimeout(() => {
        if (!grid.willBeDeleted) {
            grid.style.opacity = '1';
        }
    }, 40);

    return [grid, gridLines];
};

const setSize = (node, width, height) => {
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;
};

const ChartGrid = (store) => {
    const node = createElement(css.grid);
    withTheme(store, node, css);
    const gridsCollection = new Map();
    let currentGrid = null;
    let currentGridLines = [];

    const refreshGrid = () => {
        [currentGrid, currentGridLines] = updateGrid(node, store, currentGrid, currentGridLines, gridsCollection);
    };

    store.on(CHANGE_SIZE, ([, [width, height]]) => {
        setSize(node, width, height);

        refreshGrid();
    });
    store.viewBox.on(ANIMATE_VIEW_BOX, refreshGrid);

    return {node};
};

export default ChartGrid;