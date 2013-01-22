var should = require('should');

var Utils = require('../lib/utils');

describe('testing Utils.detect', function(){

    function testCommand (cmd, expected, callback) {
        Utils.detectCommand(cmd, function(exist) {
            exist.should.eql(expected, 'cmd ' + cmd);
            callback();
        });
    }

    it('should detect cp', function(done){
        testCommand('cp', true, done);

    });

    it('should not detect not_exist_command', function(done){
        testCommand('not_exist_command', false, done);
    });

});