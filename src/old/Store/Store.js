
import EventEmitter from '../EventEmitter';
import getViewBox from './getViewBox';

const setEvents = (ctx) => {
    ctx.CHANGE_SIZE = 'CHANGE_SIZE';
    ctx.CHANGE_SCALE = 'CHANGE_SCALE';
    ctx.CHANGE_VIEW_BOX = 'CHANGE_VIEW_BOX';
    ctx.ANIMATE_VIEW_BOX = 'ANIMATE_VIEW_BOX';
};

const ANIMATION_TIMEOUT = 15;

const getSize = (width, height) => ({
    width,
    height,
    chartView: {
        width: width - 40,
        height: height - 130,
    },
    chartScaler: {
        width: width - 40,
        height: 60,
    },
});

const getNextPosition = (target, current, speed, boxDiff, timeDiff) => {
    const diff = target - current;
    const absDiff = Math.abs(diff);

    if (absDiff < (boxDiff / 500)) {
        return [target, 0];
    }

    const timeFactor = speed === 0 ? 1 : (timeDiff / ANIMATION_TIMEOUT);

    const needSpeedUp = (diff > 0 && speed < (diff / 18)) || (diff < 0 && speed > (diff / 18));
    const needSlowDown = (diff > 0 && speed > (diff / 4)) || (diff < 0 && speed < (diff / 4));

    if (needSpeedUp) {
        speed += (diff / 40);
    }

    if (needSlowDown) {
        speed -= (diff / 6);
    }

    const shift = speed * timeFactor;

    if (Math.abs(shift) > absDiff) {
        return [target, 0];
    }

    return [current + (speed * timeFactor), speed];
};

class Store extends EventEmitter {
    constructor({points, lineIds, names, colors}, {startFromZero = false} = {}) {
        super();

        setEvents(this);

        this._points = points;
        this.lineIds = lineIds;
        this.lineNames = names;
        this.lineColors = colors;
        this.startFromZero = startFromZero;

        this._size = getSize(300, 300);

        this._scale = {
            start: 0,
            end: 0,
        };
        this._maxAnimSpeed = 0;
        this._minAnimSpeed = 0;
        this._animationTime = 0;
        this._animationTimeout = null;

        this._viewBox = getViewBox(this);
        this._fullViewBox = this._viewBox;
        this._currentViewBox = this._viewBox;
    }

    _updateViewBox() {
        this._viewBox = getViewBox(this);

        this.trigger(this.CHANGE_VIEW_BOX, this._viewBox);

        this._animateViewBox();
    }

    _animateViewBox() {
        if (this._animationTimeout !== null) {
            clearTimeout(this._animationTimeout);

            this._animationTimeout = null;
        }

        requestAnimationFrame((time) => {
            if (time === this._animationTime) {
                return;
            }
            const {startIndex, endIndex, minY, maxY} = this._viewBox;
            const {minY: minYCurr, maxY: maxYCurr} = this._currentViewBox;

            if (minY === minYCurr && maxY === maxYCurr) {
                this._currentViewBox = {startIndex, endIndex, minY, maxY};
                this._maxAnimSpeed = 0;
                this._minAnimSpeed = 0;

                this.trigger(this.ANIMATE_VIEW_BOX, this._currentViewBox);

                return;
            }

            const boxDiff = maxY - minY;
            const timeDiff = time - this._animationTime;

            const [maxYNext, maxSpeedNext] = getNextPosition(maxY, maxYCurr, this._maxAnimSpeed, boxDiff, timeDiff);
            const [minYNext, minSpeedNext] = getNextPosition(minY, minYCurr, this._minAnimSpeed, boxDiff, timeDiff);

            this._currentViewBox = {startIndex, endIndex, minY: minYNext, maxY: maxYNext};
            this._maxAnimSpeed = maxSpeedNext;
            this._minAnimSpeed = minSpeedNext;
            this._animationTime = time;

            this.trigger(this.ANIMATE_VIEW_BOX, this._currentViewBox);

            this._animationTimeout = setTimeout(() => {
                this._animationTimeout = null;

                this._animateViewBox();
            }, ANIMATION_TIMEOUT);
        });
    }

    changeSize(width, height) {
        this._size = getSize(width, height);

        this.trigger(this.CHANGE_SIZE, this._size);
    }

    changeScale(start, end) {
        this._scale = {start, end};

        this._updateViewBox();

        this.trigger(this.CHANGE_SCALE, this._scale);
    }

    get size() {
        return this._size;
    }

    get points() {
        return this._points;
    }

    get scale() {
        return this._scale;
    }

    get viewBox() {
        return this._viewBox;
    }

    get currentViewBox() {
        return this._currentViewBox;
    }

    get fullViewBox() {
        return this._fullViewBox;
    }
}

export default Store;
