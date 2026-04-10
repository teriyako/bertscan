<?php

namespace App\Http\Controllers\DataHub;

use App\Http\Controllers\Controller;
use App\Models\DatasetExport;
use App\Services\CsvExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DatasetExportsController extends Controller
{
    public function __construct(private readonly CsvExportService $exportService) {}

    public function index(): Response
    {
        $exports = DatasetExport::with('creator:id,name')
            ->latest()
            ->paginate(20);

        return Inertia::render('data-hub/exports/index', [
            'exports' => $exports,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('data-hub/exports/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'schema_version' => ['required', 'integer', 'min:1', 'max:9999'],
            'label' => ['nullable', 'string', 'in:benign,malicious'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'approved_only' => ['boolean'],
            'unique_by_hash' => ['boolean'],
        ]);

        $filters = [
            'schema_version' => $request->input('schema_version'),
            'label' => $request->input('label'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'approved_only' => $request->boolean('approved_only', true),
            'unique_by_hash' => $request->boolean('unique_by_hash', true),
        ];

        $export = DatasetExport::create([
            'created_by' => $request->user()->id,
            'name' => $request->input('name'),
            'filters' => $filters,
            'status' => 'pending',
        ]);

        // Generate synchronously (for simplicity; can be queued in future)
        try {
            $this->exportService->generate($export);
        } catch (\Throwable $e) {
            $export->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);
        }

        return redirect()->route('data-hub.exports.show', $export)
            ->with('success', 'Dataset export created.');
    }

    public function show(DatasetExport $export): Response
    {
        $export->load('creator:id,name');

        return Inertia::render('data-hub/exports/show', [
            'export' => $export,
        ]);
    }

    public function preview(Request $request): JsonResponse
    {
        $request->validate([
            'schema_version' => ['required', 'integer', 'min:1', 'max:9999'],
            'label' => ['nullable', 'string', 'in:benign,malicious'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'approved_only' => ['boolean'],
            'unique_by_hash' => ['boolean'],
        ]);

        $filters = [
            'schema_version' => $request->input('schema_version'),
            'label' => $request->input('label'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'approved_only' => $request->boolean('approved_only', true),
            'unique_by_hash' => $request->boolean('unique_by_hash', true),
        ];

        return response()->json([
            'count' => $this->exportService->previewCount($filters),
        ]);
    }

    public function download(DatasetExport $export): StreamedResponse
    {
        abort_unless($export->status === 'completed' && $export->export_path, 404);
        abort_unless(Storage::disk('local')->exists($export->export_path), 404);

        return Storage::disk('local')->download(
            $export->export_path,
            'dataset_export_'.$export->id.'.csv'
        );
    }
}
