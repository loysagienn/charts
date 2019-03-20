
import css from './Svg.styl';
import getPolylinePoints from './getPolylinePoints';

const createSvgNode = name => document.createElementNS('http://www.w3.org/2000/svg', name);

const createPolylines = (lineIds, colors, root) => lineIds.reduce((acc, id) => {
    const polyline = createSvgNode('polyline');
    root.appendChild(polyline);
    polyline.style.stroke = colors[id];

    return Object.assign(acc, {[id]: polyline});
}, {});

class Svg {
    constructor(points, lineIds, colors, className) {
        this._lineIds = lineIds;
        this._lineColors = colors;
        this._svg = createSvgNode('svg');
        this._svg.classList.add(className);
        this._svg.classList.add(css.svg);

        this._polyline = createSvgNode('polyline');
        this._polylines = createPolylines(lineIds, colors, this._svg);
        this._svg.appendChild(this._polyline);
    }

    render(points, viewBox, width, height) {
        this._svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        this._svg.style.width = `${width}px`;
        this._svg.style.height = `${height}px`;

        this._lineIds.forEach((id) => {
            const polylinePoints = getPolylinePoints(points, id, viewBox, width, height);

            this._polylines[id].setAttribute('points', polylinePoints);
        });
    }

    get node() {
        return this._svg;
    }
}

export default Svg;
