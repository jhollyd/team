import { useState } from 'react';
import art1 from '../images/art1.jpeg';
import art2 from '../images/art2.jpeg';
import art3 from '../images/art3.jpeg';
import art4 from '../images/art4.jpeg';
import art6 from '../images/art6.jpeg';
import ProductCard from './ProductCard';


const products = [
 
  {
    id: 1,
    name: 'Sparkle On Your Own',
    price: 20.0,
    image: art1,
    category: 'Hand Drawn',
  },
  {
    id: 2,
    name: 'Peacock Flute Mandala',
    price: 25.0,
    image: art2,
    category: 'Hand Drawn',
  },
  {
    id: 3,
    name: 'Bubu & Dudu Hug Mandala',
    price: 18.0,
    image: art3,
    category: 'Hand Drawn',
  },
  {
    id: 4,
    name: 'Flower Crown Portrait',
    price: 28.0,
    image: art4,
    category: 'Digital',
  },
  {
    id: 5,
    name: 'Custom Name Design',
    price: 30.0,
    image: 'https://img.freepik.com/free-vector/creative-namaste-background_23-2147692899.jpg?t=st=1744495406~exp=1744499006~hmac=1e5a8bde13e01e165a4e93f55f1f1044b97c179956ec74ee8bd5cc66d398f750&w=900',
    category: 'Custom',
  },
  {
    id: 6,
    name: 'Mandala Hearts',
    price: 22.0,
    image: art6,
    category: 'Hand Drawn',
  },
];

const categories = ['All', 'Hand Drawn', 'Digital', 'Custom'];

const Gallery = () => {

  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = selectedCategory === 'All'
    ? products
    : products.filter(p => p.category === selectedCategory);

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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filtered.map((product) => (
            <ProductCard product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
