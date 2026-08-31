// app/api/register/route.ts
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: "Email & Password required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: { email, password: hashed }
    })

    return Response.json({ success: true })

  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}