import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { dashboard } from '@/routes/data-hub';
import { approve, index, reject } from '@/routes/data-hub/submissions';

interface Submission {
    id: number;
    label: string;
    status: string;
    schema_version: number;
    package_name: string;
    apk_sha256: string;
    score: number | null;
    received_at: string;
    extracted_at: string | null;
    model_version: string | null;
    app_version: string | null;
    features: Record<string, unknown> | null;
    feature_text: string | null;
    pipeline_manifest: Record<string, unknown> | null;
    rejection_reason: string | null;
    reviewed_at: string | null;
    user: { id: number; name: string; email: string } | null;
    contributor: { id: number; email: string } | null;
    device: { id: number; device_public_id: string; device_name?: string | null } | null;
    reviewer: { id: number; name: string } | null;
}

interface RelatedSubmission {
    id: number;
    status: string;
    received_at: string;
    label: string;
    user: { id: number; name: string; email: string } | null;
    contributor: { id: number; email: string } | null;
    device: { id: number; device_public_id: string; device_name?: string | null } | null;
}

interface RelatedSubmissionsPaginatedData {
    data: RelatedSubmission[];
    current_page: number;
    last_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface RelatedStats {
    submission_count: number;
    device_count: number;
    contributor_count: number;
}

function decodeHtmlEntities(text: string): string {
    if (typeof window === 'undefined') {
        return text;
    }

    const document = new DOMParser().parseFromString(text, 'text/html');

    return document.documentElement.textContent ?? text;
}

export default function SubmissionShow({
    submission,
    relatedSubmissions,
    relatedStats,
}: {
    submission: Submission;
    relatedSubmissions: RelatedSubmissionsPaginatedData;
    relatedStats: RelatedStats;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'submitters'>(
        'overview',
    );

    const handleApprove = () => {
        router.post(approve(submission.id).url, {}, { preserveScroll: true });
    };

    const handleReject = () => {
        router.post(
            reject(submission.id).url,
            { rejection_reason: reason },
            { preserveScroll: true, onSuccess: () => setRejecting(false) },
        );
    };

    return (
        <>
            <Head title={`Submission #${submission.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center justify-between">
                    <Heading
                        title={`Submission #${submission.id}`}
                        description={submission.package_name}
                    />
                    <div className="flex gap-2">
                        {submission.status !== 'approved' && (
                            <Button size="sm" onClick={handleApprove}>
                                Approve
                            </Button>
                        )}
                        {submission.status !== 'rejected' && !rejecting && (
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setRejecting(true)}
                            >
                                Reject
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={activeTab === 'overview' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </Button>
                    <Button
                        size="sm"
                        variant={
                            activeTab === 'submitters' ? 'default' : 'outline'
                        }
                        onClick={() => setActiveTab('submitters')}
                    >
                        Users & Devices
                    </Button>
                </div>

                {rejecting && activeTab === 'overview' && (
                    <div className="flex flex-col gap-3 rounded-lg border border-destructive p-4">
                        <Label>Rejection Reason (optional)</Label>
                        <textarea
                            className="min-h-[80px] rounded border p-2 text-sm"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason for rejection…"
                        />
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleReject}
                            >
                                Confirm Reject
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRejecting(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {activeTab === 'overview' ? (
                    <>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">
                                        Metadata
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <Row label="Status">
                                        <Badge
                                            variant={
                                                submission.status === 'approved'
                                                    ? 'default'
                                                    : submission.status ===
                                                        'rejected'
                                                      ? 'destructive'
                                                      : 'secondary'
                                            }
                                        >
                                            {submission.status}
                                        </Badge>
                                    </Row>
                                    <Row label="Label">
                                        <Badge
                                            variant={
                                                submission.label === 'malicious'
                                                    ? 'destructive'
                                                    : 'outline'
                                            }
                                            className="capitalize"
                                        >
                                            {submission.label}
                                        </Badge>
                                    </Row>
                                    <Row label="Schema Version">
                                        v{submission.schema_version}
                                    </Row>
                                    <Row label="Score">
                                        {submission.score !== null
                                            ? submission.score.toFixed(6)
                                            : '—'}
                                    </Row>
                                    <Row label="Package">
                                        {submission.package_name}
                                    </Row>
                                    <Row label="APK SHA256">
                                        <span className="font-mono text-xs break-all">
                                            {submission.apk_sha256}
                                        </span>
                                    </Row>
                                    <Row label="Model Version">
                                        {submission.model_version ?? '—'}
                                    </Row>
                                    <Row label="App Version">
                                        {submission.app_version ?? '—'}
                                    </Row>
                                    <Row label="Received">
                                        {new Date(
                                            submission.received_at,
                                        ).toLocaleString()}
                                    </Row>
                                    {submission.extracted_at && (
                                        <Row label="Extracted">
                                            {new Date(
                                                submission.extracted_at,
                                            ).toLocaleString()}
                                        </Row>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">
                                        Source & Review
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <Row label="User / Contributor">
                                        {submission.user
                                            ? `${submission.user.name} (${submission.user.email})`
                                            : submission.contributor?.email ??
                                              '—'}
                                    </Row>
                                    <Row label="Device">
                                        {submission.device?.device_public_id ??
                                            '—'}
                                    </Row>
                                    {submission.reviewer && (
                                        <Row label="Reviewed By">
                                            {submission.reviewer.name}
                                        </Row>
                                    )}
                                    {submission.reviewed_at && (
                                        <Row label="Reviewed At">
                                            {new Date(
                                                submission.reviewed_at,
                                            ).toLocaleString()}
                                        </Row>
                                    )}
                                    {submission.rejection_reason && (
                                        <Row label="Rejection Reason">
                                            {submission.rejection_reason}
                                        </Row>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Feature Text
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-60 overflow-auto rounded bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                                    {submission.feature_text ?? '—'}
                                </pre>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Features JSON
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
                                    {JSON.stringify(
                                        submission.features ?? {},
                                        null,
                                        2,
                                    )}
                                </pre>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">
                                    Pipeline Manifest JSON
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
                                    {JSON.stringify(
                                        submission.pipeline_manifest ?? {},
                                        null,
                                        2,
                                    )}
                                </pre>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">
                                Related Submissions (same package + hash)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="text-muted-foreground">
                                {relatedStats.submission_count} submission(s) ·{' '}
                                {relatedStats.device_count} device(s) ·{' '}
                                {relatedStats.contributor_count} contributor(s)
                            </div>

                            <div className="overflow-x-auto rounded border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-3 text-left font-medium">
                                                ID
                                            </th>
                                            <th className="p-3 text-left font-medium">
                                                Submitter
                                            </th>
                                            <th className="p-3 text-left font-medium">
                                                Device
                                            </th>
                                            <th className="p-3 text-left font-medium">
                                                Label
                                            </th>
                                            <th className="p-3 text-left font-medium">
                                                Status
                                            </th>
                                            <th className="p-3 text-left font-medium">
                                                Received
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {relatedSubmissions.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="p-3">
                                                    #{item.id}
                                                </td>
                                                <td className="p-3">
                                                    {item.user
                                                        ? `${item.user.name} (${item.user.email})`
                                                        : item.contributor
                                                              ?.email ?? '—'}
                                                </td>
                                                <td className="p-3 font-mono text-xs">
                                                    {item.device
                                                        ?.device_public_id ??
                                                        '—'}
                                                </td>
                                                <td className="p-3">
                                                    {item.label}
                                                </td>
                                                <td className="p-3">
                                                    {item.status}
                                                </td>
                                                <td className="p-3 text-muted-foreground">
                                                    {new Date(
                                                        item.received_at,
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>
                                    {relatedSubmissions.total} total · page{' '}
                                    {relatedSubmissions.current_page} of{' '}
                                    {relatedSubmissions.last_page}
                                </span>
                                <div className="flex gap-2">
                                    {relatedSubmissions.links.map((link, i) => (
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
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

function Row({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right">{children}</span>
        </div>
    );
}

SubmissionShow.layout = {
    breadcrumbs: [
        { title: 'Data Hub', href: dashboard() },
        { title: 'Submissions', href: index() },
        { title: 'Detail' },
    ],
};
