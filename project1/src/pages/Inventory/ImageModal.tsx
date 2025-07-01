import React, { useState, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Equipment } from '../../types';

interface ImageModalProps {
  equipment: Equipment;
  onClose: () => void;
}

function ImageModal({ equipment, onClose }: ImageModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Verificar si hay imágenes
  if (!equipment.imagenes?.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imágenes de {equipment.model}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500">
            No hay imágenes disponibles para este equipo
          </div>
        </div>
      </div>
    );
  }

  // Funciones de control optimizadas
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.25, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - 0.25, 0.25);
      // Reset position when zooming out significantly
      if (newZoom <= 1) {
        setImagePosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleRotateRight = useCallback(() => {
    setRotation(prev => (prev + 90) % 360);
  }, []);

  const handleRotateLeft = useCallback(() => {
    setRotation(prev => (prev - 90 + 360) % 360);
  }, []);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  // Eventos de arrastrar
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  }, [zoom, imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      e.preventDefault();
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoom, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Navegación entre imágenes
  const goToPrevious = useCallback(() => {
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : equipment.imagenes.length - 1;
    setCurrentImageIndex(newIndex);
    resetTransform();
  }, [currentImageIndex, equipment.imagenes.length, resetTransform]);

  const goToNext = useCallback(() => {
    const newIndex = currentImageIndex < equipment.imagenes.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    resetTransform();
  }, [currentImageIndex, equipment.imagenes.length, resetTransform]);

  // Manejo de teclado
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        if (equipment.imagenes.length > 1) goToPrevious();
        break;
      case 'ArrowRight':
        if (equipment.imagenes.length > 1) goToNext();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotateRight();
        break;
    }
  }, [onClose, equipment.imagenes.length, goToPrevious, goToNext, handleZoomIn, handleZoomOut, handleRotateRight]);

  // Agregar event listeners
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Evitar scroll del body cuando el modal está abierto
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentImage = equipment.imagenes[currentImageIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {equipment.imagenes.length === 1 
                ? `Imagen de ${equipment.model}`
                : `Imágenes de ${equipment.model} (${currentImageIndex + 1} de ${equipment.imagenes.length})`
              }
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Placa: {equipment.serial_number}
            </p>
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Alejar (Tecla: -)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded-lg min-w-[70px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Acercar (Tecla: +)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button
              onClick={handleRotateLeft}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Rotar izquierda"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleRotateRight}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              title="Rotar derecha (Tecla: R)"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={resetTransform}
              className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm transition-colors"
              title="Restablecer"
            >
              Reset
            </button>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
              title="Cerrar (Escape)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Contenedor de imagen */}
        <div className="relative flex-1 overflow-hidden bg-gray-50">
          <div 
            className="w-full h-full flex items-center justify-center relative"
            style={{ 
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' 
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={currentImage}
              alt={`${equipment.model} - Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200 select-none"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
              draggable={false}
              onLoad={() => {
                // Reset transformations when image loads
                if (zoom !== 1 || rotation !== 0 || imagePosition.x !== 0 || imagePosition.y !== 0) {
                  resetTransform();
                }
              }}
            />
          </div>

          {/* Navegación entre imágenes */}
          {equipment.imagenes.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Imagen anterior (←)"
              >
                <ChevronLeft className="h-6 w-6 text-gray-800" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Imagen siguiente (→)"
              >
                <ChevronRight className="h-6 w-6 text-gray-800" />
              </button>
            </>
          )}
        </div>

        {/* Indicadores de imagen (si hay múltiples) */}
        {equipment.imagenes.length > 1 && (
          <div className="flex justify-center gap-2 p-4 bg-gray-50 border-t border-gray-200">
            {equipment.imagenes.map((_, index) => (
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
  );
}

export default ImageModal;