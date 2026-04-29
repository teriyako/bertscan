<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Contributor;
use Inertia\Inertia;
use Inertia\Response;

class OptedInUsersController extends Controller
{
    public function index(): Response
    {
        $optedInUsers = Contributor::query()
            ->where('data_sharing_enabled', true)
            ->withCount(['devices', 'submissions'])
            ->withMax('submissions', 'received_at')
            ->orderByDesc('consented_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('data-hub/opted-in/index', [
            'optedInUsers' => $optedInUsers,
        ]);
    }

    public function show(Contributor $contributor): Response
    {
        $contributor = Contributor::query()
            ->whereKey($contributor->id)
            ->withCount(['devices', 'submissions'])
            ->withMax('submissions', 'received_at')
            ->firstOrFail();

        abort_unless($contributor->data_sharing_enabled, 404);

        $devices = $contributor->devices()
            ->withCount('submissions')
            ->withMax('submissions', 'received_at')
            ->latest()
            ->get();

        return Inertia::render('data-hub/opted-in/show', [
            'contributor' => $contributor,
            'devices' => $devices,
        ]);
    }
}
