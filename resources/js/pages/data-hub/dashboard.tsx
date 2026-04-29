import { Head, Link } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Database, FileDown, ShieldCheck, Users } from 'lucide-react';
import Heading from '@/components/heading';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';
import { index as exportsIndex } from '@/routes/data-hub/exports';
import { index as submissionsIndex } from '@/routes/data-hub/submissions';

interface Stats {
    total_submissions: number;
    pending_submissions: number;
    approved_submissions: number;
    rejected_submissions: number;
    total_exports: number;
    opted_in_users: number;
}

interface Charts {
    window_days: number;
    submissions_over_time: {
        date: string;
        total: number;
        approved: number;
        rejected: number;
        pending: number;
    }[];
    status_breakdown: { status: string; total: number }[];
    label_breakdown: { label: string; total: number }[];
    opted_in_devices_over_time: { date: string; total: number }[];
    top_malicious_packages: { package_name: string; total: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    approved: 'var(--chart-1)',
    rejected: 'var(--chart-5)',
    new: 'var(--chart-4)',
    pending: 'var(--chart-4)',
};

const LABEL_COLORS: Record<string, string> = {
    benign: 'var(--chart-2)',
    malicious: 'var(--chart-5)',
};

const STAT_ACCENTS = [
    'text-[color:var(--chart-1)]',
    'text-[color:var(--chart-4)]',
    'text-[color:var(--chart-3)]',
    'text-[color:var(--chart-2)]',
];

const formatChartDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });

const formatStatus = (status: string) =>
    status === 'new'
        ? 'Pending'
        : status.charAt(0).toUpperCase() + status.slice(1);

