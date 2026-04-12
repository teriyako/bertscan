<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ContributorRegisterRequest;
use App\Http\Requests\Api\ContributorTokenRequest;
use App\Models\Contributor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ContributorAuthController extends Controller
{
    /**
     * Register a new mobile contributor.
     *
     * POST /api/v1/contributor/auth/register
     */
    public function register(ContributorRegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $dataSharing = (bool) $data['data_sharing_enabled'];

        $contributor = Contributor::create([
            'email' => $data['email'],
            'password' => $data['password'],
            'data_sharing_enabled' => $dataSharing,
            'consented_at' => $dataSharing ? now() : null,
            'consent_version' => $dataSharing ? ($data['consent_version'] ?? null) : null,
            'wifi_only_upload' => isset($data['wifi_only_upload']) ? (bool) $data['wifi_only_upload'] : true,
        ]);

        $deviceName = $data['device_name'] ?? ($request->userAgent() ?? 'mobile');
        $token = $contributor->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'token' => $token,
            'contributor' => [
                'id' => $contributor->id,
                'email' => $contributor->email,
                'data_sharing_enabled' => $contributor->data_sharing_enabled,
                'consented_at' => $contributor->consented_at?->toIso8601String(),
                'consent_version' => $contributor->consent_version,
                'wifi_only_upload' => $contributor->wifi_only_upload,
            ],
        ], 201);
    }

    /**
     * Issue a Sanctum token for an existing contributor (login).
     *
     * POST /api/v1/contributor/auth/token
     */
    public function token(ContributorTokenRequest $request): JsonResponse
    {
        $data = $request->validated();

        $contributor = Contributor::where('email', $data['email'])->first();

        if (! $contributor || ! Hash::check($data['password'], $contributor->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $contributor->createToken($data['device_name'])->plainTextToken;

        return response()->json([
            'token' => $token,
            'contributor' => [
                'id' => $contributor->id,
                'email' => $contributor->email,
                'data_sharing_enabled' => $contributor->data_sharing_enabled,
                'consented_at' => $contributor->consented_at?->toIso8601String(),
                'consent_version' => $contributor->consent_version,
                'wifi_only_upload' => $contributor->wifi_only_upload,
            ],
        ]);
    }

    /**
     * Revoke the current token (logout).
     *
     * DELETE /api/v1/contributor/auth/token
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Token revoked.']);
    }
}
