type OriaLogoProps = {
  className?: string;
  size?: number;
};

export default function OriaLogo({ className = '', size = 32 }: OriaLogoProps) {
  return (
    <img
      src="/oria-navbar-symbol-transparent.png?v=14"
      alt="oria"
      className={className}
      width={size}
      height={size}
      decoding="async"
    />
  );
}
