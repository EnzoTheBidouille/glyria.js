export type ExtendClient<T, TClient> = Omit<T, "client"> & {
  client: TClient
}
