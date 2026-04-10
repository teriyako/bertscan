<?php

use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeAdminUser(): User
{
    return User::factory()->create(['email_verified_at' => now()]);
}

function makeSubmission(array $attrs = []): Submission
{
    $user = User::factory()->create();

    return Submission::create(array_merge([
        'user_id' => $user->id,
        'device_id' => null,
        'received_at' => now(),
        'label' => 'benign',
        'schema_version' => 1,
        'package_name' => 'com.example.test',
        'apk_sha256' => str_repeat('b', 64),
        'features' => ['f1' => 1],
        'status' => 'new',
    ], $attrs));
}

// ────────────────────────────────────────────────
// Single approve / reject
// ────────────────────────────────────────────────

test('can approve a submission', function () {
    $admin = makeAdminUser();
    $submission = makeSubmission();

    $response = $this->actingAs($admin)->post(route('data-hub.submissions.approve', $submission));

    $response->assertRedirect();
    $this->assertDatabaseHas('submissions', [
        'id' => $submission->id,
        'status' => 'approved',
        'reviewed_by' => $admin->id,
    ]);
});

test('can reject a submission with reason', function () {
    $admin = makeAdminUser();
    $submission = makeSubmission();

    $response = $this->actingAs($admin)->post(
        route('data-hub.submissions.reject', $submission),
        ['rejection_reason' => 'Duplicate APK hash']
    );

    $response->assertRedirect();
    $this->assertDatabaseHas('submissions', [
        'id' => $submission->id,
        'status' => 'rejected',
        'reviewed_by' => $admin->id,
        'rejection_reason' => 'Duplicate APK hash',
    ]);
});

// ────────────────────────────────────────────────
// Bulk approve / reject
// ────────────────────────────────────────────────

test('can bulk approve submissions', function () {
    $admin = makeAdminUser();
    $s1 = makeSubmission();
    $s2 = makeSubmission();

    $response = $this->actingAs($admin)->post(
        route('data-hub.submissions.bulk-approve'),
        ['ids' => [$s1->id, $s2->id]]
    );

    $response->assertRedirect();
    $this->assertDatabaseHas('submissions', ['id' => $s1->id, 'status' => 'approved']);
    $this->assertDatabaseHas('submissions', ['id' => $s2->id, 'status' => 'approved']);
});

test('can bulk reject submissions', function () {
    $admin = makeAdminUser();
    $s1 = makeSubmission();
    $s2 = makeSubmission();

    $response = $this->actingAs($admin)->post(
        route('data-hub.submissions.bulk-reject'),
        ['ids' => [$s1->id, $s2->id], 'rejection_reason' => 'Spam']
    );

    $response->assertRedirect();
    $this->assertDatabaseHas('submissions', ['id' => $s1->id, 'status' => 'rejected']);
    $this->assertDatabaseHas('submissions', ['id' => $s2->id, 'status' => 'rejected']);
});

// ────────────────────────────────────────────────
// Index filters
// ────────────────────────────────────────────────

test('submissions index filters by status', function () {
    $admin = makeAdminUser();
    makeSubmission(['status' => 'approved']);
    makeSubmission(['status' => 'rejected']);
    makeSubmission(['status' => 'new']);

    $response = $this->actingAs($admin)->get(route('data-hub.submissions.index', ['status' => 'approved']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page->component('data-hub/submissions/index')
                ->has('submissions.data', 1)
        );
});

test('submissions index filters by label', function () {
    $admin = makeAdminUser();
    makeSubmission(['label' => 'benign']);
    makeSubmission(['label' => 'malicious']);

    $response = $this->actingAs($admin)->get(route('data-hub.submissions.index', ['label' => 'malicious']));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page->has('submissions.data', 1)
        );
});

test('submissions index filters by schema_version', function () {
    $admin = makeAdminUser();
    makeSubmission(['schema_version' => 1]);
    makeSubmission(['schema_version' => 2]);

    $response = $this->actingAs($admin)->get(route('data-hub.submissions.index', ['schema_version' => 2]));

    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page->has('submissions.data', 1)
        );
});

test('guest cannot access submissions index', function () {
    $response = $this->get(route('data-hub.submissions.index'));
    $response->assertRedirect(route('login'));
});
