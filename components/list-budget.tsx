"use client"

import { useState } from "react"
import { Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

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

interface ListBudgetProps {
  items: Item[]
  onEdit: (item: Item) => void
  onRefresh: () => void
}

export function ListBudget({ items, onEdit, onRefresh }: ListBudgetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 3
  const totalPages = Math.ceil(items.length / itemsPerPage)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
  }

  const removeItem = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/budget-items/${id}`, {
        method: "DELETE",
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error("Failed to remove item")
      }
      onRefresh()
      toast.success("Item removed successfully")
    } catch (error) {
      console.error("Error removing budget item:", error)
      toast.error("Failed to remove budget item")
    } finally {
      setIsLoading(false)
    }
  }

  const totalIncome = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalExpenses

  const categories = Array.from(new Set(items.map((item) => item.category)))

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem)

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Total Income:</span>
              <span className="text-green-600">IDR {formatAmount(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Expenses:</span>
              <span className="text-red-600">IDR {formatAmount(Number(totalExpenses.toFixed(2)))}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Balance:</span>
              <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                IDR {formatAmount(Number(balance.toFixed(2)))}
              </span>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-semibold">Budget Breakdown</h4>
            <div className="relative h-64 w-64 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {categories.map((category, index) => {
                  const categoryTotal = items
                    .filter((item) => item.category === category)
                    .reduce((sum, item) => sum + item.amount, 0)
                  const percentage = (categoryTotal / (totalIncome + totalExpenses)) * 100
                  const offset = categories.slice(0, index).reduce((sum, cat) => {
                    return (
                      sum +
                      (items.filter((item) => item.category === cat).reduce((s, item) => s + item.amount, 0) /
                        (totalIncome + totalExpenses)) *
                        100
                    )
                  }, 0)
                  return (
                    <circle
                      key={category}
                      r="15.9"
                      cx="50"
                      cy="50"
                      fill="transparent"
                      stroke={`hsl(${index * 137.508}, 70%, 50%)`}
                      strokeWidth="31.8"
                      strokeDasharray={`${percentage} ${100 - percentage}`}
                      strokeDashoffset={-offset}
                    />
                  )
                })}
              </svg>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {categories.map((category, index) => (
                <div key={category} className="flex items-center">
                  <div
                    className="w-3 h-3 mr-2 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 137.508}, 70%, 50%)` }}
                  />
                  <span className="text-sm">{category}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4 min-h-[400px]">
            {currentItems.map((item) => (
              <li key={item.id} className="flex flex-col space-y-2 border-b pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{item.name}</span>
                  <span className={`${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    IDR {formatAmount(item.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{item.category}</span>
                  <span>{item.recurrence}</span>
                </div>
                {item.note && (
                  <p className="text-sm text-muted-foreground">Note: {item.note}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {item.recurrence !== 'once' && item.recurrenceDate && (
                    <span>Next: {format(new Date(item.recurrenceDate), "MMM d, yyyy")}</span>
                  )}
                  <span>Created: {format(new Date(item.createdAt), "MMM yyyy")}</span>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(item)}
                    disabled={isLoading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeItem(item.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
