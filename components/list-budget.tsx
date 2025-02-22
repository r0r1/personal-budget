"use client"

import { useState } from "react"
import { Edit2, Trash2, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useTranslations } from 'next-intl'
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

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
  const t = useTranslations('budget')
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const itemsPerPage = 3
  
  // Sort items by created date
  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB
  })

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage)

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'decimal' }).format(amount);
  }

  const removeItem = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/budget-items/${id}`, {
        method: "DELETE",
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error(t('list.removeError'))
      }
      onRefresh()
      toast.success(t('list.removeSuccess'))
    } catch (error) {
      console.error("Error removing budget item:", error)
      toast.error(t('list.removeError'))
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(16)
    doc.text(t('list.pdfTitle'), 14, 15)
    doc.setFontSize(11)
    doc.text(t('list.generatedOn', { date: format(new Date(), "MMM d, yyyy") }), 14, 25)

    // Add summary
    const totalIncome = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
    const balance = totalIncome - totalExpenses

    doc.text(`${t('list.totalIncome')}: IDR ${formatAmount(totalIncome)}`, 14, 35)
    doc.setTextColor(255, 0, 0)
    doc.text(`${t('list.totalExpenses')}: IDR ${formatAmount(Number(totalExpenses.toFixed(2)))}`, 14, 42)
    doc.setTextColor(0, 0, 0)
    doc.text(`${t('list.balance')}: IDR ${formatAmount(Number(balance.toFixed(2)))}`, 14, 49)

    // Prepare table data
    const tableData = sortedItems.map(item => [
      item.name,
      item.type === "expense" ? `- IDR ${formatAmount(item.amount)}` : `IDR ${formatAmount(item.amount)}`,
      t(`type.${item.type}`),
      t(`categories.${item.category.toLowerCase()}`),
      t(`recurrence.${item.recurrence}`),
      format(new Date(item.createdAt), "MMM d, yyyy")
    ])

    // Add table
    autoTable(doc, {
      head: [[t('add.name'), t('amount'), t('type'), t('category'), t('recurrence'), t('date')]],
      body: tableData,
      startY: 60,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    // Save the PDF
    doc.save('budget-report.pdf')
    toast.success(t('list.exportSuccess'))
  }

  const totalIncome = items.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0)
  const totalExpenses = items.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0)
  const balance = totalIncome - totalExpenses

  const categories = Array.from(new Set(items.map((item) => item.category)))

  // Calculate category totals and percentages
  const categoryData = categories.map(category => {
    const categoryTotal = items
      .filter((item) => item.category === category)
      .reduce((sum, item) => sum + item.amount, 0)
    const percentage = ((categoryTotal / (totalIncome + totalExpenses)) * 100).toFixed(1)
    return {
      category,
      total: categoryTotal,
      percentage
    }
  })

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem)

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('list.summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>{t('list.totalIncome')}:</span>
              <span className="text-green-600">IDR {formatAmount(totalIncome)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t('list.totalExpenses')}:</span>
              <span className="text-red-600">IDR {formatAmount(Number(totalExpenses.toFixed(2)))}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>{t('list.balance')}:</span>
              <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
                IDR {formatAmount(Number(balance.toFixed(2)))}
              </span>
            </div>
          </div>
          <div className="mt-8">
            <h4 className="mb-4 text-sm font-semibold">{t('list.breakdown')}</h4>
            <div className="relative h-64 w-64 mx-auto">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {categoryData.map((catData, index) => {
                  const percentage = Number(catData.percentage)
                  const offset = categoryData.slice(0, index).reduce((sum, cat) => {
                    return sum + Number(cat.percentage)
                  }, 0)
                  return (
                    <circle
                      key={catData.category}
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
              {categoryData.map((catData, index) => (
                <div key={catData.category} className="flex items-center">
                  <div
                    className="w-3 h-3 mr-2 rounded-full"
                    style={{ backgroundColor: `hsl(${index * 137.508}, 70%, 50%)` }}
                  />
                  <span className="text-sm">
                    {t(`categories.${catData.category.toLowerCase()}`)} ({catData.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('list.items')}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSortOrder}
            >
              {t('list.sort')} {sortOrder === 'desc' ? '↑' : '↓'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('list.exportPdf')}
            </Button>
          </div>
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
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-blue-500 rounded-full">
                    {t(`categories.${item.category.toLowerCase()}`)}
                  </span>
                  <span>{t(`recurrence.${item.recurrence}`)}</span>
                </div>
                {item.note && (
                  <p className="text-sm text-muted-foreground">{t('list.note')}: {item.note}</p>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {item.recurrence !== 'once' && item.recurrenceDate && (
                    <span>{t('list.nextDate')}: {format(new Date(item.recurrenceDate), "MMM d, yyyy")}</span>
                  )}
                  <span>{t('list.created')}: {format(new Date(item.createdAt), "MMM yyyy")}</span>
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
                {t('list.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('list.page', { current: currentPage, total: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                {t('list.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
