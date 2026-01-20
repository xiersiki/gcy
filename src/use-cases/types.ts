export type UseCaseError<Code extends string = string> = {
  code: Code
  message: string
  status: number
}

export type UseCaseResult<T, Code extends string = string> =
  | { ok: true; data: T }
  | { ok: false; error: UseCaseError<Code> }
