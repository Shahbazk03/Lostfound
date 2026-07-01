export interface HelpCategory {
  title: string;
  description: string;
  iconName: string;
  link: string;
}

export interface SafetyPrinciple {
  title: string;
  description: string;
  iconName: string;
}

export interface ScamFlag {
  title: string;
  description: string;
}

export interface FAQQuestion {
  q: string;
  a: string;
}

export interface FAQCategory {
  category: string;
  questions: FAQQuestion[];
}

export interface BlogStory {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
}

export const defaultHelpCategories: HelpCategory[] = [
  {
    title: "Getting Started",
    description: "Learn how to set up your account and start reporting items.",
    iconName: "Book",
    link: "/help/getting-started",
  },
  {
    title: "Reporting & Claims",
    description: "Everything you need to know about reporting lost items and claiming found ones.",
    iconName: "FileQuestion",
    link: "/help/reporting",
  },
  {
    title: "Trust & Safety",
    description: "Guidelines on safe meetups, verifying ownership, and avoiding scams.",
    iconName: "ShieldAlert",
    link: "/safety",
  },
  {
    title: "Account & Profile",
    description: "Manage your profile settings, notifications, and privacy preferences.",
    iconName: "Users",
    link: "/help/account",
  },
];

export const defaultSafetyPrinciples: SafetyPrinciple[] = [
  {
    title: "Meet in Safe Public Places",
    description: "Always arrange to meet in well-lit, busy public areas during daylight hours. Police station lobbies, crowded cafes, or shopping malls are highly recommended.",
    iconName: "MapPin"
  },
  {
    title: "Verify Ownership Diligently",
    description: "Don't hand over items blindly. Ask the claimant to describe a unique detail about the item (like a scratch, lock screen photo, or serial number) that isn't visible in the listing.",
    iconName: "Eye"
  },
  {
    title: "Protect Personal Info",
    description: "Never share your home address, financial information, or social security numbers. Keep all communication within the platform's secure messaging system until you meet.",
    iconName: "Lock"
  }
];

export const defaultScamFlags: ScamFlag[] = [
  {
    title: "Demanding money upfront",
    description: "Never pay an 'advance shipping fee' or 'holding deposit' to claim your lost item."
  },
  {
    title: "Refusing to meet in public",
    description: "If a user insists on meeting in a secluded area or coming to your home, cancel the meetup immediately."
  },
  {
    title: "Taking communication off-platform early",
    description: "Be wary of users who immediately ask for your personal phone number or email address."
  }
];

export const defaultFaqs: FAQCategory[] = [
  {
    category: "General",
    questions: [
      {
        q: "How much does it cost to use the platform?",
        a: "Creating an account and posting lost or found items is completely free. We believe in keeping the community accessible to everyone. We may introduce optional premium features for businesses or high-volume users in the future."
      },
      {
        q: "Is my personal information public?",
        a: "No. We take your privacy very seriously. Only your display name is shown on listings. When you connect with someone to claim an item, communication happens through our secure messaging system. Your email and phone number remain private unless you explicitly share them."
      }
    ]
  },
  {
    category: "For Finders",
    questions: [
      {
        q: "What should I write in the description?",
        a: "Provide enough detail so the owner can recognize it (e.g., 'Blue iPhone 13 in a clear case found near the park entrance'). However, always leave out one or two identifying features (like the lock screen wallpaper or a specific scratch) so you can verify the true owner when they contact you."
      },
      {
        q: "How do I verify the person claiming the item is the real owner?",
        a: "Ask them to describe the hidden details you left out of your description. If it's a phone or laptop, ask them to unlock it in front of you. If it's a wallet, ask them to name the cards inside."
      }
    ]
  },
  {
    category: "For Losers",
    questions: [
      {
        q: "How long do listings stay active?",
        a: "Lost item listings remain active for 90 days by default. You can renew them or mark them as 'Found' at any time from your dashboard."
      },
      {
        q: "Someone claims they have my item but wants money first. What do I do?",
        a: "Do not send them money. This is a common scam. A genuine finder will agree to meet in a public place to return the item. Please report the user immediately using the flag icon on their message so our trust and safety team can investigate."
      }
    ]
  }
];

