"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  animate?: boolean;
}

export const BackgroundGradient = ({
  children,
  className,
  containerClassName,
  animate = true,
}: BackgroundGradientProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    initial: {
      backgroundPosition: "0 50%",
    },
    animate: {
      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    },
  };

  return (
    <div
      className={cn("relative group", containerClassName)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-0",
          "bg-[radial-gradient(circle_at_0%_0%,#00ccb1_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#7b61ff_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#ffc414_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#1ca0fb_0%,transparent_50%)]",
          "opacity-60 group-hover:opacity-100 blur-xl transition duration-500"
        )}
      />
      <motion.div
        variants={animate ? variants : undefined}
        initial={animate ? "initial" : undefined}
        animate={animate ? "animate" : undefined}
        transition={
          animate
            ? {
                duration: 5,
                repeat: Infinity,
                repeatType: "reverse",
              }
            : undefined
        }
        style={{
          backgroundSize: animate ? "400% 400%" : undefined,
        }}
        className={cn(
          "absolute inset-0 rounded-3xl z-0",
          "bg-[radial-gradient(circle_at_0%_0%,#00ccb1_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#7b61ff_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#ffc414_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#1ca0fb_0%,transparent_50%)]",
          "opacity-60 group-hover:opacity-100 blur-2xl transition duration-500"
        )}
      />

      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  );
};

