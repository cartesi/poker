const copyfiles = require("copyfiles");
const mkdirp = require("mkdirp");
const replace = require("replace-in-file");

function fix() {
    const options = {
        files: "dist/index.html",
        from: ' src="dist/bundle.js">',
        to: '>require("./app.js")',
    };
    const results = replace.sync(options);
    console.log(results);
}

function copy_and_fix() {
    mkdirp("dist").then(() => {
        copyfiles(["../webapp/index.html", "dist"], 2, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("Copied entrypoint");
                fix();
            }
        });
    });
}

copy_and_fix();
