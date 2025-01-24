import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Label } from "../ui/label"

interface CategoryBudgetProps {
    onChange: (value: string) => void;
    value?: string | null;
}

const CategoryBudget: React.FC<CategoryBudgetProps> = ({ onChange, value }) => {
    const t = useTranslations('budget');
    const [category, setCategory] = useState<string>(value || '');

    useEffect(() => {
        if (value) {
            setCategory(value);
        }
    }, [value]);

    const categoryOptions = [
        "work",
        "operational",
        "transport",
        "subscription",
        "home_utilities",
        "food",
        "entertainment",
        "education",
        "sports_health",
        "social",
        "business",
        "beauty",
        "investment_stocks",
        "savings",
        "travel",
        "loan",
        "bills",
        "other"
    ].sort((a, b) => t(`categories.${a}`).localeCompare(t(`categories.${b}`)));

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        onChange(value);
    };

    return (
        <div>
            <Label htmlFor="category">{t('category')}</Label>
            <Select 
              value={category} 
              onValueChange={handleCategoryChange}> 
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('categories.selectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                        {t(`categories.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default CategoryBudget;