export const defaultStories: BlogStory[] = [
  {
    id: "1",
    title: "Reunited with a family heirloom after 3 years.",
    excerpt: "When Sarah lost her grandmother's necklace on a train in 2021, she thought it was gone forever. Thanks to a diligent commuter and our platform, the necklace is back where it belongs.",
    date: "Oct 12, 2023",
    readTime: "4 min read",
    category: "Jewelry",
    image: "https://images.unsplash.com/photo-1599643478524-fb66f70a00ba?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "2",
    title: "How a lost dog found his way across three state lines.",
    excerpt: "Max, a Golden Retriever, went missing during a camping trip. Six months later, a shelter worker recognized him from a 'Lost' listing on our platform.",
    date: "Nov 05, 2023",
    readTime: "6 min read",
    category: "Pets",
    image: "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "3",
    title: "A photographer's stolen SD card returned with all memories intact.",
    excerpt: "Professional photographer David had his camera bag stolen. While the camera was gone, a good samaritan found the discarded SD card containing wedding photos and returned it.",
    date: "Jan 18, 2024",
    readTime: "5 min read",
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "4",
    title: "The passport that almost ruined a honeymoon.",
    excerpt: "Just 24 hours before their flight to Bali, Mark realized he left his passport at a coffee shop. See how the community rallied to get it back to him in time.",
    date: "Mar 22, 2024",
    readTime: "3 min read",
    category: "Documents",
    image: "https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "5",
    title: "Found: A vintage acoustic guitar left in a taxi.",
    excerpt: "A rare 1960s acoustic guitar was left in the back of a cab. The driver used our platform to track down the musician, refusing to accept any reward.",
    date: "Apr 10, 2024",
    readTime: "5 min read",
    category: "Instruments",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=800&auto=format&fit=crop"
  },
  {
    id: "6",
    title: "A child's favorite teddy bear makes it home.",
    excerpt: "Losing a favorite toy can be devastating for a toddler. When 'Mr. Bear' was left at the zoo, a teenager found him and posted him on the app.",
    date: "May 02, 2024",
    readTime: "2 min read",
    category: "Toys",
    image: "https://images.unsplash.com/photo-1559454403-b8fb88521f11?q=80&w=800&auto=format&fit=crop"
  }
];

// FOUNDER
export interface FounderContent {
  name: string;
  designation: string;
  image: string;
  details: string;
}
export const defaultFounder: FounderContent = {
  name: "Sarah Jenkins",
  designation: "Founder & CEO",
  image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop",
  details: "Our mission is to create a reliable global ledger for recovering lost assets. We believe in building trust through technology, reconnecting people with what matters most."
};

// ABOUT US
export interface AboutValue {
  title: string;
  desc: string;
  iconName: string;
  color: string;
}
export interface AboutContent {
  title: string;
  subtitle: string;
  values: AboutValue[];
}
export const defaultAbout: AboutContent = {
  title: "Reconnecting the World",
  subtitle: "LOSTFOUND is the world's leading platform dedicated to bringing people and their lost belongings back together. We believe in the power of community, trust, and innovative technology.",
  values: [
    { title: "Trust First", desc: "We prioritize security and privacy above all else to ensure a safe environment for everyone.", iconName: "ShieldCheck", color: "emerald" },
    { title: "Community Driven", desc: "Our platform is powered by the kindness and integrity of millions of people worldwide.", iconName: "Heart", color: "rose" },
    { title: "Relentless Innovation", desc: "We constantly push the boundaries of technology to make finding lost items faster.", iconName: "Zap", color: "amber" }
  ]
};

