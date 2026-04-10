<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DatasetExport extends Model
{
    use HasFactory;

    protected $fillable = [
        'created_by',
        'name',
        'filters',
        'row_count',
        'benign_count',
        'malicious_count',
        'export_path',
        'status',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'row_count' => 'integer',
            'benign_count' => 'integer',
            'malicious_count' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
