<?php

namespace App\Http\Requests\Api;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ContributorRegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email', 'max:255', 'unique:contributors,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'data_sharing_enabled' => ['required', 'boolean'],
            'consent_version' => ['nullable', 'string', 'max:20'],
            'wifi_only_upload' => ['nullable', 'boolean'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ];
    }
}
