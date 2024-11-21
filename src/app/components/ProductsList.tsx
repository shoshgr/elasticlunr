'use client';

import { useEffect, useState } from 'react';
import elasticlunr from 'elasticlunr';

// Type definitions
interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  thumbnail: string;
}

const ProductsList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [index, setIndex] = useState<elasticlunr.Index | null>(null);

  // Fetch products and create index
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://dummyjson.com/products');
        const data = await response.json();
        setProducts(data.products);

        // Create Elasticlunr index
        const elasticIndex = elasticlunr(function () {
          this.addField('title');
          this.addField('description');
          this.setRef('id');
        });

        data.products.forEach((product: Product) => {
          elasticIndex.addDoc(product);
        });

        setIndex(elasticIndex);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterResults(query, priceFilter);
  };

  // Handle price filter
  const handlePriceFilter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = e.target.value ? parseFloat(e.target.value) : null;
    setPriceFilter(price);
    filterResults(searchQuery, price);
  };

  // Filter results based on query and price
  const filterResults = (query: string, price: number | null) => {
    if (!index) return;

    const results = index
      .search(query, { expand: true })
      .map(({ ref }) => products.find((product) => product.id.toString() === ref));

    const filteredResults = results.filter(
      (product) => product && (price === null || product.price <= price)
    );

    setSearchResults(filteredResults as Product[]);
  };

  const displayedProducts = searchQuery || priceFilter ? searchResults : products;

  if (loading) return <p className="text-center text-lg">טוען נתונים...</p>;

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-center mb-6">רשימת מוצרים</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          placeholder="חפש מוצר..."
          value={searchQuery}
          onChange={handleSearch}
          className="flex-1 p-3 border rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="number"
          placeholder="מחיר מקסימלי..."
          value={priceFilter || ''}
          onChange={handlePriceFilter}
          className="flex-1 p-3 border rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayedProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200"
          >
            <img
              src={product.thumbnail}
              alt={product.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{product.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{product.description}</p>
              <p className="text-lg font-bold text-green-600">מחיר: ${product.price}</p>
            </div>
          </div>
        ))}
      </div>

      {searchQuery && searchResults.length === 0 && (
        <p className="text-center text-gray-500 mt-6">לא נמצאו תוצאות חיפוש</p>
      )}
    </div>
  );
};

export default ProductsList;
