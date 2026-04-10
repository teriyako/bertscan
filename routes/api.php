<?php

use App\Http\Controllers\Api\V1\SubmissionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware(['auth:sanctum', 'throttle:api_ingestion'])->group(function () {
    Route::post('submissions/batch', [SubmissionController::class, 'batch'])->name('api.v1.submissions.batch');
});
