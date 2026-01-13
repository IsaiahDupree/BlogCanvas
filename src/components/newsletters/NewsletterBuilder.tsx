'use client';

import React, { useState } from 'react';

// Block types that can be added to the newsletter
export type BlockType = 'header' | 'text' | 'image' | 'posts-grid' | 'posts-list' | 'cta' | 'footer';

export interface NewsletterBlock {
    id: string;
    type: BlockType;
    content: string;
    metadata?: {
        url?: string;
        imageUrl?: string;
        buttonText?: string;
        buttonUrl?: string;
    };
    styles?: {
        backgroundColor?: string;
        textColor?: string;
        fontSize?: string;
        padding?: string;
        textAlign?: 'left' | 'center' | 'right';
        fontWeight?: string;
    };
}

interface NewsletterBuilderProps {
    initialBlocks?: NewsletterBlock[];
    onChange?: (blocks: NewsletterBlock[], html: string) => void;
    onSaveTemplate?: () => void;
}

export function NewsletterBuilder({ initialBlocks = [], onChange, onSaveTemplate }: NewsletterBuilderProps) {
    const [blocks, setBlocks] = useState<NewsletterBlock[]>(initialBlocks);
    const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
    const [draggedBlockType, setDraggedBlockType] = useState<BlockType | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Generate HTML from blocks
    const generateHTML = (blocks: NewsletterBlock[]): string => {
        let html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        `;

        for (const block of blocks) {
            const styles = block.styles || {};
            const baseStyle = `
                background: ${styles.backgroundColor || '#f9fafb'};
                color: ${styles.textColor || '#4b5563'};
                padding: ${styles.padding || '20px'};
                text-align: ${styles.textAlign || 'left'};
                font-size: ${styles.fontSize || '16px'};
                font-weight: ${styles.fontWeight || 'normal'};
            `;

            switch (block.type) {
                case 'header':
                    html += `
                        <div style="${baseStyle || 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center;'}">
                            <h1 style="margin: 0; font-size: ${styles.fontSize || '32px'}; font-weight: ${styles.fontWeight || 'bold'};">${block.content}</h1>
                        </div>
                    `;
                    break;

                case 'text':
                    html += `
                        <div style="${baseStyle}">
                            <p style="line-height: 1.6; margin: 0;">${block.content}</p>
                        </div>
                    `;
                    break;

                case 'image':
                    html += `
                        <div style="${baseStyle}">
                            <img src="${block.metadata?.imageUrl || ''}" alt="${block.content}" style="max-width: 100%; height: auto; border-radius: 8px;" />
                        </div>
                    `;
                    break;

                case 'posts-grid':
                    html += `
                        <div style="${baseStyle}">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                <!-- Blog posts will be inserted here dynamically -->
                                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                    <h3 style="margin-top: 0; color: #1f2937;">Post Title</h3>
                                    <p style="color: #6b7280; font-size: 14px;">Post excerpt will appear here...</p>
                                    <a href="#" style="color: #6366f1; text-decoration: none;">Read more →</a>
                                </div>
                            </div>
                        </div>
                    `;
                    break;

                case 'posts-list':
                    html += `
                        <div style="${baseStyle}">
                            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                <h3 style="margin-top: 0; color: #1f2937;">Post Title</h3>
                                <p style="color: #6b7280; font-size: 14px;">Post excerpt will appear here...</p>
                                <a href="#" style="color: #6366f1; text-decoration: none;">Read more →</a>
                            </div>
                        </div>
                    `;
                    break;

                case 'cta':
                    html += `
                        <div style="${baseStyle}">
                            <a href="${block.metadata?.buttonUrl || '#'}" style="background: ${styles.backgroundColor || '#6366f1'}; color: ${styles.textColor || 'white'}; padding: 12px 30px; border-radius: 6px; text-decoration: none; display: inline-block; font-size: ${styles.fontSize || '16px'};">
                                ${block.metadata?.buttonText || block.content}
                            </a>
                        </div>
                    `;
                    break;

                case 'footer':
                    html += `
                        <div style="${baseStyle || 'padding: 20px; text-align: center; color: #6b7280; font-size: 12px; background: #e5e7eb;'}">
                            <p style="margin: 0;">${block.content}</p>
                            <a href="{{unsubscribe_url}}" style="color: #6b7280;">Unsubscribe</a>
                        </div>
                    `;
                    break;
            }
        }

        html += `</div>`;
        return html;
    };

    // Add a new block
    const addBlock = (type: BlockType) => {
        const newBlock: NewsletterBlock = {
            id: `block-${Date.now()}`,
            type,
            content: getDefaultContent(type),
            metadata: {}
        };

        const updatedBlocks = [...blocks, newBlock];
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Get default content for a block type
    const getDefaultContent = (type: BlockType): string => {
        switch (type) {
            case 'header': return 'Newsletter Header';
            case 'text': return 'Add your text content here...';
            case 'image': return 'Image description';
            case 'posts-grid': return 'Blog Posts Grid';
            case 'posts-list': return 'Blog Posts List';
            case 'cta': return 'Click Here';
            case 'footer': return 'Powered by BlogCanvas';
            default: return '';
        }
    };

    // Update block content
    const updateBlock = (id: string, updates: Partial<NewsletterBlock>) => {
        const updatedBlocks = blocks.map(block =>
            block.id === id ? { ...block, ...updates } : block
        );
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Remove a block
    const removeBlock = (id: string) => {
        const updatedBlocks = blocks.filter(block => block.id !== id);
        setBlocks(updatedBlocks);
        onChange?.(updatedBlocks, generateHTML(updatedBlocks));
    };

    // Drag and drop handlers
    const handleDragStart = (blockId: string) => {
        setDraggedBlockId(blockId);
    };

    const handleDragStartFromPalette = (blockType: BlockType) => {
        setDraggedBlockType(blockType);
    };

    const handleDragOver = (e: React.DragEvent, targetBlockId?: string) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, targetBlockId?: string) => {
        e.preventDefault();

        // Dropping a new block from palette
        if (draggedBlockType) {
            const newBlock: NewsletterBlock = {
                id: `block-${Date.now()}`,
                type: draggedBlockType,
                content: getDefaultContent(draggedBlockType),
                metadata: {},
                styles: {}
            };

            let updatedBlocks: NewsletterBlock[];
            if (targetBlockId) {
                const targetIndex = blocks.findIndex(b => b.id === targetBlockId);
                updatedBlocks = [...blocks];
                updatedBlocks.splice(targetIndex + 1, 0, newBlock);
            } else {
                updatedBlocks = [...blocks, newBlock];
            }

            setBlocks(updatedBlocks);
            onChange?.(updatedBlocks, generateHTML(updatedBlocks));
            setDraggedBlockType(null);
            return;
        }

        // Reordering existing blocks
        if (draggedBlockId && targetBlockId && draggedBlockId !== targetBlockId) {
            const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
            const targetIndex = blocks.findIndex(b => b.id === targetBlockId);

            if (draggedIndex === -1 || targetIndex === -1) return;

            const updatedBlocks = [...blocks];
            const [draggedBlock] = updatedBlocks.splice(draggedIndex, 1);
            updatedBlocks.splice(targetIndex, 0, draggedBlock);

            setBlocks(updatedBlocks);
            onChange?.(updatedBlocks, generateHTML(updatedBlocks));
        }
    };

    const handleDragEnd = () => {
        setDraggedBlockId(null);
        setDraggedBlockType(null);
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex gap-2">
                    <button
                        onClick={() => setPreviewMode('desktop')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            previewMode === 'desktop'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Desktop
                    </button>
                    <button
                        onClick={() => setPreviewMode('mobile')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            previewMode === 'mobile'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Mobile
                    </button>
                </div>
                {onSaveTemplate && (
                    <button
                        onClick={onSaveTemplate}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                        Save as Template
                    </button>
                )}
            </div>

            <div className="flex gap-6">
                {/* Block Palette */}
                <div className="w-64 flex-shrink-0">
                    <h3 className="font-semibold text-gray-900 mb-4">Drag Blocks</h3>
                    <div className="space-y-2">
                        <BlockPaletteItem
                            icon="📄"
                            label="Header"
                            blockType="header"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="📝"
                            label="Text"
                            blockType="text"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="🖼️"
                            label="Image"
                            blockType="image"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="📰"
                            label="Posts Grid"
                            blockType="posts-grid"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="📋"
                            label="Posts List"
                            blockType="posts-list"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="🔘"
                            label="Button (CTA)"
                            blockType="cta"
                            onDragStart={handleDragStartFromPalette}
                        />
                        <BlockPaletteItem
                            icon="👣"
                            label="Footer"
                            blockType="footer"
                            onDragStart={handleDragStartFromPalette}
                        />
                    </div>
                </div>

                {/* Canvas */}
                <div
                    className={`flex-1 bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300 transition-all ${
                        previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''
                    }`}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e)}
                >
                    <h3 className="font-semibold text-gray-900 mb-4">
                        Newsletter Preview ({previewMode})
                    </h3>
                    {blocks.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>Drag blocks from the left sidebar to start building</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {blocks.map((block, index) => (
                                <div
                                    key={block.id}
                                    draggable
                                    onDragStart={() => handleDragStart(block.id)}
                                    onDragOver={(e) => handleDragOver(e, block.id)}
                                    onDrop={(e) => handleDrop(e, block.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={() => setSelectedBlockId(block.id)}
                                    className={`bg-white border-2 rounded-lg p-4 cursor-move hover:border-indigo-400 transition-colors ${
                                        draggedBlockId === block.id ? 'opacity-50' : ''
                                    } ${
                                        selectedBlockId === block.id ? 'border-indigo-600' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-sm font-medium text-gray-700 capitalize">
                                            {block.type.replace('-', ' ')}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeBlock(block.id);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <BlockEditor block={block} onUpdate={(updates) => updateBlock(block.id, updates)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Styling Panel */}
                {selectedBlockId && (
                    <div className="w-64 flex-shrink-0">
                        <h3 className="font-semibold text-gray-900 mb-4">Block Styles</h3>
                        <StylePanel
                            block={blocks.find(b => b.id === selectedBlockId)!}
                            onUpdate={(updates) => updateBlock(selectedBlockId, updates)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Block palette item
function BlockPaletteItem({
    icon,
    label,
    blockType,
    onDragStart
}: {
    icon: string;
    label: string;
    blockType: BlockType;
    onDragStart: (type: BlockType) => void;
}) {
    return (
        <div
            draggable
            onDragStart={() => onDragStart(blockType)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-all cursor-grab active:cursor-grabbing"
        >
            <span className="text-2xl">{icon}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
    );
}

// Block editor (editable fields for each block)
function BlockEditor({ block, onUpdate }: { block: NewsletterBlock; onUpdate: (updates: Partial<NewsletterBlock>) => void }) {
    switch (block.type) {
        case 'header':
        case 'text':
        case 'footer':
            return (
                <textarea
                    value={block.content}
                    onChange={(e) => onUpdate({ content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                    placeholder="Enter text..."
                    onClick={(e) => e.stopPropagation()}
                />
            );

        case 'image':
            return (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={block.metadata?.imageUrl || ''}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, imageUrl: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Image URL"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <input
                        type="text"
                        value={block.content}
                        onChange={(e) => onUpdate({ content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Alt text"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );

        case 'cta':
            return (
                <div className="space-y-2">
                    <input
                        type="text"
                        value={block.metadata?.buttonText || block.content}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, buttonText: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Button text"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <input
                        type="text"
                        value={block.metadata?.buttonUrl || ''}
                        onChange={(e) => onUpdate({ metadata: { ...block.metadata, buttonUrl: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                        placeholder="Button URL"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );

        case 'posts-grid':
        case 'posts-list':
            return (
                <div className="text-sm text-gray-600 italic">
                    Blog posts will be automatically populated when the newsletter is sent
                </div>
            );

        default:
            return null;
    }
}

// Style panel for selected block
function StylePanel({ block, onUpdate }: { block: NewsletterBlock; onUpdate: (updates: Partial<NewsletterBlock>) => void }) {
    const styles = block.styles || {};

    return (
        <div className="space-y-4 bg-white p-4 rounded-lg border border-gray-200">
            {/* Background Color */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Background Color</label>
                <input
                    type="color"
                    value={styles.backgroundColor || '#f9fafb'}
                    onChange={(e) => onUpdate({ styles: { ...styles, backgroundColor: e.target.value } })}
                    className="w-full h-10 rounded border border-gray-300"
                />
            </div>

            {/* Text Color */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Text Color</label>
                <input
                    type="color"
                    value={styles.textColor || '#4b5563'}
                    onChange={(e) => onUpdate({ styles: { ...styles, textColor: e.target.value } })}
                    className="w-full h-10 rounded border border-gray-300"
                />
            </div>

            {/* Font Size */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Font Size</label>
                <select
                    value={styles.fontSize || '16px'}
                    onChange={(e) => onUpdate({ styles: { ...styles, fontSize: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="12px">Small (12px)</option>
                    <option value="14px">Default (14px)</option>
                    <option value="16px">Medium (16px)</option>
                    <option value="18px">Large (18px)</option>
                    <option value="24px">XLarge (24px)</option>
                    <option value="32px">XXLarge (32px)</option>
                </select>
            </div>

            {/* Font Weight */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Font Weight</label>
                <select
                    value={styles.fontWeight || 'normal'}
                    onChange={(e) => onUpdate({ styles: { ...styles, fontWeight: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                    <option value="lighter">Light</option>
                </select>
            </div>

            {/* Text Align */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Text Align</label>
                <div className="flex gap-2">
                    <button
                        onClick={() => onUpdate({ styles: { ...styles, textAlign: 'left' } })}
                        className={`flex-1 px-3 py-2 rounded border ${
                            styles.textAlign === 'left' || !styles.textAlign
                                ? 'bg-indigo-100 border-indigo-400'
                                : 'bg-white border-gray-300'
                        }`}
                    >
                        Left
                    </button>
                    <button
                        onClick={() => onUpdate({ styles: { ...styles, textAlign: 'center' } })}
                        className={`flex-1 px-3 py-2 rounded border ${
                            styles.textAlign === 'center'
                                ? 'bg-indigo-100 border-indigo-400'
                                : 'bg-white border-gray-300'
                        }`}
                    >
                        Center
                    </button>
                    <button
                        onClick={() => onUpdate({ styles: { ...styles, textAlign: 'right' } })}
                        className={`flex-1 px-3 py-2 rounded border ${
                            styles.textAlign === 'right'
                                ? 'bg-indigo-100 border-indigo-400'
                                : 'bg-white border-gray-300'
                        }`}
                    >
                        Right
                    </button>
                </div>
            </div>

            {/* Padding */}
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Padding</label>
                <select
                    value={styles.padding || '20px'}
                    onChange={(e) => onUpdate({ styles: { ...styles, padding: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="10px">Small (10px)</option>
                    <option value="20px">Medium (20px)</option>
                    <option value="30px">Large (30px)</option>
                    <option value="40px">XLarge (40px)</option>
                </select>
            </div>
        </div>
    );
}
