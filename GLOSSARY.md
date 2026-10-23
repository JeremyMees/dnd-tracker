# D&D Tracker

A combat tracker for Dungeon Masters running D&D 5e fights. The DM runs
encounters, campaigns group the encounters and the people who share them, and
players can follow a fight live from their own phone.

## Encounters

**Encounter**: One fight a DM prepares and runs, made up of rows in initiative
order. _Avoid_: battle, combat, initiative sheet (as a user-facing name)

**Sheet**: The combat state of one encounter: its rows, round, active turn and
settings. _Avoid_: table, tracker

**Row**: One combatant in an encounter, with its own initiative, hit points,
armor class and conditions. _Avoid_: combatant, entry, creature

**Row type**: What a row represents: `player`, `npc`, `monster`, `summon` or
`lair`.

**Lair row**: A row for a lair's own actions. It always acts on initiative 20.

**Summoner**: The row that brought a `summon` row into the encounter.

**Round**: One full pass through every row in initiative order.

**Turn**: One row's moment to act within a round. The row whose turn it is is
the **active row**.

**Initiative modifier**: The bonus added to a d20 roll to get a row's
initiative.

**Hidden row**: A row the Player Portal shows only as an unnamed placeholder
until the DM reveals it.

**Readied action**: An action a row has prepared to use later in the round,
outside its own turn.

**Resources**: A monster's limited-use abilities: legendary actions, uses per
day, and abilities that **recharge** on a dice roll at the start of its turn.

## Hit points and armor

**Base HP / base AC**: A row's normal maximum hit points or armor class, before
any temporary override. _Avoid_: original HP

**Override**: A DM change to a row's maximum HP or AC that can be reset back to
the base value.

**Temp HP / temp AC**: Extra hit points or armor class on top of the current
value. Temp HP is lost first when taking damage.

**Damage defenses**: A row's immunities, resistances and vulnerabilities per
damage type.

**Area damage**: Damage applied to several rows at once, usually with a saving
throw that halves it.

**Downed**: A row at 0 hit points. Downed rows clear their conditions and start
making death saves.

**Death saves**: The three successes and three failures a downed row tracks.

**Concentration**: Whether a row is keeping a spell going. Taking damage calls
for a concentration check.

## Conditions

**Condition**: An SRD status effect on a row, such as Prone or Frightened.

**Duration**: How many rounds a condition lasts, ending at the start or end of a
chosen row's turn. A condition without a duration stays until removed.

**Save-ends**: A condition the affected row can shake off with a saving throw
(ability + DC) at the duration's turn boundary.

**Bloodied**: A condition added automatically while a row has more than 0 and at
most half its maximum hit points.

**Health band**: How the Player Portal shows hit points it may not reveal:
`healthy`, `bloodied` or `critical`. Different from the Bloodied condition.
_Avoid_: health status

## Combat history

**Combat log**: The ordered history of what happened in an encounter. _Avoid_:
history, event log

**Combat event**: One entry in the combat log, such as damage taken, a condition
added or a turn change.

**Combat summary**: The end-of-fight overview, including XP per player for
defeated monsters.

**Challenge rating**: A monster's difficulty rating. XP and encounter difficulty
are derived from it. _Avoid_: CR (in prose)

**Encounter difficulty**: How hard the encounter is for the player rows, from
the monsters' XP.

## Encounter page extras

**Widget**: A panel on the encounter page next to the rows, such as the dice
roller or notes.

**Info pin**: A piece of SRD content (spell, condition, item) pinned to an
encounter for quick reference. _Avoid_: info card

**Playground**: A try-out encounter that runs in the browser without an account
or a saved sheet.

## Campaigns

**Campaign**: A group of encounters, notes and homebrew shared by the people who
run a game together.

**Owner**: The person who created a campaign and pays for its membership.

**Member**: Anyone in a campaign besides the owner, with role **Admin** (can
edit) or **Viewer** (read-only). _Avoid_: team member, player (for a person)

**Suspended member**: A member who keeps their place in a campaign but has no
access while the owner is not on Pro.

**Invite**: A pending request for someone to become a member of a campaign.

**Homebrew**: A custom creature saved to a campaign so it can be added to its
encounters. _Avoid_: custom monster

**Bestiary**: The SRD monsters a DM can add to an encounter.

**Note**: Rich-text campaign notes.

**Pro**: The paid subscription. Free campaigns are owner-only; Pro unlocks
members and the Player Portal.

## Player Portal

**Player Portal**: The live view players open on their own device to follow an
encounter and act on their own row. No account needed. _Avoid_: live view,
player view

**Live session**: A time-limited Player Portal run for one encounter, started by
a DM on Pro.

**Room code**: The six-character code (also in a QR code) players use to join a
live session.

**Seat**: A player's place in a live session, either claiming one `player` or
`npc` row or watching as a **spectator**.

**Own row**: The row a seat has claimed. Its player sees its real values and can
act on it during its turn.

**End turn**: A player handing the turn to the next row from the Player Portal.

## D&D content

**SRD content**: Spells, monsters, conditions, items, weapons and armor from the
open game licences, served from our own copy. _Avoid_: Open5e content (except
for the upstream sync)

**Document**: One published source of SRD content, such as the 2024 SRD.

**Game system**: The ruleset a document belongs to, such as 5e 2014 or 5e 2024.
