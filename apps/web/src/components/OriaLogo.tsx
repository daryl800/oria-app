type OriaLogoProps = {
  className?: string;
  size?: number;
  variant?: 'light' | 'dark';
};

export default function OriaLogo({ className = '', size = 32, variant = 'light' }: OriaLogoProps) {
  const src = variant === 'dark'
    ? '/oria-navbar-symbol-dark.png?v=1'
    : '/oria-navbar-symbol-transparent.png?v=15';
  return (
    <img
      src={src}
      alt="oria"
      className={className}
      width={size}
      height={size}
      decoding="async"
    />
  );
}
