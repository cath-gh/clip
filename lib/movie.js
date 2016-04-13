var cheerio = require('cheerio'),
    eventproxy = require('eventproxy'),
    common = require('./common'),
    util = require('./util');

var movie = {};
var ep = new eventproxy(),
    _cpp = 15,
    _$ = function () {
    };

/**
 * 获取自动标签列表
 * @description eventName:='autoTagList'
 * @param {string/object} film 电影id或者电影信息
 * @param {object} option 标签选项|object{.name|boolean:=false, .year|boolean:=true,
 * .directorList|number:=-1, .writerList|number:=0, .castList|number:=4, .genreList|number:=-1,
 * .country|boolean:=true, languageList|number:=0}
 * @param {function} cb 回调函数 cb(tagList|Array[tag0|string, tag1, tag2, ..])
 */
movie.getAutoTags = function (film, option, cb) {
    var filmId = '',
        filmInfo = {};
    var tagList = [];
    option = option || {};
    option = {
        name: option.name || false,//多部曲电影和季播剧考虑添加
        year: option.year || true,
        country: option.country || true,
        genreList: option.genreList !== undefined || -1,
        directorList: option.directorList !== undefined || -1,
        writerList: option.writerList !== undefined || 0,
        castList: option.castList !== undefined || 4,
        languageList: option.languageList !== undefined || 0
    };

    switch (typeof film) {
        case 'string':
            filmId = film;
            ep.on('filmInfo', function (filmInfo) {
                tagList = getFilmTags(filmInfo, option);
                util.runCallbackEvtFunc(cb, 'autoTagList', tagList);
            });
            this.getFilmInfo(filmId, function (filmInfo) {
                ep.emit('filmInfo', filmInfo);
            });
            break;
        case 'object':
            filmInfo = film;
            tagList = getFilmTags(filmInfo, option);
            util.runCallbackEvtFunc(cb, 'autoTagList', tagList);
    }
};

/**
 * 获取电影标签列表
 * @param {object} filmInfo 电影信息
 * @param {object} option 标签选项
 * @returns {Array} tagList 标签列表|Array[tag0|string, tag1, tag2, ..]
 */
function getFilmTags(filmInfo, option) {
    var tagList = [];
    for (var key in option) {
        var limit = option[key];
        var value = filmInfo[key];
        if (value) {
            if (typeof limit === 'boolean') {
                if (limit) tagList.push(value)
            } else if (typeof limit === 'number') {
                limit = limit === -1 ? Infinity : limit;
                var len = limit > value.length ? value.length : limit;
                for (var i = 0; i < len; i++) {
                    var item = value[i];
                    tagList.push(typeof item === 'object' ? item.name : item);
                }
            }
        }
    }
    return tagList;
}

/**
 * 获取电影信息
 * @description eventName:='filmInfo'
 * @param {string} filmId 电影id
 * @param {function} cb 回调函数 cb(filmInfo|object{...})
 */
movie.getFilmInfo = function (filmId, cb) {
    var url = common.MOVIEHOST + 'subject/' + filmId;
    util.getPage(url, filmInfoPageParser, util.getCallbackEvtFunc(cb, 'filmInfo'));
};

/**
 * 电影信息页面解析
 * @param {object} res 电影信息页面
 * @returns {object} filmInfo 电影信息
 */
function filmInfoPageParser(res) {
    if (res.statusCode === 200) {
        var filmInfo = {};
        var $ = cheerio.load(res.body);
        _$ = $;

        var h1 = $('h1');
        filmInfo.name = $('[property="v:itemreviewed"]', h1).text();
        filmInfo.year = $('.year', h1).text().slice(1, -1);
        filmInfo.img = $('[rel="v:image"]')[0].attribs['src'];

        var info = $('#info');
        filmInfo.genreList = [];
        var genreList = $('[property="v:genre"]', info);
        genreList.each(function (index, value) {
            filmInfo.genreList.push(value.children[0].data);
        });
        var infoList = $('.pl', info);
        infoList.each(function (index, value) {
            var key = value.children[0].data;
            if (filmInfoKit[key]) {
                var rst = filmInfoKit[key](value);
                filmInfo[rst[0]] = rst[1];
            }
        });

        filmInfo.ratingInfo = {};
        var ratingInfo = $('#interest_sectl');
        filmInfo.ratingInfo.rating = parseFloat($('[property="v:average"]', ratingInfo).text());
        filmInfo.ratingInfo.count = parseInt($('[property="v:votes"]', ratingInfo).text());
        filmInfo.ratingInfo.details = [];
        var ratinglist = $('.rating_per', ratingInfo);
        ratinglist.each(function (index, value) {
            filmInfo.ratingInfo.details.push(parseFloat(value.children[0].data.slice(0, -1)));
        });

        filmInfo.summary = $('[property="v:summary"]')[0].children[0].data.trim();

        filmInfo.isMovie = !filmInfo.episodeCount;
        filmInfo.isSeason = !!filmInfo.seasonCount;
    }
    return filmInfo;
}

