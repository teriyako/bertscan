import { Head } from '@inertiajs/react';
import { Database, FileDown, Filter, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';

interface Stats {
    total_submissions: number;
    pending_submissions: number;
    approved_submissions: number;
    rejected_submissions: number;
    total_exports: number;
    opted_in_users: number;
}

export default function DataHubDashboard({ stats }: { stats: Stats }) {
    return (
        <>
            <Head title="Data Hub" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Data Hub"
                    description="Telemetry ingestion and dataset management"
                />

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Submissions
                            </CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_submissions.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.pending_submissions} pending review
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Approved
                            </CardTitle>
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.approved_submissions.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.rejected_submissions} rejected
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Dataset Exports
                            </CardTitle>
                            <FileDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_exports.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total generated exports
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Opted-in Users
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.opted_in_users.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Data sharing enabled
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

DataHubDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Data Hub',
            href: dashboard(),
        },
    ],
};
