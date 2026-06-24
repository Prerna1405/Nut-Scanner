import { Clock, Flame, Star, ChefHat } from 'lucide-react';
import { Recipe } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick: () => void;
}

const RecipeCard = ({ recipe, onClick }: RecipeCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100 hover:-translate-y-1"
    >
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {recipe.image ? (
          <img 
            src={recipe.image} 
            alt={recipe.name} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-100 to-green-200">
            <ChefHat className="w-16 h-16 text-green-600 opacity-50" />
          </div>
        )}
        {recipe.isGenerated && (
          <div className="absolute top-3 left-3 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
            <span>✨</span> AI Generated
          </div>
        )}
        {recipe.difficulty && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
            {recipe.difficulty}
          </div>
        )}
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{recipe.name}</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {recipe.category && (
            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              {recipe.category}
            </span>
          )}
          {recipe.cuisine && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {recipe.cuisine}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-orange-500" />
            <span>{recipe.nutrition.calories} cal</span>
          </div>
          {recipe.prepTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.prepTime}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeCard;
