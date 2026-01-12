import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export const Spinner = ({ size = 24, className = '' }: SpinnerProps) => {
  return (
    <Loader2
      size={size}
      className={`animate-spin text-[#525252] ${className}`}
    />
  );
};
