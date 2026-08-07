'use strict';

exports.Console = void 0;
(function (Console) {
    Console.debugging = false;
    function log(...params) {
        if (!Console.debugging)
            return;
        console.log(...params);
    }
    Console.log = log;
    function debug(...params) {
        if (!Console.debugging)
            return;
        console.debug(...params);
    }
    Console.debug = debug;
    function error(...params) {
        if (!Console.debugging)
            return;
        console.error(...params);
    }
    Console.error = error;
    function warn(...params) {
        if (!Console.debugging)
            return;
        console.warn(...params);
    }
    Console.warn = warn;
})(exports.Console || (exports.Console = {}));
//# sourceMappingURL=index.cjs.map
