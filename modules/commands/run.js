var path = require('path');
var _ = require('lodash');
var utils = require('../utils');
var ssh = require('../ssh');

exports.run = function (args) {
  utils.argShift(args, 'name');

  if (!args.name) {
    return utils.missingParameter('[instance|cluster|all]', exports.help);
  } else if (args._.length === 0) {
    return utils.missingParameter('[command|script]', exports.help);
  }

  ssh.run(args);
};

exports.signatures = function () {
  return [
    '  overcast run [instance|cluster|all] [command...]',
    '  overcast run [instance|cluster|all] [file...]'
  ];
};

exports.help = function () {
  var localScriptDir = utils.CONFIG_DIR + '/scripts';
  var bundledScriptDir = path.normalize(__dirname + '/../../scripts');

  utils.printArray([
    'overcast run [instance|cluster|all] [command...]',
    '  Runs a command or series of commands on an instance or cluster.'.grey,
    '  Commands will run sequentially unless you use the --parallel flag,'.grey,
    '  in which case each command will run on all instances simultanously.'.grey,
    '',
    '    Option                          | Default'.grey,
    '    --env "KEY=VAL KEY=\'1 2 3\'"     |'.grey,
    '    --user NAME                     |'.grey,
    '    --ssh-key PATH                  |'.grey,
    '    --parallel -p                   | false'.grey,
    '    --continueOnError               | false'.grey,
    '',
    '  Examples:'.grey,
    '  $ overcast run app --env "foo=\'bar bar\' testing=123" env'.grey,
    '  $ overcast run all uptime "free -m" "df -h"'.grey,
    '',
    'overcast run [instance|cluster|all] [file...]',
    '  Executes a script file or files on an instance or cluster.'.grey,
    '  Script files can be either absolute or relative path.'.grey,
    '  Script files will run sequentially unless you use the --parallel flag,'.grey,
    '  in which case each file will execute on all instances simultanously.'.grey,
    '',
    '    Option                          | Default'.grey,
    '    --env "KEY=VAL KEY=\'1 2 3\'"     |'.grey,
    '    --user NAME                     |'.grey,
    '    --ssh-key PATH                  |'.grey,
    '    --shell-command "COMMAND"       | bash -s'.grey,
    '    --parallel -p                   | false'.grey,
    '    --continueOnError               | false'.grey,
    '',
    '  Relative paths are relative to the cwd, or to these directories:'.grey,
    '  ' + localScriptDir.cyan,
    '  ' + bundledScriptDir.cyan,
    '',
    '  Example:'.grey,
    '  $ overcast run db install/core install/redis'.grey
  ]);
};
