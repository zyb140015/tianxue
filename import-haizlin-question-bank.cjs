const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const REPOSITORY_URL = 'https://github.com/haizlin/fe-interview.git';
const INDEX_JSON_PATH = './question-import.haizlin.json';
const FULL_JSON_PATH = './question-import.haizlin.full.json';
const SQL_PATH = './question-import.haizlin.sql';
const FAILED_JSON_PATH = './question-import.haizlin.failed.json';
const MYSQL_CONTAINER_NAME = 'app-backend-mysql';
const MYSQL_DATABASE_NAME = 'frontend_interview_app';
const MYSQL_USER = 'root';
const MYSQL_PASSWORD = 'root';
const MYSQL_CHARSET = 'utf8mb4';
const IMPORT_SOURCE_NAME = 'haizlin/fe-interview';

function loadQuestions() {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, FULL_JSON_PATH), 'utf8'));
}

function buildSqlStringList(values) {
  return values.map((value) => `'${String(value).replace(/'/g, "\\'")}'`).join(', ');
}

function runNodeScript(scriptPath, args = []) {
  execFileSync(process.execPath, [scriptPath, ...args], {
    cwd: __dirname,
    stdio: 'inherit',
  });
}

function removeFileIfExists(filePath) {
  const resolvedPath = path.resolve(__dirname, filePath);

  if (fs.existsSync(resolvedPath)) {
    fs.rmSync(resolvedPath);
  }
}

function importSqlFile(sqlFilePath) {
  const sqlBuffer = fs.readFileSync(path.resolve(__dirname, sqlFilePath));
  const importResult = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      MYSQL_CONTAINER_NAME,
      'mysql',
      `--default-character-set=${MYSQL_CHARSET}`,
      `-u${MYSQL_USER}`,
      `-p${MYSQL_PASSWORD}`,
      MYSQL_DATABASE_NAME,
    ],
    {
      cwd: __dirname,
      input: sqlBuffer,
      stdio: ['pipe', 'inherit', 'inherit'],
    },
  );

  if (importResult.status !== 0) {
    throw new Error('SQL 导入失败。');
  }
}

function cleanupImportedRows(questions) {
  const categorySlugs = [...new Set(questions.map((question) => question.categorySlug).filter(Boolean))];
  const tagNames = [...new Set(questions.flatMap((question) => question.tags ?? []).filter(Boolean))];
  const cleanupStatements = [
    `DELETE qt FROM question_tags qt INNER JOIN questions q ON q.id = qt.question_id WHERE q.source_name = '${IMPORT_SOURCE_NAME}';`,
    `DELETE FROM questions WHERE source_name = '${IMPORT_SOURCE_NAME}';`,
  ];

  if (tagNames.length > 0) {
    cleanupStatements.push(
      `DELETE FROM tags WHERE name IN (${buildSqlStringList(tagNames)}) AND NOT EXISTS (SELECT 1 FROM question_tags WHERE question_tags.tag_id = tags.id);`,
    );
  }

  if (categorySlugs.length > 0) {
    cleanupStatements.push(
      `DELETE FROM categories WHERE slug IN (${buildSqlStringList(categorySlugs)}) AND NOT EXISTS (SELECT 1 FROM questions WHERE questions.category_id = categories.id);`,
    );
  }

  execFileSync(
    'docker',
    [
      'exec',
      '-i',
      MYSQL_CONTAINER_NAME,
      'mysql',
      `--default-character-set=${MYSQL_CHARSET}`,
      `-u${MYSQL_USER}`,
      `-p${MYSQL_PASSWORD}`,
      MYSQL_DATABASE_NAME,
      '-e',
      cleanupStatements.join(' '),
    ],
    {
      cwd: __dirname,
      stdio: 'inherit',
    },
  );
}

function verifyImportedCount() {
  execFileSync(
    'docker',
    [
      'exec',
      MYSQL_CONTAINER_NAME,
      'mysql',
      `--default-character-set=${MYSQL_CHARSET}`,
      `-u${MYSQL_USER}`,
      `-p${MYSQL_PASSWORD}`,
      '-D',
      MYSQL_DATABASE_NAME,
      '-e',
      `SELECT COUNT(*) AS question_count FROM questions WHERE source_name = '${IMPORT_SOURCE_NAME}';`,
    ],
    {
      cwd: __dirname,
      stdio: 'inherit',
    },
  );
}

function main() {
  removeFileIfExists(FULL_JSON_PATH);
  removeFileIfExists(FAILED_JSON_PATH);
  runNodeScript('./crawl-haizlin-question-index.cjs', [REPOSITORY_URL, INDEX_JSON_PATH]);
  runNodeScript('./crawl-haizlin-question-content.cjs', [REPOSITORY_URL, INDEX_JSON_PATH, FULL_JSON_PATH]);
  const questions = loadQuestions();
  runNodeScript('./generate-question-import-sql.cjs', [FULL_JSON_PATH, SQL_PATH]);
  cleanupImportedRows(questions);
  importSqlFile(SQL_PATH);
  verifyImportedCount();
}

main();
