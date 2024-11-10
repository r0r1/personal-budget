"use client"

import { useState } from "react"
import { Plus, Edit2, Calendar } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Textarea } from "./ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Calendar as CalendarComponent } from "./ui/calendar"
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

interface AddBudgetProps {
  editingItem?: Item | null
  onSave: () => void
  onCancel: () => void
}

export function AddBudget({ editingItem, onSave, onCancel }: AddBudgetProps) {
  const [name, setName] = useState(editingItem?.name || "")
  const [amount, setAmount] = useState(editingItem?.amount.toString() || "")
  const [type, setType] = useState<"income" | "expense">(editingItem?.type || "income")
  const [category, setCategory] = useState<string | null>(editingItem?.category || null)
  const [recurrence, setRecurrence] = useState<"once" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly">(editingItem?.recurrence || "once")
  const [recurrenceDate, setRecurrenceDate] = useState<Date | null>(editingItem?.recurrenceDate || null)
  const [note, setNote] = useState(editingItem?.note || "")
  const [isLoading, setIsLoading] = useState(false)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount);
  }

  const handleSubmit = async () => {
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
      const url = editingItem ? `/api/budget-items/${editingItem.id}` : "/api/budget-items"
      const method = editingItem ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        credentials: 'include',
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
        throw new Error(error.message || `Failed to ${editingItem ? 'update' : 'add'} item`)
      }

      onSave()
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} item ${editingItem ? 'updated' : 'added'}`)
    } catch (error) {
      console.error(`Error ${editingItem ? 'updating' : 'adding'} budget item:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${editingItem ? 'update' : 'add'} budget item`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{editingItem ? 'Edit' : 'Add'} Budget Item</CardTitle>
        <CardDescription>Enter the details of your income or expense</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={(e) => {
          e.preventDefault()
          handleSubmit()
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
                  <SelectItem value="daily">Daily</SelectItem>
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
      <CardFooter className="flex gap-2">
        <Button 
          onClick={handleSubmit} 
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? (
            "Processing..."
          ) : editingItem ? (
            <>
              <Edit2 className="mr-2 h-4 w-4" /> Update Item
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}
