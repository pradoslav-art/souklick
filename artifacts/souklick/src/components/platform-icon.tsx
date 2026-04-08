import { SiGoogle, SiZomato, SiTripadvisor } from "react-icons/si";
import { Star } from "lucide-react";

export function PlatformIcon({ platform, className = "w-4 h-4" }: { platform: string; className?: string }) {
  switch (platform) {
    case "google":      return <SiGoogle className={`text-[#4285F4] ${className}`} />;
    case "zomato":      return <SiZomato className={`text-[#E23744] ${className}`} />;
    case "tripadvisor": return <SiTripadvisor className={`text-[#00AF87] ${className}`} />;
    default:            return <Star className={className} />;
  }
}
