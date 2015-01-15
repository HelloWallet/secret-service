var path = require('path');

module.exports = function(grunt) {
    var cwd = process.cwd();
    process.chdir(path.join(__dirname, ".."));

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-shell");
    grunt.loadNpmTasks("grunt-scp");
    require("grunt-config-merge")(grunt);

    process.chdir(cwd);
    grunt.file.base = cwd;

    grunt.initConfig({
        pkg: { },
        loadConfig: {
            package: {
                options: {
                    dir: cwd,
                    loadGrunt: true
                }
            }
        }
    });

    grunt.initConfig = grunt.mergeConfig;   
}