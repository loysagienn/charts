
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

    const roundCount = (1 / Number(`1e${digit}`)) * 10;

    return lines.map(line => Math.round(line * roundCount) / roundCount);
};

const getGridLines = (minY, maxY, step) => {
    let item = Math.ceil(minY / step) * step;

    const gridLines = [];

    while (item < maxY) {
        gridLines.push(item);

        item += step;
    }

    return formatLines(gridLines, step);
};

const renderGrid = (minY, maxY, gridLines) => {
    const grid = document.createElement('div');
    grid.classList.add(css.gridLines);

    const lineNodes = gridLines.map((line) => {
        const lineNode = document.createElement('div');
        lineNode.classList.add(css.gridLine);

        const text = document.createTextNode(line);

        lineNode.appendChild(text);

        grid.appendChild(lineNode);

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

class ChartGrid {
    constructor(store) {
        this._store = store;
        this._currentGrid = null;
        this._currentGridLines = [];
        this._gridsCollection = new Map();

        this._node = document.createElement('div');
        this._node.classList.add(css.grid);

        store.on(store.CHANGE_SIZE, ({chartView}) => this._setSize(chartView));
        store.on(store.ANIMATE_VIEW_BOX, scale => this._renderGrid(scale));

        // this._renderGrid();
    }

    _updateGridsPositions(maxY, minY) {
        this._gridsCollection.forEach(
            ([gridLines, lineNodes]) => updateGridPosition(gridLines, lineNodes, maxY, minY),
        );
    }

    _removeGrid(grid) {
        grid.style.opacity = '0';

        // setTimeout(() => {
        this._node.removeChild(grid);

        this._gridsCollection.delete(grid);
        // }, 400);
    }

    _renderGrid() {
        const {minY, maxY} = this._store.viewBox;
        const {minY: currMinY, maxY: currMaxY} = this._store.currentViewBox;
        const {chartView: {height}} = this._store.size;

        const exactStep = (maxY - minY) / Math.min(Math.floor(height / GRID_MIN_HEIGHT), GRID_LINE_COUNT);

        const step = getStep(exactStep);

        const gridLines = getGridLines(minY, maxY, step);

        if (this._currentGrid && sameGridLines(this._currentGridLines, gridLines)) {
            this._updateGridsPositions(currMaxY, currMinY);

            return;
        }

        const [grid, lineNodes] = renderGrid(minY, maxY, gridLines);

        if (this._currentGrid) {
            this._removeGrid(this._currentGrid);
        }

        this._currentGrid = grid;
        this._currentGridLines = gridLines;
        this._gridsCollection.set(grid, [gridLines, lineNodes]);

        this._node.appendChild(grid);

        this._updateGridsPositions(currMaxY, currMinY);

        setTimeout(() => grid.style.opacity = '1', 40);
    }

    _setSize({width, height}) {
        this._node.style.width = `${width}px`;
        this._node.style.height = `${height}px`;

        this._renderGrid();
    }

    get node() {
        return this._node;
    }
}

export default ChartGrid;
