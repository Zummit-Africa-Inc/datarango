"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "../lib";

interface MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  style?: CSSProperties;
}

/** Fade + rise into view. Respects prefers-reduced-motion. */
export const FadeIn = ({ children, className, delay = 0, style }: MotionProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.215, 0.61, 0.355, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] } },
};

/** Container that staggers its <StaggerItem /> children into view. */
export const Stagger = ({ children, className, style }: Omit<MotionProps, "delay">) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={reduce ? undefined : staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      style={style}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, className, style }: Omit<MotionProps, "delay">) => (
  <motion.div className={className} variants={staggerItem} style={style}>
    {children}
  </motion.div>
);

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Static 3D pose applied via CSS transforms, e.g. { rotateX: 8, rotateY: -12 }. */
  rotateX?: number;
  rotateY?: number;
  /** Gentle idle float animation. */
  float?: boolean;
}

/**
 * A card posed in 3D space (perspective is applied by the parent via
 * `[perspective:1200px]`). Used for the landing hero mosaic.
 */
export const TiltCard = ({
  children,
  className,
  rotateX = 0,
  rotateY = 0,
  float,
}: TiltCardProps) => {
  const reduce = useReducedMotion();
  const style: CSSProperties = {
    transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
    transformStyle: "preserve-3d",
  };
  return (
    <motion.div
      className={cn("will-change-transform", className)}
      style={style}
      animate={float && !reduce ? { y: [0, -10, 0] } : undefined}
      transition={float ? { duration: 6, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {children}
    </motion.div>
  );
};
