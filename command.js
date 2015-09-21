#!/usr/bin/env node

// add bower components to packaging
// naught for stop/start

var _ = require("lodash"),
    program = require("commander"),
    path = require("path"),
    gulpRunner = require("./lib/gulp_runner"),
    notify = require("./lib/monitor_notifications"),
    pjson = require("./package.json");

program
    .version(pjson.version)
    .usage('[command] <args>');

program.command("deploy")
    .description("Deploys a packaged version of an application")
    .option("-d, --destination <path>", "Deploy destination directory")
    .action(function(opts) {
        require('./lib/deploy')(opts, gulpRunner);
    });

program.command("udeploy")
    .description("Call uDeploy service and start deployment process")
    .option("-a, --application <name>", "Application name")
    .option("-p, --process <name>", "Process name")
    .option("-e, --environment <name>", "Environment name")
    .option("-c, --components <array>", "Artifact components as array")
    .option("-v, --versions <array>", "Artifact versions as array; optional")
    .option("-u, --username <name>", "uDeploy publisher username")
    .option("-w, --password <name>", "uDeploy publisher password")
    .action(function(opts) {
        require('./lib/udeploy')(opts, gulpRunner);
    });

program.command("launch")
    .description("Launches the newest deployed app")
    .option("-d, --destination <path>", "Deploy destination directory")
    .option("-w, --worker-count <number>", "Number of workers to launch")
    .option("-n, --name <name>", "Specify an app name")
    .option("-e, --env <env>", "Environment type (currently only 'redhat')")
    .action(function(cmd, opts) {
        require('./lib/launch')(cmd, opts, gulpRunner);
    })
    .on('--help', function() {
        console.log('  Sub-commands:');
        console.log();
        console.log('    start - Starts server instances');
        console.log('    stop - Stops server instances');
        console.log('    redeploy - Hot stop of old version and start of newest version');
        console.log();
    });

program.command("modules <cmd>")
    .description("Manages dependencies")
    .option("-p, --package <package>", "The specific package")
    .option("--uri <uri>", "Repo URI for publishing")
    .option("-u, --user <user>", "User for publishing")
    .option("--password <password>", "Password for publishing")
    .option("-e, --email <email>", "Registered e-mail for publishing")
    .action(function(cmd, opts) {
        require('./lib/modules')(cmd, opts, gulpRunner);
    })
    .on('--help', function() {
        console.log('  Sub-commands:');
        console.log();
        console.log('    package - Look for unpackaged modules and create them in modules directory');
        console.log('    explode - Look for missing modules in node_modules and install them');
        console.log();
    });

program.command("package")
    .description("Package the application or library")
    .option("-p, --path <path>", "The base path for packaging")
    .option("-s, --skip-modules", "Skip extracting dependent modules")
    .option("--patch", "When packaging a library, bump patch version (default)")
    .option("--minor", "When packaging a library, bump minor version")
    .option("--major", "When packaging a library, bump major version")
    .option("--no-bump", "When packaging a library, don't bump version")
    .option("--dependencies-only", "Only package dependencies", false)
    .action(function(opts) {
        require('./lib/package')(opts, gulpRunner);
    });

program.command("init <name>")
    .description("Create an app scaffold")
    .action(function(dest) {
        require('./lib/init')(dest, gulpRunner);
    });

program.command("build [target]")
    .description("Build the application")
    .option("-l, --list", "List available build targets")
    .option("-s, --skip-modules", "Skip extracting dependent modules")
    .option("-c, --clean-modules", "Clean node_modules before exploding")
    .action(function(cmd, opt) {
        notify();
        require('./lib/build')(cmd, opt, gulpRunner);
    });

program.command("test [target]")
    .description("Test the application")
    .option("-l, --list", "List available targets")
    .action(function(cmd, opt) {
        notify();
        require('./lib/test')(cmd, opt, gulpRunner);
    });    

program.command("app <task> [otherTasks...]")
    .description("[DEPRECATED - USE 'run']")
    .option("--debug-brk", "Start server and wait in debug mode (if supported by task)")
    .action(function(cmd, otherTasks, opt) {
        console.log(require("gulp-util").colors.red("'app' deprecated - use 'run'"));
        notify();
        var cmds = [[cmd]].concat(otherTasks.map(function(t) {
            return [t];
        }));
        require('./lib/app')(cmds, opt, gulpRunner);
    });

program.command("run <task> [otherTasks...]")
    .description("Run ad-hoc gulp tasks defined in your project (use \"ss tasks\" to see list) [replaces 'app' command]")
    .option("--debug-brk", "Start server and wait in debug mode (if supported by task)")
    .action(function(cmd, otherTasks, opt) {
        notify();
        var cmds = [[cmd]].concat(otherTasks.map(function(t) {
            return [t];
        }));
        require('./lib/app')(cmds, opt, gulpRunner);
    });

program.command("server [task]")
    .description("Manage development server")
    .option("-l, --list", "List available commands")
    .action(function(cmd, opt) {
        notify();
        require('./lib/server')(cmd, opt, gulpRunner);
    });

program.command("info [cmd]")
    .description("'tasks' - List help on available Gulp tasks (run with 'run')")
    .description("'phases' - List the available phase-based builds")
    .action(function(cmd, opt) {
        require('./lib/info')(cmd, opt, gulpRunner);
    });

program.command("help", {isDefault: true})
    .action(function(cmd) {
        console.log("Didn't understand that command... here is the help.");
        program.outputHelp();
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
