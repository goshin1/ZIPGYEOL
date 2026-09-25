export default function EmptyState({ message }: { message: string }) {
    return (
        <div className="h-full flex items-center justify-center text-center text-xs text-slate-400 dark:text-slate-500">
            {message}
        </div>
    );
}
