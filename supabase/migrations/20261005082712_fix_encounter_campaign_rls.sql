alter policy "encounters_insert_own_or_member" on "public"."initiative_sheets"
  with check (
    (campaign is null and "createdBy" = (select auth.uid()))
    or private.campaign_role(campaign) is not null
  );

alter policy "encounters_update_own_or_member" on "public"."initiative_sheets"
  with check (
    (campaign is null and "createdBy" = (select auth.uid()))
    or private.campaign_role(campaign) is not null
  );
