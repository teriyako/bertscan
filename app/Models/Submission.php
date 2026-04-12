<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'contributor_id',
        'device_id',
        'received_at',
        'extracted_at',
        'label',
        'score',
        'schema_version',
        'package_name',
        'apk_sha256',
        'features',
        'feature_text',
        'pipeline_manifest',
        'model_version',
        'app_version',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'extracted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'features' => 'array',
            'pipeline_manifest' => 'array',
            'score' => 'float',
            'schema_version' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(Contributor::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'new');
    }
}
