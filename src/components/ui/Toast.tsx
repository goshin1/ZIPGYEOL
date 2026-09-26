import { AlertCircle } from 'lucide-react';

export default function Toast({ message }: { message: string | null }) {
    if (!message) return null;

    return (
        <div
            role="status"
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200"
        >
            <AlertCircle className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
            <span>{message}</span>
        </div>
    );
}
