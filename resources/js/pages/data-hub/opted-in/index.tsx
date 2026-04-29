import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboard } from '@/routes/data-hub';

interface OptedInUser {
    id: number;
    email: string;
    consented_at: string | null;
    devices_count: number;
    submissions_count: number;
    submissions_max_received_at: string | null;
}

interface PaginatedData {
    data: OptedInUser[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function OptedInUsersIndex({
    optedInUsers,
}: {
    optedInUsers: PaginatedData;
}) {
    return (
        <>
            <Head title="Opted-in Users" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <Heading
                    title="Opted-in Users"
                    description="Contributors actively sharing telemetry and device data"
                />

                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Opt-ins
                        </CardTitle>
                        <Badge variant="outline">
                            {optedInUsers.total} total
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/40 text-xs tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-3 text-left font-semibold">
                                            User
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Devices
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Submissions
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Last Submission
                                        </th>
                                        <th className="p-3 text-left font-semibold">
                                            Consented
                                        </th>
                                        <th className="w-24 p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {optedInUsers.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-6 text-center text-muted-foreground"
                                            >
                                                No opted-in users yet.
                                            </td>
                                        </tr>
                                    )}
                                    {optedInUsers.data.map((user) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-muted/20"
                                        >
                                            <td className="p-3">
                                                <span className="font-mono text-xs">
                                                    {user.email}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {user.devices_count.toLocaleString()}
                                            </td>
                                            <td className="p-3">
                                                {user.submissions_count.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {user.submissions_max_received_at
                                                    ? new Date(
                                                          user.submissions_max_received_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="p-3 text-muted-foreground">
                                                {user.consented_at
                                                    ? new Date(
                                                          user.consented_at,
                                                      ).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="p-3">
                                                <Link
                                                    href={`/data-hub/opted-in/${user.id}`}
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>
                        {optedInUsers.total} total · page{' '}
                        {optedInUsers.current_page} of {optedInUsers.last_page}
                    </span>
                    <div className="flex gap-2">
                        {optedInUsers.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                className={`rounded-lg px-2 py-1 ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/60'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                                dangerouslySetInnerHTML={{
                                    __html: link.label,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

OptedInUsersIndex.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Opted-in Users' },
    ],
};
