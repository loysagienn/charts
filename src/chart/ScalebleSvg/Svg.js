
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
    polyline.setAttribute('vector-effect', 'non-scaling-stroke');

    return Object.assign(acc, {[id]: polyline});
}, {});

const render = ({points, allLineIds}, node, polylines, viewBox, width, height, padding) => {
    node.setAttribute('viewBox', `0 0 ${width} ${height}`);
    node.style.width = `${width}px`;
    node.style.height = `${height}px`;

    const lines = getPolylinePoints(points, allLineIds, viewBox, width, height, padding);

    for (let i = 0; i < allLineIds.length; i++) {
        const lineId = allLineIds[i];

        polylines[lineId].setAttribute('points', lines[lineId]);
    }

    // console.log(polylines[allLineIds[0]].points);
};

const updateScale = (store, node, polylines, staticViewBox, viewBox, width, height, padding, preventScaleX) => {
    const {minY, maxY} = staticViewBox;
    const {minY: scaleMinY, maxY: scaleMaxY} = viewBox;
    const doublePadding = padding * 2;
    const {allLineIds, scale} = store;
    const [scaleStart, scaleEnd] = scale;

    const scaleX = preventScaleX ? 1 : 1 / (1 - scaleStart - scaleEnd);
    const scaleY = (maxY - minY) / (scaleMaxY - scaleMinY);

    const translateX = preventScaleX
        ? 0
        : -(padding * (scaleStart + scaleEnd) + ((width - doublePadding) * scaleStart));

    const translateY = height * (1 - scaleY) / scaleY;

    for (let i = 0; i < allLineIds.length; i++) {
        const polyline = polylines[allLineIds[i]];

        polyline.setAttribute('transform', `scale(${scaleX} ${scaleY}) translate(${translateX} ${translateY})`);
    }
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

    let currentWidth = 0;
    let currentHeight = 0;

    const node = createSvgNode('svg');
    node.classList.add(css.svg);

    const polylines = createPolylines(allLineIds, lineColors, node, lineWidth);

    const onLineOff = lineId => lineOff(polylines, lineId);
    const onLineOn = lineId => lineOn(polylines, lineId);

    store.on(LINE_OFF, onLineOff);
    store.on(LINE_ON, onLineOn);

    const destroy = () => {
        store.off(LINE_OFF, onLineOff);
        store.off(LINE_ON, onLineOn);
    };

    return {
        node,
        destroy,
        render: (staticViewBox, viewBox, width, height, preventScaleX) => {
            if (width !== currentWidth || height !== currentHeight) {
                render(store, node, polylines, staticViewBox, width, height, padding);
            }

            currentWidth = width;
            currentHeight = height;

            updateScale(store, node, polylines, staticViewBox, viewBox, width, height, padding, preventScaleX);
        },
    };
};

export default Svg;
