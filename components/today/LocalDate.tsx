"use client";

import { useEffect, useState } from "react";
import { formatLocalDate, millisecondsUntilNextLocalDay, toLocalDateIso } from "@/lib/today/date";

type LocalDateProps = {
  className?: string;
};

export default function LocalDate({ className }: LocalDateProps) {
  const [date, setDate] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const updateDate = () => {
      const now = new Date();
      setDate(now);
      timer = setTimeout(updateDate, millisecondsUntilNextLocalDay(now) + 1000);
    };

    updateDate();
    return () => clearTimeout(timer);
  }, []);

  return (
    <time className={className} dateTime={date ? toLocalDateIso(date) : undefined}>
      {date ? formatLocalDate(date, navigator.language) : <span aria-hidden="true">&nbsp;</span>}
    </time>
  );
}
