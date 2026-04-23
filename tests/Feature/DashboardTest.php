<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk()
        ->assertInertia(
            fn ($page) => $page
                ->component('data-hub/dashboard')
                ->has('stats')
                ->has('charts')
        );
});

test('data-hub dashboard route redirects to dashboard route', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('data-hub.dashboard'));
    $response->assertRedirect(route('dashboard'));
});
