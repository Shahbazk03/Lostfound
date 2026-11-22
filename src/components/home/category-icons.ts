import {
  Smartphone,
  Gem,
  Wallet,
  KeyRound,
  FileText,
  Shirt,
  PawPrint,
  Luggage,
  Dumbbell,
  ToyBrick,
  Package,
  type LucideIcon,
} from "lucide-react";

/** Icon for each canonical item category (see `categories` in lib/utils). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Electronics: Smartphone,
  Jewelry: Gem,
  "Wallet / Purse": Wallet,
  Keys: KeyRound,
  Documents: FileText,
  Clothing: Shirt,
  Pets: PawPrint,
  "Bags / Luggage": Luggage,
  "Sports Equipment": Dumbbell,
  Toys: ToyBrick,
  Other: Package,
};

