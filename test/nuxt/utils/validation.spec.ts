import { describe, expect, it } from 'vitest'
import {
  alphaSpaces,
  containsLowercase,
  containsUppercase,
  containsNumber,
  containsSymbol,
  allowedChars,
  diceExpression,
} from '~/utils/validation'

describe('validation utils', () => {
  describe('alphaSpaces', () => {
    it('should match strings with only letters and spaces', () => {
      expect(alphaSpaces.test('John Doe')).toBeTruthy()
      expect(alphaSpaces.test('Jane')).toBeTruthy()
      expect(alphaSpaces.test('John123')).toBeFalsy()
      expect(alphaSpaces.test('John_Doe')).toBeFalsy()
    })

    it('should not allow multiple consecutive spaces', () => {
      expect(alphaSpaces.test('John Doe')).toBeTruthy()
      expect(alphaSpaces.test('John  Doe')).toBeFalsy()
    })

    it('should not allow leading/trailing spaces', () => {
      expect(alphaSpaces.test(' JohnDoe')).toBeFalsy()
      expect(alphaSpaces.test('John Doe ')).toBeFalsy()
    })
  })

  describe('containsLowercase', () => {
    it('should match strings containing at least one lowercase letter', () => {
      expect(containsLowercase.test('Hello')).toBeTruthy()
      expect(containsLowercase.test('hello')).toBeTruthy()
      expect(containsLowercase.test('HELLO')).toBeFalsy()
    })
  })

  describe('containsUppercase', () => {
    it('should match strings containing at least one uppercase letter', () => {
      expect(containsUppercase.test('Hello')).toBeTruthy()
      expect(containsUppercase.test('HELLO')).toBeTruthy()
      expect(containsUppercase.test('hello')).toBeFalsy()
    })
  })

  describe('containsNumber', () => {
    it('should match strings containing at least one number', () => {
      expect(containsNumber.test('Hello1')).toBeTruthy()
      expect(containsNumber.test('Hello')).toBeFalsy()
    })
  })

  describe('containsSymbol', () => {
    it('should match strings containing at least one symbol', () => {
      expect(containsSymbol.test('Hello!')).toBeTruthy()
      expect(containsSymbol.test('Hello')).toBeFalsy()
    })
  })

  describe('allowedChars', () => {
    it('should match strings with only allowed characters', () => {
      expect(allowedChars.test('@#$%^&*(),.?":{}|<>[]\\/~`_+=\';-')).toBeTruthy()
      expect(allowedChars.test('0123456789')).toBeTruthy()
      expect(allowedChars.test('abcdefghijklmnopqrstuvwxyz')).toBeTruthy()
      expect(allowedChars.test('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBeTruthy()
      expect(allowedChars.test('Hello World')).toBeFalsy()
      expect(allowedChars.test(' HelloWorld')).toBeFalsy()
      expect(allowedChars.test('HelloWorld ')).toBeFalsy()
    })
  })

  describe('diceExpression', () => {
    it('should match valid D&D dice notation', () => {
      expect(diceExpression.test('1d4')).toBeTruthy()
      expect(diceExpression.test('1d6')).toBeTruthy()
      expect(diceExpression.test('1d8')).toBeTruthy()
      expect(diceExpression.test('1d10')).toBeTruthy()
      expect(diceExpression.test('1d12')).toBeTruthy()
      expect(diceExpression.test('1d20')).toBeTruthy()
      expect(diceExpression.test('1d100')).toBeTruthy()
    })

    it('should be case insensitive for the d', () => {
      expect(diceExpression.test('1D20')).toBeTruthy()
      expect(diceExpression.test('3d6')).toBeTruthy()
    })

    it('should accept quantities from 1 to 100', () => {
      expect(diceExpression.test('1d20')).toBeTruthy()
      expect(diceExpression.test('25d6')).toBeTruthy()
      expect(diceExpression.test('99d8')).toBeTruthy()
      expect(diceExpression.test('100d4')).toBeTruthy()
    })

    it('should reject invalid quantities', () => {
      expect(diceExpression.test('0d20')).toBeFalsy()
      expect(diceExpression.test('101d6')).toBeFalsy()
      expect(diceExpression.test('999d8')).toBeFalsy()
    })

    it('should reject invalid dice sides', () => {
      expect(diceExpression.test('1d2')).toBeFalsy()
      expect(diceExpression.test('1d3')).toBeFalsy()
      expect(diceExpression.test('1d7')).toBeFalsy()
      expect(diceExpression.test('1d9')).toBeFalsy()
      expect(diceExpression.test('1d15')).toBeFalsy()
      expect(diceExpression.test('1d999')).toBeFalsy()
    })

    it('should reject malformed strings', () => {
      expect(diceExpression.test('d20')).toBeFalsy()
      expect(diceExpression.test('1x20')).toBeFalsy()
      expect(diceExpression.test('1 d20')).toBeFalsy()
      expect(diceExpression.test('1d20 ')).toBeFalsy()
      expect(diceExpression.test(' 1d20')).toBeFalsy()
      expect(diceExpression.test('abc')).toBeFalsy()
      expect(diceExpression.test('')).toBeFalsy()
    })
  })
})
