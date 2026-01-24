import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';

interface ImageCropperModalProps {
    image: string;
    onCropComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
    image,
    onCropComplete,
    onCancel,
}) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const onCropChange = (crop: { x: number; y: number }) => {
        setCrop(crop);
    };

    const onZoomChange = (zoom: number) => {
        setZoom(zoom);
    };

    const onCropAreaComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setIsProcessing(true);
            if (croppedAreaPixels) {
                const croppedImage = await getCroppedImg(image, croppedAreaPixels);
                if (croppedImage) {
                    onCropComplete(croppedImage);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl overflow-hidden flex flex-col h-[70vh]">
                <div className="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold">Ajustar Foto</h3>
                    <button
                        onClick={onCancel}
                        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="relative flex-1 bg-slate-900">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropAreaComplete}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <span>Zoom</span>
                            <span>{Math.round(zoom * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => onZoomChange(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onCancel}
                            className="flex-1 h-12 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isProcessing}
                            className="flex-1 h-12 rounded-2xl bg-primary text-black font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                            ) : (
                                'Confirmar'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
