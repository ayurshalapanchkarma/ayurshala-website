import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const React = await import('react')
    const { renderToBuffer, Document, Page, Text } =
      await import('@react-pdf/renderer')

    const e = (type: any, props: any, ...children: any[]) =>
      React.createElement(type, props, ...children.filter((c: any) => c != null))

    const doc = e(Document, {},
      e(Page, {},
        e(Text, {}, 'HELLO PDF')
      )
    ) as any

    const buffer = await renderToBuffer(doc)

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test.pdf"',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
