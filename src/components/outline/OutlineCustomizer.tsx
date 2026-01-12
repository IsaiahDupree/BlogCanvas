'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GripVertical,
  Plus,
  Trash2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';

interface OutlineSection {
  key: string;
  title: string;
  type: 'intro' | 'body' | 'conclusion' | 'cta';
  keyPoints: string[];
  estimatedWords: number;
}

interface OutlineResult {
  sections: OutlineSection[];
  totalEstimatedWords: number;
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

interface OutlineCustomizerProps {
  postId: string;
  options: OutlineOption[];
  onSave?: (customOutline: OutlineResult) => void;
  onClose?: () => void;
}

export function OutlineCustomizer({
  postId,
  options,
  onSave,
  onClose
}: OutlineCustomizerProps) {
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize with sections from first option or empty
    if (options.length > 0) {
      setSections(JSON.parse(JSON.stringify(options[0].outline_data.sections)));
    }
  }, [options]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];

    // Remove from old position
    newSections.splice(draggedIndex, 1);
    // Insert at new position
    newSections.splice(index, 0, draggedSection);

    setSections(newSections);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const addSectionFromOption = (optionNumber: number, sectionKey: string) => {
    const option = options.find(opt => opt.option_number === optionNumber);
    if (!option) return;

    const section = option.outline_data.sections.find(s => s.key === sectionKey);
    if (!section) return;

    // Create a copy with new key to avoid duplicates
    const newSection = {
      ...section,
      key: `${section.key}_${Date.now()}`
    };

    setSections(prev => [...prev, newSection]);
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<OutlineSection>) => {
    setSections(prev => prev.map((section, i) =>
      i === index ? { ...section, ...updates } : section
    ));
  };

  const toggleSectionExpand = (key: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const calculateTotalWords = () => {
    return sections.reduce((sum, section) => sum + section.estimatedWords, 0);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const customOutline: OutlineResult = {
        sections,
        totalEstimatedWords: calculateTotalWords()
      };

      const response = await fetch(`/api/posts/${postId}/outline-options/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customOutline })
      });

      if (!response.ok) throw new Error('Failed to save custom outline');

      onSave?.(customOutline);
    } catch (error) {
      console.error('Error saving custom outline:', error);
      alert('Failed to save custom outline. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getSectionTypeColor = (type: string) => {
    const colors = {
      intro: 'bg-blue-100 text-blue-800 border-blue-200',
      body: 'bg-purple-100 text-purple-800 border-purple-200',
      conclusion: 'bg-green-100 text-green-800 border-green-200',
      cta: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Customize Your Outline</h2>
            <p className="text-gray-600 mt-1">
              Drag to reorder, add sections from options, or remove sections
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || sections.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Custom Outline'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Editor - Custom Outline */}
          <div className="lg:col-span-3">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Your Custom Outline</h3>
                <div className="text-sm text-gray-600">
                  Total: {calculateTotalWords().toLocaleString()} words
                </div>
              </div>

              {sections.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No sections yet. Add sections from the options on the right.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section, index) => {
                    const isExpanded = expandedSections.has(section.key);

                    return (
                      <div
                        key={section.key}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`border rounded-lg p-4 bg-white cursor-move transition-all ${
                          draggedIndex === index ? 'opacity-50' : 'hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Drag Handle */}
                          <GripVertical className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />

                          {/* Section Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={section.title}
                                  onChange={(e) => updateSection(index, { title: e.target.value })}
                                  className="font-medium text-gray-900 w-full border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-600 focus:outline-none px-0 py-1"
                                />
                              </div>
                              <Badge
                                variant="outline"
                                className={`${getSectionTypeColor(section.type)} flex-shrink-0`}
                              >
                                {section.type}
                              </Badge>
                            </div>

                            {/* Expand/Collapse */}
                            <button
                              onClick={() => toggleSectionExpand(section.key)}
                              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              <span>{section.keyPoints.length} key points</span>
                              <span className="text-gray-400">•</span>
                              <span>~{section.estimatedWords} words</span>
                            </button>

                            {isExpanded && (
                              <ul className="space-y-1 mb-2">
                                {section.keyPoints.map((point, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Remove Button */}
                          <button
                            onClick={() => removeSection(index)}
                            className="text-red-600 hover:text-red-800 flex-shrink-0 mt-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Available Sections from Options */}
          <div className="lg:col-span-1">
            <Card className="p-4 sticky top-6">
              <h3 className="font-bold mb-4">Add Sections</h3>
              <div className="space-y-4">
                {options.map((option) => (
                  <div key={option.id}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Option {option.option_number}
                    </h4>
                    <div className="space-y-2">
                      {option.outline_data.sections.map((section) => (
                        <button
                          key={section.key}
                          onClick={() => addSectionFromOption(option.option_number, section.key)}
                          className="w-full text-left p-2 border rounded hover:bg-blue-50 hover:border-blue-300 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium truncate flex-1">
                              {section.title}
                            </span>
                            <Copy className="w-3 h-3 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs mt-1 ${getSectionTypeColor(section.type)}`}
                          >
                            {section.type}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
