import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';

interface Contributor {
    id: number;
    email: string;
    consented_at: string | null;
    consent_version: string | null;
    wifi_only_upload: boolean | null;
    devices_count: number;
    submissions_count: number;
    submissions_max_received_at: string | null;
}

interface Device {
    id: number;
    device_public_id: string;
    device_name: string | null;
    platform: string | null;
    os_version: string | null;
    created_at: string;
    submissions_count: number;
    submissions_max_received_at: string | null;
}

export default function OptedInUsersShow({
    contributor,
    devices,
}: {
    contributor: Contributor;
    devices: Device[];
}) {
    return (
        <>
            <Head title={`Opted-in User #${contributor.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Heading
                        title={contributor.email}
                        description="Opted-in contributor and device activity"
                    />
                    <Button asChild variant="outline" size="sm">
                        <Link href="/data-hub/opted-in">Back to users</Link>
                    </Button>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">User</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <InfoRow label="Email">
                                <span className="font-mono text-xs">
                                    {contributor.email}
                                </span>
                            </InfoRow>
                            <InfoRow label="Consented">
                                {contributor.consented_at
                                    ? new Date(
                                          contributor.consented_at,
                                      ).toLocaleString()
                                    : '—'}
                            </InfoRow>
                            <InfoRow label="Consent Version">
                                {contributor.consent_version ?? '—'}
                            </InfoRow>
                            <InfoRow label="WiFi only">
                                <Badge
                                    variant={
                                        contributor.wifi_only_upload
                                            ? 'default'
                                            : 'outline'
                                    }
                                >
                                    {contributor.wifi_only_upload
                                        ? 'Enabled'
                                        : 'No'}
                                </Badge>
                            </InfoRow>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Activity Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-3">
                            <SummaryTile
                                label="Devices"
                                value={contributor.devices_count.toLocaleString()}
                            />
                            <SummaryTile
                                label="Submissions"
                                value={contributor.submissions_count.toLocaleString()}
                            />
                            <SummaryTile
                                label="Last Submission"
                                value={
                                    contributor.submissions_max_received_at
                                        ? new Date(
                                              contributor.submissions_max_received_at,
                                          ).toLocaleDateString()
                                        : '—'
                                }
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Devices
                        </CardTitle>
                        <Badge variant="outline">{devices.length} total</Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">
                                            Device
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Platform
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            OS
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Submissions
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Last Seen
                                        </th>
                                        <th className="w-24 p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {devices.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-6 text-center text-muted-foreground"
                                            >
                                                No devices found for this user.
                                            </td>
                                        </tr>
                                    )}
                                    {devices.map((device) => (
                                        <tr
                                            key={device.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="p-3">
                                                <div className="space-y-1">
                                                    <div className="font-medium text-foreground">
                                                        {device.device_name ??
                                                            'Unnamed device'}
                                                    </div>
                                                    <div className="font-mono text-xs text-muted-foreground">
                                                        {
                                                            device.device_public_id
                                                        }
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {device.platform ?? '—'}
                                            </td>
                                            <td className="p-3">
                                                {device.os_version ?? '—'}
                                            </td>
                                            <td className="p-3">
                                                {device.submissions_count.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {device.submissions_max_received_at
                                                    ? new Date(
                                                          device.submissions_max_received_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="p-3">
                                                <Link
                                                    href={`/data-hub/devices/${device.id}`}
                                                    className="text-xs font-medium text-primary hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
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

OptedInUsersShow.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Opted-in Users', href: '/data-hub/opted-in' },
        { title: 'Detail' },
    ],
};
