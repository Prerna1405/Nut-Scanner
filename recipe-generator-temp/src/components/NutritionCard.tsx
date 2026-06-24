import { Flame, Beef, Wheat, Droplet } from 'lucide-react';
import { Nutrition } from '../types';

interface NutritionCardProps {
  nutrition: Nutrition;
}

const NutritionCard = ({ nutrition }: NutritionCardProps) => {
  const nutrients = [
    {
      icon: Flame,
      label: 'Calories',
      value: nutrition.calories,
      unit: '',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      progress: Math.min((nutrition.calories / 500) * 100, 100),
    },
    {
      icon: Beef,
      label: 'Protein',
      value: nutrition.protein,
      color: 'text-red-500',
      bg: 'bg-red-50',
      progress: 70,
    },
    {
      icon: Wheat,
      label: 'Carbs',
      value: nutrition.carbs,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      progress: 50,
    },
    {
      icon: Droplet,
      label: 'Fat',
      value: nutrition.fat,
      color: 'text-blue-500',
      bg: 'bg-blue-50',
      progress: 40,
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Nutrition Facts</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map((nutrient, idx) => {
          const Icon = nutrient.icon;
          return (
            <div key={idx} className={`p-4 rounded-xl ${nutrient.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${nutrient.color}`} />
                <span className="text-xs font-medium text-gray-600">{nutrient.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {nutrient.value}{nutrient.unit}
              </div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${nutrient.color.replace('text-', 'bg-')}`}
                  style={{ width: `${nutrient.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionCard;
