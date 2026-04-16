import Image from "next/image";
import * as React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export function Logo({ size = 24, className, ...props }: LogoProps) {
  return <Image src="/images/logo.png" alt="Logo" width={size} height={size} />;
}
