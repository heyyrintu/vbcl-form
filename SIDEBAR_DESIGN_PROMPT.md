# Sidebar Design Prompt

## Overview
Create a modern, responsive sidebar component with glassmorphism effects, smooth animations, and a collapsible design. The sidebar should automatically collapse on desktop when not hovered and expand on hover, with a full-screen mobile overlay menu.

## Design Specifications

### Visual Design
- **Glassmorphism Effect**: Backdrop blur with semi-transparent gradient background
- **Gradient Colors**: 
  - Primary: `rgba(224, 30, 31, 0.2)` (Red)
  - Secondary: `rgba(254, 165, 25, 0.2)` (Orange)
  - Active State: Linear gradient from `#E01E1F` to `#FEA519`
- **Border**: Subtle gradient border at the bottom
- **Animations**: Smooth 300ms transitions with easeInOut easing

### Behavior
- **Desktop**: 
  - Default collapsed width: `60px` (icon-only)
  - Expanded width on hover: `300px` (full sidebar)
  - Auto-collapse when mouse leaves
- **Mobile**: 
  - Hamburger menu in top bar
  - Full-screen overlay when opened
  - Slide-in animation from left
  - Close button in top-right corner

### Features
1. **Active State Highlighting**: Active links show gradient background with white text
2. **Icon + Label**: Each link has an icon and label that fade in/out based on sidebar state
3. **Logo Component**: Collapsible logo that shows icon-only when collapsed, full logo when expanded
4. **Smooth Animations**: All transitions use framer-motion for fluid animations
5. **Dark Mode Support**: Full dark mode compatibility
6. **Click Handlers**: Support for custom onClick handlers (e.g., logout)

## Component Structure

### Required Dependencies
```bash
npm install framer-motion clsx tailwind-merge @tabler/icons-react
```

### File Structure
```
components/
  ├── ui/
  │   └── sidebar.tsx          # Core sidebar UI component
  └── AppSidebar.tsx           # Implementation with links and logo
lib/
  └── utils.ts                 # cn() utility function
```

## Implementation Code

### 1. Utility Function (`lib/utils.ts`)
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 2. Core Sidebar Component (`components/ui/sidebar.tsx`)
The sidebar component should include:
- `SidebarProvider`: Context provider for sidebar state
- `Sidebar`: Main wrapper component
- `SidebarBody`: Container that handles desktop/mobile rendering
- `DesktopSidebar`: Desktop version with hover-to-expand
- `MobileSidebar`: Mobile version with overlay menu
- `SidebarLink`: Individual navigation link component

Key features:
- Uses React Context for state management
- Portal rendering for mobile overlay
- Framer Motion for animations
- Responsive breakpoints (hidden on mobile, flex on desktop)
- Gradient background with backdrop blur
- Active state styling with gradient background

### 3. Implementation Example (`components/AppSidebar.tsx`)
```tsx
"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconBrandTabler, IconTable, IconUsers } from "@tabler/icons-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconBrandTabler className="h-5 w-5 shrink-0" />,
    },
    {
      label: "All Entries",
      href: "/all-entries",
      icon: <IconTable className="h-5 w-5 shrink-0" />,
    },
    // Add more links...
  ];

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink
                key={idx}
                link={link}
                isActive={pathname === link.href}
              />
            ))}
          </div>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
```

## Customization Options

### Change Gradient Colors
Update the gradient values in `DesktopSidebar` and `MobileSidebar` components:
```tsx
style={{
  background: 'linear-gradient(to bottom right, rgba(R, G, B, 0.2), rgba(R, G, B, 0.2))',
}}
```

### Change Active State Colors
Update the `SidebarLink` component:
```tsx
className={cn(
  isActive
    ? "bg-gradient-to-r from-[#YOUR_COLOR_1] to-[#YOUR_COLOR_2] text-white font-bold"
    : "..."
)}
```

### Adjust Widths
Modify in `DesktopSidebar`:
```tsx
animate={{
  width: animate ? (isHovered ? "300px" : "60px") : "300px",
  // Change 300px to desired expanded width
  // Change 60px to desired collapsed width
}}
```

### Disable Auto-Collapse
Set `animate={false}` in the `Sidebar` component:
```tsx
<Sidebar open={open} setOpen={setOpen} animate={false}>
```

## Usage in Layout

```tsx
import AppSidebar from "@/components/AppSidebar";

export default function Layout({ children }) {
  return (
    <div className="flex h-screen">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

## Key Design Principles

1. **Progressive Disclosure**: Show icons when collapsed, full labels when expanded
2. **Smooth Transitions**: All state changes should be animated
3. **Accessibility**: Proper ARIA labels and keyboard navigation
4. **Responsive First**: Mobile overlay ensures usability on all devices
5. **Visual Hierarchy**: Active states clearly indicate current page
6. **Glassmorphism**: Modern, elegant backdrop blur effect

## Animation Details

- **Duration**: 300ms
- **Easing**: easeInOut
- **Desktop Expand/Collapse**: Width and padding transitions
- **Mobile Slide**: X-axis translation with opacity fade
- **Link Text**: Opacity and display transitions based on sidebar state

## Browser Support

- Modern browsers with CSS backdrop-filter support
- Fallback: Solid background if backdrop-filter not supported
- Mobile: Full touch support with proper hit areas

---

**Note**: This sidebar design is inspired by modern UI libraries like Aceternity UI and shadcn/ui, with custom gradient styling and smooth animations for an elegant user experience.

