
const { execSync } = require('child_process');

function generateCommitMessage(diffOutput) {
    if (!diffOutput || diffOutput.trim() === '') {
        return "chore: No significant changes detected";
    }

    const lines = diffOutput.split('
');
    const changes = {
        feat: [],
        fix: [],
        chore: [],
        docs: [],
        style: [],
        refactor: [],
        test: [],
        build: [],
        ci: [],
        perf: [],
        revert: []
    };

    lines.forEach(line => {
        if (line.startsWith('---') || line.startsWith('+++')) return; // Skip diff headers
        if (line.startsWith('diff --git')) return; // Skip diff command line

        // Try to identify keywords in the diff
        if (line.includes('function') || line.includes('class') || line.includes('const') || line.includes('let') || line.includes('var') || line.includes('return')) {
            changes.feat.push(line);
        }
        if (line.includes('bug') || line.includes('fix')) {
            changes.fix.push(line);
        }
        if (line.includes('doc') || line.includes('README')) {
            changes.docs.push(line);
        }
        if (line.includes('style') || line.includes('css') || line.includes('lint')) {
            changes.style.push(line);
        }
        if (line.includes('refactor')) {
            changes.refactor.push(line);
        }
        if (line.includes('test')) {
            changes.test.push(line);
        }
        if (line.includes('package.json') || line.includes('node_modules')) {
            changes.build.push(line);
        }
        if (line.includes('ci')) {
            changes.ci.push(line);
        }
        if (line.includes('performance') || line.includes('optimize')) {
            changes.perf.push(line);
        }
        if (line.includes('revert')) {
            changes.revert.push(line);
        }
        // Generic changes
        changes.chore.push(line);
    });

    let message = [];

    if (changes.feat.length > 0) message.push('feat: Add/update features');
    if (changes.fix.length > 0) message.push('fix: Address identified issues');
    if (changes.docs.length > 0) message.push('docs: Update documentation');
    if (changes.style.length > 0) message.push('style: Adjust code style/formatting');
    if (changes.refactor.length > 0) message.push('refactor: Improve code structure');
    if (changes.test.length > 0) message.push('test: Enhance test coverage');
    if (changes.build.length > 0) message.push('build: Update build configurations');
    if (changes.ci.length > 0) message.push('ci: Modify CI/CD pipeline');
    if (changes.perf.length > 0) message.push('perf: Improve performance');
    if (changes.revert.length > 0) message.push('revert: Revert previous changes');

    if (message.length === 0) {
        message.push('chore: Make various changes');
    }

    // Attempt to be more specific if possible
    if (diffOutput.includes('package.json')) {
        return 'build: Update dependencies or scripts';
    }
    if (diffOutput.includes('README.md')) {
        return 'docs: Update README';
    }
    if (diffOutput.includes('.css')) {
        return 'style: Update CSS styles';
    }
    if (diffOutput.includes('.js') || diffOutput.includes('.ts')) {
        if (diffOutput.includes('function') || diffOutput.includes('class')) {
            return 'feat: Implement new functionality';
        }
        if (diffOutput.includes('bug')) {
            return 'fix: Resolve JavaScript/TypeScript bug';
        }
    }


    return message[0]; // Return the first detected type for conciseness
}

try {
    let diffOutput;
    let commitMessage;

    // Try staged changes first
    try {
        diffOutput = execSync('git diff --staged', { encoding: 'utf8' });
    } catch (error) {
        // If git diff --staged fails (e.g., no staged changes), continue
        diffOutput = '';
    }

    if (diffOutput.trim() === '') {
        // If no staged changes, try all changes
        try {
            diffOutput = execSync('git diff', { encoding: 'utf8' });
        } catch (error) {
            console.error('Error getting git diff:', error.message);
            process.exit(1);
        }
    }

    if (diffOutput.trim() === '') {
        console.log("No changes to commit.");
        process.exit(0);
    }

    commitMessage = generateCommitMessage(diffOutput);
    console.log(`Generated commit message: "${commitMessage}"`);

    // Add all changes before committing
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    console.log('Successfully committed changes.');

} catch (error) {
    console.error('Failed to commit changes:', error.message);
    process.exit(1);
}
