interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({ className = '', width, height }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-[#262626] rounded ${className}`}
      style={{
        width: width,
        height: height
      }}
    />
  );
};
