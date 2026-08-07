'use strict';

var kcp = require('@hazae41/kcp');
var smux = require('@hazae41/smux');
var stream = require('./turbo/stream.cjs');

function createSnowflakeStream(raw) {
    const turbo = new stream.TurboDuplex();
    const kcp$1 = new kcp.KcpDuplex({ lowDelay: 100, highDelay: 1000 });
    const smux$1 = new smux.SmuxDuplex();
    raw.outer.readable.pipeTo(turbo.inner.writable).catch(() => { });
    turbo.inner.readable.pipeTo(raw.outer.writable).catch(() => { });
    turbo.outer.readable.pipeTo(kcp$1.inner.writable).catch(() => { });
    kcp$1.inner.readable.pipeTo(turbo.outer.writable).catch(() => { });
    kcp$1.outer.readable.pipeTo(smux$1.inner.writable).catch(() => { });
    smux$1.inner.readable.pipeTo(kcp$1.outer.writable).catch(() => { });
    return smux$1;
}

exports.createSnowflakeStream = createSnowflakeStream;
//# sourceMappingURL=snowflake.cjs.map
