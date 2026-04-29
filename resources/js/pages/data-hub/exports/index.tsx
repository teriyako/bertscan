import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';
import { create, download, index, show } from '@/routes/data-hub/exports';

interface DatasetExport {
    id: number;
    name: string | null;
    status: string;
    row_count: number;
    benign_count: number;
    malicious_count: number;
    filters: Record<string, unknown>;
    export_path: string | null;
    created_at: string;
    creator: { id: number; name: string } | null;
}

interface PaginatedData {
    data: DatasetExport[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function ExportsIndex({
    exports: data,
}: {
    exports: PaginatedData;
}) {
    return (
        <>
            <Head title="Dataset Exports" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title="Dataset Exports"
                        description="Generated CSV dataset files for model retraining"
                    />
                    <Button asChild>
                        <Link href={create().url}>New Export</Link>
                    </Button>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Recent Exports
                        </CardTitle>
                        <Badge variant="outline">{data.total} total</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">
                                            Name / ID
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Rows
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Benign
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Malicious
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Schema
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Created By
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Date
                                        </th>
                                        <th className="w-20 p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={8}
                                                className="p-6 text-center text-muted-foreground"
                                            >
                                                No exports yet.{' '}
                                                <Link
                                                    href={create().url}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Create one
                                                </Link>
                                                .
                                            </td>
                                        </tr>
                                    )}
                                    {data.data.map((exp) => (
                                        <tr
                                            key={exp.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="p-3">
                                                <Link
                                                    href={show(exp.id).url}
                                                    className="font-medium hover:underline"
                                                >
                                                    {exp.name ??
                                                        `Export #${exp.id}`}
                                                </Link>
                                            </td>
                                            <td className="p-3">
                                                {exp.row_count.toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                {exp.benign_count.toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                {exp.malicious_count.toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                {(
                                                    exp.filters as {
                                                        schema_version?: number;
                                                    }
                                                ).schema_version
                                                    ? `v${(exp.filters as { schema_version?: number }).schema_version}`
                                                    : '—'}
                                            </td>
                                            <td className="p-3">
                                                {exp.creator?.name ?? '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(
                                                    exp.created_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Link
                                                            href={
                                                                show(exp.id).url
                                                            }
                                                        >
                                                            View
                                                        </Link>
                                                    </Button>
                                                    {exp.status ===
                                                        'completed' && (
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            <a
                                                                href={
                                                                    download(
                                                                        exp.id,
                                                                    ).url
                                                                }
                                                            >
                                                                CSV
                                                            </a>
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>{data.total} total exports</span>
                    <div className="flex gap-2">
                        {data.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`rounded-lg px-2 py-1 ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

ExportsIndex.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Exports', href: index() },
    ],
};
