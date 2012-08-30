var npminfo = require('../package.json');

var help_content = {
    'kpi-init': {
        title: 'Init current directory as Kissy Pie project',
        usage: 'kpi init'
    },

    'kpi-add': {
        title: 'Create or fix a Page Version',
        usage: [
            'kpi add <pageNameVersion>'
        ]
    },

    'kpi-build': {
        title: 'Build Page or Common',
        usage: [
            'kpi build <pageNameVersion>[ <pageNameVersion>...]',
            '    [-t|-timestamp <timestamp>]',
            'kpi build common',
            '-w|watch monitor file change and auto rebuild',
        ]
    },

    'kpi-group': {
        title: 'Group is design for build multi-pages at one time',
        usage: [
            'kpi group build <groupName>',
            'kpi group[ list|ls]',
            'kpi group set <groupName> <pageNameVersion>[ <pageNameVersion>...]',
            'kpi group get <groupName>',
            'kpi group rm <groupName>'
        ]
    },
    'kpi-update': {
        title: 'update this kpi project to current version',
        usage: [
            'kpi update'
        ]
    },
    'kpi-web': {
        title: 'start a server for web interface of KissyPie',
        usage: [
            'kpi web'
        ]
    }

}

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
        console.log('Kissy Pie(ki): front end build framework');
        console.log('Version: %s', npminfo.version);
        console.log('Commands:');
        console.log ('init, add, build, group, help, update');
        console.log ('Use "ki help command" for more infomation;');
        callback(null, '');
    }

    if (argv._.length >= 2) {
        var content = argv._[1];
        printHelp('kpi-' + content);
    }
}