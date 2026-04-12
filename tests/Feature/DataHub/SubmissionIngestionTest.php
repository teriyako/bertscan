<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

function makeOptedInUser(): User
{
    return User::factory()->create([
        'email_verified_at' => now(),
        'data_sharing_enabled' => true,
        'consented_at' => now(),
        'consent_version' => '1.0',
    ]);
}

// ────────────────────────────────────────────────
// Auth guard
// ────────────────────────────────────────────────

test('unauthenticated request is rejected', function () {
    $response = $this->postJson('/api/v1/submissions/batch', []);
    $response->assertUnauthorized();
});

test('non-opted-in user is forbidden', function () {
    $user = User::factory()->create(['data_sharing_enabled' => false]);
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'device123',
        'items' => [validItem()],
    ]);

    $response->assertForbidden();
});

// ────────────────────────────────────────────────
// Successful batch ingestion
// ────────────────────────────────────────────────

test('opted-in user can ingest a batch', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'abc-device-001',
        'app_version' => '1.2.3',
        'items' => [validItem(), validItem(['package_name' => 'com.evil.app', 'label' => 'malicious'])],
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['accepted', 'rejected', 'items'])
        ->assertJsonPath('accepted', 2)
        ->assertJsonPath('rejected', 0);

    $this->assertDatabaseCount('submissions', 2);
    $this->assertDatabaseHas('devices', ['user_id' => $user->id, 'device_public_id' => 'abc-device-001']);
    $this->assertDatabaseHas('submissions', [
        'apk_sha256' => str_repeat('a', 64),
        'feature_text' => 'feature1 feature2',
    ]);
});

test('device is reused on repeated batch', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $payload = fn () => [
        'device_public_id' => 'stable-device',
        'items' => [validItem()],
    ];

    $this->postJson('/api/v1/submissions/batch', $payload())->assertCreated();
    $this->postJson('/api/v1/submissions/batch', $payload())->assertCreated();

    $this->assertDatabaseCount('devices', 1);
    $this->assertDatabaseCount('submissions', 2);
});

// ────────────────────────────────────────────────
// Validation failures
// ────────────────────────────────────────────────

test('missing device_public_id fails validation', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'items' => [validItem()],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['device_public_id']);
});

test('invalid apk_sha256 fails validation', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'dev123',
        'items' => [validItem(['apk_sha256' => 'tooshort'])],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items.0.apk_sha256']);
});

test('invalid label fails validation', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'dev123',
        'items' => [validItem(['label' => 'unknown'])],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items.0.label']);
});

test('batch larger than 100 items fails', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'dev123',
        'items' => array_fill(0, 101, validItem()),
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);
});

test('missing schema_version fails validation', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $item = validItem();
    unset($item['schema_version']);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'dev123',
        'items' => [$item],
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['items.0.schema_version']);
});

test('item can be ingested with feature_text only', function () {
    $user = makeOptedInUser();
    Sanctum::actingAs($user);

    $item = validItem();
    unset($item['features']);

    $response = $this->postJson('/api/v1/submissions/batch', [
        'device_public_id' => 'dev123',
        'items' => [$item],
    ]);

    $response->assertCreated()->assertJsonPath('accepted', 1);
    $this->assertDatabaseHas('submissions', [
        'apk_sha256' => str_repeat('a', 64),
        'feature_text' => 'feature1 feature2',
    ]);
});

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────

function validItem(array $overrides = []): array
{
    return array_merge([
        'schema_version' => 1,
        'label' => 'benign',
        'score' => 0.123456,
        'package_name' => 'com.example.app',
        'apk_sha256' => str_repeat('a', 64),
        'extracted_at' => now()->toIso8601String(),
        'features' => ['feature1' => 1, 'feature2' => 0],
        'feature_text' => 'feature1 feature2',
        'pipeline_manifest' => [
            'feature_order' => 'android_static_v1_215',
            'tokenizer' => ['type' => 'whitespace'],
        ],
        'model_version' => 'v1.0',
    ], $overrides);
}
