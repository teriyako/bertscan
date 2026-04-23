<?php

use App\Http\Controllers\DataHub\DatasetExportsController;
use App\Http\Controllers\DataHub\SubmissionsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->prefix('data-hub')->name('data-hub.')->group(function () {
    // Dashboard
    Route::redirect('/', '/dashboard')->name('dashboard');

    // Submissions
    Route::get('submissions', [SubmissionsController::class, 'index'])->name('submissions.index');
    Route::get('submissions/{submission}', [SubmissionsController::class, 'show'])->name('submissions.show');
    Route::post('submissions/{submission}/approve', [SubmissionsController::class, 'approve'])->name('submissions.approve');
    Route::post('submissions/{submission}/reject', [SubmissionsController::class, 'reject'])->name('submissions.reject');
    Route::post('submissions/bulk-approve', [SubmissionsController::class, 'bulkApprove'])->name('submissions.bulk-approve');
    Route::post('submissions/bulk-reject', [SubmissionsController::class, 'bulkReject'])->name('submissions.bulk-reject');

    // Dataset exports
    Route::get('exports', [DatasetExportsController::class, 'index'])->name('exports.index');
    Route::get('exports/create', [DatasetExportsController::class, 'create'])->name('exports.create');
    Route::post('exports', [DatasetExportsController::class, 'store'])->name('exports.store');
    Route::get('exports/preview', [DatasetExportsController::class, 'preview'])->name('exports.preview');
    Route::get('exports/{export}', [DatasetExportsController::class, 'show'])->name('exports.show');
    Route::get('exports/{export}/download', [DatasetExportsController::class, 'download'])->name('exports.download');
});
