"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Plus, Trash2, Edit2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import CategoryBudget from './form/category'

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

export function BudgetPlanner() {
  const { data: session } = useSession()
  const [items, setItems] = useState<Item[]>([])
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<"income" | "expense">("income")
  const [category, setCategory] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState<"once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly">("once")
  const [recurrenceDate, setRecurrenceDate] = useState<Date | null>(null)
  const [note, setNote] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
        throw new Error('Failed to fetch budget items')
      }
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error("Error fetching budget items:", error)
      toast.error("Failed to fetch budget items")
    }
  }

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
  }

  const addItem = async () => {
    if (!name || !amount || !category) {
      toast.error("Please fill in all required fields")
      return
    }

    if (isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/budget-items", {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount.replace(/,/g, '')) || 0,
          type,
          category,
          recurrence,
          recurrenceDate,
          note,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to add item")
      }

      await fetchBudgetItems()
      resetForm()
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} item added`)
    } catch (error) {
      console.error("Error adding budget item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add budget item")
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (id: string) => {
    try {
      const response = await fetch(`/api/budget-items/${id}`, {
        method: "DELETE",
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error("Failed to remove item")
      }
      setItems(items.filter((item) => item.id !== id))
      toast.success("Item removed successfully")
    } catch (error) {
      console.error("Error removing budget item:", error)
      toast.error("Failed to remove budget item")
    }
  }

  const editItem = (id: string) => {
    const itemToEdit = items.find((item) => item.id === id)
    if (itemToEdit) {
      setName(itemToEdit.name)
      setAmount(itemToEdit.amount.toString())
      setType(itemToEdit.type)
      setCategory(itemToEdit.category)
      setRecurrence(itemToEdit.recurrence)
      setRecurrenceDate(itemToEdit.recurrenceDate ? new Date(itemToEdit.recurrenceDate) : null)
      setNote(itemToEdit.note)
      setEditingId(id)
    }
  }

  const updateItem = async () => {
    if (!editingId || !name || !amount || !category) {
      toast.error("Please fill in all required fields")
      return
    }

    if (isNaN(parseFloat(amount))) {
      toast.error("Please enter a valid amount")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/budget-items/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          amount: parseFloat(amount.replace(/,/g, '')),
          type,
          category,
          recurrence,
          recurrenceDate,
          note,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update item")
      }

      await fetchBudgetItems()
      resetForm()
      toast.success("Item updated successfully")
    } catch (error) {
      console.error("Error updating budget item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update budget item")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setAmount("")
    setCategory(null)
    setRecurrence("once")
    setRecurrenceDate(null)
    setNote("")
  }

  const totalIncome = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalExpenses

  const categories = Array.from(new Set(items.map((item) => item.category)))

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add Budget Item</CardTitle>
          <CardDescription>Enter the details of your income or expense</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(e) => {
            e.preventDefault()
            if (editingId) {
              updateItem()
            } else {
              addItem()
            }
          }}>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Salary"
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="text"
                  value={amount ? formatAmount(parseFloat(amount.replace(/,/g, '')) || 0) : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/,/g, '');
                    setAmount(value);
                  }}
                  placeholder="1,000"
                  required
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: "income" | "expense") => setType(value)}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <CategoryBudget onChange={setCategory} value={category} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recurrence">Recurrence</Label>
                <Select
                  value={recurrence}
                  onValueChange={(value: "once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly") => setRecurrence(value)}
                >
                  <SelectTrigger id="recurrence">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {recurrence !== "once" && (
              <div className="grid gap-2">
                <Label htmlFor="recurrenceDate">Recurrence Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${
                        !recurrenceDate && "text-muted-foreground"
                      }`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {recurrenceDate ? format(recurrenceDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={recurrenceDate || undefined}
                      onSelect={(value: Date | undefined) => setRecurrenceDate(value || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any additional information here"
              />
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={editingId ? updateItem : addItem} 
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              "Processing..."
            ) : editingId ? (
              <>
                <Edit2 className="mr-2 h-4 w-4" /> Update Item
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Budget Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {items.map((item) => (
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
                    <Button variant="ghost" size="sm" onClick={() => editItem(item.id)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

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
                <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>IDR {formatAmount(Number(balance.toFixed(2)))}</span>
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
      </div>
    </div>
  )
}
