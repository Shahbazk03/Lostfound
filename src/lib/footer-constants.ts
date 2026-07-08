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
      { label: "Help Center", url: "/help-center" },
      { label: "Safety Tips", url: "/safety-tips" },
      { label: "Community FAQ", url: "/community-faq" },
      { label: "Success Stories", url: "/success-stories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", url: "/about-us" },
      { label: "Careers", url: "/careers" },
      { label: "Press Kit", url: "/press-kit" },
      { label: "Contact", url: "/contact" },
      { label: "Partners", url: "/partners" },
    ],
  },
];
