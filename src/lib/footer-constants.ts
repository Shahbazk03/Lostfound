export interface FooterGroup {
  title: string;
  links: { label: string; url: string }[];
}

export const defaultFooterGroups: FooterGroup[] = [
  {
    title: "Platform",
    links: [
      { label: "Browse Items", url: "/browse" },
      { label: "Report Lost", url: "/report" },
      { label: "Report Found", url: "/report" },
      { label: "User Dashboard", url: "/dashboard" },
      { label: "Premium Features", url: "/pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help Center", url: "/help" },
      { label: "Safety Tips", url: "/safety" },
      { label: "Community FAQ", url: "/faq" },
      { label: "Success Stories", url: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", url: "/about" },
      { label: "Careers", url: "/careers" },
      { label: "Press Kit", url: "/press" },
      { label: "Contact", url: "/contact" },
      { label: "Partners", url: "/partners" },
    ],
  },
];
