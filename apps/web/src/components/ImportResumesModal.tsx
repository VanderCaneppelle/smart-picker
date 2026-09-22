'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  IMPORT_ALLOWED_MIME_TYPES,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_BATCH_FILES,
  type IngestFile,
  type IngestResult,
  type RejectCode,
} from '@hunter/core';
import { apiClient } from '@/lib/api-client';
import { Button, Modal } from '@/components/ui';

/** Uploads simultâneos. Três é o mesmo teto usado na pontuação, pelo mesmo motivo. */
const UPLOAD_PARALELO = 3;

type ItemStatus = 'aguardando' | 'enviando' | 'enviado' | 'erro';

/** Motivo local, decidido no navegador antes de gastar upload. */
type MotivoLocal = RejectCode | 'upload_failed';

interface ItemLote {
  id: string;
  file: File;
  status: ItemStatus;
  motivo?: MotivoLocal;
  sha256?: string;
  storagePath?: string;
}

interface ImportResumesModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  /** Chamado quando algum candidato foi criado, para a lista recarregar. */
  onImported: (result: IngestResult) => void;
}

/** sha256 do arquivo no próprio navegador, para barrar repetido sem gastar upload. */
async function calcularSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function ImportResumesModal({
  jobId,
  isOpen,
  onClose,
  onImported,
}: ImportResumesModalProps) {
  const t = useTranslations();
  const [itens, setItens] = useState<ItemLote[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<IngestResult | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const limparEFechar = useCallback(() => {
    if (enviando) return;
    setItens([]);
    setResultado(null);
    setErroGeral(null);
    onClose();
  }, [enviando, onClose]);

  const adicionarArquivos = useCallback((lista: FileList | null) => {
    if (!lista || lista.length === 0) return;

    setResultado(null);
    setErroGeral(null);

    setItens((anteriores) => {
      const novos: ItemLote[] = [];

      for (const file of Array.from(lista)) {
        const jaNaLista = anteriores.some(
          (i) => i.file.name === file.name && i.file.size === file.size
        );
        if (jaNaLista) continue;

        // Tipo e tamanho são checados aqui também, e não só no servidor: descobrir na
        // tela custa nada, e descobrir depois de subir 40 arquivos custa a paciência
        // de quem está importando.
        let motivo: MotivoLocal | undefined;
        if (!IMPORT_ALLOWED_MIME_TYPES.includes(file.type as (typeof IMPORT_ALLOWED_MIME_TYPES)[number])) {
          motivo = 'unsupported_type';
        } else if (file.size > MAX_IMPORT_FILE_BYTES) {
          motivo = 'too_large';
        } else if (anteriores.length + novos.length >= MAX_IMPORT_BATCH_FILES) {
          motivo = 'batch_limit';
        }

        novos.push({
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          status: motivo ? 'erro' : 'aguardando',
          motivo,
        });
      }

      return [...anteriores, ...novos];
    });
  }, []);

  const removerItem = useCallback((id: string) => {
    setItens((anteriores) => anteriores.filter((i) => i.id !== id));
  }, []);

  const atualizarItem = useCallback((id: string, mudanca: Partial<ItemLote>) => {
    setItens((anteriores) =>
      anteriores.map((i) => (i.id === id ? { ...i, ...mudanca } : i))
    );
  }, []);

  const importar = useCallback(async () => {
    const pendentes = itens.filter((i) => i.status === 'aguardando');
    if (pendentes.length === 0) return;

    setEnviando(true);
    setErroGeral(null);

    const fila = [...pendentes];
    const hashesDoLote = new Set<string>();
    const prontos: Array<IngestFile & { itemId: string }> = [];

    // Um arquivo por requisição: função serverless na Vercel recusa corpo acima de
    // ~4,5 MB, então 40 arquivos num POST só estouram. Três de cada vez para não abrir
    // 40 conexões de uma vez.
    const consumidor = async () => {
      for (;;) {
        const item = fila.shift();
        if (!item) return;

        atualizarItem(item.id, { status: 'enviando' });

        try {
          const sha256 = await calcularSha256(item.file);

          // Arquivo repetido dentro do próprio lote morre aqui, sem upload e sem IA.
          if (hashesDoLote.has(sha256)) {
            atualizarItem(item.id, { status: 'erro', motivo: 'duplicate_file', sha256 });
            continue;
          }
          hashesDoLote.add(sha256);

          const enviado = await apiClient.uploadFile(item.file, 'resumes', false, 'import');

          prontos.push({
            itemId: item.id,
            storage_path: enviado.storage_path,
            original_name: item.file.name,
            // O hash que vale é o do servidor, calculado sobre o que realmente subiu.
            sha256: enviado.sha256 ?? sha256,
            mime_type: item.file.type,
            size_bytes: item.file.size,
          });

          atualizarItem(item.id, {
            status: 'enviado',
            sha256: enviado.sha256 ?? sha256,
            storagePath: enviado.storage_path,
          });
        } catch (error) {
          console.error('Falha no upload do currículo:', error);
          atualizarItem(item.id, { status: 'erro', motivo: 'upload_failed' });
        }
      }
    };

    await Promise.all(Array.from({ length: UPLOAD_PARALELO }, consumidor));

    if (prontos.length === 0) {
      setEnviando(false);
      return;
    }

    try {
      const resposta = await apiClient.importCandidates(
        jobId,
        prontos.map(({ itemId: _itemId, ...arquivo }) => arquivo)
      );

      // O servidor tem a palavra final: o que ele recusou vira erro na linha do arquivo,
      // com o código dele, e não com o palpite da tela.
      const porHash = new Map(resposta.rejected.map((r) => [r.sha256, r.code]));
      for (const pronto of prontos) {
        const recusa = porHash.get(pronto.sha256);
        if (recusa) {
          atualizarItem(pronto.itemId, { status: 'erro', motivo: recusa });
        }
      }

      setResultado(resposta);
      if (resposta.created.length > 0) {
        onImported(resposta);
      }
    } catch (error) {
      console.error('Falha ao importar currículos:', error);
      setErroGeral(t('importacao.erroImportar'));
    } finally {
      setEnviando(false);
    }
  }, [itens, jobId, atualizarItem, onImported, t]);

  const aguardando = itens.filter((i) => i.status === 'aguardando').length;
  const comErro = itens.filter((i) => i.status === 'erro').length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={limparEFechar}
      title={t('importacao.titulo')}
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={limparEFechar} disabled={enviando}>
            {resultado ? t('importacao.fechar') : t('importacao.cancelar')}
          </Button>
          <Button onClick={importar} isLoading={enviando} disabled={aguardando === 0}>
            {aguardando > 0
              ? t('importacao.importarN', { n: aguardando })
              : t('importacao.importar')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={(e) => {
            e.preventDefault();
            setArrastando(false);
            adicionarArquivos(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
            arrastando ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">{t('importacao.arraste')}</p>
          <p className="text-xs text-gray-500">{t('importacao.formatos')}</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => {
              adicionarArquivos(e.target.files);
              e.target.value = '';
            }}
          />
        </div>

        {/* Dito antes de confirmar, não depois: é a diferença entre o recrutador saber o
            que vai acontecer e descobrir que não aconteceu. */}
        <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {t('importacao.semEmail')}
        </p>

        {itens.length > 0 && (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {itens.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-gray-100 px-3 py-2 text-sm"
              >
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="flex-1 truncate text-gray-700">{item.file.name}</span>

                {item.status === 'erro' && item.motivo && (
                  <span className="shrink-0 text-xs text-red-600">
                    {t(`importacao.motivo.${item.motivo}`)}
                  </span>
                )}
                {item.status === 'enviando' && (
                  <span className="shrink-0 text-xs text-gray-500">
                    {t('importacao.status.enviando')}
                  </span>
                )}
                {item.status === 'enviado' && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                )}
                {item.status === 'aguardando' && !enviando && (
                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    className="shrink-0 text-gray-400 hover:text-gray-600"
                    aria-label={t('importacao.remover')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {resultado && (
          <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium">
              {t('importacao.resultadoCriados', { n: resultado.created.length })}
            </p>
            {comErro > 0 && (
              <p className="text-gray-500">
                {t('importacao.resultadoRecusados', { n: comErro })}
              </p>
            )}
            {resultado.queued > 0 && (
              <p className="mt-1 text-gray-500">{t('importacao.pontuandoAgora')}</p>
            )}
          </div>
        )}

        {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}
      </div>
    </Modal>
  );
}
