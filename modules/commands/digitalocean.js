var _ = require('lodash');
var readline = require('readline');
var utils = require('../utils');
var list = require('./list');
var API = require('../providers/digitalocean.js');

exports.run = function (args) {
  utils.argShift(args, 'subcommand');
  utils.argShift(args, 'name');

  if (!args.subcommand || !subcommands[args.subcommand]) {
    return utils.missingCommand(exports.help);
  }

  if (/^(create|droplets|images|regions|sizes|snapshots)$/.test(args.subcommand)) {
    return subcommands[args.subcommand](args);
  }

  if (!args.name) {
    return utils.missingParameter('[name]', exports.help);
  }

  var instance = utils.findFirstMatchingInstance(args.name);
  utils.handleInstanceNotFound(instance, args);

  if (instance.digitalocean && instance.digitalocean.id) {
    subcommands[args.subcommand](instance, args);
  } else {
    API.getDropletInfoByInstanceName(instance.name, function (droplet) {
      instance.digitalocean = droplet;
      utils.updateInstance(instance.name, {
        digitalocean: instance.digitalocean
      });
      subcommands[args.subcommand](instance, args);
    });
  }
};

var subcommands = {};

subcommands.create = function (args) {
  var clusters = utils.getClusters();

  if (!args.cluster) {
    return utils.missingParameter('--cluster', exports.help);
  } else if (!clusters[args.cluster]) {
    utils.die('No "' + args.cluster + '" cluster found. Known clusters are: ' +
      _.keys(clusters).join(', ') + '.');
  } else if (clusters[args.cluster].instances[args.name]) {
    utils.red('Instance "' + args.name + '" already exists.');
    return list.run(args);
  }

  API.create(args);
};

subcommands.destroy = function (instance, args) {
  if (args.force) {
    return API.destroy(instance);
  }

  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Do you really want to destroy this droplet? [Y/n]'.yellow, function (answer) {
    rl.close();
    if (answer === 'n' || answer === 'N') {
      utils.grey('No action taken.');
    } else {
      API.destroy(instance);
    }
  });
};

subcommands.droplets = function () {
  API.getDroplets(function (droplets) {
    utils.printCollection('droplets', droplets);
  });
};

subcommands.images = function () {
  API.getImages(function (images) {
    utils.printCollection('images', images);
  });
};

subcommands.poweron = function (instance) {
  API.powerOn(instance);
};

subcommands.reboot = function (instance) {
  API.reboot(instance);
};

subcommands.rebuild = function (instance, args) {
  if (!args['image-id'] && !args['image-name'] && !args['image-slug']) {
    args['image-slug'] = 'ubuntu-12-04-x64';
  }

  API.rebuild(instance, args);
};

subcommands.regions = function () {
  API.getRegions(function (regions) {
    utils.printCollection('regions', regions);
  });
};

subcommands.resize = function (instance, args) {
  API.resize(instance, args);
};

subcommands.sizes = function () {
  API.getSizes(function (sizes) {
    utils.printCollection('sizes', sizes);
  });
};

subcommands.shutdown = function (instance) {
  API.shutdown(instance);
};

subcommands.snapshot = function (instance, args) {
  utils.argShift(args, 'snapshotName');

  if (!args.snapshotName) {
    return utils.missingParameter('[snapshot-name]', exports.help);
  }

  API.snapshot(instance, args.snapshotName);
};

subcommands.snapshots = function () {
  API.getSnapshots(function (snapshots) {
    utils.printCollection('snapshots', snapshots);
  });
};

exports.signatures = function () {
  return [
    '  overcast digitalocean create [name] [options]',
    '  overcast digitalocean destroy [name]',
    '  overcast digitalocean droplets',
    '  overcast digitalocean images',
    '  overcast digitalocean poweron [name]',
    '  overcast digitalocean reboot [name]',
    '  overcast digitalocean rebuild [name] [options]',
    '  overcast digitalocean regions',
    '  overcast digitalocean resize',
    '  overcast digitalocean sizes',
    '  overcast digitalocean shutdown [name]',
    '  overcast digitalocean snapshot [name] [snapshot-name]',
    '  overcast digitalocean snapshots'
  ];
};

