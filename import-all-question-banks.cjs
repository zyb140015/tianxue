const { execFileSync } = require('node:child_process');

function runImportScript(scriptName) {
  execFileSync(process.execPath, [scriptName], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

function main() {
  runImportScript('./import-question-bank.cjs');
  runImportScript('./import-haizlin-question-bank.cjs');
}

main();
