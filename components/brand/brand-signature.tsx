import Image from "next/image";
import Link from "next/link";
import {cn} from "@/lib/utils";

type BrandMarkProps = {
  size?: number;
  className?: string;
};

export function BrandMark({size = 34, className}: BrandMarkProps) {
  return (
    <Image
      src="/assets/brand/hero-logo-v2.png"
      alt=""
      width={size}
      height={size}
      className={cn("brand-mark", className)}
      unoptimized
    />
  );
}

type BrandSignatureProps = {
  href?: string;
  label?: string;
  size?: number;
  className?: string;
  wordmarkClassName?: string;
};

export function BrandSignature({
  href,
  label = "Be Water",
  size = 34,
  className,
  wordmarkClassName,
}: BrandSignatureProps) {
  const content = (
    <>
      <BrandMark size={size}/>
      <span className={wordmarkClassName}>Be Water</span>
    </>
  );

  if (href) {
    return <Link href={href} className={cn("brand-signature", className)} aria-label={label}>{content}</Link>;
  }

  return <div className={cn("brand-signature", className)} aria-label={label}>{content}</div>;
}
