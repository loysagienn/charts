
export default (points, lineId, {startIndex, endIndex, minY, maxY}, width, height) => {
    const {x: minX} = points[startIndex];
    const {x: maxX} = points[endIndex];

    // если чисто горизонтальная линия
    const originalWidth = maxX === minX ? 1 : maxX - minX;
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = width / originalWidth;
    const factorY = height / originalHeight;

    const polylinePoints = [];

    for (let i = startIndex; i <= endIndex; i++) {
        const {x, lines} = points[i];
        const y = lines[lineId];
        const positionX = (x - minX) * factorX;
        const positionY = height - ((y - minY) * factorY);

        polylinePoints.push(`${positionX},${positionY}`);
    }

    return polylinePoints.join(' ');
};
