import logo from "@/assets/adun-logo.png";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 40,
  showText = true,
  className,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img
        src={logo}
        alt="Admiralty University of Nigeria"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        style={{ height: size, width: size }}
      />
      {showText && (
        <div className="min-w-0 leading-tight">
          <div className="font-display text-sm font-bold tracking-tight text-foreground">
            ADUN
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            E-Voting
          </div>
        </div>
      )}
    </div>
  );
}