import React from 'react';
import { useSpring, animated } from 'react-spring';

export function SpringDemo() {
  const styles = useSpring({
    loop: true,
    to: [
      { opacity: 1, color: '#6366f1', transform: 'scale(1.1)' },
      { opacity: 0.7, color: '#f59e42', transform: 'scale(1)' },
    ],
    from: { opacity: 0.7, color: '#6366f1', transform: 'scale(1)' },
    config: { duration: 1200 },
  });
  return (
    <animated.div style={{ ...styles, width: 200, height: 80, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 22 }}>
      React Spring!
    </animated.div>
  );
} 