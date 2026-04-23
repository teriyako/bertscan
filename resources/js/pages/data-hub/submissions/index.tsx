import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { dashboard } from '@/routes/data-hub';
import {
    bulkApprove,
    bulkReject,
    index,
    show,
} from '@/routes/data-hub/submissions';

interface Submission {
    id: number;
    label: string;
    status: string;
    schema_version: number;
    package_name: string;
    apk_sha256: string;
    received_at: string;
    score: number | null;
    submission_count: number;
    device_count: number;
    contributor_count: number;
    user: { id: number; name: string; email: string } | null;
    contributor: { id: number; email: string } | null;
    device: { id: number; device_public_id: string; device_name?: string | null } | null;
}

interface PaginatedData {
    data: Submission[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Filters {
    status?: string;
    label?: string;
    schema_version?: string;
    package_name?: string;
    date_from?: string;
    date_to?: string;
}

// checkbox + package + label + status + schema + sha256 + device + sources + count + received + action
const TABLE_COLUMN_COUNT = 11;

function statusBadge(status: string) {
    const variants: Record<
        string,
        'default' | 'secondary' | 'destructive' | 'outline'
    > = {
        new: 'secondary',
        approved: 'default',
        rejected: 'destructive',
    };

    return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>;
}

function labelBadge(label: string) {
    return (
        <Badge
            variant={label === 'malicious' ? 'destructive' : 'outline'}
            className="capitalize"
        >
            {label}
        </Badge>
    );
}

function formatRelativeSameDay(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs <= 0) {
        return 'Just now';
    }

    const minutes = Math.floor(diffMs / (1000 * 60));

    if (minutes <= 0) {
        return 'Just now';
    }

    if (minutes < 60) {
        return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);

    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
}

function formatReceived(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const isSameDay =
        date.getUTCFullYear() === now.getUTCFullYear() &&
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCDate() === now.getUTCDate();

    if (isSameDay) {
        return formatRelativeSameDay(timestamp);
    }

    return date.toLocaleString();
}

function decodeHtmlEntities(text: string): string {
    if (typeof window === 'undefined') {
        return text;
    }

    const document = new DOMParser().parseFromString(text, 'text/html');

    return document.documentElement.textContent ?? text;
}

export default function SubmissionsIndex({
    submissions,
    filters,
}: {
    submissions: PaginatedData;
    filters: Filters;
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [localFilters, setLocalFilters] = useState<Filters>(filters);

    const toggleSelect = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };

    const toggleAll = () => {
        if (selected.length === submissions.data.length) {
            setSelected([]);
        } else {
            setSelected(submissions.data.map((s) => s.id));
        }
    };

    const applyFilters = () => {
        const params: Record<string, string> = {};

        for (const [k, v] of Object.entries(localFilters)) {
            if (v) {
                params[k] = v;
            }
        }

        router.get(index.url(), params);
    };

    const clearFilters = () => {
        setLocalFilters({});
        router.get(index.url());
    };

    const handleBulkApprove = () => {
        if (selected.length === 0) {
            return;
        }

        router.post(
            bulkApprove.url(),
            { ids: selected },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );
    };

    const handleBulkReject = () => {
        if (selected.length === 0) {
            return;
        }

        router.post(
            bulkReject.url(),
            { ids: selected },
            { preserveScroll: true, onSuccess: () => setSelected([]) },
        );
    };

    return (
        <>
            <Head title="Submissions" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Submissions"
                    description="Review and moderate telemetry submissions"
                />

                {/* Filters */}
                <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 md:grid-cols-3 lg:grid-cols-6">
                    <div className="space-y-1">
                        <Label className="text-xs">Status</Label>
                        <Select
                            value={localFilters.status ?? 'all'}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    status: v === 'all' ? undefined : v,
                                }))
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="approved">
                                    Approved
                                </SelectItem>
                                <SelectItem value="rejected">
                                    Rejected
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Select
                            value={localFilters.label ?? 'all'}
                            onValueChange={(v) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    label: v === 'all' ? undefined : v,
                                }))
                            }
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="benign">Benign</SelectItem>
                                <SelectItem value="malicious">
                                    Malicious
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Schema Version</Label>
                        <Input
                            className="h-8 text-xs"
                            type="number"
                            placeholder="Any"
                            value={localFilters.schema_version ?? ''}
                            onChange={(e) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    schema_version: e.target.value || undefined,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Package</Label>
                        <Input
                            className="h-8 text-xs"
                            placeholder="Search..."
                            value={localFilters.package_name ?? ''}
                            onChange={(e) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    package_name: e.target.value || undefined,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">From</Label>
                        <Input
                            className="h-8 text-xs"
                            type="date"
                            value={localFilters.date_from ?? ''}
                            onChange={(e) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    date_from: e.target.value || undefined,
                                }))
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">To</Label>
                        <Input
                            className="h-8 text-xs"
                            type="date"
                            value={localFilters.date_to ?? ''}
                            onChange={(e) =>
                                setLocalFilters((f) => ({
                                    ...f,
                                    date_to: e.target.value || undefined,
                                }))
                            }
                        />
                    </div>
                    <div className="col-span-full flex gap-2">
                        <Button size="sm" onClick={applyFilters}>
                            Apply Filters
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={clearFilters}
                        >
                            Clear
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selected.length > 0 && (
                    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
                        <span className="text-sm font-medium">
                            {selected.length} selected
                        </span>
                        <Button size="sm" onClick={handleBulkApprove}>
                            Approve Selected
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleBulkReject}
                        >
                            Reject Selected
                        </Button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="w-10 p-3">
                                    <Checkbox
                                        checked={
                                            selected.length ===
                                                submissions.data.length &&
                                            submissions.data.length > 0
                                        }
                                        onCheckedChange={toggleAll}
                                    />
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Package
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Label
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Status
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Schema
                                </th>
                                <th className="p-3 text-left font-medium">
                                    SHA256
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Device
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Sources
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Count
                                </th>
                                <th className="p-3 text-left font-medium">
                                    Received
                                </th>
                                <th className="w-16 p-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {submissions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={TABLE_COLUMN_COUNT}
                                        className="p-6 text-center text-muted-foreground"
                                    >
                                        No submissions found.
                                    </td>
                                </tr>
                            )}
                            {submissions.data.map((s) => (
                                <tr key={s.id} className="hover:bg-muted/30">
                                    <td className="p-3">
                                        <Checkbox
                                            checked={selected.includes(s.id)}
                                            onCheckedChange={() =>
                                                toggleSelect(s.id)
                                            }
                                        />
                                    </td>
                                    <td className="p-3">
                                        <span className="font-mono text-xs">
                                            {s.package_name}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {labelBadge(s.label)}
                                    </td>
                                    <td className="p-3">
                                        {statusBadge(s.status)}
                                    </td>
                                    <td className="p-3">v{s.schema_version}</td>
                                    <td className="p-3">
                                        <span className="font-mono text-xs">
                                            {s.apk_sha256.slice(0, 12)}…
                                        </span>
                                    </td>
                                    <td className="p-3 text-xs">
                                        <div className="font-mono">
                                            {s.device?.device_public_id ?? '—'}
                                        </div>
                                    </td>
                                    <td className="p-3 text-xs text-muted-foreground">
                                        {s.user?.email ??
                                            s.contributor?.email ??
                                            'Unknown submitter'}
                                        <div>
                                            {s.device_count} device(s) ·{' '}
                                            {s.contributor_count} contributor(s)
                                        </div>
                                    </td>
                                    <td className="p-3 font-medium">
                                        {s.submission_count}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {formatReceived(s.received_at)}
                                    </td>
                                    <td className="p-3">
                                        <Link
                                            href={show(s.id).url}
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        {submissions.total} total · page{' '}
                        {submissions.current_page} of {submissions.last_page}
                    </span>
                    <div className="flex gap-2">
                        {submissions.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`rounded px-2 py-1 ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            >
                                {decodeHtmlEntities(link.label)}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

SubmissionsIndex.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Submissions', href: index() },
    ],
};
