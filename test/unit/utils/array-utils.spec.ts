import { describe, expect, it } from 'vitest'
import {
  randomArrayItem,
  randomArrayItems,
  searchArray,
  shuffleArray,
  splitArray,
  sortArray,
  toggleArray,
} from '~/utils/array-utils'

describe('array-utils', () => {
  describe('randomArrayItem', () => {
    it('should return an item from the array', () => {
      const array = [1, 2, 3, 4, 5]
      const result = randomArrayItem(array)
      expect(array).toContain(result)
    })
  })

  describe('randomArrayItems', () => {
    it('should return the specified number of items', () => {
      const array = [1, 2, 3, 4, 5]
      const result = randomArrayItems(array, 3)

      expect(result.length).toBe(3)
      result.forEach(item => expect(array).toContain(item))
    })

    it('should return all items shuffled when number is greater than array length', () => {
      const array = [1, 2, 3, 4, 5]
      const result = randomArrayItems(array, 10)

      expect(result.length).toBe(array.length)
      expect(result.sort()).toEqual(array.sort())
    })

    it('should use default of 1 item when number is not specified', () => {
      const array = [1, 2, 3, 4, 5]
      const result = randomArrayItems(array)

      expect(result.length).toBe(1)
      expect(array).toContain(result[0])
    })
  })

  describe('searchArray', () => {
    it('should filter array items based on search string', () => {
      const array = [
        { name: 'John Doe', age: 30 },
        { name: 'Jane Doe', age: 25 },
        { name: 'Bob Smith', age: 40 },
      ]
      const result = searchArray(array, 'name', 'doe')

      expect(result.length).toBe(2)
      expect(result).toContainEqual({ name: 'John Doe', age: 30 })
      expect(result).toContainEqual({ name: 'Jane Doe', age: 25 })
    })

    it('should return all items when search string is empty', () => {
      const array = [
        { name: 'John Doe', age: 30 },
        { name: 'Jane Doe', age: 25 },
      ]
      const result = searchArray(array, 'name', '')

      expect(result).toEqual(array)
    })
  })

  describe('shuffleArray', () => {
    it('should return an array with the same items', () => {
      const array = [1, 2, 3, 4, 5]
      const result = shuffleArray([...array])

      expect(result.sort()).toEqual(array.sort())
    })
  })

  describe('splitArray', () => {
    it('should split array into specified number of subarrays', () => {
      const array = [1, 2, 3, 4, 5, 6]
      const result = splitArray(array, 3)

      expect(result.length).toBe(3)
      expect(result[0]).toEqual([1, 4])
      expect(result[1]).toEqual([2, 5])
      expect(result[2]).toEqual([3, 6])
    })
  })

  describe('sortArray', () => {
    it('should sort array by string property', () => {
      const array = [
        { name: 'John', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 40 },
      ]

      const ascResult = sortArray(array, 'name')
      expect(ascResult.map(item => item.name)).toEqual(['Alice', 'Bob', 'John'])

      const descResult = sortArray(array, 'name', false)
      expect(descResult.map(item => item.name)).toEqual(['John', 'Bob', 'Alice'])
    })

    it('should sort array by number property', () => {
      const array = [
        { name: 'John', age: 30 },
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 40 },
      ]

      const ascResult = sortArray(array, 'age')
      expect(ascResult.map(item => item.age)).toEqual([25, 30, 40])

      const descResult = sortArray(array, 'age', false)
      expect(descResult.map(item => item.age)).toEqual([40, 30, 25])
    })
  })

  describe('toggleArray', () => {
    it('should add item to array if not present', () => {
      const item = { id: 3, name: 'Item 3' }
      const selected = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]
      const result = toggleArray(item, selected)

      expect(result.length).toBe(3)
      expect(result).toContainEqual(item)
    })

    it('should remove item from array if already present', () => {
      const item = { id: 2, name: 'Item 2' }
      const selected = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]
      const result = toggleArray(item, selected)

      expect(result.length).toBe(1)
      expect(result).not.toContainEqual(item)
    })
  })
})
