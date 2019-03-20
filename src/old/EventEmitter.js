
class EventEmitter {
    constructor() {
        this._eventEmitterListeners = {};
    }

    on(event, listener) {
        if (!this._eventEmitterListeners[event]) {
            this._eventEmitterListeners[event] = [];
        }

        this._eventEmitterListeners[event].push(listener);
    }

    off(event, listener) {
        const listeners = this._eventEmitterListeners[event];
        if (!listeners) {
            return;
        }

        for (let i = 0; i < listeners.length; i++) {
            if (listeners[i] === listener) {
                listeners.splice(i, 1);

                return;
            }
        }
    }

    trigger(event, data) {
        const listeners = this._eventEmitterListeners[event];

        if (listeners) {
            listeners.forEach(listener => listener(data));
        }

        const allEventsListeners = this._eventEmitterListeners['*'];

        if (allEventsListeners) {
            allEventsListeners.forEach(listener => listener(data, event));
        }
    }
}

export default EventEmitter;
