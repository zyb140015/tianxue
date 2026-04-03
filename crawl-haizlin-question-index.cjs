const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DEFAULT_DIFFICULTY = 'medium';
const REPOSITORY_URL = 'https://github.com/haizlin/fe-interview.git';
const OUTPUT_PATH = './question-import.haizlin.json';
const SOURCE_NAME = 'haizlin/fe-interview';
const MARKDOWN_DIRECTORIES = ['category', 'lib', 'tools'];
const IGNORED_MARKDOWN_FILES = new Set(['all.md', 'history.md', 'week.md']);
const QUESTION_LINK_PATTERN = /-\s+\[(.+?)\]\((https:\/\/github\.com\/haizlin\/fe-interview\/issues\/\d+)\)/gu;

function slugify(value) {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'other';
}

function normalizeCategory(fileName) {
  const baseName = path.basename(fileName, '.md');
  const categoryMap = {
    html: { category: 'HTML', categorySlug: 'html' },
    css: { category: 'CSS', categorySlug: 'css' },
    js: { category: 'JavaScript', categorySlug: 'javascript' },
    ECMAScript: { category: 'JavaScript', categorySlug: 'javascript' },
    nodejs: { category: 'Node.js', categorySlug: 'nodejs' },
    skill: { category: '软技能', categorySlug: 'soft-skills' },
    Vue: { category: 'Vue', categorySlug: 'vue' },
    React: { category: 'React', categorySlug: 'react' },
    AngularJs: { category: 'AngularJS', categorySlug: 'angularjs' },
    jQuery: { category: 'jQuery', categorySlug: 'jquery' },
    wxapp: { category: '小程序', categorySlug: 'mini-program' },
    webpack: { category: '工程化', categorySlug: 'engineering' },
  };

  return categoryMap[baseName] ?? { category: baseName, categorySlug: slugify(baseName) };
}

function cloneRepository(repositoryUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'haizlin-question-index-'));
  execFileSync('git', ['clone', '--depth', '1', repositoryUrl, tempDir], { stdio: 'ignore' });
  return tempDir;
}

function listMarkdownFiles(repositoryRoot) {
  return MARKDOWN_DIRECTORIES.flatMap((directoryName) => {
    const directoryPath = path.join(repositoryRoot, directoryName);

    if (!fs.existsSync(directoryPath)) {
      return [];
    }

    return fs
      .readdirSync(directoryPath)
      .filter((fileName) => fileName.endsWith('.md') && !IGNORED_MARKDOWN_FILES.has(fileName))
      .map((fileName) => ({
        fileName,
        filePath: path.join(directoryPath, fileName),
      }));
  });
}

function parseQuestionLinks(markdown, fileName) {
  const { category, categorySlug } = normalizeCategory(fileName);
  const questions = [];
  const matches = markdown.matchAll(QUESTION_LINK_PATTERN);

  for (const match of matches) {
    const [, title, sourceUrl] = match;

    questions.push({
      title: title.trim(),
      content: '',
      answer: '',
      difficulty: DEFAULT_DIFFICULTY,
      category,
      categorySlug,
      tags: [category],
      sourceName: SOURCE_NAME,
      sourceUrl,
    });
  }

  return questions;
}

function dedupeQuestions(questions) {
  const seen = new Set();

  return questions.filter((question) => {
    const dedupeKey = `${question.title}::${question.sourceUrl}`;

    if (seen.has(dedupeKey)) {
      return false;
    }

    seen.add(dedupeKey);
    return true;
  });
}

function buildQuestions(repositoryRoot) {
  const markdownFiles = listMarkdownFiles(repositoryRoot);
  const questions = markdownFiles.flatMap(({ fileName, filePath }) => {
    const markdown = fs.readFileSync(filePath, 'utf8');
    return parseQuestionLinks(markdown, fileName);
  });

  return dedupeQuestions(questions);
}

function main() {
  const [, , repositoryUrl = REPOSITORY_URL, outputFile = OUTPUT_PATH] = process.argv;
  const repositoryRoot = cloneRepository(repositoryUrl);

  try {
    const questions = buildQuestions(repositoryRoot);

    if (questions.length === 0) {
      throw new Error('未解析到任何题目，请检查仓库结构或解析规则。');
    }

    const resolvedOutputPath = path.resolve(outputFile);
    fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
    process.stdout.write(`已生成题库索引: ${resolvedOutputPath}\n题目数量: ${questions.length}\n`);
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  }
}

if (require.main === module) {
  main();
}
