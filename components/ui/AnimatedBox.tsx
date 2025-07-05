import { motion } from 'framer-motion';
import React from 'react';

export function AnimatedBox() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      style={{ width: 200, height: 200, background: '#6366f1', borderRadius: 16 }}
    >
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: 20, display: 'block', textAlign: 'center', paddingTop: 80 }}>
        Framer Motion!
      </span>
    </motion.div>
  );
} 