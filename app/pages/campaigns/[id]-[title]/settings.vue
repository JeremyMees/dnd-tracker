<script lang="ts" setup>
import { reset } from '@formkit/core'
import { useToast } from '~/components/ui/toast/use-toast'
import { useCampaignUpdate } from '~~/queries/campaigns'
import { useTeamMemberUpdate, useTeamMemberRemove, useJoinTokenRemove } from '~~/queries/team-members'

useSeo('Campaign settings')

const props = defineProps<{
  current?: CampaignFull
  campaignId: number
}>()

const user = useAuthenticatedUser()
const { toast } = useToast()
const { t } = useI18n()
const modal = useModal()
const { ask } = useConfirm()
const localePath = useLocalePath()

const members = computed<(TeamMemberFull & { invite?: boolean })[]>(() => {
  if (!props.current) return []

  return [
    {
      user: {
        ...props.current.created_by,
        subscription_type: 'pro' as SubscriptionType,
      },
      role: 'Owner' as UserRole,
      id: 0,
    },
    ...props.current.team,
    ...props.current.join_campaign.map(join => ({ ...join, invite: true })),
  ]
})

const { mutateAsync: updateCampaign } = useCampaignUpdate()
const { mutateAsync: updateTeamMember } = useTeamMemberUpdate()
const { mutateAsync: removeTeamMember } = useTeamMemberRemove()
const { mutateAsync: removeJoinCampaignToken } = useJoinTokenRemove()

interface CampaignForm { title: string }
interface UpdateRoleForm { role: UserRole, id: string }

async function update(form: CampaignForm, node: FormNode): Promise<void> {
  node.clearErrors()

  await updateCampaign({
    data: sanitizeForm<CampaignForm>(form),
    id: props.campaignId,
    onError: (error) => {
      reset('form')
      node.setErrors(error)
    },
  })
}

async function changeRole(form: UpdateRoleForm, node: FormNode): Promise<void> {
  node.clearErrors()

  const { role, id } = sanitizeForm<UpdateRoleForm>(form)

  await updateTeamMember({
    data: { role },
    id: +id,
    campaign: props.campaignId,
    onError: (error) => {
      node.setErrors(error)
    },
  })
}

function invite(): void {
  if (!props.current) return

  modal.open({
    component: 'InviteMember',
    header: t(`components.inviteMember.title`, { campaign: props.current.title }),
    props: { current: props.current },
  })
}

async function remove(member: TeamMemberFull & { invite?: boolean }): Promise<void> {
  const id = member.id
  const self = member.user.id === user.value.id
  const campaign = props.campaignId

  ask({
    title: self
      ? t('pages.campaign.settings.dialog.leave.title')
      : t('pages.campaign.settings.dialog.remove.title', { user: member.user.username }),
    description: self
      ? t('pages.campaign.settings.dialog.leave.text')
      : t('pages.campaign.settings.dialog.remove.text', { user: member.user.username }),
  }, async (confirmed: boolean) => {
    if (!confirmed) return

    const onSuccess = () => {
      if (self) navigateTo(localePath('/campaigns'))
    }

    const onError = () => {
      toast({
        title: t('general.error.title'),
        description: t('general.error.text'),
        variant: 'destructive',
      })
    }

    if (member.invite) await removeJoinCampaignToken({ id, campaign, onSuccess, onError })
    else await removeTeamMember({ member: id, campaign, onSuccess, onError })
  })
}
</script>

