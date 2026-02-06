const CONFIG = {
  // profile setting (required)
  profile: {
    name: "aquilaXk",
    image: "https://scontent-icn2-1.cdninstagram.com/v/t51.2885-19/490133522_690190946794350_2967597213309830821_n.jpg?stp=dst-jpg_s320x320_tt6&efg=eyJ2ZW5jb2RlX3RhZyI6InByb2ZpbGVfcGljLmRqYW5nby4zNzUuYzIifQ&_nc_ht=scontent-icn2-1.cdninstagram.com&_nc_cat=106&_nc_oc=Q6cZ2QFnbVOC4pxM7wL3rpF1vUBDWNdOltQp3YrLNG4Xuwf4bUWqpgj00c4e-IsBA23Zx9U&_nc_ohc=UpcYMwV0L0gQ7kNvwEjvol4&_nc_gid=HNDT9rE79-QanvhiVMWLQg&edm=AOQ1c0wBAAAA&ccb=7-5&oh=00_Afuc2nAYdIegGeivRIowpsLknPxpi0EZ3mdX9arIDDIXeA&oe=698B82DE&_nc_sid=8b3546", // If you want to create your own notion avatar, check out https://notion-avatar.vercel.app
    role: "backend developer",
    bio: "I develop everything using node.",
    email: "illusiveman7@gmail.com",
    linkedin: "",
    github: "aquilaXk",
    instagram: "",
  },
  projects: [
    {
      name: `aquilaXk-blog`,
      href: "https://github.com/aquilaXk/morethan-log",
    },
  ],
  // blog setting (required)
  blog: {
    title: "aquilaXk's Blog",
    description: "welcome to my backend dev log!",
    scheme: "dark", // 'light' | 'dark' | 'system'
  },

  // CONFIG configration (required)
  link: "https://morethan-log.vercel.app",
  since: 2026, // If leave this empty, current year will be used.
  lang: "ko-KR", // ['en-US', 'zh-CN', 'zh-HK', 'zh-TW', 'ja-JP', 'es-ES', 'ko-KR']
  ogImageGenerateURL: "https://og-image-korean.vercel.app", // The link to generate OG image, don't end with a slash

  // notion configuration (required)
  notionConfig: {
    pageId: process.env.NOTION_PAGE_ID,
  },

  // plugin configuration (optional)
  googleAnalytics: {
    enable: false,
    config: {
      measurementId: process.env.NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID || "",
    },
  },
  googleSearchConsole: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    },
  },
  naverSearchAdvisor: {
    enable: false,
    config: {
      siteVerification: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "",
    },
  },
  utterances: {
    enable: true,
    config: {
      repo: process.env.NEXT_PUBLIC_UTTERANCES_REPO || "",
      "issue-term": "og:title",
      label: "💬 Utterances",
    },
  },
  cusdis: {
    enable: false,
    config: {
      host: "https://cusdis.com",
      appid: "", // Embed Code -> data-app-id value
    },
  },
  isProd: process.env.VERCEL_ENV === "production", // distinguish between development and production environment (ref: https://vercel.com/docs/environment-variables#system-environment-variables)
  revalidateTime: 3600, // revalidate time for [slug], index
}

module.exports = { CONFIG }
