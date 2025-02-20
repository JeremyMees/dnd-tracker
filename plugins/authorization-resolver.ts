export default defineNuxtPlugin({
  name: 'authorization-resolver',
  parallel: true,
  setup() {
    return {
      provide: {
        authorization: {
          resolveClientUser: () => useAuthenticatedUser().value,
        },
      },
    }
  },
})
