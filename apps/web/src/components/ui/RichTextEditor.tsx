'use client';

import { useTranslations } from 'next-intl';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Sparkles,
  Check,
  X,
  Loader2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Minus,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  required?: boolean;
  /** Liga o botão "Melhorar com IA". Só faz sentido na descrição da vaga. */
  aiPolish?: boolean;
  /** Contexto passado para a IA (título da vaga). */
  aiContext?: string;
}

const MenuButton = ({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
      isActive ? 'bg-emerald-100 text-emerald-700' : 'text-gray-600'
    }`}
  >
    {children}
  </button>
);

const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Comece a escrever...',
  label,
  error,
  required,
  aiPolish = false,
  aiContext,
}: RichTextEditorProps) => {
  const t = useTranslations();
  const [polishing, setPolishing] = useState(false);
  const [suggestion, setSuggestion] = useState<{ html: string; missing: string[] } | null>(null);

  const handlePolish = async () => {
    if (!editor) return;
    setPolishing(true);
    setSuggestion(null);
    try {
      const result = await apiClient.polishJobDescription(editor.getHTML(), aiContext);
      setSuggestion(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não consegui melhorar a descrição.');
    } finally {
      setPolishing(false);
    }
  };

  const applySuggestion = () => {
    if (!editor || !suggestion) return;
    // setContent entra no histórico do TipTap, então o Desfazer da barra reverte isto.
    editor.commands.setContent(suggestion.html);
    onChange(editor.getHTML());
    setSuggestion(null);
    toast.success('Descrição atualizada. Use Desfazer se quiser voltar.');
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="border border-gray-300 rounded-lg min-h-[250px] animate-pulse bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div
        className={`border rounded-lg overflow-hidden ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50">
          <MenuButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title={t('editor.negrito')}
          >
            <Bold className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title={t('editor.italico')}
          >
            <Italic className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor.isActive('heading', { level: 1 })}
            title={t('editor.titulo1')}
          >
            <Heading1 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor.isActive('heading', { level: 2 })}
            title={t('editor.titulo2')}
          >
            <Heading2 className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            isActive={editor.isActive('heading', { level: 3 })}
            title={t('editor.titulo3')}
          >
            <Heading3 className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title={t('editor.lista')}
          >
            <List className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title={t('editor.listaNumerada')}
          >
            <ListOrdered className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title={t('editor.citacao')}
          >
            <Quote className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title={t('editor.linha')}
          >
            <Minus className="h-4 w-4" />
          </MenuButton>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <MenuButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title={t('editor.desfazer')}
          >
            <Undo className="h-4 w-4" />
          </MenuButton>
          <MenuButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title={t('editor.refazer')}
          >
            <Redo className="h-4 w-4" />
          </MenuButton>

          {aiPolish && (
            <button
              type="button"
              onClick={handlePolish}
              disabled={polishing}
              title="Corrige o texto e organiza em seções, sem inventar informação"
              className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {polishing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              )}
              {polishing ? 'Melhorando...' : 'Melhorar com IA'}
            </button>
          )}
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {suggestion && (
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">{t('editor.sugestaoIA')}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <X className="h-3.5 w-3.5" />{t('editor.descartar')}</button>
                <button
                  type="button"
                  onClick={applySuggestion}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  <Check className="h-3.5 w-3.5" />{t('editor.aplicar')}</button>
              </div>
            </div>

            <div
              className="tiptap max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-white p-4"
              dangerouslySetInnerHTML={{ __html: suggestion.html }}
            />

            {suggestion.missing.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 text-[13px] font-medium text-gray-700">{t('editor.naoEscreveu')}</p>
                <ul className="list-disc space-y-0.5 pl-5 text-[13px] text-gray-500">
                  {suggestion.missing.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default RichTextEditor;
