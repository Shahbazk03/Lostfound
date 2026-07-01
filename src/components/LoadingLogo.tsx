import { cn } from "@/lib/utils";

export function LoadingLogo({ className }: { className?: string }) {
  // Strip out text colors and animate-spin from passed classNames
  const cleanClassName = className?.replace(/text-\w+-\d+/g, "").replace("animate-spin", "");

  return (
    <svg 
      className={cn("animate-pulse", cleanClassName)} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="100" height="100" rx="24" fill="#059669"/>
      <text 
        x="50%" 
        y="53%" 
        dominantBaseline="middle" 
        textAnchor="middle" 
        fill="white" 
        fontSize="40" 
        fontWeight="bold" 
        letterSpacing="2"
        fontFamily="sans-serif"
      >
        LF
      </text>
    </svg>
  );
}
