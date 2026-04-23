<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Submission::query()
            ->select('submissions.*')
            ->with([
                'user:id,name,email',
                'contributor:id,email',
                'device:id,device_public_id,device_name',
            ])
            ->selectSub(function ($subQuery) {
                $subQuery->from('submissions as duplicate')
                    ->selectRaw('COUNT(*)');

                $this->applySubmissionSignatureConstraints($subQuery, 'duplicate');
            }, 'submission_count')
            ->selectSub(function ($subQuery) {
                $subQuery->from('submissions as duplicate')
                    ->selectRaw('COUNT(DISTINCT duplicate.device_id)')
                    ->whereNotNull('duplicate.device_id');

                $this->applySubmissionSignatureConstraints($subQuery, 'duplicate');
            }, 'device_count')
            ->selectSub(function ($subQuery) {
                $subQuery->from('submissions as duplicate')
                    ->selectRaw('COUNT(DISTINCT duplicate.contributor_id)')
                    ->whereNotNull('duplicate.contributor_id');

                $this->applySubmissionSignatureConstraints($subQuery, 'duplicate');
            }, 'contributor_count');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('label')) {
            $query->where('label', $request->input('label'));
        }
        if ($request->filled('schema_version')) {
            $query->where('schema_version', $request->input('schema_version'));
        }
        if ($request->filled('package_name')) {
            $query->where('package_name', 'like', '%'.$request->input('package_name').'%');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('received_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('received_at', '<=', $request->input('date_to'));
        }

        $submissions = $query->latest('received_at')->paginate(25)->withQueryString();

        return Inertia::render('data-hub/submissions/index', [
            'submissions' => $submissions,
            'filters' => $request->only(['status', 'label', 'schema_version', 'package_name', 'date_from', 'date_to']),
        ]);
    }

    public function show(Submission $submission): Response
    {
        $submission->load([
            'user:id,name,email',
            'contributor:id,email',
            'device:id,device_public_id,device_name',
            'reviewer:id,name',
        ]);

        $relatedQuery = Submission::query()
            ->where('package_name', $submission->package_name)
            ->where('apk_sha256', $submission->apk_sha256);

        $relatedStats = [
            'submission_count' => (clone $relatedQuery)->count(),
            'device_count' => (clone $relatedQuery)
                ->whereNotNull('device_id')
                ->distinct('device_id')
                ->count('device_id'),
            'contributor_count' => (clone $relatedQuery)
                ->whereNotNull('contributor_id')
                ->distinct('contributor_id')
                ->count('contributor_id'),
        ];

        $relatedSubmissions = (clone $relatedQuery)
            ->with([
                'user:id,name,email',
                'contributor:id,email',
                'device:id,device_public_id,device_name',
            ])
            ->latest('received_at')
            ->paginate(10, ['*'], 'related_page')
            ->withQueryString();

        return Inertia::render('data-hub/submissions/show', [
            'submission' => $submission,
            'relatedStats' => $relatedStats,
            'relatedSubmissions' => $relatedSubmissions,
        ]);
    }

    public function approve(Submission $submission, Request $request): RedirectResponse
    {
        $submission->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        return back()->with('success', 'Submission approved.');
    }

    public function reject(Submission $submission, Request $request): RedirectResponse
    {
        $request->validate([
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $submission->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back()->with('success', 'Submission rejected.');
    }

    public function bulkApprove(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:submissions,id'],
        ]);

        Submission::whereIn('id', $request->input('ids'))->update([
            'status' => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => null,
        ]);

        return back()->with('success', count($request->input('ids')).' submission(s) approved.');
    }

    public function bulkReject(Request $request): RedirectResponse
    {
        $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:submissions,id'],
            'rejection_reason' => ['nullable', 'string', 'max:1000'],
        ]);

        Submission::whereIn('id', $request->input('ids'))->update([
            'status' => 'rejected',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $request->input('rejection_reason'),
        ]);

        return back()->with('success', count($request->input('ids')).' submission(s) rejected.');
    }

    /**
     * Constrain a subquery to records that match a submission signature.
     *
     * Applies whereColumn constraints between the aliased subquery table and the
     * parent `submissions` table using package_name, apk_sha256, schema_version, and label.
     */
    private function applySubmissionSignatureConstraints(QueryBuilder $query, string $alias): void
    {
        $query
            ->whereColumn("$alias.package_name", 'submissions.package_name')
            ->whereColumn("$alias.apk_sha256", 'submissions.apk_sha256')
            ->whereColumn("$alias.schema_version", 'submissions.schema_version')
            ->whereColumn("$alias.label", 'submissions.label');
    }
}
