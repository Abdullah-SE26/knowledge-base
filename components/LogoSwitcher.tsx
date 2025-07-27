"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LogoSwitcher() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const logoSrc =
    mounted && resolvedTheme === "dark"
      ? "/logoForDark.svg"
      : "/logoForLight.png";

  return (
    <Link href="/">
      <div className="h-[60px] w-[150px] mx-auto flex items-center">
        <Image
          src={logoSrc}
          alt="Mawaridhi Logo"
          width={150}
          height={60}
          className="object-contain"
          priority
        />
      </div>
    </Link>
  );
}
