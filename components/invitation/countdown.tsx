"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { getWeddingInstant } from "@/lib/event-time";

type CountdownValue = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

function getCountdownValue(now: number, target: number): CountdownValue {
  const difference = Math.max(0, target - now);
  const totalSeconds = Math.floor(difference / 1000);

  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    complete: difference === 0,
  };
}

export function Countdown() {
  const locale = useLocale();
  const t = useTranslations("countdown");
  const [countdown, setCountdown] = useState<CountdownValue | null>(null);

  useEffect(() => {
    const target = getWeddingInstant().getTime();
    const update = () => setCountdown(getCountdownValue(Date.now(), target));

    update();
    const interval = window.setInterval(update, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const formatter = new Intl.NumberFormat(locale, { useGrouping: false });
  const values = countdown ?? { days: 0, hours: 0, minutes: 0, seconds: 0, complete: false };

  return (
    <section className="countdown" aria-labelledby="countdown-title">
      <div className="countdown__intro">
        <p className="section-label">{t("label")}</p>
        <h2 id="countdown-title">{values.complete ? t("today") : t("title")}</h2>
      </div>
      {!values.complete && (
        <dl className="countdown__units" aria-label={t("ariaLabel")} aria-live="off">
          {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
            <div className="countdown__unit" key={unit}>
              <dd>
                {countdown
                  ? formatter.format(values[unit]).padStart(unit === "days" ? 1 : 2, "0")
                  : "…"}
              </dd>
              <dt>{t(unit)}</dt>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}