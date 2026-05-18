import prisma from './prisma';

export const SETTING_AGILITY_REGISTRATION_ENABLED = 'agility_registration_enabled';

function parseEnabled(value: string | null | undefined): boolean {
  return value === '1' || value === 'true';
}

export async function getAgilityRegistrationEnabled(): Promise<boolean> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: SETTING_AGILITY_REGISTRATION_ENABLED },
  });
  if (!row) return false;
  return parseEnabled(row.value);
}

export async function setAgilityRegistrationEnabled(enabled: boolean): Promise<void> {
  await prisma.siteSetting.upsert({
    where: { key: SETTING_AGILITY_REGISTRATION_ENABLED },
    create: {
      key: SETTING_AGILITY_REGISTRATION_ENABLED,
      value: enabled ? '1' : '0',
    },
    update: {
      value: enabled ? '1' : '0',
    },
  });
}

export async function getPublicSiteSettings(): Promise<{
  agilityRegistrationEnabled: boolean;
}> {
  const agilityRegistrationEnabled = await getAgilityRegistrationEnabled();
  return { agilityRegistrationEnabled };
}
