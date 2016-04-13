var common = require('./common');

var util = {};

util.getPage = function (url, pre, cb) {
    common.req.get(url, function (err, res) {
        if (err) throw err.message;
        cb(pre(res));
    })
};

util.postPage = function (url, form, pre, cb) {
    common.req.post({
        url: url,
        form: form
    }, function (err, res) {
        if (err) throw err.message;
        cb(pre(res));
    });
};

util.getUrl = function (host, path, query) {
    var str = '?';
    for (var key in query) str = str.concat(key, '=', query[key], '&');
    return host + path + str.slice(0, -1);
};

util.getCallbackEvtFunc = function (cb, evtName) {
    if (typeof cb === 'function') return cb;
    else return function (param) {
        common.ep.emit(evtName, param);
    };
};

util.runCallbackEvtFunc = function (cb, evtName, param) {
    if (typeof cb === 'function') cb(param);
    else common.ep.emit(evtName, param);
};

module.exports = util;