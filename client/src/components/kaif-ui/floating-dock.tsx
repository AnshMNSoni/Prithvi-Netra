import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import {
  AnimatePresence,
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef, useState } from "react";

export interface FloatingDockItem {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  link?: string;
  active?: boolean;
}

export const FloatingDock = ({
  navigationItems,
  desktopClassName,
  mobileClassName,
}: {
  navigationItems: FloatingDockItem[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={navigationItems} className={desktopClassName} />
      <FloatingDockMobile items={navigationItems} className={mobileClassName} />
    </>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  let mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto hidden md:flex h-20 gap-4 items-end rounded-3xl bg-card/90 border border-border shadow-2xl px-5 pb-3.5 backdrop-blur-md",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.label} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  label,
  icon,
  link,
  onClick,
  active,
}: {
  mouseX: MotionValue;
  label: string;
  icon: React.ReactNode;
  link?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  let ref = useRef<HTMLDivElement>(null);

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthTransform = useTransform(distance, [-150, 0, 150], [52, 76, 52]);
  let heightTransform = useTransform(distance, [-150, 0, 150], [52, 76, 52]);

  let widthTransformIcon = useTransform(distance, [-150, 0, 150], [22, 38, 22]);
  let heightTransformIcon = useTransform(distance, [-150, 0, 150], [22, 38, 22]);

  let width = useSpring(widthTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let height = useSpring(heightTransform, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  let widthIcon = useSpring(widthTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });
  let heightIcon = useSpring(heightTransformIcon, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const [hovered, setHovered] = useState(false);

  const content = (
    <motion.div
      ref={ref}
      style={{ width, height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "aspect-square rounded-full flex items-center justify-center relative cursor-pointer border transition-all duration-300",
        active
          ? "bg-blue-600 border-blue-400 dark:bg-blue-500 dark:border-blue-400 text-white shadow-[0_4px_20px_rgba(59,130,246,0.45)]"
          : "bg-muted border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 2, x: "-50%" }}
            className="px-2.5 py-1 rounded-md bg-popover border border-border text-popover-foreground absolute left-1/2 -translate-x-1/2 -top-10 w-fit whitespace-nowrap text-xs font-semibold shadow-lg z-[2100]"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        style={{ width: widthIcon, height: heightIcon }}
        className="flex items-center justify-center"
      >
        {icon}
      </motion.div>
    </motion.div>
  );

  if (link && link !== "#" && link !== "") {
    return <a href={link}>{content}</a>;
  }
  return content;
}

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: FloatingDockItem[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <AnimatePresence>
        {open && (
          <motion.div
            layoutId="nav"
            className="absolute bottom-full mb-3 right-0 flex flex-col gap-2.5 items-center z-[2010]"
          >
            {items.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  transition: {
                    delay: idx * 0.05,
                  },
                }}
                transition={{ delay: (items.length - 1 - idx) * 0.05 }}
              >
                <button
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    setOpen(false);
                  }}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center border shadow-md transition-colors",
                    item.active
                      ? "bg-blue-600 border-blue-400 dark:bg-blue-500 dark:border-blue-400 text-white shadow-[0_4px_15px_rgba(59,130,246,0.4)]"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  <div className="h-5 w-5 flex items-center justify-center">{item.icon}</div>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-foreground cursor-pointer z-[2020] relative hover-elevate"
      >
        <Menu className="h-5 w-5" />
      </button>
    </div>
  );
};
