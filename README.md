# secret-service
Centralizes developer build, deployment packaging, and server process management in a single tool.

## Main features

- Manages builds
	- Wraps gulp with a configuration system
	- Can merge tasks from application as well as dependencies
	- Supports a phased build process to let multiple libraries hook into build process

- Local server
	- Watch support

- Deployment
	- Provides module packaging for deployment security
	- Generates application packages
	- Automates target server extraction`
	- Automates hot-launch sequence using naught

## Usage

### Building a Capitol app

Building an application works by loading the capitol.json file from the project, as well as from any packages in node_modules, and then loading all tasks, and kicking off the tasks specified in the configuration to run in each of ss's build phases.

It can include configruations for any number of builds, but the common setup is a dev vs. prod build.

```
secret-service build {{dev/prod}}
```

### Using packaged dependendencies

#### Installing a new depedency

To install a new dependency, use npm --save/--save-dev like usual, but after installing, use the following command to package the file:
```
secret-service modules package
```

This will create a .ZIP file in the modules/ directory of your package.

#### Installing dependencies from modules

To explode a module, use the following command to check your compare your current node_modules files to the module dependencies:
```
secret-service modules explode
```

And to just run the check sequence:
```
secret-service modules check
```


### Other commands

#### Running ad-hoc gulp tasks

Most of the specialized commands above really just kick off gulp tasks in a more pre-defined way, but you can start individual gulp tasks using:

```
secret-service app {{commands...}}
```

To see a list of available tasks and any associated help with the task, just do:

```
secret-service tasks
```

### Project configuration

#### capitol.json

This is the primary configuration file of the Capitol framework, and for secret-service.

#### Add a task

In a tasks subdirectory of your project, add a task file that matches the pattern "ss-*.js". In it, export a function with the signature:

```
module.exports = function(gulp, config) {

	gulp.task("my-task", function() {
		...
	});

};
```

You will get a single gulp instance across all task files and modules. The configuration object will be a merged version of the capitol.json files found in the main project and dependencies.