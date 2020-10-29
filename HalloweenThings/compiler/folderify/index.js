const path = require('path');
const fs = require('fs');
const Compiler = () => require("../compiler/compiler")

module.exports = require('browserify-transform-tools').makeRequireTransform(
  'folderify', {
    jsFilesOnly: true,
    evaluateArguments: true,
    falafelOptions: { ecmaVersion: 8 }
  },
  function(args, opts, done) {
    let pattern = args[0];

    if(!pattern.endsWith("/")) {
      return done()
    }

    if (args.length !== 1 || typeof args[0] !== 'string') {
      return done();
    }

    let config = args[1] || {}

    config.resolve = ["path-reduce", "strip-ext"];
    if (!Array.isArray(config.resolve)) {
      config.resolve = [config.resolve];
    }

    let mode = require("./modes/list")
    let dir

    if(pattern.startsWith(".")) {
      dir = path.resolve(path.dirname(opts.file), pattern)
    } else {
      dir = Compiler().path(pattern)
    }

    fs.promises.stat(dir).then(result => {
      if(result.isDirectory()) {
        return fs.promises.readdir(dir)
      } else {
        done()
      }
    }).then(files => {
      files = files.map(a => path.resolve(dir, a))
      done(null, mode(opts.file, files, config));
    }).catch(error => {
      done(error, null)
    })
  }
);
