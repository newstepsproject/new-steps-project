import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const Logo = ({ className, width = 360, height = 100 }: LogoProps) => {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/images/new_logo_no_bg.png"
        alt="New Steps Project Logo"
        width={width}
        height={height}
        className="w-auto h-24"
        priority
      />
    </div>
  );
};

export default Logo; 