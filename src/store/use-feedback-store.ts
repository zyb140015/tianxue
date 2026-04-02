import { create } from 'zustand';

type FeedbackType = 'success' | 'error' | 'info';

type FeedbackState = {
  visible: boolean;
  message: string;
  type: FeedbackType;
  showFeedback: (message: string, type?: FeedbackType) => void;
  hideFeedback: () => void;
};

export const useFeedbackStore = create<FeedbackState>((set) => ({
  visible: false,
  message: '',
  type: 'info',
  showFeedback: (message, type = 'info') =>
    set({
      visible: true,
      message,
      type,
    }),
  hideFeedback: () =>
    set({
      visible: false,
      message: '',
      type: 'info',
    }),
}));
