import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://app.web3mb.com";

  return [
    {
      url: base,
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: `${base}/transparency`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${base}/verification-registry`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${base}/transparency/leaderboard`,
      lastModified: new Date(),
      priority: 0.9,
    },
    {
      url: `${base}/token/web3mb-demo`,
      lastModified: new Date(),
      priority: 0.8,
    },
  ];
}
