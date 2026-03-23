import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
interface SketchButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}
export function SketchButton({
  children,
  className,
  variant = 'primary',
  isLoading,
  ...props
}: SketchButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, rotate: 1 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative px-8 py-3 font-sketch text-xl transition-colors sketch-border sketch-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center",
        variant === 'primary' ? "bg-sketch-orange text-charcoal hover:bg-orange-400" : "bg-white text-charcoal hover:bg-paper",
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className={cn(isLoading ? "opacity-0" : "opacity-100")}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-4 border-charcoal border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </motion.button>
  );
}