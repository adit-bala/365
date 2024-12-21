import { ContributionGraph } from '../components/contribution-graph'
import { getPropertiesForBlogPostEntries } from './lib/notion'

export const revalidate = 60;

export default async function HomePage() {
  const entries = await getPropertiesForBlogPostEntries(process.env.NOTION_WRITING_DATABASE_ID);

  // Transform entries to match the PostInfo type expected by ContributionGraph
  const formattedEntries = entries.map(entry => ({
    postId: entry.postId,
    title: entry.title,
    preview: entry.preview || '',
    date: entry.date || '' // Ensure date is always a string
  }));

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#e6edf3]">
      <main className="container mx-auto px-4 py-16 space-y-16">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            365 Days of writing
          </h1>
          <p className="text-xl text-[#7d8590] max-w-2xl mx-auto mb-4">
            Documenting my progress as I write every day for a year.
          </p>          
        </header>

        <ContributionGraph initialEntries={formattedEntries} />
      </main>
    </div>
  )
}

