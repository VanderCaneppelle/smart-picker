'use client';

import { Input, Textarea } from '@/components/ui';

interface EmailPersonalizationFieldsProps {
  senderName: string;
  replyToEmail: string;
  signature: string;
  onSenderNameChange: (v: string) => void;
  onReplyToEmailChange: (v: string) => void;
  onSignatureChange: (v: string) => void;
}

export default function EmailPersonalizationFields({
  senderName,
  replyToEmail,
  signature,
  onSenderNameChange,
  onReplyToEmailChange,
  onSignatureChange,
}: EmailPersonalizationFieldsProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Personalização de E-mail</h3>

      <Input
        label="Nome do remetente"
        value={senderName}
        onChange={(e) => onSenderNameChange(e.target.value)}
        placeholder="Ex: Vander Talent"
        helperText={senderName ? `Preview: "${senderName} via Rankea"` : 'Aparecerá como "Nome via Rankea"'}
      />

      <Input
        label="E-mail de resposta (Reply-To)"
        type="email"
        value={replyToEmail}
        onChange={(e) => onReplyToEmailChange(e.target.value)}
        placeholder="voce@empresa.com"
        helperText="Candidatos responderão para este e-mail"
      />

      <Textarea
        label="Assinatura de e-mail"
        value={signature}
        onChange={(e) => onSignatureChange(e.target.value)}
        placeholder="Sua assinatura personalizada"
        rows={3}
        helperText="Texto simples. Será incluído ao final dos e-mails enviados."
      />
    </div>
  );
}
