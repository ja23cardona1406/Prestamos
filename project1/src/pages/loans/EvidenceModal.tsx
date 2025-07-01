import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, RotateCcw, AlertCircle } from 'lucide-react';
import type { FileEvidence } from '../../types';

interface EvidenceModalProps {
  evidence: FileEvidence[];
  borrowerName: string;
  onClose: () => void;
}

function EvidenceModal({ evidence, borrowerName, onClose }: EvidenceModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState<{ [key: number]: boolean }>({});

  if (!evidence || evidence.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Evidencia FI-1557</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            No hay evidencias disponibles
          </div>
        </div>
      </div>
    );
  }

  const currentEvidence = evidence[currentImageIndex];

  const handleImageLoad = (index: number) => {
    setLoading(prev => ({ ...prev, [index]: false }));
    setImageError(prev => ({ ...prev, [index]: false }));
  };

  const handleImageError = (index: number) => {
    setLoading(prev => ({ ...prev, [index]: false }));
    setImageError(prev => ({ ...prev, [index]: true }));
    console.error(`Error loading image at index ${index}:`, evidence[index].url);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentEvidence.url);
      if (!response.ok) throw new Error('Error al descargar la imagen');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = currentEvidence.filename || `evidencia-${currentImageIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error al descargar la imagen');
    }
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
  };

  const goToPrevious = () => {
    setCurrentImageIndex(prev => prev > 0 ? prev - 1 : evidence.length - 1);
    resetTransform();
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => prev < evidence.length - 1 ? prev + 1 : 0);
    resetTransform();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (evidence.length > 1) goToPrevious();
          break;
        case 'ArrowRight':
          if (evidence.length > 1) goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [evidence.length]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-4xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">
              Evidencia FI-1557 - {borrowerName}
            </h2>
            {evidence.length > 1 && (
              <p className="text-sm text-gray-500">
                Imagen {currentImageIndex + 1} de {evidence.length}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Controles de zoom */}
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.25))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <span className="text-sm font-medium px-2 py-1 bg-gray-100 rounded-lg min-w-[70px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.25, 4))}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>

            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Controles de rotación */}
            <button
              onClick={() => setRotation(prev => (prev - 90 + 360) % 360)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Rotar izquierda"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Rotar derecha"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Reset */}
            <button
              onClick={resetTransform}
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              title="Restablecer"
            >
              Reset
            </button>

            {/* Separador */}
            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            {/* Descargar */}
            <button
              onClick={handleDownload}
              className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              title="Descargar imagen"
            >
              <Download className="h-4 w-4" />
            </button>
            
            {/* Cerrar */}
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors p-1">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenedor de imagen */}
        <div className="relative flex-1 overflow-hidden bg-gray-50">
          <div className="w-full h-full flex items-center justify-center">
            {loading[currentImageIndex] && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {imageError[currentImageIndex] ? (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8">
                <AlertCircle className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium mb-2">Error al cargar la imagen</p>
                <p className="text-sm text-center mb-4">
                  No se pudo cargar la imagen desde el storage.
                </p>
                <div className="text-xs text-gray-400 break-all max-w-md text-center">
                  URL: {currentEvidence.url}
                </div>
                <button
                  onClick={() => {
                    setImageError(prev => ({ ...prev, [currentImageIndex]: false }));
                    setLoading(prev => ({ ...prev, [currentImageIndex]: true }));
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : (
              <img
                src={currentEvidence.url}
                alt={`Evidencia FI-1557 - ${currentEvidence.filename}`}
                className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center'
                }}
                onLoad={() => handleImageLoad(currentImageIndex)}
                onError={() => handleImageError(currentImageIndex)}
                onLoadStart={() => setLoading(prev => ({ ...prev, [currentImageIndex]: true }))}
                draggable={false}
              />
            )}
          </div>

          {/* Navegación entre imágenes */}
          {evidence.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
                title="Imagen anterior"
              >
                <svg className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200"
                title="Imagen siguiente"
              >
                <svg className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Footer con información de la imagen */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>
              <span className="font-medium">Archivo:</span> {currentEvidence.filename}
            </div>
            {currentEvidence.uploaded_at && (
              <div>
                <span className="font-medium">Subido:</span> {new Date(currentEvidence.uploaded_at).toLocaleString()}
              </div>
            )}
          </div>
          
          {/* Indicadores de imagen */}
          {evidence.length > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              {evidence.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    resetTransform();
                  }}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-blue-600' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  title={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EvidenceModal;