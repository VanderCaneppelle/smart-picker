'use client';

import { useState } from 'react';
import { Share2, Check, Linkedin, MessageCircle } from 'lucide-react';

interface ShareSectionProps {
  pageUrl: string;
  title: string;
}

export function ShareSection({ pageUrl, title }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(pageUrl);
  const encodedTitle = encodeURIComponent(title);
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const whatsAppUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Compartilhe as vagas com sua rede
      </h2>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={linkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          aria-label="Compartilhar no LinkedIn"
        >
          <Linkedin className="h-5 w-5" />
        </a>
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          aria-label="Compartilhar no WhatsApp"
        >
          <MessageCircle className="h-5 w-5" />
        </a>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 w-11 h-11 rounded-full border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          aria-label="Copiar link"
        >
          {copied ? (
            <Check className="h-5 w-5 text-green-600" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </button>
      </div>
    </section>
  );
}
