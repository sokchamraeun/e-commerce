<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Services\BakongService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $order = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'payment_method' => 'required|in:khqr,cash',
        ]);

        $cart = Cart::with('items.product')
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty.'], 400);
        }

        $total = $cart->items->sum(fn ($item) => $item->price * $item->quantity);

        $order = Order::create([
            'user_id' => $request->user()->id,
            'total_price' => $total,
            'status' => 'pending',
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'unpaid',
            'name' => $validated['name'],
            'phone' => $validated['phone'],
        ]);

        foreach ($cart->items as $item) {
            $order->items()->create([
                'product_id' => $item->product_id,
                'price' => $item->price,
                'quantity' => $item->quantity,
            ]);
        }

        $cart->items()->delete();
        $cart->delete();

        if ($validated['payment_method'] === 'khqr') {
            $bakong = app(BakongService::class);
            $khqrData = $bakong->generateQR((float) $order->total_price, (string) $order->id);

            $order->update([
                'khqr_code' => $khqrData['qr'],
                'transaction_id' => $khqrData['md5'],
            ]);
        }

        $order->load('items.product');

        return response()->json($order, 201);
    }

    public function paymentStatus(int $id, BakongService $bakong): JsonResponse
    {
        $order = Order::findOrFail($id);

        if ($order->payment_status === 'paid') {
            return response()->json(['status' => 'paid']);
        }

        if (! $order->transaction_id) {
            return response()->json(['status' => 'unpaid']);
        }

        $result = $bakong->checkPayment($order->transaction_id);

        $responseCode = $result['data']['responseCode'] ?? null;
        $responseData = $result['data']['data'] ?? null;

        if ($responseCode === 0 && $responseData) {
            $order->payments()->create([
                'provider' => 'KHQR',
                'amount' => $order->total_price,
                'currency' => $responseData['currency'] ?? 'USD',
                'transaction_id' => $responseData['hash'] ?? $order->transaction_id,
                'status' => 'completed',
                'paid_at' => now(),
            ]);

            $order->update([
                'payment_status' => 'paid',
                'status' => 'processing',
            ]);

            return response()->json(['status' => 'paid']);
        }

        return response()->json(['status' => 'unpaid']);
    }

    public function regenerateQr(int $id): JsonResponse
    {
        $order = Order::findOrFail($id);

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Order already paid.'], 400);
        }

        $bakong = app(BakongService::class);
        $khqrData = $bakong->generateQR((float) $order->total_price, (string) $order->id);

        $order->update([
            'khqr_code' => $khqrData['qr'],
            'transaction_id' => $khqrData['md5'],
        ]);

        return response()->json([
            'khqr_code' => $order->khqr_code,
            'transaction_id' => $order->transaction_id,
        ]);
    }

    public function pay(Request $request, int $id, BakongService $bakong): JsonResponse
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Order already paid.'], 400);
        }

        $paymentResult = $bakong->checkPayment($order->transaction_id);

        $responseCode = $paymentResult['data']['responseCode'] ?? null;
        $responseData = $paymentResult['data']['data'] ?? null;

        if ($responseCode !== 0 || ! $responseData) {
            return response()->json(['message' => 'Payment not found or unpaid.'], 400);
        }

        $order->payments()->create([
            'provider' => 'KHQR',
            'amount' => $order->total_price,
            'currency' => $responseData['currency'] ?? 'USD',
            'transaction_id' => $responseData['hash'] ?? $order->transaction_id,
            'status' => 'completed',
            'paid_at' => now(),
        ]);

        $order->update([
            'payment_status' => 'paid',
            'status' => 'processing',
        ]);

        return response()->json([
            'message' => 'Payment successful.',
            'transaction_id' => $order->transaction_id,
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'payment_status' => 'nullable|in:unpaid,paid,failed',
            'status' => 'nullable|in:pending,processing,shipped',
        ]);

        $order = Order::findOrFail($id);
        $order->update($validated);

        return response()->json($order);
    }

    public function allOrders(): JsonResponse
    {
        $orders = Order::with('items.product', 'user')
            ->latest()
            ->get();

        return response()->json($orders);
    }

    public function stats(): JsonResponse
    {
        $totalOrders = Order::count();
        $revenue = Order::where('payment_status', 'paid')->sum('total_price');
        $pending = Order::where('status', 'pending')->count();

        return response()->json([
            'totalOrders' => $totalOrders,
            'revenue' => number_format($revenue, 2),
            'pending' => $pending,
        ]);
    }
}
