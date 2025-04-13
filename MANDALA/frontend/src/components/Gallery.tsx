import { useState } from 'react';

// Dummy product list
const products = [
  {
    id: 1,
    name: 'Boho Mandala Wall Art',
    price: 30.0,
    image: 'https://img.freepik.com/free-vector/monochromatic-background-watercolor-with-mandalas_23-2148865944.jpg?t=st=1744495444~exp=1744499044~hmac=5312ec422b53793c77ca730e6fc1ef186b148720ea44d0e571211698029db3ec&w=900',
    category: 'Hand Drawn',
  },
  {
    id: 2,
    name: 'Floral Mandala Poster',
    price: 30.0,
    image: 'https://img.freepik.com/free-vector/linear-mandala-background_23-2147886391.jpg?t=st=1744495357~exp=1744498957~hmac=923d78ca18f938911614e46c4720dc837dee2fdbb4e8e69459f94d0b998cc14b&w=900',
    category: 'Hand Drawn',
  },
  {
    id: 3,
    name: 'Custom Name Design',
    price: 30.0,
    image: 'https://img.freepik.com/free-vector/creative-namaste-background_23-2147692899.jpg?t=st=1744495406~exp=1744499006~hmac=1e5a8bde13e01e165a4e93f55f1f1044b97c179956ec74ee8bd5cc66d398f750&w=900',
    category: 'Custom',
  },
  {
    id: 4,
    name: 'Digital Lotus Print',
    price: 30,
    image: 'https://img.freepik.com/free-vector/hand-drawn-mandala-lotus-flower-drawing_23-2149369062.jpg?t=st=1744495312~exp=1744498912~hmac=e50c894b9eff35b4d6250b475211c5b93e2435262da40008bbd84af093551d2e&w=900',
    category: 'Digital',
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
            <div
              key={product.id}
              className="border rounded-lg shadow hover:shadow-md transition overflow-hidden"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-60 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {product.name}
                </h2>
                <p className="text-blue-600 font-bold mt-1">${product.price.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