exports.help = function () {
  utils.printArray([
    'These functions require the following values set in .overcast/variables.json:',
    '  DIGITALOCEAN_CLIENT_ID',
    '  DIGITALOCEAN_API_KEY',
    '',
    'overcast digitalocean create [name] [options]',
    '  Creates a new instance on DigitalOcean.'.grey,
    '',
    '  The instance will start out using the auto-generated SSH key found here:'.grey,
    ('  ' + utils.CONFIG_DIR + '/keys/overcast.key.pub').cyan,
    '',
    '  You can specify region, image, and size of the droplet using -id or -slug.'.grey,
    '  You can also specify an image or snapshot using --image-name.'.grey,
    '',
    '    Option               | Default'.grey,
    '    --cluster CLUSTER    |'.grey,
    '    --ssh-port PORT      | 22'.grey,
    '    --region-slug NAME   | nyc2'.grey,
    '    --region-id ID       |'.grey,
    '    --image-slug NAME    | ubuntu-12-04-x64'.grey,
    '    --image-id ID        |'.grey,
    '    --image-name NAME    |'.grey,
    '    --size-slug NAME     | 512mb'.grey,
    '    --size-id ID         |'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast digitalocean create db.01 --cluster db --size-slug 1gb --region-slug sfo1'.grey,
    '',
    'overcast digitalocean destroy [name]',
    '  Destroys a DigitalOcean droplet and removes it from your account.'.grey,
    '  Using --force overrides the confirm dialog. This is irreversible.'.grey,
    '',
    '    Option               | Default'.grey,
    '    --force              | false'.grey,
    '',
    'overcast digitalocean droplets',
    '  List all DigitalOcean droplets in your account.'.grey,
    '',
    'overcast digitalocean images',
    '  List all available DigitalOcean images. Includes snapshots.'.grey,
    '',
    'overcast digitalocean poweron [name]',
    '  Power on a powered off droplet.'.grey,
    '',
    'overcast digitalocean reboot [name]',
    '  Reboots a DigitalOcean droplet. According to the API docs, "this is the'.grey,
    '  preferred method to use if a server is not responding."'.grey,
    '',
    'overcast digitalocean rebuild [name] [options]',
    '  Rebuild a DigitalOcean droplet using a specified image name, slug or ID.'.grey,
    '  According to the API docs, "This is useful if you want to start again but'.grey,
    '  retain the same IP address for your droplet."'.grey,
    '',
    '    Option               | Default'.grey,
    '    --image-slug SLUG    | ubuntu-12-04-x64'.grey,
    '    --image-name NAME    |'.grey,
    '    --image-id ID        |'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast digitalocean rebuild app.01 --name my.app.snapshot'.grey,
    '',
    'overcast digitalocean regions',
    '  List available DigitalOcean regions (nyc2, sfo1, etc).'.grey,
    '',
    'overcast digitalocean resize [name] [options]',
    '  Shutdown, resize, and reboot a DigitalOcean droplet.'.grey,
    '  If --skipboot flag is used, the droplet will stay in a powered-off state.'.grey,
    '',
    '    Option               | Default'.grey,
    '    --size-slug NAME     |'.grey,
    '    --size-id ID         |'.grey,
    '    --skipBoot           | false'.grey,
    '',
    '  Example:'.grey,
    '  $ overcast digitalocean resize db.01 --size-slug 2gb'.grey,
    '',
    'overcast digitalocean sizes',
    '  List available DigitalOcean sizes (512mb, 1gb, etc).'.grey,
    '',
    'overcast digitalocean shutdown [name]',
    '  Shut down a DigitalOcean droplet.'.grey,
    '',
    'overcast digitalocean snapshot [name] [snapshot-name]',
    '  Creates a named snapshot of a droplet. This process will reboot the instance.'.grey,
    '',
    'overcast digitalocean snapshots',
    '  Lists available snapshots in your DigitalOcean account.'.grey
  ]);
};
