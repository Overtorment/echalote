var Dates;
(function (Dates) {
    function fromMillis(millis) {
        return new Date(millis);
    }
    Dates.fromMillis = fromMillis;
    function toMillis(date) {
        return date.getTime();
    }
    Dates.toMillis = toMillis;
    function fromSeconds(seconds) {
        return fromMillis(seconds * 1000);
    }
    Dates.fromSeconds = fromSeconds;
    function toSeconds(date) {
        return Math.floor(toMillis(date) / 1000);
    }
    Dates.toSeconds = toSeconds;
    function fromMillisDelay(millis) {
        return fromMillis(Date.now() + millis);
    }
    Dates.fromMillisDelay = fromMillisDelay;
    function toMillisDelay(date) {
        return toMillis(date) - Date.now();
    }
    Dates.toMillisDelay = toMillisDelay;
    function fromSecondsDelay(seconds) {
        return fromMillisDelay(seconds * 1000);
    }
    Dates.fromSecondsDelay = fromSecondsDelay;
    function toSecondsDelay(date) {
        return Math.floor(toMillisDelay(date) / 1000);
    }
    Dates.toSecondsDelay = toSecondsDelay;
})(Dates || (Dates = {}));

export { Dates };
//# sourceMappingURL=dates.mjs.map
