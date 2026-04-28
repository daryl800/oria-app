type OriaLogoProps = {
  className?: string;
  size?: number;
};

export default function OriaLogo({ className = '', size = 32 }: OriaLogoProps) {
  return (
    <img
      src="/oria-navbar-symbol.png"
      alt="Oria"
      className={className}
      width={size}
      height={size}
      decoding="async"
    />
  );
}
