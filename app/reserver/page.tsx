import { Suspense } from "react";
import { BookingForm } from "@/components/BookingForm";

export default function ReserverPage() {
  return (
    <div className="page">
      <Suspense fallback={<p>…</p>}>
        <BookingForm />
      </Suspense>
    </div>
  );
}
