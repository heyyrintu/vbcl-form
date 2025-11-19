"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ElegantShapeProps {
  className?: string;
  delay?: number;
}

const ElegantShape = ({ className, delay = 0 }: ElegantShapeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        rotate: [0, 90, 0],
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
      className={cn("absolute", className)}
    >
      <div className="relative h-full w-full">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#DE1C1C]/20 via-[#FEA418]/15 to-[#DE1C1C]/20 blur-3xl" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#FEA418]/20 via-transparent to-[#DE1C1C]/20" />
      </div>
    </motion.div>
  );
};

interface ShapeLandingHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  showShapes?: boolean;
}

export const ShapeLandingHero = ({
  className,
  showShapes = true,
  ...props
}: ShapeLandingHeroProps) => {
  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none w-full h-full",
        className
      )}
      {...props}
    >
      {showShapes && (
        <>
          <ElegantShape
            className="left-[5%] top-[10%] h-[400px] w-[400px]"
            delay={0}
          />
          <ElegantShape
            className="right-[8%] top-[25%] h-[350px] w-[350px]"
            delay={2}
          />
          <ElegantShape
            className="left-[45%] bottom-[15%] h-[450px] w-[450px]"
            delay={4}
          />
          <ElegantShape
            className="right-[5%] bottom-[25%] h-[300px] w-[300px]"
            delay={1}
          />
          <ElegantShape
            className="left-[25%] top-[50%] h-[380px] w-[380px]"
            delay={3}
          />
          <ElegantShape
            className="right-[30%] top-[15%] h-[320px] w-[320px]"
            delay={5}
          />
          <ElegantShape
            className="left-[70%] bottom-[10%] h-[360px] w-[360px]"
            delay={6}
          />
          <ElegantShape
            className="left-[10%] bottom-[40%] h-[280px] w-[280px]"
            delay={7}
          />
        </>
      )}
    </div>
  );
};

