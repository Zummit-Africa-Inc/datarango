"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { RefreshCw, X } from "lucide-react";
import Image from "next/image";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/shared/scroll-area";
import { Statistics } from "@/components/shared/statistics";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib";
import type {
  ActivitiesWidget,
  AdvertsWidget,
  ChartWidget,
  DataWidget,
  DocumentListWidget,
  EventsWidget,
  ExpensesStatsWidget,
  NewsWidget,
  StatisticsWidget,
  TableWidget,
  WidgetConfig,
} from "@/types";

function StatisticsBody({ widget }: { widget: StatisticsWidget }) {
  return (
    <div className="grid grid-cols-2 gap-4 @xl:grid-cols-4">
      {widget.data.map((stat) => (
        <Statistics
          key={stat.label}
          label={stat.label}
          value={String(stat.value)}
          delta={
            stat.change !== undefined ? `${stat.change > 0 ? "+" : ""}${stat.change}%` : undefined
          }
        />
      ))}
    </div>
  );
}

function chartConfigFrom(series: ChartWidget["data"]["series"]): ChartConfig {
  return Object.fromEntries(
    series.map((s, i) => [s.name, { label: s.name, color: `var(--chart-${(i % 5) + 1})` }]),
  );
}

function ChartBody({ widget }: { widget: ChartWidget }) {
  const { labels, series } = widget.data;
  const config = chartConfigFrom(series);
  const rows = labels.map((label, i) => {
    const row: Record<string, string | number> = { label };
    series.forEach((s) => {
      row[s.name] = s.data[i];
    });
    return row;
  });

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      {widget.chartType === "bar" ? (
        <BarChart data={rows}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Bar key={s.name} dataKey={s.name} fill={`var(--color-${s.name})`} radius={4} />
          ))}
        </BarChart>
      ) : widget.chartType === "area" ? (
        <AreaChart data={rows}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Area
              key={s.name}
              dataKey={s.name}
              fill={`var(--color-${s.name})`}
              stroke={`var(--color-${s.name})`}
            />
          ))}
        </AreaChart>
      ) : widget.chartType === "pie" || widget.chartType === "donut" ? (
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent />} />
          <Pie
            data={rows}
            dataKey={series[0]?.name}
            nameKey="label"
            innerRadius={widget.chartType === "donut" ? 60 : 0}
          />
        </PieChart>
      ) : (
        <LineChart data={rows}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s) => (
            <Line key={s.name} dataKey={s.name} stroke={`var(--color-${s.name})`} dot={false} />
          ))}
        </LineChart>
      )}
    </ChartContainer>
  );
}

function TableBodyWidget({ widget }: { widget: TableWidget }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {widget.columns.map((col) => (
            <TableHead key={col.key}>{col.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {widget.rows.map((row, i) => (
          <TableRow key={i}>
            {widget.columns.map((col) => (
              <TableCell key={col.key}>{String(row[col.key] ?? "")}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function DocumentListBody({ widget }: { widget: DocumentListWidget }) {
  return (
    <ul className="divide-y">
      {widget.documents.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between py-2 text-sm hover:underline"
          >
            <span>{doc.name}</span>
            <span className="text-muted-foreground text-xs">{doc.updatedAt}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

function ExpensesStatsBody({ widget }: { widget: ExpensesStatsWidget }) {
  return (
    <div className="space-y-4">
      <Statistics
        label={`${widget.periodStart} – ${widget.periodEnd}`}
        value={`${widget.currency} ${widget.totalAmount.toLocaleString()}`}
      />
      <ul className="space-y-2">
        {widget.categories.map((cat) => (
          <li key={cat.category} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{cat.category}</span>
            <span className="font-medium">
              {cat.currency} {cat.amount.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DataBody({ widget }: { widget: DataWidget }) {
  switch (widget.dataType) {
    case "statistics":
      return <StatisticsBody widget={widget} />;
    case "chart":
      return <ChartBody widget={widget} />;
    case "table":
      return <TableBodyWidget widget={widget} />;
    case "document-list":
      return <DocumentListBody widget={widget} />;
    case "expenses-stats":
      return <ExpensesStatsBody widget={widget} />;
  }
}

function NewsBody({ widget }: { widget: NewsWidget }) {
  return (
    <ScrollArea orientation="horizontal">
      <div className="flex gap-4">
        {widget.items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="w-64 shrink-0 space-y-2 rounded-md border p-3"
          >
            {item.imageUrl && (
              <div className="relative h-32 w-full">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-32 w-full rounded object-cover"
                  fill
                  sizes="100%"
                />
              </div>
            )}
            <p className="line-clamp-2 text-sm font-medium">{item.title}</p>
            <p className="text-muted-foreground text-xs">{item.publishedAt}</p>
          </a>
        ))}
      </div>
    </ScrollArea>
  );
}

function EventsBody({ widget }: { widget: EventsWidget }) {
  return (
    <ul className="space-y-3">
      {widget.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-medium">{item.title}</p>
            {item.location && <p className="text-muted-foreground text-xs">{item.location}</p>}
          </div>
          <span className="text-muted-foreground text-xs whitespace-nowrap">{item.startsAt}</span>
        </li>
      ))}
    </ul>
  );
}

function AdvertsBody({ widget }: { widget: AdvertsWidget }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {widget.items.map((item) => (
        <a
          href={item.linkUrl}
          className="relative block h-42 w-full overflow-hidden rounded-md border"
          key={item.id}
          rel="noreferrer"
          target="_blank"
        >
          <Image
            src={item.imageUrl}
            alt={item.title ?? ""}
            className="h-24 w-full object-cover"
            fill
            sizes="100%"
          />
        </a>
      ))}
    </div>
  );
}

function ActivitiesBody({ widget }: { widget: ActivitiesWidget }) {
  return (
    <ul className="space-y-3">
      {widget.items.map((item) => (
        <li key={item.id} className="text-sm">
          <span className="font-medium">{item.actor}</span>{" "}
          <span className="text-muted-foreground">{item.action}</span>
          {item.target && <span className="font-medium"> {item.target}</span>}
          <p className="text-muted-foreground text-xs">{item.timestamp}</p>
        </li>
      ))}
    </ul>
  );
}

export const WidgetRenderer = ({
  widget,
  loading,
  error,
  onRefresh,
  onRemove,
  className,
}: WidgetConfig) => {
  return (
    <Card className={cn("@container/card", className)}>
      <CardHeader>
        <CardTitle>{widget.name}</CardTitle>
        {(onRefresh || onRemove) && (
          <CardAction className="flex gap-1">
            {onRefresh && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onRefresh}
                aria-label="Refresh widget"
              >
                <RefreshCw className={cn(loading && "animate-spin")} />
              </Button>
            )}
            {onRemove && (
              <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label="Remove widget">
                <X />
              </Button>
            )}
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : widget.type === "data" ? (
          <DataBody widget={widget} />
        ) : widget.type === "news" ? (
          <NewsBody widget={widget} />
        ) : widget.type === "events" ? (
          <EventsBody widget={widget} />
        ) : widget.type === "adverts" ? (
          <AdvertsBody widget={widget} />
        ) : (
          <ActivitiesBody widget={widget} />
        )}
      </CardContent>
    </Card>
  );
};
