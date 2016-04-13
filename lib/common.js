var request = require('request'),
    ep = require('eventproxy')(),
    FileCookieStore = require('tough-cookie-store');

var common = {};

common.MAINURL = 'https://www.douban.com/';
common.LOGINURL = 'https://www.douban.com/accounts/login';
common.MINEURL = 'https://www.douban.com/mine/';
common.MOVIEHOST = 'https://movie.douban.com/';
common.APIHOST = 'https://api.douban.com/';

common.ep = ep;
common.option = {};

var fileStore = {};

common.init = function (option) {
    option = option || common.option;
    if (option.useCookie) {
        fileStore = new FileCookieStore(option.fileName, option);
        var jar = request.jar(fileStore);
    }
    common.req = request.defaults({
        jar: jar || false,
        headers: {
            'Connection': 'keep-alive',
            //'User-Agent': 'request'
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.109 Safari/537.36'
        }
    });
};

common.update = common.init;

common.getCk = function () {
    return fileStore.getCookie('douban.com', '/', 'ck').value.match(/[^"]+/)[0];
};

module.exports = common;