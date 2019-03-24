
// 60 fps
const framePlannedTime = 1000 / 60;

let frameRunning = false;
let queue = [];
let marks = {};

const runFrameWorker = (lastFrameTimestamp) => {
    frameRunning = true;

    return requestAnimationFrame((timestamp) => {
        if (queue.length === 0) {
            frameRunning = false;

            return;
        }

        const timeFactor = lastFrameTimestamp ? ((timestamp - lastFrameTimestamp) / framePlannedTime) : 1;

        const runQueue = queue;
        const runMarks = marks;

        queue = [];
        marks = {};

        const queueLength = runQueue.length;

        for (let i = 0; i < queueLength; i++) {
            const [func, mark] = runQueue[i];

            if (!mark || runMarks[mark] === i) {
                func(timeFactor, timestamp);
            } else {
                console.log(`skip mark ${mark}`);
            }
        }

        runFrameWorker(timestamp);
    });
};

const nextFrame = (func, mark) => {
    if (mark) {
        marks[mark] = queue.push([func, mark]) - 1;
    } else {
        queue.push([func, mark]);
    }

    if (!frameRunning) {
        runFrameWorker();
    }
};

// const nextFrame = func => setTimeout(() => func(1), 16);


export default nextFrame;

export const markHasBeenPlanned = mark => (mark in marks);

export const showFps = (callback) => {
    let hits = 0;

    const newHit = () => nextFrame(() => {
        hits++;

        newHit();
    });

    setInterval(() => {
        callback(hits);

        hits = 0;
    }, 1000);

    newHit();
};
