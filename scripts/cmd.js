const path = require('path');
const childProcess = require('child_process');
const fixPath = require('fix-path')
const cp = require('child_process')
const {logdir} = require("./constants");
const { exec } = require('child_process')
const { PythonShell } = require('python-shell');
const crypto = require('crypto')

fixPath();

const _hash = crypto.createHash('md5')

const md5 = (str) => _hash.update(str).digest('hex')

const python_options = {
    pythonPath: path.join(__dirname, '.venv', 'bin', 'python3.7')
}

const _runPython = (args, callback) =>{
    let options = {
        args: args
    }
    options = Object.assign({}, options, python_options);
    PythonShell.run(path.join(__dirname,'blt.py'), options, callback);
}

const _command = (cmd) =>{
    return new Promise(resolve => {
        exec(cmd,(err,stdout,stderr)=>{
            resolve({'err':err,'stdout':stdout,'stderr':stderr})
        })
    })
}

const _run_cmd = (cmd) => {
    // hash is the key to the cmd so we can check if the cmd is currently running and get the pid
    const hash = md5(cmd)
    
}

const _cmd_detached = (cwd, cmd, argv0) => {
    const fs = require('fs');
    const log = path.join(logdir,'blt-buddy-out.log');
    const out = fs.openSync(log, 'a');
    const err = fs.openSync(log, 'a');

    const child = cp.spawn(cmd, argv0, {cwd: cwd, detached: true, stdio: ['ignore', out, err]});
    child.unref();
    return child
}

exports.runScript = (scriptPath, callback) => {

    // keep track of whether callback has been invoked to prevent multiple invocations
    let invoked = false;

    const process = childProcess.fork(scriptPath);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', function (err) {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', function (code) {
        if (invoked) return;
        invoked = true;
        const err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });
}

exports.cmd_detached = (cwd,cmd,argv0) =>{
    return _cmd_detached(cwd,cmd,argv0)
}

exports.command = async (cmd) => {
    return _command(cmd)
}

exports.resolveHome = (filepath) => {
    if (filepath[0] === '~')
        return path.join(process.env.HOME, filepath.slice(1));
    return filepath;
}

exports.runPython = (args, callback) =>{
    _runPython(args,callback)
}