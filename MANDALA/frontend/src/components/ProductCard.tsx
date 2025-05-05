import { Heart,} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface product {
    id: number;
    name: string;
    price: number;
    image: string;
    category: string;
}

interface ProductCardProps {
    product: product;
}


const ProductCard: React.FC<ProductCardProps> = ( { product} ) => {
const [inWishlist, setInWishlist] = useState(false);

  return (
    <Link to={`/products/${product.id}`} state={{ product }}>
        <div key={product.id} 
            className="border rounded-lg shadow hover:shadow-md transition overflow-hidden">
            
            <img
                src={product.image}
                alt={product.name}
                className="w-full h-60 object-cover"
            />
            <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800">
                    {product.name}
                </h2>
                <div className="flex justify-between items-center">
                    <p className="text-blue-600 font-bold mt-1">${product.price.toFixed(2)}</p>
                    <button className="text-red-600 py-2 px-4"
                        onClick={(e) => {
                            e.preventDefault();
                            setInWishlist(!inWishlist);
                        }}>
                        <Heart fill={inWishlist ? 'red' : 'none'}/>
                    </button>
                </div>
            </div>
        </div>
    </Link>
  );
};

export default ProductCard;