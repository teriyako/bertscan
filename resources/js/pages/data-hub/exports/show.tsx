import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';
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
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Export Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <SummaryTile
                                    label="Total Rows"
                                    value={exp.row_count.toLocaleString()}
                                />
                                <SummaryTile
                                    label="Benign"
                                    value={exp.benign_count.toLocaleString()}
                                />
                                <SummaryTile
                                    label="Malicious"
                                    value={exp.malicious_count.toLocaleString()}
                                />
                            </div>
                            <div className="grid gap-3 text-sm sm:grid-cols-2">
                                <DetailItem label="Created By">
                                    {exp.creator?.name ?? '—'}
                                </DetailItem>
                                <DetailItem label="Created">
                                    {new Date(exp.created_at).toLocaleString()}
                                </DetailItem>
                                <DetailItem label="Last Updated">
                                    {new Date(exp.updated_at).toLocaleString()}
                                </DetailItem>
                            </div>
                            {exp.error_message && (
                                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
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
                        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                            <DetailItem label="Schema Version">
                                {filters.schema_version
                                    ? `v${filters.schema_version}`
                                    : '—'}
                            </DetailItem>
                            <DetailItem label="Label">
                                {filters.label ? (
                                    <span className="capitalize">
                                        {filters.label}
                                    </span>
                                ) : (
                                    'All'
                                )}
                            </DetailItem>
                            <DetailItem label="Date From">
                                {filters.date_from ?? '—'}
                            </DetailItem>
                            <DetailItem label="Date To">
                                {filters.date_to ?? '—'}
                            </DetailItem>
                            <DetailItem label="Approved Only">
                                <BoolBadge value={filters.approved_only} />
                            </DetailItem>
                            <DetailItem label="Unique by Hash">
                                <BoolBadge value={filters.unique_by_hash} />
                            </DetailItem>
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

function SummaryTile({
    label,
    value,
}: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">
                {value}
            </div>
        </div>
    );
}

function DetailItem({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                {label}
            </div>
            <div className="mt-2 text-sm text-foreground">{children}</div>
        </div>
    );
}

ExportShow.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Exports', href: index() },
        { title: 'Detail' },
    ],
};
