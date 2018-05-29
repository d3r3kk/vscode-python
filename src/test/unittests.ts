// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

'use strict';

// tslint:disable:no-any no-require-imports no-var-requires

if ((Reflect as any).metadata === undefined) {
    require('reflect-metadata');
}
import * as glob from 'glob';
import * as Mocha from 'mocha';
import * as path from 'path';
import { MochaSetupOptions } from 'vscode/lib/testrunner';
import * as vscodeMoscks from './vscode-mock';

export function runTests(testOptions?: { grep?: string; timeout?: number; reporter? : string; reporterOpts? : string }) {
    vscodeMoscks.initialize();

    const grep: string | undefined = testOptions ? testOptions.grep : undefined;
    const timeout: number | undefined = testOptions ? testOptions.timeout : undefined;
    const reporter: string | undefined = testOptions ? testOptions.reporter : undefined;
    //const reporterOptions: any | undefined = testOptions ? testOptions.reporterOpts : undefined;

    const options: MochaSetupOptions = {
        ui: 'tdd',
        useColors: true,
        timeout,
        grep,
        reporter
    };
    const mocha = new Mocha(options);
    require('source-map-support').install();
    const testsRoot = __dirname;
    glob('**/**.unit.test.js', { cwd: testsRoot }, (error, files) => {
        if (error) {
            return reportErrors(error);
        }
        try {
            files.forEach(file => mocha.addFile(path.join(testsRoot, file)));
            mocha.run(failures => {
                if (failures === 0) {
                    return;
                }
                reportErrors(undefined, failures);
            });
        } catch (error) {
            reportErrors(error);
        }
    });
}
function reportErrors(error?: Error, failures?: number) {
    let failed = false;
    if (error) {
        console.error(error);
        failed = true;
    }
    if (failures && failures >= 0) {
        console.error(`${failures} failed tests 👎.`);
        failed = true;
    }
    if (failed) {
        process.exit(1);
    }
}
// this allows us to run hygiene as a git pre-commit hook or via debugger.
if (require.main === module) {
    // When running from debugger, allow custom args.
    const args = process.argv0.length > 2 ? process.argv.slice(2) : [];
    const timeoutArgIndex = args.findIndex(arg => arg.startsWith('timeout='));
    const grepArgIndex = args.findIndex(arg => arg.startsWith('grep='));
    const reporterArgIndex = args.findIndex(arg => arg.startsWith('reporter='));
    //const reporterOptsIndex = args.findIndex(arg => arg.startsWith('reporterOptions='));
    const timeout: number | undefined = timeoutArgIndex >= 0 ? parseInt(args[timeoutArgIndex].split('=')[1].trim(), 10) : undefined;
    let grep: string | undefined = grepArgIndex >= 0 ? args[grepArgIndex].split('=')[1].trim() : undefined;
    grep = grep && grep.length > 0 ? grep : undefined;
    const reporter: string | undefined = reporterArgIndex >= 0 ? args[reporterArgIndex].split('=')[1].trim() : undefined;
//    const reporterOpts: string | undefined = reporterOptsIndex >= 0 ? args[reporterOptsIndex].split('=')[1].trim() : undefined;

//    runTests({ grep, timeout, reporter, reporterOpts });
    runTests({ grep, timeout, reporter });
}
