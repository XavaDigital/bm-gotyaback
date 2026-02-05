/**
 * Pagination utilities for API responses
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Extract and validate pagination parameters from query string
 * @param query - Express request query object
 * @param defaultLimit - Default items per page (default: 20)
 * @param maxLimit - Maximum items per page (default: 100)
 */
export const getPaginationParams = (
  query: any,
  defaultLimit: number = 20,
  maxLimit: number = 100
): Required<PaginationParams> => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit) || defaultLimit),
    maxLimit
  );

  return { page, limit };
};

/**
 * Calculate skip value for database queries
 */
export const getSkipValue = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1,
  };
};

/**
 * Create a paginated response object
 */
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  return {
    data,
    pagination: createPaginationMeta(total, page, limit),
  };
};

/**
 * Helper to execute a paginated query
 * @param query - Mongoose query object
 * @param countQuery - Mongoose count query object (should have same filters as query)
 * @param page - Page number
 * @param limit - Items per page
 */
export const executePaginatedQuery = async <T>(
  query: any,
  countQuery: any,
  page: number,
  limit: number
): Promise<PaginatedResponse<T>> => {
  const skip = getSkipValue(page, limit);

  const [data, total] = await Promise.all([
    query.skip(skip).limit(limit),
    countQuery.countDocuments(),
  ]);

  return createPaginatedResponse(data, total, page, limit);
};

