"use client"

import { FileIcon, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type Attachment = {
  id: string
  filename: string
  fileType: string
  fileUrl: string
}

type BudgetItem = {
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
  attachments?: Attachment[]
}

interface DetailBudgetProps {
  item: BudgetItem
  onClose: () => void
}

export function DetailBudget({ item, onClose }: DetailBudgetProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'decimal' }).format(amount)
  }

  const parseNote = (note: string): string => {
    if (!note) return ''
    try {
      const parsed = JSON.parse(note)
      return parsed.text || ''
    } catch {
      return note
    }
  }

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-white z-10">
          <CardTitle>Budget Item Details</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{item.name}</h3>
              <span className={`text-xl font-semibold ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>
                IDR {formatAmount(item.amount)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Type</span>
                <p className="capitalize">{item.type}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Category</span>
                <p>{item.category}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Recurrence</span>
                <p className="capitalize">{item.recurrence}</p>
              </div>
              {item.recurrenceDate && (
                <div>
                  <span className="text-sm text-muted-foreground">Next Recurrence</span>
                  <p>{format(new Date(item.recurrenceDate), "PPP")}</p>
                </div>
              )}
            </div>

            {parseNote(item.note) && (
              <div>
                <span className="text-sm text-muted-foreground">Note</span>
                <p className="mt-1 whitespace-pre-wrap">{parseNote(item.note)}</p>
              </div>
            )}

            {item.attachments && item.attachments.length > 0 && (
              <div>
                <span className="text-sm text-muted-foreground block mb-2">Attachments</span>
                <div className="grid gap-4 md:grid-cols-2">
                  {item.attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-lg p-4">
                      {isImageFile(attachment.fileType) ? (
                        <div className="space-y-2">
                          <div className="relative aspect-video">
                            <img
                              src={attachment.fileUrl}
                              alt={attachment.filename}
                              className="object-cover rounded-md w-full h-full"
                            />
                          </div>
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline block truncate"
                          >
                            {attachment.filename}
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileIcon className="w-8 h-8" />
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-500 hover:underline block truncate"
                          >
                            {attachment.filename}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span>Created</span>
                <p>{format(new Date(item.createdAt), "PPP")}</p>
              </div>
              <div>
                <span>Last Updated</span>
                <p>{format(new Date(item.updatedAt), "PPP")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
