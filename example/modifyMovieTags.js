var EventProxy = require('eventproxy'),
    clipjs = require('../lib/clip');

var ep = new EventProxy(),
    clip = new clipjs({fileName: 'test.cookie'});

var app = {};

app.run = function (userId, state, query) {
    ep.on('done', function () {
        clip.evt.unbind('done');
        console.log('done');
        //clip.movie.getUserTags(userId, null, function (tagList) {
        //    logTags(tagList, 10);
        //});
    });

    //clip.evt.all('userTagList', 'colList', function (tagList, itemList) {
    clip.evt.on('colPage', function (colPageInfo) {
        //clip.evt.unbind('userTagList');
        //clip.evt.unbind('colList');
        clip.evt.unbind('colPage');
        //logTags(tagList, 10);
        var itemList = colPageInfo.itemList;
        console.log('收藏数量: ' + itemList.length);

        var idx = 0;
        ep.on('next', function (idx) {
            console.log(idx + '/' + itemList.length + ' ' + itemList[idx - 1].title);
            if (idx === itemList.length) {
                ep.unbind('next');
                ep.emit('done');
            }
            else modiTags(itemList, idx, state);
        });

        modiTags(itemList, idx, state);
    });

    clip.movie.getUserTags(userId, null, function (tagList) {
        logTags(tagList, 10);
    });
    //clip.movie.getUserTags(userId);
    //clip.movie.getUserAllCol(userId, state, query);
    //clip.movie.getUserCol(userId, state, query);
};

function modiTags(itemList, idx, state) {
    var film = itemList[idx];
    var id = film.id,
        rating = film.rating,
        comment = film.comment,
        tags = film.tags;
    ep.all('autoTagList', 'modiPre', function (tagList) {
        clip.movie.postFilmReview(id, state, rating, tagList, comment, function (success) {
            if (success) {
                ep.emit('next', idx + 1);
            }
        });
    });

    clip.movie.getAutoTags(id, null, function (tagList) {
        ep.emit('autoTagList', tagList);
    });
    clip.movie.modifyReviewPre(id, function () {
        ep.emit('modiPre');
    });
}

function logTags(tagList, len) {
    console.log('当前tag数量: ' + tagList.length);
    for (var i = 0; i < len; i++) {
        var tag = tagList[i];
        console.log(i + 1 + ': ' + tag.tag + ' ' + tag.count);
    }
}

module.exports = app;