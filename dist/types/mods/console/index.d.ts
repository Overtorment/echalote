declare namespace Console {
    let debugging: boolean;
    function log(...params: any[]): void;
    function debug(...params: any[]): void;
    function error(...params: any[]): void;
    function warn(...params: any[]): void;
}

export { Console };
