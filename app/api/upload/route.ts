import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split(".").pop()
    const fileName = `uploads/${session.id}/${Date.now()}.${fileExt}`

    // Upload para Vercel Blob
    const blob = await put(fileName, file, {
      access: "public",
    })

    return NextResponse.json({
      url: blob.url,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Erro no upload:", error)
    return NextResponse.json({ error: "Falha no upload" }, { status: 500 })
  }
}
