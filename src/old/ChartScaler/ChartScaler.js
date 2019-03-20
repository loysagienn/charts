
import EventEmitter from '../EventEmitter';
import css from './ChartScaler.styl';
import Svg from '../Svg';
import Control from './Control';
import {createShadow, getScaleStart, getScaleEnd, getScaleMove, getClientX, startMove, setMaxScaleWidth} from './helpers';


class ChartScaler extends EventEmitter {
    constructor(store) {
        super();

        this._store = store;

        this._node = document.createElement('div');
        this._node.classList.add(css.chartScaler);
        this._chartLine = new Svg(store.points, store.lineIds, store.lineColors, css.svg);
        this._node.appendChild(this._chartLine.node);

        this._renderControls();

        store.on(store.CHANGE_SIZE, ({chartScaler}) => this._setSize(chartScaler));
        store.on(store.CHANGE_SCALE, scale => this._updateControlPosition(scale));

        this._updateControlPosition(store.scale);
    }

    _renderControls() {
        this._leftShadow = createShadow(this._node, css.leftShadow);
        this._rightShadow = createShadow(this._node, css.rightShadow);
        this._control = new Control();

        this._control.on('moveStartPoint', event => this._moveStartPoint(event));
        this._control.on('moveEndPoint', event => this._moveEndPoint(event));
        this._control.on('move', event => this._move(event));

        this._node.appendChild(this._control.node);
    }

    _moveStartPoint() {
        const onMove = (event) => {
            const scaleStart = getScaleStart(event, this._node, this._store.scale.end);

            this._store.changeScale(scaleStart, this._store.scale.end);
        };

        startMove(onMove);
    }

    _moveEndPoint() {
        const onMove = (event) => {
            const {start} = this._store.scale;
            const end = getScaleEnd(event, this._node, start);

            this._store.changeScale(start, end);
        };

        startMove(onMove);
    }

    _move(event) {
        const {start, end} = this._store.scale;
        const {left: scalerLeft, width} = this._node.getBoundingClientRect();
        const pixelScaleStart = width * start;
        const pixelShift = getClientX(event) - scalerLeft - pixelScaleStart;
        const scaleWidth = 1 - end - start;

        const onMove = (moveEvent) => {
            const [scaleStart, scaleEnd] = getScaleMove(
                moveEvent,
                this._node,
                pixelShift,
                scaleWidth,
            );

            this._store.changeScale(scaleStart, scaleEnd);
        };

        startMove(onMove);
    }

    _setSize({width, height}) {
        const {points, fullViewBox} = this._store;
        this._node.style.width = `${width}px`;
        this._node.style.height = `${height}px`;

        this._chartLine.render(points, fullViewBox, width, height);

        setMaxScaleWidth(60 / width);
    }

    _updateControlPosition({start, end}) {
        this._leftShadow.style.width = `${start * 100}%`;
        this._rightShadow.style.width = `${end * 100}%`;

        this._control.setPosition(start, end);
    }

    get node() {
        return this._node;
    }
}

export default ChartScaler;
