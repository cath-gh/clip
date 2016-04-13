var cheerio = require('cheerio'),
    common = require('./common'),
    util = require('./util');

var user = {};

/**
 * 用户登录
 * @description eventName:='login'
 * @param {string} username 用户名
 * @param {string} password 密码
 * @param {object} captcha 验证码{.id, .solution, .src}
 * @param {function} cb 回调函数 cb(login|boolean)
 */
user.login = function (username, password, captcha, cb) {
    var form = {};
    form.source = 'index_nav';
    form.form_email = username;
    form.form_password = password;
    if (captcha) {
        form['captcha-solution'] = captcha.solution;
        form['captcha-id'] = captcha.id;
    }
    form.remember = 'on';
    util.postPage(common.LOGINURL, form, loginHandler, util.getCallbackEvtFunc(cb, common.ep, 'login'));
};

/**
 * 用户登录处理
 * @param {object} res 登录返回页面
 * @returns {boolean} 提交是否成功
 */
function loginHandler(res) {
    return res.statusCode !== 400;
}

/**
 * 获取验证码
 * @description eventName:='getCaptcha'
 * @param {function} cb 回调函数 cb(captcha|object{.src|string, .id|string})
 */
user.getCaptcha = function (cb) {
    util.getPage(common.LOGINURL, captchaPageParser, util.getCallbackEvtFunc(cb, common.ep, 'getCaptcha'));
};

/**
 * 验证码页面解析
 * @param {object} res 验证码页面页面
 * @returns {object} captcha 验证码|object{.src|string 验证码图片地址, .id|string 验证码id}
 */
function captchaPageParser(res) {
    var captcha;
    var $ = cheerio.load(res.body);
    var src = $('#captcha_image').attr('src');
    if (src) {
        captcha = {};
        captcha.src = src;
        captcha.id = $('input[name=captcha-id]').attr('value');
    }
    return captcha;
}

/**
 * 判断是否已登录
 * @description eventName:='isLogin'
 * @param {function} cb 回调函数 cb(isLogin|boolean)
 */
user.isLogin = function (cb) {
    util.getPage(common.MINEURL, isLogin, util.getCallbackEvtFunc(cb, common.ep, 'isLogin'));
};

/**
 * 判断是否已登录
 * @param {object} res douban主页面
 * @returns {boolean} 是否登录
 */
function isLogin(res) {
    var $ = cheerio.load(res.body);
    var login = $('.top-nav-info');
    return login.length === 1;
}

/**
 * 获取用户信息
 * @description eventName:='userInfo'
 * @param {function} cb 回调函数 cb(userInfo|object{...})
 */
user.getInfo = function (cb) {
    util.getPage(common.MINEURL, userPageParser, util.getCallbackEvtFunc(cb, common.ep, 'userInfo'));
};

/**
 * 用户页面解析
 * @param {object} res 用户页面
 * @returns {object} userInfo 用户信息|object{.id|string, .name|string, .img|string, .location|string, .join|string}
 */
function userPageParser(res) {
    var userInfo = {};
    if (res.statusCode === 200) {
        var $ = cheerio.load(res.body);
        userInfo.name = $('span', $('.nav-user-account'))[0].children[0].data.slice(0, -3);
        var profile = $('#profile');
        userInfo.img = $('img', profile)[0].attribs['src'];
        var ui = $('.user-info', profile);
        userInfo.location = $('a', ui)[0].children[0].data;
        var pl = $('.pl', ui)[0].children;
        userInfo.id = pl[0].data.trim();
        userInfo.join = pl[2].data.slice(0, -2).trim();//new Date(.join)
    }
    return userInfo;
}

module.exports = user;