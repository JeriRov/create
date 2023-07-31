#! /usr/bin/env node

const fs = require('fs');
const {spawn} = require('child_process');
const degit = require('degit');
const args = require('args');

args
    .option('express', 'The name of the directory to create.')
    .examples([{
        usage: '@artemmahey/create --express my-api',
        description: 'Create express api in directory my-api',
    }])

    .option('react', 'The name of the directory to create.')
    .examples([{
        usage: '@artemmahey/create --react my-app',
        description: 'Create react app in directory my-app',
    }, {
        usage: '@artemmahey/create --express --react my-app',
        description: 'Create fullstack app in directory my-app',
    }]);

const flags = args.parse(process.argv, {
    name: '@artemmahey/create',
});

import('chalk').then(({default: chalk}) => {
    function errorLog(message) {
        if(message.includes('WARN')) {
            console.log(chalk.yellow.bgBlack(message));
            return;
        }
        console.log(chalk.red.bgBlack(message));
    }

    let express = 'e';
    let react = 'r';

    let dirName = '';
    let repoName = '';
    let howToStartMessage = '';
    switch (!!flags) {
        case flags.hasOwnProperty(express) && flags.hasOwnProperty(react):
            dirName = typeof flags[express] === 'string' ? flags[express] : flags[react];
            repoName = 'fullstack';
            howToStartMessage = `cd backend \nnpm run dev \ncd ../frontend \nnpm start`
            break;
        case flags.hasOwnProperty(express):
            dirName = flags[express]
            repoName = 'JeriRov/express-ts-template.git';
            howToStartMessage = `npm run dev`
            break;
        case flags.hasOwnProperty(react):
            dirName = flags[react];
            repoName = 'JeriRov/react-ts-template.git';
            howToStartMessage = `npm start`
            break;
        default:
            errorLog('Error: Please specify a template.');
    }

    if (typeof dirName !== 'string' || RegExp(/[<>:"\/\\|?*\x00-\x1F]/).exec(dirName)) {
        errorLog(`Error: Missing or Invalid directory name: "${dirName}"`);
        args.showHelp();
        process.exit(-1);
    }

    if (fs.existsSync(dirName)) {
        errorLog(`Error: Directory "${dirName}" already exists.`);
        process.exit(-1);
    }

    function runCommand(command, args, options = undefined) {
        const spawned = spawn(command, args, options);
        return new Promise((resolve) => {
            spawned.stdout.on('data', (data) => {
                console.log(chalk.bgBlack.white(data.toString()));
            });

            spawned.stderr.on('data', (data) => {
                errorLog(data.toString());
            });

            spawned.on('close', () => {
                resolve();
            });
        });
    }

    function cloneRepo(dirName, repoName, howToStartMessage) {
        const emitter = degit(repoName, {
            force: true,
            verbose: true,
        });

        emitter.on('info', (info) => {
            console.log(info.message);
        });

        emitter.clone(dirName).then(() => {
            console.log(chalk.bgBlack.cyan('Installing dependencies...'));
            const command = /^win/.test(process.platform) ? 'npm.cmd' : 'npm';
            return runCommand(command, ['install'], {
                cwd: `${process.cwd()}/${dirName}`,
            }).then(() => {
                if(howToStartMessage) {
                    console.log(chalk.bgBlack.cyan('Done!'));
                    console.log('');
                    console.log(chalk.bgBlack.white('To get started:'));
                    console.log(chalk.bgBlack.cyan(`cd ${dirName}`));
                    console.log(chalk.bgBlack.cyan(howToStartMessage));
                }
            });
        });
    }

    if(repoName === 'fullstack') {
        cloneRepo(`${dirName}/backend`, 'JeriRov/express-ts-template.git', undefined);
        cloneRepo(`${dirName}/frontend`, 'JeriRov/react-ts-template.git', howToStartMessage);
        return;
    }
    cloneRepo(dirName, repoName, howToStartMessage);
});
