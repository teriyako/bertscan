<?php

namespace Database\Factories;

use App\Models\Contributor;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<Contributor>
 */
class ContributorFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'data_sharing_enabled' => false,
            'consented_at' => null,
            'consent_version' => null,
            'wifi_only_upload' => true,
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Contributor has opted in to data sharing.
     */
    public function optedIn(?string $consentVersion = '1.0'): static
    {
        return $this->state(fn (array $attributes) => [
            'data_sharing_enabled' => true,
            'consented_at' => now(),
            'consent_version' => $consentVersion,
        ]);
    }
}
