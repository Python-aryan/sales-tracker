"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Download, Edit, MoreHorizontal, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { deleteSale, exportSalesCSV } from "@/lib/actions"

interface Sale {
  _id: string
  itemName: string
  quantity: number
  price: number
  total: number
  createdAt: Date
}

interface SalesRecordsProps {
  sales: Sale[]
  totalPages: number
  currentPage: number
}

export function SalesRecords({
  sales,
  totalPages,
  currentPage,
}: SalesRecordsProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [isExporting, setIsExporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState("All")

  /* --------------------------------
     Reset pagination when filtering
  --------------------------------- */
  useEffect(() => {
    if (currentPage !== 1) {
      router.push("/dashboard/sales?page=1")
    }
  }, [selectedProduct])

  /* --------------------------------
     Product filtering (client-side)
  --------------------------------- */
  const products = useMemo(() => {
    const unique = new Set(sales.map((s) => s.itemName))
    return ["All", ...Array.from(unique)]
  }, [sales])

  const filteredSales = useMemo(() => {
    if (selectedProduct === "All") return sales
    return sales.filter((sale) => sale.itemName === selectedProduct)
  }, [sales, selectedProduct])

  /* --------------------------------
     Page-only total (explicit!)
  --------------------------------- */
  const pageTotalAmount = useMemo(() => {
    if (selectedProduct === "All") return 0
    return filteredSales.reduce((sum, sale) => sum + sale.total, 0)
  }, [filteredSales, selectedProduct])

  /* --------------------------------
     Pagination (5-page chunks)
  --------------------------------- */
  const PAGE_WINDOW = 5

  const startPage =
    Math.floor((currentPage - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1

  const endPage = Math.min(startPage + PAGE_WINDOW - 1, totalPages)

  const visiblePages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  )

  /* --------------------------------
     Actions
  --------------------------------- */
  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportSalesCSV()
      toast({ title: "Export successful" })
    } catch {
      toast({
        title: "Export failed",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      await deleteSale(id)
      toast({ title: "Sale deleted" })
      router.refresh()
    } catch {
      toast({
        title: "Delete failed",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setSaleToDelete(null)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>
            View and manage your sales transactions
          </CardDescription>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </CardHeader>

      <CardContent>
        {/* Product Filter */}
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium">Product:</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="rounded-md border px-3 py-1 text-sm"
          >
            {products.map((product) => (
              <option key={product} value={product}>
                {product}
              </option>
            ))}
          </select>
        </div>

        {/* Page Total Banner */}
        {selectedProduct !== "All" && (
          <div className="mb-4 rounded-lg border bg-muted px-4 py-3">
            <div className="text-sm text-muted-foreground">
              Total Amount Sold (This Page) —{" "}
              <span className="font-medium">{selectedProduct}</span>
            </div>
            <div className="text-lg font-semibold">
              Rs {pageTotalAmount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Table */}
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[20%]">Product</TableHead>
              <TableHead className="w-[10%] text-right">Qty</TableHead>
              <TableHead className="w-[15%] text-right">Price</TableHead>
              <TableHead className="w-[15%] text-right">Total</TableHead>
              <TableHead className="w-[20%] text-right">Date</TableHead>
              <TableHead className="w-[10%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell>{sale.itemName}</TableCell>
                  <TableCell className="text-right">
                    {sale.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    Rs {sale.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    Rs {sale.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {format(new Date(sale.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(
                              `/dashboard/sales/edit/${sale._id}`
                            )
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>

                        {/* Correct AlertDialog nesting */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Are you sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this record.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(sale._id)
                                }
                                className="bg-destructive text-destructive-foreground"
                              >
                                {isDeleting ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <CardFooter>
          <Pagination className="w-full">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`/dashboard/sales?page=${Math.max(
                    1,
                    startPage - 1
                  )}`}
                />
              </PaginationItem>

              {visiblePages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href={`/dashboard/sales?page=${page}`}
                    isActive={page === currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href={`/dashboard/sales?page=${Math.min(
                    totalPages,
                    endPage + 1
                  )}`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      )}
    </Card>
  )
}
