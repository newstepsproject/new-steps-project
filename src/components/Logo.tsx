import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <Image
        src="/images/logo.png"
        alt="New Steps Project Logo"
        width={40}
        height={40}
        className="w-auto h-10"
        priority
      />
      <span className="font-bold text-xl">New Steps Project</span>
    </Link>
  );
} 