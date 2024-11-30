<script lang="ts" setup>
import { reset } from '@formkit/core'

const emit = defineEmits<{ refresh: [] }>()

const props = defineProps<{ current: CampaignFull }>()

const campaign = useCampaigns()
const toast = useToast()
const { t } = useI18n()
const modal = useModal()
const { ask } = useConfirm()
const isSmall = useMediaQuery('(max-width: 768px)')

const members = computed<(TeamMemberFull & { invite?: boolean })[]>(() => {
  return [
    {
      user: props.current.created_by,
      role: 'Owner' as UserRole,
      id: 0,
    },
    ...(props.current.team || []),
    ...(props.current.join_campaign?.map(join => ({ ...join, invite: true })) || []),
  ]
})

async function updateCampaign(form: CampaignForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const formData = sanitizeForm<CampaignForm>(form)

    await campaign.updateCampaign(formData, props.current.id)

    toast.success({ title: t('pages.campaign.toast.update') })
  }
  catch (err: any) {
    reset('form')
    toast.error()
    node.setErrors(err.message)
  }
}

async function changeRole(form: UpdateRoleForm, node: FormNode): Promise<void> {
  node.clearErrors()

  try {
    const { role, id } = sanitizeForm<UpdateRoleForm>(form)

    await campaign.updateCampaignTeamMember({ role }, +id)
  }
  catch (err: any) {
    toast.error()
    node.setErrors(err.message)
  }
}

function inviteTeamMember(): void {
  modal.open({
    component: 'InviteMember',
    header: t(`components.inviteMember.title`, { campaign: props.current.title }),
    props: { current: props.current },
    events: { finished: () => emit('refresh') },
  })
}

async function removeTeamMember(member: TeamMemberFull & { invite?: boolean }): Promise<void> {
  const id = member.id

  ask({
    title: member.user.username,
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    try {
      if (member.invite) await campaign.deleteJoinCampaignToken(id)
      else await campaign.deleteCampaignTeamMember(id)

      emit('refresh')
    }
    catch (err) {
      toast.error()
    }
  })
}
</script>

<template>
  <section class="space-y-2">
    <div class="flex flex-col lg:flex-row justify-between gap-x-10 gap-y-4 py-6 border-b-2 border-slate-700">
      <div class="md:min-w-[300px]">
        <h2>
          {{ t('pages.campaign.settings.access') }}
          <span class="text-[12px]">
            (max 10)
          </span>
        </h2>
      </div>
      <div class="grow max-w-4xl">
        <Card class="overflow-x-auto overflow-y-hidden w-full">
          <div
            v-for="member in members"
            :key="member.user.id"
            class="grid sm:grid-cols-3 gap-x-4 gap-y-2 sm:items-center sm:justify-between body-small border-b border-slate-700 mb-2 pb-1 last:border-none last:mb-0 last:pb-0"
          >
            <Avatar
              :username="member.user.username"
              :img="member.user.avatar"
              :name="member.user.name"
              trigger=""
              show-name
            />
            <div
              v-if="member?.invite"
              class="flex items-center gap-2"
            >
              <Icon
                name="mingcute:invite-line"
                :aria-hidden="true"
                class="size-6"
              />
              <span class="text-slate-300">
                {{ t('general.invited') }}
              </span>
            </div>
            <div v-else-if="member.role === 'Owner'">
              {{ t(`general.roles.Owner.title`) }}
            </div>
            <FormKit
              v-else
              type="form"
              :submit-label="t('pages.campaigns.update')"
              form-class="flex items-center gap-2"
              @submit="changeRole"
            >
              <FormKit
                :value="member.role"
                name="role"
                type="select"
                :options="[
                  { value: 'Viewer', label: t('general.roles.Viewer.title') },
                  { value: 'Admin', label: t('general.roles.Admin.title') },
                ]"
                outer-class="$remove:mb-4 w-full"
                inner-class="$remove:mb-1"
              />
              <FormKit
                name="id"
                type="hidden"
                :value="member.id.toString()"
              />
              <template #actions="{ value }">
                <ClientOnly>
                  <AnimationReveal>
                    <button
                      v-if="value?.role && value.role !== member.role"
                      v-tippy="t('actions.save')"
                      :aria-label="t('actions.save')"
                      class="icon-btn-success"
                    >
                      <Icon
                        name="ic:outline-save"
                        class="size-6"
                        aria-hidden="true"
                      />
                    </button>
                  </AnimationReveal>
                </ClientOnly>
              </template>
            </FormKit>
            <div class="flex sm:justify-end items-center">
              <button
                v-tippy="t('actions.delete')"
                :disabled="member.role === 'Owner'"
                :aria-label="t('actions.delete')"
                class="icon-btn-danger"
                @click="removeTeamMember(member)"
              >
                <Icon
                  name="material-symbols:delete-outline-rounded"
                  class="size-6"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </Card>
        <button
          class="btn-black w-full mt-4"
          :aria-label="t('pages.campaign.settings.add')"
          :disabled="[...current.team, ...current.join_campaign].length >= 9"
          @click="inviteTeamMember"
        >
          {{ t('pages.campaign.settings.add') }}
        </button>
      </div>
    </div>

    <div class="flex flex-col md:flex-row justify-between gap-x-10 gap-y-4 pt-6">
      <div class="md:min-w-[300px]">
        <h2>
          {{ t('pages.campaign.settings.campaign') }}
        </h2>
      </div>
      <div class="grow max-w-4xl">
        <FormKit
          id="form"
          type="form"
          :submit-label="t('pages.campaigns.update')"
          @submit="updateCampaign"
        >
          <FormKit
            :value="current.title"
            name="title"
            :label="t('components.inputs.titleLabel')"
            validation="required|length:3,30"
          />
        </FormKit>
      </div>
    </div>
    <!--
    <ConfirmationModal
      v-if="selectedTeamMember || selectedInvite"
      :open="needConfirmation"
      :title="selectedTeamMember?.user.username || selectedInvite!.user.username"
      @close="needConfirmation = false"
      @delete="handleDelete"
    />
    <UserModal
      v-if="store.campaign"
      :open="isOpen"
      :campaign="store.campaign"
      @close="isOpen = false"
    /> -->
  </section>
</template>
