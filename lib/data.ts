import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Helper to get user-specific collection
function getSalesCollectionName(userId: string) {
  return `sales_${userId}`
}

/* -------------------- SALES DASHBOARD DATA -------------------- */
export async function getSalesData() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized: Not logged in")

  const userId = session.user.id
  const { db } = await connectToDatabase()
  const collection = db.collection(getSalesCollectionName(userId))

  const today = new Date()
  const todayStart = startOfDay(today)
  const todayEnd = endOfDay(today)

  // Today sales
  const todaySalesResult = await collection.aggregate([
    { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: "$quantity" } } }
  ]).toArray()
  const todaySales = todaySalesResult[0] || { total: 0, count: 0 }

  // Week sales
  const weekSalesResult = await collection.aggregate([
    { $match: { createdAt: { $gte: startOfWeek(today), $lte: endOfWeek(today) } } },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: "$quantity" } } }
  ]).toArray()
  const weekSales = weekSalesResult[0] || { total: 0, count: 0 }

  // Month sales
  const monthSalesResult = await collection.aggregate([
    { $match: { createdAt: { $gte: startOfMonth(today), $lte: endOfMonth(today) } } },
    { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: "$quantity" }, average: { $avg: "$total" } } }
  ]).toArray()
  const monthSales = monthSalesResult[0] || { total: 0, count: 0, average: 0 }

  // Recent sales
  const recentSales = await collection.find({}).sort({ createdAt: -1 }).limit(5).toArray()

  // Top products
  const topProductsResult = await collection.aggregate([
    { $group: { _id: "$itemName", quantity: { $sum: "$quantity" }, revenue: { $sum: "$total" } } },
    { $sort: { revenue: -1 } },
    { $limit: 5 }
  ]).toArray()

  const totalRevenue = topProductsResult.reduce((sum, p) => sum + p.revenue, 0)
  const topProducts = topProductsResult.map(p => ({
    name: p._id,
    quantity: p.quantity,
    revenue: p.revenue,
    percentage: Math.round((p.revenue / totalRevenue) * 100)
  }))

  // Daily sales for last 7 days
  const dailySalesData = []
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i)
    const daySalesResult = await collection.aggregate([
      { $match: { createdAt: { $gte: startOfDay(date), $lte: endOfDay(date) } } },
      { $group: { _id: null, total: { $sum: "$total" } } }
    ]).toArray()

    dailySalesData.push({
      date: format(date, "MMM dd"),
      total: daySalesResult[0]?.total || 0
    })
  }

  return {
    todaySales: { total: `Rs ${todaySales.total.toFixed(2)}`, count: todaySales.count },
    weekSales: { total: `Rs ${weekSales.total.toFixed(2)}`, count: weekSales.count },
    monthSales: { total: `Rs ${monthSales.total.toFixed(2)}`, count: monthSales.count, average: `Rs ${monthSales.average.toFixed(2)}` },
    recentSales,
    topProducts,
    dailySalesData
  }
}

/* -------------------- PAGINATED SALES RECORDS -------------------- */
interface SalesRecordsParams {
  page?: number
  startDate?: string
  endDate?: string
  product?: string
}

export async function getSalesRecords({ page = 1, startDate, endDate, product }: SalesRecordsParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized: Not logged in")

  const userId = session.user.id
  const { db } = await connectToDatabase()
  const collection = db.collection(getSalesCollectionName(userId))

  const limit = 10
  const skip = (page - 1) * limit

  const query: any = {}
  if (startDate) query.createdAt = { ...query.createdAt, $gte: new Date(startDate) }
  if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) }
  if (product) query.itemName = product

  const sales = await collection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
  const totalCount = await collection.countDocuments(query)
  const totalPages = Math.ceil(totalCount / limit)
  const products = await collection.distinct("itemName")

  return { sales, totalPages, products }
}

/* -------------------- SINGLE SALE -------------------- */
export async function getSaleById(id: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized: Not logged in")

  const userId = session.user.id
  const { db } = await connectToDatabase()
  const collection = db.collection(getSalesCollectionName(userId))

  return collection.findOne({ _id: new ObjectId(id) })
}

/* -------------------- ITEM AUTOCOMPLETE -------------------- */
export async function searchItemNames(query: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error("Unauthorized: Not logged in")

  const userId = session.user.id
  const { db } = await connectToDatabase()
  const collection = db.collection(getSalesCollectionName(userId))

  const items = await collection.aggregate([
    { $match: { itemName: { $regex: query, $options: "i" } } },
    { $group: { _id: "$itemName", price: { $avg: "$price" } } },
    { $sort: { _id: 1 } },
    { $limit: 10 }
  ]).toArray()

  return items.map((item) => ({
    name: item._id,
    price: Number(item.price?.toFixed(2)) || 0
  }))
}
