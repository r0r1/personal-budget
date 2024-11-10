import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface CategoryBudgetProps {
    onChange: (value: string) => void; // Define the onChange prop type
}

const CategoryBudget: React.FC<CategoryBudgetProps> = ({ onChange }) => {
    const [category, setCategory] = useState<string>(''); // State for selected category
    const categoryOptions = [
        "Meals", 
        "Transport", 
        "Subscription", 
        "Food", 
        "Entertainment", 
        "Education", 
        "Sports", 
        "Social"
    ]; // Category options

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        onChange(value); // Call onChange prop when category changes
    };

    return (
        <div>
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={handleCategoryChange}> 
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a Category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                        {option}
                    </SelectItem>
                  ))}
                </SelectContent>
                
            </Select>
        </div>
    );
};

// ... existing code ...

export default CategoryBudget;
