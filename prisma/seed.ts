import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const AVATAR = (seed: number) => `https://i.pravatar.cc/300?img=${seed}`;
const PHOTO = (seed: number) => `https://picsum.photos/seed/user${seed}/600/800`;

const locationCategories = [
  { name: "All", slug: "all", imageUrl: PHOTO(900) },
  { name: "Rishikesh", slug: "rishikesh", imageUrl: PHOTO(901) },
  { name: "Shimla", slug: "shimla", imageUrl: PHOTO(902) },
  { name: "Manali", slug: "manali", imageUrl: PHOTO(903) },
  { name: "Leh-Ladakh", slug: "leh-ladakh", imageUrl: PHOTO(904) },
  { name: "Goa", slug: "goa", imageUrl: PHOTO(905) },
  { name: "Udaipur Lake Palace", slug: "udaipur-lake-palace", imageUrl: PHOTO(906) },
  { name: "Mumbai", slug: "mumbai", imageUrl: PHOTO(907) },
  { name: "Jaipur", slug: "jaipur", imageUrl: PHOTO(908) },
];

const interests = [
  "Trekking",
  "Photography",
  "Yoga",
  "Music",
  "Cooking",
  "Travel",
  "Dancing",
  "Reading",
  "Fitness",
  "Movies",
  "Gaming",
  "Art",
];

const demoUsers = [
  { username: "aisha_sharma", displayName: "Aisha Sharma", email: "aisha@example.com", gender: "FEMALE", location: "Rishikesh", age: 24, bio: "Yoga instructor who loves the mountains and quiet mornings by the Ganga." },
  { username: "rohan_verma", displayName: "Rohan Verma", email: "rohan@example.com", gender: "MALE", location: "Shimla", age: 27, bio: "Adventure photographer chasing sunrises across the Himalayas." },
  { username: "priya_kapoor", displayName: "Priya Kapoor", email: "priya@example.com", gender: "FEMALE", location: "Goa", age: 26, bio: "Beach lover, foodie, and part-time surf enthusiast." },
  { username: "arjun_mehta", displayName: "Arjun Mehta", email: "arjun@example.com", gender: "MALE", location: "Manali", age: 29, bio: "Software engineer who escapes to the hills every chance I get." },
  { username: "neha_gupta", displayName: "Neha Gupta", email: "neha@example.com", gender: "FEMALE", location: "Jaipur", age: 23, bio: "Fashion designer from the pink city, always sketching." },
  { username: "karan_singh", displayName: "Karan Singh", email: "karan@example.com", gender: "MALE", location: "Leh-Ladakh", age: 31, bio: "Motorcyclist and landscape lover. Roads less travelled." },
  { username: "sara_khan", displayName: "Sara Khan", email: "sara@example.com", gender: "FEMALE", location: "Mumbai", age: 25, bio: "Marketing exec by day, singer by night. City lights forever." },
  { username: "dev_patel", displayName: "Dev Patel", email: "dev@example.com", gender: "MALE", location: "Udaipur Lake Palace", age: 28, bio: "Chef who believes food is a love language served on plates." },
  { username: "riya_nair", displayName: "Riya Nair", email: "riya@example.com", gender: "FEMALE", location: "Mumbai", age: 22, bio: "Dancer, dreamer, and eternal optimist with a coffee obsession." },
  { username: "amit_joshi", displayName: "Amit Joshi", email: "amit@example.com", gender: "MALE", location: "Rishikesh", age: 26, bio: "Yoga teacher and midnight reader. Namaste and see you soon." },
  { username: "meera_reddy", displayName: "Meera Reddy", email: "meera@example.com", gender: "FEMALE", location: "Goa", age: 27, bio: "Digital nomad working from beaches and coffee shops." },
  { username: "vivek_agarwal", displayName: "Vivek Agarwal", email: "vivek@example.com", gender: "MALE", location: "Jaipur", age: 30, bio: "Entrepreneur who loves cricket, chai, and long drives." },
  { username: "tara_bose", displayName: "Tara Bose", email: "tara@example.com", gender: "FEMALE", location: "Shimla", age: 24, bio: "Writing my first novel in the hills. Bookworm and hillwalker." },
  { username: "siddharth_jain", displayName: "Siddharth Jain", email: "siddharth@example.com", gender: "MALE", location: "Manali", age: 25, bio: "Outdoor guide who knows every trail in the valley." },
  { username: "ananya_das", displayName: "Ananya Das", email: "ananya@example.com", gender: "FEMALE", location: "Leh-Ladakh", age: 28, bio: "Documentary filmmaker chasing real stories." },
];

