
import EventEmitter from '../EventEmitter';
import {ANIMATE_VIEW_BOX, CHANGE_VIEW_BOX} from '../constants';
import getViewBox from './getViewBox';

const ANIMATION_TIMEOUT = 15;

const getPosition = (target, current, speed, boxDiff, timeDiff) => {
    const diff = target - current;
    const absDiff = Math.abs(diff);

    if (absDiff < boxDiff / 500) {
        return [target, 0];
    }

    const timeFactor = speed === 0 ? 1 : (timeDiff / ANIMATION_TIMEOUT);

    const targetHits = ((absDiff / boxDiff) * 10 + 13) / 2;

    const targetSpeed = (diff / targetHits);
    speed = (speed + targetSpeed) / 2;

    const shift = (speed + speed * timeFactor) / 2;
    // const shift = speed;

    if (Math.abs(shift) > absDiff) {
        return [target, 0];
    }

    return [current + shift, speed];
};

class ViewBox extends EventEmitter {
    constructor(state, scale) {
        super();

        this.state = state;

        this.animation = {
            speed: [0, 0],
            timestamp: 0,
            timeout: null,
        };

        this.box = getViewBox(this.state, scale);
        this.animationBox = this.box;
    }

    update(scale) {
        this.box = getViewBox(this.state, scale);

        this.trigger(CHANGE_VIEW_BOX, this.box);

        this.animateViewBox();
    }

    animateViewBox() {
        if (this.animation.timeout !== null) {
            return;
        }

        requestAnimationFrame((timestamp) => {
            const {animation} = this;
            const {timestamp: previousTimestamp} = animation;

            if (timestamp === previousTimestamp) {
                return;
            }

            animation.timestamp = timestamp;

            const {startIndex, endIndex, startIndexPart, endIndexPart, minY, maxY} = this.box;
            const {minY: minYCurr, maxY: maxYCurr} = this.animationBox;

            if (minY === minYCurr && maxY === maxYCurr) {
                this.animationBox = {
                    startIndex,
                    endIndex,
                    startIndexPart,
                    endIndexPart,
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
                startIndexPart,
                endIndexPart,
                minY: minYNext,
                maxY: maxYNext,
            };
            animation.speed = [maxYSpeedNext, minYSpeedNext];

            this.trigger(ANIMATE_VIEW_BOX, this.animationBox);

            animation.timeout = setTimeout(() => {
                animation.timeout = null;

                this.animateViewBox();
            }, ANIMATION_TIMEOUT);
        });
    }
}

export default ViewBox;
