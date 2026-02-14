import type { ReactElement, SVGProps } from 'react';
import { cn } from '@/lib/utils/cn';

export type IconName = 'alert' | 'calendar' | 'check' | 'clock' | 'trash';

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'name'> & {
  name: IconName;
  label?: string;
  size?: number;
};

const iconPaths: Record<IconName, ReactElement> = {
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </>
  ),
  check: <path d="M5 12l4 4 10-10" />,
  alert: (
    <>
      <path d="M12 3l9 17H3L12 3z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 14h10l1-14" />
      <path d="M10 10v7M14 10v7" />
    </>
  ),
};

export const Icon = ({ className, label, name, size = 16, ...props }: IconProps) => {
  return (
    <svg
      {...props}
      role="img"
      aria-label={label ?? name}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('inline-block shrink-0', className)}
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
};
