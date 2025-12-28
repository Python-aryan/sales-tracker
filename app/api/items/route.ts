import { NextResponse } from "next/server"
import { searchItemNames } from "@/lib/data"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get("query") || ""

    if (!query) {
      return NextResponse.json([]) // empty array if no query
    }

    // Call your lib function to get matching items
    const items = await searchItemNames(query)

    return NextResponse.json(items)
  } catch (error) {
    console.error("Error fetching item suggestions:", error)
    return NextResponse.json(
      { error: "Unable to fetch items" },
      { status: 500 }
    )
  }
}
