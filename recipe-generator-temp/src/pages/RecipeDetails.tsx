import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChefHat, Heart, Share2, CheckSquare, Clock, ArrowLeft, Star, Activity } from 'lucide-react';
import NutritionCard from '../components/NutritionCard';
import { useApp } from '../contexts/AppContext';
import { Recipe } from '../types';

const RecipeDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite, saveRecipeToLibrary } = useApp();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  
  const recipe: Recipe = location.state?.recipe;

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Recipe not found</p>
          <button onClick={() => navigate(-1)} className="text-green-600 font-semibold">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: recipe.name,
        text: recipe.description || `Check out this recipe: ${recipe.name}`,
      });
    } else {
      navigator.clipboard.writeText(recipe.name);
      alert('Recipe name copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="relative h-72 bg-gray-200">
        {recipe.image ? (
          <img src={recipe.image} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <ChefHat className="w-24 h-24 text-white opacity-50" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>

        <div className="absolute top-6 right-6 flex gap-3">
          <button
            onClick={handleShare}
            className="bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-lg"
          >
            <Share2 className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={() => toggleFavorite(recipe)}
            className={`p-2.5 rounded-full shadow-lg transition-all ${
              isFavorite(recipe) ? 'bg-red-500' : 'bg-white/90 backdrop-blur-sm'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite(recipe) ? 'text-white fill-current' : 'text-gray-800'}`} />
          </button>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-3xl font-bold text-white mb-2">{recipe.name}</h1>
          {recipe.description && (
            <p className="text-gray-200">{recipe.description}</p>
          )}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8 -mt-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {recipe.difficulty && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full">
                <Star className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">{recipe.difficulty}</span>
              </div>
            )}
            {recipe.prepTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Prep: {recipe.prepTime}</span>
              </div>
            )}
            {recipe.cookTime && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Cook: {recipe.cookTime}</span>
              </div>
            )}
          </div>
        </div>

        <NutritionCard nutrition={recipe.nutrition} />

        <div className="bg-white rounded-2xl p-6 shadow-lg mt-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredients</h2>
          <ul className="space-y-3">
            {recipe.ingredients.map((ingredient, idx) => (
              <li
                key={idx}
                onClick={() => toggleIngredient(idx)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  checkedIngredients.has(idx) ? 'bg-green-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <CheckSquare
                  className={`w-6 h-6 ${
                    checkedIngredients.has(idx) ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
                <span className={`${checkedIngredients.has(idx) ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {ingredient}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
          <ol className="space-y-4">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <p className="text-gray-700 leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {recipe.fitnessBenefits && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600" />
              Fitness Benefits
            </h2>
            <p className="text-gray-700 leading-relaxed">{recipe.fitnessBenefits}</p>
          </div>
        )}

        {recipe.ingredientAlternatives && recipe.ingredientAlternatives.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ingredient Alternatives</h2>
            <ul className="space-y-2">
              {recipe.ingredientAlternatives.map((alt, idx) => (
                <li key={idx} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 font-bold">•</span>
                  {alt}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recipe.scores && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recipe Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-orange-50 rounded-xl">
                <div className="text-2xl font-bold text-orange-600">{recipe.scores.proteinScore}/10</div>
                <div className="text-xs text-gray-600 font-semibold">Protein Score</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-2xl font-bold text-green-600">{recipe.scores.healthScore}/10</div>
                <div className="text-xs text-gray-600 font-semibold">Health Score</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-2xl font-bold text-purple-600">{recipe.scores.goalCompatibilityScore}/10</div>
                <div className="text-xs text-gray-600 font-semibold">Goal Match</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-2xl font-bold text-blue-600">{recipe.scores.overallScore}/10</div>
                <div className="text-xs text-gray-600 font-semibold">Overall</div>
              </div>
            </div>
          </div>
        )}

        {recipe.youtube && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Video Tutorial</h2>
            <a
              href={recipe.youtube}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-green-600 font-semibold hover:underline"
            >
              Watch on YouTube →
            </a>
          </div>
        )}

        {recipe.imagePrompt && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI Image Prompt</h2>
            <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg">{recipe.imagePrompt}</p>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => saveRecipeToLibrary(recipe)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all"
          >
            Save Recipe
          </button>
        </div>
      </main>
    </div>
  );
};

export default RecipeDetails;
