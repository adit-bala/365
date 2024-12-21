import React from 'react';
import { format, parseISO } from 'date-fns';

export interface ContentBlock {
  type: 'paragraph' | 'heading3' | 'numberedListItem' | 'bulletedListItem' | 'unknown';
  text: string;
}

interface PostData {
  title: string;
  date: string;
  content: ContentBlock[];
  lastEditedTime: string;
  url: string;
}

interface PostContentProps {
  post: PostData;
}

export function PostContent({ post }: PostContentProps) {
  const formattedDate = format(parseISO(post.date), 'MMMM do, yyyy');

  return (
    <div className="inline-block text-left bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-[#e6edf3]">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">{post.title}</h2>
        <p className="text-sm text-[#7d8590]">{formattedDate}</p>
      </div>
      {post.content.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return <p key={index} className="mb-4 text-lg">{block.text}</p>;
          case 'heading3':
            return <h3 key={index} className="text-2xl font-semibold mb-2">{block.text}</h3>;
          case 'numberedListItem':
            return <ol key={index} className="list-decimal list-inside mb-4 text-lg"><li className="mb-1">{block.text}</li></ol>;
          case 'bulletedListItem':
            return <ul key={index} className="list-disc list-inside mb-4 text-lg"><li className="mb-1">{block.text}</li></ul>;
          default:
            return null;
        }
      })}
    </div>
  );
}
