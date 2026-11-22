import {
  BarChart3,
  Banknote,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LayoutTemplate,
  LifeBuoy,
  MessagesSquare,
  Package,
  PackageCheck,
  PackageSearch,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavBadgeKey = "openTickets" | "pendingWithdrawals";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: NavBadgeKey;
  /** Extra words the command palette matches on. */
  keywords?: string;
};

export type NavGroup = { title: string; items: NavItem[] };

export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard, keywords: "home overview kpi" },
      { title: "Analytics", href: "/admin/analytics", icon: BarChart3, keywords: "visits traffic visitors pages" },
    ],
  },
  {
    title: "Listings",
    items: [
      { title: "All items", href: "/admin/items", icon: Package, keywords: "listings reports" },
      { title: "Lost reports", href: "/admin/reports/lost", icon: PackageSearch, keywords: "lost items" },
      { title: "Found reports", href: "/admin/reports/found", icon: PackageCheck, keywords: "found items" },
    ],
  },
  {
    title: "People",
    items: [
      { title: "Users", href: "/admin/users", icon: Users, keywords: "accounts admins members" },
      { title: "Messages", href: "/admin/messages", icon: MessagesSquare, keywords: "chat conversations" },
      {
        title: "Support tickets",
        href: "/admin/support-tickets",
        icon: LifeBuoy,
        badge: "openTickets",
        keywords: "contact inbox help",
      },
    ],
  },
  {
    title: "Money",
    items: [
      { title: "Payments", href: "/admin/payments", icon: CreditCard, keywords: "revenue transactions stripe" },
      {
        title: "Withdrawals",
        href: "/admin/withdrawals",
        icon: Banknote,
        badge: "pendingWithdrawals",
        keywords: "payouts",
      },
    ],
  },
  {
    title: "Content",
    items: [
      { title: "Homepage builder", href: "/admin/cms/homepage", icon: LayoutTemplate, keywords: "cms hero sections" },
      { title: "Pages", href: "/admin/cms/pages", icon: FileText, keywords: "cms pages content" },
      { title: "Media library", href: "/admin/media", icon: ImageIcon, keywords: "images uploads files" },
    ],
  },
  {
    title: "System",
    items: [{ title: "Settings", href: "/admin/settings", icon: Settings, keywords: "organization fees contact social" }],
  },
];

/** Homepage builder sections (also listed in the command palette). */
export const CMS_SECTIONS: { title: string; slug: string }[] = [
  { title: "Hero", slug: "hero" },
  { title: "Statistics", slug: "statistics" },
  { title: "Categories", slug: "categories" },
  { title: "Features", slug: "features" },
  { title: "Premium plans", slug: "premium" },
  { title: "Recent items", slug: "recent-items" },
  { title: "Global network", slug: "global-network" },
  { title: "FAQ", slug: "faq" },
  { title: "Call to action", slug: "cta" },
  { title: "Footer", slug: "footer" },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.title })));

function matches(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname === "/admin/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

/** The most specific nav entry for a path. */
export function findActiveItem(pathname: string) {
  return ALL_ITEMS.filter((i) => matches(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
}

export type Crumb = { label: string; href?: string };

export function getBreadcrumbs(pathname: string): Crumb[] {
  const item = findActiveItem(pathname);
  if (!item) return [{ label: "Admin", href: "/admin" }];
  const crumbs: Crumb[] = [{ label: item.group }, { label: item.title, href: item.href }];
  if (item.href === "/admin/cms/homepage") {
    const slug = pathname.split("/")[4];
    const section = CMS_SECTIONS.find((s) => s.slug === slug);
    if (section) crumbs.push({ label: section.title });
  } else if (item.href === "/admin/cms/pages" && pathname !== item.href) {
    crumbs.push({ label: "Edit page" });
  }
  return crumbs;
}
