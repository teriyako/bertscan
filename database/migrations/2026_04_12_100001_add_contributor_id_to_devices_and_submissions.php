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
        // Add contributor_id to devices and make user_id nullable
        Schema::table('devices', function (Blueprint $table) {
            $table->foreignId('contributor_id')
                ->nullable()
                ->after('id')
                ->constrained('contributors')
                ->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });

        // Add contributor_id to submissions and make user_id nullable
        Schema::table('submissions', function (Blueprint $table) {
            $table->foreignId('contributor_id')
                ->nullable()
                ->after('id')
                ->constrained('contributors')
                ->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropForeign(['contributor_id']);
            $table->dropColumn('contributor_id');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });

        Schema::table('submissions', function (Blueprint $table) {
            $table->dropForeign(['contributor_id']);
            $table->dropColumn('contributor_id');
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
        });
    }
};
