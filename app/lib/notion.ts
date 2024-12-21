import { Client } from '@notionhq/client';
import { marked } from 'marked';
import { 
  PageObjectResponse, 
  BlockObjectResponse,
  ParagraphBlockObjectResponse,
  Heading3BlockObjectResponse,
  NumberedListItemBlockObjectResponse,
  BulletedListItemBlockObjectResponse
} from '@notionhq/client/build/src/api-endpoints';
import { isFullPage } from '@notionhq/client/build/src/helpers';

export const NotionClient = new Client({ auth: process.env.NOTION_TOKEN });

export type TextBlock = 
  | ParagraphBlockObjectResponse
  | Heading3BlockObjectResponse
  | NumberedListItemBlockObjectResponse
  | BulletedListItemBlockObjectResponse;

export function isParagraphBlock(block: BlockObjectResponse): block is ParagraphBlockObjectResponse {
  return block.type === 'paragraph';
}

export function isHeading3Block(block: BlockObjectResponse): block is Heading3BlockObjectResponse {
  return block.type === 'heading_3';
}

export function isNumberedListItemBlock(block: BlockObjectResponse): block is NumberedListItemBlockObjectResponse {
  return block.type === 'numbered_list_item';
}

export function isBulletedListItemBlock(block: BlockObjectResponse): block is BulletedListItemBlockObjectResponse {
  return block.type === 'bulleted_list_item';
}

export function isTextBlock(block: BlockObjectResponse): block is TextBlock {
  return isParagraphBlock(block) || isHeading3Block(block) || isNumberedListItemBlock(block) || isBulletedListItemBlock(block);
}

/**
 * Helpers
 */

export async function getPageDetails(pageId?: string): Promise<PageObjectResponse | undefined> {
  if (!pageId) {
    return undefined;
  }

  const response = await NotionClient.pages.retrieve({ page_id: pageId });
  return isFullPage(response) ? response : undefined;
}

async function getAllBlockChildren(pageId?: string) {
  const children = [];
  let hasMore = true;
  let cursor: string | undefined;
  console.log("PAGE ID", pageId);

  while (hasMore && pageId) {
    try {
      const response = await NotionClient.blocks.children.list({
        block_id: pageId,
        start_cursor: cursor,
      });

      children.push(...response.results);
      cursor = response.next_cursor ?? undefined;
      hasMore = response.has_more;
    } catch (error) {
      console.error('Error fetching block children:', error);
      hasMore = false;
    }
  }

  return children;
}

export async function getTextBlocksFromPage(pageId?: string): Promise<TextBlock[]> {
  if (!pageId) {
    return [];
  }

  const allChildren = await getAllBlockChildren(pageId);
  const textBlocks = allChildren.filter((child): child is TextBlock => isTextBlock(child as BlockObjectResponse));

  return textBlocks;
}

export async function getPropertiesForBlogPostEntries(databaseId: string | undefined) {
  console.log("DATABASE ID", databaseId);
  if (!databaseId) {
    throw new Error('Database ID is undefined');
  }

  try {
    const response = await NotionClient.databases.query({
      database_id: databaseId,
      sorts: [{ property: 'Publish Date', direction: 'descending' }],
    });

    return response.results.map((page) => {
      if (isFullPage(page)) {
        const titleProperty = page.properties.Name;
        const dateProperty = page.properties['Publish Date'];
        const postIdProperty = page.properties['PostID'];
        const previewProperty = page.properties['Preview'];

        return {
          postId: postIdProperty.type === 'rich_text' 
            ? postIdProperty.rich_text[0]?.plain_text
            : null,
          title: titleProperty.type === 'title' 
            ? titleProperty.title[0]?.plain_text || 'Untitled'
            : 'Untitled',
          date: dateProperty.type === 'date'
            ? dateProperty.date?.start || null
            : null,
          preview: previewProperty && previewProperty.type === 'rich_text'
            ? previewProperty.rich_text[0]?.plain_text
            : undefined,
        };
      }
      return null;
    }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  } catch (error) {
    console.error('Error fetching blog post entries:', error);
    return [];
  }
}

export async function getPostById(postId: string) {
  try {
    const pageDetails = await getPageDetails(postId);
    if (!pageDetails) {
      throw new Error('Failed to fetch page details');
    }
    const textBlocks = await getTextBlocksFromPage(postId);

    const content = textBlocks.map(block => {
      if (isParagraphBlock(block)) {
        return { type: 'paragraph', text: block.paragraph.rich_text.map(t => t.plain_text).join('') };
      } else if (isHeading3Block(block)) {
        return { type: 'heading3', text: block.heading_3.rich_text.map(t => t.plain_text).join('') };
      } else if (isNumberedListItemBlock(block)) {
        return { type: 'numberedListItem', text: block.numbered_list_item.rich_text.map(t => t.plain_text).join('') };
      } else if (isBulletedListItemBlock(block)) {
        return { type: 'bulletedListItem', text: block.bulleted_list_item.rich_text.map(t => t.plain_text).join('') };
      }
      return { type: 'unknown', text: '' };
    });

    const titleProperty = pageDetails.properties.title;
    if (titleProperty.type === 'title' && titleProperty.title.length > 0) {
      return {
        title: titleProperty.title[0].plain_text,
        date: pageDetails.created_time,
        content,
        lastEditedTime: pageDetails.last_edited_time,
        url: pageDetails.url
      };
    }

    throw new Error('Invalid page structure');
  } catch (error) {
    console.error('Error fetching post:', error);
    return null;
  }
}
