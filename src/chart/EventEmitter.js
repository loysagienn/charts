
class EventEmitter {
    constructor() {
        this.lstnrs = {};
    }

    on(event, listener) {
        if (!this.lstnrs[event]) {
            this.lstnrs[event] = [];
        }

        this.lstnrs[event].push(listener);
    }

    off(event, listener) {
        const listeners = this.lstnrs[event];
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
        const listeners = this.lstnrs[event];

        if (listeners) {
            listeners.forEach(listener => listener(data));
        }

        const allEventsListeners = this.lstnrs['*'];

        if (allEventsListeners) {
            allEventsListeners.forEach(listener => listener(data, event));
        }
    }
}

export default EventEmitter;
