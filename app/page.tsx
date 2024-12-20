import { Client } from "@notionhq/client";
import { cache } from 'react';

const verifyNotionCredentials = cache(async () => {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    return { isValid: false, error: 'NOTION_DATABASE_ID is not defined' };
  }

  try {
    // Verify API key by fetching current user
    await notion.users.me();

    // Verify database ID by retrieving database metadata
    await notion.databases.retrieve({ database_id: databaseId });

    return { isValid: true };
  } catch (error) {
    console.error("Error verifying Notion credentials:", error);
    if (error.code === 'unauthorized') {
      return { isValid: false, error: 'Invalid Notion API Key' };
    } else if (error.code === 'object_not_found') {
      return { isValid: false, error: 'Invalid Notion Database ID' };
    }
    return { isValid: false, error: 'An unknown error occurred' };
  }
});

const getNotionData = cache(async () => {
  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!databaseId) {
    throw new Error('NOTION_DATABASE_ID is not defined');
  }

  const response = await notion.databases.query({
    database_id: databaseId,
  });

  return response.results;
});

export default async function Home() {
  const { isValid, error } = await verifyNotionCredentials();
  
  if (!isValid) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Error: {error}</h1>
        <p>Please check your NOTION_API_KEY and NOTION_DATABASE_ID in the .env file.</p>
      </div>
    );
  }

  const notionData = await getNotionData();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Notion Data</h1>
      <ul>
        {notionData.map((page: any) => (
          <li key={page.id} className="mb-2">
            {page.properties.Name?.title[0]?.plain_text || 'Unnamed'}
          </li>
        ))}
      </ul>
    </div>
  );
}
