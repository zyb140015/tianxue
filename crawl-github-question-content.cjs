const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const REPOSITORY_URL = 'https://github.com/febobo/web-interview.git';
const OUTPUT_PATH = './question-import.febobo.full.json';
const DEFAULT_DIFFICULTY = 'medium';
const SUMMARY_MAX_LENGTH = 180;
const MARKDOWN_EXTENSION = '.md';

function cloneRepository(repositoryUrl) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'question-content-'));
  execFileSync('git', ['clone', '--depth', '1', repositoryUrl, tempDir], { stdio: 'ignore' });
  return tempDir;
}

function loadVuePressConfig(repositoryRoot) {
  const configPath = path.join(repositoryRoot, 'docs', '.vuepress', 'config.js');
  return require(configPath);
}

function normalizeCategoryTitle(title) {
  return String(title).replace(/系列.*$/u, '').trim();
}

function normalizeCategory(categoryTitle) {
  const name = normalizeCategoryTitle(categoryTitle);
  const categoryMap = {
    Vue: { category: 'Vue', categorySlug: 'vue' },
    Vue3: { category: 'Vue3', categorySlug: 'vue3' },
    ES6: { category: 'JavaScript', categorySlug: 'javascript' },
    JavaScript: { category: 'JavaScript', categorySlug: 'javascript' },
    CSS: { category: 'CSS', categorySlug: 'css' },
    Webpack: { category: '工程化', categorySlug: 'engineering' },
    HTTP: { category: '网络', categorySlug: 'network' },
    NodeJS: { category: 'Node.js', categorySlug: 'nodejs' },
    React: { category: 'React', categorySlug: 'react' },
    typescript: { category: 'TypeScript', categorySlug: 'typescript' },
    '版本控制': { category: 'Git', categorySlug: 'git' },
    '操作系统': { category: '操作系统', categorySlug: 'os' },
    '算法': { category: '算法', categorySlug: 'algorithm' },
    '小程序': { category: '小程序', categorySlug: 'mini-program' },
    '设计模式': { category: '设计模式', categorySlug: 'design-pattern' },
  };

  return categoryMap[name] ?? { category: name, categorySlug: name.toLowerCase() };
}

function stripMarkdown(markdown) {
  return markdown
    .replace(/^#\s+.+$/mu, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, '')
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^>\s?/gmu, '')
    .replace(/^[-*]\s+/gmu, '')
    .replace(/^#{2,6}\s+/gmu, '')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractSummary(text) {
  const paragraphs = text
    .split(/\n\n+/u)
    .map((item) => item.replace(/\n/g, ' ').trim())
    .filter(Boolean);
  const summary = paragraphs[0] ?? '';

  if (summary.length <= SUMMARY_MAX_LENGTH) {
    return summary;
  }

  return `${summary.slice(0, SUMMARY_MAX_LENGTH).trim()}...`;
}

function buildSourceUrl(relativeDocPath) {
  const normalizedPath = relativeDocPath.split(path.sep).join('/');
  return `https://github.com/febobo/web-interview/blob/master/docs/${normalizedPath}${MARKDOWN_EXTENSION}`;
}

function buildQuestion(repositoryRoot, categoryTitle, child) {
  const [relativeDocPath, questionTitle] = child;
  const { category, categorySlug } = normalizeCategory(categoryTitle);
  const markdownPath = path.join(repositoryRoot, 'docs', `${relativeDocPath}${MARKDOWN_EXTENSION}`);
  const markdown = fs.readFileSync(markdownPath, 'utf8');
  const answer = stripMarkdown(markdown);
  const content = extractSummary(answer);

  return {
    title: questionTitle,
    content,
    answer,
    difficulty: DEFAULT_DIFFICULTY,
    category,
    categorySlug,
    tags: [category],
    sourceName: 'febobo/web-interview',
    sourceUrl: buildSourceUrl(relativeDocPath),
  };
}

function buildQuestions(repositoryRoot) {
  const config = loadVuePressConfig(repositoryRoot);
  const sidebar = config.themeConfig?.sidebar ?? [];

  return sidebar.flatMap((group) => {
    const categoryTitle = group.title ?? 'Other';
    const children = Array.isArray(group.children) ? group.children : [];
    return children.map((child) => buildQuestion(repositoryRoot, categoryTitle, child));
  });
}

function main() {
  const [, , repositoryUrl = REPOSITORY_URL, outputFile = OUTPUT_PATH] = process.argv;
  const repositoryRoot = cloneRepository(repositoryUrl);

  try {
    const questions = buildQuestions(repositoryRoot);
    const resolvedOutputPath = path.resolve(outputFile);
    fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
    process.stdout.write(`已生成完整题库: ${resolvedOutputPath}\n题目数量: ${questions.length}\n`);
  } finally {
    fs.rmSync(repositoryRoot, { recursive: true, force: true });
  }
}

main();
