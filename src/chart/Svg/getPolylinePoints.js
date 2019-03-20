
export default (points, lineId, {startIndex, endIndex, minY, maxY, startIndexPart, endIndexPart}, width, height, padding) => {
    // чтобы нижняя точка графика не обрезалась
    height -= 1;

    // если чисто горизонтальная линия
    const indexWidth = endIndexPart - startIndexPart;
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = (width - (padding * 2)) / indexWidth;
    const factorY = height / originalHeight;

    const polylinePoints = [];

    const getCoords = (index) => {
        const {lines} = points[index];
        const y = lines[lineId];
        const positionX = (index - startIndexPart) * factorX + padding;
        const positionY = height - ((y - minY) * factorY);

        return [positionX, positionY];
    };

    for (let i = startIndex - 1; i >= 0; i--) {
        const [positionX, positionY] = getCoords(i);

        polylinePoints.unshift(`${positionX},${positionY}`);

        if (positionX < 0) {
            break;
        }
    }

    for (let i = startIndex; i <= endIndex; i++) {
        const [positionX, positionY] = getCoords(i);

        polylinePoints.push(`${positionX},${positionY}`);
    }

    for (let i = endIndex + 1; i < points.length; i++) {
        const [positionX, positionY] = getCoords(i);

        polylinePoints.push(`${positionX},${positionY}`);

        if (positionX > width) {
            break;
        }
    }

    return polylinePoints.join(' ');
};
