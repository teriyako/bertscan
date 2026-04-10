<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Submission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SubmissionsController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Submission::with(['user:id,name,email', 'device:id,device_public_id']);

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
        $submission->load(['user:id,name,email', 'device:id,device_public_id', 'reviewer:id,name']);

        return Inertia::render('data-hub/submissions/show', [
            'submission' => $submission,
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
}
