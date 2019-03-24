
import EventEmitter from '../EventEmitter';
import {ANIMATE_VIEW_BOX, CHANGE_VIEW_BOX} from '../constants';
import getViewBox from './getViewBox';
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
    constructor(store, scale, lineIds = null) {
        super();

        this.store = store;

        this.animation = {
            speed: [0, 0],
            timestamp: 0,
            timeout: null,
        };

        this.box = getViewBox(this.store, scale, lineIds);
        this.animationBox = this.box;

        this.nextFrameAnimationPlanned = false;
    }

    update(scale) {
        this.box = getViewBox(this.store, scale);

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

            const {startIndex, endIndex, scaleStartPoint, scaleEndPoint, minY, maxY} = this.box;
            const {minY: minYCurr, maxY: maxYCurr} = this.animationBox;
            const {animationsDisabled} = this.store;

            if (animationsDisabled || (minY === minYCurr && maxY === maxYCurr)) {
                this.animationBox = {
                    startIndex,
                    endIndex,
                    scaleStartPoint,
                    scaleEndPoint,
                    minY,
                    maxY,
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
                startIndex,
                endIndex,
                scaleStartPoint,
                scaleEndPoint,
                minY: minYNext,
                maxY: maxYNext,
            };
            animation.speed = [maxYSpeedNext, minYSpeedNext];

            this.trigger(ANIMATE_VIEW_BOX, this.animationBox);

            this.animateViewBox();
        });
    }
}

export default ViewBox;
