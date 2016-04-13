var EventProxy = require('eventproxy'),
    clipjs = require('../lib/clip');

var ep = new EventProxy(),
    clip = new clipjs({fileName: 'test.cookie'});


var app = {};

app.run = function (filmId, state, rating, comment) {
    clip.evt.on('autoTagList', function (tagList) {
        clip.movie.postFilmReview(filmId, state, rating, tagList, comment, function (success) {
            if (success) console.log('done');
        })
    });
    clip.movie.getAutoTags(filmId);
};

module.exports = app;