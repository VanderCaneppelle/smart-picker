'use client';

import { Input, Textarea } from '@/components/ui';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations();
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">{t('config.personalizacaoEmail')}</h3>

      <Input
        label={t('config.nomeRemetente')}
        value={senderName}
        onChange={(e) => onSenderNameChange(e.target.value)}
        placeholder={t('config.exEquipe')}
        helperText={senderName ? `Preview: "${senderName} via Rankea"` : 'Aparecerá como "Nome via Rankea"'}
      />

      <Input
        label={t('config.replyTo')}
        type="email"
        value={replyToEmail}
        onChange={(e) => onReplyToEmailChange(e.target.value)}
        placeholder={t('config.exRecrutamento')}
        helperText={t('config.replyToAjuda')}
      />

      <Textarea
        label={t('config.assinatura')}
        value={signature}
        onChange={(e) => onSignatureChange(e.target.value)}
        placeholder={'Ex:\nAtenciosamente,\nEquipe de Recrutamento\nwww.suaempresa.com'}
        rows={3}
        helperText={t('config.assinaturaAjuda')}
      />
    </div>
  );
}
