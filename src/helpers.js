export function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            args.push(ms)
            fn.apply(this, args);
        }, ms)
    }
}
