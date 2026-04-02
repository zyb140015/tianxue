import { describe, expect, it } from 'vitest';

import { emptyStateCopy } from './empty-state-copy';

describe('emptyStateCopy', () => {
  it('contains required keys', () => {
    expect(emptyStateCopy.homeLoadFailed.title).toBeTruthy();
    expect(emptyStateCopy.questionBankLoadFailed.description).toBeTruthy();
    expect(emptyStateCopy.favoritesLoadFailed.title).toBeTruthy();
    expect(emptyStateCopy.statsLoadFailed.title).toBeTruthy();
    expect(emptyStateCopy.mockInterviewLoadFailed.title).toBeTruthy();
    expect(emptyStateCopy.questionMissing.description).toBeTruthy();
  });

  it('uses consistent generic load failure wording', () => {
    expect(emptyStateCopy.commonLoadFailed.title).toBe('加载失败');
    expect(emptyStateCopy.commonLoadFailed.description).toBe('请稍后重试。');
  });
});
