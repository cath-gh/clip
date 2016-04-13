var common = require('./common'),
    user = require('./user'),
    movie = require('./movie');

function clip(option) {
    option = option || {};
    common.option = {
        useCookie: option.useCookie || true,
        fileName: './files/' + option.fileName || 'clip.cookie',
        encrypt: option.encrypt || true,
        algorithm: option.algorithm || 'aes-256-cbc',
        password: option.password || 'clip douban'
    };
    common.init();
    this.update = common.update;
    this.evt = common.ep;
    this.movie = movie;
    this.user = user;
}

module.exports = clip;