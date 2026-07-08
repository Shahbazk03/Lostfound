import { db } from "../src/db";
import { cmsPages, cmsPageBlocks } from "../src/db/schema";
import { eq } from "drizzle-orm";

async function runSeed() {
  console.log("Seeding Production CMS Pages...");

  const pagesToSeed = [
    {
      title: "Help Center",
      slug: "help-center",
      seoTitle: "Help Center & Support | LostFound",
      seoDescription: "Find answers to frequently asked questions, learn how to report lost items safely, and get support from our community team.",
      blocks: [
        { type: "hero", content: { headline: "How can we help you today?", subheading: "Search our knowledge base or browse popular topics to find exactly what you need.", primaryButtonText: "Search Guides", primaryButtonLink: "#topics", secondaryButtonText: "Contact Support", secondaryButtonLink: "/contact" } },
        { type: "statistics", content: { title: "Our Support Network", stats: [{ value: "2", prefix: "", suffix: "M+", label: "Items Recovered" }, { value: "10", prefix: "", suffix: "k", label: "Active Users" }, { value: "98", prefix: "", suffix: "%", label: "Resolution Rate" }, { value: "24", prefix: "", suffix: "/7", label: "Support" }] } },
        { type: "feature-grid", content: { title: "Popular Topics", features: [
          { title: "Reporting Lost Items", description: "Step-by-step guide to reporting an item you've lost, maximizing its chances of recovery." },
          { title: "Found Something?", description: "How to safely list a found item and connect with its rightful owner." },
          { title: "Account Settings", description: "Manage your profile, update notification preferences, and upgrade to Premium." },
          { title: "Trust & Safety", description: "Guidelines for meeting safely and preventing scams on the platform." },
          { title: "Premium Benefits", description: "Learn about instant SMS alerts and advanced matching algorithms." },
          { title: "Rewards System", description: "How to offer and claim rewards securely." }
        ]}},
        { type: "faq", content: { title: "Frequently Asked Questions", items: [
          { question: "How long does it usually take to find a lost item?", answer: "Recovery times vary based on the item and location. On average, high-traffic areas see a 48-hour recovery window. Premium users often see faster results due to priority alerts." },
          { question: "Is the platform free to use?", answer: "Yes! Basic reporting and searching are completely free. We offer a Premium tier for advanced features like SMS alerts and highlighted listings." },
          { question: "How do you verify ownership?", answer: "We use a multi-step verification process. Finders can ask specific questions about the item (e.g., lock screen wallpaper, serial numbers, specific scratches) that only the owner would know." }
        ]}},
        { type: "cta", content: { headline: "Still need assistance?", subheading: "Our dedicated support team is available 24/7 to help you resolve any issues.", buttonText: "Contact Support", buttonLink: "/contact" } }
      ]
    },
    {
      title: "Safety Tips",
      slug: "safety-tips",
      seoTitle: "Trust & Safety Guidelines | LostFound",
      seoDescription: "Read our comprehensive safety guidelines to ensure secure meetups, avoid scams, and protect your personal information.",
      blocks: [
        { type: "hero", content: { headline: "Your Safety is Our Priority", subheading: "We are committed to creating a secure and trustworthy community. Please follow these guidelines for a safe experience.", primaryButtonText: "Read Guidelines", primaryButtonLink: "#guidelines" } },
        { type: "feature-grid", content: { title: "Safe Meetup Checklist", features: [
          { title: "Public Locations Only", description: "Always arrange to meet in well-lit, public spaces like coffee shops, malls, or police station lobbies." },
          { title: "Bring a Friend", description: "Whenever possible, bring someone with you to the meetup. If you must go alone, share your location with a trusted contact." },
          { title: "Daylight Hours", description: "Schedule exchanges during the daytime. Avoid secluded areas or nighttime meetups." }
        ]}},
        { type: "rich-text", content: { html: "<h2>Scam Prevention</h2><p>While most of our community is honest, it's important to stay vigilant. Never send money electronically (via wire transfer, gift cards, or crypto) before receiving your item. Beware of users who refuse to meet in person or provide vague answers about the item's details. If someone asks for a 'shipping fee' in advance for a found item, it is likely a scam.</p><h2>Protecting Personal Information</h2><p>Do not share your home address, Social Security number, or financial details. Keep communication within our platform's secure messaging system until you are comfortable moving forward.</p>" } },
        { type: "faq", content: { title: "Safety FAQs", items: [
          { question: "What should I do if I feel unsafe during a meetup?", answer: "Trust your instincts. If a situation feels wrong, leave immediately. Go to a crowded public space and contact local authorities if necessary." },
          { question: "How can I report a suspicious user?", answer: "You can report any user or listing directly through the app by clicking the 'Report' flag on their profile or item page. Our trust and safety team reviews all reports within 24 hours." }
        ]}},
        { type: "cta", content: { headline: "Report Suspicious Activity", subheading: "Help us keep the community safe. If you see something wrong, let us know immediately.", buttonText: "Report an Issue", buttonLink: "/contact" } }
      ]
    },
    {
      title: "Community FAQ",
      slug: "community-faq",
      seoTitle: "Community FAQ | LostFound",
      seoDescription: "Answers to all your questions about the LostFound community, from reporting items to claiming rewards.",
      blocks: [
        { type: "hero", content: { headline: "Everything You Need to Know", subheading: "Browse our comprehensive FAQ to learn how to make the most of the LostFound platform.", primaryButtonText: "General Questions", primaryButtonLink: "#general" } },
        { type: "faq", content: { title: "General Questions", items: [
          { question: "What is LostFound?", answer: "LostFound is a global platform dedicated to reuniting people with their lost belongings through a community-driven database and advanced AI matching." },
          { question: "How does the matching algorithm work?", answer: "Our system analyzes item descriptions, categories, dates, and geolocation data. When a reported lost item closely matches a reported found item, we notify both parties instantly." },
          { question: "Is my data secure?", answer: "Yes. We use enterprise-grade encryption for all personal data and messages. We never sell your data to third parties." }
        ]}},
        { type: "faq", content: { title: "Lost & Found Items", items: [
          { question: "I lost my phone, but it's dead. What do I do?", answer: "Report the last known location, the exact model, color, and any identifying marks (like case type or scratches). Many phones are turned in to local businesses before they are listed here." },
          { question: "What if I find an item but can't hold onto it?", answer: "If you cannot keep the item safe, please hand it over to the nearest police station or the management office of the building where you found it, and mention that location in your 'Found' listing." }
        ]}},
        { type: "faq", content: { title: "Premium & Rewards", items: [
          { question: "What are the benefits of LostFound Premium?", answer: "Premium users receive real-time SMS alerts when a matching item is found, priority listing placement, and access to premium customer support." },
          { question: "Are rewards mandatory?", answer: "No, offering a reward is completely optional, though it can incentivize the community to look harder for your item." }
        ]}}
      ]
    },
    {
      title: "Success Stories",
      slug: "success-stories",
      seoTitle: "Success Stories & Recoveries | LostFound",
      seoDescription: "Read heartwarming stories of people reunited with their lost pets, heirlooms, and electronics thanks to the LostFound community.",
      blocks: [
        { type: "hero", content: { headline: "Reuniting the World", subheading: "Every day, thousands of items are returned to their rightful owners. Read the incredible stories from our community.", primaryButtonText: "Share Your Story", primaryButtonLink: "/contact" } },
        { type: "statistics", content: { title: "The Power of Community", stats: [
          { value: "50", prefix: "", suffix: "k+", label: "Items Returned" },
          { value: "1.2", prefix: "$", suffix: "M", label: "Value Recovered" },
          { value: "89", prefix: "", suffix: "k", label: "Happy Users" },
          { value: "12", prefix: "", suffix: "h", label: "Avg. Recovery Time" }
        ]}},
        { type: "testimonials", content: { title: "Heartwarming Recoveries", items: [
          { name: "Sarah Jenkins", role: "Photographer", story: "I left my camera bag containing years of SD card backups on the subway. A commuter found it, posted it on LostFound, and I had it back the next morning. I can't express my gratitude enough!", avatar: "https://i.pravatar.cc/150?u=sarah", recoveredItem: "Sony A7III Camera Bag" },
          { name: "Michael Chen", role: "Student", story: "Lost my wallet right before finals with all my IDs. A barista at a local cafe used the app to track me down. Life saver!", avatar: "https://i.pravatar.cc/150?u=michael", recoveredItem: "Leather Wallet" },
          { name: "Elena Rodriguez", role: "Musician", story: "My vintage acoustic guitar was misplaced at the airport. I thought it was gone forever. The airport staff actually use LostFound to log items, and I was matched within 3 days.", avatar: "https://i.pravatar.cc/150?u=elena", recoveredItem: "Vintage Martin Guitar" }
        ]}},
        { type: "gallery", content: { title: "Reunion Moments", images: [
          { url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Max reunited with his owner!" },
          { url: "https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "The missing laptop returned." },
          { url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", caption: "Wedding ring recovered." }
        ]}},
        { type: "cta", content: { headline: "Did you find what you lost?", subheading: "We'd love to feature your reunion. Share your experience to inspire others.", buttonText: "Submit Your Story", buttonLink: "/contact" } }
      ]
    },
    {
      title: "About Us",
      slug: "about-us",
      seoTitle: "About LostFound | Our Mission and Vision",
      seoDescription: "Learn about the mission behind LostFound, the team driving the platform, and our core values for community trust.",
      blocks: [
        { type: "hero", content: { headline: "Restoring Faith in Humanity", subheading: "We believe that people are inherently good. Our platform bridges the gap between those who lose and those who find.", primaryButtonText: "Join the Team", primaryButtonLink: "/careers", secondaryButtonText: "Our Story", secondaryButtonLink: "#story" } },
        { type: "rich-text", content: { html: "<h2>Our Mission</h2><p>To create a centralized, global network that drastically reduces the permanent loss of personal belongings. By leveraging community goodwill and modern technology, we aim to make losing an item a temporary inconvenience rather than a permanent tragedy.</p><h2>Our Vision</h2><p>A world where every lost item finds its way home. We envision LostFound as the default infrastructure for all airports, public transit systems, universities, and cities globally.</p>" } },
        { type: "timeline", content: { title: "Our Journey", events: [
          { year: "2020", title: "The Idea", description: "LostFound was born out of a personal experience of losing a laptop with irreplaceable family photos." },
          { year: "2021", title: "Beta Launch", description: "Launched our MVP in a single city, successfully recovering 500 items in the first month." },
          { year: "2022", title: "Going Global", description: "Expanded to 50 countries and introduced AI matching algorithms." },
          { year: "2024", title: "Enterprise Partnerships", description: "Integrated with major transit hubs and universities worldwide." }
        ]}},
        { type: "team", content: { title: "Leadership Team", members: [
          { name: "Alex Mercer", role: "CEO & Founder", bio: "Former logistics engineer passionate about solving complex network problems.", photo: "https://i.pravatar.cc/300?u=alex" },
          { name: "Samantha Lee", role: "CTO", bio: "AI specialist with a focus on predictive algorithms and search infrastructure.", photo: "https://i.pravatar.cc/300?u=sam" },
          { name: "Marcus Johnson", role: "Head of Trust & Safety", bio: "10 years in cybersecurity, ensuring our community remains safe and secure.", photo: "https://i.pravatar.cc/300?u=marcus" },
          { name: "Priya Patel", role: "VP of Operations", bio: "Scaling our partnerships with global transit authorities.", photo: "https://i.pravatar.cc/300?u=priya" }
        ]}},
        { type: "cta", content: { headline: "Help us build the future", subheading: "We're always looking for passionate people to join our mission.", buttonText: "View Openings", buttonLink: "/careers" } }
      ]
    },
    {
      title: "Careers",
      slug: "careers",
      seoTitle: "Careers at LostFound | Join the Team",
      seoDescription: "Explore career opportunities at LostFound. Join our mission to reunite people with their lost items globally.",
      blocks: [
        { type: "hero", content: { headline: "Do Work That Matters", subheading: "Join a fast-growing, mission-driven team dedicated to building technology that helps people every single day.", primaryButtonText: "View Open Roles", primaryButtonLink: "#jobs" } },
        { type: "feature-grid", content: { title: "Why Work With Us?", features: [
          { title: "Remote-First", description: "Work from anywhere in the world. We value output over office hours." },
          { title: "Health & Wellness", description: "Comprehensive premium health, dental, and vision insurance for you and your dependents." },
          { title: "Unlimited PTO", description: "Take the time you need to recharge. We mandate a minimum of 3 weeks off per year." },
          { title: "Learning Stipend", description: "$2,000 annual budget for courses, books, and conferences." },
          { title: "Home Office Setup", description: "We provide a top-tier laptop and a $1,000 stipend to outfit your home office." },
          { title: "Equity Package", description: "Every employee receives stock options. When we succeed, you succeed." }
        ]}},
        { type: "rich-text", content: { html: "<h2 id='jobs'>Open Positions</h2><h3>Engineering</h3><ul><li><strong>Senior Full Stack Engineer (Next.js/TypeScript)</strong> - Remote</li><li><strong>Machine Learning Engineer (Matching Algorithms)</strong> - Remote</li><li><strong>DevOps / Infrastructure Engineer</strong> - Remote</li></ul><h3>Product & Design</h3><ul><li><strong>Senior Product Designer (UI/UX)</strong> - Remote</li><li><strong>Product Manager (Trust & Safety)</strong> - Remote</li></ul><h3>Operations</h3><ul><li><strong>Partner Success Manager (Enterprise)</strong> - Remote</li><li><strong>Customer Support Specialist (Weekend Shift)</strong> - Remote</li></ul><p><em>Don't see a perfect fit? Send your resume to careers@lostfound.com anyway!</em></p>" } },
        { type: "cta", content: { headline: "Ready to apply?", subheading: "Send us your resume and a brief intro about why you'd be a great fit.", buttonText: "Email Application", buttonLink: "mailto:careers@lostfound.com" } }
      ]
    },
    {
      title: "Press Kit",
      slug: "press-kit",
      seoTitle: "Press Kit & Brand Assets | LostFound",
      seoDescription: "Download LostFound brand assets, logos, media resources, and read our latest company announcements.",
      blocks: [
        { type: "hero", content: { headline: "Press & Media Resources", subheading: "Everything you need to write about LostFound. Download our official brand assets, fact sheets, and high-res screenshots.", primaryButtonText: "Download Assets (.ZIP)", primaryButtonLink: "#" } },
        { type: "statistics", content: { title: "Company Facts", stats: [
          { value: "2020", prefix: "", suffix: "", label: "Year Founded" },
          { value: "50", prefix: "", suffix: "+", label: "Countries Active" },
          { value: "100", prefix: "", suffix: "+", label: "Team Members" },
          { value: "2", prefix: "", suffix: "M+", label: "Items Recovered" }
        ]}},
        { type: "logo-cloud", content: { title: "Featured In", logos: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/b/b9/TechCrunch_logo.svg", alt: "TechCrunch" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/1/11/The_New_York_Times_logo.svg", alt: "NYT" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Forbes_logo.svg", alt: "Forbes" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/7/72/Wired_logo.svg", alt: "Wired" }
        ]}},
        { type: "feature-grid", content: { title: "Brand Guidelines", features: [
          { title: "Primary Logo", description: "Use the full colored logo on light backgrounds. Ensure adequate clear space around the mark." },
          { title: "Colors", description: "Our primary brand color is Emerald Green (#059669) representing safety, success, and restoration." },
          { title: "Typography", description: "We use 'Inter' for all digital interfaces for maximum legibility and a modern aesthetic." }
        ]}},
        { type: "cta", content: { headline: "Media Inquiries", subheading: "Are you a journalist looking for a quote, interview, or more information?", buttonText: "Contact PR Team", buttonLink: "mailto:press@lostfound.com" } }
      ]
    },
    {
      title: "Contact",
      slug: "contact",
      seoTitle: "Contact Us | LostFound Support",
      seoDescription: "Get in touch with the LostFound team for support, business inquiries, or media requests.",
      blocks: [
        { type: "hero", content: { headline: "We're here to help", subheading: "Have a question, feedback, or need assistance? Reach out to our team.", primaryButtonText: "Fill out the Form", primaryButtonLink: "#form" } },
        { type: "feature-grid", content: { title: "Contact Information", features: [
          { title: "Customer Support", description: "support@lostfound.com\nAvailable 24/7" },
          { title: "Business Inquiries", description: "partners@lostfound.com\nMon-Fri, 9am - 5pm EST" },
          { title: "Headquarters", description: "123 Innovation Drive\nSan Francisco, CA 94105" }
        ]}},
        { type: "contact-form", content: { title: "Send us a message", subtitle: "Fill out the form below and a representative will get back to you within 24 hours.", buttonText: "Submit Message" } },
        { type: "faq", content: { title: "Quick Answers", items: [
          { question: "I urgently need to report a stolen item.", answer: "If your item was stolen rather than lost, we strongly advise filing a police report immediately before listing it on the platform." },
          { question: "Can I delete my account?", answer: "Yes, you can permanently delete your account and all associated data from the Account Settings page." }
        ]}}
      ]
    },
    {
      title: "Partners",
      slug: "partners",
      seoTitle: "Enterprise Partnerships | LostFound",
      seoDescription: "Partner with LostFound to streamline your organization's lost and found operations. Ideal for airports, transit systems, and universities.",
      blocks: [
        { type: "hero", content: { headline: "Streamline Your Lost & Found Operations", subheading: "Join hundreds of universities, airports, and corporate campuses using LostFound Enterprise to manage lost items efficiently.", primaryButtonText: "Become a Partner", primaryButtonLink: "/contact", secondaryButtonText: "Download Brochure", secondaryButtonLink: "#" } },
        { type: "logo-cloud", content: { title: "Trusted by Global Organizations", logos: [
          { url: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg", alt: "Corporate Partner" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg", alt: "Tech Partner" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/b/b1/San_Francisco_International_Airport_Logo.svg", alt: "Airport" },
          { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/University_of_California%2C_Berkeley_logo.svg/2560px-University_of_California%2C_Berkeley_logo.svg.png", alt: "University" }
        ]}},
        { type: "feature-grid", content: { title: "Enterprise Benefits", features: [
          { title: "Digital Inventory Management", description: "Replace your paper logs and spreadsheets with a cloud-based visual inventory system." },
          { title: "Automated AI Matching", description: "Our system automatically cross-references your inventory with public reports in your area." },
          { title: "Custom Branded Portal", description: "Provide your customers or students with a branded interface to claim their items." },
          { title: "Analytics & Reporting", description: "Track recovery rates, average storage times, and operational efficiency." },
          { title: "Secure Storage Logistics", description: "Generate QR codes and bin labels to exactly track where physical items are stored." },
          { title: "Legal Compliance", description: "Automated holding period tracking and secure disposal/donation workflows." }
        ]}},
        { type: "testimonials", content: { title: "Partner Success Stories", items: [
          { name: "David Chen", role: "Director of Facilities, State University", story: "Since implementing LostFound Enterprise, we've reduced our storage overhead by 40% and increased our return rate to students from 12% to over 60%.", avatar: "" },
          { name: "Sarah Williams", role: "Customer Experience, Metro Transit", story: "The automated matching has saved our staff hundreds of hours answering phone calls. Passengers can just check the portal.", avatar: "" }
        ]}},
        { type: "cta", content: { headline: "Ready to modernize your operations?", subheading: "Contact our enterprise sales team to schedule a demo and discuss custom integration options.", buttonText: "Request a Demo", buttonLink: "/contact" } }
      ]
    }
  ];

  for (const pageData of pagesToSeed) {
    // Delete existing page if it exists to ensure fresh seed
    await db.delete(cmsPages).where(eq(cmsPages.slug, pageData.slug));

    // Insert new page
    const [insertedPage] = await db.insert(cmsPages).values({
      title: pageData.title,
      slug: pageData.slug,
      status: "published",
      visibility: "public",
      seoTitle: pageData.seoTitle,
      seoDescription: pageData.seoDescription,
    }).returning();

    console.log(`Created page: ${insertedPage.title} (${insertedPage.slug})`);

    // Insert blocks
    for (let i = 0; i < pageData.blocks.length; i++) {
      const block = pageData.blocks[i];
      await db.insert(cmsPageBlocks).values({
        pageId: insertedPage.id,
        type: block.type,
        content: block.content,
        orderIndex: i,
      });
    }
    console.log(` -> Inserted ${pageData.blocks.length} blocks`);
  }

  console.log("Seeding complete! The enterprise CMS is now populated with production-ready content.");
}

runSeed().catch(console.error);