const announcements = [
  {
    title: "Welcome to Love e Birds!",
    content: "We're excited to have you here. Complete your profile to start discovering amazing people. Get verified to unlock premium features!",
  },
  {
    title: "New Feature: Gifts",
    content: "You can now send virtual gifts to people you like. Show someone you care with a thoughtful gift from the Gift Store.",
  },
  {
    title: "Security Tips",
    content: "Never share your OTP or password with anyone. Our team will never ask for your password. Stay safe and happy connecting!",
  },
];

const banners = [
  { slug: "find-your-match", title: "Find Your Match", subtitle: "Meet verified singles nearby", imageUrl: PHOTO(801), sortOrder: 0 },
  { slug: "travel-connect", title: "Travel & Connect", subtitle: "Discover people in beautiful places", imageUrl: PHOTO(802), sortOrder: 1 },
  { slug: "go-verified", title: "Go Verified", subtitle: "Unlock premium features today", imageUrl: PHOTO(803), sortOrder: 2 },
  { slug: "airborne-activities", title: "Airborne Activities", subtitle: "Play and win exciting rewards", imageUrl: PHOTO(804), sortOrder: 3, linkUrl: "/activities/airborne-activities" },
  { slug: "verification-vip", title: "Love E Birds", subtitle: "Unlock VIP benefits and exclusive rewards", imageUrl: PHOTO(805), sortOrder: 4, linkUrl: "/activities/airborne-activities" },
];

