const piiKeys = { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] }

export const dataCollection = {
  userInfo: false,
  cookies: false,
  httpHeaders: { request: piiKeys, response: piiKeys },
  httpBodies: [],
  urlQueryParams: piiKeys,
  genAI: { inputs: false, outputs: false },
  databaseQueryData: false,
  graphQL: { document: false, variables: false },
}
