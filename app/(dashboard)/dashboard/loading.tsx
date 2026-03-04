export default function DashboardLoading() {
    return (
        <div className="space-y-8 p-6 bg-background min-h-screen animate-pulse">
            {/* Header skeleton */}
            <div className="bg-card rounded-lg p-6 border border-border">
                <div className="h-8 w-48 bg-muted rounded-md mb-3" />
                <div className="h-4 w-80 bg-muted rounded-md" />
            </div>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-muted rounded-lg" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 bg-muted rounded" />
                                <div className="h-6 w-16 bg-muted rounded" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts grid skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-card rounded-lg border border-border p-6">
                        <div className="h-5 w-32 bg-muted rounded mb-4" />
                        <div className="h-[300px] bg-muted rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    );
}
