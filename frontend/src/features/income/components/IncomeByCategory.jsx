import React, { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { buildIncomeCategoryData } from "../utils/incomeCategoryData";
import "./IncomeByCategory.css";

const formatAmount = (value, currencySymbol, formatCurrency) => {
  if (formatCurrency) return formatCurrency(Number(value));
  return `${currencySymbol}${Number(value || 0).toFixed(2)}`;
};

function CategoryTooltip({ active, payload, currencySymbol, formatCurrency }) {
  if (!active || !payload?.length) return null;
  const category = payload[0].payload;

  return (
    <div className="income-category-tooltip">
      <div className="income-category-tooltip__name">
        <span className="income-category-dot" style={{ backgroundColor: category.color }} />
        {category.name}
      </div>
      <div>{formatAmount(category.value, currencySymbol, formatCurrency)}</div>
      <div>{category.percent.toFixed(1)}%</div>
    </div>
  );
}

export default function IncomeByCategory({
  incomes = [],
  currencySymbol = "₱",
  formatCurrency
}) {
  const { data, total } = useMemo(() => buildIncomeCategoryData(incomes), [incomes]);
  const format = (amount) => formatAmount(amount, currencySymbol, formatCurrency);

  return (
    <section className="income-category-card" aria-labelledby="income-category-title">
      <h2 className="income-category-card__title" id="income-category-title">Income by Category</h2>

      <div className="income-category-card__content">
        <div className="income-category-chart">
          {data.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={2}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {data.map((category) => (
                      <Cell key={category.name.toLowerCase()} fill={category.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CategoryTooltip
                        currencySymbol={currencySymbol}
                        formatCurrency={formatCurrency}
                      />
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="income-category-chart__center" aria-hidden="true">
                <strong>{format(total)}</strong>
                <span>Total Income</span>
              </div>
            </>
          ) : (
            <div className="income-category-chart__empty">No income data for the selected filters.</div>
          )}
        </div>

        {data.length > 0 ? (
          <div className="income-category-list" aria-label="Income totals by category">
            {data.map((category) => (
              <div className="income-category-row" key={category.name.toLowerCase()}>
                <div className="income-category-row__name">
                  <span className="income-category-dot" style={{ backgroundColor: category.color }} aria-hidden="true" />
                  <span title={category.name}>{category.name}</span>
                </div>
                <div className="income-category-row__values">
                  <span>{format(category.value)}</span>
                  <span>{category.percent.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
