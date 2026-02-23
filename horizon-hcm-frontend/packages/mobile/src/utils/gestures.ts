import { GestureResponderEvent, PanResponder, PanResponderInstance } from 'react-native';

// Swipe direction enum
export enum SwipeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN',
}

// Swipe configuration
export interface SwipeConfig {
  velocityThreshold?: number;
  directionalOffsetThreshold?: number;
  gestureIsClickThreshold?: number;
}

// Default swipe configuration
const defaultSwipeConfig: Required<SwipeConfig> = {
  velocityThreshold: 0.3,
  directionalOffsetThreshold: 80,
  gestureIsClickThreshold: 5,
};

// Swipe callbacks
export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipe?: (direction: SwipeDirection) => void;
}

// Create swipe gesture handler
export const createSwipeGesture = (
  callbacks: SwipeCallbacks,
  config: SwipeConfig = {}
): PanResponderInstance => {
  const swipeConfig = { ...defaultSwipeConfig, ...config };
  let swipeDetected = false;

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt: GestureResponderEvent, gestureState) => {
      if (swipeDetected) return;

      const { dx, dy, vx, vy } = gestureState;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Check if gesture is a click (too small movement)
      if (
        absX < swipeConfig.gestureIsClickThreshold &&
        absY < swipeConfig.gestureIsClickThreshold
      ) {
        return;
      }

      // Determine swipe direction
      let direction: SwipeDirection | null = null;

      if (absX > absY) {
        // Horizontal swipe
        if (
          absX > swipeConfig.directionalOffsetThreshold &&
          Math.abs(vx) > swipeConfig.velocityThreshold
        ) {
          direction = dx > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT;
        }
      } else {
        // Vertical swipe
        if (
          absY > swipeConfig.directionalOffsetThreshold &&
          Math.abs(vy) > swipeConfig.velocityThreshold
        ) {
          direction = dy > 0 ? SwipeDirection.DOWN : SwipeDirection.UP;
        }
      }

      // Execute callbacks
      if (direction) {
        swipeDetected = true;
        callbacks.onSwipe?.(direction);

        switch (direction) {
          case SwipeDirection.LEFT:
            callbacks.onSwipeLeft?.();
            break;
          case SwipeDirection.RIGHT:
            callbacks.onSwipeRight?.();
            break;
          case SwipeDirection.UP:
            callbacks.onSwipeUp?.();
            break;
          case SwipeDirection.DOWN:
            callbacks.onSwipeDown?.();
            break;
        }

        // Reset swipe detection after a short delay
        setTimeout(() => {
          swipeDetected = false;
        }, 100);
      }
    },
  });
};

// Long press configuration
export interface LongPressConfig {
  delayMs?: number;
}

// Create long press gesture handler
export const createLongPressGesture = (
  onLongPress: () => void,
  config: LongPressConfig = {}
): PanResponderInstance => {
  const { delayMs = 500 } = config;
  let longPressTimer: NodeJS.Timeout | null = null;
  let longPressDetected = false;

  return PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      longPressDetected = false;
      longPressTimer = setTimeout(() => {
        longPressDetected = true;
        onLongPress();
      }, delayMs);
    },
    onPanResponderRelease: () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    },
    onPanResponderTerminate: () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    },
  });
};
