import { XMLParser } from "fast-xml-parser";
import type { RawItem } from "../types";
import { stripHtml, toISODate } from "../classify";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_", textNodeName: "#text" });

const arr = <T,>(v: T | T[] | undefined): T[] => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const text = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "object") return String((v as Record<string, unknown>)["#text"] ?? "");
  return String(v);
};

/** Parse RSS 2.0, RSS 1.0 (RDF) or Atom into raw items. */
export function parseFeed(xml: string): RawItem[] {
  const doc = parser.parse(xml);

  // RSS 2.0
  if (doc.rss?.channel) {
    return arr(doc.rss.channel.item).map((it: Record<string, unknown>) => ({
      externalId: text(it.guid) || undefined,
      title: stripHtml(text(it.title)) ?? "",
      url: text(it.link),
      date: toISODate(text(it.pubDate) || text(it["dc:date"])),
      summary: stripHtml(text(it.description)),
    }));
  }
  // RSS 1.0 / RDF
  if (doc["rdf:RDF"]) {
    return arr(doc["rdf:RDF"].item).map((it: Record<string, unknown>) => ({
      title: stripHtml(text(it.title)) ?? "",
      url: text(it.link),
      date: toISODate(text(it["dc:date"])),
      summary: stripHtml(text(it.description)),
    }));
  }
  // Atom
  if (doc.feed) {
    return arr(doc.feed.entry).map((e: Record<string, unknown>) => {
      const links = arr(e.link as Record<string, string> | Record<string, string>[]);
      const alt = links.find((l) => !l["@_rel"] || l["@_rel"] === "alternate") ?? links[0];
      return {
        externalId: text(e.id) || undefined,
        title: stripHtml(text(e.title)) ?? "",
        url: alt?.["@_href"] ?? "",
        date: toISODate(text(e.updated) || text(e.published)),
        summary: stripHtml(text(e.summary) || text(e.content)),
      };
    });
  }
  throw new Error("Unrecognised feed format (not RSS or Atom)");
}