async function main() {
  console.log("Seeding database...");

  await prisma.locationCategory.createMany({
    data: locationCategories.map((c, i) => ({ ...c, sortOrder: i })),
    skipDuplicates: true,
  });
  console.log(`Created ${locationCategories.length} location categories`);

  await prisma.interest.createMany({
    data: interests.map((name) => ({ name })),
    skipDuplicates: true,
  });
  console.log(`Created ${interests.length} interests`);

  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      displayName: "Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      creditScore: 1000,
      profile: { create: { bio: "Platform administrator" } },
      wallet: { create: {} },
    },
  });
  console.log("Created admin user:", admin.email);

  const categoryMap = new Map<string, string>();
  const categories = await prisma.locationCategory.findMany();
  for (const c of categories) categoryMap.set(c.name, c.id);

  const interestMap = new Map<string, string>();
  const interestRows = await prisma.interest.findMany();
  for (const i of interestRows) interestMap.set(i.name, i.id);

  const password = await bcrypt.hash("password123", 12);

  let userIndex = 0;
  for (const u of demoUsers) {
    userIndex++;
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    const categoryId = categoryMap.get(u.location);
    const gender = u.gender as "MALE" | "FEMALE" | "OTHER";

    const user =
      existing ??
      (await prisma.user.create({
        data: {
          email: u.email,
          username: u.username,
          displayName: u.displayName,
          passwordHash: password,
          avatar: AVATAR(userIndex),
          creditScore: 60 + ((userIndex * 7) % 40),
          profile: {
            create: {
              bio: u.bio,
              gender,
              age: u.age,
              location: u.location,
              locationCategoryId: categoryId,
              points: 120 + userIndex * 35,
              isOnline: userIndex % 3 === 0,
              isVerified: userIndex % 2 === 0,
              likesCount: userIndex * 3,
              coverImage: PHOTO(1000 + userIndex),
              photos: {
                create: [0, 1, 2].map((p) => ({
                  url: PHOTO(userIndex * 10 + p),
                  sortOrder: p,
                })),
              },
              interests: {
                create: [0, 1, 2, 3].map((ii) => ({
                  interest: {
                    connect: { id: (interestRows[ii % interestRows.length]).id },
                  },
                })),
              },
            },
          },
          wallet: {
            create: {
              balance: 250 + userIndex * 150,
              frozenBalance: userIndex % 2 === 0 ? 50 : 0,
              totalEarned: 500 + userIndex * 200,
            },
          },
        },
      }));

    if (existing) continue;

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { userId: user.id } });
    await prisma.walletTransaction.createMany({
      data: [
        {
          walletId: wallet.id,
          type: "BONUS",
          amount: 100,
          direction: "CREDIT",
          description: "Welcome bonus",
          balanceAfter: 100,
        },
        {
          walletId: wallet.id,
          type: "RECHARGE",
          amount: 150 + userIndex * 50,
          direction: "CREDIT",
          description: "Recharge via UPI",
          balanceAfter: 250 + userIndex * 50,
        },
      ],
    });
  }

  const demoIds = (
    await prisma.user.findMany({
      where: { email: { in: demoUsers.map((u) => u.email) } },
      select: { id: true },
    })
  ).map((u) => u.id);

  for (let i = 0; i < demoIds.length - 1; i++) {
    const sender = demoIds[i];
    const receiver = demoIds[i + 1];
    try {
      await prisma.like.upsert({
        where: { senderId_receiverId: { senderId: sender, receiverId: receiver } },
        update: {},
        create: { senderId: sender, receiverId: receiver },
      });
    } catch {
      // ignore duplicate
    }
  }

  const matchPairs: [number, number][] = [
    [0, 1],
    [2, 3],
    [4, 5],
  ];
  const matchedAt = new Date(Date.now() - 1000 * 60 * 60 * 3);

  for (const [a, b] of matchPairs) {
    const first = demoIds[a];
    const second = demoIds[b];
    try {
      await prisma.like.upsert({
        where: { senderId_receiverId: { senderId: first, receiverId: second } },
        update: {},
        create: { senderId: first, receiverId: second },
      });
      await prisma.like.upsert({
        where: { senderId_receiverId: { senderId: second, receiverId: first } },
        update: {},
        create: { senderId: second, receiverId: first },
      });
    } catch {
      // ignore duplicates
    }

    await prisma.match.upsert({
      where: { userId_targetId: { userId: first, targetId: second } },
      update: {},
      create: { userId: first, targetId: second, createdAt: matchedAt },
    });
    await prisma.match.upsert({
      where: { userId_targetId: { userId: second, targetId: first } },
      update: {},
      create: { userId: second, targetId: first, createdAt: matchedAt },
    });

    const conversation = await prisma.conversation.upsert({
      where: { id: `conv-${first.slice(-8)}-${second.slice(-8)}` },
      update: {},
      create: {
        id: `conv-${first.slice(-8)}-${second.slice(-8)}`,
        type: "DIRECT",
        createdAt: matchedAt,
      },
    });
    await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId: first },
      },
      update: {},
      create: { conversationId: conversation.id, userId: first },
    });
    await prisma.conversationMember.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId: second },
      },
      update: {},
      create: { conversationId: conversation.id, userId: second },
    });
  }
  console.log(`Created ${matchPairs.length} matches`);

  for (const i in demoIds.slice(0, 3)) {
    try {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: demoIds[0], followingId: demoIds[Number(i) + 1] } },
        update: {},
        create: { followerId: demoIds[0], followingId: demoIds[Number(i) + 1] },
      });
    } catch {
      // ignore
    }
  }

  for (const b of banners) {
    await prisma.banner.upsert({
      where: { id: `banner-${b.sortOrder}` },
      update: { ...b },
      create: { ...b, id: `banner-${b.sortOrder}` },
    });
  }
  console.log(`Created ${banners.length} banners`);

  for (const a of announcements) {
    await prisma.announcement.create({ data: a });
  }
  console.log(`Created ${announcements.length} announcements`);

  for (const id of demoIds) {
    await prisma.notification.create({
      data: {
        userId: id,
        type: "SYSTEM",
        title: "Welcome!",
        content: "Complete your profile to get discovered.",
      },
    });
  }

  await prisma.gift.createMany({
    data: [
      { name: "Rose", type: "EMOJI", value: 20, imageUrl: "https://picsum.photos/seed/rose/100/100" },
      { name: "Heart", type: "EMOJI", value: 30, imageUrl: "https://picsum.photos/seed/heart/100/100" },
      { name: "Cake", type: "VIRTUAL_ITEM", value: 80, imageUrl: "https://picsum.photos/seed/cake/100/100" },
      { name: "Crown", type: "VIRTUAL_ITEM", value: 200, imageUrl: "https://picsum.photos/seed/crown/100/100" },
      { name: "Diamond", type: "ANIMATED", value: 500, imageUrl: "https://picsum.photos/seed/diamond/100/100" },
    ],
    skipDuplicates: true,
  });

  await prisma.referralCode.upsert({
    where: { code: "LOVEBIRDS" },
    update: {},
    create: { code: "LOVEBIRDS", maxUses: 1000, createdById: admin.id },
  });
  console.log("Created default referral code: LOVEBIRDS");

  await seedActivities();

  const totalUsers = await prisma.user.count();
  console.log(`Done! Total users: ${totalUsers}`);
}

