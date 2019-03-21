
let frameRunning = false;
const queue = [];

const runFrameWorker = () => {
    frameRunning = true;

    return requestAnimationFrame((timestamp) => {
        if (queue.length === 0) {
            frameRunning = false;

            return;
        }

        const queueLength = queue.length;

        for (let i = 0; i < queueLength; i++) {
            queue[i](timestamp);
        }

        queue.splice(0, queueLength);

        runFrameWorker();
    });
};

const nextFrame = (func) => {
    queue.push(func);

    if (!frameRunning) {
        runFrameWorker();
    }
};

export default nextFrame;


const showFps = () => {
    let hits = 0;

    const newHit = () => nextFrame(() => {
        hits++;

        newHit();
    });

    setInterval(() => {
        console.log(`FPS: ${hits}`);

        hits = 0;
    }, 1000);

    newHit();
};

showFps();
