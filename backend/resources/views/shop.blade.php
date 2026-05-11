<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Shop - {{ config('app.name', 'Laravel') }}</title>
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif
    </head>
    <body class="bg-gray-100 text-gray-900 antialiased">
        <header class="flex items-center justify-between bg-white px-8 py-4 shadow">
            <a href="/" class="text-xl font-bold text-gray-800">{{ config('app.name', 'MyApp') }}</a>
            <div class="flex gap-3">
                <a href="/login" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100">Sign In</a>
                <a href="/register" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Get Started</a>
            </div>
        </header>

        <main class="mx-auto max-w-6xl px-4 py-10">
            <h1 class="mb-8 text-3xl font-bold text-gray-900">Our Products</h1>

            @if (count($products) === 0)
                <p class="py-20 text-center text-gray-500">No products available.</p>
            @else
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($products as $product)
                        <div class="overflow-hidden rounded-2xl bg-white shadow transition hover:shadow-lg">
                            @if ($product->image)
                                <img src="{{ $product->image }}" alt="{{ $product->name }}" class="h-48 w-full object-cover">
                            @else
                                <div class="flex h-48 items-center justify-center bg-gray-200 text-gray-400">No Image</div>
                            @endif
                            <div class="p-5">
                                <h2 class="mb-1 text-lg font-semibold text-gray-800">{{ $product->name }}</h2>
                                <p class="mb-3 text-sm text-gray-500">
                                    {{ $product->description ? (strlen($product->description) > 100 ? substr($product->description, 0, 100) . '...' : $product->description) : 'No description' }}
                                </p>
                                <div class="flex items-center justify-between">
                                    <span class="text-xl font-bold text-blue-600">${{ number_format($product->price, 2) }}</span>
                                    <span class="text-sm text-gray-500">{{ $product->qty }} in stock</span>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            @endif
        </main>
    </body>
</html>
