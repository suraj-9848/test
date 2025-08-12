// Minimal shims to satisfy TS typecheck for third-party libs used in charts/exports
// Remove these if/when upstream types resolve correctly in your environment.
declare module "recharts" {
  import * as React from "react";
  export const ResponsiveContainer: React.ComponentType<any>;
  export const PieChart: React.ComponentType<any>;
  export const Pie: React.ComponentType<any>;
  export const Cell: React.ComponentType<any>;
  export const Tooltip: React.ComponentType<any>;
  export const Legend: React.ComponentType<any>;
  export const BarChart: React.ComponentType<any>;
  export const Bar: React.ComponentType<any>;
  export const XAxis: React.ComponentType<any>;
  export const YAxis: React.ComponentType<any>;
  export const CartesianGrid: React.ComponentType<any>;
}

declare module "xlsx" {
  export type WorkBook = any;
  export type WorkSheet = any;
  export const utils: {
    book_new(): WorkBook;
    json_to_sheet(data: any[]): WorkSheet;
    book_append_sheet(wb: WorkBook, ws: WorkSheet, name?: string): void;
  };
  export function writeFile(wb: WorkBook, filename: string): void;
}
