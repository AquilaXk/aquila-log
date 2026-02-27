import { getTextContent, getDateValue } from "notion-utils"
import { NotionAPI } from "notion-client"
import { BlockMap, CollectionPropertySchemaMap } from "notion-types"
import { customMapImageUrl } from "./customMapImageUrl"

type NotionUser = {
  id?: string
  name?: string
  profile_photo?: string | null
}

type GetPagePropertiesOptions = {
  api?: NotionAPI
  userCache?: Map<string, NotionUser>
}

async function getPageProperties(
  id: string,
  block: BlockMap,
  schema: CollectionPropertySchemaMap,
  options: GetPagePropertiesOptions = {}
) {
  const api = options.api ?? new NotionAPI()
  const userCache = options.userCache ?? new Map<string, NotionUser>()

  // 1. 데이터 포장지 벗기기
  const rawBlock = block?.[id] as any
  const blockValue = rawBlock?.value?.value || rawBlock?.value || rawBlock

  if (!blockValue || !blockValue.properties || !schema) {
    return {}
  }

  const rawProperties = blockValue.properties
  const excludeProperties = ["date", "select", "multi_select", "person", "file"]
  const properties: any = {}

  properties.id = id

  // 2. 스키마 매핑
  for (const key of Object.keys(schema)) {
    try {
      const propertySchema = schema[key]
      const propertyName = propertySchema.name
      const propertyType = propertySchema.type
      const rawValue = rawProperties[key]

      if (!rawValue) continue

      if (propertyType && !excludeProperties.includes(propertyType)) {
        properties[propertyName] = getTextContent(rawValue)
      } else {
        switch (propertyType) {
          case "file": {
            try {
              let fileBlock = rawBlock?.value?.value || rawBlock?.value
              const url: string = rawValue[0][1][0][1]
              const newurl = customMapImageUrl(url, fileBlock)
              properties[propertyName] = newurl
            } catch (error) {
              properties[propertyName] = undefined
            }
            break
          }
          case "date": {
            const dateProperty: any = getDateValue(rawValue)
            delete dateProperty.type
            properties[propertyName] = dateProperty
            break
          }
          case "select":
          case "multi_select": {
            const selects = getTextContent(rawValue)
            properties[propertyName] = selects ? selects.split(",") : []
            break
          }
          case "person": {
            const rawUsers = rawValue.flat()
            const userIds = rawUsers
              .map((rawUser: any) =>
                Array.isArray(rawUser?.[0]) ? rawUser[0][1] : undefined
              )
              .filter(Boolean)

            const users = await Promise.all(
              userIds.map(async (userId: string) => {
                const cachedUser = userCache.get(userId)
                if (cachedUser) return cachedUser

                const res: any = await api.getUsers([userId])
                const resValue =
                  res?.recordMapWithRoles?.notion_user?.[userId]?.value
                const user = {
                  id: resValue?.id,
                  name:
                    resValue?.name ||
                    `${resValue?.family_name}${resValue?.given_name}` ||
                    undefined,
                  profile_photo: resValue?.profile_photo || null,
                }
                userCache.set(userId, user)
                return user
              })
            )
            properties[propertyName] = users
            break
          }
          default:
            break
        }
      }
    } catch (error) {
      continue
    }
  }
  return properties
}

export { getPageProperties as default }
