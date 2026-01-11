import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Image, History } from 'lucide-react';

const Scan: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col min-h-screen bg-black text-white overflow-hidden">
            <header className="p-4 flex items-center justify-between absolute top-0 left-0 right-0 z-20">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
                    <X size={24} />
                </button>
                <span className="text-sm font-bold uppercase tracking-widest text-white/60">Scanner de Alimentos</span>
                <button className="p-2 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20">
                    <Zap size={24} />
                </button>
            </header>

            <div className="flex-1 relative flex flex-col items-center justify-center p-10">
                {/* Camera simulation background */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 z-0"></div>
                <div className="absolute inset-0 bg-slate-900 border-x-4 border-primary/20 opacity-30 z-0"></div>

                {/* Scan Area */}
                <div className="relative size-72 z-10">
                    <div className="absolute top-0 left-0 size-8 border-t-4 border-l-4 border-primary rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 size-8 border-t-4 border-r-4 border-primary rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 size-8 border-b-4 border-l-4 border-primary rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 size-8 border-b-4 border-r-4 border-primary rounded-br-2xl"></div>

                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(35,213,203,0.8)] animate-scan-line"></div>
                    </div>
                </div>

                <p className="mt-10 text-center text-white/80 font-medium z-10 max-w-xs">
                    Posicione o código de barras ou o alimento dentro da moldura para escanear
                </p>
            </div>

            <div className="p-8 flex items-center justify-center gap-10 bg-black/40 backdrop-blur-xl border-t border-white/5 z-20">
                <button className="flex flex-col items-center gap-2 opacity-60">
                    <Image size={32} />
                    <span className="text-[10px] font-bold uppercase">Galeria</span>
                </button>
                <button className="size-16 rounded-full border-4 border-white/20 flex items-center justify-center p-1">
                    <div className="size-full rounded-full bg-white active:scale-90 transition"></div>
                </button>
                <button className="flex flex-col items-center gap-2 opacity-60">
                    <History size={32} />
                    <span className="text-[10px] font-bold uppercase">Recentes</span>
                </button>
            </div>

            <style>{`
        @keyframes scan-line {
          0% { transform: translateY(-144px); }
          50% { transform: translateY(144px); }
          100% { transform: translateY(-144px); }
        }
        .animate-scan-line {
          animation: scan-line 4s infinite linear;
        }
      `}</style>
        </div>
    );
};

export default Scan;
