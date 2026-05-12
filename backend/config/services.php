<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'wing' => [
        'api_key' => env('WING_API_KEY'),
        'base_url' => env('WING_BASE_URL', 'https://wing-money.bongloy.com/api/v1'),
        'store_account' => env('WING_STORE_ACCOUNT'),
    ],

    'bakong' => [
        'token' => env('BAKONG_API_TOKEN'),
        'bakong_id' => env('BAKONG_ACCOUNT_ID'),
        'merchant_name' => env('BAKONG_MERCHANT_NAME'),
        'merchant_city' => env('BAKONG_MERCHANT_CITY', 'PHNOM PENH'),
        'mobile_number' => env('BAKONG_MOBILE_NUMBER', '855974749522'),
        'currency' => env('BAKONG_CURRENCY', 'USD'),
    ],

];