// CAREERS
export interface CareerBenefit {
  title: string;
  desc: string;
  iconName: string;
  bgClass: string;
  textClass: string;
}
export interface CareerRole {
  title: string;
  team: string;
  location: string;
  type: string;
}
export interface CareersContent {
  title: string;
  subtitle: string;
  benefits: CareerBenefit[];
  roles: CareerRole[];
}
export const defaultCareers: CareersContent = {
  title: "Build the Future of Trust",
  subtitle: "Help us reconnect millions of people with the things that matter most. We are looking for passionate builders to join our global team.",
  benefits: [
    { title: "Work Anywhere", desc: "Remote-first culture with co-working stipends.", iconName: "Laptop", bgClass: "bg-purple-100", textClass: "text-purple-600" },
    { title: "Health & Wellness", desc: "Comprehensive global health coverage and mental health days.", iconName: "HeartPulse", bgClass: "bg-rose-100", textClass: "text-rose-600" },
    { title: "Never Stop Learning", desc: "Annual budget for courses, books, and conferences.", iconName: "GraduationCap", bgClass: "bg-amber-100", textClass: "text-amber-600" }
  ],
  roles: [
    { title: "Senior Frontend Engineer", team: "Engineering", location: "Remote", type: "Full-time" },
    { title: "Product Designer", team: "Design", location: "San Francisco, CA", type: "Full-time" },
    { title: "Community Manager", team: "Marketing", location: "London, UK", type: "Contract" },
    { title: "Trust & Safety Specialist", team: "Operations", location: "Remote", type: "Full-time" }
  ]
};

// PRESS KIT
export interface PressRelease {
  date: string;
  title: string;
}
export interface PressContent {
  title: string;
  subtitle: string;
  releases: PressRelease[];
}
export const defaultPress: PressContent = {
  title: "LOSTFOUND in the News",
  subtitle: "Everything you need to write about our mission to reconnect people with their lost belongings.",
  releases: [
    { date: "Oct 12, 2026", title: "LOSTFOUND reaches 10,000 items recovered globally." },
    { date: "Aug 05, 2026", title: "Introducing our new AI-powered matching algorithm." },
    { date: "May 22, 2026", title: "LOSTFOUND secures Series A funding to expand trust platform." }
  ]
};

// CONTACT
export interface ContactChannel {
  title: string;
  desc: string;
  iconName: string;
  contact: string;
}
export interface ContactContent {
  title: string;
  subtitle: string;
  channels: ContactChannel[];
}
export const defaultContact: ContactContent = {
  title: "Get in Touch",
  subtitle: "Whether you have a question, need support, or want to explore a partnership, our team is here to help.",
  channels: [
    { title: "General Support", desc: "Help with your account or lost items.", iconName: "MessageSquare", contact: "support@lostfound.com" },
    { title: "Media Inquiries", desc: "For press and media relations.", iconName: "Mail", contact: "press@lostfound.com" },
    { title: "Partnerships", desc: "Explore business opportunities.", iconName: "PhoneCall", contact: "partners@lostfound.com" }
  ]
};

// PARTNERS
export interface PartnerBenefit {
  title: string;
  desc: string;
  iconName: string;
}
export interface PartnersContent {
  title: string;
  subtitle: string;
  benefits: PartnerBenefit[];
}
export const defaultPartners: PartnersContent = {
  title: "Stronger Together",
  subtitle: "Integrate with the LOSTFOUND API, empower your customers, and join the world's most trusted recovery network.",
  benefits: [
    { title: "API Integration", desc: "Seamlessly connect your existing inventory or lost & found management software with our global network.", iconName: "Server" },
    { title: "Enterprise Grade", desc: "Built for scale with 99.99% uptime, dedicated account managers, and robust security protocols.", iconName: "Building2" },
    { title: "Trusted Network", desc: "Leverage our verified user base and state-of-the-art matching algorithms to resolve claims faster.", iconName: "ShieldCheck" }
  ]
};
