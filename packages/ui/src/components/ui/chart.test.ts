import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import { createElement } from "react";

describe("ChartContainer", () => {
  it("ChartContainer_WhenCallerPassesStyle_ShouldKeepSeriesColorVariables", async () => {
    const { ChartContainer } = await import("./chart");

    const props = {
      config: { voluntary: { label: "Voluntary", color: "#ea580c" } },
      style: { height: 380 },
      children: createElement("div"),
    } as unknown as ComponentProps<typeof ChartContainer>;

    const html = renderToStaticMarkup(createElement(ChartContainer, props));

    // The height the caller asked for survives...
    expect(html).toContain("height:380px");
    // ...and so does the series colour variable it used to clobber.
    expect(html).toContain("--color-voluntary:#ea580c");
  });
});
