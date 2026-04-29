<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\Device;
use App\Models\Submission;
use Inertia\Inertia;
use Inertia\Response;

class DevicesController extends Controller
{
    public function show(Device $device): Response
    {
        $device->load([
            'contributor:id,email,data_sharing_enabled',
            'user:id,name,email',
        ]);

        if ($device->contributor && ! $device->contributor->data_sharing_enabled) {
            abort(404);
        }

        $submissions = Submission::where('device_id', $device->id)
            ->latest('received_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('data-hub/devices/show', [
            'device' => $device,
            'submissions' => $submissions,
        ]);
    }
}
