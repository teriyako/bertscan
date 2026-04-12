<?php

use App\Models\Contributor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

// ────────────────────────────────────────────────
// Registration
// ────────────────────────────────────────────────

test('contributor can register with consent', function () {
    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'email' => 'user@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'data_sharing_enabled' => true,
        'consent_version' => '1.0',
        'device_name' => 'Pixel 9',
    ]);

    $response->assertCreated()
        ->assertJsonStructure(['message', 'token', 'contributor'])
        ->assertJsonPath('contributor.email', 'user@example.com')
        ->assertJsonPath('contributor.data_sharing_enabled', true);

    $this->assertDatabaseHas('contributors', [
        'email' => 'user@example.com',
        'data_sharing_enabled' => true,
        'consent_version' => '1.0',
    ]);

    // consented_at should be set
    $contributor = Contributor::where('email', 'user@example.com')->first();
    expect($contributor->consented_at)->not->toBeNull();
});

test('contributor can register without opting in', function () {
    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'email' => 'nooptin@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'data_sharing_enabled' => false,
        'device_name' => 'Pixel 8',
    ]);

    $response->assertCreated()
        ->assertJsonPath('contributor.data_sharing_enabled', false);

    $contributor = Contributor::where('email', 'nooptin@example.com')->first();
    expect($contributor->consented_at)->toBeNull();
});

test('registration fails with duplicate email', function () {
    Contributor::factory()->create(['email' => 'existing@example.com']);

    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'email' => 'existing@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'data_sharing_enabled' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('registration fails with mismatched passwords', function () {
    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'email' => 'new@example.com',
        'password' => 'Password1!',
        'password_confirmation' => 'WrongPassword!',
        'data_sharing_enabled' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('registration fails with short password', function () {
    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'email' => 'new@example.com',
        'password' => 'short',
        'password_confirmation' => 'short',
        'data_sharing_enabled' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['password']);
});

test('registration fails when email is missing', function () {
    $response = $this->postJson('/api/v1/contributor/auth/register', [
        'password' => 'Password1!',
        'password_confirmation' => 'Password1!',
        'data_sharing_enabled' => true,
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

// ────────────────────────────────────────────────
// Token issuance (login)
// ────────────────────────────────────────────────

test('contributor can obtain token with correct credentials', function () {
    Contributor::factory()->create([
        'email' => 'mobile@example.com',
        'password' => bcrypt('Password1!'),
    ]);

    $response = $this->postJson('/api/v1/contributor/auth/token', [
        'email' => 'mobile@example.com',
        'password' => 'Password1!',
        'device_name' => 'Pixel 9',
    ]);

    $response->assertOk()
        ->assertJsonStructure(['token', 'contributor']);
});

test('token endpoint rejects wrong password', function () {
    Contributor::factory()->create([
        'email' => 'mobile@example.com',
        'password' => bcrypt('RealPassword1!'),
    ]);

    $response = $this->postJson('/api/v1/contributor/auth/token', [
        'email' => 'mobile@example.com',
        'password' => 'WrongPassword!',
        'device_name' => 'Pixel 9',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('token endpoint rejects unknown email', function () {
    $response = $this->postJson('/api/v1/contributor/auth/token', [
        'email' => 'nobody@example.com',
        'password' => 'Password1!',
        'device_name' => 'Pixel 9',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

test('token endpoint requires device_name', function () {
    $response = $this->postJson('/api/v1/contributor/auth/token', [
        'email' => 'mobile@example.com',
        'password' => 'Password1!',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['device_name']);
});

// ────────────────────────────────────────────────
// Logout / token revocation
// ────────────────────────────────────────────────

test('authenticated contributor can revoke token', function () {
    $contributor = Contributor::factory()->create();
    Sanctum::actingAs($contributor);

    $response = $this->deleteJson('/api/v1/contributor/auth/token');

    $response->assertOk()
        ->assertJsonPath('message', 'Token revoked.');
});

test('unauthenticated logout returns 401', function () {
    $response = $this->deleteJson('/api/v1/contributor/auth/token');
    $response->assertUnauthorized();
});