<template>
  <section class="space-y-2">
    <div class="flex flex-col lg:flex-row justify-between gap-x-10 gap-y-4 py-6 border-b-2 border-secondary">
      <div class="lg:min-w-[300px] lg:max-w-[300px]">
        <h2>
          {{ $t('pages.campaign.settings.access') }}
          <span class="text-[12px]">
            (max 10)
          </span>
        </h2>
      </div>
      <div class="grow max-w-4xl">
        <Card
          color="secondary"
          class="overflow-x-auto overflow-y-hidden w-full"
        >
          <ClientOnly>
            <template v-if="members.length > 0">
              <div
                v-for="member in members"
                :key="member.user.id"
                class="grid sm:grid-cols-3 gap-x-4 gap-y-2 sm:items-center sm:justify-between text-sm border-b border-secondary mb-2 pb-1 last:border-none last:mb-0 last:pb-0"
              >
                <div class="flex items-center gap-2">
                  <UiAvatar
                    v-tippy="`${member.user.username} ${member.role ? `(${member.role})` : ''}`"
                    class="border-2 border-background"
                  >
                    <UiAvatarImage
                      :src="member.user.avatar"
                      :alt="member.user.username"
                    />
                    <UiAvatarFallback>
                      <Icon
                        name="tabler:user"
                        class="size-6 min-w-6 text-muted-foreground"
                      />
                    </UiAvatarFallback>
                  </UiAvatar>
                  <div class="flex flex-col">
                    <span class="font-bold">
                      {{ member.user.username }}
                    </span>
                    <span class="text-muted-foreground">
                      {{ member.user.name }}
                    </span>
                  </div>
                </div>
                <div
                  v-if="member?.invite"
                  class="flex items-center gap-2"
                >
                  <Icon
                    name="tabler:send"
                    :aria-hidden="true"
                    class="size-4 text-muted-foreground"
                  />
                  <span>
                    {{ $t('general.invited') }}
                  </span>
                </div>
                <div v-else-if="member.role === 'Owner'">
                  {{ $t(`general.roles.Owner.title`) }}
                </div>
                <FormKit
                  v-else
                  type="form"
                  :submit-label="$t('pages.campaigns.update')"
                  form-class="flex items-center gap-2"
                  @submit="changeRole"
                >
                  <FormKit
                    :value="member.role"
                    name="role"
                    type="select"
                    :options="[
                      { value: 'Viewer', label: $t('general.roles.Viewer.title') },
                      { value: 'Admin', label: $t('general.roles.Admin.title') },
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
                          v-tippy="$t('actions.save')"
                          :aria-label="$t('actions.save')"
                          class="icon-btn-success mr-1"
                        >
                          <Icon
                            name="tabler:device-floppy"
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
                    v-tippy="$t('actions.delete')"
                    :disabled="member.role === 'Owner'"
                    :aria-label="$t('actions.delete')"
                    class="icon-btn-destructive"
                    @click="remove(member)"
                  >
                    <Icon
                      name="tabler:trash"
                      class="size-6"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <SkeletonMemberRow
                v-for="i in 3"
                :key="i"
              />
            </template>

            <template #fallback>
              <SkeletonMemberRow
                v-for="i in 3"
                :key="i"
              />
            </template>
          </ClientOnly>
        </Card>
        <ClientOnly>
          <button
            class="btn-foreground w-full mt-4"
            :aria-label="$t('pages.campaign.settings.add')"
            :disabled="[...(current?.team || []), ...(current?.join_campaign || [])].length >= 9"
            @click="invite"
          >
            {{ $t('pages.campaign.settings.add') }}
          </button>

          <template #fallback>
            <UiSkeleton class="w-full h-12 rounded-lg mt-4" />
          </template>
        </ClientOnly>
      </div>
    </div>

    <div class="flex flex-col lg:flex-row justify-between gap-x-10 gap-y-4 pt-6">
      <div class="lg:min-w-[300px] lg:max-w-[300px]">
        <h2>
          {{ $t('pages.campaign.settings.campaign') }}
        </h2>
      </div>
      <div class="grow max-w-4xl">
        <ClientOnly>
          <template v-if="current">
            <FormKit
              id="form"
              type="form"
              :submit-label="$t('pages.campaigns.update')"
              @submit="update"
            >
              <FormKit
                :value="current.title"
                name="title"
                :label="$t('components.inputs.titleLabel')"
                validation="required|length:3,30"
              />
            </FormKit>
          </template>
          <div
            v-else
            class="flex flex-col gap-y-4"
          >
            <SkeletonInput />
            <UiSkeleton class="w-full h-12 rounded-lg" />
          </div>

          <template #fallback>
            <div class="flex flex-col gap-y-4">
              <SkeletonInput />
              <UiSkeleton class="w-full h-12 rounded-lg" />
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </section>
</template>
