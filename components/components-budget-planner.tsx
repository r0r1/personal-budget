"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Plus, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddBudget } from "@/components/add-budget"
import { ListBudget } from "@/components/list-budget"
import { toast } from "sonner"

type Item = {
  id: string
  name: string
  amount: number
  type: "income" | "expense"
  category: string
  recurrence: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly"
  recurrenceDate: string | null
  note: string
  createdAt: string
  updatedAt: string
}

type View = "list" | "add"

export function BudgetPlanner() {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [currentView, setCurrentView] = useState<View>("list")
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email) {
      console.log('Session authenticated, fetching items') // Debug log
      fetchBudgetItems()
    }
  }, [status, session])

  const fetchBudgetItems = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('Fetching budget items...') // Debug log
      
      const response = await fetch('/api/budget-items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch budget items: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('Fetched items:', data) // Debug log
      setItems(data)
    } catch (error) {
      console.error("Error fetching budget items:", error)
      setError(error instanceof Error ? error.message : 'Failed to load budget items')
      toast.error("Failed to load budget items")
    } finally {
      setIsLoading(false)
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

  if (status === 'loading' || isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-red-500">
            {error}
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => fetchBudgetItems()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budget Planner</h1>
        {currentView === "list" ? (
          <Button onClick={() => setCurrentView("add")} className="text-white">
            <Plus className="mr-2 h-4 w-4 text-white" /> Add Budget Item
          </Button>
        ) : (
          <Button variant="outline" onClick={() => setCurrentView("list")}>
            <List className="mr-2 h-4 w-4" /> View List
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
