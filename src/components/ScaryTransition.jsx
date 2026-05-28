'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export default function ScaryTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
        }}
        exit={{ 
          opacity: 0, 
          y: -12,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }}
      >
        {/* Horror fog overlay that drifts across during transition */}
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'radial-gradient(ellipse at center, rgba(139,0,0,0.08), transparent 70%)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
