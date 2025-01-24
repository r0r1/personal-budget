"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Plus, List } from "lucide-react"
import { useTranslations } from 'next-intl'
import { Button } from "./ui/button"
import { AddBudget } from "./add-budget"
import { ListBudget } from "./list-budget"

type Item = {
  id: string
  name: string
  amount: number
  type: "income" | "expense"
  category: string
  recurrence: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
  recurrenceDate: Date | null
  note: string
  createdAt: Date
  updatedAt: Date
}

type View = "list" | "add"

export function BudgetPlanner() {
  const { data: session } = useSession()
  const t = useTranslations('budget')
  const [items, setItems] = useState<Item[]>([])
  const [currentView, setCurrentView] = useState<View>("list")
  const [editingItem, setEditingItem] = useState<Item | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchBudgetItems()
    }
  }, [session])

  const fetchBudgetItems = async () => {
    try {
      const response = await fetch('/api/budget-items', {
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(t('planner.fetchError'))
      }
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error(t('planner.fetchError'), error)
    }
  }

  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setCurrentView("add")
  }

  const handleSave = () => {
    fetchBudgetItems()
    setEditingItem(null)
    setCurrentView("list")
  }

  const handleCancel = () => {
    setEditingItem(null)
    setCurrentView("list")
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t('planner.title')}</h1>
        {currentView === "list" ? (
          <Button onClick={() => setCurrentView("add")}>
            <Plus className="mr-2 h-4 w-4" /> {t('planner.addButton')}
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setCurrentView("list")}>
            <List className="mr-2 h-4 w-4" /> {t('planner.viewList')}
          </Button>
        )}
      </div>

      {currentView === "add" ? (
        <AddBudget
          editingItem={editingItem}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      ) : (
        <ListBudget
          items={items}
          onEdit={handleEdit}
          onRefresh={fetchBudgetItems}
        />
      )}
    </div>
  )
}
