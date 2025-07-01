import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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

  if (!equipment.imagenes?.length) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imágenes de {equipment.model}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
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

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
    // Reset position when zooming out to prevent image being off-screen
    if (zoom <= 1) {
      setImagePosition({ x: 0, y: 0 });
    }
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imagePosition.x,
        y: e.clientY - imagePosition.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetTransform = () => {
    setZoom(1);
    setRotation(0);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleImageChange = () => {
    // Reset transformations when changing images
    resetTransform();
  };

  if (equipment.imagenes.length === 1) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              Imagen de {equipment.model}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="Alejar"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium px-2 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="Acercar"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                onClick={handleRotateLeft}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="Rotar izquierda"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handleRotateRight}
                className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                title="Rotar derecha"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                onClick={resetTransform}
                className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-sm transition-colors"
                title="Restablecer"
              >
                Reset
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div 
            className="relative flex-1 overflow-hidden rounded-lg bg-gray-50 flex items-center justify-center"
            style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img
              src={equipment.imagenes[0]}
              alt={`${equipment.model}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              draggable={false}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Imágenes de {equipment.model} ({currentImageIndex + 1} de {equipment.imagenes.length})
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium px-2 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleRotateLeft}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              title="Rotar izquierda"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleRotateRight}
              className="p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              title="Rotar derecha"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <button
              onClick={resetTransform}
              className="px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-sm transition-colors"
              title="Restablecer"
            >
              Reset
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="relative flex-1">
          <Swiper
            modules={[Navigation, Pagination]}
            navigation={{
              prevEl: '.swiper-button-prev',
              nextEl: '.swiper-button-next',
            }}
            pagination={{ 
              clickable: true,
              dynamicBullets: true
            }}
            className="w-full h-full"
            onSlideChange={(swiper) => {
              setCurrentImageIndex(swiper.activeIndex);
              handleImageChange();
            }}
          >
            {equipment.imagenes.map((imagen, index) => (
              <SwiperSlide key={index}>
                <div 
                  className="w-full h-full flex items-center justify-center bg-gray-50 overflow-hidden"
                  style={{ cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                >
                  <img
                    src={imagen}
                    alt={`${equipment.model} - Imagen ${index + 1}`}
                    className="max-w-full max-h-full object-contain transition-transform duration-200"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg) translate(${imagePosition.x / zoom}px, ${imagePosition.y / zoom}px)`,
                      transformOrigin: 'center center'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    draggable={false}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          <button className="swiper-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200">
            <ChevronLeft className="h-6 w-6 text-gray-800" />
          </button>
          <button className="swiper-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 p-3 rounded-full shadow-lg hover:bg-white transition-all duration-200">
            <ChevronRight className="h-6 w-6 text-gray-800" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageModal;