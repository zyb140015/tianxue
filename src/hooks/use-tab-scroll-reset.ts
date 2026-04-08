import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

type ScrollToOptions = {
  x?: number;
  y?: number;
  animated?: boolean;
};

type ScrollableNode = {
  scrollTo?: (options: ScrollToOptions) => void;
};

type ScrollableRef = {
  current: ScrollableNode | { getNode?: () => ScrollableNode } | null;
};

function resolveScrollableNode(current: ScrollableRef['current']): ScrollableNode | null {
  if (!current) {
    return null;
  }

  if ('scrollTo' in current) {
    return current;
  }

  if ('getNode' in current) {
    return current.getNode?.() ?? null;
  }

  return null;
}

export function useTabScrollReset(ref: ScrollableRef) {
  useFocusEffect(
    useCallback(() => {
      const frameId = requestAnimationFrame(() => {
        const node = resolveScrollableNode(ref.current);
        node?.scrollTo?.({ x: 0, y: 0, animated: false });
      });

      return () => cancelAnimationFrame(frameId);
    }, [ref]),
  );
}
