import React, { useState } from 'react';
import { Download, Loader2, FileCheck } from 'lucide-react';

const ExportButton = () => {
    const [status, setStatus] = useState('idle'); // idle, downloading, success

    const handleDownload = () => {
        setStatus('downloading');

        // Simulate generation delay
        setTimeout(() => {
            // Download the static file from public folder
            // NOTE: The user has placed 'acta_asamblea.pdf' in the public folder
            const pdfUrl = '/acta_asamblea.pdf';

            const a = document.createElement('a');
            a.href = pdfUrl;
            a.download = `Acta_Asamblea_${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setStatus('success');

            // Reset after showing success for a moment
            setTimeout(() => {
                setStatus('idle');
            }, 3000);
        }, 2000); // 2 second delay for "transition"
    };

    return (
        <button
            onClick={handleDownload}
            disabled={status === 'downloading'}
            className={`
        inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm transition-all duration-300
        ${status === 'idle'
                    ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-primary-500'
                    : ''}
        ${status === 'downloading'
                    ? 'border-primary-500 text-primary-700 bg-primary-50 cursor-wait'
                    : ''}
        ${status === 'success'
                    ? 'border-green-500 text-green-700 bg-green-50'
                    : ''}
        focus:outline-none focus:ring-2 focus:ring-offset-2
      `}
        >
            {status === 'idle' && (
                <>
                    <Download className="mr-2 h-4 w-4 text-gray-500" />
                    Exportar Acta de Asamblea
                </>
            )}

            {status === 'downloading' && (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary-600" />
                    Generando PDF...
                </>
            )}

            {status === 'success' && (
                <>
                    <FileCheck className="mr-2 h-4 w-4 text-green-600" />
                    ¡Descarga Completa!
                </>
            )}
        </button>
    );
};

export default ExportButton;
