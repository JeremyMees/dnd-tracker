import { describe, expect, it } from 'vitest'
import {
  alphaSpaces,
  containsLowercase,
  containsUppercase,
  containsNumber,
  containsSymbol,
  allowedChars,
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
})
