import React from 'react';
import { Animated, StyleSheet } from 'react-native';

type BuildingSelectorPanelProps = {
  readonly visible: boolean;
  readonly slideAnim: Animated.Value;
  readonly children: React.ReactNode;
};

export default function BuildingSelectorPanel({ visible, slideAnim, children }: BuildingSelectorPanelProps) {
  return (
    <Animated.View
      style={[
        styles.panel,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 10,
    top: 110,
    marginTop: 0,
    width: 350,
    maxWidth: '85%',
    zIndex: 9,
  },
});
