var os  = require('os');
var exec = require('child_process').exec;
/**
 * Open sth with default Application of based on Your   OS
 * @param target {String} target to Open
 * @param callback {Function}
 */
function commandOpen (target, callback) {
    switch (os.platform()) {
        case 'win32':
            exec('start ' + target, callback);
            break;
        case 'darwin':
            exec('open ' + target, callback);
            break;
        case 'linux':
            var cmd = 'type -P gnome-open &>/dev/null  && gnome-open ' + p +
                ' || { type -P xdg-open &>/dev/null  && xdg-open ' + p + '; }';
            exec(cmd, callback);
        default:
            var error = new Error();
            error.message = 'Can\'t Open it';
            callback(error);
    }
}

module.exports = commandOpen;