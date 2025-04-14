import React from 'react';

interface ProductCardProps {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  popularity: number;
  catergory: string;
}

const ProductCard: React.FC<ProductCardProps> = (props) => {
  return (
    <div>
      <div key={props.id} 
        className="border rounded-lg shadow hover:shadow-md transition overflow-hidden">
        <img
            src={props.imageUrl}
            alt={props.name}
            className="w-full h-60 object-cover"
        />
        <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800">
                {props.name}
            </h2>
            <p className="text-blue-600 font-bold mt-1">${props.price.toFixed(2)}</p>
            </div>
        </div>
    </div>
  );
};

export default ProductCard;