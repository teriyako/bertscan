<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Contributor;
use App\Models\DatasetExport;
use App\Models\Submission;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $now = now();
        $windowStart = $now->copy()->subDays(6)->startOfDay();

        $stats = [
            'total_submissions' => Submission::count(),
            'pending_submissions' => Submission::where('status', 'new')->count(),
            'approved_submissions' => Submission::where('status', 'approved')->count(),
            'rejected_submissions' => Submission::where('status', 'rejected')->count(),
            'total_exports' => DatasetExport::count(),
            'opted_in_users' => Contributor::where('data_sharing_enabled', true)->count(),
            'malicious_submissions' => Submission::where('label', 'malicious')->count(),
            'submissions_today' => Submission::whereDate('received_at', $now)->count(),
        ];

        $submissionsPerDay = collect(range(0, 6))
            ->map(function (int $offset) use ($windowStart) {
                $day = Carbon::parse($windowStart)->addDays($offset);

                return [
                    'day' => $day->format('D'),
                    'count' => Submission::query()
                        ->whereDate('received_at', $day)
                        ->count(),
                ];
            })
            ->values();

        $statusBreakdown = Submission::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $labelBreakdown = Submission::query()
            ->select('label', DB::raw('COUNT(*) as total'))
            ->groupBy('label')
            ->pluck('total', 'label');

        $topPackages = Submission::query()
            ->select('package_name', DB::raw('COUNT(*) as total'))
            ->groupBy('package_name')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'package_name' => $row->package_name,
                'count' => (int) $row->total,
            ])
            ->values();

        return Inertia::render('data-hub/dashboard', [
            'stats' => $stats,
            'charts' => [
                'submissions_per_day' => $submissionsPerDay,
                'status_breakdown' => [
                    'new' => (int) ($statusBreakdown['new'] ?? 0),
                    'approved' => (int) ($statusBreakdown['approved'] ?? 0),
                    'rejected' => (int) ($statusBreakdown['rejected'] ?? 0),
                ],
                'label_breakdown' => [
                    'benign' => (int) ($labelBreakdown['benign'] ?? 0),
                    'malicious' => (int) ($labelBreakdown['malicious'] ?? 0),
                ],
                'top_packages' => $topPackages,
            ],
        ]);
    }
}
