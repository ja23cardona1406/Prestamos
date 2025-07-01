import React, { useState, useCallback, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTouchTime, setLastTouchTime] = useState(0);

  // Verificar si hay imágenes
  if (!equipment.imagenes?.length) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">
              Imágenes de {equipment.model}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors p-1"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          <div className="text-center py-8 text-gray-500 text-sm">
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

  // Eventos de arrastrar para mouse
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

  // Eventos táctiles
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const currentTime = Date.now();
    
    if (currentTime - lastTouchTime < 300 && zoom === 1) {
      // Doble tap para zoom
      setZoom(2);
      setLastTouchTime(0);
    } else {
      setLastTouchTime(currentTime);
      if (zoom > 1) {
        setTouchStart({ x: touch.clientX, y: touch.clientY });
        setDragStart({
          x: touch.clientX - imagePosition.x,
          y: touch.clientY - imagePosition.y
        });
      }
    }
  }, [zoom, imagePosition, lastTouchTime]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStart && zoom > 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setImagePosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [touchStart, zoom, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setTouchStart(null);
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

  // Swipe gestures para móviles
  const [swipeStart, setSwipeStart] = useState<{ x: number; y: number } | null>(null);

  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (zoom === 1 && equipment.imagenes.length > 1) {
      const touch = e.touches[0];
      setSwipeStart({ x: touch.clientX, y: touch.clientY });
    }
  }, [zoom, equipment.imagenes.length]);

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (swipeStart && zoom === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - swipeStart.x;
      const deltaY = Math.abs(touch.clientY - swipeStart.y);
      
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0) {
          goToPrevious();
        } else {
          goToNext();
        }
      }
    }
    setSwipeStart(null);
  }, [swipeStart, zoom, goToPrevious, goToNext]);

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
      case 'f':
      case 'F':
        setIsFullscreen(!isFullscreen);
        break;
    }
  }, [onClose, equipment.imagenes.length, goToPrevious, goToNext, handleZoomIn, handleZoomOut, handleRotateRight, isFullscreen]);

  // Agregar event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Evitar scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const currentImage = equipment.imagenes[currentImageIndex];

  return (
    <div className={`fixed inset-0 bg-black ${isFullscreen ? 'bg-opacity-100' : 'bg-opacity-90'} flex items-center justify-center z-50`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${
        isFullscreen 
          ? 'w-full h-full' 
          : 'w-full h-full max-w-6xl max-h-[95vh] m-2 sm:m-4'
      }`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-3 sm:p-4 border-b border-gray-200 ${isFullscreen ? 'bg-black bg-opacity-50 text-white' : ''}`}>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl font-semibold truncate">
              {equipment.imagenes.length === 1 
                ? `Imagen de ${equipment.model}`
                : `${equipment.model} (${currentImageIndex + 1}/${equipment.imagenes.length})`
              }
            </h2>
            <p className="text-sm opacity-75 mt-1 truncate">
              Placa: {equipment.serial_number}
            </p>
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-1 sm:gap-2 ml-4">
            {/* Controles de zoom */}
            <button
              onClick={handleZoomOut}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'}`}
              title="Alejar (-)"
            >
              <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            
            <span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-lg min-w-[50px] sm:min-w-[70px] text-center ${
              isFullscreen ? 'bg-black bg-opacity-30 text-white' : 'bg-gray-100'
            }`}>
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'}`}
              title="Acercar (+)"
            >
              <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            {/* Separador */}
            <div className={`w-px h-4 sm:h-6 mx-1 ${isFullscreen ? 'bg-white bg-opacity-30' : 'bg-gray-300'}`}></div>

            {/* Controles de rotación */}
            <button
              onClick={handleRotateLeft}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'}`}
              title="Rotar izquierda"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            
            <button
              onClick={handleRotateRight}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'}`}
              title="Rotar derecha (R)"
            >
              <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            {/* Reset */}
            <button
              onClick={resetTransform}
              className={`px-2 sm:px-3 py-1 rounded-lg hover:bg-gray-200 text-xs sm:text-sm transition-colors ${
                isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'
              }`}
              title="Restablecer"
            >
              Reset
            </button>

            {/* Separador */}
            <div className={`w-px h-4 sm:h-6 mx-1 ${isFullscreen ? 'bg-white bg-opacity-30' : 'bg-gray-300'}`}></div>

            {/* Pantalla completa */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2 rounded-lg hover:bg-gray-200 transition-colors ${isFullscreen ? 'bg-black bg-opacity-30 text-white hover:bg-white hover:bg-opacity-20' : 'bg-gray-100'}`}
              title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </button>
            
            {/* Cerrar */}
            <button 
              onClick={onClose} 
              className={`text-gray-500 hover:text-gray-700 transition-colors p-1 ${isFullscreen ? 'text-white hover:text-gray-300' : ''}`}
              title="Cerrar (Escape)"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Contenedor de imagen */}
        <div className={`relative flex-1 overflow-hidden ${isFullscreen ? 'bg-black' : 'bg-gray-50'}`}>
          <div 
            className="w-full h-full flex items-center justify-center relative"
            style={{ 
              cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' 
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={(e) => {
              handleTouchStart(e);
              handleSwipeStart(e);
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={(e) => {
              handleTouchEnd();
              handleSwipeEnd(e);
            }}
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
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Imagen anterior (←)"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-white p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
                title="Imagen siguiente (→)"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6 text-gray-800" />
              </button>
            </>
          )}

          {/* Indicadores de swipe para móviles */}
          {equipment.imagenes.length > 1 && !isFullscreen && (
            <div className="absolute bottom-20 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs sm:hidden">
              Desliza para cambiar imagen
            </div>
          )}

          {/* Ayuda de zoom para móviles */}
          {zoom === 1 && !isFullscreen && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs sm:hidden">
              Doble tap para zoom
            </div>
          )}
        </div>

        {/* Indicadores de imagen (si hay múltiples) */}
        {equipment.imagenes.length > 1 && !isFullscreen && (
          <div className={`flex justify-center gap-2 p-3 sm:p-4 border-t border-gray-200 ${isFullscreen ? 'bg-black bg-opacity-50' : 'bg-gray-50'}`}>
            {equipment.imagenes.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentImageIndex(index);
                  resetTransform();
                }}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-colors ${
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