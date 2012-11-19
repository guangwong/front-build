var npminfo = require('../package.json');
var colors = require('colors');

var help_content = {
    'ki-init': {
        title: 'Init current directory as Kissy Pie project',
        usage: 'ki init'
    },

    'ki-add': {
        title: 'Create or fix a Page Version',
        usage: [
            'ki add <pageNameVersion>'
        ]
    },

    'ki-build': {
        title: 'Build Page or Common',
        usage: [
            'ki build <pageNameVersion>[ <pageNameVersion>...]',
            '    [-t|-timestamp <timestamp>]',
            'ki build common',
            '-w|watch monitor file change and auto rebuild',
        ]
    },

    'ki-group': {
        title: 'Group is design for build multi-pages at one time',
        usage: [
            'ki group build <groupName>',
            'ki group[ list|ls]',
            'ki group set <groupName> <pageNameVersion>[ <pageNameVersion>...]',
            'ki group get <groupName>',
            'ki group rm <groupName>'
        ]
    },
    'ki-update': {
        title: 'update this ki project to current version',
        usage: [
            'ki update'
        ]
    },
    'ki-web': {
        title: '',
        usage: [
            'ki web'
        ]
    },
    'ki-analyze': {
        title: '分析模块的信赖关系',
        usage: [
            'ki analyze',
            'ki fenxi',
            'ki fx'
        ]
    }
};

function printLine (content) {
    console.log('\t%s', content);
}

function printHelp(name) {
    var help;
    if (help_content[name]) {
        help = help_content[name];
        console.log('NAME');
        console.log('\t%s - %s', name, help.title);
        console.log('SYNOPSIS');
        if (typeof help.usage === 'object') {
            help.usage.forEach(function(line) {
                printLine(line);
            });
        } else {
            printLine(help.usage);
        }
    }
}

module.exports = function (bin, callback) {
    var argv = bin.argv;
    var cwd = bin.cwd;
    if (argv._.length < 2) {
        console.log('Kissy Pie(ki) %s: Simple Build', npminfo.version.green);
        console.log('Commands:');
        var commands = ['init', 'add(a)', 'build(b)', 'group(g)', 'help', 'update(up)', 'web','analyze(fx, fenxi)'];
        commands.forEach(function(command){
           console.log(' ', command);
        });
        console.log();
        console.log ('Use "ki help command" for more infomation;');
        callback(null, '');
    }

    if (argv._.length >= 2) {
        var content = argv._[1];
        printHelp('ki-' + content);
    }
}
