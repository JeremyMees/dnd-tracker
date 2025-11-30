<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { useToast } from '~/components/ui/toast/use-toast'
import { useJoinTokenCreate } from '~~/queries/team-members'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import * as z from 'zod'

const emit = defineEmits<{ close: [] }>()

const props = defineProps<{ current: CampaignFull }>()

const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()
const localePath = useLocalePath()
const queryClient = useQueryClient()
const supabase = useSupabaseClient<DB>()

const { mutateAsync: createJoinCampaignToken } = useJoinTokenCreate()

const formError = ref<string>('')
const searchFormError = ref<string>('')
const foundUsers = ref<FoundUser[]>([])
const noUser = ref<string>()
const search = ref<string>()

const formSchema = toTypedSchema(z.object({
  users: z.array(z.object({
    id: z.string(),
    role: z.string(),
    profile: z.object({
      id: z.string(),
      username: z.string(),
      name: z.string(),
      avatar: z.string(),
      email: z.string().email(),
    }),
  })).min(1),
}))

const form = useForm({
  validationSchema: formSchema,
  initialValues: {
    users: foundUsers.value,
  },
})

interface FoundUser {
  id: string
  role: string
  profile: Profile
}

watch(foundUsers, newUsers => form.setValues({ users: newUsers }), { deep: true })
watchDebounced(search, () => handleSearch(), { debounce: 500, maxWait: 1000 })

async function handleSearch(): Promise<void> {
  searchFormError.value = ''
  const email = search.value

  if (z.string().email().safeParse(email).success === false) {
    searchFormError.value = t('zod.invalidEmail')
    return
  }

  try {
    const error = validateUser(email ?? '')

    if (error) throw createError(error)

    const user = await queryClient.fetchQuery({
      queryKey: ['useProfileDetailMinimal', { email }],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, name, avatar, email')
          .ilike('email', `%${email}%`)
          .maybeSingle()

        if (error) throw createError(error)
        return data
      },
    })

    if (user) {
      foundUsers.value.push({
        id: user.id,
        role: 'Viewer',
        profile: user,
      })

      noUser.value = undefined
    }
    else noUser.value = email
  }
  catch ({ message }: any) {
    if (['self', 'alreadyAdded', 'alreadyInvited', 'alreadySelected', 'maxMembers'].includes(message)) {
      searchFormError.value = t(`components.inviteMember.errors.${message}`)
    }
    else {
      searchFormError.value = message
    }
  }
}

function validateUser(email: string): string | undefined {
  const { team, join_campaign, created_by } = props.current

  if (email === user.value.email) return 'self'
  else if (join_campaign.some(({ user }) => user.email === email)) return 'alreadyInvited'
  else if (foundUsers.value.some(({ profile }) => profile.email === email)) return 'alreadySelected'
  else if ([...foundUsers.value, ...team, ...join_campaign].length >= 9) return 'maxMembers'
  else if (created_by.email === email || team.some(({ user }) => user.email === email)) return 'alreadyAdded'
}

const onSubmit = form.handleSubmit(async (values) => {
  formError.value = ''

  try {
    await Promise.all(values.users.map(async user => addTeamMember(user)))

    queryClient.invalidateQueries({ queryKey: ['useCampaignDetail', props.current.id] })
    queryClient.invalidateQueries({ queryKey: ['useCampaignListing'] })

    toast({
      title: t('components.inviteMember.toast.invited.title'),
      description: t('components.inviteMember.toast.invited.text'),
      variant: 'success',
    })

    emit('close')
  }
  catch (err: any) {
    formError.value = err.message || t('general.error.text')
  }
})

async function addTeamMember(member: FoundUser): Promise<void> {
  if (member.role !== 'Admin' && member.role !== 'Viewer') return

  const token = await createJoinCampaignToken({
    data: {
      user: member.id,
      campaign: props.current.id,
      role: member.role,
    },
    onError: (error: string) => {
      throw createError(error)
    },
  })

  await $fetch('/api/emails/campaign-invite', {
    method: 'POST',
    body: {
      email: member.profile.email,
      username: member.profile.username,
      campaign: props.current.title,
      invitedBy: user.value.username || 'Owner',
      inviteLink: `https://dnd-tracker.com${localePath('/campaigns/join')}?token=${token}`,
    },
  })
}

async function inviteNewUser(email: string): Promise<void> {
  await $fetch('/api/emails/campaign-invite-no-user', {
    method: 'POST',
    body: {
      email,
      campaign: props.current.title,
      invitedBy: user.value.username || 'Owner',
    },
  })

  noUser.value = undefined
}
</script>

