const { spawn } = require('node:child_process');

const API_BASE_URLS = {
  test: 'http://127.0.0.1:18084/api/v1',
  production: 'https://xnyb.online/tianxue/api/v1',
};

const [, , profile, ...expoArgs] = process.argv;

if (!profile || !(profile in API_BASE_URLS)) {
  process.stderr.write(
    `Usage: node scripts/run-expo-with-env.cjs <test|production> <expo args...>\n`,
  );
  process.exit(1);
}

if (expoArgs.length === 0) {
  process.stderr.write('Missing Expo command arguments.\n');
  process.exit(1);
}

const expoCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(expoCommand, ['expo', ...expoArgs], {
  stdio: 'inherit',
  env: {
    ...process.env,
    EXPO_PUBLIC_API_BASE_URL: API_BASE_URLS[profile],
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
