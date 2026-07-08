import { db } from "../src/db";
import { users, blogCategories, blogTags, blogPosts, blogPostTags, blogComments } from "../src/db/schema";
import { eq, inArray } from "drizzle-orm";
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SEED_AUTHORS = [
  { name: "Sarah Johnson", email: "sarah@lostfound.com", role: "admin", bio: "Community Safety Expert", position: "Community Expert", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256" },
  { name: "Michael Chen", email: "michael@lostfound.com", role: "admin", bio: "AI Product Engineer focusing on matching algorithms", position: "AI Product Engineer", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256" },
  { name: "Emily Carter", email: "emily@lostfound.com", role: "admin", bio: "Travel Security Specialist and blogger", position: "Travel Security Specialist", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=256" },
  { name: "David Wilson", email: "david@lostfound.com", role: "admin", bio: "Campus Operations Advisor with 10 years experience", position: "Campus Advisor", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256" },
  { name: "Sophia Martinez", email: "sophia@lostfound.com", role: "admin", bio: "Editor in Chief at LostFound Editorial Team", position: "Editorial Team", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256" }
];

const SEED_CATEGORIES = [
  { name: "AI Technology", slug: "ai-technology", color: "#6366f1", description: "Discover how Artificial Intelligence is revolutionizing the way we recover lost items globally." },
  { name: "Travel", slug: "travel", color: "#0ea5e9", description: "Essential guides and stories for travelers navigating airports, hotels, and public transport." },
  { name: "Safety", slug: "safety", color: "#ef4444", description: "Expert advice on personal security, data protection, and community safety." },
  { name: "Recovery Stories", slug: "recovery-stories", color: "#10b981", description: "Heartwarming success stories from the LostFound community." },
  { name: "Community", slug: "community", color: "#f59e0b", description: "Building stronger communities through trust and collaboration." },
  { name: "Universities", slug: "universities", color: "#8b5cf6", description: "Campus safety and smart lost & found management for educational institutions." },
  { name: "Airports", slug: "airports", color: "#3b82f6", description: "Navigating the complexities of airport lost property departments." },
  { name: "Business", slug: "business", color: "#64748b", description: "Corporate lost and found solutions and best practices for businesses." },
  { name: "Technology", slug: "technology", color: "#14b8a6", description: "The latest gadgets, GPS trackers, and tech protecting your belongings." },
  { name: "Guides", slug: "guides", color: "#f43f5e", description: "Step-by-step tutorials and comprehensive recovery guides." },
  { name: "Announcements", slug: "announcements", color: "#8b5cf6", description: "Official news and updates from the LostFound team." },
  { name: "Security", slug: "security", color: "#0f172a", description: "Cybersecurity, physical security, and privacy insights." },
  { name: "Product Updates", slug: "product-updates", color: "#059669", description: "New features and platform improvements." }
];

const SEED_TAGS = [
  { name: "AI", slug: "ai" }, { name: "Recovery", slug: "recovery" }, { name: "Lost Items", slug: "lost-items" }, 
  { name: "Found Items", slug: "found-items" }, { name: "Travel", slug: "travel" }, { name: "Safety", slug: "safety" }, 
  { name: "Wallet", slug: "wallet" }, { name: "Phone", slug: "phone" }, { name: "Laptop", slug: "laptop" }, 
  { name: "Passport", slug: "passport" }, { name: "University", slug: "university" }, { name: "Airport", slug: "airport" }, 
  { name: "Technology", slug: "technology" }, { name: "Security", slug: "security" }, { name: "Community", slug: "community" }, 
  { name: "Guide", slug: "guide" }
];

const IMAGES = [
  "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1520694478166-daaaaec95b69?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=2000",
  "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=2000"
];

const HTML_CONTENT = `
<p class="lead">Losing a personal item can be a stressful experience, but acting quickly and methodically significantly increases your chances of recovery. In this comprehensive guide, we cover everything you need to know about navigating the recovery process efficiently.</p>
<h2>1. Retrace Your Steps Immediately</h2>
<p>The first 24 hours are critical. Start by mapping out your exact movements prior to noticing the item was missing. Use timelines and receipts to pinpoint your locations.</p>
<blockquote>"Time is of the essence. The faster you act, the higher the probability of successful recovery."</blockquote>
<h2>2. Leverage AI Technology</h2>
<p>Modern platforms like LostFound use advanced AI algorithms to match descriptions and images of lost items with found reports globally. Ensure your report includes:</p>
<ul>
  <li>Clear, distinct characteristics (scratches, unique stickers).</li>
  <li>Exact timestamps of the last known location.</li>
  <li>Serial numbers or identification marks.</li>
</ul>
<div class="bg-slate-50 dark:bg-slate-900 border-l-4 border-emerald-500 p-6 rounded-r-xl my-8">
  <h4 class="font-bold text-slate-900 dark:text-white mt-0 mb-2">Pro Tip: Serial Numbers</h4>
  <p class="mb-0 text-slate-600 dark:text-slate-400">Always keep a digital record of the serial numbers for your expensive electronics. This proves ownership immediately upon recovery.</p>
</div>
<h2>3. Notify the Authorities and Facilities</h2>
<p>If you lost your item in an airport, university, or shopping mall, they have dedicated security protocols. Submit a detailed report immediately. If the item contained sensitive data, such as a passport or wallet, contacting local law enforcement is mandatory to prevent identity theft.</p>
<p>Remember, the community is your strongest asset. Join local groups and utilize digital lost-and-found boards to amplify your search radius.</p>
<hr />
<h2>Conclusion</h2>
<p>By combining rapid action, AI technology, and community support, recovering lost items is no longer a game of chance. Stay vigilant, stay safe, and remember to always report found items to pay it forward.</p>
`;

const FEATURED_POSTS = [
  {
    title: "How AI is Transforming Lost & Found Recovery Around the World",
    excerpt: "Artificial intelligence isn't just a buzzword; it's actively reuniting thousands of people with their most precious lost belongings through advanced matching algorithms.",
    featured: true,
    views: 12450,
    likes: 342,
    readingTime: 8,
  },
  {
    title: "10 Things You Should Do Immediately After Losing Your Wallet",
    excerpt: "Losing your wallet is panic-inducing. Here is the ultimate step-by-step checklist to secure your identity and money before it's too late.",
    featured: true,
    views: 8900,
    likes: 520,
    readingTime: 6,
  },
  {
    title: "The Complete Guide to Recovering Lost Mobile Phones",
    excerpt: "From using built-in tracker networks to locking the device remotely, this guide covers everything you need to know about getting your phone back.",
    featured: true,
    views: 15200,
    likes: 890,
    readingTime: 12,
  },
  {
    title: "Airport Lost & Found: Everything Travelers Need to Know",
    excerpt: "Did you leave your laptop at TSA? Navigating airport bureaucracy can be a nightmare. Here is exactly who to call and what forms to fill out.",
    featured: true,
    views: 11050,
    likes: 410,
    readingTime: 10,
  },
  {
    title: "How Universities Can Build Smarter Lost & Found Systems",
    excerpt: "Campuses handle thousands of lost items daily. Discover how transitioning to a digital, AI-driven system reduces overhead and increases student satisfaction.",
    featured: true,
    views: 5600,
    likes: 180,
    readingTime: 7,
  },
  { title: "The Psychology Behind Returning Lost Items", excerpt: "What compels a stranger to go out of their way to return a lost wallet? We explore the fascinating behavioral psychology of honesty.", featured: false, views: 4200, likes: 210, readingTime: 5 },
  { title: "Best Practices for Businesses Managing Lost Property", excerpt: "Stop using a cardboard box behind the counter. Here is how modern businesses manage found property efficiently and legally.", featured: false, views: 3100, likes: 115, readingTime: 6 },
  { title: "How LostFound Protects User Privacy and Security", excerpt: "A deep dive into our encryption, data anonymization, and secure communication channels that keep your personal information safe.", featured: false, views: 6700, likes: 330, readingTime: 8 },
  { title: "Top Travel Safety Tips to Avoid Losing Important Items", excerpt: "Prevention is better than cure. Learn the travel hacks experts use to ensure they never leave a hotel room without their passport.", featured: false, views: 9800, likes: 450, readingTime: 9 },
  { title: "Real Success Stories From the LostFound Community", excerpt: "From a lost wedding ring in the ocean to a laptop left on a train, read the most incredible recovery stories from our global community.", featured: false, views: 18900, likes: 1200, readingTime: 15 }
];

// Additional 20 titles for seeding
const ADDITIONAL_TITLES = [
  "Why You Should Never Post Found Credit Cards on Social Media",
  "The Future of GPS Tracking: Smaller, Cheaper, Better",
  "How Smart Cities are Integrating Digital Lost and Found",
  "What Happens to Unclaimed Baggage at the Airport?",
  "The Ultimate Guide to Securing Your Digital Life if Your Laptop is Stolen",
  "How to Safely Return a Lost Item You Found",
  "Public Transport Lost Property: A Global Comparison",
  "Why Bluetooth Trackers are Essential for Frequent Flyers",
  "Campus Safety: The Hidden Cost of Lost Student IDs",
  "Hotel Lost and Found: Secrets from the Hospitality Industry",
  "How to Prove Ownership of a Lost Item",
  "The Role of Community Networks in Item Recovery",
  "Cyber Security Threats When Losing an Unlocked Phone",
  "Data Privacy: What Happens When Someone Finds Your USB Drive?",
  "How Machine Learning Identifies Lost Pets from Photos",
  "The Emotional Toll of Losing Irreplaceable Family Heirlooms",
  "Emergency Recovery: Steps to Take When Traveling Abroad",
  "Why Traditional Lost and Found Departments are Failing",
  "How to Use Social Media Effectively to Find Lost Items",
  "The Top 5 Items Most Frequently Lost in Shopping Malls"
];

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function main() {
  console.log("Starting Enterprise Blog Seed Script...");

  // 1. Seed Authors
  console.log("Seeding Authors...");
  const authorIds = [];
  for (const a of SEED_AUTHORS) {
    let [user] = await db.select().from(users).where(eq(users.email, a.email));
    if (!user) {
      const [newUser] = await db.insert(users).values({
        email: a.email,
        name: a.name,
        role: a.role as any,
        password: "dummy_password",
        avatar: a.avatar,
        bio: a.bio,
        position: a.position
      }).returning();
      user = newUser;
    }
    authorIds.push(user.id);
  }

  // 2. Seed Categories
  console.log("Seeding Categories...");
  const categoryIds = [];
  for (const c of SEED_CATEGORIES) {
    let [cat] = await db.select().from(blogCategories).where(eq(blogCategories.slug, c.slug));
    if (!cat) {
      const [newCat] = await db.insert(blogCategories).values(c).returning();
      cat = newCat;
    }
    categoryIds.push(cat.id);
  }

  // 3. Seed Tags
  console.log("Seeding Tags...");
  const tagIds = [];
  for (const t of SEED_TAGS) {
    let [tag] = await db.select().from(blogTags).where(eq(blogTags.slug, t.slug));
    if (!tag) {
      const [newTag] = await db.insert(blogTags).values(t).returning();
      tag = newTag;
    }
    tagIds.push(tag.id);
  }

  // 4. Seed Posts
  console.log("Seeding Posts...");
  const allPostTitles = [...FEATURED_POSTS, ...ADDITIONAL_TITLES.map(title => ({
    title,
    excerpt: "This is a comprehensive, professionally written article exploring the nuances and critical information regarding " + title.toLowerCase() + ". Discover expert insights and actionable advice.",
    featured: false,
    views: Math.floor(Math.random() * 5000) + 100,
    likes: Math.floor(Math.random() * 500) + 10,
    readingTime: Math.floor(Math.random() * 10) + 3,
  }))];

  for (let i = 0; i < allPostTitles.length; i++) {
    const p = allPostTitles[i];
    const slug = generateSlug(p.title);
    let [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    
    if (!post) {
      const randomAuthorId = authorIds[Math.floor(Math.random() * authorIds.length)];
      const randomCategoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      const randomImage = IMAGES[i % IMAGES.length];
      
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - Math.floor(Math.random() * 100)); // Random date in last 100 days

      const [newPost] = await db.insert(blogPosts).values({
        title: p.title,
        slug,
        excerpt: p.excerpt,
        content: HTML_CONTENT,
        featuredImage: randomImage,
        authorId: randomAuthorId,
        categoryId: randomCategoryId,
        status: "published",
        featured: p.featured,
        allowComments: true,
        readingTime: p.readingTime,
        views: p.views,
        likes: p.likes,
        seoTitle: p.title,
        seoDescription: p.excerpt,
        publishedAt: publishDate,
        createdAt: publishDate,
      }).returning();
      post = newPost;

      // Assign 2-4 random tags
      const numTags = Math.floor(Math.random() * 3) + 2;
      const shuffledTags = [...tagIds].sort(() => 0.5 - Math.random());
      for (let j = 0; j < numTags; j++) {
        await db.insert(blogPostTags).values({
          postId: post.id,
          tagId: shuffledTags[j],
        });
      }

      // 5. Seed Comments
      const numComments = Math.floor(Math.random() * 4) + 2; // 2-5 comments
      const commentTexts = [
        "This guide helped me recover my laptop.",
        "The airport checklist was extremely useful.",
        "I shared this with my university.",
        "Excellent article.",
        "Very informative.",
        "I never thought about it this way, thank you!",
        "Can you write more about this topic?",
        "This is exactly what I was looking for.",
      ];
      for (let k = 0; k < numComments; k++) {
        await db.insert(blogComments).values({
          postId: post.id,
          authorName: "Reader " + Math.floor(Math.random() * 1000),
          authorEmail: "reader" + Math.floor(Math.random() * 1000) + "@example.com",
          message: commentTexts[Math.floor(Math.random() * commentTexts.length)],
          status: "approved",
          createdAt: publishDate, // roughly same time
        });
      }
    }
  }

  console.log("Successfully seeded database with Enterprise Blog Content.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Error seeding blog:", err);
  process.exit(1);
});
