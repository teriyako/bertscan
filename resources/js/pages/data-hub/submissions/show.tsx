import { Head, router } from '@inertiajs/react';
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
    features: Record<string, unknown>;
    rejection_reason: string | null;
    reviewed_at: string | null;
    user: { id: number; name: string; email: string } | null;
    device: { id: number; device_public_id: string } | null;
    reviewer: { id: number; name: string } | null;
}

export default function SubmissionShow({
    submission,
}: {
    submission: Submission;
}) {
    const [rejecting, setRejecting] = useState(false);
    const [reason, setReason] = useState('');

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

                {rejecting && (
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

                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <Row label="Status">
                                <Badge
                                    variant={
                                        submission.status === 'approved'
                                            ? 'default'
                                            : submission.status === 'rejected'
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
                            <Row label="Package">{submission.package_name}</Row>
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
                            <Row label="User">
                                {submission.user
                                    ? `${submission.user.name} (${submission.user.email})`
                                    : '—'}
                            </Row>
                            <Row label="Device">
                                {submission.device?.device_public_id ?? '—'}
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
                        <CardTitle className="text-sm">Features JSON</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="max-h-96 overflow-auto rounded bg-muted p-3 text-xs">
                            {JSON.stringify(submission.features, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
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
