<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\BatchSubmissionRequest;
use App\Models\Device;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;

class SubmissionController extends Controller
{
    /**
     * Ingest a batch of telemetry submissions.
     *
     * POST /api/v1/submissions/batch
     */
    public function batch(BatchSubmissionRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        // Upsert device by device_public_id scoped to the user
        $device = Device::firstOrCreate(
            [
                'user_id' => $user->id,
                'device_public_id' => $data['device_public_id'],
            ],
            [
                'device_name' => $data['device_name'] ?? null,
                'platform' => $data['platform'] ?? null,
                'os_version' => $data['os_version'] ?? null,
            ]
        );

        $accepted = 0;
        $rejected = 0;
        $itemResults = [];

        foreach ($data['items'] as $index => $item) {
            $submissionData = [
                'user_id' => $user->id,
                'device_id' => $device->id,
                'received_at' => now(),
                'extracted_at' => isset($item['extracted_at']) ? $item['extracted_at'] : null,
                'label' => $item['label'],
                'score' => $item['score'] ?? null,
                'schema_version' => $item['schema_version'],
                'package_name' => $item['package_name'],
                'apk_sha256' => $item['apk_sha256'],
                'features' => $item['features'] ?? [],
                'feature_text' => $item['feature_text'] ?? $this->buildFeatureText($item['features'] ?? null),
                'pipeline_manifest' => $item['pipeline_manifest'] ?? null,
                'model_version' => $item['model_version'] ?? null,
                'app_version' => $data['app_version'] ?? null,
                'status' => 'new',
            ];

            $submission = Submission::create($submissionData);
            $accepted++;
            $itemResults[] = [
                'index' => $index,
                'status' => 'accepted',
                'id' => $submission->id,
            ];
        }

        return response()->json([
            'accepted' => $accepted,
            'rejected' => $rejected,
            'items' => $itemResults,
        ], 201);
    }

    private function buildFeatureText(?array $features): ?string
    {
        if (! is_array($features) || $features === []) {
            return null;
        }

        $active = [];

        foreach ($features as $name => $value) {
            if (is_string($name) && $name !== '' && (bool) $value) {
                $active[] = $name;
            }
        }

        return $active === [] ? null : implode(' ', $active);
    }
}
