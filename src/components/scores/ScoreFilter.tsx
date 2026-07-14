interface ScoreFilterProps {
  years: number[];
  currentDistrict?: string;
  currentBatch?: string;
  currentYear?: string;
  currentQuery?: string;
  currentMinScore?: string;
  currentMaxScore?: string;
}

export function ScoreFilter({
  years,
  currentDistrict,
  currentBatch,
  currentYear,
  currentQuery,
  currentMinScore,
  currentMaxScore,
}: ScoreFilterProps) {
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action="/scores"
      method="get"
    >
      {currentDistrict && <input type="hidden" name="district" value={currentDistrict} />}
      <div className="min-w-0 flex-1 sm:min-w-[10rem]">
        <label htmlFor="query" className="mb-1.5 block text-sm font-medium">
          搜索学校
        </label>
        <input
          id="query"
          name="query"
          type="search"
          defaultValue={currentQuery}
          placeholder="学校名称或拼音"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="w-full sm:w-36">
        <label htmlFor="batch" className="mb-1.5 block text-sm font-medium">
          录取批次
        </label>
        <select
          id="batch"
          name="batch"
          defaultValue={currentBatch || "全部"}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="全部">全部</option>
          <option value="提前招生">提前招生</option>
          <option value="指标分配">指标分配</option>
          <option value="统一招生">统一招生</option>
        </select>
      </div>
      <div className="w-full sm:w-28">
        <label htmlFor="year" className="mb-1.5 block text-sm font-medium">
          年份
        </label>
        <select
          id="year"
          name="year"
          defaultValue={currentYear || "全部"}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="全部">全部</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="w-full sm:w-28">
        <label htmlFor="minScore" className="mb-1.5 block text-sm font-medium">
          最低分
        </label>
        <input
          id="minScore"
          name="minScore"
          type="number"
          defaultValue={currentMinScore}
          placeholder="如 450"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="w-full sm:w-28">
        <label htmlFor="maxScore" className="mb-1.5 block text-sm font-medium">
          最高分
        </label>
        <input
          id="maxScore"
          name="maxScore"
          type="number"
          defaultValue={currentMaxScore}
          placeholder="如 500"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        查询
      </button>
    </form>
  );
}
