
import EventEmitter from '../EventEmitter';
import {ANIMATE_VIEW_BOX, CHANGE_VIEW_BOX} from '../constants';
import getViewBox from './getViewBox';
import getYScalePrecalc from './getYScalePrecalc';
import nextFrame from '../nextFrame';

const ANIMATION_TIMEOUT = 1000 / 60;

const getPosition = (target, current, speed, boxDiff, timeDiff) => {
    const diff = target - current;
    const absDiff = Math.abs(diff);

    if (absDiff < boxDiff / 500) {
        return [target, 0];
    }

    const timeFactor = speed === 0 ? 1 : (timeDiff / ANIMATION_TIMEOUT);

    const targetHits = ((absDiff / boxDiff) * 9 + 11) / 2;

    const targetSpeed = (diff / targetHits);
    speed = (speed + targetSpeed) / 2;

    const shift = (speed + speed * timeFactor) / 2;

    if (Math.abs(shift) > absDiff) {
        return [target, 0];
    }

    return [current + shift, speed];
};

class ViewBox extends EventEmitter {
    constructor(store, scale, lineIds, {calcGridStep = false, mainViewBox, defaultYScale} = {}) {
        super();

        this.store = store;

        this.animation = {
            speed: [0, 0],
            timestamp: 0,
            timeout: null,
        };

        this.yScalePrecalc = getYScalePrecalc(store);

        this.mainViewBox = mainViewBox;
        this.calcGridStep = calcGridStep;
        this.box = getViewBox(this.store, this.yScalePrecalc, scale, lineIds, calcGridStep, this.mainViewBox);
        this.animationBox = this.box;

        this.nextFrameAnimationPlanned = false;

        if (defaultYScale) {
            this.box = Object.assign(this.box, defaultYScale);
        }
    }

    update(scale, lineIds, keepYScale) {
        lineIds = lineIds || this.store.lineIds;

        if (!lineIds.length) {
            return;
        }

        this.box = getViewBox(
            this.store, this.yScalePrecalc, scale, lineIds, this.calcGridStep, this.mainViewBox, keepYScale,
        );

        this.trigger(CHANGE_VIEW_BOX, this.box);

        this.animateViewBox();
    }

    animateViewBox() {
        if (this.nextFrameAnimationPlanned) {
            return;
        }

        this.nextFrameAnimationPlanned = true;

        nextFrame((timeFactor, timestamp) => {
            this.nextFrameAnimationPlanned = false;

            const {animation} = this;
            const {timestamp: previousTimestamp} = animation;

            animation.timestamp = timestamp;

            const {scaleStartPoint, scaleEndPoint, minY, maxY, gridStep, minYShift} = this.box;
            const {minY: minYCurr, maxY: maxYCurr} = this.animationBox;

            if (minY === minYCurr && maxY === maxYCurr) {
                this.animationBox = {
                    scaleStartPoint,
                    scaleEndPoint,
                    minY,
                    maxY,
                    gridStep,
                    minYShift,
                };
                animation.speed = [0, 0];

                this.trigger(ANIMATE_VIEW_BOX, this.animationBox);

                return;
            }

            const boxDiff = maxYCurr - minYCurr;
            const timeDiff = timestamp - previousTimestamp;
            const [maxYSpeed, minYSpeed] = animation.speed;

            const [maxYNext, maxYSpeedNext] = getPosition(maxY, maxYCurr, maxYSpeed, boxDiff, timeDiff);
            const [minYNext, minYSpeedNext] = getPosition(minY, minYCurr, minYSpeed, boxDiff, timeDiff);

            this.animationBox = {
                scaleStartPoint,
                scaleEndPoint,
                minY: minYNext,
                maxY: maxYNext,
                gridStep,
                minYShift,
            };
            animation.speed = [maxYSpeedNext, minYSpeedNext];

            this.trigger(ANIMATE_VIEW_BOX, this.animationBox);

            this.animateViewBox();
        });
    }
}

export default ViewBox;
