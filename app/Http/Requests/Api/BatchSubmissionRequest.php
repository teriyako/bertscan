<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BatchSubmissionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->data_sharing_enabled;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'device_public_id' => ['required', 'string', 'max:64', 'alpha_dash'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:50'],
            'os_version' => ['nullable', 'string', 'max:50'],
            'app_version' => ['nullable', 'string', 'max:50'],
            'items' => ['required', 'array', 'min:1', 'max:100'],
            'items.*.schema_version' => ['required', 'integer', 'min:1', 'max:9999'],
            'items.*.label' => ['required', 'string', 'in:benign,malicious'],
            'items.*.score' => ['nullable', 'numeric', 'min:0', 'max:1'],
            'items.*.package_name' => ['required', 'string', 'max:255'],
            'items.*.apk_sha256' => ['required', 'string', 'size:64', 'regex:/^[a-f0-9]{64}$/i'],
            'items.*.extracted_at' => ['nullable', 'date'],
            'items.*.features' => ['required', 'array', 'max:500'],
            'items.*.model_version' => ['nullable', 'string', 'max:50'],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.*.apk_sha256.size' => 'Each apk_sha256 must be exactly 64 hex characters.',
            'items.*.apk_sha256.regex' => 'Each apk_sha256 must be a valid lowercase hex string.',
            'items.*.label.in' => 'Each label must be either "benign" or "malicious".',
            'items.max' => 'A batch may contain at most 100 items.',
        ];
    }
}
