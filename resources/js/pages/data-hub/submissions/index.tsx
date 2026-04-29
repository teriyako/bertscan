import { Head, Link, router } from '@inertiajs/react';
import { Search, SlidersHorizontal } from 'lucide-react';
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
    user: { id: number; name: string; email: string } | null;
    device: { id: number; device_public_id: string } | null;
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
    score_min?: string;
    score_max?: string;
    apk_sha256?: string;
    device_public_id?: string;
}

const advancedFilterKeys: (keyof Filters)[] = [
    'schema_version',
    'score_min',
    'score_max',
    'apk_sha256',
    'device_public_id',
];

const countAdvancedFilters = (filters: Filters) =>
    advancedFilterKeys.reduce((count, key) => {
        const value = filters[key];

        return value !== undefined && value !== '' ? count + 1 : count;
    }, 0);

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

export default function SubmissionsIndex({
    submissions,
    filters,
}: {
    submissions: PaginatedData;
    filters: Filters;
}) {
    const [selected, setSelected] = useState<number[]>([]);
    const [localFilters, setLocalFilters] = useState<Filters>(filters);
    const [showAdvanced, setShowAdvanced] = useState(
        () => countAdvancedFilters(filters) > 0,
    );
    const advancedCount = countAdvancedFilters(localFilters);

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
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <Heading
                    title="Submissions"
                    description="Review and moderate telemetry submissions"
                />

                {/* Filters */}
                <Card>
                    <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle className="text-sm font-medium">
                                Filters
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Refine by status, label, package, and date
                                range.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
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
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowAdvanced((prev) => !prev)}
                            >
                                <SlidersHorizontal className="mr-2 size-4" />
                                {showAdvanced ? 'Hide filters' : 'More filters'}
                                {!showAdvanced && advancedCount > 0 && (
                                    <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                                        {advancedCount}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                            <div className="w-full space-y-1">
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
                                    <SelectTrigger size="sm" className="w-full">
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
                                    <SelectTrigger size="sm" className="w-full">
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
                                <Label className="text-xs">Package</Label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        className="h-9 pl-9 text-xs"
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

                        {showAdvanced && (
                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                    <div className="space-y-1">
                                        <Label className="text-xs">
                                            Schema Version
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            type="number"
                                            placeholder="Any"
                                            value={
                                                localFilters.schema_version ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                setLocalFilters((f) => ({
                                                    ...f,
                                                    schema_version:
                                                        e.target.value ||
                                                        undefined,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">
                                            Device ID
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            placeholder="device_public_id"
                                            value={
                                                localFilters.device_public_id ??
                                                ''
                                            }
                                            onChange={(e) =>
                                                setLocalFilters((f) => ({
                                                    ...f,
                                                    device_public_id:
                                                        e.target.value ||
                                                        undefined,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">
                                            APK SHA256
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            placeholder="Starts with..."
                                            value={
                                                localFilters.apk_sha256 ?? ''
                                            }
                                            onChange={(e) =>
                                                setLocalFilters((f) => ({
                                                    ...f,
                                                    apk_sha256:
                                                        e.target.value ||
                                                        undefined,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">
                                            Score Min
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={localFilters.score_min ?? ''}
                                            onChange={(e) =>
                                                setLocalFilters((f) => ({
                                                    ...f,
                                                    score_min:
                                                        e.target.value ||
                                                        undefined,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">
                                            Score Max
                                        </Label>
                                        <Input
                                            className="h-9 text-xs"
                                            type="number"
                                            step="0.01"
                                            placeholder="1.00"
                                            value={localFilters.score_max ?? ''}
                                            onChange={(e) =>
                                                setLocalFilters((f) => ({
                                                    ...f,
                                                    score_max:
                                                        e.target.value ||
                                                        undefined,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm">
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
                <Card className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
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
                                    <th className="p-3 text-left font-semibold">
                                        Package
                                    </th>
                                    <th className="p-3 text-left font-semibold">
                                        Label
                                    </th>
                                    <th className="p-3 text-left font-semibold">
                                        Status
                                    </th>
                                    <th className="p-3 text-left font-semibold">
                                        Schema
                                    </th>
                                    <th className="p-3 text-left font-semibold">
                                        SHA256
                                    </th>
                                    <th className="p-3 text-left font-semibold">
                                        Received
                                    </th>
                                    <th className="w-16 p-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {submissions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="p-6 text-center text-muted-foreground"
                                        >
                                            No submissions found.
                                        </td>
                                    </tr>
                                )}
                                {submissions.data.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="hover:bg-muted/20"
                                    >
                                        <td className="p-3">
                                            <Checkbox
                                                checked={selected.includes(
                                                    s.id,
                                                )}
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
                                        <td className="p-3">
                                            v{s.schema_version}
                                        </td>
                                        <td className="p-3">
                                            <span className="font-mono text-xs">
                                                {s.apk_sha256.slice(0, 12)}…
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(
                                                s.received_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <Link href={show(s.id).url}>
                                                    View
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Pagination */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>
                        {submissions.total} total · page{' '}
                        {submissions.current_page} of {submissions.last_page}
                    </span>
                    <div className="flex gap-2">
                        {submissions.links.map((link, i) => (
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

SubmissionsIndex.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Submissions', href: index() },
    ],
};
