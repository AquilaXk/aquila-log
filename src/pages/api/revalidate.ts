import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"

const normalizeNotionPageId = (id: string) =>
  id.replace(/[^a-f0-9]/gi, "").slice(0, 32)

// Revalidate endpoint (POST only)
// - token: x-revalidate-token header (or ?secret=... fallback)
// - path: JSON body { path: "/target" } (or ?path=... fallback)
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ message: "Method Not Allowed" })
  }

  const expectedSecret = process.env.TOKEN_FOR_REVALIDATE
  if (!expectedSecret) {
    return res.status(500).json({ message: "Missing revalidate token on server" })
  }

  const querySecret = typeof req.query.secret === "string" ? req.query.secret : ""
  const headerSecret =
    typeof req.headers["x-revalidate-token"] === "string"
      ? req.headers["x-revalidate-token"]
      : ""
  const providedSecret = headerSecret || querySecret

  if (providedSecret !== expectedSecret) {
    return res.status(401).json({ message: "Invalid token" })
  }

  const pathFromQuery = typeof req.query.path === "string" ? req.query.path : ""
  const pathFromBody = typeof req.body?.path === "string" ? req.body.path : ""
  const targetPath = pathFromBody || pathFromQuery

  try {
    let paths: string[] = []

    if (targetPath) {
      const normalizedPath = targetPath.startsWith("/")
        ? targetPath
        : `/${targetPath}`
      await res.revalidate(normalizedPath)
      paths = [normalizedPath]
    } else {
      // Force fresh pull so webhook-triggered revalidation doesn't miss newly changed posts.
      const posts = await getPosts({ forceFresh: true })
      const pathsToRevalidate = new Set<string>(["/"])
      posts.forEach((row) => {
        if (row?.slug) {
          pathsToRevalidate.add(`/${row.slug}`)
        }
        if (row?.id) {
          const normalizedPageId = normalizeNotionPageId(row.id)
          if (normalizedPageId.length === 32) {
            pathsToRevalidate.add(`/page/${normalizedPageId}`)
          }
        }
      })
      paths = [...pathsToRevalidate]
      const revalidateRequests = paths.map((targetPath) =>
        res.revalidate(targetPath)
      )
      await Promise.all(revalidateRequests)
    }

    res.json({
      revalidated: true,
      count: paths.length,
      paths,
    })
  } catch (err) {
    return res.status(500).send("Error revalidating")
  }
}
