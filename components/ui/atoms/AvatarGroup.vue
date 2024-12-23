<script setup lang="ts">
interface Person {
  username: string
  img: string
  role?: UserRole
}

const props = withDefaults(
  defineProps<{
    owner?: MinimalProfile
    fetchId?: number
    team?: TeamMember[]
    max?: number
  }>(), {
    max: 4,
  },
)

const campaign = useCampaigns()

const persons = ref<Person[]>([])
const isFetching = ref<boolean>()

const members = teamMembersToAvatar(props.team || [])

if (props.owner?.id) {
  const ownerIsMember = (props.team || []).some(({ user }) => user.id === props.owner!.id)

  if (ownerIsMember) fetchTeam(members)
  else addOwnerAndTeam(props.owner, members)
}
else persons.value = members

async function fetchTeam(members: Person[]): Promise<void> {
  if (!props.fetchId) persons.value = members

  isFetching.value = true

  try {
    const { created_by, team } = await campaign.getCampaignMinimalById(props.fetchId!)

    if (team && created_by) {
      addOwnerAndTeam(created_by, teamMembersToAvatar(team))
    }
  }
  catch (err: any) {
    console.error(err)
  }
  finally {
    isFetching.value = false
  }
}

function addOwnerAndTeam(profile: MinimalProfile, members: Person[]): void {
  const owner = {
    username: profile.username,
    img: profile.avatar,
    role: 'Owner' as UserRole,
  }

  persons.value = [owner, ...members]
}

function teamMembersToAvatar(members: TeamMember[]): Person[] {
  return members.map(({ user, role }) => ({
    username: user.username,
    img: user.avatar,
    role,
  }))
}
</script>

<template>
  <div class="flex -space-x-2 relative">
    <template v-if="!isFetching">
      <Avatar
        v-for="person in persons.slice(0, max)"
        :key="person.username"
        v-bind="person"
      />
    </template>
    <SkeletonAvatar v-else />
    <tippy
      :delay="0"
      trigger="mouseenter click"
    >
      <div
        v-if="persons.length > max"
        class="size-8 inline-flex items-center justify-center rounded-full ring-2 ring-bg bg-bg-light relative z-[1]"
      >
        +{{ persons?.length - max }}
      </div>

      <template #content>
        <div class="p-2 overflow-auto flex flex-col gap-y-2">
          <div
            v-for="{ username, role } in persons"
            :key="username"
            class="flex gap-2"
          >
            <span class="font-bold">
              {{ username }}
            </span>
            <span v-if="role">
              ({{ $t(`general.roles.${role}.title`) }})
            </span>
          </div>
        </div>
      </template>
    </tippy>
  </div>
</template>
