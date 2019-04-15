import {PADDING} from '../constants';

const GRID_LINE_COUNT = 6;
const GRID_MIN_HEIGHT = 50;

const precalcStep = 20;

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

// const getSubstep = (step) => {
//     const [fraction] = step.toExponential().split('e');

//     return step / (Number(fraction) * 10);
// };

const getSubstep = (step) => {
    const [fraction] = step.toExponential().split('e');

    const numFraction = Number(fraction);

    let parts = numFraction;

    if (numFraction < 3) {
        parts = numFraction * 2;
    }

    return step / parts;
};

// const roundYScaledStep = exactStep => Number(exactStep.toPrecision(2));

const getGridStep = (minY, maxY, store) => {
    const [, [, height]] = store.size;

    const exactStep = (maxY - minY) / Math.min(Math.floor(height / GRID_MIN_HEIGHT), GRID_LINE_COUNT);

    // return store.yScaled ? roundYScaledStep(exactStep) : roundStep(exactStep);
    return roundStep(exactStep);
};

const getAreaViewBox = (scaleStartPoint, scaleEndPoint) => ({
    scaleStartPoint,
    scaleEndPoint,
    minY: 0,
    maxY: 100,
    gridStep: 20,
});

export default (store, yScalePrecalc, [scaleStart = 0, scaleEnd = 0] = [], lineIds, calcGridStep, mainViewBox, keepYScale) => {
    const {points, startFromZero, isBar, isPie} = store;
    const [, [width]] = store.size;

    const firstIndex = 0;
    const lastIndex = points.length - 1;

    const scaleStartPoint = (lastIndex - firstIndex) * scaleStart + firstIndex;
    const scaleEndPoint = (lastIndex - firstIndex) * (1 - scaleEnd) + firstIndex;

    const paddingSize = (scaleEndPoint - scaleStartPoint) * PADDING / (width - (PADDING * 2));

    const startIndex = Math.max(Math.ceil(scaleStartPoint - paddingSize), 0);
    const endIndex = Math.min(Math.floor(scaleEndPoint + paddingSize), lastIndex);

    if (store.isArea || keepYScale) {
        return getAreaViewBox(scaleStartPoint, scaleEndPoint);
    }

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

    let index = startIndex;

    while (index <= endIndex) {
        const {lines} = points[index];

        // для столбцов просто складываем все значения
        if (isBar || isPie) {
            let y = 0;
            lineIds.forEach(lineId => y += lines[lineId]);

            if (y > maxY) {
                maxY = y;
            }
        } else {
            if (index + precalcStep < endIndex) {
                const precalc = yScalePrecalc[index];

                if (precalc) {
                    // eslint-disable-next-line no-loop-func
                    for (let i = 0; i < lineIds.length; i++) {
                        const lineId = lineIds[i];
                        const {minY: precalcMinY, maxY: precalcMaxY} = precalc[lineId];

                        if (precalcMinY < minY) {
                            minY = precalcMinY;
                        }

                        if (precalcMaxY > maxY) {
                            maxY = precalcMaxY;
                        }
                    }

                    index += precalcStep;

                    continue;
                }
            }

            lineIds.forEach(checkMinMax(lines));
        }

        index++;
    }

    // for (let i = startIndex; i <= endIndex; i++) {
    //     const {lines} = points[i];

    //     // для столбцов просто складываем все значения
    //     if (isBar) {
    //         let y = 0;
    //         lineIds.forEach(lineId => y += lines[lineId]);

    //         if (y > maxY) {
    //             maxY = y;
    //         }
    //     } else {
    //         lineIds.forEach(checkMinMax(lines));
    //     }
    // }

    // увеличиваем maxY на 10%
    maxY += Math.round((maxY - minY) / 10);

    if (minY === maxY) {
        maxY += 1;
    }

    let gridStep = maxY - minY;

    const minYSaved = minY;

    if (calcGridStep) {
        gridStep = getGridStep(minY, maxY, store);

        // minY = Math.floor(minY / gridStep) * gridStep;

        if (store.yScaled) {
            // const goodMinY -= Math.round((maxY - minY) / 50);
            if (mainViewBox) {
                // выравниваем нижний отступ второстепенного графика относительно основного
                const {minYShift: mainYShift, minY: mainMinY, maxY: mainMaxY} = mainViewBox.box;

                minY -= Math.round((maxY - minY) * mainYShift / (mainMaxY - mainMinY));

                if (minY < 0) {
                    minY = 0;
                }
            } else {
                let nextMinY = Math.floor(minY / gridStep) * gridStep + gridStep;

                const substep = getSubstep(gridStep);

                while (nextMinY > minY) {
                    nextMinY -= substep;
                }

                minY = nextMinY;
            }
        } else if (!startFromZero) {
            minY = Math.floor(minY / gridStep) * gridStep;
        }
    }

    const minYShift = minYSaved - minY;

    return {scaleStartPoint, scaleEndPoint, minY, maxY, gridStep, minYShift};
};
