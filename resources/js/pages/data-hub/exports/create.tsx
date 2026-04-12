import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
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
import { create as createRoute, index, store } from '@/routes/data-hub/exports';

interface PreviewResult {
    count: number;
}

export default function ExportsCreate() {
    const [form, setForm] = useState({
        name: '',
        schema_version: '',
        label: 'all',
        date_from: '',
        date_to: '',
        approved_only: true,
        unique_by_hash: true,
    });
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchPreview = async () => {
        if (!form.schema_version) {
            return;
        }

        setPreviewLoading(true);

        try {
            const params = new URLSearchParams();
            params.set('schema_version', form.schema_version);

            if (form.label !== 'all') {
                params.set('label', form.label);
            }

            if (form.date_from) {
                params.set('date_from', form.date_from);
            }

            if (form.date_to) {
                params.set('date_to', form.date_to);
            }

            params.set('approved_only', form.approved_only ? '1' : '0');
            params.set('unique_by_hash', form.unique_by_hash ? '1' : '0');

            const res = await fetch(
                `/data-hub/exports/preview?${params.toString()}`,
                {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    credentials: 'same-origin',
                },
            );

            if (res.ok) {
                const data = await res.json();
                setPreview(data);
            }
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        router.post(
            store.url(),
            {
                name: form.name || undefined,
                schema_version: form.schema_version,
                label: form.label === 'all' ? undefined : form.label,
                date_from: form.date_from || undefined,
                date_to: form.date_to || undefined,
                approved_only: form.approved_only,
                unique_by_hash: form.unique_by_hash,
            },
            {
                onError: (errs) => {
                    setErrors(errs);
                    setSubmitting(false);
                },
                onSuccess: () => setSubmitting(false),
            },
        );
    };

    return (
        <>
            <Head title="Create Export" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Heading
                    title="Create Dataset Export"
                    description="Generate a curated CSV dataset from approved submissions"
                />

                <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
                    <div className="space-y-1">
                        <Label htmlFor="name">Export Name (optional)</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Q2 Training Set"
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                        />
                        {errors.name && (
                            <p className="text-xs text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="schema_version">Schema Version *</Label>
                        <Input
                            id="schema_version"
                            type="number"
                            required
                            min={1}
                            placeholder="e.g. 1"
                            value={form.schema_version}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    schema_version: e.target.value,
                                }))
                            }
                        />
                        {errors.schema_version && (
                            <p className="text-xs text-destructive">
                                {errors.schema_version}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Label Filter</Label>
                        <Select
                            value={form.label}
                            onValueChange={(v) =>
                                setForm((f) => ({ ...f, label: v }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All labels" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="benign">
                                    Benign only
                                </SelectItem>
                                <SelectItem value="malicious">
                                    Malicious only
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.label && (
                            <p className="text-xs text-destructive">
                                {errors.label}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label htmlFor="date_from">Date From</Label>
                            <Input
                                id="date_from"
                                type="date"
                                value={form.date_from}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        date_from: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="date_to">Date To</Label>
                            <Input
                                id="date_to"
                                type="date"
                                value={form.date_to}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        date_to: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.approved_only}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        approved_only: e.target.checked,
                                    }))
                                }
                                className="rounded"
                            />
                            Approved submissions only (recommended)
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.unique_by_hash}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        unique_by_hash: e.target.checked,
                                    }))
                                }
                                className="rounded"
                            />
                            Unique by APK hash (deduplicate)
                        </label>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={fetchPreview}
                            disabled={!form.schema_version || previewLoading}
                        >
                            {previewLoading ? 'Loading…' : 'Preview Count'}
                        </Button>
                        {preview !== null && (
                            <span className="text-sm text-muted-foreground">
                                ~{preview.count.toLocaleString()} rows would be
                                exported
                            </span>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="submit"
                            disabled={submitting || !form.schema_version}
                        >
                            {submitting ? 'Creating…' : 'Create Export'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.get(index.url())}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ExportsCreate.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Exports', href: index() },
        { title: 'Create', href: createRoute() },
    ],
};
