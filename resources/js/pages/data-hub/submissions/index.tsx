import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, Clock3, Database, ShieldX } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { decodeHtmlEntities } from '@/lib/html';
import { dashboard } from '@/routes';
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
    user: { id: number; name: string; email: string } | null;
    contributor: { id: number; email: string } | null;
    device: { id: number; device_public_id: string; device_name?: string | null } | null;
}

interface PaginatedData {
    data: Submission[];
    current_page: number;
    last_page: number;
    total: number;
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

interface SubmissionStats {
    total: number;
    new: number;
    approved: number;
    rejected: number;
    malicious: number;
    today: number;
}

// Keep this in sync with table headers (including checkbox and action columns).
const TABLE_COLUMN_COUNT = 10;

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
        return 'In the future';
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

export default function SubmissionsIndex({
    submissions,
    filters,
    stats,
}: {
    submissions: PaginatedData;
    filters: Filters;
    stats: SubmissionStats;
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
            <div className="flex h-full flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <Heading
                    title="Submissions"
                    description="Moderate telemetry safely and spot trends quickly"
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <StatsCard
                        title="Total Results"
                        value={stats.total}
                        icon={<Database className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="New"
                        value={stats.new}
                        icon={<Clock3 className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Approved"
                        value={stats.approved}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Rejected"
                        value={stats.rejected}
                        icon={<ShieldX className="h-4 w-4" />}
                    />
                    <StatsCard
                        title="Malicious"
                        value={stats.malicious}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        highlight
                    />
                </div>

                <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold">
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
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
                                    <SelectTrigger className="h-9 text-xs">
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
                                    <SelectTrigger className="h-9 text-xs">
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="benign">
                                            Benign
                                        </SelectItem>
                                        <SelectItem value="malicious">
                                            Malicious
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Schema</Label>
                                <Input
                                    className="h-9 text-xs"
                                    type="number"
                                    placeholder="Any"
                                    value={localFilters.schema_version ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((f) => ({
                                            ...f,
                                            schema_version:
                                                e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Package</Label>
                                <Input
                                    className="h-9 text-xs"
                                    placeholder="com.example.app"
                                    value={localFilters.package_name ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((f) => ({
                                            ...f,
                                            package_name:
                                                e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">From</Label>
                                <Input
                                    className="h-9 text-xs"
                                    type="date"
                                    value={localFilters.date_from ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((f) => ({
                                            ...f,
                                            date_from:
                                                e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">To</Label>
                                <Input
                                    className="h-9 text-xs"
                                    type="date"
                                    value={localFilters.date_to ?? ''}
                                    onChange={(e) =>
                                        setLocalFilters((f) => ({
                                            ...f,
                                            date_to:
                                                e.target.value || undefined,
                                        }))
                                    }
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={applyFilters}>
                                Apply Filters
                            </Button>
                            <Button size="sm" variant="outline" onClick={clearFilters}>
                                Clear
                            </Button>
                            <span className="ml-auto text-xs text-muted-foreground">
                                {stats.today.toLocaleString()} submissions received today
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3 shadow-sm">
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

                <Card className="overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40">
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
                                    <th className="p-3 text-left font-medium">Package</th>
                                    <th className="p-3 text-left font-medium">Label</th>
                                    <th className="p-3 text-left font-medium">Status</th>
                                    <th className="p-3 text-left font-medium">Schema</th>
                                    <th className="p-3 text-left font-medium">SHA256</th>
                                    <th className="p-3 text-left font-medium">Device</th>
                                    <th className="p-3 text-left font-medium">Submitter</th>
                                    <th className="p-3 text-left font-medium">Received</th>
                                    <th className="w-20 p-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y bg-white">
                                {submissions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={TABLE_COLUMN_COUNT}
                                            className="p-8 text-center text-muted-foreground"
                                        >
                                            No submissions found.
                                        </td>
                                    </tr>
                                )}
                                {submissions.data.map((s) => (
                                    <tr key={s.id} className="hover:bg-muted/20">
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
                                        <td className="p-3">{labelBadge(s.label)}</td>
                                        <td className="p-3">{statusBadge(s.status)}</td>
                                        <td className="p-3">v{s.schema_version}</td>
                                        <td className="p-3">
                                            <span className="font-mono text-xs">
                                                {s.apk_sha256.slice(0, 12)}…
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs font-mono">
                                            {s.device?.device_public_id ?? '—'}
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground">
                                            {s.user?.email ??
                                                s.contributor?.email ??
                                                'Unknown submitter'}
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
                </Card>

                <div className="flex flex-col justify-between gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
                    <span>
                        {submissions.total} total · page {submissions.current_page} of{' '}
                        {submissions.last_page}
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {submissions.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`rounded border px-2 py-1 ${link.active ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:bg-muted'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
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

function StatsCard({
    title,
    value,
    icon,
    highlight = false,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    highlight?: boolean;
}) {
    return (
        <Card
            className={`shadow-sm ${highlight ? 'border-rose-200 bg-rose-50/50' : ''}`}
        >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
            </CardContent>
        </Card>
    );
}

SubmissionsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: dashboard() },
        { title: 'Submissions', href: index() },
    ],
};
