import { NextResponse } from "next/server";

export function middleware() {
  if (process.env.REDIRECT_MODE !== "true") {
    return NextResponse.next();
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="3;url=https://nahw.barada.dev" />
  <title>We've moved</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #fafafa; color: #333; }
    a { color: #2563eb; }
  </style>
</head>
<body>
  <p>We've moved to <a href="https://nahw.barada.dev">nahw.barada.dev</a>. Redirecting in 3 seconds…</p>
</body>
</html>`,
    { status: 200, headers: { "content-type": "text/html" } }
  );
}