async function seedActivities() {
  const PRODUCT_IMG = (seed: string) => `https://picsum.photos/seed/${seed}/400/400`;

  const categoryData = [
    { name: "Dolls", slug: "dolls" },
    { name: "Accessories", slug: "accessories" },
    { name: "Wellness", slug: "wellness" },
  ];
  for (const c of categoryData) {
    await prisma.productCategory.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  const catMap = new Map<string, string>();
  for (const c of await prisma.productCategory.findMany()) catMap.set(c.slug, c.id);

  const productData: { name: string; description: string; imageUrl: string; ticketCost: number; category: string }[] = [
    { name: "Doll", description: "Classic companion doll", imageUrl: PRODUCT_IMG("prod-doll"), ticketCost: 2, category: "dolls" },
    { name: "Clothes", description: "Outfit set for your doll", imageUrl: PRODUCT_IMG("prod-clothes"), ticketCost: 1, category: "accessories" },
    { name: "Doll Cat", description: "Cat-themed doll", imageUrl: PRODUCT_IMG("prod-dollcat"), ticketCost: 2, category: "dolls" },
    { name: "Doll Barbie", description: "Barbie-style doll", imageUrl: PRODUCT_IMG("prod-barbie"), ticketCost: 3, category: "dolls" },
    { name: "Chocolate", description: "Sweet treat box", imageUrl: PRODUCT_IMG("prod-choc"), ticketCost: 1, category: "wellness" },
    { name: "Pillow", description: "Cozy comfort pillow", imageUrl: PRODUCT_IMG("prod-pillow"), ticketCost: 2, category: "accessories" },
    { name: "Teddy", description: "Soft teddy bear", imageUrl: PRODUCT_IMG("prod-teddy"), ticketCost: 2, category: "dolls" },
    { name: "Perfume", description: "Fragrance mini bottle", imageUrl: PRODUCT_IMG("prod-perfume"), ticketCost: 4, category: "wellness" },
  ];

  const productIds: string[] = [];
  for (const p of productData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    const categoryId = catMap.get(p.category) ?? null;
    if (existing) {
      productIds.push(existing.id);
    } else {
      const created = await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          ticketCost: p.ticketCost,
          categoryId,
        },
      });
      productIds.push(created.id);
    }
  }

  const now = Date.now();
  const activity = await prisma.activity.upsert({
    where: { slug: "airborne-activities" },
    update: {
      startAt: new Date(now - 60 * 60 * 1000),
      endAt: new Date(now + 365 * 24 * 60 * 60 * 1000),
      active: true,
    },
    create: {
      slug: "airborne-activities",
      title: "Airborne activities",
      startAt: new Date(now - 60 * 60 * 1000),
      endAt: new Date(now + 365 * 24 * 60 * 60 * 1000),
      maxQuantity: 10,
      active: true,
    },
  });

  for (let i = 0; i < productIds.length; i++) {
    await prisma.activityProduct.upsert({
      where: { activityId_productId: { activityId: activity.id, productId: productIds[i] } },
      update: {},
      create: {
        activityId: activity.id,
        productId: productIds[i],
        displayOrder: i,
        isFeatured: i < 4,
      },
    });
  }
  console.log("Created Airborne activities with", productIds.length, "products");
}

