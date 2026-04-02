import { describe, expect, it } from 'vitest';

import { useFeedbackStore } from '@/store/use-feedback-store';

import { showErrorMessage, showInfoMessage, showSuccessMessage } from './feedback';

describe('feedback helpers', () => {
  it('shows success message', () => {
    showSuccessMessage('成功提示');

    const state = useFeedbackStore.getState();

    expect(state.visible).toBe(true);
    expect(state.message).toBe('成功提示');
    expect(state.type).toBe('success');
  });

  it('shows error and info messages', () => {
    showErrorMessage('失败提示');

    let state = useFeedbackStore.getState();
    expect(state.message).toBe('失败提示');
    expect(state.type).toBe('error');

    showInfoMessage('普通提示');

    state = useFeedbackStore.getState();
    expect(state.message).toBe('普通提示');
    expect(state.type).toBe('info');
  });
});
