
import css from './Svg.styl';
import getPolylinePoints from './getPolylinePoints';
import {appendChild} from '../helpers';
import {LINE_ON, LINE_OFF} from '../constants';

const createSvgNode = name => document.createElementNS('http://www.w3.org/2000/svg', name);

const createPolylines = (lineIds, colors, root, lineWidth) => lineIds.reduce((acc, id) => {
    const polyline = createSvgNode('polyline');
    appendChild(root, polyline);
    polyline.style.stroke = colors[id];
    polyline.style.strokeWidth = `${lineWidth}px`;

    return Object.assign(acc, {[id]: polyline});
}, {});

const render = ({points, allLineIds}, node, polylines, viewBox, width, height, padding) => {
    node.setAttribute('viewBox', `0 0 ${width} ${height}`);
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    allLineIds.forEach((id) => {
        const polylinePoints = getPolylinePoints(points, id, viewBox, width, height, padding);

        polylines[id].setAttribute('points', polylinePoints);
    });
};

const lineOff = (polylines, lineId) => {
    const polyline = polylines[lineId];

    polyline.style.opacity = '0';
};
const lineOn = (polylines, lineId) => {
    const polyline = polylines[lineId];

    polyline.style.opacity = '1';
};

const Svg = (store, lineWidth = 2, padding = 0) => {
    const {allLineIds, lineColors} = store;
    const node = createSvgNode('svg');
    node.classList.add(css.svg);

    const polylines = createPolylines(allLineIds, lineColors, node, lineWidth);

    store.on(LINE_OFF, lineId => lineOff(polylines, lineId));
    store.on(LINE_ON, lineId => lineOn(polylines, lineId));

    return {
        node,
        render: (viewBox, width, height) => render(
            store,
            node,
            polylines,
            viewBox,
            width,
            height,
            padding,
        ),
    };
};

export default Svg;
