"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { createSale } from "@/lib/actions"

type Item = {
  id: string
  name: string
  price: number
}

export function SaleForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [itemName, setItemName] = useState("")
  const [items, setItems] = useState<Item[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [price, setPrice] = useState("")
  const [date, setDate] = useState<Date>(new Date())

  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  const total = quantity * (Number.parseFloat(price) || 0)

  /* ---------------- Fetch items (debounced) ---------------- */
  useEffect(() => {
    if (!itemName) {
      setItems([])
      return
    }

    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/items?query=${itemName}`)
      const data = await res.json()
      setItems(data)
      setShowDropdown(true)
    }, 300)

    return () => clearTimeout(timeout)
  }, [itemName])

  /* ---------------- Close dropdown on outside click ---------------- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleSelectItem = (item: Item) => {
    setItemName(item.name)
    setPrice(item.price.toString())
    setShowDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await createSale({
        itemName,
        quantity,
        price: Number.parseFloat(price),
        date,
      })

      toast({
        title: "Sale recorded",
        description: "The sale has been successfully recorded.",
      })

      setItemName("")
      setQuantity(1)
      setPrice("")
      setDate(new Date())

      router.refresh()
    } catch {
      toast({
        title: "Something went wrong",
        description: "Your sale could not be recorded.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Sale Details</CardTitle>
          <CardDescription>Enter the details of the sale transaction</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Item Name Autocomplete */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              placeholder="Type S to search..."
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onFocus={() => itemName && setShowDropdown(true)}
              required
            />

            {showDropdown && items.length > 0 && (
              <div className="absolute z-50 w-full rounded-md border bg-background shadow-md">
                {items.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="w-full text-left px-3 py-2 hover:bg-muted"
                  >
                    {item.name}
                    <span className="float-right text-muted-foreground">
                      Rs {item.price}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 1)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Item (Rs)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Total</Label>
            <div className="text-2xl font-bold">Rs {total.toFixed(2)}</div>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              "Record Sale"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
