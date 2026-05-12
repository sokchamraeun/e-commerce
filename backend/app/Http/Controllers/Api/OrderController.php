<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Order;
use App\Models\PrintLog;
use App\Models\Product;
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

    public function staffStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'payment_method' => 'required|in:khqr,cash',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $total = 0;
        $orderItems = [];

        foreach ($validated['items'] as $item) {
            $product = Product::findOrFail($item['product_id']);
            $price = $product->price;
            $total += $price * $item['quantity'];
            $orderItems[] = [
                'product_id' => $product->id,
                'price' => $price,
                'quantity' => $item['quantity'],
            ];
        }

        $order = Order::create([
            'user_id' => $request->user()->id,
            'total_price' => $total,
            'status' => 'pending',
            'payment_method' => $validated['payment_method'],
            'payment_status' => 'unpaid',
            'name' => $validated['name'],
            'phone' => $validated['phone'],
        ]);

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

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

        $responseCode = $result['responseCode'] ?? null;
        $responseData = $result['data'] ?? null;

        if ($responseCode === 0 && $responseData) {
            $paymentData = $responseData['items'][0] ?? $responseData;

            $order->payments()->create([
                'provider' => 'KHQR',
                'amount' => $order->total_price,
                'currency' => $paymentData['currency'] ?? 'USD',
                'transaction_id' => $paymentData['hash'] ?? $order->transaction_id,
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

        $responseCode = $paymentResult['responseCode'] ?? null;
        $responseData = $paymentResult['data'] ?? null;

        if ($responseCode !== 0 || ! $responseData) {
            return response()->json(['message' => 'Payment not found or unpaid.'], 400);
        }

        $paymentData = $responseData['items'][0] ?? $responseData;

        $order->payments()->create([
            'provider' => 'KHQR',
            'amount' => $order->total_price,
            'currency' => $paymentData['currency'] ?? 'USD',
            'transaction_id' => $paymentData['hash'] ?? $order->transaction_id,
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

    public function allOrders(Request $request): JsonResponse
    {
        $perPage = $request->integer('per_page', 10);

        $orders = Order::with('items.product', 'user')
            ->withExists('printLogs')
            ->latest()
            ->paginate($perPage);

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

    public function chartData(Request $request): JsonResponse
    {
        $period = $request->input('period', 'monthly');

        return match ($period) {
            'daily' => $this->chartDaily(),
            'yearly' => $this->chartYearly(),
            default => $this->chartMonthly(),
        };
    }

    private function chartDaily(): JsonResponse
    {
        $days = Order::whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->selectRaw("date(created_at) as label, count(*) as orders, sum(case when payment_status = 'paid' then total_price else 0 end) as revenue")
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return response()->json($days);
    }

    private function chartMonthly(): JsonResponse
    {
        $months = collect(range(1, 12))->map(function ($month) {
            $orders = Order::whereYear('created_at', now()->year)
                ->whereMonth('created_at', $month);

            $count = (clone $orders)->count();
            $revenue = (clone $orders)->where('payment_status', 'paid')->sum('total_price');

            return [
                'label' => now()->month($month)->shortMonthName,
                'orders' => $count,
                'revenue' => (float) $revenue,
            ];
        });

        return response()->json($months);
    }

    private function chartYearly(): JsonResponse
    {
        $years = Order::selectRaw("year(created_at) as label, count(*) as orders, sum(case when payment_status = 'paid' then total_price else 0 end) as revenue")
            ->groupBy('label')
            ->orderBy('label')
            ->get();

        return response()->json($years);
    }

    public function report(Request $request): JsonResponse
    {
        $from = $request->date('from', now()->startOfMonth());
        $to = $request->date('to', now()->endOfDay());

        $query = Order::whereBetween('created_at', [$from, $to]);

        $summary = [
            'totalOrders' => (clone $query)->count(),
            'revenue' => (float) (clone $query)->where('payment_status', 'paid')->sum('total_price'),
            'pending' => (clone $query)->where('status', 'pending')->count(),
            'processing' => (clone $query)->where('status', 'processing')->count(),
            'shipped' => (clone $query)->where('status', 'shipped')->count(),
        ];

        $byPaymentMethod = (clone $query)
            ->selectRaw('payment_method, count(*) as count, sum(total_price) as total')
            ->whereNotNull('payment_method')
            ->groupBy('payment_method')
            ->get();

        $byPaymentStatus = (clone $query)
            ->selectRaw('payment_status, count(*) as count, sum(total_price) as total')
            ->groupBy('payment_status')
            ->get();

        $daily = (clone $query)
            ->selectRaw("date(created_at) as date, count(*) as orders, sum(case when payment_status = 'paid' then total_price else 0 end) as revenue")
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json([
            'summary' => $summary,
            'byPaymentMethod' => $byPaymentMethod,
            'byPaymentStatus' => $byPaymentStatus,
            'daily' => $daily,
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
        ]);
    }

    public function storePrintLog(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'required|in:invoice,receipt',
        ]);

        $order = Order::findOrFail($id);

        $log = PrintLog::create([
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'printed_at' => now(),
            'ip_address' => $request->ip(),
        ]);

        return response()->json($log, 201);
    }
}
