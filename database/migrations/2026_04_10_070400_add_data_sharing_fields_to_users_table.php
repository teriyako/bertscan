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
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('data_sharing_enabled')->default(false)->after('email_verified_at');
            $table->timestamp('consented_at')->nullable()->after('data_sharing_enabled');
            $table->string('consent_version', 20)->nullable()->after('consented_at');
            $table->boolean('wifi_only_upload')->default(true)->after('consent_version');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['data_sharing_enabled', 'consented_at', 'consent_version', 'wifi_only_upload']);
        });
    }
};
