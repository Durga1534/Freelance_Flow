export default function ClientsLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Form skeleton */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="h-6 w-32 bg-muted rounded mb-4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i}>
                            <div className="h-3 w-20 bg-muted rounded mb-2" />
                            <div className="h-10 bg-muted rounded-md" />
                        </div>
                    ))}
                </div>
                <div className="h-10 w-28 bg-muted rounded-md mt-4" />
            </div>

            {/* Table skeleton */}
            <div className="bg-card border border-border rounded-xl p-6">
                <div className="h-6 w-24 bg-muted rounded mb-4" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="h-10 flex-1 bg-muted rounded" />
                            <div className="h-10 flex-1 bg-muted rounded" />
                            <div className="h-10 flex-1 bg-muted rounded" />
                            <div className="h-10 w-24 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
