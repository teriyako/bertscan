import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';
import { show as showSubmission } from '@/routes/data-hub/submissions';

interface Device {
    id: number;
    device_public_id: string;
    device_name: string | null;
    platform: string | null;
    os_version: string | null;
    created_at: string;
    contributor: { id: number; email: string } | null;
    user: { id: number; name: string; email: string } | null;
}

interface Submission {
    id: number;
    label: string;
    status: string;
    schema_version: number;
    package_name: string;
    apk_sha256: string;
    received_at: string;
    score: number | null;
}

interface PaginatedData {
    data: Submission[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

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

export default function DeviceShow({
    device,
    submissions,
}: {
    device: Device;
    submissions: PaginatedData;
}) {
    return (
        <>
            <Head title={`Device ${device.device_public_id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title={device.device_name ?? device.device_public_id}
                        description="Device details and submission history"
                    />
                    <Button asChild variant="outline" size="sm">
                        <Link href="/data-hub/opted-in">Back to users</Link>
                    </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Device</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <InfoRow label="Public ID">
                                <span className="font-mono text-xs">
                                    {device.device_public_id}
                                </span>
                            </InfoRow>
                            <InfoRow label="Name">
                                {device.device_name ?? '—'}
                            </InfoRow>
                            <InfoRow label="Platform">
                                {device.platform ?? '—'}
                            </InfoRow>
                            <InfoRow label="OS Version">
                                {device.os_version ?? '—'}
                            </InfoRow>
                            <InfoRow label="Registered">
                                {new Date(device.created_at).toLocaleString()}
                            </InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Owner</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <InfoRow label="Contributor">
                                {device.contributor ? (
                                    <span className="font-mono text-xs">
                                        {device.contributor.email}
                                    </span>
                                ) : (
                                    '—'
                                )}
                            </InfoRow>
                            <InfoRow label="User">
                                {device.user
                                    ? `${device.user.name} (${device.user.email})`
                                    : '—'}
                            </InfoRow>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <InfoRow label="Submissions">
                                {submissions.total.toLocaleString()}
                            </InfoRow>
                            <InfoRow label="Latest">
                                {submissions.data[0]?.received_at
                                    ? new Date(
                                          submissions.data[0].received_at,
                                      ).toLocaleDateString()
                                    : '—'}
                            </InfoRow>
                        </CardContent>
                    </Card>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Submissions
                        </CardTitle>
                        <Badge variant="outline">
                            {submissions.total} total
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
                                    <tr>
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
                                            Score
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
                                                colSpan={7}
                                                className="p-6 text-center text-muted-foreground"
                                            >
                                                No submissions for this device.
                                            </td>
                                        </tr>
                                    )}
                                    {submissions.data.map((submission) => (
                                        <tr
                                            key={submission.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="p-3">
                                                <span className="font-mono text-xs">
                                                    {submission.package_name}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {labelBadge(submission.label)}
                                            </td>
                                            <td className="p-3">
                                                {statusBadge(submission.status)}
                                            </td>
                                            <td className="p-3">
                                                v{submission.schema_version}
                                            </td>
                                            <td className="p-3">
                                                {submission.score !== null
                                                    ? submission.score.toFixed(
                                                          4,
                                                      )
                                                    : '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {new Date(
                                                    submission.received_at,
                                                ).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    asChild
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    <Link
                                                        href={
                                                            showSubmission(
                                                                submission.id,
                                                            ).url
                                                        }
                                                    >
                                                        View
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

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

function InfoRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {label}
            </span>
            <span className="text-right text-sm text-foreground">
                {children}
            </span>
        </div>
    );
}

DeviceShow.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Opted-in Users', href: '/data-hub/opted-in' },
        { title: 'Device Detail' },
    ],
};
