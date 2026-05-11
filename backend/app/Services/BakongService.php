<?php

namespace App\Services;

use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

class BakongService
{
    private string $token;

    private string $accountId;

    private string $merchantName;

    private string $merchantCity;

    public function __construct()
    {
        $this->token = config('services.bakong.token');
        $this->accountId = config('services.bakong.account_id');
        $this->merchantName = config('services.bakong.merchant_name');
        $this->merchantCity = config('services.bakong.merchant_city');
    }

    public function generateQR(float $amount, string $billNumber): array
    {
        $currency = config('services.bakong.currency', 'USD');

        $individualInfo = new IndividualInfo(
            bakongAccountID: $this->accountId,
            merchantName: $this->merchantName,
            merchantCity: $this->merchantCity,
            currency: $currency === 'KHR' ? KHQRData::CURRENCY_KHR : KHQRData::CURRENCY_USD,
            amount: $amount,
            billNumber: $billNumber,
            storeLabel: $this->merchantName,
        );

        $response = BakongKHQR::generateIndividual($individualInfo);

        return [
            'qr' => $response->data['qr'],
            'md5' => $response->data['md5'],
        ];
    }

    public function checkPayment(string $md5): array
    {
        $bakong = new BakongKHQR($this->token);

        return $bakong->checkTransactionByMD5($md5);
    }
}
