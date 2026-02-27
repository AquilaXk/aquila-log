import { NotionAPI } from "notion-client"
import { CONFIG } from "site.config"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { BlockMap, CollectionPropertySchemaMap } from "notion-types"
import { TPost } from "src/types"

const POSTS_CACHE_TTL_MS = 60 * 1000
let postsCache: TPost[] | null = null
let postsCacheAt = 0
let pendingPostsPromise: Promise<TPost[]> | null = null

export const getPosts = async (): Promise<TPost[]> => {
  if (postsCache && Date.now() - postsCacheAt < POSTS_CACHE_TTL_MS) {
    return postsCache
  }
  if (pendingPostsPromise) return pendingPostsPromise

  pendingPostsPromise = (async () => {
    const api = new NotionAPI()
    const pageId = CONFIG.notionConfig.pageId

    try {
      const recordMap = await api.getPage(pageId)

      // 1. 컬렉션(데이터베이스) 찾기
      const collectionMap = recordMap.collection || {}
      const collectionKeys = Object.keys(collectionMap)
      let collectionId = ""
      let schema: CollectionPropertySchemaMap | null = null

      for (const key of collectionKeys) {
        const rawData = collectionMap[key] as any
        const data = rawData?.value?.value || rawData?.value || rawData
        if (data?.schema) {
          collectionId = key
          schema = data.schema
          break
        }
      }

      if (!collectionId || !schema) {
        throw new Error(
          "[getPosts] 유효한 스키마를 찾지 못했습니다. (Page ID 확인 필요)"
        )
      }
      const resolvedSchema = schema

      // 2. 게시글 ID 목록 추출
      const collectionViewMap = recordMap.collection_view || {}
      const collectionViewId = Object.keys(collectionViewMap)[0]
      let pageIds: string[] = []

      if (
        recordMap.collection_query &&
        recordMap.collection_query[collectionId] &&
        recordMap.collection_query[collectionId][collectionViewId]
      ) {
        const view = recordMap.collection_query[collectionId][collectionViewId]
        pageIds =
          view.collection_group_results?.type === "results"
            ? view.collection_group_results.blockIds
            : view.blockIds || []
      } else {
        const blockMap = recordMap.block || {}
        pageIds = Object.keys(blockMap).filter((id) => {
          const rawBlock = blockMap[id] as any
          const block = rawBlock?.value?.value || rawBlock?.value
          return (
            block && block.type === "page" && block.parent_id === collectionId
          )
        })
      }

      // 3. 데이터 매핑
      const blockMap = recordMap.block as BlockMap
      const userCache = new Map<string, any>()
      const mappedPosts = await Promise.all(
        pageIds.map(async (id) => {
          const properties = await getPageProperties(
            id,
            blockMap,
            resolvedSchema,
            {
              api,
              userCache,
            }
          )

          // 속성 이름 정규화 (Title, title, 제목 -> title)
          const keys = Object.keys(properties)
          const titleKey = keys.find(
            (k) => k.toLowerCase() === "title" || k === "제목" || k === "이름"
          )
          const dateKey = keys.find(
            (k) => k.toLowerCase() === "date" || k === "날짜"
          )
          const slugKey = keys.find(
            (k) => k.toLowerCase() === "slug" || k === "슬러그"
          )
          const statusKey = keys.find(
            (k) => k.toLowerCase() === "status" || k === "상태"
          )
          const typeKey = keys.find(
            (k) => k.toLowerCase() === "type" || k === "종류"
          )

          if (titleKey) properties.title = properties[titleKey]
          if (dateKey) properties.date = properties[dateKey]
          if (slugKey) properties.slug = properties[slugKey]
          if (statusKey) properties.status = properties[statusKey]
          if (typeKey) properties.type = properties[typeKey]

          // 필수 데이터(title)가 있는 경우만 반환
          if (!properties.title) return null
          if (!properties.date?.start_date) {
            properties.date = {
              start_date: new Date(properties.createdTime)
                .toISOString()
                .slice(0, 10),
            }
          }
          return properties as TPost
        })
      )

      const posts: TPost[] = mappedPosts.filter(Boolean) as TPost[]

      // 4. 정렬 (최신순)
      posts.sort((a, b) => {
        const dateA = new Date(a.date?.start_date || a.createdTime).getTime()
        const dateB = new Date(b.date?.start_date || b.createdTime).getTime()
        return dateB - dateA
      })

      postsCache = posts
      postsCacheAt = Date.now()
      console.log(
        `✅ [getPosts] 총 ${posts.length}개의 글을 성공적으로 가져왔습니다.`
      )
      return posts
    } catch (error) {
      console.error("❌ [getPosts] 데이터 로드 중 에러 발생:", error)
      throw error
    } finally {
      pendingPostsPromise = null
    }
  })()

  return pendingPostsPromise
}
