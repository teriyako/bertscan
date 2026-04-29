<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Contributor;
use App\Models\DatasetExport;
use App\Models\Device;
use App\Models\Submission;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $windowDays = 30;
        $startDate = now()->subDays($windowDays - 1)->startOfDay();
        $endDate = now()->endOfDay();

        $dailySubmissions = Submission::whereBetween('received_at', [$startDate, $endDate])
            ->selectRaw('DATE(received_at) as date')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved")
            ->selectRaw("SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected")
            ->selectRaw("SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as pending")
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $submissionsOverTime = collect(range(0, $windowDays - 1))
            ->map(fn($offset) => $startDate->copy()->addDays($offset)->format('Y-m-d'))
            ->map(function ($date) use ($dailySubmissions) {
                $row = $dailySubmissions->get($date);

                return [
                    'date' => $date,
                    'total' => (int) ($row->total ?? 0),
                    'approved' => (int) ($row->approved ?? 0),
                    'rejected' => (int) ($row->rejected ?? 0),
                    'pending' => (int) ($row->pending ?? 0),
                ];
            })
            ->values();

        $statusBreakdown = Submission::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderBy('total', 'desc')
            ->get()
            ->map(fn($row) => [
                'status' => $row->status,
                'total' => (int) $row->total,
            ]);

        $labelBreakdown = Submission::select('label', DB::raw('COUNT(*) as total'))
            ->whereNotNull('label')
            ->groupBy('label')
            ->orderBy('total', 'desc')
            ->get()
            ->map(fn($row) => [
                'label' => $row->label,
                'total' => (int) $row->total,
            ]);

        $dailyOptedInDevices = Device::whereBetween('created_at', [$startDate, $endDate])
            ->whereHas('contributor', fn($query) => $query->where('data_sharing_enabled', true))
            ->selectRaw('DATE(created_at) as date')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $optedInDevicesOverTime = collect(range(0, $windowDays - 1))
            ->map(fn($offset) => $startDate->copy()->addDays($offset)->format('Y-m-d'))
            ->map(function ($date) use ($dailyOptedInDevices) {
                $row = $dailyOptedInDevices->get($date);

                return [
                    'date' => $date,
                    'total' => (int) ($row->total ?? 0),
                ];
            })
            ->values();

        $topMaliciousPackages = Submission::select('package_name', DB::raw('COUNT(*) as total'))
            ->where('label', 'malicious')
            ->whereNotNull('package_name')
            ->groupBy('package_name')
            ->orderBy('total', 'desc')
            ->limit(6)
            ->get()
            ->map(fn($row) => [
                'package_name' => $row->package_name,
                'total' => (int) $row->total,
            ]);

        $stats = [
            'total_submissions' => Submission::count(),
            'pending_submissions' => Submission::where('status', 'new')->count(),
            'approved_submissions' => Submission::where('status', 'approved')->count(),
            'rejected_submissions' => Submission::where('status', 'rejected')->count(),
            'total_exports' => DatasetExport::count(),
            'opted_in_users' => Contributor::where('data_sharing_enabled', true)->count(),
        ];

        return Inertia::render('data-hub/dashboard', [
            'stats' => $stats,
            'charts' => [
                'window_days' => $windowDays,
                'submissions_over_time' => $submissionsOverTime,
                'status_breakdown' => $statusBreakdown,
                'label_breakdown' => $labelBreakdown,
                'opted_in_devices_over_time' => $optedInDevicesOverTime,
                'top_malicious_packages' => $topMaliciousPackages,
            ],
        ]);
    }
}
