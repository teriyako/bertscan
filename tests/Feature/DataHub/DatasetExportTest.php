<?php

use App\Models\DatasetExport;
use App\Models\Submission;
use App\Models\User;
use App\Services\CsvExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function makeApprovedSubmission(array $attrs = []): Submission
{
    $user = User::factory()->create();

    return Submission::create(array_merge([
        'user_id' => $user->id,
        'device_id' => null,
        'received_at' => now(),
        'label' => 'benign',
        'schema_version' => 1,
        'package_name' => 'com.example.test',
        'apk_sha256' => str_pad(bin2hex(random_bytes(8)), 64, '0'),
        'features' => ['f1' => 1],
        'feature_text' => 'f1',
        'pipeline_manifest' => ['feature_order' => 'android_static_v1_215'],
        'status' => 'approved',
    ], $attrs));
}

// ────────────────────────────────────────────────
// Export creation
// ────────────────────────────────────────────────

test('authenticated user can create an export', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    makeApprovedSubmission(['schema_version' => 1]);
    makeApprovedSubmission(['schema_version' => 1, 'label' => 'malicious']);

    $response = $this->actingAs($admin)->post(route('data-hub.exports.store'), [
        'schema_version' => 1,
        'approved_only' => true,
        'unique_by_hash' => true,
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('dataset_exports', [
        'created_by' => $admin->id,
        'status' => 'completed',
        'row_count' => 2,
    ]);
});

test('export csv file is stored in local disk', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    makeApprovedSubmission(['schema_version' => 1]);

    $this->actingAs($admin)->post(route('data-hub.exports.store'), [
        'schema_version' => 1,
        'approved_only' => true,
        'unique_by_hash' => false,
    ]);

    $export = DatasetExport::first();
    expect($export->status)->toBe('completed');
    expect($export->export_path)->not->toBeNull();
    Storage::disk('local')->assertExists($export->export_path);
});

test('export csv includes feature text and pipeline manifest columns', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    makeApprovedSubmission(['schema_version' => 1]);

    $this->actingAs($admin)->post(route('data-hub.exports.store'), [
        'schema_version' => 1,
        'approved_only' => true,
        'unique_by_hash' => false,
    ]);

    $export = DatasetExport::first();
    $csv = Storage::disk('local')->get($export->export_path);

    expect($csv)->toContain('feature_text');
    expect($csv)->toContain('pipeline_manifest_json');
});

test('export counts benign and malicious separately', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    makeApprovedSubmission(['schema_version' => 1, 'label' => 'benign']);
    makeApprovedSubmission(['schema_version' => 1, 'label' => 'benign']);
    makeApprovedSubmission(['schema_version' => 1, 'label' => 'malicious']);

    $this->actingAs($admin)->post(route('data-hub.exports.store'), [
        'schema_version' => 1,
        'approved_only' => true,
        'unique_by_hash' => false,
    ]);

    $export = DatasetExport::first();
    expect($export->benign_count)->toBe(2);
    expect($export->malicious_count)->toBe(1);
});

// ────────────────────────────────────────────────
// Download
// ────────────────────────────────────────────────

test('completed export can be downloaded', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    makeApprovedSubmission(['schema_version' => 1]);

    $this->actingAs($admin)->post(route('data-hub.exports.store'), [
        'schema_version' => 1,
        'approved_only' => true,
        'unique_by_hash' => true,
    ]);

    $export = DatasetExport::first();

    $response = $this->actingAs($admin)->get(route('data-hub.exports.download', $export));
    $response->assertOk();
});

test('download of non-completed export returns 404', function () {
    $admin = User::factory()->create(['email_verified_at' => now()]);

    $export = DatasetExport::create([
        'created_by' => $admin->id,
        'filters' => ['schema_version' => 1],
        'status' => 'pending',
    ]);

    $response = $this->actingAs($admin)->get(route('data-hub.exports.download', $export));
    $response->assertNotFound();
});

// ────────────────────────────────────────────────
// Guest protection
// ────────────────────────────────────────────────

test('guest cannot access exports index', function () {
    $response = $this->get(route('data-hub.exports.index'));
    $response->assertRedirect(route('login'));
});

// ────────────────────────────────────────────────
// CsvExportService unit
// ────────────────────────────────────────────────

test('csv export service unique_by_hash deduplicates rows', function () {
    Storage::fake('local');

    $admin = User::factory()->create(['email_verified_at' => now()]);
    $sha = str_repeat('c', 64);

    // Two submissions with same hash
    makeApprovedSubmission(['schema_version' => 1, 'apk_sha256' => $sha]);
    makeApprovedSubmission(['schema_version' => 1, 'apk_sha256' => $sha]);

    $export = DatasetExport::create([
        'created_by' => $admin->id,
        'filters' => ['schema_version' => 1, 'approved_only' => true, 'unique_by_hash' => true],
        'status' => 'pending',
    ]);

    $service = new CsvExportService;
    $service->generate($export);

    $export->refresh();
    expect($export->row_count)->toBe(1); // deduplicated
});