async function seedDemoContent() {
  console.log("Seeding demo content...");

  const extras: { name: string; type: "EMOJI" | "ANIMATED" | "VIRTUAL_ITEM"; value: number; imageUrl: string }[] = [
    { name: "Chocolate", type: "EMOJI", value: 25, imageUrl: "https://picsum.photos/seed/chocolate/100/100" },
    { name: "Teddy", type: "EMOJI", value: 50, imageUrl: "https://picsum.photos/seed/teddy/100/100" },
    { name: "Ring", type: "VIRTUAL_ITEM", value: 120, imageUrl: "https://picsum.photos/seed/ring/100/100" },
  ];
  if ((await prisma.gift.count({ where: { name: { in: ["Chocolate", "Teddy", "Ring"] } } })) === 0) {
    await prisma.gift.createMany({ data: extras, skipDuplicates: true });
    console.log("Created extra gifts");
  }

  const aisha = await prisma.user.findUnique({ where: { email: "aisha@example.com" } });
  const rohan = await prisma.user.findUnique({ where: { email: "rohan@example.com" } });
  const priya = await prisma.user.findUnique({ where: { email: "priya@example.com" } });
  const arjun = await prisma.user.findUnique({ where: { email: "arjun@example.com" } });
  const neha = await prisma.user.findUnique({ where: { email: "neha@example.com" } });
  const karan = await prisma.user.findUnique({ where: { email: "karan@example.com" } });

  const conversations = await prisma.conversation.findMany({
    where: { type: "DIRECT" },
    include: { members: true },
  });
  const demoConvos = conversations
    .filter((c) => c.members.length === 2)
    .map((c) => ({
      id: c.id,
      a: c.members[0].userId,
      b: c.members[1].userId,
    }));

  for (const convo of demoConvos) {
    const count = await prisma.message.count({ where: { conversationId: convo.id } });
    if (count > 0) continue;
    const pool = [
      { user: convo.a, text: "Hey! Saw your profile — really loved your bio 😊" },
      { user: convo.b, text: "Haha thank you! Yours was nice too. Where are you from?" },
      { user: convo.a, text: "I'm in the Hills. What about you?" },
      { user: convo.b, text: "Same vibe! We should catch up sometime 💛" },
    ];
    const start = Date.now() - 1000 * 60 * 60 * 2;
    for (let i = 0; i < pool.length; i++) {
      await prisma.message.create({
        data: {
          conversationId: convo.id,
          senderId: pool[i].user,
          content: pool[i].text,
          createdAt: new Date(start + i * 60_000),
        },
      });
    }
  }
  console.log("Created demo messages");

  if ((await prisma.giftTransaction.count()) === 0 && aisha && rohan && priya && arjun && neha && karan) {
    const gifts = await prisma.gift.findMany({ orderBy: { value: "asc" } });
    if (gifts.length >= 4) {
      const now = Date.now();
      const send = async (giftIdx: number, from: { id: string }, to: { id: string }, minsAgo: number, message?: string) => {
        const g = gifts[giftIdx];
        await prisma.giftTransaction.create({
          data: {
            giftId: g.id,
            senderId: from.id,
            receiverId: to.id,
            points: Math.floor(Number(g.value.toString())),
            value: g.value,
            message,
            createdAt: new Date(now - minsAgo * 60_000),
          },
        });
        await prisma.profile.update({
          where: { userId: to.id },
          data: { points: { increment: Math.floor(Number(g.value.toString())) } },
        });
      };
      await send(0, rohan, aisha, 60, "A little something for you 🌹");
      await send(2, aisha, rohan, 45);
      await send(1, priya, arjun, 30, "Thinking of you!");
      await send(4, neha, karan, 15, "For the queen 👑");
      console.log("Created demo gift transactions");
    }
  }

  if ((await prisma.report.count()) === 0 && aisha && rohan && priya && arjun) {
    await prisma.report.createMany({
      data: [
        {
          reporterId: priya.id,
          targetId: rohan.id,
          type: "FAKE_PROFILE",
          reason: "This profile claims different age in every update and the photos look stolen.",
        },
        {
          reporterId: arjun.id,
          targetId: aisha.id,
          type: "INAPPROPRIATE",
          reason: "Persistent harassing messages after I asked to unmatch.",
        },
      ],
    });
    console.log("Created demo reports");
  }

  if (aisha && (await prisma.verification.count()) === 0) {
    await prisma.verification.create({
      data: { userId: aisha.id, fullName: "Aisha Sharma", idType: "AADHAAR", status: "PENDING" },
    });
    console.log("Created demo verification request");
  }

  if (aisha && rohan && (await prisma.withdrawal.count()) === 0) {
    const wallet = await prisma.wallet.findUnique({ where: { userId: aisha.id } });
    if (wallet && Number(wallet.balance.toString()) >= 150) {
      const method = await prisma.paymentMethod.create({
        data: {
          userId: aisha.id,
          type: "UPI",
          label: "My UPI",
          detailsEncrypted: "ENC:demo",
          maskedDetails: "aisha•••@ybl",
          isDefault: true,
        },
      });
      await prisma.$transaction([
        prisma.withdrawal.create({
          data: { userId: aisha.id, amount: 100, paymentMethodId: method.id, status: "PENDING" },
        }),
        prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: { decrement: 100 }, frozenBalance: { increment: 100 } },
        }),
        prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL",
            amount: 100,
            direction: "DEBIT",
            description: "Withdrawal to My UPI",
            balanceAfter: Number(wallet.balance.toString()) - 100,
          },
        }),
      ]);
      console.log("Created demo payment method + pending withdrawal");
    }
    if (aisha && rohan && (await prisma.follow.count({ where: { followerId: rohan.id } })) === 0) {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: rohan.id, followingId: aisha.id } },
        update: {},
        create: { followerId: rohan.id, followingId: aisha.id },
      });
    }
  }

  if (aisha && (await prisma.notification.count({ where: { userId: aisha.id } })) < 3) {
    const now = new Date();
    const notifs: {
      userId: string;
      type: "LIKE" | "MATCH" | "GIFT";
      title: string;
      content: string;
      link?: string;
      createdAt?: Date;
    }[] = [
      {
        userId: aisha.id,
        type: "LIKE",
        title: "You got a new like!",
        content: "Someone liked your profile.",
        link: `/profile/${rohan?.username ?? "rohan_verma"}`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 30),
      },
      {
        userId: aisha.id,
        type: "MATCH",
        title: "It's a match! 🎉",
        content: "You matched with someone. Say hello!",
        link: `/profile/${rohan?.username ?? "rohan_verma"}`,
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 3),
      },
      {
        userId: aisha.id,
        type: "GIFT",
        title: "You received a Rose! 🎁",
        content: "20 points added to your profile.",
        link: "/mine/gift-record",
        createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 5),
      },
    ];
    await prisma.notification.createMany({ data: notifs });
    console.log("Created demo notifications for aisha");
  }

  if (aisha && (await prisma.announcementRead.count()) === 0) {
    const first = await prisma.announcement.findFirst({ orderBy: { createdAt: "asc" } });
    if (first) {
      await prisma.announcementRead.create({ data: { announcementId: first.id, userId: aisha.id } });
      console.log("Created demo announcement read");
    }
  }
}

main()
  .then(() => seedDemoContent())
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });