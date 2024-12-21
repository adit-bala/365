'use client'

import { useState } from 'react'
import { format, eachDayOfInterval, addMonths, startOfWeek } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { PostContent, ContentBlock } from './PostContent'

type PostInfo = {
  postId: string | null;
  title: string;
  preview: string;
  date: string
}

interface ContributionGraphProps {
  initialEntries: PostInfo[]
}

interface PostData {
  title: string;
  date: string;
  content: ContentBlock[];
  lastEditedTime: string;
  url: string;
}

export function ContributionGraph({ initialEntries }: ContributionGraphProps) {
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null)
  const [loading, setLoading] = useState(false)

  const startDate = new Date('2024-12-18')
  const endDate = addMonths(startDate, 12)

  const fetchPostContent = async (postId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        next: { revalidate: 60 }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch post content')
      }
      const data: PostData = await response.json()
      setSelectedPost(data)
    } catch (error) {
      console.error('Error fetching post:', error)
      setSelectedPost(null)
    } finally {
      setLoading(false)
    }
  }

  const renderContributionGraph = () => {
    const weekStart = startOfWeek(startDate, { weekStartsOn: 1 })
    const dates = eachDayOfInterval({ start: weekStart, end: endDate })

    // Group dates by week
    const weeks: Date[][] = []
    let currentWeek: Date[] = []

    dates.forEach((date) => {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      currentWeek.push(date)
    })
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }

    // Get unique months for the header
    const months = Array.from(new Set(dates.map(date => format(date, 'MMM'))))

    const getSquareClass = (dateStr: string) => {
      const entry = initialEntries.find(e => e.date === dateStr)
      if (!entry) return 'bg-[#1a2028] hover:bg-[#2a3038]'
      return entry.postId 
        ? 'bg-[#39d353] hover:bg-[#4ae664] cursor-pointer'
        : 'bg-[#2ea043] hover:bg-[#3cbc55]'
    }

    return (
      <TooltipProvider>
        <div className="rounded-lg bg-[#0a0d13] p-4 text-[#e6edf3]">
          <div className="space-y-2">
            {/* Months row */}
            <div className="flex text-xs">
              <div className="w-8" />
              <div className="flex flex-1 justify-between px-1">
                {months.map((month, i) => (
                  <div key={i} className="flex-1 text-center">{month}</div>
                ))}
              </div>
            </div>

            {/* Days and contribution cells */}
            <div className="flex">
              <div className="flex flex-col justify-between text-xs pr-2">
                <div>Mon</div>
                <div>Wed</div>
                <div>Fri</div>
              </div>

              <div className="flex gap-2">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-2">
                    {week.map((date) => {
                      const dateStr = format(date, 'yyyy-MM-dd')
                      const entry = initialEntries.find(e => e.date === dateStr)
                      return (
                        <Tooltip key={dateStr}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => entry?.postId && entry.postId !== null ? fetchPostContent(entry.postId) : null}
                              className={`w-[16px] h-[16px] rounded-sm transition-colors ${getSquareClass(dateStr)}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-semibold">{format(date, 'MMM d, yyyy')}</p>
                            {entry?.preview && (
                              <p className="mt-1 max-w-xs whitespace-normal">{entry.preview}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 text-xs pt-4">
            <div className="w-[10px] h-[10px] rounded-sm bg-[#1a2028]" />
              <span>No entry</span>
              <div className="w-[10px] h-[10px] rounded-sm bg-[#2ea043]" />
              <span>Entry without post</span>
              <div className="w-[10px] h-[10px] rounded-sm bg-[#39d353]" />
              <span>Published post</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    )
  }

  return (
    <>
      {renderContributionGraph()}
      {loading ? (
        <div className="mt-8 inline-block bg-[#161b22] border border-[#30363d] rounded-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-[#30363d] rounded w-64" />
            <div className="h-4 bg-[#30363d] rounded w-40" />
            <div className="h-4 bg-[#30363d] rounded w-52" />
          </div>
        </div>
      ) : selectedPost ? (
        <div className="mt-8">
          <PostContent post={selectedPost} />
        </div>
      ) : null}
    </>
  )
}