export default function DataHubDashboard({
    stats,
    charts,
}: {
    stats: Stats;
    charts: Charts;
}) {
    const totalStatus = charts.status_breakdown.reduce(
        (sum, item) => sum + item.total,
        0,
    );

    const totalLabels = charts.label_breakdown.reduce(
        (sum, item) => sum + item.total,
        0,
    );
    const totalOptedInDevices = charts.opted_in_devices_over_time.reduce(
        (sum, item) => sum + item.total,
        0,
    );
    const maxMaliciousTotal = Math.max(
        ...charts.top_malicious_packages.map((item) => item.total),
        0,
    );

    return (
        <>
            <Head title="Data Hub" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <Heading
                        title="Data Hub"
                        description="Telemetry ingestion, approvals, and dataset readiness"
                    />
                    <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm">
                            <Link href={submissionsIndex().url}>
                                Review Queue
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                            <Link href={exportsIndex().url}>Exports</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Submissions"
                        value={stats.total_submissions.toLocaleString()}
                        icon={Database}
                        hint={`${stats.pending_submissions.toLocaleString()} pending review`}
                        accent={STAT_ACCENTS[0]}
                    />
                    <StatCard
                        title="Approved"
                        value={stats.approved_submissions.toLocaleString()}
                        icon={ShieldCheck}
                        hint={`${stats.rejected_submissions.toLocaleString()} rejected`}
                        accent={STAT_ACCENTS[1]}
                    />
                    <StatCard
                        title="Dataset Exports"
                        value={stats.total_exports.toLocaleString()}
                        icon={FileDown}
                        hint="Exports generated"
                        accent={STAT_ACCENTS[2]}
                    />
                    <StatCard
                        title="Opted-in Users"
                        value={stats.opted_in_users.toLocaleString()}
                        icon={Users}
                        hint="Sharing enabled"
                        accent={STAT_ACCENTS[3]}
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    Submissions Over Time
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Last {charts.window_days} days -{' '}
                                    {charts.submissions_over_time.length} points
                                </p>
                            </div>
                            <Badge variant="outline">Daily</Badge>
                        </CardHeader>
                        <CardContent className="h-[280px] pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={charts.submissions_over_time}
                                    margin={{ left: 4, right: 12 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="areaApproved"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0.45}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--chart-1)"
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="areaPending"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--chart-4)"
                                                stopOpacity={0.4}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--chart-4)"
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="areaRejected"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--chart-5)"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--chart-5)"
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="4 8"
                                        stroke="var(--border)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatChartDate}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={28}
                                    />
                                    <Tooltip
                                        cursor={{
                                            stroke: 'var(--border)',
                                            strokeDasharray: '4 4',
                                        }}
                                        contentStyle={chartTooltipStyle}
                                        labelStyle={chartTooltipLabelStyle}
                                        itemStyle={chartTooltipItemStyle}
                                        formatter={(value) => [
                                            Number(value).toLocaleString(),
                                            '',
                                        ]}
                                        labelFormatter={formatChartDate}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="approved"
                                        stackId="1"
                                        stroke="var(--chart-1)"
                                        fill="url(#areaApproved)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="pending"
                                        stackId="1"
                                        stroke="var(--chart-4)"
                                        fill="url(#areaPending)"
                                        strokeWidth={2}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="rejected"
                                        stackId="1"
                                        stroke="var(--chart-5)"
                                        fill="url(#areaRejected)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    Status Mix
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {totalStatus.toLocaleString()} total
                                    submissions
                                </p>
                            </div>
                            <Badge variant="outline">All time</Badge>
                        </CardHeader>
                        <CardContent className="h-[280px] pt-2">
                            <div className="flex h-full flex-col gap-4">
                                <div className="min-h-[160px] flex-1">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Tooltip
                                                contentStyle={chartTooltipStyle}
                                                labelStyle={
                                                    chartTooltipLabelStyle
                                                }
                                                itemStyle={
                                                    chartTooltipItemStyle
                                                }
                                                formatter={(value, name) => [
                                                    Number(
                                                        value,
                                                    ).toLocaleString(),
                                                    name,
                                                ]}
                                            />
                                            <Pie
                                                data={charts.status_breakdown.map(
                                                    (item) => ({
                                                        name: formatStatus(
                                                            item.status,
                                                        ),
                                                        value: item.total,
                                                        status: item.status,
                                                    }),
                                                )}
                                                dataKey="value"
                                                nameKey="name"
                                                innerRadius={60}
                                                outerRadius={90}
                                                paddingAngle={4}
                                                stroke="var(--background)"
                                            >
                                                {charts.status_breakdown.map(
                                                    (item) => (
                                                        <Cell
                                                            key={item.status}
                                                            fill={
                                                                STATUS_COLORS[
                                                                    item.status
                                                                ] ??
                                                                'var(--chart-3)'
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    {charts.status_breakdown.map((item) => (
                                        <div
                                            key={item.status}
                                            className="flex items-center gap-2"
                                        >
                                            <span
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        STATUS_COLORS[
                                                            item.status
                                                        ] ?? 'var(--chart-3)',
                                                }}
                                            />
                                            <span className="text-foreground">
                                                {formatStatus(item.status)}
                                            </span>
                                            <span className="ml-auto">
                                                {item.total.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    Label Breakdown
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {totalLabels.toLocaleString()} labeled
                                    submissions
                                </p>
                            </div>
                            <Badge variant="outline">All time</Badge>
                        </CardHeader>
                        <CardContent className="h-[260px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={charts.label_breakdown}
                                    layout="vertical"
                                    margin={{ left: 12 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="4 8"
                                        stroke="var(--border)"
                                        horizontal={false}
                                    />
                                    <XAxis
                                        type="number"
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        dataKey="label"
                                        type="category"
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={chartTooltipStyle}
                                        labelStyle={chartTooltipLabelStyle}
                                        itemStyle={chartTooltipItemStyle}
                                        cursor={chartHoverCursorStyle}
                                        formatter={(value) => [
                                            Number(value).toLocaleString(),
                                            '',
                                        ]}
                                    />
                                    <Bar dataKey="total" radius={[8, 8, 8, 8]}>
                                        {charts.label_breakdown.map((item) => (
                                            <Cell
                                                key={item.label}
                                                fill={
                                                    LABEL_COLORS[item.label] ??
                                                    'var(--chart-2)'
                                                }
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    Opted-in Devices
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    {totalOptedInDevices.toLocaleString()} new
                                    devices · last {charts.window_days} days
                                </p>
                            </div>
                            <Badge variant="outline">Daily</Badge>
                        </CardHeader>
                        <CardContent className="h-[260px] pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={charts.opted_in_devices_over_time}
                                    margin={{ left: 4, right: 12 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="areaOptedIn"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="var(--chart-3)"
                                                stopOpacity={0.35}
                                            />
                                            <stop
                                                offset="100%"
                                                stopColor="var(--chart-3)"
                                                stopOpacity={0.05}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="4 8"
                                        stroke="var(--border)"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatChartDate}
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{
                                            fontSize: 11,
                                            fill: 'var(--muted-foreground)',
                                        }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={28}
                                    />
                                    <Tooltip
                                        cursor={{
                                            stroke: 'var(--border)',
                                            strokeDasharray: '4 4',
                                        }}
                                        contentStyle={chartTooltipStyle}
                                        labelStyle={chartTooltipLabelStyle}
                                        itemStyle={chartTooltipItemStyle}
                                        formatter={(value) => [
                                            Number(value).toLocaleString(),
                                            'Devices',
                                        ]}
                                        labelFormatter={formatChartDate}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="total"
                                        stroke="var(--chart-3)"
                                        fill="url(#areaOptedIn)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div>
                                <CardTitle className="text-sm font-medium">
                                    Top Malicious Packages
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">
                                    Highest flagged packages
                                </p>
                            </div>
                            <Badge variant="outline">All time</Badge>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {charts.top_malicious_packages.length === 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    No malicious submissions yet.
                                </p>
                            ) : (
                                charts.top_malicious_packages.map((item) => (
                                    <div key={item.package_name}>
                                        <div className="flex items-center justify-between text-xs">
                                            <span
                                                className="max-w-[70%] truncate font-mono text-foreground"
                                                title={item.package_name}
                                            >
                                                {item.package_name}
                                            </span>
                                            <span className="text-muted-foreground">
                                                {item.total.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/40">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${
                                                        maxMaliciousTotal
                                                            ? (item.total /
                                                                  maxMaliciousTotal) *
                                                                  100
                                                            : 0
                                                    }%`,
                                                    backgroundColor:
                                                        'var(--chart-5)',
                                                }}
                                            />
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

function StatCard({
    title,
    value,
    icon: Icon,
    hint,
    accent,
}: {
    title: string;
    value: string;
    icon: typeof Database;
    hint: string;
    accent: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <div className="absolute top-1 right-1 h-20 w-20 rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-70 dark:from-white/10" />
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                    <CardTitle className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                        {title}
                    </CardTitle>
                    <div className="mt-3 text-2xl font-semibold text-foreground">
                        {value}
                    </div>
                </div>
                <div
                    className={cn(
                        'flex size-10 items-center justify-center rounded-2xl bg-muted/70',
                        accent,
                    )}
                >
                    <Icon className="size-4" />
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </CardContent>
        </Card>
    );
}

const chartTooltipStyle = {
    background: 'var(--card)',
    color: 'var(--card-foreground)',
    borderRadius: 12,
    border: '1px solid var(--border)',
    boxShadow: '0 16px 30px -24px rgba(15, 23, 42, 0.55)',
    padding: '8px 12px',
};

const chartTooltipLabelStyle = {
    color: 'var(--muted-foreground)',
    fontSize: 12,
};

const chartTooltipItemStyle = {
    color: 'var(--card-foreground)',
    fontSize: 12,
};

const chartHoverCursorStyle = {
    fill: 'var(--border)',
    opacity: 0.4,
};

DataHubDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Data Hub',
            href: dashboard(),
        },
    ],
};
