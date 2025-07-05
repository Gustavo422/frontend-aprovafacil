import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
  QueryKey,
  UseMutationResult,
  UseQueryResult,
  MutationFunction,
} from '@tanstack/react-query';

// Types for API responses
export type ApiResponse<T> = {
  data: T;
  error: ApiError | null;
  status: number;
};

export type RequestConfig = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  [key: string]: unknown;
};

export type ApiError = {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
};

// Custom type guard to check if error is an ApiError
export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'status' in error
  );
};

// Helper function to build query string from params
const buildQueryString = (params?: Record<string, string | number | boolean>): string => {
  if (!params) return '';

  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });

  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

// API client interface
interface ApiClient {
  get: <T,>(url: string, config?: RequestConfig) => Promise<ApiResponse<T>>;
  post: <T, D = unknown>(url: string, data?: D, config?: RequestConfig) => Promise<ApiResponse<T>>;
  put: <T, D = unknown>(url: string, data?: D, config?: RequestConfig) => Promise<ApiResponse<T>>;
  delete: <T,>(url: string, config?: RequestConfig) => Promise<ApiResponse<T>>;
}

const handleApiError = (error: unknown): ApiError => {
    if (isApiError(error)) {
        return error;
    }
    if (error instanceof Error) {
        return { message: error.message, status: 500 };
    }
    return { message: 'An unexpected error occurred', status: 500 };
};


// Default API client implementation using fetch
const apiClient: ApiClient = {
  get: async <T,>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> => {
    const queryString = buildQueryString(config.params);
    const fullUrl = queryString ? `${url}${queryString}` : url;
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        ...config,
      });

      const data = await response.json();

      if (!response.ok) {
        throw { message: data.message || 'Something went wrong', status: response.status, errors: data.errors };
      }

      return { data, error: null, status: response.status };
    } catch (error) {
      return {
        data: null as unknown as T,
        error: handleApiError(error),
        status: (error as ApiError).status || 500,
      };
    }
  },

  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    const queryString = buildQueryString(config.params);
    const fullUrl = queryString ? `${url}${queryString}` : url;
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: data ? JSON.stringify(data) : null,
        ...config,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw { message: responseData.message || 'Something went wrong', status: response.status, errors: responseData.errors };
      }

      return { data: responseData, error: null, status: response.status };
    } catch (error) {
      return {
        data: null as unknown as T,
        error: handleApiError(error),
        status: (error as ApiError).status || 500,
      };
    }
  },

  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> => {
    const queryString = buildQueryString(config.params);
    const fullUrl = queryString ? `${url}${queryString}` : url;
    try {
      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: data ? JSON.stringify(data) : null,
        ...config,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw { message: responseData.message || 'Something went wrong', status: response.status, errors: responseData.errors };
      }

      return { data: responseData, error: null, status: response.status };
    } catch (error) {
      return {
        data: null as unknown as T,
        error: handleApiError(error),
        status: (error as ApiError).status || 500,
      };
    }
  },

  delete: async <T,>(url: string, config: RequestConfig = {}): Promise<ApiResponse<T>> => {
    const queryString = buildQueryString(config.params);
    const fullUrl = queryString ? `${url}${queryString}` : url;
    try {
      const response = await fetch(fullUrl, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        ...config,
      });

      // For DELETE, we might not always get a response body
      const responseData = response.status !== 204 ? await response.json() : null;

      if (!response.ok) {
        throw { message: responseData?.message || 'Something went wrong', status: response.status, errors: responseData?.errors };
      }

      return { data: responseData as T, error: null, status: response.status };
    } catch (error) {
        return {
            data: null as unknown as T,
            error: handleApiError(error),
            status: (error as ApiError).status || 500,
        };
    }
  },
};

// Hook to fetch data
export const useFetch = <TData,>(
  queryKey: QueryKey,
  url: string,
  config: RequestConfig = {},
  options: Omit<UseQueryOptions<TData, ApiError, TData, QueryKey>, 'queryKey' | 'queryFn'> = {}
): UseQueryResult<TData, ApiError> => {
  return useQuery<TData, ApiError, TData, QueryKey>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.get<TData>(url, config);
      if (error) throw error;
      return data;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
  });
};

type MutationOptions<TData, TVariables> = {
    onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
    onError?: (error: ApiError, variables: TVariables, context: unknown) => void;
    config?: RequestConfig;
};

// Hook to post data
export const usePost = <TData, TVariables = unknown>(
  queryKey: QueryKey,
  url: string,
  options: MutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, ApiError, TVariables> => {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const { data, error } = await apiClient.post<TData, TVariables>(url, variables, options.config);
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

// Hook to update data
export const useUpdate = <TData, TVariables extends { id: string | number }>(
  queryKey: QueryKey,
  url: string,
  options: MutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, ApiError, TVariables> => {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (variables: TVariables) => {
      const { id, ...rest } = variables;
      const { data, error } = await apiClient.put<TData, Omit<TVariables, 'id'>>(
        `${url}/${id}`,
        rest,
        options.config
      );
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

// Hook to delete data
export const useDelete = <TData = void, TVariables = string | number>(
  queryKey: QueryKey,
  url: string,
  options: MutationOptions<TData, TVariables> = {}
): UseMutationResult<TData, ApiError, TVariables> => {
  const queryClient = useQueryClient();

  return useMutation<TData, ApiError, TVariables>({
    mutationFn: async (id: TVariables) => {
      const { data, error } = await apiClient.delete<TData>(`${url}/${id}`, options.config);
      if (error) throw error;
      return data as TData;
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

// Custom hook for optimistic updates
export const useOptimisticUpdate = <TData,>(
  queryKey: QueryKey,
) => {
  const queryClient = useQueryClient();

  const onMutate: MutationFunction<TData, Partial<TData>> = async (newData) => {
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData<TData>(queryKey);

      queryClient.setQueryData<TData>(queryKey, (old: TData | undefined) => {
          if (old === undefined) return undefined;
          return { ...old, ...newData };
      });

      return { previousData };
  };

  const onError = (err: ApiError, newData: Partial<TData>, context?: { previousData?: TData }) => {
      if (context?.previousData) {
          queryClient.setQueryData(queryKey, context.previousData);
      }
  };

  const onSettled = () => {
      queryClient.invalidateQueries({ queryKey });
  };

  return { onMutate, onError, onSettled };
};
