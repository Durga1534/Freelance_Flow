export default function InvoicesLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="h-10 w-36 bg-muted rounded-md" />
            </div>

            {/* Table skeleton */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                    <div className="grid grid-cols-5 gap-4">
                        {["Invoice #", "Client", "Amount", "Status", "Actions"].map((col) => (
                            <div key={col} className="h-3 bg-muted rounded" />
                        ))}
                    </div>
                </div>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="px-6 py-4 border-b border-border last:border-0">
                        <div className="grid grid-cols-5 gap-4 items-center">
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-4 bg-muted rounded" />
                            <div className="h-6 w-20 bg-muted rounded-full" />
                            <div className="h-8 w-16 bg-muted rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
