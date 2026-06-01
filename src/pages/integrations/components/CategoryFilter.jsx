import React from 'react';
import Button from '../../../components/ui/Button';

const CategoryFilter = ({ categories, activeCategory, onCategoryChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories?.map((category) => (
        <Button
          key={category?.id}
          variant={activeCategory === category?.id ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange(category?.id)}
          className="flex-shrink-0 linearbg-1"
        >
          {category?.name}
          {category?.count > 0 && (
            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full   ${
              activeCategory === category?.id 
                ? 'bg-white text-black' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {category?.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;