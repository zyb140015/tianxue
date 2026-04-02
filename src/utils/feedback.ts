import { useFeedbackStore } from '@/store/use-feedback-store';

type FeedbackType = 'success' | 'error' | 'info';

export function showFeedbackMessage(message: string, type: FeedbackType = 'info') {
  useFeedbackStore.getState().showFeedback(message, type);
}

export function showSuccessMessage(message: string) {
  showFeedbackMessage(message, 'success');
}

export function showErrorMessage(message: string) {
  showFeedbackMessage(message, 'error');
}

export function showInfoMessage(message: string) {
  showFeedbackMessage(message, 'info');
}
