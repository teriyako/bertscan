import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';
import { download, index } from '@/routes/data-hub/exports';

interface ExportFilters {
    schema_version?: number;
    label?: string;
    date_from?: string;
    date_to?: string;
    approved_only?: boolean;
    unique_by_hash?: boolean;
}

interface DatasetExport {
    id: number;
    name: string | null;
    status: string;
    row_count: number;
    benign_count: number;
    malicious_count: number;
    filters: ExportFilters;
    export_path: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    creator: { id: number; name: string } | null;
}

function statusBadge(status: string) {
    const variants: Record<
        string,
        'default' | 'secondary' | 'destructive' | 'outline'
    > = {
        pending: 'secondary',
        completed: 'default',
        failed: 'destructive',
    };

    return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
}

function BoolBadge({ value }: { value?: boolean }) {
    return value ? (
        <Badge variant="default">Yes</Badge>
    ) : (
        <Badge variant="outline">No</Badge>
    );
}

export default function ExportShow({ export: exp }: { export: DatasetExport }) {
    const filters = exp.filters;

    return (
        <>
            <Head title={`Export #${exp.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={exp.name ?? `Export #${exp.id}`}
                        description="Dataset export details"
                    />
                    {exp.status === 'completed' && (
                        <Button asChild>
                            <a href={download(exp.id).url}>Download CSV</a>
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Export Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Row label="Status">{statusBadge(exp.status)}</Row>
                            <Row label="Total Rows">
                                {exp.row_count.toLocaleString()}
                            </Row>
                            <Row label="Benign">
                                {exp.benign_count.toLocaleString()}
                            </Row>
                            <Row label="Malicious">
                                {exp.malicious_count.toLocaleString()}
                            </Row>
                            <Row label="Created By">
                                {exp.creator?.name ?? '—'}
                            </Row>
                            <Row label="Created">
                                {new Date(exp.created_at).toLocaleString()}
                            </Row>
                            {exp.error_message && (
                                <div className="rounded bg-destructive/10 p-2 text-xs text-destructive">
                                    {exp.error_message}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Filters Used
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Row label="Schema Version">
                                {filters.schema_version
                                    ? `v${filters.schema_version}`
                                    : '—'}
                            </Row>
                            <Row label="Label">
                                {filters.label ? (
                                    <span className="capitalize">
                                        {filters.label}
                                    </span>
                                ) : (
                                    'All'
                                )}
                            </Row>
                            <Row label="Date From">
                                {filters.date_from ?? '—'}
                            </Row>
                            <Row label="Date To">{filters.date_to ?? '—'}</Row>
                            <Row label="Approved Only">
                                <BoolBadge value={filters.approved_only} />
                            </Row>
                            <Row label="Unique by Hash">
                                <BoolBadge value={filters.unique_by_hash} />
                            </Row>
                        </CardContent>
                    </Card>
                </div>

                {exp.status === 'completed' && (
                    <div className="flex gap-3">
                        <Button asChild>
                            <a href={download(exp.id).url}>Download CSV</a>
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    );
}

ExportShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Exports', href: index() },
        { title: 'Detail' },
    ],
};
