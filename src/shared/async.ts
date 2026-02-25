export type AsyncResourceState<T> = {
  data: T | null
  loading: boolean
  error: string
  requestId: number
}

export const emptyAsyncResourceState = <T>(): AsyncResourceState<T> => ({
  data: null,
  loading: false,
  error: '',
  requestId: 0,
})
