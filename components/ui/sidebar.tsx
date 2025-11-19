"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
  onClick?: () => void;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full hidden md:flex md:flex-col w-[300px] shrink-0 px-4 py-4 backdrop-blur-md relative",
          className
        )}
        style={{
          background: 'linear-gradient(to bottom right, rgba(224, 30, 31, 0.2), rgba(254, 165, 25, 0.2))',
        }}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
          paddingLeft: animate ? (open ? "16px" : "8px") : "16px",
          paddingRight: animate ? (open ? "16px" : "8px") : "16px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))'
          }}
        />
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 flex flex-row md:hidden items-center justify-between w-full px-4 py-4 backdrop-blur-md relative"
        )}
        style={{
          background: 'linear-gradient(to right, rgba(224, 30, 31, 0.2), rgba(254, 165, 25, 0.2))',
        }}
        {...props}
      >
        <div 
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          style={{
            background: 'linear-gradient(to right, rgba(224, 30, 31, 0.35), rgba(254, 165, 25, 0.35))'
          }}
        />
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-white dark:text-white"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 p-10 flex flex-col justify-between z-[100] backdrop-blur-md",
                className
              )}
              style={{
                background: 'linear-gradient(to bottom right, rgba(224, 30, 31, 0.2), rgba(254, 165, 25, 0.2))'
              }}
            >
              <div
                className="absolute right-10 top-10 z-50 text-white dark:text-white"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  isActive: isActiveProp,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}) => {
  const { open, animate } = useSidebar();
  const handleClick = (e: React.MouseEvent) => {
    if (link.onClick || onClick) {
      e.preventDefault();
      (link.onClick || onClick)?.();
    }
  };

  const isActive = isActiveProp !== undefined ? isActiveProp : false;

  const linkContent = (
    <>
      <span className={cn(
        "shrink-0",
        isActive ? "text-white" : "text-neutral-700 dark:text-neutral-200"
      )}>
        {link.icon}
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm group-hover/sidebar:translate-x-1 transition duration-300 whitespace-pre inline-block !p-0 !m-0",
          isActive ? "text-white font-bold" : "text-neutral-700 dark:text-neutral-200"
        )}
      >
        {link.label}
      </motion.span>
    </>
  );

  if (link.href === "#" || link.onClick || onClick) {
    return (
      <a
        href={link.href}
        onClick={handleClick}
        className={cn(
          "flex items-center justify-start gap-2 group/sidebar px-3 py-2 rounded-lg cursor-pointer transition-all duration-300",
          isActive 
            ? "bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold" 
            : "text-neutral-700 dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700",
          className
        )}
        {...props}
      >
        {linkContent}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2 group/sidebar px-3 py-2 rounded-lg cursor-pointer transition-all duration-300",
        isActive 
          ? "bg-gradient-to-r from-[#E01E1F] to-[#FEA519] text-white font-bold" 
          : "text-neutral-700 dark:text-neutral-200 hover:bg-gray-200 dark:hover:bg-neutral-700",
        className
      )}
      {...props}
    >
      {linkContent}
    </Link>
  );
};

