<?php

use App\Http\Controllers\Api\V1\ContributorAuthController;
use App\Http\Controllers\Api\V1\SubmissionController;
use Illuminate\Support\Facades\Route;

// ──────────────────────────────────────────────────────────────────
// Contributor auth (public – no session, no 2FA)
// ──────────────────────────────────────────────────────────────────
Route::prefix('v1/contributor/auth')->name('api.v1.contributor.auth.')->middleware('throttle:6,1')->group(function () {
    Route::post('register', [ContributorAuthController::class, 'register'])->name('register');
    Route::post('token', [ContributorAuthController::class, 'token'])->name('token');
});

Route::prefix('v1/contributor/auth')->name('api.v1.contributor.auth.')->middleware(['auth:sanctum'])->group(function () {
    Route::delete('token', [ContributorAuthController::class, 'logout'])->name('logout');
});

// ──────────────────────────────────────────────────────────────────
// Contributor-protected ingestion
// ──────────────────────────────────────────────────────────────────
Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:api_ingestion'])->group(function () {
    Route::post('submissions/batch', [SubmissionController::class, 'batch'])->name('api.v1.submissions.batch');
});
