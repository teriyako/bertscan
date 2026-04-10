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
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamp('received_at')->useCurrent();
            $table->timestamp('extracted_at')->nullable();
            $table->string('label', 20); // benign|malicious
            $table->decimal('score', 8, 6)->nullable();
            $table->unsignedSmallInteger('schema_version');
            $table->string('package_name');
            $table->char('apk_sha256', 64);
            $table->json('features');
            $table->string('model_version', 50)->nullable();
            $table->string('app_version', 50)->nullable();
            $table->string('status', 20)->default('new'); // new|approved|rejected
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->index(['schema_version', 'label', 'received_at']);
            $table->index(['status', 'received_at']);
            $table->index(['package_name', 'received_at']);
            $table->index(['apk_sha256', 'schema_version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
