'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Mail, Calendar, XCircle } from 'lucide-react';
import { Input } from '@/components/ui';

const PLACEHOLDERS = 'Variáveis: {{candidate_name}}, {{job_title}}, {{sender_name}}, {{signature}}. Para "Agendar entrevista": {{calendly_link}}';

const PREVIEW_VARS = {
  candidate_name: 'Maria Silva',
  job_title: 'Desenvolvedor Full Stack',
  sender_name: 'Equipe de RH',
  signature: 'Atenciosamente,\nEquipe de RH',
  calendly_link: `<p>Agende sua entrevista pelo link abaixo:</p><div style="text-align: center; margin: 24px 0;"><a href="#" style="display: inline-block; background: #059669; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Agendar entrevista (Calendly)</a></div><p>Se o link não abrir, copie e cole no navegador: <br><a href="#" style="color: #2563eb; word-break: break-all;">https://calendly.com/exemplo</a></p>`,
};

function renderPreviewTemplate(
  template: string,
  vars: Record<string, string>
): string {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  }
  return out;
}

export type TemplateId = 'application_received' | 'schedule_interview' | 'rejection';

interface TemplateEditorProps {
  id: TemplateId;
  title: string;
  icon: React.ReactNode;
  subject: string;
  bodyHtml: string;
  onSubjectChange: (v: string) => void;
  onBodyChange: (v: string) => void;
  defaultSubject: string;
  defaultBodyHint: string;
  showCalendlyInPreview?: boolean;
  expandedId: TemplateId | null;
  onToggle: (id: TemplateId) => void;
}

