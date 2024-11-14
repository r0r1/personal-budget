export type FileAttachment = {
  id: string
  filename: string
  fileType: string
  fileUrl: string
  createdAt: string
}

export type BudgetItem = {
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
  attachments: FileAttachment[]
}
