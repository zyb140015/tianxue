const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DEFAULT_DIFFICULTY = 'medium';
const DEFAULT_CATEGORY = 'other';
const REPOSITORY_URL = 'https://github.com/febobo/web-interview.git';
const OUTPUT_PATH = './question-import.febobo.json';

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/系列$/u, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || DEFAULT_CATEGORY;
}

function normalizeCategory(heading) {
  const name = heading.replace(/系列$/u, '').trim();
  const categoryMap = {
    Vue: { category: 'Vue', categorySlug: 'vue' },
    Vue3: { category: 'Vue3', categorySlug: 'vue3' },
    ES6: { category: 'JavaScript', categorySlug: 'javascript' },
    Javascript: { category: 'JavaScript', categorySlug: 'javascript' },
    CSS: { category: 'CSS', categorySlug: 'css' },
    webpack: { category: '工程化', categorySlug: 'engineering' },
    HTTP: { category: '网络', categorySlug: 'network' },
    NodeJS: { category: 'Node.js', categorySlug: 'nodejs' },
    React: { category: 'React', categorySlug: 'react' },
    '版本控制': { category: 'Git', categorySlug: 'git' },
    '操作系统': { category: '操作系统', categorySlug: 'os' },
    typescript: { category: 'TypeScript', categorySlug: 'typescript' },
    '算法': { category: '算法', categorySlug: 'algorithm' },
    '小程序': { category: '小程序', categorySlug: 'mini-program' },
    '设计模式': { category: '设计模式', categorySlug: 'design-pattern' },
  };

  return categoryMap[name] ?? { category: name || 'Other', categorySlug: slugify(name) };
}

function isQuestionLine(line) {
  return /^-\s+\[.+\]\(https:\/\/github\.com\/febobo\/web-interview\/issues\/\d+\)/u.test(line);
}

function parseQuestionLine(line, categoryInfo) {
  const match = line.match(/^-\s+\[(.+)\]\((https:\/\/github\.com\/febobo\/web-interview\/issues\/\d+)\)/u);

  if (!match) {
    return null;
  }

  const [, rawTitle, sourceUrl] = match;
  const title = rawTitle.replace(/^面试官：/u, '').trim();
  const tag = categoryInfo.category;

  return {
    title,
    content: '',
    answer: '',
    difficulty: DEFAULT_DIFFICULTY,
    category: categoryInfo.category,
    categorySlug: categoryInfo.categorySlug,
    tags: [tag],
    sourceName: 'febobo/web-interview',
    sourceUrl,
  };
}

function parseReadme(markdown) {
  const lines = markdown.split(/\r?\n/u);
  const questions = [];
  let categoryInfo = { category: 'Other', categorySlug: DEFAULT_CATEGORY };

  for (const line of lines) {
    const headingMatch = line.match(/^###\s+(.+)$/u) ?? line.match(/^<h3[^>]*>(.+)<\/h3>$/u);

    if (headingMatch) {
      categoryInfo = normalizeCategory(headingMatch[1]);
      continue;
    }

    if (!isQuestionLine(line)) {
      continue;
    }

    const question = parseQuestionLine(line, categoryInfo);

    if (question) {
      questions.push(question);
    }
  }

  return questions;
}

function cloneRepository(repositoryUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'question-index-'));
  execFileSync('git', ['clone', '--depth', '1', repositoryUrl, tempDir], { stdio: 'ignore' });
  return tempDir;
}

function loadVuePressConfig(repositoryRoot) {
  const configPath = path.join(repositoryRoot, 'docs', '.vuepress', 'config.js');
  return require(configPath);
}

function buildQuestionFromConfig(categoryTitle, child) {
  const [, questionTitle] = child;
  const categoryInfo = normalizeCategory(categoryTitle);

  return {
    title: questionTitle,
    content: '',
    answer: '',
    difficulty: DEFAULT_DIFFICULTY,
    category: categoryInfo.category,
    categorySlug: categoryInfo.categorySlug,
    tags: [categoryInfo.category],
    sourceName: 'febobo/web-interview',
    sourceUrl: '',
  };
}

function buildQuestionsFromConfig(repositoryRoot) {
  const config = loadVuePressConfig(repositoryRoot);
  const sidebar = config.themeConfig?.sidebar ?? [];

  return sidebar.flatMap((group) => {
    const children = Array.isArray(group.children) ? group.children : [];
    return children.map((child) => buildQuestionFromConfig(group.title ?? 'Other', child));
  });
}

async function main() {
  const [, , repositoryUrl = REPOSITORY_URL, outputFile = OUTPUT_PATH] = process.argv;
  const repositoryRoot = cloneRepository(repositoryUrl);
  let questions = [];

  try {
    questions = buildQuestionsFromConfig(repositoryRoot);
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  }

  if (questions.length === 0) {
    throw new Error('未解析到任何题目，请检查仓库配置或解析规则。');
  }

  const resolvedOutputPath = path.resolve(outputFile);
  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  process.stdout.write(`已生成题库索引: ${resolvedOutputPath}\n题目数量: ${questions.length}\n`);
}

module.exports = {
  normalizeCategory,
  parseQuestionLine,
  parseReadme,
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
