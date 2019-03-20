
export default ({points, lineIds, startFromZero}, [scaleStart = 0, scaleEnd = 0] = []) => {
    const firstIndex = 0;
    const lastIndex = points.length - 1;

    const startIndexPart = (lastIndex - firstIndex) * scaleStart + firstIndex;
    const endIndexPart = (lastIndex - firstIndex) * (1 - scaleEnd) + firstIndex;

    const startIndex = Math.ceil(startIndexPart);
    const endIndex = Math.floor(endIndexPart);

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

    console.log(minY, maxY);

    return {startIndex, endIndex, startIndexPart, endIndexPart, minY, maxY};
};
