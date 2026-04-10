<?php

namespace App\Services;

use App\Models\DatasetExport;
use App\Models\Submission;
use Illuminate\Support\Facades\Storage;

class CsvExportService
{
    /**
     * Build the submission query from the given filters.
     */
    public function buildQuery(array $filters)
    {
        $query = Submission::query();

        if (! empty($filters['schema_version'])) {
            $query->where('schema_version', $filters['schema_version']);
        }

        if (! empty($filters['label'])) {
            $query->where('label', $filters['label']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('received_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('received_at', '<=', $filters['date_to']);
        }

        $approvedOnly = $filters['approved_only'] ?? true;
        if ($approvedOnly) {
            $query->where('status', 'approved');
        }

        return $query;
    }

    /**
     * Count matching rows (with optional unique-by-hash dedup).
     */
    public function previewCount(array $filters): int
    {
        $query = $this->buildQuery($filters);

        $uniqueByHash = $filters['unique_by_hash'] ?? true;
        if ($uniqueByHash) {
            return $query->distinct('apk_sha256')->count('apk_sha256');
        }

        return $query->count();
    }

    /**
     * Generate the CSV export, write to storage, and update the DatasetExport record.
     */
    public function generate(DatasetExport $export): void
    {
        $filters = $export->filters;
        $query = $this->buildQuery($filters);

        $uniqueByHash = $filters['unique_by_hash'] ?? true;

        $disk = Storage::disk('local');
        $path = 'exports/dataset_export_'.$export->id.'_'.now()->format('Ymd_His').'.csv';

        $rowCount = 0;
        $benignCount = 0;
        $maliciousCount = 0;

        // Stream CSV to temporary file
        $tmpPath = tempnam(sys_get_temp_dir(), 'csv_export_');
        $handle = fopen($tmpPath, 'w');

        // Write BOM + header
        fputcsv($handle, [
            'apk_sha256',
            'package_name',
            'label',
            'schema_version',
            'features_json',
            'extracted_at',
            'model_version',
            'app_version',
        ]);

        $seen = [];

        $query->select([
            'apk_sha256',
            'package_name',
            'label',
            'schema_version',
            'features',
            'extracted_at',
            'model_version',
            'app_version',
        ])->orderBy('id')->chunk(500, function ($rows) use ($handle, &$rowCount, &$benignCount, &$maliciousCount, $uniqueByHash, &$seen) {
            foreach ($rows as $row) {
                if ($uniqueByHash) {
                    if (isset($seen[$row->apk_sha256])) {
                        continue;
                    }
                    $seen[$row->apk_sha256] = true;
                }

                fputcsv($handle, [
                    $row->apk_sha256,
                    $row->package_name,
                    $row->label,
                    $row->schema_version,
                    is_array($row->features) ? json_encode($row->features) : $row->features,
                    $row->extracted_at,
                    $row->model_version,
                    $row->app_version,
                ]);

                $rowCount++;
                if ($row->label === 'benign') {
                    $benignCount++;
                } elseif ($row->label === 'malicious') {
                    $maliciousCount++;
                }
            }
        });

        fclose($handle);

        // Move tmp file to storage
        $disk->put($path, file_get_contents($tmpPath));
        unlink($tmpPath);

        $export->update([
            'export_path' => $path,
            'row_count' => $rowCount,
            'benign_count' => $benignCount,
            'malicious_count' => $maliciousCount,
            'status' => 'completed',
        ]);
    }
}
