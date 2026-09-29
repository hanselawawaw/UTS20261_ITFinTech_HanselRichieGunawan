import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/products?category=Drinks&q=kopi
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");

    const filter = { isActive: true };
    if (category && category !== "All") filter.category = category;
    if (q) filter.name = { $regex: escapeRegex(q), $options: "i" };

    const products = await Product.find(filter).sort({ category: 1, name: 1 }).lean();
    return NextResponse.json({ products });
  } catch (err) {
    console.error("GET /api/products", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
