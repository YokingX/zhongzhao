interface ScoreFilterProps {
  districts: string[];
  years: number[];
  currentDistrict?: string;
  currentBatch?: string;
  currentYear?: string;
  currentQuery?: string;
  currentMinScore?: string;
  currentMaxScore?: string;
}

export function ScoreFilter({
  districts,
  years,
  currentDistrict,
  currentBatch,
  currentYear,
  currentQuery,
  currentMinScore,
  currentMaxScore,
}: ScoreFilterProps) {
  return (
    <form className="space-y-4" action="/scores" method="get">
      <div>
        <label htmlFor="query" className="mb-1.5 block text-sm font-medium">
          搜索学校
        </label>
        <input
          id="query"
          name="query"
          type="search"
          defaultValue={currentQuery}
          placeholder="输入学校名称或拼音首字母..."
          className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="district" className="mb-1.5 block text-sm font-medium">
            行政区
          </label>
          <select
            id="district"
            name="district"
            defaultValue={currentDistrict || "全部"}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="全部">全部</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="batch" className="mb-1.5 block text-sm font-medium">
            录取批次
          </label>
          <select
            id="batch"
            name="batch"
            defaultValue={currentBatch || "全部"}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="全部">全部</option>
            <option value="提前招生">提前招生</option>
            <option value="指标分配">指标分配</option>
            <option value="统一招生">统一招生</option>
          </select>
        </div>
        <div>
          <label htmlFor="year" className="mb-1.5 block text-sm font-medium">
            年份
          </label>
          <select
            id="year"
            name="year"
            defaultValue={currentYear || "全部"}
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="全部">全部</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="minScore" className="mb-1.5 block text-sm font-medium">
            最低分
          </label>
          <input
            id="minScore"
            name="minScore"
            type="number"
            defaultValue={currentMinScore}
            placeholder="如 600"
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="maxScore" className="mb-1.5 block text-sm font-medium">
            最高分
          </label>
          <input
            id="maxScore"
            name="maxScore"
            type="number"
            defaultValue={currentMaxScore}
            placeholder="如 650"
            className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        查询
      </button>
    </form>
  );
}
