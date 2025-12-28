import { NextResponse } from "next/server"
import { db } from "@/lib/db" // your DB client

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get("query") || ""

  if (!query) {
    return NextResponse.json([])
  }

  const items = await db.item.findMany({
    where: {
      name: {
        contains: query,
        mode: "insensitive",
      },
    },
    take: 10,
  })

  return NextResponse.json(items)
}
