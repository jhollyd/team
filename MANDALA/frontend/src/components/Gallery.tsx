import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

interface Tag {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  tags: string[];
  isActive: boolean;
}

const Gallery = () => {
  const [selectedTag, setSelectedTag] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/products`);
        if (!productsResponse.ok) {
          throw new Error('Failed to fetch products');
        }
        const productsData = await productsResponse.json();
        setProducts(productsData);

        // Fetch tags
        const tagsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/tags`);
        if (!tagsResponse.ok) {
          throw new Error('Failed to fetch tags');
        }
        const tagsData = await tagsResponse.json();
        setTags(tagsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = selectedTag === 'All'
    ? products.filter(p => p.isActive)
    : products.filter(p => p.isActive && p.tags.includes(selectedTag));

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 py-20">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="py-20 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center text-blue-200 mb-6">Gallery</h1>
        <p className="text-center text-gray-600 text-lg mb-10">
          Browse through our collection of handcrafted and digital Mandalas.
        </p>

        {/* Filter Dropdown */}
        <div className="flex justify-end mb-8">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2"
          >
            <option value="All">All Tags</option>
            {tags.map((tag) => (
              <option key={tag._id} value={tag.name}>
                {tag.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
