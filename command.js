#!/usr/bin/env node

// add bower components to packaging
// naught for stop/start

var _ = require("lodash"),
    program = require("commander"),
    path = require("path"),
    gulp = require("./lib/gulp"),
    runSequence = require("run-sequence").use(gulp),
    gutil = require("gulp-util"),
    pjson = require("./package.json"),
    help = require("gulp-help");

help(gulp, { 
    description: "This task is what makes the 'tasks' command work"
});

var gulpRunner = function(err, runCmd) {
    if (err) {
        gutil.log(err);
        return;
    }

    gulp.on("task_err", function(e) {
        gutil.log(e.err);
        process.exit(1);
    });

    gulp.on("task_end", function(name) {
        gutil.log("Task ended " + name);
    });

    if (Array.isArray(runCmd)) {
        runSequence.apply(this, runCmd);
    } else if (typeof runCmd === "string") {
        runSequence(runCmd);
    }
};

program
    .version(pjson.version)
    .usage('[command] <args>');

program.command("deploy")
    .description("Deploys a packaged version of an application")
    .option("-d, --destination <path>", "Deploy destination directory")
    .action(function(opts) {
        require('./lib/deploy')(opts, gulpRunner);
    });

program.command("launch")
    .description("Launches the newest deployed app")
    .option("-d, --destination <path>", "Deploy destination directory")
    .option("-w, --worker-count <number>", "Number of workers to launch")
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
    .option("--patch", "When packaging a library, bump patch version (default)")
    .option("--minor", "When packaging a library, bump minor version")
    .option("--major", "When packaging a library, bump major version")
    .option("--no-bump", "When packaging a library, don't bump version")
    .option("--dependencies-only", "Only package dependencies", false)
    .action(function(opts) {
        require('./lib/package')(opts, gulpRunner);
    });

program.command("init")
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
        require('./lib/app')(true, cmd, opt, gulpRunner);
    });

program.command("app <task> [otherTasks...]")
    .description("Run ad-hoc gulp tasks defined in your project (use \"ss tasks\" to see list)")
    .option("--debug-brk", "Start server and wait in debug mode (if supported by task)")
    .action(function(cmd, otherTasks, opt) {
        var cmds = [[cmd]].concat(otherTasks.map(function(t) {
            return [t];
        }));
        require('./lib/app')(false, cmds, opt, gulpRunner);
    });

program.command("tasks")
    .description("List help on available Gulp tasks (run with 'app')")
    .action(function(cmd, opt) {
        require('./lib/tasks')(opt, gulpRunner);
    });

program.command("server <task>")
    .description("Manage development server")
    .option("-l, --list", "List available commands")
    .action(function(cmd, opt) {
        require('./lib/server')(cmd, opt, gulpRunner);
    });

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}