<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\DatasetExport;
use App\Models\Submission;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_submissions' => Submission::count(),
            'pending_submissions' => Submission::where('status', 'new')->count(),
            'approved_submissions' => Submission::where('status', 'approved')->count(),
            'rejected_submissions' => Submission::where('status', 'rejected')->count(),
            'total_exports' => DatasetExport::count(),
            'opted_in_users' => User::where('data_sharing_enabled', true)->count(),
        ];

        return Inertia::render('data-hub/dashboard', [
            'stats' => $stats,
        ]);
    }
}
