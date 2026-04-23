import { Head } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Database,
    FileDown,
    Smartphone,
} from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes';

interface Stats {
    total_submissions: number;
    pending_submissions: number;
    approved_submissions: number;
    rejected_submissions: number;
    total_exports: number;
    opted_in_users: number;
    malicious_submissions: number;
    submissions_today: number;
}

interface Charts {
    submissions_per_day: { day: string; count: number }[];
    status_breakdown: {
        new: number;
        approved: number;
        rejected: number;
    };
    label_breakdown: {
        benign: number;
        malicious: number;
    };
    top_packages: {
        package_name: string;
        count: number;
    }[];
}

function percent(part: number, total: number): number {
    if (total <= 0) {
        return 0;
    }

    return Math.round((part / total) * 100);
}

export default function DataHubDashboard({
    stats,
    charts,
}: {
    stats: Stats;
    charts: Charts;
}) {
    const maxDailyCount = Math.max(
        1,
        ...charts.submissions_per_day.map((item) => item.count),
    );
    const statusTotal =
        charts.status_breakdown.new +
        charts.status_breakdown.approved +
        charts.status_breakdown.rejected;
    const maliciousRatio = percent(
        stats.malicious_submissions,
        Math.max(1, stats.total_submissions),
    );

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <Heading
                    title="Dashboard"
                    description="Telemetry operations overview, moderation flow, and dataset health"
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <KpiCard
                        title="Total Submissions"
                        value={stats.total_submissions.toLocaleString()}
                        hint={`${stats.submissions_today.toLocaleString()} today`}
                        icon={<Database className="h-4 w-4" />}
                    />
                    <KpiCard
                        title="Pending Review"
                        value={stats.pending_submissions.toLocaleString()}
                        hint={`${percent(stats.pending_submissions, Math.max(1, stats.total_submissions))}% of all submissions`}
                        icon={<Clock3 className="h-4 w-4" />}
                    />
                    <KpiCard
                        title="Approved"
                        value={stats.approved_submissions.toLocaleString()}
                        hint={`${percent(stats.approved_submissions, Math.max(1, stats.total_submissions))}% approval coverage`}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                    />
                    <KpiCard
                        title="Exports Generated"
                        value={stats.total_exports.toLocaleString()}
                        hint={`${stats.opted_in_users.toLocaleString()} opted-in contributors`}
                        icon={<FileDown className="h-4 w-4" />}
                    />
                </div>

                <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                7-Day Submission Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 items-end gap-3 pt-4">
                                {charts.submissions_per_day.map((point) => {
                                    const height = `${Math.max(10, (point.count / maxDailyCount) * 100)}%`;

                                    return (
                                        <div
                                            key={point.day}
                                            className="flex h-48 flex-col items-center justify-end gap-2"
                                        >
                                            <div className="text-xs font-medium text-muted-foreground">
                                                {point.count}
                                            </div>
                                            <div className="flex h-36 w-full items-end">
                                                <div
                                                    className="w-full rounded-md bg-gradient-to-t from-blue-600/90 to-blue-300/80"
                                                    style={{ height }}
                                                />
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {point.day}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Moderation Snapshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StatusRow
                                label="New"
                                value={charts.status_breakdown.new}
                                percent={percent(
                                    charts.status_breakdown.new,
                                    statusTotal,
                                )}
                                tone="bg-amber-500"
                            />
                            <StatusRow
                                label="Approved"
                                value={charts.status_breakdown.approved}
                                percent={percent(
                                    charts.status_breakdown.approved,
                                    statusTotal,
                                )}
                                tone="bg-emerald-500"
                            />
                            <StatusRow
                                label="Rejected"
                                value={charts.status_breakdown.rejected}
                                percent={percent(
                                    charts.status_breakdown.rejected,
                                    statusTotal,
                                )}
                                tone="bg-rose-500"
                            />
                            <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                                Malicious ratio: <strong>{maliciousRatio}%</strong>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Label Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div
                                    className="size-24 rounded-full"
                                    style={{
                                        background: `conic-gradient(#16a34a ${percent(charts.label_breakdown.benign, Math.max(1, charts.label_breakdown.benign + charts.label_breakdown.malicious))}%, #dc2626 0)`,
                                    }}
                                />
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="border-emerald-300 bg-emerald-50 text-emerald-700"
                                        >
                                            Benign
                                        </Badge>
                                        {charts.label_breakdown.benign.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="border-rose-300 bg-rose-50 text-rose-700"
                                        >
                                            Malicious
                                        </Badge>
                                        {charts.label_breakdown.malicious.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Distribution reflects all ingested submissions.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">
                                Most Submitted Packages
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {charts.top_packages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No package data available yet.
                                </p>
                            ) : (
                                charts.top_packages.map((entry) => (
                                    <div
                                        key={entry.package_name}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="truncate pr-2 font-mono text-xs">
                                            {entry.package_name}
                                        </div>
                                        <div className="flex items-center gap-1 text-sm font-semibold">
                                            <Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
                                            {entry.count}
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function KpiCard({
    title,
    value,
    hint,
    icon,
}: {
    title: string;
    value: string;
    hint: string;
    icon: React.ReactNode;
}) {
    return (
        <Card className="border-0 bg-gradient-to-br from-white to-muted/40 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                    {icon}
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}

function StatusRow({
    label,
    value,
    percent,
    tone,
}: {
    label: string;
    value: number;
    percent: number;
    tone: string;
}) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted-foreground">
                    {value.toLocaleString()} · {percent}%
                </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
                <div
                    className={`h-2 rounded-full ${tone}`}
                    style={{ width: `${Math.max(percent, 2)}%` }}
                />
            </div>
        </div>
    );
}

DataHubDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
