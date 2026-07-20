import React, { ReactNode } from "react";

interface CriteriaTableProps {
  headers: string[];
  rows: ReactNode[][];
  /** Подпись под таблицей */
  caption?: string;
}

/**
 * Адаптивная таблица со скроллом по горизонтали на мобильных.
 * Структурированные данные хорошо извлекаются ИИ-поиском.
 */
export default function CriteriaTable({
  headers,
  rows,
  caption,
}: CriteriaTableProps) {
  return (
    <figure className="max-w-full">
      <div className="overflow-x-auto rounded-2xl shadow-[0_0_0_1px_rgba(15,23,42,0.08)]">
        <table className="w-full border-collapse text-left text-sm md:text-base">
          <thead>
            <tr className="bg-[#029cda] text-white">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-4 py-3 md:px-5 md:py-4 font-semibold whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-white" : "bg-[#F6F7F9]"}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={`px-4 py-3 md:px-5 md:py-4 align-top text-gray-700 ${
                      ci === 0 ? "font-medium text-[#313131]" : ""
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="mt-3 text-xs md:text-sm text-gray-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
