<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('dataset_exports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->json('filters'); // stored filter criteria
            $table->unsignedInteger('row_count')->default(0);
            $table->unsignedInteger('benign_count')->default(0);
            $table->unsignedInteger('malicious_count')->default(0);
            $table->string('export_path')->nullable();
            $table->string('status', 20)->default('pending'); // pending|completed|failed
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dataset_exports');
    }
};
