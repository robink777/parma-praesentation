import Image from "next/image";
import { Icon } from "@/components/icons/Icon";

export function PropertyImage({
  src,
  alt,
  className = "",
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-stein text-walnuss/40 ${className}`}>
        <Icon name="house" size={48} />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" />
    </div>
  );
}
