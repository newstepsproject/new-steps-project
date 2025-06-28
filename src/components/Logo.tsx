import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <Image
        src="/images/new_logo_no_bg.png"
        alt="New Steps Project Logo"
        width={360}
        height={100}
        className="w-auto h-24"
        priority
      />
    </Link>
  );
} 