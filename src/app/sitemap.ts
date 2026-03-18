import type { MetadataRoute } from "next"
import { APP_BASE_URL } from "@/shared/constants/app"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: APP_BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ]
}
