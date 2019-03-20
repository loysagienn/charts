

export const createElement = (tag, className, parent) => {
    const element = document.createElement(tag);

    if (className) {
        element.classList.add(className);
    }

    if (parent) {
        parent.appendChild(element);
    }

    return element;
};
