<script setup lang="ts">
import { reset } from '@formkit/core'

const emit = defineEmits<{
  close: []
  finished: []
}>()

const props = defineProps<{ current: CampaignFull }>()

const campaign = useCampaigns()
const profile = useProfile()
const toast = useToast()
const { t } = useI18n()
const localePath = useLocalePath()

const noUser = ref<string>()
const form = ref<{ users: AddMemberForm[] }>({ users: [] })

async function handleSearch({ email }: { email: string }, node: FormNode): Promise<void> {
  node.clearErrors()
  noUser.value = undefined

  try {
    const error = validateUser(email)

    if (error) throw createError(error)

    const user = await profile.getProfile({ email })

    if (user) {
      form.value.users.push({
        id: user.id,
        role: 'Viewer',
        profile: user,
      })
    }
    else noUser.value = email

    reset('search')
  }
  catch (err: any) {
    reset('search')

    if (['self', 'alreadyAdded', 'alreadyInvited', 'alreadySelected', 'maxMembers'].includes(err.message)) {
      node.setErrors(t(`components.inviteMember.errors.${err.message}`))
    }
    else {
      node.setErrors(err.message)
    }
  }
}

function validateUser(email: string): string | undefined {
  const { team, join_campaign, created_by } = props.current

  if (email === profile.data?.email) return 'self'
  else if (join_campaign.some(({ user }) => user.email === email)) return 'alreadyInvited'
  else if (form.value.users.some(({ profile }) => profile.email === email)) return 'alreadySelected'
  else if ([...form.value.users, ...team, ...join_campaign].length >= 9) return 'maxMembers'
  else if (
    created_by.email === email
    || team.some(({ user }) => user.email === email)
  ) return 'alreadyAdded'
}

async function handleSubmit(form: InviteMemberForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { users } = sanitizeForm<InviteMemberForm>(form)

    await Promise.all(users.map(async user => addTeamMember(user)))

    toast.success({
      title: t('components.inviteMember.toast.invited.title'),
      text: t('components.inviteMember.toast.invited.text'),
    })

    emit('finished')
    emit('close')
  }
  catch (err: any) {
    reset('form')
    node.setErrors(err.message)
  }
}

async function addTeamMember(user: AddMemberForm): Promise<void> {
  const token = await campaign.addJoinCampaignToken({
    user: user.id,
    campaign: props.current.id,
    role: user.role,
  })

  await $fetch('/api/emails/campaign-invite', {
    method: 'POST',
    body: {
      email: user.profile.email,
      username: user.profile.username,
      campaign: props.current.title,
      invitedBy: profile.data!.username || 'Owner',
      inviteLink: `https://dnd-tracker.com${localePath('/campaigns/join')}?token=${token}&campaign=${props.current.id}`,
    },
  })
}

async function inviteNewUser(email: string): Promise<void> {
  await $fetch('/api/emails/campaign-invite-no-user', {
    method: 'POST',
    body: {
      email,
      campaign: props.current.title,
      invitedBy: profile.data!.username || 'Owner',
    },
  })

  noUser.value = undefined
}
</script>

<template>
  <!-- Search form -->
  <FormKit
    id="search"
    type="form"
    :actions="false"
    @submit="handleSearch"
  >
    <div class="flex flex-col sm:flex-row sm:items-center gap-2">
      <FormKit
        name="email"
        type="search"
        prefix-icon="search"
        :placeholder="t('components.inputs.searchByEmail')"
        outer-class="$reset !mb-0 grow"
        validation="required|email"
      />
      <FormKit
        type="submit"
        outer-class="$reset !mb-0"
        input-class="$remove:btn-black btn-primary"
        :aria-label="t('actions.search')"
      >
        {{ t('actions.search') }}
      </FormKit>
    </div>
  </FormKit>
  <!-- No user cta -->
  <AnimationExpand>
    <Card
      v-if="noUser"
      color="warning"
      class="flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl my-4"
    >
      <p class="body-small">
        {{ t('components.inviteMember.errors.noUser', { email: noUser }) }}
      </p>
      <div class="flex justify-end">
        <button
          class="btn-primary whitespace-nowrap"
          @click="inviteNewUser(noUser)"
        >
          {{ t('actions.invite') }}
        </button>
      </div>
    </Card>
  </AnimationExpand>
  <!-- Users form -->
  <AnimationExpand>
    <FormKit
      v-if="form.users.length"
      id="form"
      v-model="form"
      type="form"
      :submit-label="t('components.inviteMember.invite')"
      :submit-attrs="{ wrapperClass: 'mt-4' }"
      form-class="pt-4"
      @submit="handleSubmit"
    >
      <FormKit
        v-slot="{ value }"
        type="list"
        name="users"
        dynamic
        class="border-2 border-slate-700 rounded-lg p-4 mb-4"
      >
        <FormKit
          v-for="(item, index) in (value as AddMemberForm[])"
          :key="item.id"
          type="group"
          :index="index"
        >
          <div class="grid sm:grid-cols-3 items-center gap-4 border-t-2 border-slate-700 py-2 first:pt-0 first:border-t-0">
            <Avatar
              v-if="item.profile"
              :img="item.profile.avatar"
              :username="item.profile.username"
              :name="item.profile.name"
              show-name
              trigger=""
            />
            <FormKit
              name="role"
              type="select"
              :options="[
                { value: 'Viewer', label: t('general.roles.Viewer.title') },
                { value: 'Admin', label: t('general.roles.Admin.title') },
              ]"
              validation="required"
              outer-class="$remove:mb-4 w-[200px]"
              inner-class="$remove:mb-1"
            />
            <div class="sm:flex justify-end">
              <button
                v-tippy="t('actions.delete')"
                :aria-label="t('actions.delete')"
                class="icon-btn-danger"
                @click="form.users.splice(index, 1)"
              >
                <Icon
                  name="material-symbols:delete-outline-rounded"
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
          <FormKit
            type="hidden"
            name="id"
            validation="required"
            :value="item.id"
          />
        </FormKit>
      </FormKit>
    </FormKit>
  </AnimationExpand>
</template>
