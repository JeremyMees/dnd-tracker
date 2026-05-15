import { describe, expect, it } from 'vitest'
import { open5eV2WeaponFixture, open5eV1WeaponFixture } from '~~/test/nuxt/fixtures/open5e'

describe('transformers/weapon', () => {
  describe('toWeapon (V2)', () => {
    it('maps core fields', () => {
      const weapon = toWeapon(open5eV2WeaponFixture)

      expect(weapon.id).toBe('srd-2024_battleaxe')
      expect(weapon.name).toBe('Battleaxe')
      expect(weapon.damageDice).toBe('1d8')
      expect(weapon.damageType).toBe('slashing')
      expect(weapon.distanceUnit).toBe('feet')
      expect(weapon.isSimple).toBeFalsy()
      expect(weapon.isImprovised).toBeFalsy()
    })

    it('maps weapon properties', () => {
      const weapon = toWeapon(open5eV2WeaponFixture)

      expect(weapon.properties.length).toBe(2)
      expect(weapon.properties[0]!.property.name).toBe('Topple')
      expect(weapon.properties[1]!.property.name).toBe('Versatile')
      expect(weapon.properties[1]!.detail).toBe('1d10')
    })
  })

  describe('toWeapon (V1)', () => {
    it('maps core fields using slug as id', () => {
      const weapon = toWeapon(open5eV1WeaponFixture)

      expect(weapon.id).toBe('longsword')
      expect(weapon.name).toBe('Longsword')
      expect(weapon.damageDice).toBe('1d8')
      expect(weapon.damageType).toBe('slashing')
      expect(weapon.distanceUnit).toBe('feet')
    })

    it('maps properties from string array', () => {
      const weapon = toWeapon(open5eV1WeaponFixture)

      expect(weapon.properties.length).toBe(1)
      expect(weapon.properties[0]!.property.name).toBe('Versatile')
      expect(weapon.properties[0]!.property.desc).toBe('')
    })

    it('maps range from string', () => {
      const weapon = toWeapon(open5eV1WeaponFixture)

      expect(weapon.range).toBe(5)
    })
  })
})
