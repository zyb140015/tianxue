import type { Category, Question } from '@/types';

export const mockCategories: Category[] = [
  { id: 'javascript', name: 'JavaScript' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'react', name: 'React' },
  { id: 'react-native', name: 'React Native' },
];

export const mockQuestions: Question[] = [
  {
    id: 'q1',
    title: 'React Native 中 bridge 的作用是什么？',
    content: '请说明 React Native 中 JS 与原生通信机制的基本原理。',
    answer: 'Bridge 用于连接 JS 线程和原生模块，在旧架构中承担序列化通信职责。',
    category: 'react-native',
    tags: ['RN', '架构'],
    difficulty: 'medium',
    isFavorite: true,
    isLearned: false,
    needsReview: true,
  },
  {
    id: 'q2',
    title: 'useMemo 和 useCallback 的区别是什么？',
    content: '请说明两者的使用场景和常见误区。',
    answer: 'useMemo 缓存计算结果，useCallback 缓存函数引用。',
    category: 'react',
    tags: ['Hooks', '性能优化'],
    difficulty: 'easy',
    isFavorite: false,
    isLearned: true,
    needsReview: false,
  },
  {
    id: 'q3',
    title: 'TypeScript 中 interface 和 type 的区别？',
    content: '请说明它们的适用场景以及扩展能力上的差异。',
    answer: 'interface 更适合对象结构约束，type 更灵活，适合联合类型和别名。',
    category: 'typescript',
    tags: ['TypeScript'],
    difficulty: 'easy',
    isFavorite: true,
    isLearned: true,
    needsReview: false,
  },
];
