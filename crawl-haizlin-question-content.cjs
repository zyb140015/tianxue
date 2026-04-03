const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

const REPOSITORY_URL = 'https://github.com/haizlin/fe-interview.git';
const INPUT_PATH = './question-import.haizlin.json';
const OUTPUT_PATH = './question-import.haizlin.full.json';
const DEFAULT_DIFFICULTY = 'medium';
const SUMMARY_MAX_LENGTH = 180;
const EMBEDDED_DATA_PATTERN = /<script type="application\/json" data-target="react-app\.embeddedData">([\s\S]*?)<\/script>/u;
const REQUEST_CONCURRENCY = 4;
const REQUEST_RETRY_LIMIT = 2;
const REQUEST_TIMEOUT_MS = 20000;
const RETRY_DELAY_MS = 1000;
const CHECKPOINT_BATCH_SIZE = 20;
const FAILED_OUTPUT_PATH = './question-import.haizlin.failed.json';
const DELETED_ISSUE_MARKER = 'This issue has been deleted.';
const DELETED_ISSUE_MESSAGE = '原始 GitHub issue 已删除，无法抓取原始正文与回答。';

function readQuestions(inputFile) {
  return JSON.parse(fs.readFileSync(path.resolve(inputFile), 'utf8'));
}

function readExistingQuestions(outputFile) {
  const resolvedOutputPath = path.resolve(outputFile);

  if (!fs.existsSync(resolvedOutputPath)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(resolvedOutputPath, 'utf8'));
}

function writeQuestions(outputFile, questions) {
  const resolvedOutputPath = path.resolve(outputFile);
  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
}

function writeFailedQuestions(failedQuestions) {
  const resolvedOutputPath = path.resolve(FAILED_OUTPUT_PATH);
  fs.writeFileSync(resolvedOutputPath, `${JSON.stringify(failedQuestions, null, 2)}\n`, 'utf8');
}

function stripMarkdown(markdown) {
  return String(markdown)
    .replace(/```[\s\S]*?```/gu, '')
    .replace(/`([^`]+)`/gu, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/^>\s?/gmu, '')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/^[-*+]\s+/gmu, '')
    .replace(/^\d+\.\s+/gmu, '')
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

function delay(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      },
      (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();
          resolve(fetchText(response.headers.location));
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`请求失败: ${response.statusCode} ${url}`));
          return;
        }

        let data = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          resolve(data);
        });
      },
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error(`请求超时: ${url}`));
    });

    request.on('error', reject);
  });
}

async function fetchTextWithRetry(url) {
  let lastError = null;

  for (let attempt = 0; attempt <= REQUEST_RETRY_LIMIT; attempt += 1) {
    try {
      return await fetchText(url);
    } catch (error) {
      lastError = error;
      if (attempt < REQUEST_RETRY_LIMIT) {
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError;
}

function extractIssuePayload(html, sourceUrl) {
  const match = html.match(EMBEDDED_DATA_PATTERN);

  if (!match) {
    if (html.includes(DELETED_ISSUE_MARKER)) {
      return {
        body: DELETED_ISSUE_MESSAGE,
        frontTimelineItems: { edges: [] },
      };
    }

    throw new Error(`未找到 embeddedData: ${sourceUrl}`);
  }

  const embeddedData = JSON.parse(match[1]);
  return embeddedData.payload.preloadedQueries?.[0]?.result?.data?.repository?.issue ?? null;
}

function extractCommentBodies(issuePayload) {
  const timelineEdges = issuePayload?.frontTimelineItems?.edges ?? [];

  return timelineEdges
    .map((edge) => edge?.node)
    .filter((node) => node?.__isComment === 'IssueComment' && typeof node.body === 'string')
    .map((node) => stripMarkdown(node.body))
    .filter(Boolean);
}

function buildAnswer(issuePayload) {
  const commentBodies = extractCommentBodies(issuePayload);

  if (commentBodies.length > 0) {
    return commentBodies.join('\n\n---\n\n');
  }

  return stripMarkdown(issuePayload?.body ?? '');
}

async function enrichQuestion(question) {
  const html = await fetchTextWithRetry(question.sourceUrl);
  const issuePayload = extractIssuePayload(html, question.sourceUrl);

  if (!issuePayload) {
    throw new Error(`未找到题目数据: ${question.sourceUrl}`);
  }

  const answer = buildAnswer(issuePayload);
  const content = extractSummary(answer || stripMarkdown(issuePayload.body ?? ''));

  return {
    ...question,
    content,
    answer,
    difficulty: question.difficulty || DEFAULT_DIFFICULTY,
  };
}

async function mapWithConcurrency(items, mapper) {
  const results = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  const workerCount = Math.min(REQUEST_CONCURRENCY, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function buildQuestionKey(question) {
  return `${question.title}::${question.sourceUrl}`;
}

async function main() {
  const [, , repositoryUrl = REPOSITORY_URL, inputFile = INPUT_PATH, outputFile = OUTPUT_PATH] = process.argv;

  if (repositoryUrl !== REPOSITORY_URL) {
    process.stdout.write(`忽略仓库参数，当前脚本固定抓取 ${REPOSITORY_URL}\n`);
  }

  const questions = readQuestions(inputFile);
  const resolvedOutputPath = path.resolve(outputFile);
  const existingQuestions = readExistingQuestions(outputFile);
  const existingQuestionMap = new Map(existingQuestions.map((question) => [buildQuestionKey(question), question]));
  const total = questions.length;
  let completedCount = existingQuestions.length;
  let pendingWriteCount = 0;
  const failedQuestions = [];
  const questionsToFetch = questions.filter((question) => !existingQuestionMap.has(buildQuestionKey(question)));

  await mapWithConcurrency(questionsToFetch, async (question) => {
    try {
      const enrichedQuestion = await enrichQuestion(question);
      existingQuestionMap.set(buildQuestionKey(enrichedQuestion), enrichedQuestion);
      completedCount += 1;
      pendingWriteCount += 1;

      if (pendingWriteCount >= CHECKPOINT_BATCH_SIZE) {
        const orderedQuestions = questions.map((item) => existingQuestionMap.get(buildQuestionKey(item))).filter(Boolean);
        writeQuestions(outputFile, orderedQuestions);
        pendingWriteCount = 0;
      }

      process.stdout.write(`已抓取正文 ${completedCount}/${total}: ${question.title}\n`);
      return enrichedQuestion;
    } catch (error) {
      failedQuestions.push({
        title: question.title,
        sourceUrl: question.sourceUrl,
        error: error.message,
      });
      writeFailedQuestions(failedQuestions);
      process.stderr.write(`跳过题目: ${question.sourceUrl} (${error.message})\n`);
      return null;
    }
  });

  const enrichedQuestions = questions.map((question) => existingQuestionMap.get(buildQuestionKey(question))).filter(Boolean);
  writeQuestions(outputFile, enrichedQuestions);
  process.stdout.write(`已生成完整题库: ${resolvedOutputPath}\n题目数量: ${enrichedQuestions.length}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
