<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class WingService
{
    private string $apiKey;

    private string $baseUrl;

    private string $storeAccount;

    public function __construct()
    {
        $this->apiKey = config('services.wing.api_key');
        $this->baseUrl = config('services.wing.base_url');
        $this->storeAccount = config('services.wing.store_account');
    }

    public function transfer(
        string $senderAccount,
        string $senderPin,
        float $amount,
        string $currency = 'usd',
        ?string $cardNumber = null,
    ): array {
        $params = [
            'wing_transaction_wing_to_wing[wing_account_number]' => $senderAccount,
            'wing_transaction_wing_to_wing[wing_account_pin]' => $senderPin,
            'wing_transaction_wing_to_wing[amount]' => (string) ($currency === 'usd' ? (int) ($amount * 100) : (int) $amount),
            'wing_transaction_wing_to_wing[currency]' => $currency,
            'wing_transaction_wing_to_wing[wing_destination_account_number]' => $this->storeAccount,
            'wing_transaction_wing_to_wing[khr_usd_buy_rate]' => '41.5',
            'wing_transaction_wing_to_wing[khr_usd_sell_rate]' => '40',
        ];

        if ($cardNumber) {
            $params['wing_transaction_wing_to_wing[wing_card_number]'] = $cardNumber;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
        ])->asForm()->post($this->baseUrl.'/wing_transaction/wing_to_wings', $params);

        return $response->json() ?? [];
    }
}
