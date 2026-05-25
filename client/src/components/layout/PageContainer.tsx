import { cn } from "@/lib/utils";

type PageVariant = "narrow" | "wide" | "full" | "fullMd";

interface PageContainerProps {
  children: React.ReactNode;
  variant?: PageVariant;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<PageVariant, string> = {
  narrow: "w-full max-w-[608px] 2xl:max-w-[760px] mx-auto px-4 sm:px-0",
  wide:   "w-full max-w-[960px] 2xl:max-w-[1200px] mx-auto px-5 sm:px-5",
  full:   "w-full page-gutter-sm",
  fullMd: "w-full page-gutter-md",
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
