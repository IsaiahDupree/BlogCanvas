'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Edit3
} from 'lucide-react';

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

interface OutlineOptionsComparisonProps {
  postId: string;
  onOutlineSelected?: (outline: OutlineResult) => void;
  onCustomizeClick?: (options: OutlineOption[]) => void;
}

export function OutlineOptionsComparison({
  postId,
  onOutlineSelected,
  onCustomizeClick
}: OutlineOptionsComparisonProps) {
  const [options, setOptions] = useState<OutlineOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [expandedOptions, setExpandedOptions] = useState<Set<number>>(new Set([1, 2, 3]));

  useEffect(() => {
    fetchOptions();
  }, [postId]);

  const fetchOptions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/outline-options`);
      if (!response.ok) throw new Error('Failed to fetch outline options');

      const data = await response.json();
      setOptions(data.options || []);

      // Set selected option if any
      const selected = data.options?.find((opt: OutlineOption) => opt.is_selected);
      if (selected) {
        setSelectedOptionId(selected.id);
      }
    } catch (error) {
      console.error('Error fetching outline options:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateOptions = async () => {
    try {
      setGenerating(true);
      const response = await fetch(`/api/posts/${postId}/outline-options`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to generate outline options');

      const data = await response.json();
      setOptions(data.options || []);

      // Expand all options when generated
      setExpandedOptions(new Set([1, 2, 3]));
    } catch (error) {
      console.error('Error generating outline options:', error);
      alert('Failed to generate outline options. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const selectOption = async (optionId: string) => {
    try {
      const response = await fetch(
        `/api/posts/${postId}/outline-options/${optionId}/select`,
        { method: 'POST' }
      );

      if (!response.ok) throw new Error('Failed to select outline option');

      const data = await response.json();
      setSelectedOptionId(optionId);

      // Update options to reflect selection
      setOptions(prev => prev.map(opt => ({
        ...opt,
        is_selected: opt.id === optionId
      })));

      // Notify parent
      if (onOutlineSelected) {
        const selectedOption = options.find(opt => opt.id === optionId);
        if (selectedOption) {
          onOutlineSelected(selectedOption.outline_data);
        }
      }
    } catch (error) {
      console.error('Error selecting outline option:', error);
      alert('Failed to select outline option. Please try again.');
    }
  };

  const toggleExpand = (optionNumber: number) => {
    setExpandedOptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(optionNumber)) {
        newSet.delete(optionNumber);
      } else {
        newSet.add(optionNumber);
      }
      return newSet;
    });
  };

  const getApproachLabel = (optionNumber: number) => {
    const labels = {
      1: 'Problem-Solution',
      2: 'How-To Guide',
      3: 'Comprehensive'
    };
    return labels[optionNumber as keyof typeof labels] || `Option ${optionNumber}`;
  };

  const getSectionTypeColor = (type: string) => {
    const colors = {
      intro: 'bg-blue-100 text-blue-800 border-blue-200',
      body: 'bg-purple-100 text-purple-800 border-purple-200',
      conclusion: 'bg-green-100 text-green-800 border-green-200',
      cta: 'bg-orange-100 text-orange-800 border-orange-200',
      faq: 'bg-cyan-100 text-cyan-800 border-cyan-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading outline options...</span>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="max-w-md mx-auto">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-600" />
          <h3 className="text-xl font-bold mb-2">Generate Outline Options</h3>
          <p className="text-gray-600 mb-6">
            Create 3 distinct outline approaches for your blog post. Choose the one that best fits your content strategy.
          </p>
          <Button
            onClick={generateOptions}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate 3 Outline Options
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Choose Your Outline</h2>
          <p className="text-gray-600 mt-1">
            Compare 3 different approaches and select the one that works best
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onCustomizeClick?.(options)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Customize Outline
          </Button>
          <Button
            onClick={generateOptions}
            disabled={generating}
            variant="outline"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {options.map((option) => {
          const isExpanded = expandedOptions.has(option.option_number);
          const isSelected = option.id === selectedOptionId;

          return (
            <Card
              key={option.id}
              className={`p-6 transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-600 shadow-lg'
                  : 'hover:shadow-md'
              }`}
            >
              {/* Option Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-lg">
                      Option {option.option_number}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getApproachLabel(option.option_number)}
                  </Badge>
                </div>
                {isSelected && (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                )}
              </div>

              {/* Word Count */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Words</p>
                <p className="text-2xl font-bold text-gray-900">
                  {option.total_estimated_words.toLocaleString()}
                </p>
              </div>

              {/* Sections */}
              <div className="mb-4">
                <button
                  onClick={() => toggleExpand(option.option_number)}
                  className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>{option.outline_data.sections.length} Sections</span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
                    {option.outline_data.sections.map((section, idx) => (
                      <div
                        key={section.key}
                        className="p-3 border rounded-lg bg-white"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm flex-1">
                            {section.title}
                          </h4>
                          <Badge
                            variant="outline"
                            className={`text-xs ml-2 ${getSectionTypeColor(section.type)}`}
                          >
                            {section.type}
                          </Badge>
                        </div>
                        <ul className="space-y-1">
                          {section.keyPoints.slice(0, 3).map((point, i) => (
                            <li
                              key={i}
                              className="text-xs text-gray-600 flex items-start"
                            >
                              <span className="mr-2">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                          {section.keyPoints.length > 3 && (
                            <li className="text-xs text-gray-400 italic">
                              +{section.keyPoints.length - 3} more points...
                            </li>
                          )}
                        </ul>
                        <p className="text-xs text-gray-500 mt-2">
                          ~{section.estimatedWords} words
                        </p>
                      </div>
                    ))}

                    {/* FAQs */}
                    {option.outline_data.faqs && option.outline_data.faqs.length > 0 && (
                      <div className="p-3 border rounded-lg bg-cyan-50 border-cyan-200">
                        <h4 className="font-medium text-sm mb-2 text-cyan-900">
                          💡 FAQs ({option.outline_data.faqs.length})
                        </h4>
                        <ul className="space-y-2">
                          {option.outline_data.faqs.slice(0, 2).map((faq, i) => (
                            <li key={i} className="text-xs">
                              <p className="font-medium text-cyan-800">Q: {faq.question}</p>
                              <p className="text-cyan-700 mt-1 line-clamp-2">A: {faq.suggestedAnswer}</p>
                            </li>
                          ))}
                          {option.outline_data.faqs.length > 2 && (
                            <li className="text-xs text-cyan-600 italic">
                              +{option.outline_data.faqs.length - 2} more FAQs...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Table Suggestions */}
                    {option.outline_data.tableSuggestions && option.outline_data.tableSuggestions.length > 0 && (
                      <div className="p-3 border rounded-lg bg-purple-50 border-purple-200">
                        <h4 className="font-medium text-sm mb-2 text-purple-900">
                          📊 Table Ideas ({option.outline_data.tableSuggestions.length})
                        </h4>
                        <ul className="space-y-2">
                          {option.outline_data.tableSuggestions.map((table, i) => (
                            <li key={i} className="text-xs">
                              <p className="font-medium text-purple-800">{table.title}</p>
                              <p className="text-purple-700 mt-1">{table.description}</p>
                              <p className="text-purple-600 mt-1 text-[10px]">
                                Columns: {table.suggestedColumns.slice(0, 3).join(', ')}
                                {table.suggestedColumns.length > 3 && '...'}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Select Button */}
              <Button
                onClick={() => selectOption(option.id)}
                disabled={isSelected}
                className={`w-full ${
                  isSelected
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Selected
                  </>
                ) : (
                  'Select This Outline'
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
