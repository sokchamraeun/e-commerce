<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cart = Cart::with('items.product')
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $cart) {
            return response()->json(['items' => [], 'total' => 0]);
        }

        $total = $cart->items->sum(fn ($item) => $item->price * $item->quantity);

        return response()->json([
            'cart' => $cart,
            'items' => $cart->items,
            'total' => number_format($total, 2),
        ]);
    }

    public function add(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        $cart = Cart::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['user_id' => $request->user()->id]
        );

        $existing = $cart->items()->where('product_id', $product->id)->first();

        if ($existing) {
            $existing->update([
                'quantity' => $existing->quantity + $validated['quantity'],
            ]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'price' => $product->price,
            ]);
        }

        $cart->load('items.product');

        return response()->json($cart, 201);
    }

    public function updateItem(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $item = CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        if ($validated['quantity'] === 0) {
            $item->delete();

            return response()->json(['message' => 'Item removed.']);
        }

        $item->update(['quantity' => $validated['quantity']]);

        return response()->json($item);
    }

    public function removeItem(Request $request, int $id): JsonResponse
    {
        $item = CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $item->delete();

        return response()->json(['message' => 'Item removed.']);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = Cart::where('user_id', $request->user()->id)->first();

        if ($cart) {
            $cart->items()->delete();
            $cart->delete();
        }

        return response()->json(['message' => 'Cart cleared.']);
    }
}
