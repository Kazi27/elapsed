import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)

    const from = params.get("From")
    const messageBody = params.get("Body")?.toLowerCase().trim()

    // Check if the message is "connect"
    if (messageBody === "connect") {
      const responseMessage = `🎉 Welcome to Time Since!\n\nStart tracking your important moments:\n${process.env.NEXT_PUBLIC_SITE_URL || "https://your-app.vercel.app"}\n\nCreate an account to save your trackers and share them with friends! ⏰`

      // Twilio expects TwiML response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`

      return new NextResponse(twimlResponse, {
        status: 200,
        headers: {
          "Content-Type": "text/xml",
        },
      })
    }

    // Default response for other messages
    const defaultResponse = `👋 Hi there! Text "connect" to get started with Time Since - your personal time tracking app!`

    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${defaultResponse}</Message>
</Response>`

    return new NextResponse(twimlResponse, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("SMS webhook error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
