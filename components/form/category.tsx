import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"

interface CategoryBudgetProps {
    onChange: (value: string) => void;
    value?: string | null;
}

const CategoryBudget: React.FC<CategoryBudgetProps> = ({ onChange, value }) => {
    const [category, setCategory] = useState<string>(value || '');

    useEffect(() => {
        if (value) {
            setCategory(value);
        }
    }, [value]);

    const categoryOptions = [
        "Work",
        "Operational",
        "Transport",
        "Subscription",
        "Home & Utilities",
        "Food",
        "Entertainment",
        "Education",
        "Sports & Health",
        "Social",
        "Business",
        "Beauty",
        "Investment & Stocks",
        "Savings",
        "Travel",
        "Loan",
        "Bills",
        "Other"
    ].sort();

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        onChange(value);
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

export default CategoryBudget;
