
export default (store, [scaleStart = 0, scaleEnd = 0] = [], lineIds) => {
    const {points, startFromZero} = store;
    lineIds = lineIds || store.lineIds;

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

    maxY += (maxY - minY) / 20;

    if (minY === maxY) {
        maxY += 1;
    }

    return {startIndex, endIndex, scaleStartPoint, scaleEndPoint, minY, maxY};
};
