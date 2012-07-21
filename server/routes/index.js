
/*
 * GET home page.
 */

exports.index = function (req, res) {
    process.send('pages');
    process.once('message', function (msg) {
        res.render('index', { title: msg });
    });
};

exports.app = require('./app').app;
