# Campaign members need a Pro owner and are suspended, not removed

Free campaigns are owner-only. Inviting or accepting a member needs a Pro owner
(403 `membersRequirePro`). When the owner's Pro ends, members keep their `team`
row but lose all access until renewal, so nothing has to be rebuilt when the
owner renews. The rule is enforced centrally: `private.campaign_role()` returns
no role for non-owners while the owner isn't Pro, and `requireCampaignAccess()`
and the `campaign-member` middleware mirror it.
