"use client";

import CustomErrorPage from "@/components/CustomErrorPage";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <CustomErrorPage error={error} reset={reset} />
      </body>
    </html>
  );
}
