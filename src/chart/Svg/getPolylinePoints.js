
export default (points, lineIds, viewBox, width, height, padding) => {
    const {minY, maxY, scaleStartPoint, scaleEndPoint} = viewBox;

    // чтобы нижняя точка графика не обрезалась
    height -= 1;

    const minIndex = 0;
    const maxIndex = points.length - 1;

    const indexWidth = scaleEndPoint - scaleStartPoint;
    // если чисто горизонтальная линия
    const originalHeight = maxY === minY ? 1 : maxY - minY;

    const factorX = (width - (padding * 2)) / indexWidth;
    const factorY = height / originalHeight;

    const paddingIndex = padding / factorX;
    const lineStartIndex = Math.max(Math.floor(scaleStartPoint - paddingIndex), minIndex);
    const lineEndIndex = Math.min(Math.ceil(scaleEndPoint + paddingIndex), maxIndex);

    const polylinePoints = lineIds.reduce((acc, id) => Object.assign(acc, {[id]: []}), {});

    for (let i = lineStartIndex; i <= lineEndIndex; i++) {
        const {lines} = points[i];

        const positionX = (i - scaleStartPoint) * factorX + padding;

        for (let j = 0; j < lineIds.length; j++) {
            const lineId = lineIds[j];

            const y = lines[lineId];

            const positionY = height - ((y - minY) * factorY);

            polylinePoints[lineId] += `${positionX},${positionY} `;
        }
    }

    return polylinePoints;
};