var filmInfoKit = {
    '导演': function (elem) {
        return ['directorList', staffKit(elem.next.next)];
    },
    '编剧': function (elem) {
        return ['writerList', staffKit(elem.next.next)];
    },
    '主演': function (elem) {
        return ['castList', staffKit(elem.next.next)];
    },
    '制片国家/地区:': function (elem) {
        return ['country', elem.next.data.split('/')[0].trim()];
    },
    '语言:': function (elem) {
        return ['languageList', elem.next.data.replace(/\s/g, '').split('/')];
    },
    '季数:': function (elem) {
        var str = elem.next.data;
        if (str === ' ') str = _$('[selected="selected"]', elem.next.next)[0].children[0].data;
        return ['seasonCount', parseInt(str)];
    },
    '集数:': function (elem) {
        return ['episodeCount', parseInt(elem.next.data)];
    },
    '单集片长:': function (elem) {
        return ['episodeTime', parseInt(elem.next.data)];
    },
    '片长:': function (elem) {
        return ['runtime', function (elem) {
            var str = '';
            if (elem.next.data === ' ') str = elem.next.next.children[0].data;
            else str = elem.next.data;
            return parseInt(str);
        }(elem)];
    },
    'IMDb链接:': function (elem) {
        return ['imdb', function (elem) {
            var item = elem.next.next;
            return {id: item.children[0].data, href: item.attribs['href']};
        }(elem)]
    }
};


function staffKit(elem) {
    var rstList = [];
    var list = _$('a', elem);
    list.each(function (index, value) {
        var id = value.attribs['href'];
        if (id.indexOf('celebrity') !== -1) id = id.slice(11, -1);
        else id = undefined;
        rstList.push({id: id, name: value.children[0].data.replace(/\s/, '·')});
    });
    return rstList;
}

/**
 * 获取用户所有的电影收藏
 * @description eventName:='colList'
 * @param {string} userId 用户id
 * @param {string} state 收藏状态 :=collect/wish/do
 * @param {object} query 查询 {.sort|string:=time/rating/title, .mode|string:=grid/list,
 * .filter|string:=all/schedule, .rating|string:=all/[1, ..5], .tag|string}
 * @param {function} cb 回调函数 cb(itemList|object{...})
 */
movie.getUserAllCol = function (userId, state, query, cb) {
    var itemList = [];
    var pageCount = 0;
    var curr = 1;
    var self = this;

    ep.on('colPage', function (colPageInfo) {
        pageCount = pageCount || colPageInfo.pageCount;
        itemList = itemList.concat(colPageInfo.itemList);
        if (++curr <= pageCount) {
            query.page = curr;
            self.getUserCol(userId, state, query, function (colPageInfo) {
                ep.emit('colPage', colPageInfo);
            });
        } else {
            ep.unbind('colPage');
            if (typeof cb === 'function') cb(itemList);
            else common.ep.emit('colList', itemList);
        }
    });

    query.page = curr;
    this.getUserCol(userId, state, query, function (colPageInfo) {
        ep.emit('colPage', colPageInfo);
    });
};

/**
 * 获取用户的电影收藏
 * @description eventName:='colPage'
 * @param {string} userId 用户id
 * @param {string} state 收藏状态 :=collect/wish/do
 * @param {object} query 查询 {.sort|string:=time/rating/title, page|number, .mode|string:=grid/list,
 * .filter|string:=all/schedule, .rating|string:=all/[1, .., 5], .tag|string}
 * @param {function} cb 回调函数 cb(colPageInfo|object{...})
 */
movie.getUserCol = function (userId, state, query, cb) {
    if (state !== 'collect' && state !== 'wish' && state !== 'do') state = 'collect';
    var path = 'people/' + userId + '/' + state;
    query = query || {};
    _cpp = query.mode === 'list' ? 30 : 15;//cpp: count per page
    if (query.page > 0) {
        query.start = (query.page - 1) * _cpp;
        delete query.page;
    }
    var url = util.getUrl(common.MOVIEHOST, path, query);
    util.getPage(url, colPageParser, util.getCallbackEvtFunc(cb, 'colPage'));
};

/**
 * 收藏页面解析
 * @param {object} res 收藏页面
 * @returns {object} pageInfo 页面信息
 */
