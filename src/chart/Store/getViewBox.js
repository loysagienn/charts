
const GRID_LINE_COUNT = 6;
const GRID_MIN_HEIGHT = 50;

const roundStep = (exactStep) => {
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

const getGridStep = (minY, maxY, store) => {
    const [, [, height]] = store.size;

    const exactStep = (maxY - minY) / Math.min(Math.floor(height / GRID_MIN_HEIGHT), GRID_LINE_COUNT);

    return roundStep(exactStep);
};

export default (store, [scaleStart = 0, scaleEnd = 0] = [], lineIds, calcGridStep) => {
    const {points, startFromZero} = store;

    const firstIndex = 0;
    const lastIndex = points.length - 1;

    const scaleStartPoint = (lastIndex - firstIndex) * scaleStart + firstIndex;
    const scaleEndPoint = (lastIndex - firstIndex) * (1 - scaleEnd) + firstIndex;

    const startIndex = Math.ceil(scaleStartPoint);
    const endIndex = Math.floor(scaleEndPoint);

    let minY = startFromZero ? 0 : points[startIndex].lines[lineIds[0]];
    let maxY = minY;

    const checkMinMax = lines => (id) => {
        const y = lines[id];

        if (y < minY) {
            minY = y;
        }

        if (y > maxY) {
            maxY = y;
        }
    };

    for (let i = startIndex; i <= endIndex; i++) {
        const {lines} = points[i];

        lineIds.forEach(checkMinMax(lines));
    }

    // увеличиваем maxY на 10%
    maxY += (maxY - minY) / 10;

    if (minY === maxY) {
        maxY += 1;
    }

    let gridStep = maxY - minY;

    if (calcGridStep) {
        gridStep = getGridStep(minY, maxY, store);

        minY = Math.floor(minY / gridStep) * gridStep;
    }

    return {startIndex, endIndex, scaleStartPoint, scaleEndPoint, minY, maxY, gridStep};
};
