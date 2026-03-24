import { cn } from "@/lib/utils";

type PageVariant = "narrow" | "wide" | "full" | "fullMd";

interface PageContainerProps {
  children: React.ReactNode;
  variant?: PageVariant;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<PageVariant, string> = {
  narrow: "w-full max-w-[608px] mx-auto px-4 sm:px-0",
  wide:   "w-full max-w-[960px] mx-auto px-5 sm:px-5",
  full:   "w-full px-4 sm:px-[107px]",
  fullMd: "w-full px-0 md:px-[107px]",
};

export function PageContainer({
  children,
  variant = "narrow",
  className,
  style,
}: PageContainerProps) {
  return (
    <div className={cn(variantStyles[variant], className)} style={style}>
      {children}
    </div>
  );
}
