var npminfo = require('../package.json');

var help_content = {
    'fb-init': {
        title: 'Init current directory as fb project',
        usage: 'fb init'
    },

    'fb-add': {
        title: 'Create or fix a Page Version',
        usage: [
            'fb add <pageNameVersion>'
        ]
    },

    'fb-build': {
        title: 'Build Page or Common',
        usage: [
            'fb build <pageNameVersion>[ <pageNameVersion>...]',
            '    [-t|-timestamp <timestamp>]',
            'fb build common'
        ]
    },

    'fb-group': {
        title: 'Group is design for build multi-pages at one time',
        usage: [
            'fb group build <groupName>',
            'fb group[ list|ls]',
            'fb group set <groupName> <pageNameVersion>[ <pageNameVersion>...]',
            'fb group get <groupName>',
            'fb group rm <groupName>'
        ]
    },
    'fb-update': {
        title: 'update this fb project to current version',
        usage: [
            'fb update'
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
        console.log('FrontBuild(fb): front end build framework');
        console.log('version: %s', npminfo.version);
        console.log('commands:');
        console.log ('\tinit, add, build, group[g], help, update');
        console.log('options:');
        console.log ('\t--debug: Turn on debug mode');
        callback(null, '');
    }

    if (argv._.length >= 2) {
        var content = argv._[1];
        printHelp('fb-' + content);
    }
}