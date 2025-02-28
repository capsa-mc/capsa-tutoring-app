import Image from "next/image";
import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative">
        <Image
          src="/images/logo.svg"
          alt="CAPSA-MC Logo"
          width={48}
          height={48}
          className="h-12 w-auto [&>path]:fill-[#2563eb]"
          priority
        />
      </div>
      <span className="ml-3 text-2xl font-bold text-[#2563eb]">CAPSA-MC</span>
    </Link>
  );
} 