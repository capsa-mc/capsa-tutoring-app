export interface EditableSection {
  id: string;
  page_path: string;
  section_key: string;
  content: string;
  updated_at: string;
  updated_by: string;
}

export interface EditableSectionProps {
  pagePath: string;
  sectionKey: string;
  defaultContent: string;
  isEditable?: boolean;
} 