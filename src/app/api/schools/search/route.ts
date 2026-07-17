import { getAllSchools } from "@/lib/schools";
import { matchesSchoolQuery } from "@/lib/pinyin";

export const dynamic = "force-dynamic";

const MAX_Q = 40;
const MAX_RESULTS = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim().slice(0, MAX_Q);
  if (q.length < 1) {
    return Response.json({ ok: true, items: [] });
  }

  try {
    const schools = await getAllSchools();
    const items = schools
      .filter((s) =>
        matchesSchoolQuery(q, {
          name: s.name,
          shortName: s.shortName,
          district: s.district,
        })
      )
      .slice(0, MAX_RESULTS)
      .map((s) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        district: s.district,
        type: s.type,
      }));

    return Response.json({ ok: true, items });
  } catch (error) {
    console.error("[schools/search]", error);
    return Response.json({ ok: false, error: "搜索失败", items: [] }, { status: 500 });
  }
}