<template>
  <!-- Search form -->
  <div class="space-y-2 w-full sm:w-auto sm:flex-1">
    <UiLabel for="search">
      {{ $t('components.inputs.searchByEmail') }}
    </UiLabel>
    <UiInputGroup>
      <UiInputGroupInput
        id="search"
        v-model="search"
        name="search"
        type="search"
      />
      <UiInputGroupAddon align="inline-end">
        <Icon
          name="tabler:search"
          :aria-hidden="true"
        />
      </UiInputGroupAddon>
    </UiInputGroup>
    <p
      v-if="searchFormError"
      class="text-sm text-destructive"
    >
      {{ searchFormError }}
    </p>
  </div>

  <!-- No user cta -->
  <AnimationExpand>
    <Card
      v-if="noUser"
      color="warning"
      class="flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl my-4"
    >
      <p class="text-sm">
        {{ $t('components.inviteMember.errors.noUser', { email: noUser }) }}
      </p>
      <div class="flex justify-end">
        <UiButton
          variant="foreground"
          class="whitespace-nowrap"
          @click="inviteNewUser(noUser)"
        >
          {{ $t('actions.invite') }}
        </UiButton>
      </div>
    </Card>
  </AnimationExpand>

  <!-- Users form -->
  <AnimationExpand>
    <UiFormWrapper
      v-if="foundUsers.length"
      @submit="onSubmit"
    >
      <div class="border rounded-lg p-4 my-4">
        <div
          v-for="(foundUser, index) in foundUsers"
          :key="foundUser.id"
          class="grid sm:grid-cols-3 items-center gap-4 border-t py-2 first:pt-0 first:border-t-0"
        >
          <div class="flex items-end gap-2">
            <UiAvatar class="border-2 border-primary">
              <UiAvatarImage
                :src="foundUser.profile.avatar"
                :alt="foundUser.profile.username"
              />
              <UiAvatarFallback>
                <Icon
                  name="tabler:user"
                  class="size-6 min-w-6 text-muted-foreground"
                />
              </UiAvatarFallback>
            </UiAvatar>
            <div class="flex flex-col">
              <p class="text-sm font-bold">
                {{ foundUser.profile.username }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ $t(`general.roles.${foundUser.role}.title`) }}
              </p>
            </div>
          </div>
          <div class="col-span-2 flex items-center gap-2">
            <UiFormField
              v-slot="{ componentField }"
              :name="`users.${index}.role`"
            >
              <UiFormItem class="space-y-0 w-full">
                <UiSelect v-bind="componentField">
                  <UiFormControl>
                    <UiSelectTrigger>
                      <UiSelectValue />
                    </UiSelectTrigger>
                  </UiFormControl>
                  <UiSelectContent>
                    <UiSelectItem value="Viewer">
                      {{ $t('general.roles.Viewer.title') }}
                    </UiSelectItem>
                    <UiSelectItem value="Admin">
                      {{ $t('general.roles.Admin.title') }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
                <UiFormMessage />
              </UiFormItem>
            </UiFormField>
            <UiButton
              v-tippy="$t('actions.delete')"
              variant="destructive-ghost"
              size="icon-sm"
              type="button"
              :aria-label="$t('actions.delete')"
              @click="foundUsers.splice(index, 1)"
            >
              <Icon
                name="tabler:trash"
                aria-hidden="true"
              />
            </UiButton>
          </div>

          <input
            type="hidden"
            :name="`users.${index}.id`"
            :value="foundUser.id"
          >
          <input
            type="hidden"
            :name="`users.${index}.profile.id`"
            :value="foundUser.profile.id"
          >
          <input
            type="hidden"
            :name="`users.${index}.profile.username`"
            :value="foundUser.profile.username"
          >
          <input
            type="hidden"
            :name="`users.${index}.profile.email`"
            :value="foundUser.profile.email"
          >
          <input
            type="hidden"
            :name="`users.${index}.profile.name`"
            :value="foundUser.profile.name"
          >
          <input
            type="hidden"
            :name="`users.${index}.profile.avatar`"
            :value="foundUser.profile.avatar"
          >
        </div>
      </div>
      <div
        v-if="formError"
        class="text-sm text-destructive"
      >
        {{ formError }}
      </div>
      <UiButton
        type="submit"
        class="w-full"
      >
        {{ $t('components.inviteMember.invite') }}
      </UiButton>
    </UiFormWrapper>
  </AnimationExpand>
</template>
