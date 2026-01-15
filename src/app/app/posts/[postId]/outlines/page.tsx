'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OutlineOptionsComparison } from '@/components/outline/OutlineOptionsComparison';
import { OutlineCustomizer } from '@/components/outline/OutlineCustomizer';

interface OutlineSection {
  key: string;
  title: string;
  type: 'intro' | 'body' | 'conclusion' | 'cta' | 'faq';
  keyPoints: string[];
  estimatedWords: number;
}

interface FAQItem {
  question: string;
  suggestedAnswer: string;
}

interface TableSuggestion {
  title: string;
  description: string;
  suggestedColumns: string[];
  suggestedRows: string[];
  placement: string;
}

interface OutlineResult {
  sections: OutlineSection[];
  totalEstimatedWords: number;
  faqs?: FAQItem[];
  tableSuggestions?: TableSuggestion[];
}

interface OutlineOption {
  id: string;
  blog_post_id: string;
  option_number: number;
  outline_data: OutlineResult;
  total_estimated_words: number;
  is_selected: boolean;
  generated_at: string;
}

export default function OutlinesPage({
  params
}: {
  params: { postId: string }
}) {
  const router = useRouter();
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [options, setOptions] = useState<OutlineOption[]>([]);

  const handleOutlineSelected = (outline: OutlineResult) => {
    // Navigate back to the post detail page
    router.push(`/app/posts/${params.postId}`);
  };

  const handleCustomizeClick = (outlineOptions: OutlineOption[]) => {
    setOptions(outlineOptions);
    setShowCustomizer(true);
  };

  const handleCustomOutlineSaved = (customOutline: OutlineResult) => {
    // Navigate back to the post detail page
    router.push(`/app/posts/${params.postId}`);
  };

  const handleCloseCustomizer = () => {
    setShowCustomizer(false);
  };

  if (showCustomizer) {
    return (
      <OutlineCustomizer
        postId={params.postId}
        options={options}
        onSave={handleCustomOutlineSaved}
        onClose={handleCloseCustomizer}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <OutlineOptionsComparison
          postId={params.postId}
          onOutlineSelected={handleOutlineSelected}
          onCustomizeClick={handleCustomizeClick}
        />
      </div>
    </div>
  );
}
