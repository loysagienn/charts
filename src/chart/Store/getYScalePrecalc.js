
export default (store) => {
    if (!store.isLine) {
        return {};
    }

    const {points, allLineIds} = store;
    const step = 20;
    const pointsCount = points.length;
    const collection = {};

    for (let i = 0; i < pointsCount - step; i += step) {
        const pointCollection = {};
        collection[i] = pointCollection;

        const firstPoint = points[i];

        for (let j = 0; j < allLineIds.length; j++) {
            const lineId = allLineIds[j];
            const firstPointY = firstPoint.lines[lineId];
            let minY = firstPointY;
            let maxY = firstPointY;

            for (let k = i + 1; k < i + step; k++) {
                const pointY = points[k].lines[lineId];
                if (pointY > maxY) {
                    maxY = pointY;
                }
                if (pointY < minY) {
                    minY = pointY;
                }
            }

            pointCollection[lineId] = {minY, maxY};
        }
    }

    return collection;
};