function colPageParser(res) {
    var colPageInfo = {};
    if (res.statusCode === 200) {
        var $ = cheerio.load(res.body);
        var temp = $('.subject-num').text().trim();
        var pos = temp.indexOf('/');
        colPageInfo.total = parseInt(temp.slice(pos + 1));
        colPageInfo.pageCount = Math.ceil(colPageInfo.total / _cpp);

        colPageInfo.itemList = [];
        var list = $('.item');
        list.each(function (index, value) {
            var item = {};
            var pic = $('img', $('.pic', value));
            item.picTitle = pic.attr('alt');
            item.picSrc = pic.attr('src');

            var title = $('a', $('.title', value));
            item.href = title.attr('href');
            item.id = item.href.match(/\d+/)[0];
            item.title = title.text().replace(/\s/g, '');

            var intro = $('.intro', value);
            item.intro = intro.text();

            var rating = $('span[class^=rating]', value);
            if (rating.length) item.rating = parseInt(rating.attr('class').slice(6, 7));//rating5-t
            item.date = $('.date', value).text().trim();
            item.tags = $('.tags', value).text().slice(4);//'标签: '正好4个字符;
            item.comment = $('.comment', value).text().trim();
            colPageInfo.itemList.push(item);
        });
    } else colPageInfo.code = res.statusCode;

    return colPageInfo;
}

/**
 * 获取用户使用的标签
 * @description eventName:='userTagList'
 * @param {string} userId 用户id
 * @param {object} query 查询 {.tags_sort|string:=count/name, .action|string:=collect/wish/do}
 * @param {function} cb 回调函数 cb(tags|array[tag0|object{.count|number, .tag|string}, tag1, tag2, ..])
 */
movie.getUserTags = function (userId, query, cb) {
    var path = 'j/people/' + userId + '/get_collection_tags';
    query = query || {};
    query.cat_id = 1002;
    var url = util.getUrl(common.MOVIEHOST, path, query);
    util.getPage(url, function (res) {
        return JSON.parse(res.body);
    }, util.getCallbackEvtFunc(cb, 'userTagList'));
};

/**
 * 修改电影评论信息
 * @description eventName:='postFilmReview'
 * @restrict useCookie && Login方法
 * @param {string} filmId 电影id
 * @param {string} interest 收藏状态 :=collect/wish
 * @param {number} rating 评分 :=[1, .., 5]
 * @param {Array} tagList 标签列表|array[tag0|string, tag1, tag2, ..]
 * @param {string} comment 评论文本
 * @param {function} cb 回调函数 cb(success|boolean)
 */
movie.modifyReviewPre = function (filmId, cb) {
    var url = common.MOVIEHOST + 'j/subject/' + filmId + '/interest';
    util.getPage(url, function () {
    }, util.getCallbackEvtFunc(cb, 'modifyReviewPre'));

};

/**
 * 提交电影评论信息
 * @description eventName:='postFilmReview'
 * @restrict useCookie && Login方法
 * @param {string} filmId 电影id
 * @param {string} interest 收藏状态 :=collect/wish
 * @param {number} rating 评分 :=[1, .., 5]
 * @param {Array} tagList 标签列表|array[tag0|string, tag1, tag2, ..]
 * @param {string} comment 评论文本
 * @param {function} cb 回调函数 cb(success|boolean)
 */
movie.postFilmReview = function (filmId, interest, rating, tagList, comment, cb) {
    var form = {};
    form.ck = common.getCk();
    form.interest = interest || 'collect';
    form.rating = rating || '';
    form.comment = comment || '';
    if (tagList.length) {
        form.tags = tagList.reduce(function (ori, next) {
            return ori + ' ' + next
        });
    }
    var url = common.MOVIEHOST + 'j/subject/' + filmId + '/interest';
    util.postPage(url, form, postFilmReviewHandler, util.getCallbackEvtFunc(cb, 'postFilmReview'));
};

/**
 * 提交电影评论信息处理
 * @param {object} res 提交评论返回页面
 * @returns {boolean} 提交是否成功
 */
function postFilmReviewHandler(res) {
    return res.statusCode === 200;
}

/**
 * 删除电影评论信息
 * @description eventName:='delFilmReview'
 * @restrict useCookie && Login方法
 * @param {string} filmId 电影id
 * @param {function} cb 回调函数 cb(success|boolean)
 */
movie.delFilmReview = function (filmId, cb) {
    var form = {};
    form.ck = common.getCk();
    var url = common.MOVIEHOST + 'subject/' + filmId + '/remove';
    util.postPage(url, form, delFilmReviewHandler, util.getCallbackEvtFunc(cb, 'delFilmReview'));
};

/**
 * 删除电影评论信息处理
 * @param {object} res 删除评论返回页面
 * @returns {boolean} 删除是否成功
 */
function delFilmReviewHandler(res) {
    return res.statusCode === 302;
}

module.exports = movie;