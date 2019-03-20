
export default ({points, lineIds, startFromZero, scale: {start: scaleStart = 0, end: scaleEnd = 0}}) => {
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;

    const minX = (lastX - firstX) * scaleStart + firstX;
    const maxX = (lastX - firstX) * (1 - scaleEnd) + firstX;

    let index = 0;

    // ищем точку, с которой строить график
    while (points[index].x < minX) {
        index++;
    }

    const startIndex = index;

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

    while (index < points.length && points[index].x <= maxX) {
        const {lines} = points[index];

        lineIds.forEach(checkMinMax(lines));

        index++;
    }

    const endIndex = index - 1;

    if (minY === maxY) {
        maxY += 1;
    }

    return {startIndex, endIndex, minY, maxY};
};
