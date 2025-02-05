<script setup lang="ts">
import { useToast } from '~/components/ui/toast/use-toast'
import { togglePasswordInput } from '~/utils/ui-helpers'

useSeo('Reset password')

const { t } = useI18n()
const { toast } = useToast()
const localePath = useLocalePath()
const route = useRoute()
const supabase = useSupabaseClient<Database>()

onMounted(() => checkIfError())

function checkIfError(): void {
  const { error } = route.query

  if (error) {
    navigateTo(localePath('/forgot-password'))

    toast({
      title: t('pages.resetPassword.toast.error.title'),
      description: t('pages.resetPassword.toast.error.text'),
      variant: 'destructive',
    })
  }
}

async function resetPassword({ password }: ResetPassword, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { error } = await supabase.auth.updateUser({ password })

    if (error) throw createError(error)

    toast({
      description: t('pages.resetPassword.toast.success.text'),
      variant: 'success',
    })

    navigateTo(localePath('/'))
  }
  catch (err: any) {
    node.setErrors(err.message)

    toast({
      title: t('general.error.title'),
      description: t('general.error.text'),
      variant: 'destructive',
    })
  }
}
</script>

<template>
  <NuxtLayout name="centered">
    <template #header>
      <h1 class="text-center pb-10">
        {{ $t('pages.resetPassword.title') }}
      </h1>
    </template>

    <FormKit
      type="form"
      :submit-label="$t('pages.resetPassword.reset')"
      @submit="resetPassword"
    >
      <FormKit
        name="password"
        type="password"
        suffix-icon="eye"
        :label="$t('components.inputs.passwordLabel')"
        validation="required|length:6,50|contains_lowercase|contains_uppercase|contains_alpha|contains_numeric|contains_symbol"
        @suffix-icon-click="togglePasswordInput"
      />
    </FormKit>

    <template #footer>
      <div class="flex flex-wrap gap-2 justify-center">
        <NuxtLinkLocale
          to="/"
          class="btn-text"
        >
          {{ $t('actions.cancel') }}
        </NuxtLinkLocale>
      </div>
    </template>
  </NuxtLayout>
</template>