function TemplateEditor({
  id,
  title,
  icon,
  subject,
  bodyHtml,
  onSubjectChange,
  onBodyChange,
  defaultSubject,
  defaultBodyHint,
  showCalendlyInPreview = false,
  expandedId,
  onToggle,
}: TemplateEditorProps) {
  const open = expandedId === id;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
        {icon}
        <span className="font-medium text-gray-900">{title}</span>
      </button>
      {open && (
        <div className="p-4 space-y-4 border-t border-gray-200 bg-white">
          <Input
            label="Assunto"
            value={subject}
            onChange={(e) => onSubjectChange(e.target.value)}
            placeholder={defaultSubject}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corpo do e-mail (HTML)</label>
            <textarea
              value={bodyHtml}
              onChange={(e) => onBodyChange(e.target.value)}
              placeholder={defaultBodyHint}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">{PLACEHOLDERS}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface PreviewPanelProps {
  templateId: TemplateId | null;
  templateTitle: string;
  subject: string;
  bodyHtml: string;
  defaultSubject: string;
  defaultBodyHint: string;
  showCalendlyInPreview: boolean;
}

function PreviewPanel({
  templateId,
  templateTitle,
  subject,
  bodyHtml,
  defaultSubject,
  defaultBodyHint,
  showCalendlyInPreview,
}: PreviewPanelProps) {
  const previewSubject = useMemo(
    () => renderPreviewTemplate(subject || defaultSubject, PREVIEW_VARS),
    [subject, defaultSubject]
  );

  const previewHtml = useMemo(() => {
    const raw = bodyHtml || defaultBodyHint;
    if (!raw || !raw.trim().startsWith('<')) return '';
    const vars = { ...PREVIEW_VARS };
    if (!showCalendlyInPreview) {
      vars.calendly_link = '<p><em>[Link do Calendly será inserido aqui]</em></p>';
    }
    return renderPreviewTemplate(raw, vars);
  }, [bodyHtml, defaultBodyHint, showCalendlyInPreview]);

  if (!templateId) {
    return (
      <div className="h-full min-h-[320px] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 text-center p-6">
        <p className="text-sm font-medium text-gray-600">Prévia do e-mail</p>
        <p className="text-sm text-gray-500 mt-1">Expanda um modelo à esquerda para ver como o e-mail ficará.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prévia</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{templateTitle}</p>
      </div>
      <div className="flex-1 flex flex-col min-h-0 p-4 overflow-auto">
        <div className="mb-3">
          <span className="text-xs font-medium text-gray-500">Assunto: </span>
          <span className="text-sm text-gray-900">{previewSubject || '(vazio)'}</span>
        </div>
        {previewHtml ? (
          <div className="flex-1 min-h-[280px] border border-gray-200 rounded-lg overflow-hidden bg-white">
            <iframe
              title={`Prévia ${templateTitle}`}
              srcDoc={previewHtml}
              className="w-full h-full min-h-[320px] border-0"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Edite o corpo em HTML para ver a prévia.</p>
        )}
      </div>
    </div>
  );
}

interface EmailTemplatesSectionProps {
  applicationReceivedSubject: string;
  applicationReceivedBodyHtml: string;
  scheduleInterviewSubject: string;
  scheduleInterviewBodyHtml: string;
  rejectionSubject: string;
  rejectionBodyHtml: string;
  onApplicationReceivedSubjectChange: (v: string) => void;
  onApplicationReceivedBodyChange: (v: string) => void;
  onScheduleInterviewSubjectChange: (v: string) => void;
  onScheduleInterviewBodyChange: (v: string) => void;
  onRejectionSubjectChange: (v: string) => void;
  onRejectionBodyChange: (v: string) => void;
}

export default function EmailTemplatesSection({
  applicationReceivedSubject,
  applicationReceivedBodyHtml,
  scheduleInterviewSubject,
  scheduleInterviewBodyHtml,
  rejectionSubject,
  rejectionBodyHtml,
  onApplicationReceivedSubjectChange,
  onApplicationReceivedBodyChange,
  onScheduleInterviewSubjectChange,
  onScheduleInterviewBodyChange,
  onRejectionSubjectChange,
  onRejectionBodyChange,
}: EmailTemplatesSectionProps) {
  const [expandedId, setExpandedId] = useState<TemplateId | null>(null);

  const handleToggle = (id: TemplateId) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  const previewProps = useMemo(() => {
    if (expandedId === 'application_received')
      return {
        templateTitle: 'Candidatura recebida',
        subject: applicationReceivedSubject,
        bodyHtml: applicationReceivedBodyHtml,
        defaultSubject: 'Candidatura recebida: {{job_title}}',
        defaultBodyHint: 'E-mail enviado quando o candidato envia a aplicação. Use as variáveis no texto.',
        showCalendlyInPreview: false,
      };
    if (expandedId === 'schedule_interview')
      return {
        templateTitle: 'Agendar entrevista',
        subject: scheduleInterviewSubject,
        bodyHtml: scheduleInterviewBodyHtml,
        defaultSubject: "Você foi selecionado(a)! Agende sua entrevista – {{job_title}}",
        defaultBodyHint: 'Inclua {{calendly_link}} onde deve aparecer o botão/link do Calendly.',
        showCalendlyInPreview: true,
      };
    if (expandedId === 'rejection')
      return {
        templateTitle: 'Rejeição',
        subject: rejectionSubject,
        bodyHtml: rejectionBodyHtml,
        defaultSubject: 'Atualização sobre sua candidatura: {{job_title}}',
        defaultBodyHint: 'E-mail enviado quando o candidato é rejeitado.',
        showCalendlyInPreview: false,
      };
    return null;
  }, [
    expandedId,
    applicationReceivedSubject,
    applicationReceivedBodyHtml,
    scheduleInterviewSubject,
    scheduleInterviewBodyHtml,
    rejectionSubject,
    rejectionBodyHtml,
  ]);

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Modelos de e-mail</h3>
      <p className="text-sm text-gray-500">
        Personalize o assunto e o corpo de cada e-mail enviado aos candidatos. Deixe em branco para usar o modelo padrão.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,480px),1fr] gap-6 lg:gap-8 w-full">
        <div className="space-y-3 min-w-0">
          <TemplateEditor
            id="application_received"
            title="Candidatura recebida"
            icon={<Mail className="h-4 w-4 text-emerald-600" />}
            subject={applicationReceivedSubject}
            bodyHtml={applicationReceivedBodyHtml}
            onSubjectChange={onApplicationReceivedSubjectChange}
            onBodyChange={onApplicationReceivedBodyChange}
            defaultSubject="Candidatura recebida: {{job_title}}"
            defaultBodyHint="E-mail enviado quando o candidato envia a aplicação. Use as variáveis no texto."
            expandedId={expandedId}
            onToggle={handleToggle}
          />
          <TemplateEditor
            id="schedule_interview"
            title="Agendar entrevista"
            icon={<Calendar className="h-4 w-4 text-blue-600" />}
            subject={scheduleInterviewSubject}
            bodyHtml={scheduleInterviewBodyHtml}
            onSubjectChange={onScheduleInterviewSubjectChange}
            onBodyChange={onScheduleInterviewBodyChange}
            defaultSubject="Você foi selecionado(a)! Agende sua entrevista – {{job_title}}"
            defaultBodyHint="Inclua {{calendly_link}} onde deve aparecer o botão/link do Calendly."
            showCalendlyInPreview
            expandedId={expandedId}
            onToggle={handleToggle}
          />
          <TemplateEditor
            id="rejection"
            title="Rejeição"
            icon={<XCircle className="h-4 w-4 text-gray-500" />}
            subject={rejectionSubject}
            bodyHtml={rejectionBodyHtml}
            onSubjectChange={onRejectionSubjectChange}
            onBodyChange={onRejectionBodyChange}
            defaultSubject="Atualização sobre sua candidatura: {{job_title}}"
            defaultBodyHint="E-mail enviado quando o candidato é rejeitado."
            expandedId={expandedId}
            onToggle={handleToggle}
          />
        </div>

        <div className="min-w-0 w-full lg:sticky lg:top-6 lg:self-start lg:min-h-[420px] lg:h-full">
          <PreviewPanel
            templateId={expandedId}
            templateTitle={previewProps?.templateTitle ?? ''}
            subject={previewProps?.subject ?? ''}
            bodyHtml={previewProps?.bodyHtml ?? ''}
            defaultSubject={previewProps?.defaultSubject ?? ''}
            defaultBodyHint={previewProps?.defaultBodyHint ?? ''}
            showCalendlyInPreview={previewProps?.showCalendlyInPreview ?? false}
          />
        </div>
      </div>
    </div>
  );
}
