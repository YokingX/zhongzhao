/**
 * D1 / Worker 查询护栏 — 防止全量加载与参数超限导致 1102 或超时。
 * 新增动态页查询时请遵守这些上限。
 */
export const D1_MAX_BINDS = 99;

/** 分数线列表每页条数 */
export const SCORES_PAGE_SIZE = 50;

/** 单次 SQL 返回分数线行数硬上限（分页查询不得超过） */
export const SCORES_QUERY_MAX_ROWS = 200;

/** 学校库每页条数 */
export const SCHOOLS_PAGE_SIZE = 24;

/** 全量加载仅允许在 SSG / 构建脚本中使用 */
export const FORBIDDEN_RUNTIME_FULL_LOAD = true as const;
