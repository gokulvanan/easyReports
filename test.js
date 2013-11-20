#!/usr/bin/env node

try {
    var reporter = require('nodeunit').reporters.default;
    process.chdir(__dirname);
	reporter.run(['test']);
} catch(e) {
    console.log("Cannot find nodeunit module.");
    console.log("You can download submodules for this project by doing:");
    console.log("");
    console.log("    git submodule init");
    console.log("    git submodule update");
    console.log("");
    process.exit();
}

