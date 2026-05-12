<?php

namespace App\Services;

use KHQR\BakongKHQR;
use KHQR\Helpers\KHQRData;
use KHQR\Models\IndividualInfo;

class BakongService
{
    private string $token;

    private string $bakongId;

    private string $merchantName;

    private string $merchantCity;

    private string $mobileNumber;

    public function __construct()
    {
        $this->token = config('services.bakong.token');
        $this->bakongId = config('services.bakong.bakong_id');
        $this->merchantName = config('services.bakong.merchant_name');
        $this->merchantCity = config('services.bakong.merchant_city');
        $this->mobileNumber = config('services.bakong.mobile_number');
    }

    public function generateQR(float $amount, string $billNumber): array
    {
        $currency = config('services.bakong.currency', 'USD');

        $individualInfo = new IndividualInfo(
            bakongAccountID: $this->bakongId,
            merchantName: $this->merchantName,
            merchantCity: $this->merchantCity,
            currency: $currency === 'KHR' ? KHQRData::CURRENCY_KHR : KHQRData::CURRENCY_USD,
            amount: $amount,
            billNumber: $billNumber,
            storeLabel: $this->merchantName,
            mobileNumber: $this->mobileNumber,
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
