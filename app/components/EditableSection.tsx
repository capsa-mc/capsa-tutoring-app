'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { EditableSectionProps } from '@/types/editable-section';
import { theme } from '@/app/styles/theme';

export default function EditableSection({
  pagePath,
  sectionKey,
  defaultContent,
  isEditable = false,
}: EditableSectionProps) {
  const [content, setContent] = useState(defaultContent);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClientComponentClient();

  const loadContent = useCallback(async () => {
    const { data } = await supabase
      .from('editable_sections')
      .select('content')
      .eq('page_path', pagePath)
      .eq('section_key', sectionKey)
      .single();

    if (data) {
      setContent(data.content);
    }
  }, [supabase, pagePath, sectionKey]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleSave = async () => {
    if (!isEditable) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('editable_sections')
      .upsert({
        page_path: pagePath,
        section_key: sectionKey,
        content: content,
        updated_at: new Date().toISOString(),
      });

    if (!error) {
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  if (!isEditable) {
    return (
      <div className={`${theme.text.body.base} ${theme.colors.text.primary}`}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  }

  return (
    <div className="relative">
      {isEditing ? (
        <div className="space-y-4">
          <textarea
            className={`w-full min-h-[200px] p-4 ${theme.colors.border.base} rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <button
              className={`${theme.button.base} ${theme.button.variants.ghost} ${theme.button.sizes.md}`}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              className={`${theme.button.base} ${theme.button.variants.primary} ${theme.button.sizes.md}`}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="group relative">
          <div className={`${theme.text.body.base} ${theme.colors.text.primary}`}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <button
            className={`absolute top-2 right-2 px-3 py-1 text-sm ${theme.colors.text.secondary} bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:shadow-md`}
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        </div>
      )}
    </div>
  );
} 