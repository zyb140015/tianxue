export const emptyStateCopy = {
  commonLoadFailed: {
    title: '加载失败',
    description: '请稍后重试。',
  },
  homeLoadFailed: {
    title: '首页加载失败',
    description: '请稍后重试。',
  },
  questionBankLoadFailed: {
    title: '题库加载失败',
    description: '请稍后重试或重置筛选条件。',
  },
  favoritesLoadFailed: {
    title: '收藏加载失败',
    description: '请稍后重试。',
  },
  statsLoadFailed: {
    title: '统计加载失败',
    description: '请稍后重试。',
  },
  mockInterviewLoadFailed: {
    title: '模拟面试加载失败',
    description: '请稍后重试。',
  },
  questionMissing: {
    title: '题目不存在',
    description: '请返回题库重新选择题目。',
  },
} as const;
