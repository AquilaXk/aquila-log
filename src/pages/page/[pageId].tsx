import { GetStaticPaths, GetStaticProps } from "next"
import styled from "@emotion/styled"
import { idToUuid, getPageTitle } from "notion-utils"
import { ExtendedRecordMap } from "notion-types"
import { getRecordMap } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import NotionRenderer from "src/routes/Detail/components/NotionRenderer"
import CustomError from "src/routes/Error"
import PostHeader from "src/routes/Detail/PostDetail/PostHeader"
import { NextPageWithLayout, TPost } from "src/types"
import { CONFIG } from "site.config"

type Props = {
  recordMap: ExtendedRecordMap
  pageId: string
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  }
}

export const getStaticProps: GetStaticProps<Props> = async (context) => {
  const rawPageId = context.params?.pageId as string | undefined

  if (!rawPageId) {
    return { notFound: true }
  }

  const normalizedPageId = rawPageId.replace(/[^a-f0-9]/gi, "").slice(0, 32)
  if (normalizedPageId.length !== 32) {
    return { notFound: true }
  }

  const pageId = idToUuid(normalizedPageId)

  try {
    const recordMap = await getRecordMap(pageId)

    return {
      props: {
        recordMap,
        pageId,
      },
      revalidate: CONFIG.revalidateTime,
    }
  } catch (error) {
    console.error("❌ [pageId] child page 로드 실패:", error)
    return { notFound: true }
  }
}

const NotionChildPage: NextPageWithLayout<Props> = ({ recordMap, pageId }) => {
  if (!recordMap) return <CustomError />

  const title = getPageTitle(recordMap) || "Untitled"
  const pageBlock = (recordMap.block?.[pageId] as any)?.value
  const createdTime = pageBlock?.created_time
    ? new Date(pageBlock.created_time).toISOString()
    : new Date().toISOString()
  const createdById = pageBlock?.created_by_id as string | undefined
  const createdBy = createdById
    ? (recordMap.notion_user?.[createdById] as any)?.value
    : null

  const headerData: TPost = {
    id: pageId,
    title,
    slug: `page/${pageId}`,
    type: ["Post"],
    status: ["Public"],
    createdTime,
    date: { start_date: createdTime.slice(0, 10) },
    fullWidth: false,
    author:
      createdBy?.name
        ? [
            {
              id: createdById || "",
              name: createdBy.name,
              profile_photo: createdBy.profile_photo,
            },
          ]
        : undefined,
  }

  return (
    <>
      <MetaConfig
        title={title}
        description=""
        type="Page"
        url={`${CONFIG.link}/page/${pageId}`}
      />
      <OuterWrapper>
        <StyledWrapper>
          <article>
            <PostHeader data={headerData} />
            <NotionRenderer recordMap={recordMap} />
          </article>
        </StyledWrapper>
      </OuterWrapper>
    </>
  )
}

NotionChildPage.getLayout = (page) => <>{page}</>

export default NotionChildPage

const OuterWrapper = styled.div`
  padding: 2rem 0;
`

const StyledWrapper = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  max-width: 56rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;

  > article {
    margin: 0 auto;
    max-width: 42rem;
  }
`
